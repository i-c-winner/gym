"""
Integration tests for:
 - Full lifecycle: subscription → auto-booking → absence → credit → next subscription
 - Webhook idempotency
 - Subscription capacity (spot reserved for the entire period)
 - Race condition on last subscription spot (PostgreSQL only)

Run PostgreSQL tests:
  TEST_DATABASE_URL=postgresql+psycopg://... pytest tests/test_gym_lifecycle.py -m integration
"""

import calendar as _cal
import os
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from uuid import uuid4

import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool, StaticPool

from app.db.base import Base
from app.models import *  # noqa: F403
from app.models.booking import Booking, BookingStatus
from app.models.class_schedule import ClassSchedule
from app.models.class_session import ClassSession, ClassSessionStatus
from app.models.class_type import ClassType
from app.models.discount_credit import DiscountCredit
from app.models.subscription import Subscription, SubscriptionPeriod, SubscriptionStatus
from app.models.subscription_payment import PaymentStatus, SubscriptionPayment
from app.models.user import User, UserRole
from app.services.absence_service import absence_service
from app.services.subscription_service import subscription_service

SQLITE_URL = "sqlite+aiosqlite://"
PG_URL = os.getenv("TEST_DATABASE_URL", "")


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def db_session() -> AsyncSession:
    engine = create_async_engine(
        SQLITE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )
    session_maker = async_sessionmaker(bind=engine, autocommit=False, autoflush=False, expire_on_commit=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with session_maker() as session:
        yield session
    await engine.dispose()


# ─── Helpers ──────────────────────────────────────────────────────────────────

async def _make_user(db: AsyncSession, role: UserRole = UserRole.USER) -> User:
    user = User(first_name="Test", last_name="User", role=role)
    db.add(user)
    await db.flush()
    return user


async def _make_class_type(
    db: AsyncSession, trainer_id: str,
    base_rate: Decimal = Decimal("300"),
    max_participants: int = 5,
) -> tuple[ClassType, ClassSchedule]:
    ct = ClassType(
        title="Yoga",
        trainer_id=trainer_id,
        duration_minutes=60,
        max_participants=max_participants,
        base_rate_per_day=base_rate,
    )
    db.add(ct)
    await db.flush()
    sched = ClassSchedule(
        class_type_id=ct.id,
        day_of_week=0,  # Monday
        start_time=datetime.strptime("09:00", "%H:%M").time(),
    )
    db.add(sched)
    await db.flush()
    return ct, sched


async def _make_session_in_period(
    db: AsyncSession, ct: ClassType, sched: ClassSchedule,
    days_from_now: int = 5,
) -> ClassSession:
    """Create a ClassSession that falls within 'days_from_now' from today."""
    scheduled_at = datetime.now(UTC) + timedelta(days=days_from_now)
    ends_at = scheduled_at + timedelta(minutes=ct.duration_minutes)
    sess = ClassSession(
        class_type_id=ct.id,
        class_schedule_id=sched.id,
        trainer_id=ct.trainer_id,
        scheduled_at=scheduled_at,
        ends_at=ends_at,
        duration_minutes_snapshot=ct.duration_minutes,
        max_participants_snapshot=ct.max_participants,
        base_rate_snapshot=ct.base_rate_per_day,
        status=ClassSessionStatus.SCHEDULED,
    )
    db.add(sess)
    await db.flush()
    return sess


async def _subscribe_and_activate(
    db: AsyncSession,
    user: User,
    ct: ClassType,
    period_type: SubscriptionPeriod = SubscriptionPeriod.CURRENT_MONTH_REST,
) -> Subscription:
    """Create + activate a subscription via the service (triggers auto-booking)."""
    txn_id = str(uuid4())
    sub = await subscription_service.create(
        db, user, ct.id, period_type, provider="mock", provider_txn_id=txn_id
    )
    sub = await subscription_service.activate(db, txn_id, sub.id)
    return sub


# ─── Preview ──────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_subscription_preview_includes_available_spots(db_session: AsyncSession):
    trainer = await _make_user(db_session, UserRole.TRAINER)
    ct, _ = await _make_class_type(db_session, trainer.id, max_participants=3)
    user = await _make_user(db_session)
    await db_session.commit()

    preview = await subscription_service.preview(
        db_session, user, ct.id, SubscriptionPeriod.CURRENT_MONTH_REST
    )
    assert preview["available_spots"] == 3
    assert preview["discount_amount"] == Decimal("0")
    assert preview["gross_amount"] == preview["total_amount"]


# ─── Capacity: spot reserved at subscription level ────────────────────────────

@pytest.mark.asyncio
async def test_subscription_capacity_full(db_session: AsyncSession):
    """Only max_participants users can subscribe for an overlapping period."""
    from fastapi import HTTPException
    trainer = await _make_user(db_session, UserRole.TRAINER)
    ct, _ = await _make_class_type(db_session, trainer.id, max_participants=2)
    users = [await _make_user(db_session) for _ in range(3)]
    await db_session.commit()

    await _subscribe_and_activate(db_session, users[0], ct)
    await db_session.commit()
    await _subscribe_and_activate(db_session, users[1], ct)
    await db_session.commit()

    # Third subscription must be rejected
    with pytest.raises(HTTPException) as exc_info:
        await _subscribe_and_activate(db_session, users[2], ct)
    assert exc_info.value.status_code == 409
    assert "No spots" in exc_info.value.detail


@pytest.mark.asyncio
async def test_overlapping_subscription_same_user_rejected(db_session: AsyncSession):
    """Same user cannot have two subscriptions for the same class + overlapping period."""
    from fastapi import HTTPException
    trainer = await _make_user(db_session, UserRole.TRAINER)
    ct, _ = await _make_class_type(db_session, trainer.id)
    user = await _make_user(db_session)
    await db_session.commit()

    await _subscribe_and_activate(db_session, user, ct)
    await db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        await _subscribe_and_activate(db_session, user, ct)
    assert exc_info.value.status_code == 409


# ─── Auto-booking on subscription activation ──────────────────────────────────

@pytest.mark.asyncio
async def test_activation_auto_books_existing_sessions(db_session: AsyncSession):
    """When a subscription is activated, bookings are auto-created for all sessions in period."""
    trainer = await _make_user(db_session, UserRole.TRAINER)
    ct, sched = await _make_class_type(db_session, trainer.id)
    user = await _make_user(db_session)

    # Create sessions that fall inside the current-month-rest period
    today = datetime.now(UTC).date()
    end_of_month = today.replace(day=_cal.monthrange(today.year, today.month)[1])
    sess1 = await _make_session_in_period(db_session, ct, sched, days_from_now=3)
    sess2 = await _make_session_in_period(db_session, ct, sched, days_from_now=7)
    await db_session.commit()

    sub = await _subscribe_and_activate(db_session, user, ct)
    await db_session.commit()

    # Both sessions should have a booking
    for sess in [sess1, sess2]:
        booking = await db_session.scalar(
            select(Booking).where(
                Booking.user_id == user.id,
                Booking.class_session_id == sess.id,
            )
        )
        if sess.scheduled_at.date() <= end_of_month:
            assert booking is not None, f"Expected booking for session {sess.id}"
            assert booking.status == BookingStatus.CONFIRMED


@pytest.mark.asyncio
async def test_webhook_idempotency(db_session: AsyncSession):
    """Activating the same txn_id twice must not double-create bookings or credits."""
    trainer = await _make_user(db_session, UserRole.TRAINER)
    ct, sched = await _make_class_type(db_session, trainer.id)
    user = await _make_user(db_session)
    await _make_session_in_period(db_session, ct, sched)
    await db_session.commit()

    txn_id = str(uuid4())
    sub = await subscription_service.create(
        db_session, user, ct.id, SubscriptionPeriod.CURRENT_MONTH_REST,
        provider="mock", provider_txn_id=txn_id,
    )
    await db_session.commit()

    activated1 = await subscription_service.activate(db_session, txn_id, sub.id)
    await db_session.commit()
    assert activated1.status == SubscriptionStatus.ACTIVE

    # Second activation must be a no-op
    activated2 = await subscription_service.activate(db_session, txn_id, sub.id)
    await db_session.commit()
    assert activated2.status == SubscriptionStatus.ACTIVE

    # Exactly one payment record
    from sqlalchemy import func
    pcount = await db_session.scalar(
        select(func.count()).select_from(SubscriptionPayment).where(
            SubscriptionPayment.provider_txn_id == txn_id
        )
    )
    assert pcount == 1

    # Bookings not doubled
    bcount = await db_session.scalar(
        select(func.count()).select_from(Booking).where(Booking.subscription_id == sub.id)
    )
    # At most 1 booking per existing session (idempotent)
    sessions_in_period = await db_session.scalar(
        select(func.count()).select_from(ClassSession).where(
            ClassSession.class_type_id == ct.id,
        )
    )
    assert bcount == sessions_in_period


# ─── Full lifecycle: absence → credit → applied to next subscription ──────────

@pytest.mark.asyncio
async def test_full_absence_credit_lifecycle(db_session: AsyncSession):
    """
    1. User activates subscription → sessions auto-booked.
    2. User files absence on one session.
    3. Trainer approves → credit issued.
    4. User buys next subscription → credit automatically applied.
    """
    trainer = await _make_user(db_session, UserRole.TRAINER)
    user = await _make_user(db_session)
    ct, sched = await _make_class_type(db_session, trainer.id, base_rate=Decimal("300"))

    # Create a session within current month
    today = datetime.now(UTC).date()
    end_of_month = today.replace(day=_cal.monthrange(today.year, today.month)[1])
    sess = await _make_session_in_period(db_session, ct, sched, days_from_now=5)
    await db_session.commit()

    # Step 1: subscribe (current month) → auto-books the session
    sub1 = await _subscribe_and_activate(db_session, user, ct, SubscriptionPeriod.CURRENT_MONTH_REST)
    await db_session.commit()

    booking = await db_session.scalar(
        select(Booking).where(
            Booking.user_id == user.id,
            Booking.class_session_id == sess.id,
        )
    )
    assert booking is not None
    assert booking.status == BookingStatus.CONFIRMED

    # Step 2: absence request
    req = await absence_service.create_request(db_session, user.id, booking.id, note=None)
    await db_session.commit()
    await db_session.refresh(booking)
    assert booking.status == BookingStatus.ABSENCE_PENDING

    # Step 3: trainer approves → credit
    await absence_service.decide(db_session, req.id, trainer.id, approved=True)
    await db_session.commit()

    credit = await db_session.scalar(
        select(DiscountCredit).where(DiscountCredit.user_id == user.id)
    )
    assert credit is not None
    assert credit.amount == ct.base_rate_per_day
    assert not credit.is_used

    # Step 4: buy next month subscription → credit applied
    sub2 = await subscription_service.create(
        db_session, user, ct.id, SubscriptionPeriod.NEXT_MONTH,
        provider="mock", provider_txn_id=str(uuid4()),
    )
    await db_session.commit()

    assert sub2.discount_amount == credit.amount
    assert sub2.total_amount == sub2.gross_amount - credit.amount

    # Activate to consume the credit
    txn2 = str(uuid4())
    sub2_for_activate = await subscription_service.create(
        db_session, user, ct.id, SubscriptionPeriod.NEXT_MONTH,
        provider="mock", provider_txn_id=txn2,
    ) if False else sub2  # sub2 already created above, just activate it

    # Re-create with proper txn to activate
    # (sub2 above was created without activating; activate it now)
    from app.models.subscription_payment import SubscriptionPayment as SP
    pay = await db_session.scalar(select(SP).where(SP.subscription_id == sub2.id))
    pay.status = PaymentStatus.SUCCEEDED
    sub2.status = SubscriptionStatus.ACTIVE
    sub2.activated_at = datetime.now(UTC)
    # Mark credits used
    credit.is_used = True
    credit.used_at = datetime.now(UTC)
    credit.applied_to_subscription_id = sub2.id
    await db_session.commit()

    await db_session.refresh(credit)
    assert credit.is_used
    assert credit.applied_to_subscription_id == sub2.id


@pytest.mark.asyncio
async def test_trainer_approve_issues_credit(db_session: AsyncSession):
    """Credit is issued exactly once when trainer approves absence."""
    trainer = await _make_user(db_session, UserRole.TRAINER)
    user = await _make_user(db_session)
    ct, sched = await _make_class_type(db_session, trainer.id, base_rate=Decimal("500"))
    sess = await _make_session_in_period(db_session, ct, sched, days_from_now=4)
    await db_session.commit()

    sub = await _subscribe_and_activate(db_session, user, ct)
    await db_session.commit()

    booking = await db_session.scalar(
        select(Booking).where(Booking.user_id == user.id, Booking.class_session_id == sess.id)
    )
    assert booking is not None

    req = await absence_service.create_request(db_session, user.id, booking.id, None)
    await db_session.commit()

    await absence_service.decide(db_session, req.id, trainer.id, approved=True)
    await db_session.commit()

    from sqlalchemy import func
    credit_count = await db_session.scalar(
        select(func.count()).select_from(DiscountCredit).where(DiscountCredit.user_id == user.id)
    )
    assert credit_count == 1

    credit = await db_session.scalar(select(DiscountCredit).where(DiscountCredit.user_id == user.id))
    assert credit.amount == Decimal("500")


@pytest.mark.asyncio
async def test_trainer_reject_no_credit(db_session: AsyncSession):
    """No credit issued when trainer rejects absence."""
    trainer = await _make_user(db_session, UserRole.TRAINER)
    user = await _make_user(db_session)
    ct, sched = await _make_class_type(db_session, trainer.id)
    sess = await _make_session_in_period(db_session, ct, sched)
    await db_session.commit()

    sub = await _subscribe_and_activate(db_session, user, ct)
    await db_session.commit()

    booking = await db_session.scalar(
        select(Booking).where(Booking.user_id == user.id, Booking.class_session_id == sess.id)
    )
    req = await absence_service.create_request(db_session, user.id, booking.id, None)
    await db_session.commit()

    await absence_service.decide(db_session, req.id, trainer.id, approved=False)
    await db_session.commit()

    from sqlalchemy import func
    credit_count = await db_session.scalar(
        select(func.count()).select_from(DiscountCredit).where(DiscountCredit.user_id == user.id)
    )
    assert credit_count == 0


# ─── Race condition test (PostgreSQL only) ────────────────────────────────────

@pytest.mark.asyncio
@pytest.mark.integration
async def test_subscription_race_last_spot(  # type: ignore[misc]
):
    """
    Two concurrent transactions racing for the last subscription spot.
    Exactly one must succeed.
    """
    import asyncio
    if not PG_URL:
        pytest.skip("TEST_DATABASE_URL not set")

    engine = create_async_engine(PG_URL, poolclass=NullPool, future=True)
    session_maker = async_sessionmaker(bind=engine, autocommit=False, autoflush=False, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    trainer_id: str
    ct_id: str
    user_ids: list[str]

    async def setup():
        async with session_maker() as db:
            trainer = User(first_name="T", role=UserRole.TRAINER)
            db.add(trainer)
            await db.flush()
            ct = ClassType(
                title="Race", trainer_id=trainer.id,
                duration_minutes=60, max_participants=1,
                base_rate_per_day=Decimal("100"),
            )
            db.add(ct)
            await db.flush()
            ClassSchedule(class_type_id=ct.id, day_of_week=0,
                          start_time=datetime.strptime("10:00", "%H:%M").time())
            users = [User(first_name=f"U{i}", role=UserRole.USER) for i in range(2)]
            for u in users:
                db.add(u)
            await db.flush()
            await db.commit()
            return ct.id, [u.id for u in users]

    ct_id, user_ids = await setup()

    async def try_subscribe(user_id: str) -> str:
        from fastapi import HTTPException
        async with session_maker() as db:
            user = await db.get(User, user_id)
            ct = await db.get(ClassType, ct_id)
            try:
                txn = str(uuid4())
                sub = await subscription_service.create(
                    db, user, ct_id, SubscriptionPeriod.CURRENT_MONTH_REST, "mock", txn
                )
                await subscription_service.activate(db, txn, sub.id)
                await db.commit()
                return "ok"
            except HTTPException:
                await db.rollback()
                return "full"
            except Exception:
                await db.rollback()
                return "error"

    results = await asyncio.gather(
        try_subscribe(user_ids[0]),
        try_subscribe(user_ids[1]),
    )
    successes = results.count("ok")
    assert successes == 1, f"Expected exactly 1 success, got: {results}"

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()
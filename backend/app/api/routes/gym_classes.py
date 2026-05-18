from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.booking import Booking, BookingStatus
from app.models.class_session import ClassSession, ClassSessionStatus
from app.models.discount_credit import DiscountCredit
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.subscription_payment import PaymentStatus, SubscriptionPayment
from app.models.user import User
from app.schemas.absence_request import AbsenceRequestCreateIn, AbsenceRequestOut
from app.schemas.booking import BookingOut
from app.schemas.class_session import ClassSessionOut
from app.schemas.class_type import ClassTypeOut
from app.schemas.discount_credit import DiscountCreditOut
from app.schemas.subscription import (
    PaymentWebhookIn,
    SubscriptionCreateIn,
    SubscriptionOut,
    SubscriptionPreviewIn,
    SubscriptionPreviewOut,
)
from app.services.absence_service import absence_service
from app.services.class_type_service import class_type_service
from app.services.subscription_service import subscription_service

router = APIRouter(prefix="/gym", tags=["gym"])


# ── Class Types catalog ───────────────────────────────────────────────────────

@router.get("/class-types", response_model=list[ClassTypeOut])
async def list_class_types(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[ClassTypeOut]:
    items = await class_type_service.get_all(db, include_inactive=False)
    return [ClassTypeOut.model_validate(ct) for ct in items]


@router.get("/class-types/{class_type_id}", response_model=ClassTypeOut)
async def get_class_type(
    class_type_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ClassTypeOut:
    ct = await class_type_service.get_by_id(db, class_type_id)
    if not ct or not ct.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ClassType not found")
    return ClassTypeOut.model_validate(ct)


# ── Subscriptions ─────────────────────────────────────────────────────────────

@router.post("/subscriptions/preview", response_model=SubscriptionPreviewOut)
async def preview_subscription(
    payload: SubscriptionPreviewIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SubscriptionPreviewOut:
    data = await subscription_service.preview(db, user, payload.class_type_id, payload.period_type)
    return SubscriptionPreviewOut(**data)


@router.post("/subscriptions", response_model=SubscriptionOut, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    payload: SubscriptionCreateIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SubscriptionOut:
    sub = await subscription_service.create(
        db, user, payload.class_type_id, payload.period_type,
        payload.provider, payload.provider_txn_id,
    )
    await db.commit()
    return SubscriptionOut.model_validate(sub)


@router.get("/subscriptions", response_model=list[SubscriptionOut])
async def list_subscriptions(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[SubscriptionOut]:
    subs = await subscription_service.list_user_subscriptions(db, user.id)
    return [SubscriptionOut.model_validate(s) for s in subs]


@router.post("/payments/webhook")
async def payment_webhook(
    payload: PaymentWebhookIn,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Idempotent payment webhook. Activates subscription and auto-creates bookings."""
    if payload.status == "succeeded":
        sub = await subscription_service.activate(db, payload.provider_txn_id, payload.subscription_id)
        await db.commit()
        return {"subscription_id": sub.id, "status": sub.status}
    elif payload.status == "failed":
        payment = await db.scalar(
            select(SubscriptionPayment).where(
                SubscriptionPayment.provider_txn_id == payload.provider_txn_id
            )
        )
        if payment and payment.status == PaymentStatus.PENDING:
            payment.status = PaymentStatus.FAILED
            sub = await db.get(Subscription, payload.subscription_id)
            if sub and sub.status == SubscriptionStatus.PENDING_PAYMENT:
                sub.status = SubscriptionStatus.CANCELLED
            await db.commit()
        return {"status": "failed"}
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown payment status")


# ── Sessions for a subscription (read-only) ───────────────────────────────────

@router.get("/subscriptions/{subscription_id}/sessions", response_model=list[ClassSessionOut])
async def list_subscription_sessions(
    subscription_id: str,
    upcoming_only: bool = True,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[ClassSessionOut]:
    """List all sessions the user is booked into for this subscription."""
    sub = await db.get(Subscription, subscription_id)
    if not sub or sub.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
    if sub.status not in (SubscriptionStatus.ACTIVE, SubscriptionStatus.EXPIRED):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subscription not active")

    q = (
        select(ClassSession)
        .join(Booking, Booking.class_session_id == ClassSession.id)
        .where(
            Booking.user_id == user.id,
            Booking.subscription_id == subscription_id,
        )
        .order_by(ClassSession.scheduled_at)
    )
    if upcoming_only:
        q = q.where(ClassSession.scheduled_at >= datetime.now(UTC))

    result = await db.execute(q)
    sessions = result.scalars().all()

    output = []
    for sess in sessions:
        booking = await db.scalar(
            select(Booking).where(
                Booking.class_session_id == sess.id,
                Booking.user_id == user.id,
            )
        )
        # Count subscribers (= confirmed bookings) as proxy for "occupied spots"
        confirmed = await db.scalar(
            select(func.count()).select_from(Booking).where(
                Booking.class_session_id == sess.id,
                Booking.status == BookingStatus.CONFIRMED,
            )
        )
        s_out = ClassSessionOut.model_validate(sess)
        s_out.available_spots = max(0, sess.max_participants_snapshot - (confirmed or 0))
        output.append(s_out)
    return output


# ── Bookings (list + absence request only; no manual create) ──────────────────

@router.get("/bookings", response_model=list[BookingOut])
async def list_bookings(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[BookingOut]:
    result = await db.execute(
        select(Booking)
        .where(Booking.user_id == user.id)
        .order_by(Booking.created_at.desc())
    )
    return [BookingOut.model_validate(b) for b in result.scalars()]


# ── Credits ───────────────────────────────────────────────────────────────────

@router.get("/credits", response_model=list[DiscountCreditOut])
async def list_credits(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[DiscountCreditOut]:
    result = await db.execute(
        select(DiscountCredit).where(DiscountCredit.user_id == user.id).order_by(DiscountCredit.created_at.desc())
    )
    return [DiscountCreditOut.model_validate(c) for c in result.scalars()]


# ── Absence requests ──────────────────────────────────────────────────────────

@router.post("/absence-requests", response_model=AbsenceRequestOut, status_code=status.HTTP_201_CREATED)
async def create_absence_request(
    payload: AbsenceRequestCreateIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AbsenceRequestOut:
    req = await absence_service.create_request(db, user.id, payload.booking_id, payload.note)
    await db.commit()
    return AbsenceRequestOut.model_validate(req)


@router.get("/absence-requests", response_model=list[AbsenceRequestOut])
async def list_absence_requests(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[AbsenceRequestOut]:
    reqs = await absence_service.list_user_requests(db, user.id)
    return [AbsenceRequestOut.model_validate(r) for r in reqs]


# ── User schedule (bookings + session details for calendar) ──────────────────

@router.get("/schedule")
async def get_user_schedule(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    """Return all bookings with full session and class type details for calendar display."""
    from app.models.class_type import ClassType

    result = await db.execute(
        select(Booking, ClassSession, ClassType)
        .join(ClassSession, ClassSession.id == Booking.class_session_id)
        .join(ClassType, ClassType.id == ClassSession.class_type_id)
        .where(Booking.user_id == user.id)
        .order_by(ClassSession.scheduled_at)
    )
    rows = result.all()

    events = []
    for booking, session, ct in rows:
        events.append({
            "booking_id": str(booking.id),
            "booking_status": booking.status,
            "session_id": str(session.id),
            "scheduled_at": session.scheduled_at.isoformat(),
            "ends_at": session.ends_at.isoformat(),
            "class_type_title": ct.title,
            "class_type_description": ct.description,
            "duration_minutes": session.duration_minutes_snapshot,
            "max_participants": session.max_participants_snapshot,
            "subscription_id": str(booking.subscription_id),
        })
    return events
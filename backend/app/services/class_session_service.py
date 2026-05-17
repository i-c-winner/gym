from datetime import UTC, date, datetime, timedelta

import pytz
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.booking import Booking, BookingStatus
from app.models.class_schedule import ClassSchedule
from app.models.class_session import ClassSession, ClassSessionStatus
from app.models.class_type import ClassType
from app.models.subscription import Subscription, SubscriptionStatus


def _session_datetime(d: date, sched: ClassSchedule, tz: pytz.BaseTzInfo) -> datetime:
    naive = datetime.combine(d, sched.start_time)
    local = tz.localize(naive)
    return local.astimezone(UTC)


class ClassSessionService:
    async def materialize(
        self,
        db: AsyncSession,
        horizon_weeks: int | None = None,
    ) -> int:
        tz = pytz.timezone(settings.club_timezone)
        weeks = horizon_weeks or settings.session_generation_horizon_weeks
        today = datetime.now(UTC).date()
        horizon = today + timedelta(weeks=weeks)

        class_types = await db.execute(
            select(ClassType)
            .options(selectinload(ClassType.schedules))
            .where(ClassType.is_active == True)  # noqa: E712
        )
        created = 0
        for ct in class_types.scalars():
            for sched in ct.schedules:
                current = today
                while current <= horizon:
                    if current.weekday() == sched.day_of_week:
                        scheduled_at = _session_datetime(current, sched, tz)
                        ends_at = scheduled_at + timedelta(minutes=ct.duration_minutes)

                        exists = await db.scalar(
                            select(ClassSession).where(
                                ClassSession.class_schedule_id == sched.id,
                                ClassSession.scheduled_at == scheduled_at,
                            )
                        )
                        if not exists:
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
                            # Auto-book for all active subscribers covering this date
                            await self._book_for_active_subscribers(db, sess, current)
                            created += 1
                    current += timedelta(days=1)
        return created

    async def _book_for_active_subscribers(
        self, db: AsyncSession, sess: ClassSession, session_date: date
    ) -> None:
        """Create bookings for every active subscription covering session_date."""
        subs_result = await db.execute(
            select(Subscription).where(
                Subscription.class_type_id == sess.class_type_id,
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.period_start <= session_date,
                Subscription.period_end >= session_date,
            )
        )
        for sub in subs_result.scalars():
            existing = await db.scalar(
                select(Booking).where(
                    Booking.user_id == sub.user_id,
                    Booking.class_session_id == sess.id,
                )
            )
            if not existing:
                db.add(Booking(
                    user_id=sub.user_id,
                    class_session_id=sess.id,
                    subscription_id=sub.id,
                    status=BookingStatus.CONFIRMED,
                ))

    async def list_upcoming(
        self,
        db: AsyncSession,
        *,
        trainer_id: str | None = None,
        class_type_id: str | None = None,
        from_dt: datetime | None = None,
        to_dt: datetime | None = None,
    ) -> list[ClassSession]:
        now = datetime.now(UTC)
        q = (
            select(ClassSession)
            .options(selectinload(ClassSession.class_type), selectinload(ClassSession.bookings))
            .where(ClassSession.scheduled_at >= (from_dt or now))
            .where(ClassSession.status == ClassSessionStatus.SCHEDULED)
        )
        if trainer_id:
            q = q.where(ClassSession.trainer_id == trainer_id)
        if class_type_id:
            q = q.where(ClassSession.class_type_id == class_type_id)
        if to_dt:
            q = q.where(ClassSession.scheduled_at <= to_dt)
        result = await db.execute(q.order_by(ClassSession.scheduled_at))
        return list(result.scalars())

    async def list_past_for_trainer(self, db: AsyncSession, trainer_id: str) -> list[ClassSession]:
        now = datetime.now(UTC)
        result = await db.execute(
            select(ClassSession)
            .where(ClassSession.trainer_id == trainer_id, ClassSession.ends_at <= now)
            .order_by(ClassSession.scheduled_at.desc())
        )
        return list(result.scalars())


class_session_service = ClassSessionService()
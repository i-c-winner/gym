from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.booking import Booking, BookingStatus
from app.models.class_session import ClassSession, ClassSessionStatus
from app.models.subscription import Subscription, SubscriptionStatus
from app.services.audit_log_service import audit_log_service


class BookingService:
    async def create(
        self,
        db: AsyncSession,
        user_id: str,
        class_session_id: str,
        subscription_id: str,
    ) -> Booking:
        # Validate subscription belongs to user and is active
        sub = await db.get(Subscription, subscription_id)
        if not sub or sub.user_id != user_id or sub.status != SubscriptionStatus.ACTIVE:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subscription not active or not yours")

        # Lock the session row to serialize concurrent bookings
        sess = await db.scalar(
            select(ClassSession)
            .where(ClassSession.id == class_session_id)
            .with_for_update()
        )
        if not sess:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ClassSession not found")
        if sess.status != ClassSessionStatus.SCHEDULED:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Session is not open for booking")
        if sess.class_type_id != sub.class_type_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session does not match subscription class type")

        # Validate session is within subscription period
        session_date = sess.scheduled_at.astimezone(UTC).date()
        if not (sub.period_start <= session_date <= sub.period_end):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session date is outside subscription period")

        # Check capacity (count only CONFIRMED bookings; absence_pending has freed the spot)
        confirmed_count = await db.scalar(
            select(func.count()).select_from(Booking).where(
                Booking.class_session_id == class_session_id,
                Booking.status == BookingStatus.CONFIRMED,
            )
        )
        if confirmed_count >= sess.max_participants_snapshot:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Session is full")

        booking = Booking(
            user_id=user_id,
            class_session_id=class_session_id,
            subscription_id=subscription_id,
            status=BookingStatus.CONFIRMED,
        )
        db.add(booking)
        try:
            await db.flush()
        except IntegrityError:
            await db.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already booked for this session")

        await audit_log_service.log(
            db,
            actor_id=user_id,
            actor_role="user",
            action="create_booking",
            entity_type="booking",
            entity_id=booking.id,
            new_value={"class_session_id": class_session_id, "subscription_id": subscription_id},
        )
        return booking

    async def cancel(self, db: AsyncSession, booking_id: str, user_id: str) -> Booking:
        booking = await db.get(Booking, booking_id)
        if not booking or booking.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
        if booking.status not in (BookingStatus.CONFIRMED,):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only confirmed bookings can be cancelled",
            )
        booking.status = BookingStatus.CANCELLED
        return booking

    async def list_for_session(self, db: AsyncSession, class_session_id: str) -> list[Booking]:
        result = await db.execute(
            select(Booking)
            .options(selectinload(Booking.user))
            .where(Booking.class_session_id == class_session_id)
        )
        return list(result.scalars())

    async def mark_attendance(
        self, db: AsyncSession, booking_id: str, attended: bool, trainer_id: str
    ) -> Booking:
        result = await db.execute(
            select(Booking).options(selectinload(Booking.class_session)).where(Booking.id == booking_id)
        )
        booking = result.scalar_one_or_none()
        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
        sess = booking.class_session
        if not sess or sess.trainer_id != trainer_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your session")
        if sess.status != ClassSessionStatus.COMPLETED:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Session not completed yet")
        if booking.status not in (BookingStatus.CONFIRMED, BookingStatus.NO_SHOW):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot mark attendance for this booking status")

        old_status = booking.status
        booking.status = BookingStatus.ATTENDED if attended else BookingStatus.NO_SHOW

        await audit_log_service.log(
            db,
            actor_id=trainer_id,
            actor_role="trainer",
            action="mark_attendance",
            entity_type="booking",
            entity_id=booking_id,
            old_value={"status": old_status},
            new_value={"status": booking.status, "attended": attended},
        )
        return booking

    async def list_user_bookings(self, db: AsyncSession, user_id: str) -> list[Booking]:
        result = await db.execute(
            select(Booking)
            .options(selectinload(Booking.class_session))
            .where(Booking.user_id == user_id)
            .order_by(Booking.created_at.desc())
        )
        return list(result.scalars())


booking_service = BookingService()
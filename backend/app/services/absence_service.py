from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.absence_request import AbsenceRequest, AbsenceRequestStatus
from app.models.booking import Booking, BookingStatus
from app.models.class_session import ClassSession


class AbsenceService:
    async def create_request(
        self,
        db: AsyncSession,
        user_id: str,
        booking_id: str,
        note: str | None,
    ) -> AbsenceRequest:
        result = await db.execute(
            select(Booking)
            .options(selectinload(Booking.class_session), selectinload(Booking.absence_requests))
            .where(Booking.id == booking_id)
        )
        booking = result.scalar_one_or_none()
        if not booking or booking.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
        if booking.status != BookingStatus.CONFIRMED:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only confirmed bookings can have absence requests")
        if booking.absence_requests:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Absence request already exists")

        sess = booking.class_session
        if sess.scheduled_at <= datetime.now(UTC):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot warn about absence after session has started",
            )

        # Booking stays CONFIRMED — the spot is not freed.
        # The warning is only for tracking missed days for future discount calculation.
        req = AbsenceRequest(
            booking_id=booking_id,
            user_id=user_id,
            trainer_id=sess.trainer_id,
            status=AbsenceRequestStatus.PENDING,
            note=note,
        )
        db.add(req)
        await db.flush()
        return req

    async def list_pending_for_trainer(self, db: AsyncSession, trainer_id: str) -> list[AbsenceRequest]:
        result = await db.execute(
            select(AbsenceRequest)
            .options(selectinload(AbsenceRequest.booking).selectinload(Booking.class_session))
            .where(
                AbsenceRequest.trainer_id == trainer_id,
                AbsenceRequest.status == AbsenceRequestStatus.PENDING,
            )
            .order_by(AbsenceRequest.created_at)
        )
        return list(result.scalars())

    async def list_user_requests(self, db: AsyncSession, user_id: str) -> list[AbsenceRequest]:
        result = await db.execute(
            select(AbsenceRequest)
            .where(AbsenceRequest.user_id == user_id)
            .order_by(AbsenceRequest.created_at.desc())
        )
        return list(result.scalars())


absence_service = AbsenceService()
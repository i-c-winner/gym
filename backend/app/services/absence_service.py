from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.absence_request import AbsenceRequest, AbsenceRequestStatus
from app.models.booking import Booking, BookingStatus
from app.models.class_session import ClassSession
from app.models.discount_credit import DiscountCredit
from app.services.audit_log_service import audit_log_service


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
        now = datetime.now(UTC)
        min_before = timedelta(hours=settings.absence_min_hours_before)
        if sess.scheduled_at - now < min_before:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Must request absence at least {settings.absence_min_hours_before}h before session",
            )

        # Free the spot immediately
        booking.status = BookingStatus.ABSENCE_PENDING

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

    async def decide(
        self,
        db: AsyncSession,
        request_id: str,
        trainer_id: str,
        approved: bool,
    ) -> AbsenceRequest:
        result = await db.execute(
            select(AbsenceRequest)
            .options(selectinload(AbsenceRequest.booking).selectinload(Booking.class_session))
            .where(AbsenceRequest.id == request_id)
        )
        req = result.scalar_one_or_none()
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Absence request not found")
        if req.trainer_id != trainer_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your request")
        if req.status != AbsenceRequestStatus.PENDING:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already decided")

        now = datetime.now(UTC)
        req.decided_at = now

        booking = req.booking
        sess = booking.class_session

        if approved:
            req.status = AbsenceRequestStatus.APPROVED
            booking.status = BookingStatus.ABSENT

            # Issue discount credit at the rate snapshot of this session
            from app.models.class_type import ClassType
            ct = await db.get(ClassType, sess.class_type_id)
            credit_amount = ct.base_rate_per_day if ct else sess.base_rate_snapshot

            credit = DiscountCredit(
                user_id=req.user_id,
                class_type_id=sess.class_type_id,
                source_absence_request_id=req.id,
                amount=credit_amount,
                is_used=False,
            )
            db.add(credit)

            await audit_log_service.log(
                db,
                actor_id=trainer_id,
                actor_role="trainer",
                action="approve_absence",
                entity_type="absence_request",
                entity_id=req.id,
                new_value={"credit_amount": str(credit_amount), "user_id": req.user_id},
            )
        else:
            req.status = AbsenceRequestStatus.REJECTED
            # Check if spot is still available; restore booking or mark no-spot
            confirmed_count = await db.scalar(
                select(func.count()).select_from(Booking).where(
                    Booking.class_session_id == sess.id,
                    Booking.status == BookingStatus.CONFIRMED,
                )
            )
            if confirmed_count < sess.max_participants_snapshot:
                booking.status = BookingStatus.CONFIRMED
            else:
                booking.status = BookingStatus.NO_SPOT_AFTER_REJECTION

            await audit_log_service.log(
                db,
                actor_id=trainer_id,
                actor_role="trainer",
                action="reject_absence",
                entity_type="absence_request",
                entity_id=req.id,
                new_value={"booking_status": booking.status},
            )

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
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.subscription_audit_log import AuditAction
from app.models.training_event import TrainingEvent, TrainingEventStatus
from app.models.user import User, UserRole
from app.services.subscription_service import subscription_service


class ScheduleService:
    async def create_event(
        self,
        db: AsyncSession,
        *,
        trainer_id: str,
        resource_id: str | None,
        title: str,
        description: str | None,
        start_at: datetime,
        end_at: datetime,
        max_participants: int | None,
    ) -> TrainingEvent:
        event = TrainingEvent(
            trainer_id=trainer_id,
            resource_id=resource_id,
            title=title,
            description=description,
            start_at=start_at,
            end_at=end_at,
            max_participants=max_participants,
        )
        db.add(event)
        await db.flush()
        return event

    async def update_event(self, db: AsyncSession, event: TrainingEvent, **kwargs: object) -> TrainingEvent:
        if event.status != TrainingEventStatus.SCHEDULED:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only scheduled events can be modified")
        if "start_at" in kwargs or "end_at" in kwargs:
            start = kwargs.get("start_at") or event.start_at
            end = kwargs.get("end_at") or event.end_at
            if end <= start:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="end_at must be after start_at")
        for key, value in kwargs.items():
            setattr(event, key, value)
        return event

    async def cancel_event(self, db: AsyncSession, event: TrainingEvent, actor_id: str) -> TrainingEvent:
        if event.status != TrainingEventStatus.SCHEDULED:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only scheduled events can be cancelled")

        enrollments = list(
            (
                await db.scalars(
                    select(Enrollment)
                    .where(
                        Enrollment.event_id == event.id,
                        Enrollment.status.in_([EnrollmentStatus.ENROLLED, EnrollmentStatus.NOTIFIED_ABSENT]),
                    )
                    .options(selectinload(Enrollment.subscription))
                )
            ).all()
        )

        for enrollment in enrollments:
            enrollment.status = EnrollmentStatus.CANCELLED
            subscription_service.return_class(db, enrollment.subscription, actor_id, enrollment.id)

        event.status = TrainingEventStatus.CANCELLED
        return event

    async def get_events(
        self,
        db: AsyncSession,
        *,
        trainer_id: str | None = None,
        resource_id: str | None = None,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> list[TrainingEvent]:
        query = select(TrainingEvent)
        if trainer_id:
            query = query.where(TrainingEvent.trainer_id == trainer_id)
        if resource_id:
            query = query.where(TrainingEvent.resource_id == resource_id)
        if start:
            query = query.where(TrainingEvent.start_at >= start)
        if end:
            query = query.where(TrainingEvent.start_at <= end)
        return list((await db.scalars(query.order_by(TrainingEvent.start_at.asc()))).all())

    async def get_event_or_404(self, db: AsyncSession, event_id: str) -> TrainingEvent:
        event = await db.get(TrainingEvent, event_id)
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        return event

    async def get_enrollments(self, db: AsyncSession, event_id: str) -> list[Enrollment]:
        return list((await db.scalars(select(Enrollment).where(Enrollment.event_id == event_id))).all())

    async def get_user_enrollments(self, db: AsyncSession, user_id: str) -> list[Enrollment]:
        return list(
            (
                await db.scalars(
                    select(Enrollment)
                    .where(Enrollment.user_id == user_id)
                    .options(selectinload(Enrollment.event))
                    .order_by(Enrollment.created_at.asc())
                )
            ).all()
        )

    async def auto_enroll_subscription(
        self,
        db: AsyncSession,
        subscription: "Subscription",  # type: ignore[name-defined]
    ) -> list[Enrollment]:
        from app.models.subscription import Subscription

        now = datetime.now(UTC)
        to_enroll = subscription.classes_remaining

        upcoming = list(
            (
                await db.scalars(
                    select(TrainingEvent)
                    .where(
                        TrainingEvent.resource_id == subscription.resource_id,
                        TrainingEvent.status == TrainingEventStatus.SCHEDULED,
                        TrainingEvent.start_at > now,
                    )
                    .order_by(TrainingEvent.start_at.asc())
                    .limit(to_enroll)
                )
            ).all()
        )

        enrollments: list[Enrollment] = []
        for event in upcoming:
            if event.max_participants is not None:
                count = await db.scalar(
                    select(func.count(Enrollment.id)).where(
                        Enrollment.event_id == event.id,
                        Enrollment.status.in_([EnrollmentStatus.ENROLLED, EnrollmentStatus.NOTIFIED_ABSENT]),
                    )
                )
                if (count or 0) >= event.max_participants:
                    continue

            existing = await db.scalar(
                select(Enrollment).where(
                    Enrollment.user_id == subscription.user_id,
                    Enrollment.event_id == event.id,
                )
            )
            if existing:
                continue

            enrollment = Enrollment(
                user_id=subscription.user_id,
                event_id=event.id,
                subscription_id=subscription.id,
                status=EnrollmentStatus.ENROLLED,
            )
            db.add(enrollment)
            await db.flush()
            subscription_service.deduct_class(db, subscription, subscription.user_id, enrollment.id)
            enrollments.append(enrollment)

        return enrollments

    async def enroll(self, db: AsyncSession, user: User, event: TrainingEvent) -> Enrollment:
        now = datetime.now(UTC)
        if event.status != TrainingEventStatus.SCHEDULED:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Event is not open for enrollment")
        if event.start_at <= now:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Event has already started")
        if event.resource_id is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Event has no resource assigned")

        if event.max_participants is not None:
            count = await db.scalar(
                select(func.count(Enrollment.id)).where(
                    Enrollment.event_id == event.id,
                    Enrollment.status.in_([EnrollmentStatus.ENROLLED, EnrollmentStatus.NOTIFIED_ABSENT]),
                )
            )
            if (count or 0) >= event.max_participants:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Event is full")

        existing = await db.scalar(
            select(Enrollment).where(Enrollment.user_id == user.id, Enrollment.event_id == event.id)
        )
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already enrolled")

        sub = await subscription_service.get_active_for_resource(db, user.id, event.resource_id)
        if not sub:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No active subscription for this resource")

        enrollment = Enrollment(user_id=user.id, event_id=event.id, subscription_id=sub.id)
        db.add(enrollment)
        await db.flush()

        subscription_service.deduct_class(db, sub, user.id, enrollment.id)
        return enrollment

    async def cancel_enrollment(self, db: AsyncSession, user: User, event: TrainingEvent) -> None:
        now = datetime.now(UTC)
        enrollment = await db.scalar(
            select(Enrollment)
            .where(Enrollment.user_id == user.id, Enrollment.event_id == event.id)
            .options(selectinload(Enrollment.subscription))
        )
        if not enrollment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
        if enrollment.status != EnrollmentStatus.ENROLLED:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot cancel this enrollment")
        if event.start_at - now <= timedelta(hours=settings.absence_notice_hours):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cancellation deadline has passed")

        enrollment.status = EnrollmentStatus.CANCELLED
        subscription_service.return_class(db, enrollment.subscription, user.id, enrollment.id)

    async def notify_absence(self, db: AsyncSession, user: User, event: TrainingEvent) -> Enrollment:
        now = datetime.now(UTC)
        enrollment = await db.scalar(
            select(Enrollment).where(Enrollment.user_id == user.id, Enrollment.event_id == event.id)
        )
        if not enrollment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
        if enrollment.status != EnrollmentStatus.ENROLLED:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot notify absence for this enrollment")
        if event.start_at - now <= timedelta(hours=settings.absence_notice_hours):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Absence notification deadline has passed")

        enrollment.status = EnrollmentStatus.NOTIFIED_ABSENT
        enrollment.notified_at = now

        from app.models.subscription import Subscription
        sub = await db.get(Subscription, enrollment.subscription_id)
        if sub:
            subscription_service.write_log(
                db,
                subscription=sub,
                actor_id=user.id,
                enrollment_id=enrollment.id,
                action=AuditAction.NOTIFIED,
                classes_before=sub.classes_remaining,
                extensions_before=sub.extensions_used,
            )
        return enrollment

    async def confirm_attendance(
        self,
        db: AsyncSession,
        trainer: User,
        event: TrainingEvent,
        attendances: list[dict],
    ) -> list[Enrollment]:
        now = datetime.now(UTC)
        if event.status != TrainingEventStatus.SCHEDULED:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Event is not in scheduled state")
        if event.end_at > now:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Event has not ended yet")
        if trainer.role != UserRole.ADMIN and event.trainer_id != trainer.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your event")

        results: list[Enrollment] = []
        for item in attendances:
            enrollment = await db.scalar(
                select(Enrollment)
                .where(Enrollment.id == item["enrollment_id"], Enrollment.event_id == event.id)
                .options(selectinload(Enrollment.subscription))
            )
            if not enrollment:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Enrollment {item['enrollment_id']} not found")
            if enrollment.status not in (EnrollmentStatus.ENROLLED, EnrollmentStatus.NOTIFIED_ABSENT):
                results.append(enrollment)
                continue

            enrollment.confirmed_at = now
            sub = enrollment.subscription

            if item["attended"]:
                enrollment.status = EnrollmentStatus.ATTENDED
                subscription_service.write_log(
                    db,
                    subscription=sub,
                    actor_id=trainer.id,
                    enrollment_id=enrollment.id,
                    action=AuditAction.CONFIRMED_ATTENDED,
                    classes_before=sub.classes_remaining,
                    extensions_before=sub.extensions_used,
                )
            elif enrollment.notified_at is not None:
                extended = subscription_service.try_extend(db, sub, enrollment, trainer.id)
                enrollment.status = EnrollmentStatus.ABSENT_EXTENDED if extended else EnrollmentStatus.MISSED
                if not extended:
                    subscription_service.write_log(
                        db,
                        subscription=sub,
                        actor_id=trainer.id,
                        enrollment_id=enrollment.id,
                        action=AuditAction.CONFIRMED_ABSENT,
                        classes_before=sub.classes_remaining,
                        extensions_before=sub.extensions_used,
                        note="extension limit reached",
                    )
            else:
                enrollment.status = EnrollmentStatus.MISSED
                subscription_service.write_log(
                    db,
                    subscription=sub,
                    actor_id=trainer.id,
                    enrollment_id=enrollment.id,
                    action=AuditAction.CONFIRMED_ABSENT,
                    classes_before=sub.classes_remaining,
                    extensions_before=sub.extensions_used,
                    note="no prior notification",
                )

            results.append(enrollment)

        event.status = TrainingEventStatus.COMPLETED
        return results


schedule_service = ScheduleService()
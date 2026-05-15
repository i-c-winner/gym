from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import csrf_protect, get_current_user, require_admin, require_trainer
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.schedule import (
    AttendanceRequest,
    EnrollmentRead,
    TrainingEventCreate,
    TrainingEventRead,
    TrainingEventUpdate,
)
from app.schemas.subscription import SubscriptionRead
from app.services.schedule_service import schedule_service
from app.services.subscription_service import subscription_service

router = APIRouter()


@router.get("/schedule", response_model=list[TrainingEventRead])
async def list_events(
    trainer_id: str | None = Query(default=None),
    resource_id: str | None = Query(default=None),
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TrainingEventRead]:
    events = await schedule_service.get_events(db, trainer_id=trainer_id, resource_id=resource_id, start=start, end=end)
    return [TrainingEventRead.model_validate(e) for e in events]


@router.post(
    "/schedule",
    response_model=TrainingEventRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(csrf_protect)],
)
async def create_event(
    payload: TrainingEventCreate,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> TrainingEventRead:
    event = await schedule_service.create_event(db, **payload.model_dump())
    await db.commit()
    await db.refresh(event)
    return TrainingEventRead.model_validate(event)


@router.patch(
    "/schedule/{event_id}",
    response_model=TrainingEventRead,
    dependencies=[Depends(csrf_protect)],
)
async def update_event(
    event_id: str,
    payload: TrainingEventUpdate,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> TrainingEventRead:
    event = await schedule_service.get_event_or_404(db, event_id)
    await schedule_service.update_event(db, event, **payload.model_dump(exclude_unset=True))
    await db.commit()
    await db.refresh(event)
    return TrainingEventRead.model_validate(event)


@router.delete(
    "/schedule/{event_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(csrf_protect)],
)
async def cancel_event(
    event_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    event = await schedule_service.get_event_or_404(db, event_id)
    await schedule_service.cancel_event(db, event, admin.id)
    await db.commit()


@router.get("/schedule/{event_id}", response_model=TrainingEventRead)
async def get_event(
    event_id: str,
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TrainingEventRead:
    event = await schedule_service.get_event_or_404(db, event_id)
    return TrainingEventRead.model_validate(event)


@router.get("/schedule/{event_id}/enrollments", response_model=list[EnrollmentRead])
async def list_enrollments(
    event_id: str,
    trainer: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
) -> list[EnrollmentRead]:
    event = await schedule_service.get_event_or_404(db, event_id)
    if trainer.role == UserRole.TRAINER and event.trainer_id != trainer.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your event")
    enrollments = await schedule_service.get_enrollments(db, event_id)
    return [EnrollmentRead.model_validate(e) for e in enrollments]


@router.post(
    "/schedule/{event_id}/enroll",
    response_model=EnrollmentRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(csrf_protect)],
)
async def enroll(
    event_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EnrollmentRead:
    event = await schedule_service.get_event_or_404(db, event_id)
    enrollment = await schedule_service.enroll(db, user, event)
    await db.commit()
    await db.refresh(enrollment)
    return EnrollmentRead.model_validate(enrollment)


@router.delete(
    "/schedule/{event_id}/enroll",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(csrf_protect)],
)
async def cancel_enrollment(
    event_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    event = await schedule_service.get_event_or_404(db, event_id)
    await schedule_service.cancel_enrollment(db, user, event)
    await db.commit()


@router.post(
    "/schedule/{event_id}/absence",
    response_model=EnrollmentRead,
    dependencies=[Depends(csrf_protect)],
)
async def notify_absence(
    event_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EnrollmentRead:
    event = await schedule_service.get_event_or_404(db, event_id)
    enrollment = await schedule_service.notify_absence(db, user, event)
    await db.commit()
    await db.refresh(enrollment)
    return EnrollmentRead.model_validate(enrollment)


@router.post(
    "/schedule/{event_id}/attendance",
    response_model=list[EnrollmentRead],
    dependencies=[Depends(csrf_protect)],
)
async def confirm_attendance(
    event_id: str,
    payload: AttendanceRequest,
    trainer: User = Depends(require_trainer),
    db: AsyncSession = Depends(get_db),
) -> list[EnrollmentRead]:
    event = await schedule_service.get_event_or_404(db, event_id)
    results = await schedule_service.confirm_attendance(
        db,
        trainer,
        event,
        [item.model_dump() for item in payload.attendances],
    )
    await db.commit()
    return [EnrollmentRead.model_validate(e) for e in results]


@router.get("/me/subscriptions", response_model=list[SubscriptionRead])
async def my_subscriptions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SubscriptionRead]:
    subs = await subscription_service.get_user_subscriptions(db, user.id)
    return [SubscriptionRead.model_validate(s) for s in subs]

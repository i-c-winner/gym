from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models.booking import Booking, BookingStatus
from app.models.class_session import ClassSession
from app.models.class_type import ClassType
from app.models.discount_credit import DiscountCredit
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.user import User, UserRole
from app.schemas.class_type import ClassTypeCreate, ClassTypeOut, ClassTypeUpdate, ScheduleSlotIn
from app.schemas.discount_credit import UserRoleUpdateIn
from app.services.audit_log_service import audit_log_service
from app.services.class_session_service import class_session_service
from app.services.class_type_service import class_type_service

router = APIRouter(prefix="/gym/admin", tags=["gym-admin"])


@router.post("/materialize-sessions")
async def materialize_sessions(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    """Manually trigger session materialization for the configured horizon window."""
    created = await class_session_service.materialize(db)
    await db.commit()
    return {"created": created}


@router.get("/class-types", response_model=list[ClassTypeOut])
async def list_class_types(
    include_inactive: bool = False,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[ClassTypeOut]:
    items = await class_type_service.get_all(db, include_inactive=include_inactive)
    return [ClassTypeOut.model_validate(ct) for ct in items]


@router.post("/class-types", response_model=ClassTypeOut, status_code=status.HTTP_201_CREATED)
async def create_class_type(
    payload: ClassTypeCreate,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_admin),
) -> ClassTypeOut:
    # Validate trainer exists and has trainer role
    trainer = await db.get(User, payload.trainer_id)
    if not trainer or trainer.role not in (UserRole.TRAINER, UserRole.ADMIN):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid trainer_id")
    ct = await class_type_service.create(db, payload, actor.id)
    await db.commit()
    ct = await class_type_service.get_by_id(db, ct.id)
    return ClassTypeOut.model_validate(ct)


@router.get("/class-types/{class_type_id}", response_model=ClassTypeOut)
async def get_class_type(
    class_type_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> ClassTypeOut:
    ct = await class_type_service.get_by_id(db, class_type_id)
    if not ct:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ClassType not found")
    return ClassTypeOut.model_validate(ct)


@router.patch("/class-types/{class_type_id}", response_model=ClassTypeOut)
async def update_class_type(
    class_type_id: str,
    payload: ClassTypeUpdate,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_admin),
) -> ClassTypeOut:
    ct = await class_type_service.get_by_id(db, class_type_id)
    if not ct:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ClassType not found")
    if payload.trainer_id:
        trainer = await db.get(User, payload.trainer_id)
        if not trainer or trainer.role not in (UserRole.TRAINER, UserRole.ADMIN):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid trainer_id")
    ct = await class_type_service.update(db, ct, payload, actor.id)
    await db.commit()
    ct = await class_type_service.get_by_id(db, ct.id)
    return ClassTypeOut.model_validate(ct)


@router.delete("/class-types/{class_type_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_class_type(
    class_type_id: str,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_admin),
) -> None:
    ct = await class_type_service.get_by_id(db, class_type_id)
    if not ct:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ClassType not found")
    # Forbid deletion if active subscriptions exist
    active_subs = await db.scalar(
        select(func.count()).select_from(Subscription).where(
            Subscription.class_type_id == class_type_id,
            Subscription.status == SubscriptionStatus.ACTIVE,
        )
    )
    if active_subs:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot deactivate class type with active subscriptions",
        )
    payload = ClassTypeUpdate(is_active=False)
    await class_type_service.update(db, ct, payload, actor.id)
    await db.commit()


@router.put("/class-types/{class_type_id}/schedules", response_model=ClassTypeOut)
async def set_schedules(
    class_type_id: str,
    slots: list[ScheduleSlotIn],
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_admin),
) -> ClassTypeOut:
    ct = await class_type_service.get_by_id(db, class_type_id)
    if not ct:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ClassType not found")
    ct = await class_type_service.set_schedules(db, ct, slots, actor.id)
    await db.commit()
    ct = await class_type_service.get_by_id(db, ct.id)
    return ClassTypeOut.model_validate(ct)


@router.get("/users", response_model=list[dict])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[dict]:
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "telephone": u.telephone,
            "telegram_id": u.telegram_id,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "role": u.role,
        }
        for u in users
    ]


@router.get("/users/{user_id}/schedule")
async def get_user_schedule_admin(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[dict]:
    """Return all bookings with full session details for a specific user (admin view)."""
    result = await db.execute(
        select(Booking, ClassSession, ClassType)
        .join(ClassSession, ClassSession.id == Booking.class_session_id)
        .join(ClassType, ClassType.id == ClassSession.class_type_id)
        .where(Booking.user_id == user_id)
        .order_by(ClassSession.scheduled_at)
    )
    rows = result.all()
    return [
        {
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
        }
        for booking, session, ct in rows
    ]


@router.patch("/users/{user_id}/role")
async def set_user_role(
    user_id: str,
    payload: UserRoleUpdateIn,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_admin),
) -> dict:
    if payload.role not in ("admin", "trainer", "user"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    old_role = user.role
    user.role = UserRole(payload.role)
    await audit_log_service.log(
        db,
        actor_id=actor.id,
        actor_role="admin",
        action="change_user_role",
        entity_type="user",
        entity_id=user_id,
        old_value={"role": old_role},
        new_value={"role": payload.role},
    )
    await db.commit()
    return {"user_id": user_id, "role": user.role}


@router.get("/reports/summary")
async def get_summary_report(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    total_subs = await db.scalar(select(func.count()).select_from(Subscription))
    active_subs = await db.scalar(
        select(func.count()).select_from(Subscription).where(Subscription.status == SubscriptionStatus.ACTIVE)
    )
    total_bookings = await db.scalar(select(func.count()).select_from(Booking))
    attended = await db.scalar(
        select(func.count()).select_from(Booking).where(Booking.status == BookingStatus.ATTENDED)
    )
    credits_result = await db.execute(
        select(func.count(), func.sum(DiscountCredit.amount)).select_from(DiscountCredit).where(
            DiscountCredit.is_used == False  # noqa: E712
        )
    )
    cred_row = credits_result.one()

    revenue_result = await db.scalar(
        select(func.sum(Subscription.total_amount)).where(Subscription.status == SubscriptionStatus.ACTIVE)
    )

    return {
        "total_subscriptions": total_subs,
        "active_subscriptions": active_subs,
        "total_bookings": total_bookings,
        "attended_bookings": attended,
        "unused_credits_count": cred_row[0],
        "unused_credits_total": str(cred_row[1] or 0),
        "active_revenue": str(revenue_result or 0),
    }


@router.get("/reports/sessions")
async def get_sessions_report(
    class_type_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[dict]:
    q = (
        select(
            ClassSession.id,
            ClassSession.scheduled_at,
            ClassSession.class_type_id,
            ClassSession.status,
            func.count(Booking.id).label("total_bookings"),
            func.sum(
                func.cast(Booking.status == BookingStatus.ATTENDED, func.Integer if False else type(1))
            ).label("attended"),
        )
        .outerjoin(Booking, Booking.class_session_id == ClassSession.id)
        .group_by(ClassSession.id)
        .order_by(ClassSession.scheduled_at.desc())
    )
    if class_type_id:
        q = q.where(ClassSession.class_type_id == class_type_id)
    result = await db.execute(q)
    rows = result.all()
    return [
        {
            "session_id": r.id,
            "scheduled_at": r.scheduled_at.isoformat(),
            "class_type_id": r.class_type_id,
            "status": r.status,
            "total_bookings": r.total_bookings,
        }
        for r in rows
    ]


@router.get("/sessions-stats")
async def get_sessions_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[dict]:
    """All sessions with booked/attended counts for the overview calendar."""
    result = await db.execute(
        select(
            ClassSession,
            ClassType,
            func.count(Booking.id).filter(Booking.status != "cancelled").label("booked_count"),
            func.count(Booking.id).filter(Booking.status == BookingStatus.ATTENDED).label("attended_count"),
        )
        .join(ClassType, ClassType.id == ClassSession.class_type_id)
        .outerjoin(Booking, Booking.class_session_id == ClassSession.id)
        .group_by(ClassSession.id, ClassType.id)
        .order_by(ClassSession.scheduled_at)
    )
    rows = result.all()
    return [
        {
            "session_id": str(sess.id),
            "scheduled_at": sess.scheduled_at.isoformat(),
            "ends_at": sess.ends_at.isoformat(),
            "class_type_title": ct.title,
            "booked_count": booked_count,
            "attended_count": attended_count,
        }
        for sess, ct, booked_count, attended_count in rows
    ]


@router.get("/sessions/{session_id}/participants")
async def get_session_participants(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[dict]:
    """List of non-cancelled bookings with user details for a given session."""
    result = await db.execute(
        select(Booking, User)
        .join(User, User.id == Booking.user_id)
        .where(
            Booking.class_session_id == session_id,
            Booking.status != "cancelled",
        )
        .order_by(User.first_name, User.last_name)
    )
    rows = result.all()
    return [
        {
            "booking_id": str(booking.id),
            "booking_status": str(booking.status),
            "user_id": str(user.id),
            "user_name": " ".join(filter(None, [user.first_name, user.last_name])) or user.telephone or str(user.id),
            "telephone": user.telephone,
        }
        for booking, user in rows
    ]


@router.get("/sessions")
async def get_all_sessions(
    class_type_id: str | None = None,
    trainer_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[dict]:
    """All sessions with class type and trainer details. Supports filter by class_type_id / trainer_id."""
    from app.models.class_session import ClassSession
    from app.models.class_type import ClassType
    from app.models.user import User as UserModel
    from sqlalchemy.orm import aliased

    Trainer = aliased(UserModel)

    q = (
        select(ClassSession, ClassType, Trainer)
        .join(ClassType, ClassType.id == ClassSession.class_type_id)
        .join(Trainer, Trainer.id == ClassSession.trainer_id)
        .order_by(ClassSession.scheduled_at)
    )
    if class_type_id:
        q = q.where(ClassSession.class_type_id == class_type_id)
    if trainer_id:
        q = q.where(ClassSession.trainer_id == trainer_id)

    result = await db.execute(q)
    rows = result.all()

    return [
        {
            "session_id": str(sess.id),
            "scheduled_at": sess.scheduled_at.isoformat(),
            "ends_at": sess.ends_at.isoformat(),
            "status": sess.status,
            "class_type_id": str(ct.id),
            "class_type_title": ct.title,
            "trainer_id": str(trainer.id),
            "trainer_name": " ".join(filter(None, [trainer.first_name, trainer.last_name])) or "—",
            "duration_minutes": sess.duration_minutes_snapshot,
            "max_participants": sess.max_participants_snapshot,
        }
        for sess, ct, trainer in rows
    ]
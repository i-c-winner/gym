from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.class_schedule import ClassSchedule
from app.models.class_type import ClassType
from app.schemas.class_type import ClassTypeCreate, ClassTypeUpdate, ScheduleSlotIn
from app.services.audit_log_service import audit_log_service


class ClassTypeService:
    async def get_all(self, db: AsyncSession, *, include_inactive: bool = False) -> list[ClassType]:
        q = select(ClassType).options(selectinload(ClassType.schedules))
        if not include_inactive:
            q = q.where(ClassType.is_active == True)  # noqa: E712
        result = await db.execute(q.order_by(ClassType.title))
        return list(result.scalars().all())

    async def get_by_id(self, db: AsyncSession, class_type_id: str) -> ClassType | None:
        result = await db.execute(
            select(ClassType)
            .options(selectinload(ClassType.schedules))
            .where(ClassType.id == class_type_id)
        )
        return result.scalar_one_or_none()

    async def create(
        self, db: AsyncSession, payload: ClassTypeCreate, actor_id: str
    ) -> ClassType:
        ct = ClassType(
            title=payload.title,
            description=payload.description,
            trainer_id=payload.trainer_id,
            duration_minutes=payload.duration_minutes,
            max_participants=payload.max_participants,
            base_rate_per_day=payload.base_rate_per_day,
        )
        db.add(ct)
        await db.flush()
        for slot in payload.schedules:
            await self._add_schedule_slot(db, ct.id, slot)
        await audit_log_service.log(
            db,
            actor_id=actor_id,
            actor_role="admin",
            action="create_class_type",
            entity_type="class_type",
            entity_id=ct.id,
            new_value={"title": ct.title, "trainer_id": ct.trainer_id},
        )
        return ct

    async def update(
        self, db: AsyncSession, ct: ClassType, payload: ClassTypeUpdate, actor_id: str
    ) -> ClassType:
        old = {
            "title": ct.title,
            "trainer_id": ct.trainer_id,
            "base_rate_per_day": str(ct.base_rate_per_day),
            "is_active": ct.is_active,
        }
        for field, value in payload.model_dump(exclude_none=True).items():
            setattr(ct, field, value)
        await audit_log_service.log(
            db,
            actor_id=actor_id,
            actor_role="admin",
            action="update_class_type",
            entity_type="class_type",
            entity_id=ct.id,
            old_value=old,
            new_value=payload.model_dump(exclude_none=True),
        )
        return ct

    async def set_schedules(
        self, db: AsyncSession, ct: ClassType, slots: list[ScheduleSlotIn], actor_id: str
    ) -> ClassType:
        old_slots = [{"day": s.day_of_week, "time": str(s.start_time)} for s in ct.schedules]
        await db.execute(
            select(ClassSchedule).where(ClassSchedule.class_type_id == ct.id)
        )
        for sched in list(ct.schedules):
            await db.delete(sched)
        await db.flush()
        for slot in slots:
            await self._add_schedule_slot(db, ct.id, slot)
        await audit_log_service.log(
            db,
            actor_id=actor_id,
            actor_role="admin",
            action="update_schedule",
            entity_type="class_type",
            entity_id=ct.id,
            old_value=old_slots,
            new_value=[{"day": s.day_of_week, "time": str(s.start_time)} for s in slots],
        )
        return ct

    async def _add_schedule_slot(self, db: AsyncSession, class_type_id: str, slot: ScheduleSlotIn) -> ClassSchedule:
        sched = ClassSchedule(
            class_type_id=class_type_id,
            day_of_week=slot.day_of_week,
            start_time=slot.start_time,
        )
        db.add(sched)
        await db.flush()
        return sched


class_type_service = ClassTypeService()
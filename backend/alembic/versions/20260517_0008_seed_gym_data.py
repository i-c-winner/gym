"""seed gym demo data: admin, trainers, class types, users"""

from alembic import op
import sqlalchemy as sa
from uuid import uuid4
from datetime import datetime, timezone, time

revision = "20260517_0008"
down_revision = "20260517_0007"
branch_labels = None
depends_on = None

ADMIN_ID = "00000000-0000-0000-0000-000000000001"
TRAINER1_ID = "00000000-0000-0000-0000-000000000002"
TRAINER2_ID = "00000000-0000-0000-0000-000000000003"
USER1_ID = "00000000-0000-0000-0000-000000000004"
USER2_ID = "00000000-0000-0000-0000-000000000005"
USER3_ID = "00000000-0000-0000-0000-000000000006"
USER4_ID = "00000000-0000-0000-0000-000000000007"
USER5_ID = "00000000-0000-0000-0000-000000000008"

CT1_ID = "10000000-0000-0000-0000-000000000001"
CT2_ID = "10000000-0000-0000-0000-000000000002"
CT3_ID = "10000000-0000-0000-0000-000000000003"

CS1_ID = "20000000-0000-0000-0000-000000000001"
CS2_ID = "20000000-0000-0000-0000-000000000002"
CS3_ID = "20000000-0000-0000-0000-000000000003"
CS4_ID = "20000000-0000-0000-0000-000000000004"
CS5_ID = "20000000-0000-0000-0000-000000000005"
CS6_ID = "20000000-0000-0000-0000-000000000006"

now = datetime.now(timezone.utc).isoformat()


def upgrade() -> None:
    users = sa.table(
        "users",
        sa.column("id", sa.String),
        sa.column("telephone", sa.String),
        sa.column("first_name", sa.String),
        sa.column("last_name", sa.String),
        sa.column("role", sa.String),
        sa.column("created_at", sa.DateTime),
        sa.column("updated_at", sa.DateTime),
    )
    op.bulk_insert(users, [
        {"id": ADMIN_ID, "telephone": "+70000000001", "first_name": "Admin", "last_name": "Gym", "role": "admin", "created_at": now, "updated_at": now},
        {"id": TRAINER1_ID, "telephone": "+70000000002", "first_name": "Иван", "last_name": "Тренеров", "role": "trainer", "created_at": now, "updated_at": now},
        {"id": TRAINER2_ID, "telephone": "+70000000003", "first_name": "Мария", "last_name": "Фитнес", "role": "trainer", "created_at": now, "updated_at": now},
        {"id": USER1_ID, "telephone": "+70000000004", "first_name": "Алексей", "last_name": "Иванов", "role": "user", "created_at": now, "updated_at": now},
        {"id": USER2_ID, "telephone": "+70000000005", "first_name": "Елена", "last_name": "Петрова", "role": "user", "created_at": now, "updated_at": now},
        {"id": USER3_ID, "telephone": "+70000000006", "first_name": "Дмитрий", "last_name": "Сидоров", "role": "user", "created_at": now, "updated_at": now},
        {"id": USER4_ID, "telephone": "+70000000007", "first_name": "Анна", "last_name": "Козлова", "role": "user", "created_at": now, "updated_at": now},
        {"id": USER5_ID, "telephone": "+70000000008", "first_name": "Михаил", "last_name": "Новиков", "role": "user", "created_at": now, "updated_at": now},
    ])

    class_types = sa.table(
        "class_types",
        sa.column("id", sa.String),
        sa.column("title", sa.String),
        sa.column("description", sa.String),
        sa.column("trainer_id", sa.String),
        sa.column("duration_minutes", sa.Integer),
        sa.column("max_participants", sa.Integer),
        sa.column("base_rate_per_day", sa.Numeric),
        sa.column("is_active", sa.Boolean),
        sa.column("created_at", sa.DateTime),
        sa.column("updated_at", sa.DateTime),
    )
    op.bulk_insert(class_types, [
        {"id": CT1_ID, "title": "Йога", "description": "Хатха-йога для начинающих", "trainer_id": TRAINER1_ID, "duration_minutes": 60, "max_participants": 15, "base_rate_per_day": 300, "is_active": True, "created_at": now, "updated_at": now},
        {"id": CT2_ID, "title": "Силовая тренировка", "description": "Работа с весами и тренажёрами", "trainer_id": TRAINER2_ID, "duration_minutes": 90, "max_participants": 10, "base_rate_per_day": 450, "is_active": True, "created_at": now, "updated_at": now},
        {"id": CT3_ID, "title": "Кардио", "description": "Интервальное кардио", "trainer_id": TRAINER1_ID, "duration_minutes": 45, "max_participants": 20, "base_rate_per_day": 250, "is_active": True, "created_at": now, "updated_at": now},
    ])

    schedules = sa.table(
        "class_schedules",
        sa.column("id", sa.String),
        sa.column("class_type_id", sa.String),
        sa.column("day_of_week", sa.Integer),
        sa.column("start_time", sa.Time),
        sa.column("created_at", sa.DateTime),
        sa.column("updated_at", sa.DateTime),
    )
    op.bulk_insert(schedules, [
        # Йога: Пн(0), Ср(2), Пт(4) в 09:00
        {"id": str(uuid4()), "class_type_id": CT1_ID, "day_of_week": 0, "start_time": "09:00:00", "created_at": now, "updated_at": now},
        {"id": str(uuid4()), "class_type_id": CT1_ID, "day_of_week": 2, "start_time": "09:00:00", "created_at": now, "updated_at": now},
        {"id": str(uuid4()), "class_type_id": CT1_ID, "day_of_week": 4, "start_time": "09:00:00", "created_at": now, "updated_at": now},
        # Силовая: Вт(1), Чт(3), Сб(5) в 18:00
        {"id": str(uuid4()), "class_type_id": CT2_ID, "day_of_week": 1, "start_time": "18:00:00", "created_at": now, "updated_at": now},
        {"id": str(uuid4()), "class_type_id": CT2_ID, "day_of_week": 3, "start_time": "18:00:00", "created_at": now, "updated_at": now},
        {"id": str(uuid4()), "class_type_id": CT2_ID, "day_of_week": 5, "start_time": "10:00:00", "created_at": now, "updated_at": now},
        # Кардио: Пн(0), Ср(2), Пт(4), Вс(6) в 07:00
        {"id": str(uuid4()), "class_type_id": CT3_ID, "day_of_week": 0, "start_time": "07:00:00", "created_at": now, "updated_at": now},
        {"id": str(uuid4()), "class_type_id": CT3_ID, "day_of_week": 2, "start_time": "07:00:00", "created_at": now, "updated_at": now},
        {"id": str(uuid4()), "class_type_id": CT3_ID, "day_of_week": 4, "start_time": "07:00:00", "created_at": now, "updated_at": now},
        {"id": str(uuid4()), "class_type_id": CT3_ID, "day_of_week": 6, "start_time": "07:00:00", "created_at": now, "updated_at": now},
    ])


def downgrade() -> None:
    op.execute(f"DELETE FROM class_schedules WHERE class_type_id IN ('{CT1_ID}', '{CT2_ID}', '{CT3_ID}')")
    op.execute(f"DELETE FROM class_types WHERE id IN ('{CT1_ID}', '{CT2_ID}', '{CT3_ID}')")
    op.execute(
        f"DELETE FROM users WHERE id IN ('{ADMIN_ID}', '{TRAINER1_ID}', '{TRAINER2_ID}', "
        f"'{USER1_ID}', '{USER2_ID}', '{USER3_ID}', '{USER4_ID}', '{USER5_ID}')"
    )
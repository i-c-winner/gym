"""seed gym demo data: admin, trainers, class types, users"""

from alembic import op
from datetime import datetime, timezone
from uuid import uuid4

revision = "20260517_0008"
down_revision = "20260517_0007"
branch_labels = None
depends_on = None

ADMIN_ID    = "00000000-0000-0000-0000-000000000001"
TRAINER1_ID = "00000000-0000-0000-0000-000000000002"
TRAINER2_ID = "00000000-0000-0000-0000-000000000003"
USER1_ID    = "00000000-0000-0000-0000-000000000004"
USER2_ID    = "00000000-0000-0000-0000-000000000005"
USER3_ID    = "00000000-0000-0000-0000-000000000006"
USER4_ID    = "00000000-0000-0000-0000-000000000007"
USER5_ID    = "00000000-0000-0000-0000-000000000008"

CT1_ID = "10000000-0000-0000-0000-000000000001"
CT2_ID = "10000000-0000-0000-0000-000000000002"
CT3_ID = "10000000-0000-0000-0000-000000000003"


def upgrade() -> None:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S+00")

    # Users
    op.execute(f"""
        INSERT INTO users (id, telephone, first_name, last_name, role, created_at, updated_at) VALUES
        ('{ADMIN_ID}',    '+70000000001', 'Admin',   'Gym',      'admin',   '{now}', '{now}'),
        ('{TRAINER1_ID}', '+70000000002', 'Иван',    'Тренеров', 'trainer', '{now}', '{now}'),
        ('{TRAINER2_ID}', '+70000000003', 'Мария',   'Фитнес',   'trainer', '{now}', '{now}'),
        ('{USER1_ID}',    '+70000000004', 'Алексей', 'Иванов',   'user',    '{now}', '{now}'),
        ('{USER2_ID}',    '+70000000005', 'Елена',   'Петрова',  'user',    '{now}', '{now}'),
        ('{USER3_ID}',    '+70000000006', 'Дмитрий', 'Сидоров',  'user',    '{now}', '{now}'),
        ('{USER4_ID}',    '+70000000007', 'Анна',    'Козлова',  'user',    '{now}', '{now}'),
        ('{USER5_ID}',    '+70000000008', 'Михаил',  'Новиков',  'user',    '{now}', '{now}')
        ON CONFLICT DO NOTHING
    """)

    # Class types
    op.execute(f"""
        INSERT INTO class_types (id, title, description, trainer_id, duration_minutes,
                                 max_participants, base_rate_per_day, is_active, created_at, updated_at) VALUES
        ('{CT1_ID}', 'Йога',              'Хатха-йога для начинающих',     '{TRAINER1_ID}', 60, 15, 300, true, '{now}', '{now}'),
        ('{CT2_ID}', 'Силовая тренировка','Работа с весами и тренажёрами', '{TRAINER2_ID}', 90, 10, 450, true, '{now}', '{now}'),
        ('{CT3_ID}', 'Кардио',            'Интервальное кардио',           '{TRAINER1_ID}', 45, 20, 250, true, '{now}', '{now}')
        ON CONFLICT DO NOTHING
    """)

    # Schedules (Йога Пн/Ср/Пт, Силовая Вт/Чт/Сб, Кардио Пн/Ср/Пт/Вс)
    slots = [
        (CT1_ID, 0, "09:00:00"), (CT1_ID, 2, "09:00:00"), (CT1_ID, 4, "09:00:00"),
        (CT2_ID, 1, "18:00:00"), (CT2_ID, 3, "18:00:00"), (CT2_ID, 5, "10:00:00"),
        (CT3_ID, 0, "07:00:00"), (CT3_ID, 2, "07:00:00"), (CT3_ID, 4, "07:00:00"), (CT3_ID, 6, "07:00:00"),
    ]
    values = ", ".join(
        f"('{uuid4()}', '{ct}', {dow}, '{t}', '{now}', '{now}')"
        for ct, dow, t in slots
    )
    op.execute(f"""
        INSERT INTO class_schedules (id, class_type_id, day_of_week, start_time, created_at, updated_at)
        VALUES {values}
        ON CONFLICT DO NOTHING
    """)


def downgrade() -> None:
    op.execute(f"DELETE FROM class_schedules WHERE class_type_id IN ('{CT1_ID}','{CT2_ID}','{CT3_ID}')")
    op.execute(f"DELETE FROM class_types WHERE id IN ('{CT1_ID}','{CT2_ID}','{CT3_ID}')")
    op.execute(
        f"DELETE FROM users WHERE id IN ('{ADMIN_ID}','{TRAINER1_ID}','{TRAINER2_ID}',"
        f"'{USER1_ID}','{USER2_ID}','{USER3_ID}','{USER4_ID}','{USER5_ID}')"
    )
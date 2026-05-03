"""add uuid server defaults"""

from alembic import op
import sqlalchemy as sa


revision = "20260503_0006"
down_revision = "20260425_0005"
branch_labels = None
depends_on = None


TABLES_WITH_UUID_PK = (
    "users",
    "resources",
    "plans",
    "sessions",
    "orders",
    "access_grants",
    "payment_events",
)


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
    for table_name in TABLES_WITH_UUID_PK:
        op.alter_column(
            table_name,
            "id",
            existing_type=sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            existing_nullable=False,
        )


def downgrade() -> None:
    for table_name in TABLES_WITH_UUID_PK:
        op.alter_column(
            table_name,
            "id",
            existing_type=sa.UUID(),
            server_default=None,
            existing_nullable=False,
        )

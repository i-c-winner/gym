"""add telephone and telegram_id to users"""

from alembic import op
import sqlalchemy as sa


revision = "20260425_0002"
down_revision = "20260425_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("telephone", sa.String(length=32), nullable=True))
    op.add_column("users", sa.Column("telegram_id", sa.String(length=64), nullable=True))
    op.create_unique_constraint("uq_users_telephone", "users", ["telephone"])
    op.create_unique_constraint("uq_users_telegram_id", "users", ["telegram_id"])


def downgrade() -> None:
    op.drop_constraint("uq_users_telegram_id", "users", type_="unique")
    op.drop_constraint("uq_users_telephone", "users", type_="unique")
    op.drop_column("users", "telegram_id")
    op.drop_column("users", "telephone")

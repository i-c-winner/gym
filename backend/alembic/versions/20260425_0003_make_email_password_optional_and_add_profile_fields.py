"""make email and password optional and add profile fields"""

from alembic import op
import sqlalchemy as sa


revision = "20260425_0003"
down_revision = "20260425_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("users", "email", existing_type=sa.String(length=320), nullable=True)
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=True)
    op.add_column("users", sa.Column("first_name", sa.String(length=120), nullable=True))
    op.add_column("users", sa.Column("last_name", sa.String(length=120), nullable=True))
    op.add_column("users", sa.Column("age", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("gender", sa.String(length=32), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "gender")
    op.drop_column("users", "age")
    op.drop_column("users", "last_name")
    op.drop_column("users", "first_name")
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=False)
    op.alter_column("users", "email", existing_type=sa.String(length=320), nullable=False)

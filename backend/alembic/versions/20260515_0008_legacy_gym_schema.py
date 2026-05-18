"""add user_role enum and users.role column (idempotent)"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM

revision = "20260515_0008"
down_revision = "20260503_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()

    # Create enum type if it doesn't exist yet
    ENUM("admin", "trainer", "user", name="user_role").create(bind, checkfirst=True)

    # Add role column if it doesn't exist
    bind.execute(sa.text("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'user'
    """))


def downgrade() -> None:
    op.drop_column("users", "role")
    bind = op.get_bind()
    ENUM(name="user_role").drop(bind, checkfirst=True)
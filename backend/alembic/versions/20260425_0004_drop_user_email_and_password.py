"""drop user email and password columns"""

from alembic import op


revision = "20260425_0004"
down_revision = "20260425_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_index("ix_users_email", table_name="users")
    op.drop_column("users", "password_hash")
    op.drop_column("users", "email")


def downgrade() -> None:
    raise NotImplementedError("Downgrade is not supported after dropping email and password")

"""drop user is_active and is_verified columns"""

from alembic import op


revision = "20260425_0005"
down_revision = "20260425_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("users", "is_verified")
    op.drop_column("users", "is_active")


def downgrade() -> None:
    raise NotImplementedError("Downgrade is not supported after dropping user status flags")

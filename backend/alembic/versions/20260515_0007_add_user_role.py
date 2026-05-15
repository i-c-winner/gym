"""add user role"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260515_0007"
down_revision = "20260503_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    user_role = postgresql.ENUM("user", "trainer", "admin", name="user_role", create_type=False)
    bind = op.get_bind()
    user_role.create(bind, checkfirst=True)

    op.add_column(
        "users",
        sa.Column(
            "role",
            postgresql.ENUM("user", "trainer", "admin", name="user_role", create_type=False),
            nullable=False,
            server_default="user",
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "role")
    bind = op.get_bind()
    postgresql.ENUM(name="user_role").drop(bind, checkfirst=True)
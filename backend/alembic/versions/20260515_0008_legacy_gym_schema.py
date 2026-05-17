"""legacy gym schema (stub — tables already applied directly to DB)"""

from alembic import op

revision = "20260515_0008"
down_revision = "20260503_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # This revision was applied directly to the DB outside of Alembic.
    # The following objects already exist: user_role enum, users.role column,
    # subscriptions, enrollments, training_events, subscription_audit_logs tables
    # and related enum types. This stub records the state.
    pass


def downgrade() -> None:
    pass
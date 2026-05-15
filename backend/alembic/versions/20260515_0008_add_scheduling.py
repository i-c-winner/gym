"""add scheduling"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260515_0008"
down_revision = "20260515_0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()

    postgresql.ENUM("online", "attendance", name="plan_type", create_type=False).create(bind, checkfirst=True)
    postgresql.ENUM("scheduled", "completed", "cancelled", name="training_event_status", create_type=False).create(bind, checkfirst=True)
    postgresql.ENUM("active", "exhausted", "expired", "cancelled", name="subscription_status", create_type=False).create(bind, checkfirst=True)
    postgresql.ENUM("enrolled", "notified_absent", "attended", "absent_extended", "missed", "cancelled", name="enrollment_status", create_type=False).create(bind, checkfirst=True)
    postgresql.ENUM("enrolled", "cancelled", "notified", "confirmed_attended", "confirmed_absent", "extended", "expired", "exhausted", name="audit_action", create_type=False).create(bind, checkfirst=True)

    # ── plans ─────────────────────────────────────────────────────────────────
    op.add_column(
        "plans",
        sa.Column(
            "plan_type",
            postgresql.ENUM("online", "attendance", name="plan_type", create_type=False),
            nullable=False,
            server_default="online",
        ),
    )
    op.add_column("plans", sa.Column("class_count", sa.Integer(), nullable=True))
    op.add_column("plans", sa.Column("max_extensions", sa.Integer(), nullable=True))

    # ── training_events ───────────────────────────────────────────────────────
    op.create_table(
        "training_events",
        sa.Column("id", postgresql.UUID(as_uuid=False), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("trainer_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("resource_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("resources.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("max_participants", sa.Integer(), nullable=True),
        sa.Column(
            "status",
            postgresql.ENUM("scheduled", "completed", "cancelled", name="training_event_status", create_type=False),
            nullable=False,
            server_default="scheduled",
        ),
    )
    op.create_index("ix_training_events_trainer_id", "training_events", ["trainer_id"])
    op.create_index("ix_training_events_resource_id", "training_events", ["resource_id"])
    op.create_index("ix_training_events_start_at", "training_events", ["start_at"])

    # ── subscriptions ─────────────────────────────────────────────────────────
    op.create_table(
        "subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=False), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False, unique=True),
        sa.Column("resource_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("resources.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("classes_total", sa.Integer(), nullable=False),
        sa.Column("classes_remaining", sa.Integer(), nullable=False),
        sa.Column("max_extensions", sa.Integer(), nullable=False),
        sa.Column("extensions_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "status",
            postgresql.ENUM("active", "exhausted", "expired", "cancelled", name="subscription_status", create_type=False),
            nullable=False,
            server_default="active",
        ),
    )
    op.create_index("ix_subscriptions_user_id", "subscriptions", ["user_id"])
    op.create_index("ix_subscriptions_resource_id", "subscriptions", ["resource_id"])

    # ── enrollments ───────────────────────────────────────────────────────────
    op.create_table(
        "enrollments",
        sa.Column("id", postgresql.UUID(as_uuid=False), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("training_events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("subscription_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("subscriptions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM("enrolled", "notified_absent", "attended", "absent_extended", "missed", "cancelled", name="enrollment_status", create_type=False),
            nullable=False,
            server_default="enrolled",
        ),
        sa.Column("notified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("extended", sa.Boolean(), nullable=False, server_default="false"),
        sa.UniqueConstraint("user_id", "event_id", name="uq_enrollments_user_event"),
    )
    op.create_index("ix_enrollments_user_id", "enrollments", ["user_id"])
    op.create_index("ix_enrollments_event_id", "enrollments", ["event_id"])
    op.create_index("ix_enrollments_subscription_id", "enrollments", ["subscription_id"])

    # ── subscription_audit_logs ───────────────────────────────────────────────
    op.create_table(
        "subscription_audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=False), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("subscription_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("actor_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("enrollment_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("enrollments.id", ondelete="SET NULL"), nullable=True),
        sa.Column(
            "action",
            postgresql.ENUM("enrolled", "cancelled", "notified", "confirmed_attended", "confirmed_absent", "extended", "expired", "exhausted", name="audit_action", create_type=False),
            nullable=False,
        ),
        sa.Column("classes_before", sa.Integer(), nullable=False),
        sa.Column("classes_after", sa.Integer(), nullable=False),
        sa.Column("extensions_before", sa.Integer(), nullable=False),
        sa.Column("extensions_after", sa.Integer(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
    )
    op.create_index("ix_subscription_audit_logs_subscription_id", "subscription_audit_logs", ["subscription_id"])


def downgrade() -> None:
    op.drop_table("subscription_audit_logs")
    op.drop_table("enrollments")
    op.drop_table("subscriptions")
    op.drop_table("training_events")
    op.drop_column("plans", "max_extensions")
    op.drop_column("plans", "class_count")
    op.drop_column("plans", "plan_type")

    bind = op.get_bind()
    postgresql.ENUM(name="audit_action").drop(bind, checkfirst=True)
    postgresql.ENUM(name="enrollment_status").drop(bind, checkfirst=True)
    postgresql.ENUM(name="subscription_status").drop(bind, checkfirst=True)
    postgresql.ENUM(name="training_event_status").drop(bind, checkfirst=True)
    postgresql.ENUM(name="plan_type").drop(bind, checkfirst=True)
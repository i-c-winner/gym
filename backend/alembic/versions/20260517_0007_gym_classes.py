"""gym classes system: class types, sessions, subscriptions, bookings, credits, audit"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM, UUID

revision = "20260517_0007"
down_revision = "20260515_0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Drop legacy tables (empty, safe) and conflicting enum types ───────────
    op.execute("DROP TABLE IF EXISTS subscription_audit_logs CASCADE")
    op.execute("DROP TABLE IF EXISTS enrollments CASCADE")
    op.execute("DROP TABLE IF EXISTS subscriptions CASCADE")
    op.execute("DROP TABLE IF EXISTS training_events CASCADE")
    op.execute('DROP TYPE IF EXISTS "SubscriptionStatus" CASCADE')
    op.execute("DROP TYPE IF EXISTS subscription_status CASCADE")
    op.execute("DROP TYPE IF EXISTS enrollment_status CASCADE")
    op.execute("DROP TYPE IF EXISTS training_event_status CASCADE")
    op.execute("DROP TYPE IF EXISTS audit_action CASCADE")
    # users.role + user_role enum already exist from 20260515_0008 — skip.

    # ── Enum types (created via raw DDL so they're outside create_table) ──────
    bind = op.get_bind()
    ENUM("scheduled", "completed", "cancelled",
         name="class_session_status").create(bind, checkfirst=True)
    ENUM("current_month_rest", "next_month", "next_3_months", "next_6_months",
         name="subscription_period").create(bind, checkfirst=True)
    ENUM("pending_payment", "active", "expired", "cancelled",
         name="subscription_status").create(bind, checkfirst=True)
    ENUM("pending", "succeeded", "failed",
         name="sub_payment_status").create(bind, checkfirst=True)
    ENUM("confirmed", "absence_pending", "absent", "no_spot_after_rejection",
         "cancelled", "no_show", "attended",
         name="booking_status").create(bind, checkfirst=True)
    ENUM("pending", "approved", "rejected", "auto_approved", "auto_rejected",
         name="absence_request_status").create(bind, checkfirst=True)

    # ── class_types ───────────────────────────────────────────────────────────
    op.create_table(
        "class_types",
        sa.Column("id", UUID(as_uuid=False), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("trainer_id", UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("duration_minutes", sa.Integer, nullable=False),
        sa.Column("max_participants", sa.Integer, nullable=False),
        sa.Column("base_rate_per_day", sa.Numeric(12, 2), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_class_types_trainer_id", "class_types", ["trainer_id"])

    # ── class_schedules ───────────────────────────────────────────────────────
    op.create_table(
        "class_schedules",
        sa.Column("id", UUID(as_uuid=False), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("class_type_id", UUID(as_uuid=False), sa.ForeignKey("class_types.id", ondelete="CASCADE"), nullable=False),
        sa.Column("day_of_week", sa.Integer, nullable=False),
        sa.Column("start_time", sa.Time, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("class_type_id", "day_of_week", name="uq_class_schedule_type_day"),
    )
    op.create_index("ix_class_schedules_class_type_id", "class_schedules", ["class_type_id"])

    # ── class_sessions ────────────────────────────────────────────────────────
    op.create_table(
        "class_sessions",
        sa.Column("id", UUID(as_uuid=False), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("class_type_id", UUID(as_uuid=False), sa.ForeignKey("class_types.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("class_schedule_id", UUID(as_uuid=False), sa.ForeignKey("class_schedules.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("trainer_id", UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("duration_minutes_snapshot", sa.Integer, nullable=False),
        sa.Column("max_participants_snapshot", sa.Integer, nullable=False),
        sa.Column("base_rate_snapshot", sa.Numeric(12, 2), nullable=False),
        sa.Column("status", ENUM(name="class_session_status", create_type=False), nullable=False, server_default="scheduled"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("class_schedule_id", "scheduled_at", name="uq_class_session_schedule_time"),
    )
    op.create_index("ix_class_sessions_class_type_id", "class_sessions", ["class_type_id"])
    op.create_index("ix_class_sessions_trainer_id", "class_sessions", ["trainer_id"])
    op.create_index("ix_class_sessions_scheduled_at", "class_sessions", ["scheduled_at"])
    op.create_index("ix_class_sessions_status", "class_sessions", ["status"])

    # ── subscriptions ─────────────────────────────────────────────────────────
    op.create_table(
        "subscriptions",
        sa.Column("id", UUID(as_uuid=False), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("class_type_id", UUID(as_uuid=False), sa.ForeignKey("class_types.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("period_type", ENUM(name="subscription_period", create_type=False), nullable=False),
        sa.Column("period_start", sa.Date, nullable=False),
        sa.Column("period_end", sa.Date, nullable=False),
        sa.Column("days_count", sa.Integer, nullable=False),
        sa.Column("gross_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("discount_amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(8), nullable=False, server_default="RUB"),
        sa.Column("status", ENUM(name="subscription_status", create_type=False), nullable=False, server_default="pending_payment"),
        sa.Column("activated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "class_type_id", "period_start", name="uq_subscription_user_type_start"),
    )
    op.create_index("ix_subscriptions_user_id", "subscriptions", ["user_id"])
    op.create_index("ix_subscriptions_class_type_id", "subscriptions", ["class_type_id"])
    op.create_index("ix_subscriptions_status", "subscriptions", ["status"])

    # ── subscription_payments ─────────────────────────────────────────────────
    op.create_table(
        "subscription_payments",
        sa.Column("id", UUID(as_uuid=False), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("subscription_id", UUID(as_uuid=False), sa.ForeignKey("subscriptions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("provider", sa.String(64), nullable=False),
        sa.Column("provider_txn_id", sa.String(128), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(8), nullable=False),
        sa.Column("status", ENUM(name="sub_payment_status", create_type=False), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("provider_txn_id", name="uq_sub_payment_provider_txn"),
    )
    op.create_index("ix_subscription_payments_subscription_id", "subscription_payments", ["subscription_id"])

    # ── bookings ──────────────────────────────────────────────────────────────
    op.create_table(
        "bookings",
        sa.Column("id", UUID(as_uuid=False), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("class_session_id", UUID(as_uuid=False), sa.ForeignKey("class_sessions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("subscription_id", UUID(as_uuid=False), sa.ForeignKey("subscriptions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("status", ENUM(name="booking_status", create_type=False), nullable=False, server_default="confirmed"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "class_session_id", name="uq_booking_user_session"),
    )
    op.create_index("ix_bookings_user_id", "bookings", ["user_id"])
    op.create_index("ix_bookings_class_session_id", "bookings", ["class_session_id"])
    op.create_index("ix_bookings_status", "bookings", ["status"])

    # ── absence_requests ──────────────────────────────────────────────────────
    op.create_table(
        "absence_requests",
        sa.Column("id", UUID(as_uuid=False), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("booking_id", UUID(as_uuid=False), sa.ForeignKey("bookings.id", ondelete="RESTRICT"), nullable=False, unique=True),
        sa.Column("user_id", UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("trainer_id", UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("status", ENUM(name="absence_request_status", create_type=False), nullable=False, server_default="pending"),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_absence_requests_user_id", "absence_requests", ["user_id"])
    op.create_index("ix_absence_requests_trainer_id", "absence_requests", ["trainer_id"])
    op.create_index("ix_absence_requests_status", "absence_requests", ["status"])

    # ── discount_credits ──────────────────────────────────────────────────────
    op.create_table(
        "discount_credits",
        sa.Column("id", UUID(as_uuid=False), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("class_type_id", UUID(as_uuid=False), sa.ForeignKey("class_types.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("source_absence_request_id", UUID(as_uuid=False),
                  sa.ForeignKey("absence_requests.id", ondelete="RESTRICT"), nullable=False, unique=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("is_used", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("applied_to_subscription_id", UUID(as_uuid=False),
                  sa.ForeignKey("subscriptions.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_discount_credits_user_id", "discount_credits", ["user_id"])
    op.create_index("ix_discount_credits_class_type_id", "discount_credits", ["class_type_id"])
    op.create_index("ix_discount_credits_is_used", "discount_credits", ["is_used"])

    # ── audit_logs ────────────────────────────────────────────────────────────
    op.create_table(
        "audit_logs",
        sa.Column("id", UUID(as_uuid=False), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("actor_id", UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("actor_role", sa.String(32), nullable=False),
        sa.Column("action", sa.String(64), nullable=False),
        sa.Column("entity_type", sa.String(64), nullable=False),
        sa.Column("entity_id", sa.String(36), nullable=True),
        sa.Column("old_value", sa.Text, nullable=True),
        sa.Column("new_value", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_audit_logs_actor_id", "audit_logs", ["actor_id"])
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])
    op.create_index("ix_audit_logs_entity_type", "audit_logs", ["entity_type"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("discount_credits")
    op.drop_table("absence_requests")
    op.drop_table("bookings")
    op.drop_table("subscription_payments")
    op.drop_table("subscriptions")
    op.drop_table("class_sessions")
    op.drop_table("class_schedules")
    op.drop_table("class_types")
    op.execute("DROP TYPE IF EXISTS class_session_status")
    op.execute("DROP TYPE IF EXISTS subscription_period")
    op.execute("DROP TYPE IF EXISTS subscription_status")
    op.execute("DROP TYPE IF EXISTS sub_payment_status")
    op.execute("DROP TYPE IF EXISTS booking_status")
    op.execute("DROP TYPE IF EXISTS absence_request_status")
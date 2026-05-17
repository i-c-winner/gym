"""gym classes system: roles, class types, sessions, subscriptions, bookings, credits, audit"""

from alembic import op
import sqlalchemy as sa

revision = "20260517_0007"
down_revision = "20260503_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add role to users
    op.execute("CREATE TYPE user_role AS ENUM ('admin', 'trainer', 'user')")
    op.add_column(
        "users",
        sa.Column(
            "role",
            sa.Enum("admin", "trainer", "user", name="user_role"),
            nullable=False,
            server_default="user",
        ),
    )

    # 2. class_types
    op.create_table(
        "class_types",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("trainer_id", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("duration_minutes", sa.Integer, nullable=False),
        sa.Column("max_participants", sa.Integer, nullable=False),
        sa.Column("base_rate_per_day", sa.Numeric(12, 2), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_class_types_trainer_id", "class_types", ["trainer_id"])

    # 3. class_schedules
    op.create_table(
        "class_schedules",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("class_type_id", sa.String(36), sa.ForeignKey("class_types.id", ondelete="CASCADE"), nullable=False),
        sa.Column("day_of_week", sa.Integer, nullable=False),
        sa.Column("start_time", sa.Time, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("class_type_id", "day_of_week", name="uq_class_schedule_type_day"),
    )
    op.create_index("ix_class_schedules_class_type_id", "class_schedules", ["class_type_id"])

    # 4. class_sessions
    op.execute(
        "CREATE TYPE class_session_status AS ENUM ('scheduled', 'completed', 'cancelled')"
    )
    op.create_table(
        "class_sessions",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("class_type_id", sa.String(36), sa.ForeignKey("class_types.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("class_schedule_id", sa.String(36), sa.ForeignKey("class_schedules.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("trainer_id", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("duration_minutes_snapshot", sa.Integer, nullable=False),
        sa.Column("max_participants_snapshot", sa.Integer, nullable=False),
        sa.Column("base_rate_snapshot", sa.Numeric(12, 2), nullable=False),
        sa.Column(
            "status",
            sa.Enum("scheduled", "completed", "cancelled", name="class_session_status"),
            nullable=False,
            server_default="scheduled",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("class_schedule_id", "scheduled_at", name="uq_class_session_schedule_time"),
    )
    op.create_index("ix_class_sessions_class_type_id", "class_sessions", ["class_type_id"])
    op.create_index("ix_class_sessions_trainer_id", "class_sessions", ["trainer_id"])
    op.create_index("ix_class_sessions_scheduled_at", "class_sessions", ["scheduled_at"])
    op.create_index("ix_class_sessions_status", "class_sessions", ["status"])

    # 5. subscriptions
    op.execute(
        "CREATE TYPE subscription_period AS ENUM "
        "('current_month_rest', 'next_month', 'next_3_months', 'next_6_months')"
    )
    op.execute(
        "CREATE TYPE subscription_status AS ENUM "
        "('pending_payment', 'active', 'expired', 'cancelled')"
    )
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("class_type_id", sa.String(36), sa.ForeignKey("class_types.id", ondelete="RESTRICT"), nullable=False),
        sa.Column(
            "period_type",
            sa.Enum("current_month_rest", "next_month", "next_3_months", "next_6_months", name="subscription_period"),
            nullable=False,
        ),
        sa.Column("period_start", sa.Date, nullable=False),
        sa.Column("period_end", sa.Date, nullable=False),
        sa.Column("days_count", sa.Integer, nullable=False),
        sa.Column("gross_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("discount_amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(8), nullable=False, server_default="RUB"),
        sa.Column(
            "status",
            sa.Enum("pending_payment", "active", "expired", "cancelled", name="subscription_status"),
            nullable=False,
            server_default="pending_payment",
        ),
        sa.Column("activated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "class_type_id", "period_start", name="uq_subscription_user_type_start"),
    )
    op.create_index("ix_subscriptions_user_id", "subscriptions", ["user_id"])
    op.create_index("ix_subscriptions_class_type_id", "subscriptions", ["class_type_id"])
    op.create_index("ix_subscriptions_status", "subscriptions", ["status"])

    # 6. subscription_payments
    op.execute(
        "CREATE TYPE sub_payment_status AS ENUM ('pending', 'succeeded', 'failed')"
    )
    op.create_table(
        "subscription_payments",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("subscription_id", sa.String(36), sa.ForeignKey("subscriptions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("provider", sa.String(64), nullable=False),
        sa.Column("provider_txn_id", sa.String(128), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(8), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "succeeded", "failed", name="sub_payment_status"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("provider_txn_id", name="uq_sub_payment_provider_txn"),
    )
    op.create_index("ix_subscription_payments_subscription_id", "subscription_payments", ["subscription_id"])

    # 7. bookings
    op.execute(
        "CREATE TYPE booking_status AS ENUM "
        "('confirmed', 'absence_pending', 'absent', 'no_spot_after_rejection', "
        "'cancelled', 'no_show', 'attended')"
    )
    op.create_table(
        "bookings",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("class_session_id", sa.String(36), sa.ForeignKey("class_sessions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("subscription_id", sa.String(36), sa.ForeignKey("subscriptions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "confirmed", "absence_pending", "absent", "no_spot_after_rejection",
                "cancelled", "no_show", "attended",
                name="booking_status",
            ),
            nullable=False,
            server_default="confirmed",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "class_session_id", name="uq_booking_user_session"),
    )
    op.create_index("ix_bookings_user_id", "bookings", ["user_id"])
    op.create_index("ix_bookings_class_session_id", "bookings", ["class_session_id"])
    op.create_index("ix_bookings_status", "bookings", ["status"])

    # 8. absence_requests
    op.execute(
        "CREATE TYPE absence_request_status AS ENUM "
        "('pending', 'approved', 'rejected', 'auto_approved', 'auto_rejected')"
    )
    op.create_table(
        "absence_requests",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("booking_id", sa.String(36), sa.ForeignKey("bookings.id", ondelete="RESTRICT"), nullable=False, unique=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("trainer_id", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "approved", "rejected", "auto_approved", "auto_rejected", name="absence_request_status"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_absence_requests_user_id", "absence_requests", ["user_id"])
    op.create_index("ix_absence_requests_trainer_id", "absence_requests", ["trainer_id"])
    op.create_index("ix_absence_requests_status", "absence_requests", ["status"])

    # 9. discount_credits
    op.create_table(
        "discount_credits",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("class_type_id", sa.String(36), sa.ForeignKey("class_types.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("source_absence_request_id", sa.String(36), sa.ForeignKey("absence_requests.id", ondelete="RESTRICT"), nullable=False, unique=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("is_used", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("applied_to_subscription_id", sa.String(36), sa.ForeignKey("subscriptions.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_discount_credits_user_id", "discount_credits", ["user_id"])
    op.create_index("ix_discount_credits_class_type_id", "discount_credits", ["class_type_id"])
    op.create_index("ix_discount_credits_is_used", "discount_credits", ["is_used"])

    # 10. audit_logs
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(36), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("actor_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
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
    op.drop_column("users", "role")

    op.execute("DROP TYPE IF EXISTS user_role")
    op.execute("DROP TYPE IF EXISTS class_session_status")
    op.execute("DROP TYPE IF EXISTS subscription_period")
    op.execute("DROP TYPE IF EXISTS subscription_status")
    op.execute("DROP TYPE IF EXISTS sub_payment_status")
    op.execute("DROP TYPE IF EXISTS booking_status")
    op.execute("DROP TYPE IF EXISTS absence_request_status")
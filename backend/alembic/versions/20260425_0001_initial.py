"""initial schema"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260425_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    plan_duration = postgresql.ENUM("1m", "3m", "6m", "lifetime", name="plan_duration", create_type=False)
    order_status = postgresql.ENUM("pending", "paid", "failed", "canceled", name="order_status", create_type=False)
    payment_event_status = postgresql.ENUM(
        "received",
        "processed",
        "ignored",
        "failed",
        name="payment_event_status",
        create_type=False,
    )

    bind = op.get_bind()
    plan_duration.create(bind, checkfirst=True)
    order_status.create(bind, checkfirst=True)
    payment_event_status.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), primary_key=True, nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "resources",
        sa.Column("id", sa.UUID(), primary_key=True, nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("content_url", sa.String(length=500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_resources_slug", "resources", ["slug"], unique=True)

    op.create_table(
        "plans",
        sa.Column("id", sa.UUID(), primary_key=True, nullable=False),
        sa.Column("resource_id", sa.UUID(), sa.ForeignKey("resources.id", ondelete="CASCADE"), nullable=False),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("duration_type", plan_duration, nullable=False),
        sa.Column("duration_months", sa.Integer(), nullable=True),
        sa.Column("price_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("resource_id", "code", name="uq_plans_resource_code"),
    )
    op.create_index("ix_plans_resource_id", "plans", ["resource_id"], unique=False)

    op.create_table(
        "sessions",
        sa.Column("id", sa.UUID(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("refresh_token_hash", sa.String(length=64), nullable=False),
        sa.Column("refresh_expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.String(length=512), nullable=True),
        sa.Column("csrf_token", sa.String(length=128), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("refresh_token_hash", name="uq_sessions_refresh_token_hash"),
    )
    op.create_index("ix_sessions_user_id", "sessions", ["user_id"], unique=False)

    op.create_table(
        "orders",
        sa.Column("id", sa.UUID(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("resource_id", sa.UUID(), sa.ForeignKey("resources.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("plan_id", sa.UUID(), sa.ForeignKey("plans.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False),
        sa.Column("status", order_status, nullable=False, server_default="pending"),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("provider_order_id", sa.String(length=128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("provider_order_id", name="uq_orders_provider_order_id"),
    )
    op.create_index("ix_orders_user_id", "orders", ["user_id"], unique=False)
    op.create_index("ix_orders_resource_id", "orders", ["resource_id"], unique=False)
    op.create_index("ix_orders_plan_id", "orders", ["plan_id"], unique=False)

    op.create_table(
        "access_grants",
        sa.Column("id", sa.UUID(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("resource_id", sa.UUID(), sa.ForeignKey("resources.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_id", sa.UUID(), sa.ForeignKey("orders.id", ondelete="SET NULL"), nullable=True),
        sa.Column("grant_type", sa.String(length=32), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_lifetime", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "resource_id", "order_id", name="uq_access_grants_order"),
    )
    op.create_index("ix_access_grants_user_id", "access_grants", ["user_id"], unique=False)
    op.create_index("ix_access_grants_resource_id", "access_grants", ["resource_id"], unique=False)
    op.create_index("ix_access_grants_order_id", "access_grants", ["order_id"], unique=False)

    op.create_table(
        "payment_events",
        sa.Column("id", sa.UUID(), primary_key=True, nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("provider_event_id", sa.String(length=128), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("order_id", sa.UUID(), sa.ForeignKey("orders.id", ondelete="SET NULL"), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("status", payment_event_status, nullable=False, server_default="received"),
        sa.Column("signature", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("provider", "provider_event_id", name="uq_payment_events_provider_event"),
    )
    op.create_index("ix_payment_events_order_id", "payment_events", ["order_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_payment_events_order_id", table_name="payment_events")
    op.drop_table("payment_events")
    op.drop_index("ix_access_grants_order_id", table_name="access_grants")
    op.drop_index("ix_access_grants_resource_id", table_name="access_grants")
    op.drop_index("ix_access_grants_user_id", table_name="access_grants")
    op.drop_table("access_grants")
    op.drop_index("ix_orders_plan_id", table_name="orders")
    op.drop_index("ix_orders_resource_id", table_name="orders")
    op.drop_index("ix_orders_user_id", table_name="orders")
    op.drop_table("orders")
    op.drop_index("ix_sessions_user_id", table_name="sessions")
    op.drop_table("sessions")
    op.drop_index("ix_plans_resource_id", table_name="plans")
    op.drop_table("plans")
    op.drop_index("ix_resources_slug", table_name="resources")
    op.drop_table("resources")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    bind = op.get_bind()
    postgresql.ENUM(name="payment_event_status").drop(bind, checkfirst=True)
    postgresql.ENUM(name="order_status").drop(bind, checkfirst=True)
    postgresql.ENUM(name="plan_duration").drop(bind, checkfirst=True)

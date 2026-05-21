"""add currency_rate table with default UZS row"""

from alembic import op
import sqlalchemy as sa

revision = "20260521_0010"
down_revision = "20260518_0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "currency_rates",
        sa.Column(
            "id",
            sa.String(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("currency", sa.String(8), nullable=False, comment="Код валюты, например UZS, USD, RUB"),
        sa.Column(
            "coefficient",
            sa.Numeric(18, 6),
            nullable=False,
            comment="Коэффициент перевода из базовой валюты в данную",
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("currency", name="uq_currency_rates_currency"),
    )
    op.create_index("ix_currency_rates_currency", "currency_rates", ["currency"])

    # Строка по умолчанию: UZS, коэффициент 13500
    op.execute(
        "INSERT INTO currency_rates (currency, coefficient, is_active) "
        "VALUES ('UZS', 13500.000000, true)"
    )


def downgrade() -> None:
    op.drop_index("ix_currency_rates_currency", table_name="currency_rates")
    op.drop_table("currency_rates")

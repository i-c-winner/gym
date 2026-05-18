"""simplify absence and booking enums: remove auto statuses and no_spot_after_rejection"""

from alembic import op

revision = "20260518_0009"
down_revision = "20260517_0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── absence_request_status ─────────────────────────────────────────────────
    # Drop default first (it references the enum type), then relax to text
    op.execute("ALTER TABLE absence_requests ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TABLE absence_requests ALTER COLUMN status TYPE text")
    op.execute("DROP TYPE IF EXISTS absence_request_status")

    # Migrate data
    op.execute("""
        UPDATE absence_requests
        SET status = 'confirmed'
        WHERE status IN ('approved', 'auto_approved')
    """)
    op.execute("""
        UPDATE absence_requests
        SET status = 'rejected'
        WHERE status = 'auto_rejected'
    """)

    # Recreate enum and restore column + default
    op.execute("CREATE TYPE absence_request_status AS ENUM ('pending', 'confirmed', 'rejected')")
    op.execute("""
        ALTER TABLE absence_requests
            ALTER COLUMN status TYPE absence_request_status
            USING status::absence_request_status
    """)
    op.execute("ALTER TABLE absence_requests ALTER COLUMN status SET DEFAULT 'pending'")

    # ── booking_status ─────────────────────────────────────────────────────────
    op.execute("ALTER TABLE bookings ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TABLE bookings ALTER COLUMN status TYPE text")
    op.execute("DROP TYPE IF EXISTS booking_status")

    # Migrate obsolete statuses
    op.execute("""
        UPDATE bookings SET status = 'no_show'
        WHERE status IN ('no_spot_after_rejection', 'absence_pending')
    """)

    # Recreate enum and restore column + default
    op.execute("""
        CREATE TYPE booking_status AS ENUM (
            'confirmed', 'absent', 'cancelled', 'no_show', 'attended'
        )
    """)
    op.execute("""
        ALTER TABLE bookings
            ALTER COLUMN status TYPE booking_status
            USING status::booking_status
    """)
    op.execute("ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'confirmed'")


def downgrade() -> None:
    # ── booking_status ─────────────────────────────────────────────────────────
    op.execute("ALTER TABLE bookings ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TABLE bookings ALTER COLUMN status TYPE text")
    op.execute("DROP TYPE IF EXISTS booking_status")
    op.execute("""
        CREATE TYPE booking_status AS ENUM (
            'confirmed', 'absence_pending', 'absent', 'no_spot_after_rejection',
            'cancelled', 'no_show', 'attended'
        )
    """)
    op.execute("""
        ALTER TABLE bookings
            ALTER COLUMN status TYPE booking_status
            USING status::booking_status
    """)
    op.execute("ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'confirmed'")

    # ── absence_request_status ─────────────────────────────────────────────────
    op.execute("ALTER TABLE absence_requests ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TABLE absence_requests ALTER COLUMN status TYPE text")
    op.execute("DROP TYPE IF EXISTS absence_request_status")
    op.execute("""
        UPDATE absence_requests SET status = 'approved' WHERE status = 'confirmed'
    """)
    op.execute("""
        CREATE TYPE absence_request_status AS ENUM (
            'pending', 'approved', 'rejected', 'auto_approved', 'auto_rejected'
        )
    """)
    op.execute("""
        ALTER TABLE absence_requests
            ALTER COLUMN status TYPE absence_request_status
            USING status::absence_request_status
    """)
    op.execute("ALTER TABLE absence_requests ALTER COLUMN status SET DEFAULT 'pending'")
# Gym Backend

Production-oriented MVP backend on FastAPI with PostgreSQL, SQLAlchemy, Alembic, Redis-backed server-side sessions, webhook-based payments, and Celery background jobs.

## Architecture

- `app/api`: HTTP layer, validation, and dependencies.
- `app/services`: business logic for auth, access, orders, payments, sessions, and rate limits.
- `app/models`: SQLAlchemy models for PostgreSQL.
- `app/schemas`: request/response DTOs.
- `app/tasks`: Celery tasks for email, cleanup, and async webhook follow-up.
- `alembic`: migration environment and revisions.

## Core Flows

- Login/register creates a DB session record plus Redis session payload.
- Cookie stores only `session_id`; Redis stores `user_id`, `db_session_id`, and `csrf_token`.
- Refresh rotates the server-side session.
- Payment webhook verifies signature, persists `PaymentEvent`, deduplicates provider event id, marks `Order` as paid, and creates `AccessGrant`.

## Migration Flow

```bash
alembic upgrade head
```

## Environment

Application settings are loaded from `.env` in the project root.
Use `.env.example` as the base template for local setup.

Key variables:

- `DATABASE_URL`
- `REDIS_URL`
- `WEBHOOK_SECRET`
- `SESSION_TTL_SECONDS`
- `REFRESH_TOKEN_TTL_SECONDS`
- `CELERY_BROKER_URL`
- `CELERY_RESULT_BACKEND`

## Run

```bash
uvicorn app.main:app --reload
```

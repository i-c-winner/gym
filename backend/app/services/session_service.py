import secrets
from datetime import UTC, datetime
from typing import Any

from fastapi import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_token, hash_token
from app.db.redis import json_get, json_setex, redis_client
from app.models.session import Session as DbSession
from app.models.user import User


class SessionService:
    redis_prefix = "session:"
    refresh_prefix = "refresh:"

    async def create_session(
        self,
        db: AsyncSession,
        user: User,
        ip_address: str | None,
        user_agent: str | None,
    ) -> tuple[str, str, DbSession]:
        session_id, _ = create_token(settings.session_ttl_seconds)
        refresh_token, refresh_expires_at = create_token(settings.refresh_token_ttl_seconds)
        csrf_token = secrets.token_urlsafe(24)

        db_session = DbSession(
            user_id=user.id,
            refresh_token_hash=hash_token(refresh_token),
            refresh_expires_at=refresh_expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
            csrf_token=csrf_token,
        )
        db.add(db_session)
        await db.flush()

        await self.save_session_data(
            session_id=session_id,
            user_id=user.id,
            db_session_id=db_session.id,
            csrf_token=csrf_token,
        )
        await redis_client.setex(
            f"{self.refresh_prefix}{db_session.id}",
            settings.refresh_token_ttl_seconds,
            refresh_token,
        )
        return session_id, refresh_token, db_session

    async def save_session_data(self, session_id: str, user_id: str, db_session_id: str, csrf_token: str) -> None:
        await json_setex(
            f"{self.redis_prefix}{session_id}",
            settings.session_ttl_seconds,
            {
                "user_id": user_id,
                "db_session_id": db_session_id,
                "csrf_token": csrf_token,
            },
        )

    async def get_session_data(self, session_id: str | None) -> dict[str, Any] | None:
        if not session_id:
            return None
        return await json_get(f"{self.redis_prefix}{session_id}")

    async def revoke_session(self, db: AsyncSession, session_id: str | None, db_session_id: str | None) -> None:
        if session_id:
            await redis_client.delete(f"{self.redis_prefix}{session_id}")
        if db_session_id:
            await redis_client.delete(f"{self.refresh_prefix}{db_session_id}")
            db_session = await db.get(DbSession, db_session_id)
            if db_session and db_session.revoked_at is None:
                db_session.revoked_at = datetime.now(UTC)
                db_session.is_active = False

    def set_session_cookie(self, response: Response, session_id: str) -> None:
        response.set_cookie(
            key=settings.session_cookie_name,
            value=session_id,
            httponly=True,
            secure=settings.secure_cookies,
            samesite=settings.same_site,
            max_age=settings.session_ttl_seconds,
            domain=settings.session_cookie_domain,
            path="/",
        )

    def set_refresh_cookie(self, response: Response, refresh_token: str) -> None:
        response.set_cookie(
            key=settings.refresh_cookie_name,
            value=refresh_token,
            httponly=True,
            secure=settings.secure_cookies,
            samesite=settings.same_site,
            max_age=settings.refresh_token_ttl_seconds,
            domain=settings.session_cookie_domain,
            path="/",
        )

    def clear_session_cookie(self, response: Response) -> None:
        response.delete_cookie(
            key=settings.session_cookie_name,
            domain=settings.session_cookie_domain,
            path="/",
        )

    def clear_refresh_cookie(self, response: Response) -> None:
        response.delete_cookie(
            key=settings.refresh_cookie_name,
            domain=settings.session_cookie_domain,
            path="/",
        )

    async def validate_refresh_token(self, db_session: DbSession, raw_refresh_token: str | None) -> bool:
        if not raw_refresh_token or hash_token(raw_refresh_token) != db_session.refresh_token_hash:
            return False
        stored = await redis_client.get(f"{self.refresh_prefix}{db_session.id}")
        return stored == raw_refresh_token

    async def refresh(self, db: AsyncSession, current_db_session: DbSession) -> tuple[str, str, DbSession]:
        current_db_session.revoked_at = datetime.now(UTC)
        current_db_session.is_active = False
        user = await db.get(User, current_db_session.user_id)
        if user is None:
            raise ValueError("User not found for session refresh")
        return await self.create_session(
            db=db,
            user=user,
            ip_address=current_db_session.ip_address,
            user_agent=current_db_session.user_agent,
        )


session_service = SessionService()

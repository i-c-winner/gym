from typing import Any

from fastapi import Cookie, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.models.resource import Resource
from app.models.session import Session as DbSession
from app.models.user import User
from app.services.access_service import access_service
from app.services.resource_service import resource_service
from app.services.session_service import session_service


async def get_current_session(
    db: AsyncSession = Depends(get_db),
    session_id: str | None = Cookie(default=None, alias=settings.session_cookie_name),
) -> tuple[dict[str, Any], DbSession]:
    session_data = await session_service.get_session_data(session_id)
    if not session_data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session not found")
    db_session = await db.get(DbSession, session_data["db_session_id"])
    if not db_session or not db_session.is_active or db_session.revoked_at is not None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session revoked")
    return session_data, db_session


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    current_session: tuple[dict[str, Any], DbSession] = Depends(get_current_session),
) -> User:
    session_data, _ = current_session
    user = await db.get(User, session_data["user_id"])
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def csrf_protect(
    request: Request,
    current_session: tuple[dict[str, Any], DbSession] = Depends(get_current_session),
    csrf_token: str | None = Header(default=None, alias=settings.csrf_header_name),
) -> None:
    if request.method in settings.csrf_safe_methods:
        return
    session_data, _ = current_session
    if not csrf_token or csrf_token != session_data["csrf_token"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF validation failed")


async def get_resource_by_slug(slug: str, db: AsyncSession = Depends(get_db)) -> Resource:
    resource = await resource_service.get_by_slug(db, slug)
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    return resource


async def require_resource_access(
    resource: Resource = Depends(get_resource_by_slug),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Resource:
    await access_service.require_access(db, user.id, resource)
    return resource

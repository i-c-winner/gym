from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import csrf_protect, get_current_session, get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest
from app.services.auth_service import auth_service
from app.services.rate_limit_service import rate_limit_service
from app.services.session_service import session_service

router = APIRouter()


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register user",
    description="Creates a user and starts a server-side session. Provide telephone or telegram_id.",
)
async def register(payload: RegisterRequest, request: Request, response: Response, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    identifier = payload.telephone or payload.telegram_id or (request.client.host if request.client else "unknown")
    await rate_limit_service.check(
        rate_limit_service.register_bucket(identifier),
        settings.register_rate_limit,
        settings.rate_limit_window_seconds,
    )
    user = await auth_service.register(
        db,
        payload.telephone,
        payload.telegram_id,
        payload.first_name,
        payload.last_name,
        payload.age,
        payload.gender,
    )
    session_id, refresh_token, db_session = await session_service.create_session(
        db,
        user,
        request.client.host if request.client else None,
        request.headers.get("user-agent"),
    )
    await db.commit()
    session_service.set_session_cookie(response, session_id)
    session_service.set_refresh_cookie(response, refresh_token)
    return AuthResponse(
        user_id=user.id,
        telephone=user.telephone,
        telegram_id=user.telegram_id,
        first_name=user.first_name,
        last_name=user.last_name,
        age=user.age,
        gender=user.gender,
        csrf_token=db_session.csrf_token or "",
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Login user",
    description="Authenticates by telephone or telegram_id and issues session cookies.",
)
async def login(payload: LoginRequest, request: Request, response: Response, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    identifier = payload.telephone or payload.telegram_id or (request.client.host if request.client else "unknown")
    await rate_limit_service.check(
        rate_limit_service.login_bucket(identifier),
        settings.login_rate_limit,
        settings.rate_limit_window_seconds,
    )
    user = await auth_service.authenticate(
        db,
        telephone=payload.telephone,
        telegram_id=payload.telegram_id,
    )
    session_id, refresh_token, db_session = await session_service.create_session(
        db,
        user,
        request.client.host if request.client else None,
        request.headers.get("user-agent"),
    )
    await db.commit()
    session_service.set_session_cookie(response, session_id)
    session_service.set_refresh_cookie(response, refresh_token)
    return AuthResponse(
        user_id=user.id,
        telephone=user.telephone,
        telegram_id=user.telegram_id,
        first_name=user.first_name,
        last_name=user.last_name,
        age=user.age,
        gender=user.gender,
        csrf_token=db_session.csrf_token or "",
    )


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(csrf_protect)],
    summary="Logout user",
    description="Revokes the current server-side session. Requires X-CSRF-Token header.",
)
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_session: tuple[dict[str, Any], object] = Depends(get_current_session),
) -> Response:
    session_data, _ = current_session
    await session_service.revoke_session(db, request.cookies.get(settings.session_cookie_name), session_data["db_session_id"])
    await db.commit()
    session_service.clear_session_cookie(response)
    session_service.clear_refresh_cookie(response)
    return response


@router.post(
    "/refresh",
    response_model=AuthResponse,
    dependencies=[Depends(csrf_protect)],
    summary="Refresh session",
    description="Rotates the current session and refresh token. Requires X-CSRF-Token header.",
)
async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_session: tuple[dict[str, Any], object] = Depends(get_current_session),
    user: User = Depends(get_current_user),
) -> AuthResponse:
    session_data, db_session = current_session
    raw_refresh_token = request.cookies.get(settings.refresh_cookie_name)
    if not await session_service.validate_refresh_token(db_session, raw_refresh_token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    new_session_id, new_refresh_token, new_db_session = await session_service.refresh(db, db_session)
    await session_service.revoke_session(db, request.cookies.get(settings.session_cookie_name), session_data["db_session_id"])
    await db.commit()
    session_service.set_session_cookie(response, new_session_id)
    session_service.set_refresh_cookie(response, new_refresh_token)
    return AuthResponse(
        user_id=user.id,
        telephone=user.telephone,
        telegram_id=user.telegram_id,
        first_name=user.first_name,
        last_name=user.last_name,
        age=user.age,
        gender=user.gender,
        csrf_token=new_db_session.csrf_token or "",
    )

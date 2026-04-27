from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import csrf_protect, get_current_user
from app.db.session import get_db
from app.models.access_grant import AccessGrant
from app.models.user import User
from app.schemas.access import AccessGrantRead
from app.schemas.user import UserRead, UserUpdateRequest
from app.services.user_service import user_service

router = APIRouter()


@router.get("/me", response_model=UserRead, summary="Get current user")
async def me(user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(user)


@router.patch(
    "/me",
    response_model=UserRead,
    dependencies=[Depends(csrf_protect)],
    summary="Update current user",
    description="Partially updates the current user profile. Requires X-CSRF-Token header.",
)
async def update_me(
    payload: UserUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserRead:
    updated_user = await user_service.update_profile(db, user, **payload.model_dump(exclude_unset=True))
    await db.commit()
    await db.refresh(updated_user)
    return UserRead.model_validate(updated_user)


@router.get("/me/accesses", response_model=list[AccessGrantRead])
async def my_accesses(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[AccessGrantRead]:
    accesses = (await db.scalars(select(AccessGrant).where(AccessGrant.user_id == user.id))).all()
    return [AccessGrantRead.model_validate(access) for access in accesses]

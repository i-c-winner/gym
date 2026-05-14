from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.models.access_grant import AccessGrant
from app.models.resource import Resource
from app.models.user import User

router = APIRouter()


def require_admin_secret(x_admin_secret: str | None = Header(default=None)) -> None:
    if not settings.admin_secret or x_admin_secret != settings.admin_secret:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


class RevokeAccessRequest(BaseModel):
    telegram_id: str
    resource_slug: str


class RevokeAccessResponse(BaseModel):
    revoked: bool
    grants_removed: int
    telegram_id: str
    resource_slug: str


@router.post(
    "/revoke-access",
    response_model=RevokeAccessResponse,
    dependencies=[Depends(require_admin_secret)],
    summary="Revoke user access to a resource",
    description="Deletes all AccessGrants for the given telegram_id + resource_slug. Requires X-Admin-Secret header.",
)
async def revoke_access(
    payload: RevokeAccessRequest,
    db: AsyncSession = Depends(get_db),
) -> RevokeAccessResponse:
    user = await db.scalar(select(User).where(User.telegram_id == payload.telegram_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    resource = await db.scalar(select(Resource).where(Resource.slug == payload.resource_slug))
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")

    result = await db.execute(
        delete(AccessGrant)
        .where(AccessGrant.user_id == user.id, AccessGrant.resource_id == resource.id)
        .returning(AccessGrant.id)
    )
    grants_removed = len(result.fetchall())
    await db.commit()

    return RevokeAccessResponse(
        revoked=grants_removed > 0,
        grants_removed=grants_removed,
        telegram_id=payload.telegram_id,
        resource_slug=payload.resource_slug,
    )
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.access_grant import AccessGrant
from app.models.resource import Resource


class AccessService:
    async def user_has_access(self, db: AsyncSession, user_id: str, resource_id: str) -> bool:
        now = datetime.now(UTC)
        stmt = select(AccessGrant.id).where(
            AccessGrant.user_id == user_id,
            AccessGrant.resource_id == resource_id,
            AccessGrant.starts_at <= now,
            or_(AccessGrant.is_lifetime.is_(True), AccessGrant.expires_at > now),
        )
        result = await db.execute(stmt)
        return result.first() is not None

    async def require_access(self, db: AsyncSession, user_id: str, resource: Resource) -> None:
        if not await self.user_has_access(db, user_id, resource.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


access_service = AccessService()

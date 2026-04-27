from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.redis import json_get, json_setex
from app.models.resource import Resource


class ResourceService:
    cache_prefix = "resource-by-slug:"

    async def list_resources(self, db: AsyncSession) -> list[Resource]:
        result = await db.scalars(select(Resource).where(Resource.is_active.is_(True)))
        return list(result.all())

    async def get_by_slug(self, db: AsyncSession, slug: str) -> Resource | None:
        cache_key = f"{self.cache_prefix}{slug}"
        cached = await json_get(cache_key)
        if cached:
            resource = await db.get(Resource, cached["id"])
            if resource:
                return resource

        resource = await db.scalar(select(Resource).where(Resource.slug == slug, Resource.is_active.is_(True)))
        if resource:
            await json_setex(cache_key, settings.resource_cache_ttl_seconds, {"id": resource.id})
        return resource


resource_service = ResourceService()

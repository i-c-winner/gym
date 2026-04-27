from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_resource_by_slug, require_resource_access
from app.db.session import get_db
from app.models.resource import Resource
from app.schemas.resource import ResourceContentRead, ResourceRead
from app.services.resource_service import resource_service

router = APIRouter()


@router.get("/resources", response_model=list[ResourceRead])
async def list_resources(db: AsyncSession = Depends(get_db)) -> list[ResourceRead]:
    return [ResourceRead.model_validate(item) for item in await resource_service.list_resources(db)]


@router.get("/resources/{slug}", response_model=ResourceRead)
async def get_resource(resource: Resource = Depends(get_resource_by_slug)) -> ResourceRead:
    return ResourceRead.model_validate(resource)


@router.get("/resources/{slug}/content", response_model=ResourceContentRead)
async def get_resource_content(resource: Resource = Depends(require_resource_access)) -> ResourceContentRead:
    return ResourceContentRead(slug=resource.slug, content=resource.content_url or "Protected content")

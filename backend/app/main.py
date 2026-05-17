from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.deps import DEV_USER_ID
from app.api.router import api_router
from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole


async def _ensure_dev_user() -> None:
    if not settings.dev_secret:
        return
    async with AsyncSessionLocal() as db:
        existing = await db.get(User, DEV_USER_ID)
        if not existing:
            user = User(
                id=DEV_USER_ID,
                role=UserRole.ADMIN,
                first_name="Dev",
                last_name="Admin",
            )
            db.add(user)
            await db.commit()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    await _ensure_dev_user()
    yield


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router, prefix=settings.api_prefix)

    @app.get("/health", tags=["health"])
    async def healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models import *  # noqa: F403


@pytest_asyncio.fixture
async def db_session() -> AsyncSession:
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )
    testing_session_local = async_sessionmaker(bind=engine, autocommit=False, autoflush=False, expire_on_commit=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with testing_session_local() as session:
        yield session
    await engine.dispose()

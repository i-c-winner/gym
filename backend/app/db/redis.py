import json
from typing import Any

from redis.asyncio import Redis

from app.core.config import settings

redis_client = Redis.from_url(settings.redis_url, decode_responses=True)


async def json_get(key: str) -> dict[str, Any] | None:
    value = await redis_client.get(key)
    return json.loads(value) if value else None


async def json_setex(key: str, ttl_seconds: int, value: dict[str, Any]) -> None:
    await redis_client.setex(key, ttl_seconds, json.dumps(value))

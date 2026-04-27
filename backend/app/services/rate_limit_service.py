from fastapi import HTTPException, status

from app.db.redis import redis_client


class RateLimitService:
    async def check(self, bucket: str, limit: int, window_seconds: int) -> None:
        current = await redis_client.incr(bucket)
        if current == 1:
            await redis_client.expire(bucket, window_seconds)
        if current > limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests",
            )

    def login_bucket(self, identifier: str) -> str:
        return f"ratelimit:login:{identifier}"

    def register_bucket(self, identifier: str) -> str:
        return f"ratelimit:register:{identifier}"


rate_limit_service = RateLimitService()

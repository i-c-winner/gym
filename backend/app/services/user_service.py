from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserService:
    @staticmethod
    def normalize(value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    async def update_profile(
        self,
        db: AsyncSession,
        user: User,
        **updates,
    ) -> User:
        normalized_updates = dict(updates)
        for key in ("telephone", "telegram_id", "first_name", "last_name", "gender"):
            if key in normalized_updates:
                normalized_updates[key] = self.normalize(normalized_updates[key])

        telephone = normalized_updates.get("telephone", user.telephone)
        telegram_id = normalized_updates.get("telegram_id", user.telegram_id)

        if "telephone" in normalized_updates and telephone and telephone != user.telephone:
            existing = await db.scalar(select(User).where(User.telephone == telephone, User.id != user.id))
            if existing:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Telephone already registered")

        if "telegram_id" in normalized_updates and telegram_id and telegram_id != user.telegram_id:
            existing = await db.scalar(select(User).where(User.telegram_id == telegram_id, User.id != user.id))
            if existing:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Telegram ID already registered")

        for field, value in normalized_updates.items():
            setattr(user, field, value)
        await db.flush()
        return user


user_service = UserService()

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class AuthService:
    @staticmethod
    def normalize_telephone(telephone: str | None) -> str | None:
        if not telephone:
            return None
        return telephone.strip()

    @staticmethod
    def normalize_telegram_id(telegram_id: str | None) -> str | None:
        if not telegram_id:
            return None
        return telegram_id.strip()

    async def register(
        self,
        db: AsyncSession,
        telephone: str | None,
        telegram_id: str | None,
        first_name: str | None = None,
        last_name: str | None = None,
        age: int | None = None,
        gender: str | None = None,
    ) -> User:
        telephone = self.normalize_telephone(telephone)
        telegram_id = self.normalize_telegram_id(telegram_id)

        if telephone:
            existing = await db.scalar(select(User).where(User.telephone == telephone))
            if existing:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Telephone already registered")

        if telegram_id:
            existing = await db.scalar(select(User).where(User.telegram_id == telegram_id))
            if existing:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Telegram ID already registered")

        user = User(
            telephone=telephone,
            telegram_id=telegram_id,
            first_name=first_name.strip() if first_name else None,
            last_name=last_name.strip() if last_name else None,
            age=age,
            gender=gender.strip() if gender else None,
        )
        db.add(user)
        await db.flush()
        return user

    async def authenticate(
        self,
        db: AsyncSession,
        telephone: str | None = None,
        telegram_id: str | None = None,
    ) -> User:
        telephone = self.normalize_telephone(telephone)
        telegram_id = self.normalize_telegram_id(telegram_id)

        filters = []
        if telephone:
            filters.append(User.telephone == telephone)
        if telegram_id:
            filters.append(User.telegram_id == telegram_id)

        if not filters:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Login identifier is required")

        user = await db.scalar(select(User).where(or_(*filters)))
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        return user


auth_service = AuthService()

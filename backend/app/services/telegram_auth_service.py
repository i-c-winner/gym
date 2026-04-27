import hashlib
import hmac
import time
from typing import Any

from fastapi import HTTPException, status

from app.core.config import settings


class TelegramAuthService:
    @staticmethod
    def _build_data_check_string(payload: dict[str, Any]) -> str:
        items = []
        for key, value in payload.items():
            if key == "hash" or value is None:
                continue
            items.append(f"{key}={value}")
        return "\n".join(sorted(items))

    def verify_login_payload(self, payload: dict[str, Any]) -> dict[str, Any]:
        bot_token = settings.telegram_bot_token
        if not bot_token:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Telegram bot token is not configured",
            )

        received_hash = payload.get("hash")
        if not isinstance(received_hash, str) or not received_hash:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Telegram auth payload")

        auth_date = payload.get("auth_date")
        if not isinstance(auth_date, int):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Telegram auth payload")

        if int(time.time()) - auth_date > settings.telegram_auth_max_age_seconds:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Telegram auth payload expired")

        secret_key = hashlib.sha256(bot_token.encode()).digest()
        data_check_string = self._build_data_check_string(payload)
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

        if not hmac.compare_digest(calculated_hash, received_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Telegram auth payload")

        return payload


telegram_auth_service = TelegramAuthService()

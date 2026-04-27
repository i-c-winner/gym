import hashlib
import hmac
import time
from types import SimpleNamespace
from typing import Any

import pytest
from fastapi import HTTPException

import app.services.telegram_auth_service as telegram_auth_module
from app.services.telegram_auth_service import telegram_auth_service


def signed_payload(bot_token: str, payload: dict[str, Any]) -> dict[str, Any]:
    data_check_string = "\n".join(f"{key}={value}" for key, value in sorted(payload.items()) if value is not None)
    secret_key = hashlib.sha256(bot_token.encode()).digest()
    payload["hash"] = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    return payload


def test_verify_login_payload_accepts_valid_hash(monkeypatch: pytest.MonkeyPatch) -> None:
    bot_token = "123456:test-token"
    monkeypatch.setattr(
        telegram_auth_module,
        "settings",
        SimpleNamespace(telegram_bot_token=bot_token, telegram_auth_max_age_seconds=86400),
    )
    payload = signed_payload(
        bot_token,
        {
            "id": 123456789,
            "first_name": "Ali",
            "last_name": None,
            "auth_date": int(time.time()),
        },
    )

    verified = telegram_auth_service.verify_login_payload(payload)

    assert verified["id"] == 123456789
    assert verified["first_name"] == "Ali"


def test_verify_login_payload_rejects_invalid_hash(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        telegram_auth_module,
        "settings",
        SimpleNamespace(telegram_bot_token="123456:test-token", telegram_auth_max_age_seconds=86400),
    )

    with pytest.raises(HTTPException) as exc_info:
        telegram_auth_service.verify_login_payload(
            {
                "id": 123456789,
                "first_name": "Ali",
                "auth_date": int(time.time()),
                "hash": "invalid",
            }
        )

    assert exc_info.value.status_code == 401

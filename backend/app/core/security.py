import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta

from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def now_utc() -> datetime:
    return datetime.now(UTC)


def create_token(ttl_seconds: int) -> tuple[str, datetime]:
    expires_at = now_utc() + timedelta(seconds=ttl_seconds)
    return secrets.token_urlsafe(32), expires_at


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def sign_webhook(payload: bytes) -> str:
    return hmac.new(
        settings.webhook_secret.encode("utf-8"),
        payload,
        hashlib.sha256,
    ).hexdigest()


def verify_webhook_signature(payload: bytes, signature: str | None) -> bool:
    if not signature:
        return False
    expected = sign_webhook(payload)
    return hmac.compare_digest(expected, signature)

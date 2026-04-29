import os
from dataclasses import dataclass
from pathlib import Path


def load_dotenv(path: str = ".env") -> None:
    env_path = Path(path)
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def env_str(name: str, default: str) -> str:
    return os.getenv(name, default)


def env_int(name: str, default: int) -> int:
    value = os.getenv(name)
    return int(value) if value not in (None, "") else default


def env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def env_optional_str(name: str) -> str | None:
    value = os.getenv(name)
    return value if value not in (None, "") else None


def env_list(name: str, default: tuple[str, ...]) -> tuple[str, ...]:
    value = os.getenv(name)
    if value in (None, ""):
        return default
    return tuple(item.strip() for item in value.split(",") if item.strip())


def normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


load_dotenv()








@dataclass(frozen=True)
class Settings:
    app_name: str = env_str("APP_NAME", "Gym Backend")
    api_prefix: str = env_str("API_PREFIX", "/api/v1")
    database_url: str = normalize_database_url(
        env_str("DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/gym")
    )
    redis_url: str = env_str("REDIS_URL", "redis://localhost:6379/0")
    host: str = env_str("HOST", "0.0.0.0")
    port: int = env_int("PORT", 8000)
    session_cookie_name: str = env_str("SESSION_COOKIE_NAME", "sid")
    refresh_cookie_name: str = env_str("REFRESH_COOKIE_NAME", "refresh_token")
    session_ttl_seconds: int = env_int("SESSION_TTL_SECONDS", 60 * 60)
    refresh_token_ttl_seconds: int = env_int("REFRESH_TOKEN_TTL_SECONDS", 60 * 60 * 24 * 30)
    secure_cookies: bool = env_bool("SECURE_COOKIES", True)
    same_site: str = env_str("SAME_SITE", "lax")
    cors_origins: tuple[str, ...] = env_list(
        "CORS_ORIGINS",
        (
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ),
    )
    webhook_secret: str = env_str("WEBHOOK_SECRET", "change-me")
    csrf_header_name: str = env_str("CSRF_HEADER_NAME", "X-CSRF-Token")
    celery_broker_url: str = env_str("CELERY_BROKER_URL", "redis://localhost:6379/1")
    celery_result_backend: str = env_str("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")
    login_rate_limit: int = env_int("LOGIN_RATE_LIMIT", 5)
    register_rate_limit: int = env_int("REGISTER_RATE_LIMIT", 5)
    rate_limit_window_seconds: int = env_int("RATE_LIMIT_WINDOW_SECONDS", 60)
    resource_cache_ttl_seconds: int = env_int("RESOURCE_CACHE_TTL_SECONDS", 300)
    default_from_email: str = env_str("DEFAULT_FROM_EMAIL", "no-reply@example.com")
    telegram_bot_token: str | None = env_optional_str("TELEGRAM_BOT_TOKEN")
    telegram_auth_max_age_seconds: int = env_int("TELEGRAM_AUTH_MAX_AGE_SECONDS", 60 * 60 * 24)
    session_cookie_domain: str | None = env_optional_str("SESSION_COOKIE_DOMAIN")
    access_content_placeholder: str = env_str("ACCESS_CONTENT_PLACEHOLDER", "Protected resource content.")
    webhook_signature_header: str = env_str("WEBHOOK_SIGNATURE_HEADER", "X-Payment-Signature")
    csrf_safe_methods: tuple[str, ...] = ("GET", "HEAD", "OPTIONS")


settings = Settings()

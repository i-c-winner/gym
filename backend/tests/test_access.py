from datetime import UTC, datetime, timedelta

from app.models.access_grant import AccessGrant
from app.models.resource import Resource
from app.models.user import User
from app.services.access_service import access_service


async def test_user_has_lifetime_access(db_session) -> None:
    user = User(telephone="+998900000101")
    resource = Resource(slug="pro", title="Pro")
    db_session.add_all([user, resource])
    await db_session.flush()

    db_session.add(
        AccessGrant(
            user_id=user.id,
            resource_id=resource.id,
            grant_type="lifetime",
            starts_at=datetime.now(UTC) - timedelta(days=1),
            expires_at=None,
            is_lifetime=True,
        )
    )
    await db_session.commit()

    assert await access_service.user_has_access(db_session, user.id, resource.id) is True


async def test_user_has_no_access_when_expired(db_session) -> None:
    user = User(telephone="+998900000102")
    resource = Resource(slug="basic", title="Basic")
    db_session.add_all([user, resource])
    await db_session.flush()

    db_session.add(
        AccessGrant(
            user_id=user.id,
            resource_id=resource.id,
            grant_type="1m",
            starts_at=datetime.now(UTC) - timedelta(days=40),
            expires_at=datetime.now(UTC) - timedelta(days=1),
            is_lifetime=False,
        )
    )
    await db_session.commit()

    assert await access_service.user_has_access(db_session, user.id, resource.id) is False

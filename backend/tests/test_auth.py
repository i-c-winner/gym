from app.services.auth_service import auth_service


async def test_register_creates_user(db_session) -> None:
    user = await auth_service.register(
        db_session,
        telephone="+998900000001",
        telegram_id=None,
        first_name="Ali",
        last_name="Valiyev",
        age=28,
        gender="male",
    )
    await db_session.commit()

    assert user.telephone == "+998900000001"
    assert user.first_name == "Ali"


async def test_authenticate_by_telephone(db_session) -> None:
    user = await auth_service.register(
        db_session,
        telephone="+998900000002",
        telegram_id=None,
    )
    await db_session.commit()

    authenticated = await auth_service.authenticate(
        db_session,
        telephone="+998900000002",
    )

    assert authenticated.id == user.id


async def test_authenticate_by_telegram_id(db_session) -> None:
    user = await auth_service.register(
        db_session,
        telephone=None,
        telegram_id="987654321",
    )
    await db_session.commit()

    authenticated = await auth_service.authenticate(
        db_session,
        telegram_id="987654321",
    )

    assert authenticated.id == user.id


async def test_authenticate_without_password(db_session) -> None:
    user = await auth_service.register(
        db_session,
        telephone=None,
        telegram_id="123123123",
    )
    await db_session.commit()

    authenticated = await auth_service.authenticate(
        db_session,
        telegram_id="123123123",
    )

    assert authenticated.id == user.id


async def test_authenticate_by_existing_identifier(db_session) -> None:
    await auth_service.register(
        db_session,
        telephone="+998900000003",
        telegram_id=None,
    )
    await db_session.commit()

    authenticated = await auth_service.authenticate(db_session, telephone="+998900000003")
    assert authenticated.telephone == "+998900000003"

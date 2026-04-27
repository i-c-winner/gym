from app.models.order import Order, OrderStatus
from app.models.plan import Plan, PlanDuration
from app.models.resource import Resource
from app.models.user import User
from app.services.payment_service import payment_service


async def test_payment_webhook_marks_order_paid_and_creates_access(db_session) -> None:
    user = User(telephone="+998900000103")
    resource = Resource(slug="resource-1", title="Resource 1")
    db_session.add_all([user, resource])
    await db_session.flush()

    plan = Plan(
        resource_id=resource.id,
        code="pro-1m",
        title="1 month",
        duration_type=PlanDuration.MONTH_1,
        duration_months=1,
        price_amount=10,
        currency="USD",
    )
    db_session.add(plan)
    await db_session.flush()

    order = Order(
        user_id=user.id,
        resource_id=resource.id,
        plan_id=plan.id,
        amount=10,
        currency="USD",
        provider="demo",
        status=OrderStatus.PENDING,
    )
    db_session.add(order)
    await db_session.commit()

    event = await payment_service.process_webhook(
        db_session,
        provider="demo",
        event_id="evt-1",
        event_type="payment.succeeded",
        order_id=order.id,
        payload={"ok": True},
        signature="sig",
    )
    await db_session.commit()

    assert event.status.value == "processed"
    await db_session.refresh(order)
    assert order.status == OrderStatus.PAID

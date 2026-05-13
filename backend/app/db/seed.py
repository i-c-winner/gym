"""
Run once to populate initial resources and plans:
    python -m app.db.seed
"""

import asyncio
import uuid

from sqlalchemy import text

from app.db.session import AsyncSessionLocal

RESOURCES = [
    {
        "slug": "flexibility",
        "title": "Гибкость тела",
        "description": "Мягкая растяжка, мобильность суставов и восстановление после нагрузок.",
    },
    {
        "slug": "strength",
        "title": "Сила и выносливость",
        "description": "Комплекс тренировок для устойчивости корпуса, ног и ровного темпа.",
    },
    {
        "slug": "split",
        "title": "Шпагат за 30 дней",
        "description": "Пошаговая программа для безопасной глубокой растяжки и контроля техники.",
    },
    {
        "slug": "rhythmic",
        "title": "Художественная гимнастика",
        "description": "Грация, баланс, координация и базовые элементы для уверенного движения.",
    },
]

PLANS_PER_RESOURCE = [
    {"code": "1m", "title": "1 месяц", "duration_type": "1m", "duration_months": 1, "price_amount": "9.99"},
    {"code": "3m", "title": "3 месяца", "duration_type": "3m", "duration_months": 3, "price_amount": "24.99"},
    {"code": "lifetime", "title": "Навсегда", "duration_type": "lifetime", "duration_months": None, "price_amount": "49.99"},
]


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        for resource_data in RESOURCES:
            row = await db.execute(
                text("SELECT id FROM resources WHERE slug = :slug"),
                {"slug": resource_data["slug"]},
            )
            if row.first():
                print(f"  skip resource '{resource_data['slug']}' (already exists)")
                continue

            resource_id = str(uuid.uuid4())
            await db.execute(
                text(
                    "INSERT INTO resources (id, slug, title, description, is_active) "
                    "VALUES (:id, :slug, :title, :description, true)"
                ),
                {"id": resource_id, **resource_data},
            )

            for plan in PLANS_PER_RESOURCE:
                await db.execute(
                    text(
                        "INSERT INTO plans (id, resource_id, code, title, duration_type, duration_months, price_amount, currency, is_active) "
                        "VALUES (:id, :resource_id, :code, :title, CAST(:duration_type AS plan_duration), :duration_months, :price_amount, 'USD', true)"
                    ),
                    {"id": str(uuid.uuid4()), "resource_id": resource_id, **plan},
                )

            print(f"  created resource '{resource_data['slug']}' with {len(PLANS_PER_RESOURCE)} plans")

        await db.commit()
    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
from fastapi import APIRouter

from app.api.routes import admin, auth, currency, gym_admin, gym_classes, orders, payments, plans, resources, trainer, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(resources.router, tags=["resources"])
api_router.include_router(plans.router, tags=["plans"])
api_router.include_router(orders.router, tags=["orders"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(currency.router)
api_router.include_router(gym_admin.router)
api_router.include_router(trainer.router)
api_router.include_router(gym_classes.router)
from fastapi import APIRouter

from app.api.routes import auth, orders, payments, plans, resources, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(resources.router, tags=["resources"])
api_router.include_router(plans.router, tags=["plans"])
api_router.include_router(orders.router, tags=["orders"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])

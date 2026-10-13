from fastapi import APIRouter

from ai_api.api.v1 import assist, health

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(assist.router)

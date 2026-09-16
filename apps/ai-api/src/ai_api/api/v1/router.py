from fastapi import APIRouter

from ai_api.api.v1 import assist, chat, health, intelligence

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(assist.router)
api_router.include_router(intelligence.router)
api_router.include_router(chat.router)

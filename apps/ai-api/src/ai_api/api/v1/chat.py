from fastapi import APIRouter

from ai_api.api.deps import ChatServiceDep, InternalAuthDep
from ai_api.api.errors import raise_upstream_error
from ai_api.domain.errors import AiApiError
from ai_api.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    service: ChatServiceDep,
    _: InternalAuthDep,
) -> ChatResponse:
    """Read-only, context-grounded reply for a Personal OS chat session."""
    try:
        return await service.reply(body)
    except AiApiError as error:
        raise_upstream_error(error)

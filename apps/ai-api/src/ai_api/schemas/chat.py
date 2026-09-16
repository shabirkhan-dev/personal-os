from typing import Any, Literal

from pydantic import Field

from ai_api.schemas.base import CamelModel
from ai_api.schemas.intelligence import SourceRef, SuggestedAction

ChatTurnRole = Literal["user", "assistant"]


class ChatTurn(CamelModel):
    role: ChatTurnRole
    content: str = Field(min_length=1, max_length=4_000)


class ChatEntity(CamelModel):
    type: str = Field(min_length=1, max_length=64)
    id: str = Field(min_length=1, max_length=128)


class ChatContext(CamelModel):
    route: str | None = Field(default=None, max_length=200)
    entity: ChatEntity | None = None
    date: str | None = Field(default=None, max_length=10)
    personal_os: Any = Field(
        default=None,
        alias="personalOS",
        serialization_alias="personalOS",
        description="Minimal authorized snapshot Nest adds when the caller gave no other context.",
    )


class ChatRequest(CamelModel):
    messages: list[ChatTurn] = Field(min_length=1, max_length=40)
    context: ChatContext | None = None


class ChatResponse(CamelModel):
    reply: str = Field(min_length=1, max_length=8_000)
    provider: str
    model: str
    sources: list[SourceRef] | None = None
    suggestions: list[SuggestedAction] | None = None

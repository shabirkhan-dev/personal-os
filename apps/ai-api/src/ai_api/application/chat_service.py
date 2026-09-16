from collections.abc import Mapping
from typing import Any

from pydantic import ValidationError

from ai_api.domain.errors import InvalidStructuredOutputError
from ai_api.domain.ports import LlmProvider
from ai_api.schemas.chat import ChatRequest, ChatResponse

CHAT_INSTRUCTIONS = """\
You are Personal OS Chat, a read-only assistant inside a personal life operating system.

Answer using the supplied conversation and context. Treat the context as the only source of truth
about the user's records: never invent routines, items, transactions, budgets, amounts, or dates,
and never claim to have created, changed, or deleted anything. If the context cannot answer the
question, say so plainly and point the user at the screen that can.

Return one JSON object shaped exactly like this:
{
  "reply": "<the answer, in plain prose>",
  "sources": [
    {
      "type": "routine" | "routine_item" | "finance_transaction" | "budget" | "day",
      "id": "<an id that appears in the context>",
      "label": "<human readable label>"
    }
  ],
  "suggestions": [
    {
      "title": "<non-mutating next step>",
      "detail": "<optional>",
      "kind": "navigation" | "informational"
    }
  ]
}

Rules:
- every sources[].id must be copied from the context, never invented;
- omit "sources" and "suggestions" when you have nothing grounded to cite;
- never describe an action you took.
"""


class ChatService:
    def __init__(self, provider: LlmProvider) -> None:
        self._provider = provider

    async def reply(self, request: ChatRequest) -> ChatResponse:
        result = await self._provider.complete_json(
            task="chat",
            instructions=CHAT_INSTRUCTIONS,
            context=_chat_context(request),
        )
        try:
            return ChatResponse.model_validate(
                {**result.payload, "provider": result.provider, "model": result.model}
            )
        except ValidationError as error:
            raise InvalidStructuredOutputError("chat") from error


def _chat_context(request: ChatRequest) -> Mapping[str, Any]:
    payload: dict[str, Any] = {
        "messages": [{"role": turn.role, "content": turn.content} for turn in request.messages],
    }

    context = request.context
    if context is None:
        return payload

    if context.route is not None:
        payload["route"] = context.route
    if context.entity is not None:
        payload["entity"] = {"type": context.entity.type, "id": context.entity.id}
    if context.date is not None:
        payload["date"] = context.date
    if context.personal_os is not None:
        payload["personalOS"] = context.personal_os
    return payload

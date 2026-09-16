from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any, Literal, Protocol

ChatRole = Literal["system", "user", "assistant"]
StructuredTask = Literal["daily_intelligence", "chat"]


@dataclass(frozen=True, slots=True)
class ChatMessage:
    role: ChatRole
    content: str


@dataclass(frozen=True, slots=True)
class CompletionResult:
    content: str
    provider: str
    model: str


@dataclass(frozen=True, slots=True)
class StructuredResult:
    """Decoded JSON from a provider.

    The payload is deliberately unvalidated: each caller validates it against its own schema so a
    non-conforming response becomes a domain error instead of a wrong answer.
    """

    payload: Mapping[str, Any]
    provider: str
    model: str


class LlmProvider(Protocol):
    """Port for language model backends."""

    @property
    def name(self) -> str: ...

    @property
    def model(self) -> str: ...

    async def complete(self, messages: list[ChatMessage]) -> CompletionResult: ...

    async def complete_json(
        self,
        *,
        task: StructuredTask,
        instructions: str,
        context: Mapping[str, Any],
    ) -> StructuredResult: ...

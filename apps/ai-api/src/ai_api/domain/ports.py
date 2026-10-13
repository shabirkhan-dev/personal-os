from dataclasses import dataclass
from typing import Literal, Protocol

ChatRole = Literal["system", "user", "assistant"]


@dataclass(frozen=True, slots=True)
class ChatMessage:
    role: ChatRole
    content: str


@dataclass(frozen=True, slots=True)
class CompletionResult:
    content: str
    provider: str
    model: str


class LlmProvider(Protocol):
    """Port for language model backends."""

    @property
    def name(self) -> str: ...

    @property
    def model(self) -> str: ...

    async def complete(self, messages: list[ChatMessage]) -> CompletionResult: ...

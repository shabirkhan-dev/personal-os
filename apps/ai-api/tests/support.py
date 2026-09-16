from collections.abc import Mapping
from typing import Any

from ai_api.domain.ports import ChatMessage, StructuredResult, StructuredTask


def collect_strings(value: Any) -> set[str]:
    """Every string reachable inside a payload.

    Used to prove grounding: a cited source id must appear somewhere in the context the service
    was given, so an invented id fails the test.
    """

    if isinstance(value, str):
        return {value}
    if isinstance(value, Mapping):
        found: set[str] = set()
        for item in value.values():
            found |= collect_strings(item)
        return found
    if isinstance(value, (list, tuple)):
        found = set()
        for item in value:
            found |= collect_strings(item)
        return found
    return set()


class StubProvider:
    """Returns a fixed payload so tests can exercise invalid and provider-failure paths."""

    def __init__(
        self,
        payload: Mapping[str, Any] | None = None,
        *,
        name: str = "stub",
        model: str = "stub-v1",
        error: Exception | None = None,
    ) -> None:
        self._payload = payload if payload is not None else {}
        self._name = name
        self._model = model
        self._error = error

    @property
    def name(self) -> str:
        return self._name

    @property
    def model(self) -> str:
        return self._model

    async def complete(self, messages: list[ChatMessage]) -> Any:
        raise AssertionError("complete() is not expected in these tests")

    async def complete_json(
        self,
        *,
        task: StructuredTask,
        instructions: str,
        context: Mapping[str, Any],
    ) -> StructuredResult:
        if self._error is not None:
            raise self._error
        return StructuredResult(payload=self._payload, provider=self._name, model=self._model)

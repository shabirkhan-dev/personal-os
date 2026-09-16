import json
from collections.abc import Mapping
from typing import Any

import httpx

from ai_api.config.settings import Settings
from ai_api.domain.errors import ProviderError
from ai_api.domain.ports import (
    ChatMessage,
    CompletionResult,
    StructuredResult,
    StructuredTask,
)


class OpenAICompatibleProvider:
    def __init__(self, settings: Settings) -> None:
        if settings.openai_api_key is None:
            raise ProviderError("OPENAI_API_KEY is not configured")
        self._settings = settings
        self._api_key = settings.openai_api_key.get_secret_value()

    @property
    def name(self) -> str:
        return "openai_compatible"

    @property
    def model(self) -> str:
        return self._settings.openai_model

    async def complete(self, messages: list[ChatMessage]) -> CompletionResult:
        content = await self._completion(messages, temperature=0.4, json_mode=False)
        return CompletionResult(content=content, provider=self.name, model=self.model)

    async def complete_json(
        self,
        *,
        task: StructuredTask,
        instructions: str,
        context: Mapping[str, Any],
    ) -> StructuredResult:
        messages = [
            ChatMessage(role="system", content=instructions),
            ChatMessage(
                role="user",
                content=json.dumps({"task": task, "context": context}, default=str),
            ),
        ]
        content = await self._completion(messages, temperature=0.2, json_mode=True)

        try:
            decoded = json.loads(content)
        except json.JSONDecodeError as error:
            raise ProviderError("Provider returned unparseable JSON") from error

        if not isinstance(decoded, dict):
            raise ProviderError("Provider returned JSON that is not an object")

        return StructuredResult(payload=decoded, provider=self.name, model=self.model)

    async def _completion(
        self,
        messages: list[ChatMessage],
        *,
        temperature: float,
        json_mode: bool,
    ) -> str:
        url = f"{self._settings.openai_base_url.rstrip('/')}/chat/completions"
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": [
                {"role": message.role, "content": message.content} for message in messages
            ],
            "temperature": temperature,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPError as error:
            raise ProviderError(f"Provider request failed: {error}") from error

        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as error:
            raise ProviderError("Provider returned an unexpected response shape") from error

        if not isinstance(content, str) or not content.strip():
            raise ProviderError("Provider returned an empty completion")

        return content.strip()

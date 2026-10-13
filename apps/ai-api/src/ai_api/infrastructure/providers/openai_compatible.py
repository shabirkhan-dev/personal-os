import httpx

from ai_api.config.settings import Settings
from ai_api.domain.errors import ProviderError
from ai_api.domain.ports import ChatMessage, CompletionResult


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
        url = f"{self._settings.openai_base_url.rstrip('/')}/chat/completions"
        payload = {
            "model": self.model,
            "messages": [
                {"role": message.role, "content": message.content} for message in messages
            ],
            "temperature": 0.4,
        }
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

        return CompletionResult(content=content.strip(), provider=self.name, model=self.model)

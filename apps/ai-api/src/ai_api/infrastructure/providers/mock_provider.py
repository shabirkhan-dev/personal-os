from ai_api.domain.ports import ChatMessage, CompletionResult


class MockLlmProvider:
    @property
    def name(self) -> str:
        return "mock"

    @property
    def model(self) -> str:
        return "mock-assist-v1"

    async def complete(self, messages: list[ChatMessage]) -> CompletionResult:
        user_turns = [message.content for message in messages if message.role == "user"]
        last = user_turns[-1] if user_turns else "Hello"
        reply = (
            "I'm Personal OS Assist (mock provider). "
            f'You said: "{last[:280]}". '
            "Wire OPENAI_API_KEY and set AI_PROVIDER=openai_compatible for a real model."
        )
        return CompletionResult(content=reply, provider=self.name, model=self.model)

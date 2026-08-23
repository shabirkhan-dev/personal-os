from ai_api.domain.ports import ChatMessage, CompletionResult, LlmProvider

SYSTEM_PROMPT = (
    "You are Personal OS Assist, a helpful in-app assistant for a Bun + Turborepo "
    "monorepo (Next.js, Expo, NestJS, docs, Rust). Be concise, practical, "
    "and never invent secrets or claim to execute privileged actions. You propose "
    "guidance only; humans and NestJS own writes, policy, and audit."
)


class AssistService:
    def __init__(self, provider: LlmProvider) -> None:
        self._provider = provider

    async def assist(
        self,
        *,
        messages: list[ChatMessage],
        context: str | None,
    ) -> CompletionResult:
        system_content = SYSTEM_PROMPT
        if context and context.strip():
            system_content = f"{SYSTEM_PROMPT}\n\nUI context:\n{context.strip()}"

        payload = [ChatMessage(role="system", content=system_content), *messages]
        return await self._provider.complete(payload)

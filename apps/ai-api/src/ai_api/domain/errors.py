class AiApiError(Exception):
    """Base domain error for the AI service."""

    def __init__(self, message: str, *, code: str = "AI_ERROR") -> None:
        super().__init__(message)
        self.message = message
        self.code = code


class UnauthorizedServiceError(AiApiError):
    def __init__(self) -> None:
        super().__init__("Invalid or missing AI service token", code="AI_UNAUTHORIZED")


class ProviderError(AiApiError):
    def __init__(self, message: str) -> None:
        super().__init__(message, code="AI_PROVIDER_ERROR")


class InvalidStructuredOutputError(AiApiError):
    """The provider replied, but the payload did not match the expected schema."""

    def __init__(self, task: str) -> None:
        super().__init__(
            f"Provider output does not match the {task} schema",
            code="AI_INVALID_STRUCTURED_OUTPUT",
        )

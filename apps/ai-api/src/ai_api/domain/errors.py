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

from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "personal-os-ai-api"
    environment: Literal["development", "test", "production"] = "development"
    port: int = Field(default=8000, ge=1, le=65535)
    api_prefix: str = "/api/v1"
    ai_service_token: SecretStr = SecretStr("development-only-ai-service-token-change-me")
    ai_provider: Literal["mock", "openai_compatible"] = "mock"
    openai_api_key: SecretStr | None = None
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o-mini"
    cors_origins: str = "http://localhost:4000"

    @field_validator("api_prefix")
    @classmethod
    def normalize_prefix(cls, value: str) -> str:
        prefix = value.strip() or "/api/v1"
        if not prefix.startswith("/"):
            prefix = f"/{prefix}"
        return prefix.rstrip("/") or "/api/v1"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def validate_runtime(self) -> None:
        if self.is_production:
            token = self.ai_service_token.get_secret_value()
            if token.startswith("development-only"):
                raise ValueError("AI_SERVICE_TOKEN must be changed in production")
        if self.ai_provider == "openai_compatible" and self.openai_api_key is None:
            raise ValueError("OPENAI_API_KEY is required when AI_PROVIDER=openai_compatible")


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.validate_runtime()
    return settings

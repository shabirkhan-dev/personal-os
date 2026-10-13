from functools import lru_cache
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from ai_api.application.assist_service import AssistService
from ai_api.config.settings import Settings, get_settings
from ai_api.domain.errors import UnauthorizedServiceError
from ai_api.infrastructure.providers import create_llm_provider
from ai_api.infrastructure.security import verify_service_token


@lru_cache
def get_assist_service() -> AssistService:
    settings = get_settings()
    return AssistService(create_llm_provider(settings))


def get_settings_dep() -> Settings:
    return get_settings()


async def require_internal_service(
    settings: Annotated[Settings, Depends(get_settings_dep)],
    authorization: Annotated[str | None, Header()] = None,
    x_ai_service_token: Annotated[str | None, Header(alias="X-AI-Service-Token")] = None,
) -> None:
    try:
        verify_service_token(
            settings,
            authorization=authorization,
            service_token=x_ai_service_token,
        )
    except UnauthorizedServiceError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": error.code, "message": error.message},
        ) from error


SettingsDep = Annotated[Settings, Depends(get_settings_dep)]
AssistServiceDep = Annotated[AssistService, Depends(get_assist_service)]
InternalAuthDep = Annotated[None, Depends(require_internal_service)]

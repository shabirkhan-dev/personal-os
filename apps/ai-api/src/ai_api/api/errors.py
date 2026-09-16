from typing import NoReturn

from fastapi import HTTPException, status

from ai_api.domain.errors import AiApiError


def raise_upstream_error(error: AiApiError) -> NoReturn:
    """Map a provider-side domain failure onto the error envelope Nest proxies.

    Nest treats any non-2xx as ``AI_UPSTREAM_ERROR``, so a precise code here is diagnostic only.
    """

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail={"code": error.code, "message": error.message},
    )

from fastapi import APIRouter

from ai_api.api.deps import IntelligenceServiceDep, InternalAuthDep
from ai_api.api.errors import raise_upstream_error
from ai_api.domain.errors import AiApiError
from ai_api.schemas.intelligence import DailyIntelligenceRequest, DailyIntelligenceResponse

router = APIRouter(tags=["intelligence"])


@router.post("/intelligence/daily", response_model=DailyIntelligenceResponse)
async def daily_intelligence(
    body: DailyIntelligenceRequest,
    service: IntelligenceServiceDep,
    _: InternalAuthDep,
) -> DailyIntelligenceResponse:
    """Structured, grounded insights for the user's current day."""
    try:
        return await service.daily(body)
    except AiApiError as error:
        raise_upstream_error(error)

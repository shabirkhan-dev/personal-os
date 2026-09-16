from collections.abc import Mapping
from typing import Any

from pydantic import ValidationError

from ai_api.domain.errors import InvalidStructuredOutputError
from ai_api.domain.ports import LlmProvider
from ai_api.schemas.intelligence import DailyIntelligenceRequest, DailyIntelligenceResponse

DAILY_INSTRUCTIONS = """\
You produce Daily Intelligence for one Personal OS user.

Ground every insight in the supplied context only. Never invent routines, items, transactions,
budgets, amounts, or dates that are not in the context, and never claim that an action was taken
or will be taken. This surface is read-only.

Return one JSON object shaped exactly like this:
{
  "insights": [
    {
      "id": "<stable string, unique within this response>",
      "kind": "routine" | "finance" | "general",
      "priority": "low" | "medium" | "high",
      "title": "<short headline>",
      "detail": "<one or two sentences grounded in the context>",
      "sourceRefs": [
        {
          "type": "routine" | "routine_item" | "finance_transaction" | "budget" | "day",
          "id": "<an id that appears in the context>",
          "label": "<human readable label>"
        }
      ],
      "suggestedAction": {
        "title": "<non-mutating next step>",
        "detail": "<optional>",
        "kind": "navigation" | "informational"
      }
    }
  ]
}

Rules:
- every sourceRefs[].id must be copied from the context, never invented;
- emit between 0 and 5 insights, most important first;
- if the context holds nothing worth surfacing, return a single "general" insight saying so plainly.
"""


class IntelligenceService:
    def __init__(self, provider: LlmProvider) -> None:
        self._provider = provider

    async def daily(self, request: DailyIntelligenceRequest) -> DailyIntelligenceResponse:
        result = await self._provider.complete_json(
            task="daily_intelligence",
            instructions=DAILY_INSTRUCTIONS,
            context=_daily_context(request),
        )
        try:
            return DailyIntelligenceResponse.model_validate(
                {**result.payload, "provider": result.provider, "model": result.model}
            )
        except ValidationError as error:
            raise InvalidStructuredOutputError("daily intelligence") from error


def _daily_context(request: DailyIntelligenceRequest) -> Mapping[str, Any]:
    return {
        "date": request.date,
        "timeZone": request.time_zone,
        "routines": request.context.routines,
        "financeMonth": request.context.finance_month,
        "financeSummary": request.context.finance_summary,
    }

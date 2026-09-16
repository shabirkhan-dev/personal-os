from typing import Any, Literal

from pydantic import Field

from ai_api.schemas.base import CamelModel

InsightKind = Literal["routine", "finance", "general"]
InsightPriority = Literal["low", "medium", "high"]
SuggestedActionKind = Literal["navigation", "informational"]


class SourceRef(CamelModel):
    """A Personal OS record an insight was grounded in."""

    type: str = Field(min_length=1, max_length=64)
    id: str = Field(min_length=1, max_length=128)
    label: str = Field(min_length=1, max_length=200)


class SuggestedAction(CamelModel):
    """Non-mutating guidance. Nest never executes these in v0."""

    title: str = Field(min_length=1, max_length=200)
    detail: str | None = Field(default=None, max_length=1_000)
    kind: SuggestedActionKind


class Insight(CamelModel):
    id: str = Field(min_length=1, max_length=128)
    kind: InsightKind
    priority: InsightPriority
    title: str = Field(min_length=1, max_length=200)
    detail: str = Field(min_length=1, max_length=2_000)
    source_refs: list[SourceRef] = Field(default_factory=list, max_length=20)
    suggested_action: SuggestedAction | None = None


class DailyContext(CamelModel):
    """The authorized snapshot Nest resolved for the user before calling this service."""

    routines: Any
    finance_month: str = Field(min_length=1, max_length=7)
    finance_summary: Any


class DailyIntelligenceRequest(CamelModel):
    date: str = Field(min_length=10, max_length=10, pattern=r"^\d{4}-\d{2}-\d{2}$")
    time_zone: str = Field(min_length=1, max_length=64)
    context: DailyContext


class DailyIntelligenceResponse(CamelModel):
    # Required, matching the gateway's own validator: a provider that omits ``insights`` must fail
    # here with a precise code rather than at Nest as a generic upstream error.
    insights: list[Insight] = Field(max_length=20)
    provider: str
    model: str

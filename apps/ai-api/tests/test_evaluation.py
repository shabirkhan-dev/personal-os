import json
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from ai_api.application.intelligence_service import IntelligenceService
from ai_api.domain.errors import InvalidStructuredOutputError
from support import StubProvider, collect_strings

FIXTURES = Path(__file__).parent / "fixtures"

ALLOWED_KINDS = {"routine", "finance", "general"}
ALLOWED_PRIORITIES = {"low", "medium", "high"}


def _load(name: str) -> list[dict[str, Any]]:
    payload = json.loads((FIXTURES / name).read_text(encoding="utf-8"))
    return payload["cases"]


DAILY_CASES = _load("daily_evaluation.json")
CHAT_CASES = _load("chat_evaluation.json")


@pytest.mark.parametrize("case", DAILY_CASES, ids=[case["name"] for case in DAILY_CASES])
def test_daily_evaluation(
    client: TestClient,
    service_headers: dict[str, str],
    case: dict[str, Any],
) -> None:
    response = client.post(
        "/api/v1/intelligence/daily",
        headers=service_headers,
        json=case["request"],
    )
    assert response.status_code == 200

    payload = response.json()
    expect = case["expect"]
    insights = payload["insights"]

    assert {insight["kind"] for insight in insights} == set(expect["kinds"])
    assert len(insights) >= expect.get("minInsights", 1)

    grounded_strings = collect_strings(case["request"])
    cited_ids: set[str] = set()
    for insight in insights:
        assert insight["kind"] in ALLOWED_KINDS
        assert insight["priority"] in ALLOWED_PRIORITIES
        assert insight["title"]
        assert insight["detail"]
        for source in insight["sourceRefs"]:
            assert source["id"] in grounded_strings, f"invented source id {source['id']}"
            cited_ids.add(source["id"])

    for expected_id in expect.get("cites", []):
        assert expected_id in cited_ids

    if expect.get("noSources"):
        assert cited_ids == set()


@pytest.mark.parametrize("case", CHAT_CASES, ids=[case["name"] for case in CHAT_CASES])
def test_chat_evaluation(
    client: TestClient,
    service_headers: dict[str, str],
    case: dict[str, Any],
) -> None:
    response = client.post("/api/v1/chat", headers=service_headers, json=case["request"])
    assert response.status_code == 200

    payload = response.json()
    expect = case["expect"]
    sources = payload.get("sources") or []

    for fragment in expect.get("replyContains", []):
        assert fragment in payload["reply"], f"missing {fragment!r} in reply"

    grounded_strings = collect_strings(case["request"])
    for source in sources:
        assert source["id"] in grounded_strings, f"invented source id {source['id']}"

    if expect.get("mustCite"):
        assert sources

    if expect.get("noSources"):
        assert not sources


@pytest.mark.parametrize(
    "payload",
    [
        {"insights": "not-a-list"},
        {"insights": [{"id": "only-an-id"}]},
        {
            "insights": [
                {
                    "id": "i",
                    "kind": "routine",
                    "priority": "urgent",
                    "title": "t",
                    "detail": "d",
                }
            ]
        },
        {},
    ],
    ids=["insights-not-a-list", "missing-fields", "unknown-priority", "empty-object"],
)
async def test_malformed_provider_output_is_rejected(payload: dict[str, Any]) -> None:
    """A provider that ignores the schema must fail loudly, never leak a wrong answer."""

    service = IntelligenceService(StubProvider(payload))

    with pytest.raises(InvalidStructuredOutputError) as error:
        await service.daily(
            _request_from_case(DAILY_CASES[0]["request"]),
        )

    assert error.value.code == "AI_INVALID_STRUCTURED_OUTPUT"


def _request_from_case(payload: dict[str, Any]) -> Any:
    from ai_api.schemas.intelligence import DailyIntelligenceRequest

    return DailyIntelligenceRequest.model_validate(payload)

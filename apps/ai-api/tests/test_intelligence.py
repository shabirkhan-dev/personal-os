from fastapi import FastAPI
from fastapi.testclient import TestClient

from ai_api.api.deps import get_intelligence_service
from ai_api.application.intelligence_service import IntelligenceService
from ai_api.domain.errors import ProviderError
from support import StubProvider, collect_strings

DAILY_REQUEST = {
    "date": "2026-09-16",
    "timeZone": "Asia/Karachi",
    "context": {
        "routines": [
            {
                "id": "r-1",
                "name": "Morning reset",
                "description": None,
                "completedItems": 1,
                "totalItems": 3,
                "items": [
                    {
                        "id": "i-1",
                        "name": "Stretch",
                        "targetTime": None,
                        "sortOrder": 0,
                        "completed": True,
                    },
                    {
                        "id": "i-2",
                        "name": "Journal",
                        "targetTime": None,
                        "sortOrder": 1,
                        "completed": False,
                    },
                ],
            }
        ],
        "financeMonth": "2026-09",
        "financeSummary": {
            "month": "2026-09",
            "incomeTotal": 500_000,
            "expenseTotal": 120_000,
            "netTotal": 380_000,
        },
    },
}

EMPTY_CONTEXT_REQUEST = {
    "date": "2026-09-16",
    "timeZone": "Asia/Karachi",
    "context": {"routines": [], "financeMonth": "2026-09", "financeSummary": None},
}


def test_daily_requires_service_token(client: TestClient) -> None:
    response = client.post("/api/v1/intelligence/daily", json=DAILY_REQUEST)
    assert response.status_code == 401


def test_daily_returns_grounded_insights(
    client: TestClient,
    service_headers: dict[str, str],
) -> None:
    response = client.post(
        "/api/v1/intelligence/daily",
        headers=service_headers,
        json=DAILY_REQUEST,
    )
    assert response.status_code == 200

    payload = response.json()
    assert payload["provider"] == "mock"
    assert payload["model"] == "mock-assist-v1"
    assert payload["insights"]

    allowed_strings = collect_strings(DAILY_REQUEST["context"]) | {DAILY_REQUEST["date"]}
    kinds = set()
    for insight in payload["insights"]:
        kinds.add(insight["kind"])
        # camelCase contract the Nest gateway validates against.
        assert isinstance(insight["sourceRefs"], list)
        for source in insight["sourceRefs"]:
            assert source["id"] in allowed_strings, f"invented source id {source['id']}"

    assert kinds <= {"routine", "finance", "general"}
    assert "routine" in kinds
    assert "finance" in kinds


def test_daily_cites_the_incomplete_routine_item(
    client: TestClient,
    service_headers: dict[str, str],
) -> None:
    response = client.post(
        "/api/v1/intelligence/daily",
        headers=service_headers,
        json=DAILY_REQUEST,
    )
    payload = response.json()

    routine_insight = next(item for item in payload["insights"] if item["kind"] == "routine")
    assert routine_insight["title"] == "Morning reset: 1/3 done"
    assert [source["id"] for source in routine_insight["sourceRefs"]] == ["i-2"]
    assert routine_insight["sourceRefs"][0]["type"] == "routine_item"


def test_daily_empty_context_returns_general_insight(
    client: TestClient,
    service_headers: dict[str, str],
) -> None:
    response = client.post(
        "/api/v1/intelligence/daily",
        headers=service_headers,
        json=EMPTY_CONTEXT_REQUEST,
    )
    assert response.status_code == 200

    insights = response.json()["insights"]
    assert len(insights) == 1
    assert insights[0]["kind"] == "general"
    assert insights[0]["sourceRefs"] == []


def test_daily_rejects_upstream_output_that_breaks_the_schema(
    app: FastAPI,
    client: TestClient,
    service_headers: dict[str, str],
) -> None:
    app.dependency_overrides[get_intelligence_service] = lambda: IntelligenceService(
        StubProvider({"insights": [{"id": "insight-without-required-fields"}]})
    )

    response = client.post(
        "/api/v1/intelligence/daily",
        headers=service_headers,
        json=DAILY_REQUEST,
    )

    assert response.status_code == 502
    assert response.json()["detail"]["code"] == "AI_INVALID_STRUCTURED_OUTPUT"


def test_daily_maps_provider_failure_to_bad_gateway(
    app: FastAPI,
    client: TestClient,
    service_headers: dict[str, str],
) -> None:
    app.dependency_overrides[get_intelligence_service] = lambda: IntelligenceService(
        StubProvider(error=ProviderError("provider exploded"))
    )

    response = client.post(
        "/api/v1/intelligence/daily",
        headers=service_headers,
        json=DAILY_REQUEST,
    )

    assert response.status_code == 502
    assert response.json()["detail"]["code"] == "AI_PROVIDER_ERROR"


def test_daily_rejects_a_malformed_date(
    client: TestClient,
    service_headers: dict[str, str],
) -> None:
    body = {**DAILY_REQUEST, "date": "16-09-2026"}
    response = client.post(
        "/api/v1/intelligence/daily",
        headers=service_headers,
        json=body,
    )
    assert response.status_code == 422

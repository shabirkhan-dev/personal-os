from fastapi.testclient import TestClient

from support import collect_strings

ENTITY_REQUEST = {
    "messages": [{"role": "user", "content": "How is this routine going?"}],
    "context": {"entity": {"type": "routine", "id": "r-1"}, "date": "2026-09-16"},
}

GENERAL_REQUEST = {
    "messages": [{"role": "user", "content": "What does my day look like?"}],
    "context": {
        "personalOS": {
            "date": "2026-09-16",
            "routines": [{"name": "Morning reset", "completedItems": 2, "totalItems": 3}],
            "finance": {
                "month": "2026-09",
                "incomeTotal": 500_000,
                "expenseTotal": 620_000,
                "netTotal": -120_000,
            },
        }
    },
}

NO_CONTEXT_REQUEST = {
    "messages": [{"role": "user", "content": "What is my net worth?"}],
}


def test_chat_requires_service_token(client: TestClient) -> None:
    response = client.post("/api/v1/chat", json=ENTITY_REQUEST)
    assert response.status_code == 401


def test_chat_grounds_the_reply_in_the_entity_context(
    client: TestClient,
    service_headers: dict[str, str],
) -> None:
    response = client.post("/api/v1/chat", headers=service_headers, json=ENTITY_REQUEST)
    assert response.status_code == 200

    payload = response.json()
    assert payload["provider"] == "mock"
    assert "How is this routine going?" in payload["reply"]
    assert "read-only" in payload["reply"]

    allowed = collect_strings(ENTITY_REQUEST["context"])
    assert payload["sources"]
    for source in payload["sources"]:
        assert source["id"] in allowed, f"invented source id {source['id']}"


def test_chat_summarises_the_minimal_personal_os_snapshot(
    client: TestClient,
    service_headers: dict[str, str],
) -> None:
    response = client.post("/api/v1/chat", headers=service_headers, json=GENERAL_REQUEST)
    assert response.status_code == 200

    reply = response.json()["reply"]
    assert "1 routines scheduled today with 2/3 items complete" in reply
    assert "2026-09 net balance is negative" in reply


def test_chat_refuses_when_nothing_is_grounded(
    client: TestClient,
    service_headers: dict[str, str],
) -> None:
    response = client.post("/api/v1/chat", headers=service_headers, json=NO_CONTEXT_REQUEST)
    assert response.status_code == 200

    payload = response.json()
    assert "can't answer it from your data" in payload["reply"]
    assert payload.get("sources") is None


def test_chat_accepts_the_camel_case_personal_os_alias(
    client: TestClient,
    service_headers: dict[str, str],
) -> None:
    """Nest sends ``personalOS``; a snake_case-only schema would silently drop it."""

    response = client.post("/api/v1/chat", headers=service_headers, json=GENERAL_REQUEST)
    assert response.status_code == 200
    assert "From your current context" in response.json()["reply"]


def test_chat_rejects_an_empty_message_list(
    client: TestClient,
    service_headers: dict[str, str],
) -> None:
    response = client.post("/api/v1/chat", headers=service_headers, json={"messages": []})
    assert response.status_code == 422

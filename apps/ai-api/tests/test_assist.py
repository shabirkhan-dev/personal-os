from fastapi.testclient import TestClient


def test_assist_requires_service_token(client: TestClient) -> None:
    response = client.post(
        "/api/v1/assist",
        json={"messages": [{"role": "user", "content": "Hello"}]},
    )
    assert response.status_code == 401


def test_assist_mock_reply(client: TestClient, service_headers: dict[str, str]) -> None:
    response = client.post(
        "/api/v1/assist",
        headers=service_headers,
        json={
            "messages": [{"role": "user", "content": "How do I start the monorepo?"}],
            "context": "admin/ai",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["provider"] == "mock"
    assert "Personal OS Assist" in payload["reply"]
    assert "How do I start the monorepo?" in payload["reply"]

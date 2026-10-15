import asyncio
import json

import pytest
from fastapi.testclient import TestClient

from ai_api.application.career_tasks import AiOutputError, CareerTasks
from ai_api.domain.ports import ChatMessage, CompletionResult
from ai_api.infrastructure.web_page import html_to_text
from ai_api.schemas.career import NudgeRequest, ParseLineRequest, ReadJobRequest


def test_career_routes_require_the_service_token(client: TestClient) -> None:
    response = client.post(
        "/api/v1/career/parse-line", json={"text": "applied to x", "today": "2026-10-15"}
    )
    assert response.status_code == 401


def test_parse_line_turns_a_logged_line_into_an_application(
    client: TestClient, service_headers: dict[str, str]
) -> None:
    response = client.post(
        "/api/v1/career/parse-line",
        headers=service_headers,
        json={"text": "applied to tessera, senior typescript, 500k, remote", "today": "2026-10-15"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["application"]["company"] == "Tessera"
    assert payload["application"]["stage"] == "applied"
    assert payload["application"]["pay"] == "500k"
    assert payload["application"]["where"] == "Remote"
    assert payload["follow_up_in_days"] == 7


def test_parse_line_returns_null_for_other_lines(
    client: TestClient, service_headers: dict[str, str]
) -> None:
    response = client.post(
        "/api/v1/career/parse-line",
        headers=service_headers,
        json={"text": "drink more water", "today": "2026-10-15"},
    )
    assert response.json()["application"] is None


def test_read_job_from_pasted_text(client: TestClient, service_headers: dict[str, str]) -> None:
    response = client.post(
        "/api/v1/career/read-job",
        headers=service_headers,
        json={"text": "Senior Frontend Engineer\nBuild logistics software. Rs 450k–550k. Remote."},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["role"] == "Senior Frontend Engineer"
    assert payload["where"] == "Remote"
    assert payload["halal"]["status"] == "unsure"


def test_read_job_needs_exactly_one_source(
    client: TestClient, service_headers: dict[str, str]
) -> None:
    response = client.post("/api/v1/career/read-job", headers=service_headers, json={})
    assert response.status_code == 422


def test_read_job_refuses_private_addresses(
    client: TestClient, service_headers: dict[str, str]
) -> None:
    response = client.post(
        "/api/v1/career/read-job",
        headers=service_headers,
        json={"url": "http://127.0.0.1:4000/api/v1/health"},
    )
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "JOB_LINK_UNREADABLE"


def test_nudge_prep_and_skill_path_answer_in_shape(
    client: TestClient, service_headers: dict[str, str]
) -> None:
    nudge = client.post(
        "/api/v1/career/nudge",
        headers=service_headers,
        json={
            "sender_name": "Shabir Khan",
            "company": "Northwind Labs",
            "role": "Senior Frontend",
            "contact_name": "Hina Qureshi",
            "days_since_applied": 7,
            "stories": [{"title": "Auspira", "summary": "Led the frontend architecture"}],
        },
    )
    assert nudge.status_code == 200
    assert nudge.json()["body"].startswith("Hi Hina,")
    assert "Shabir" in nudge.json()["body"]

    prep = client.post(
        "/api/v1/career/interview-prep",
        headers=service_headers,
        json={"company": "Helio Systems", "role": "Senior Frontend"},
    )
    assert prep.status_code == 200
    assert len(prep.json()["topics"]) >= 1
    assert len(prep.json()["flashcards"]) >= 1

    path = client.post(
        "/api/v1/career/skill-path",
        headers=service_headers,
        json={"focus": "System design", "weeks": 3},
    )
    assert path.status_code == 200
    assert len(path.json()["weeks"]) == 3
    assert all(len(week["days"]) == 5 for week in path.json()["weeks"])


class ScriptedProvider:
    """A non-mock provider that replies with a fixed string."""

    def __init__(self, reply: str) -> None:
        self.reply = reply
        self.seen: list[list[ChatMessage]] = []

    @property
    def name(self) -> str:
        return "scripted"

    @property
    def model(self) -> str:
        return "scripted-1"

    async def complete(
        self, messages: list[ChatMessage], *, json_mode: bool = False
    ) -> CompletionResult:
        assert json_mode
        self.seen.append(messages)
        return CompletionResult(content=self.reply, provider=self.name, model=self.model)


async def _no_pages(_url: str) -> str:
    raise AssertionError("no page should be read")


def test_model_json_is_validated_and_fences_are_stripped() -> None:
    reply = json.dumps({"subject": "Following up", "body": "Hi Hina, …"})
    tasks = CareerTasks(ScriptedProvider(f"```json\n{reply}\n```"), _no_pages)
    result = asyncio.run(
        tasks.draft_nudge(
            NudgeRequest(sender_name="Shabir", company="Northwind", days_since_applied=7)
        )
    )
    assert result.subject == "Following up"


def test_unusable_model_output_raises() -> None:
    tasks = CareerTasks(ScriptedProvider('{"application": {"company": 5}}'), _no_pages)
    with pytest.raises(AiOutputError):
        asyncio.run(tasks.parse_line(ParseLineRequest(text="applied to x", today="2026-10-15")))


def test_read_job_sends_the_page_text_to_the_model() -> None:
    provider = ScriptedProvider(
        json.dumps(
            {
                "company": "Northwind Labs",
                "role": "Senior Frontend",
                "pay": "",
                "where": "Remote",
                "summary": "",
                "halal": {"status": "clean", "note": "B2B logistics software."},
            }
        )
    )

    async def page(url: str) -> str:
        return f"page text for {url}"

    result = asyncio.run(
        CareerTasks(provider, page).read_job(ReadJobRequest(url="https://example.com/job"))
    )
    assert result.halal.status == "clean"
    assert "page text for https://example.com/job" in provider.seen[0][1].content


def test_html_to_text_drops_scripts_and_keeps_lines() -> None:
    html = (
        "<html><head><title>x</title></head>"
        "<body><script>bad()</script><h1>Role</h1><p>Pay</p></body></html>"
    )
    assert html_to_text(html) == "Role\nPay"

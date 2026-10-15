"""The Career module's AI tasks: read a job post, parse a logged line, draft a nudge, build
interview prep and a skill path. Each one asks the model for JSON matching a schema and
validates the reply.

With the mock provider (development and tests) every task returns a deterministic answer built from
the input, so the app can be exercised without a model key.
"""

import json
import re
from collections.abc import Awaitable, Callable
from typing import TypeVar
from urllib.parse import urlparse

from pydantic import BaseModel, ValidationError

from ai_api.domain.errors import AiApiError
from ai_api.domain.ports import ChatMessage, LlmProvider
from ai_api.schemas.career import (
    Flashcard,
    HalalCheck,
    InterviewPrepRequest,
    InterviewPrepResponse,
    JobDetails,
    NudgeRequest,
    NudgeResponse,
    ParsedApplication,
    ParseLineRequest,
    ParseLineResponse,
    PrepTopic,
    ReadJobRequest,
    SkillDay,
    SkillPathRequest,
    SkillPathResponse,
    SkillWeek,
)

Model = TypeVar("Model", bound=BaseModel)

HALAL_RULE = (
    "Halal check: judge only what the company itself earns from. Flag interest-based lending or "
    "banking, gambling or betting, alcohol, pork, tobacco and adult content. Use 'unsure' when the "
    "text does not say what the company does. Never claim certainty; the user checks it."
)


class AiOutputError(AiApiError):
    def __init__(self, task: str) -> None:
        super().__init__(f"The model's answer for {task} was not usable", code="AI_INVALID_OUTPUT")


PageReader = Callable[[str], Awaitable[str]]


class CareerTasks:
    def __init__(self, provider: LlmProvider, read_page: PageReader) -> None:
        self._provider = provider
        self._read_page = read_page

    @property
    def _mock(self) -> bool:
        return self._provider.name == "mock"

    async def read_job(self, request: ReadJobRequest) -> JobDetails:
        text = request.text.strip() if request.text else await self._read_page(str(request.url))
        if self._mock:
            return _mock_read_job(text, str(request.url) if request.url else None)
        prompt = (
            "Extract the job post's company, role, pay (as written, with currency), where "
            "(remote/onsite, city, working hours) and a one-line summary. Leave a field empty "
            f"rather than guess. {HALAL_RULE}"
        )
        return await self._ask("read-job", prompt, f"Job post:\n{text}", JobDetails)

    async def parse_line(self, request: ParseLineRequest) -> ParseLineResponse:
        if self._mock:
            return _mock_parse_line(request.text)
        prompt = (
            "The user logs job-hunt progress in one line, e.g. 'applied to tessera, senior "
            "typescript, 500k, remote'. Return the application it describes with its stage "
            "(saved, applied, interview, offer or closed). Suggest follow_up_in_days (usually 7) "
            "only for a new application. Set interview_at only if the line books an interview, "
            f"resolving relative days against today ({request.today}). {HALAL_RULE} If the line "
            "is not about a job, return application null."
        )
        return await self._ask("parse-line", prompt, request.text, ParseLineResponse)

    async def draft_nudge(self, request: NudgeRequest) -> NudgeResponse:
        if self._mock:
            return _mock_nudge(request)
        tone = {
            "as-is": "plain and friendly",
            "shorter": "at most three short sentences",
            "warmer": "warm and personal",
            "formal": "formal and polished",
        }[request.tone]
        prompt = (
            "Write a short follow-up email from a job applicant to the company contact. Mention "
            "one or two of the applicant's stories that fit the role, offer a call, sign with the "
            f"sender's first name. Tone: {tone}. No buzzwords, no exaggeration, no placeholders."
        )
        details = request.model_dump_json(exclude={"tone"})
        return await self._ask("nudge", prompt, details, NudgeResponse)

    async def interview_prep(self, request: InterviewPrepRequest) -> InterviewPrepResponse:
        if self._mock:
            return _mock_prep(request)
        prompt = (
            "Build interview prep for this application: 4-5 topics to revise (title plus one "
            "line of what to cover), 3 sharp questions the candidate can ask, and 8-12 flashcards "
            "(question on the front, a short correct answer on the back, an optional one-line "
            "code snippet). Tie topics to the role and the notes."
        )
        return await self._ask(
            "interview-prep", prompt, request.model_dump_json(), InterviewPrepResponse
        )

    async def skill_path(self, request: SkillPathRequest) -> SkillPathResponse:
        if self._mock:
            return _mock_skill_path(request)
        prompt = (
            f"Plan a {request.weeks}-week skill path on the focus below, 30 minutes a day, five "
            "days a week. Each week has a title, a one-line goal and five day sessions (title and "
            "what to do). Build up to something the learner can show an employer."
        )
        return await self._ask("skill-path", prompt, request.model_dump_json(), SkillPathResponse)

    async def _ask(self, task: str, instructions: str, content: str, model: type[Model]) -> Model:
        schema = json.dumps(model.model_json_schema())
        system = (
            "You are the Career assistant inside Personal OS. Reply with one JSON object that "
            f"matches this JSON schema exactly, and nothing else.\nSchema: {schema}\n\n"
            f"Task: {instructions}"
        )
        result = await self._provider.complete(
            [ChatMessage(role="system", content=system), ChatMessage(role="user", content=content)],
            json_mode=True,
        )
        try:
            return model.model_validate_json(_strip_fence(result.content))
        except ValidationError as error:
            raise AiOutputError(task) from error


def _strip_fence(content: str) -> str:
    match = re.search(r"```(?:json)?\s*(.*?)```", content, re.DOTALL)
    return match.group(1) if match else content


# --- Mock answers ---------------------------------------------------------------------------

MOCK_HALAL = HalalCheck(status="unsure", note="Mock reading — check the company yourself.")


def _mock_read_job(text: str, url: str | None) -> JobDetails:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    host = urlparse(url).hostname if url else None
    company = host.removeprefix("www.").split(".")[0].capitalize() if host else ""
    return JobDetails(
        company=company,
        role=(lines[0] if lines else "")[:120],
        pay=_find(r"(?:rs|pkr|\$|£|€)\s?[\d.,]+\s?k?(?:\s?[–-]\s?[\d.,]+\s?k?)?", text),
        where="Remote" if re.search(r"\bremote\b", text, re.IGNORECASE) else "",
        summary=(lines[1] if len(lines) > 1 else "")[:400],
        halal=MOCK_HALAL,
    )


def _mock_parse_line(text: str) -> ParseLineResponse:
    lowered = text.lower()
    stage = next(
        (
            stage
            for stage, words in (
                ("interview", ("interview",)),
                ("offer", ("offer",)),
                ("closed", ("rejected", "closed")),
                ("applied", ("applied", "apply")),
                ("saved", ("saved", "save", "found")),
            )
            if any(word in lowered for word in words)
        ),
        None,
    )
    if stage is None:
        return ParseLineResponse(application=None)
    parts = [part.strip() for part in re.split(r",", text) if part.strip()]
    first = re.sub(
        r"^(applied|apply|saved|save|found|interview|offer|rejected)( to| at| for| with)?\s+",
        "",
        parts[0],
        flags=re.IGNORECASE,
    )
    rest = parts[1:]
    pay = next((part for part in rest if re.search(r"\d", part)), "")
    where = next((part for part in rest if re.search(r"remote|onsite|hybrid", part, re.I)), "")
    role = next((part for part in rest if part not in (pay, where)), "")
    return ParseLineResponse(
        application=ParsedApplication(
            company=first.title()[:120],
            role=role.title()[:120],
            pay=pay[:80],
            where=where.capitalize()[:80],
            stage=stage,
            halal=MOCK_HALAL,
        ),
        follow_up_in_days=7 if stage == "applied" else None,
    )


def _mock_nudge(request: NudgeRequest) -> NudgeResponse:
    greeting = f"Hi {request.contact_name.split(' ')[0]}," if request.contact_name else "Hi,"
    story = request.stories[0] if request.stories else None
    line = f" Recently: {story.title} — {story.summary}." if story else ""
    first_name = request.sender_name.split(" ")[0] if request.sender_name else ""
    body = (
        f"{greeting}\n\nI applied for the {request.role or 'open'} role and wanted to check in."
        f"{line}\n\nHappy to share more or jump on a call.\n\nThanks,\n{first_name}"
    )
    return NudgeResponse(subject=f"Following up: {request.role or request.company}", body=body)


def _mock_prep(request: InterviewPrepRequest) -> InterviewPrepResponse:
    role = request.role or "the role"
    topics = [
        PrepTopic(title="The role", detail=f"What {request.company} needs from {role}"),
        PrepTopic(title="Your stories", detail="Two minutes each, with numbers"),
        PrepTopic(title="System design", detail="One design you can draw and explain"),
        PrepTopic(title="Behavioural", detail="Ownership, a conflict, a hard deadline"),
    ]
    cards = [
        Flashcard(
            topic=topic.title,
            tag=topic.title,
            front=f"What will you say about {topic.title.lower()}?",
            back=topic.detail,
        )
        for topic in topics
    ]
    return InterviewPrepResponse(
        topics=topics,
        questions=[
            "What does a good first 90 days look like?",
            "How do teams split ownership?",
            "What would you want me to improve in the first month?",
        ],
        flashcards=cards,
    )


def _mock_skill_path(request: SkillPathRequest) -> SkillPathResponse:
    weeks = [
        SkillWeek(
            title=f"{request.focus} · part {index + 1}",
            goal="Learn it, then explain it out loud",
            days=[
                SkillDay(title=f"Session {day + 1}", detail="30 minutes of focused practice")
                for day in range(5)
            ],
        )
        for index in range(request.weeks)
    ]
    return SkillPathResponse(title=request.focus[:60], weeks=weeks)


def _find(pattern: str, text: str) -> str:
    match = re.search(pattern, text, re.IGNORECASE)
    return match.group(0).strip()[:80] if match else ""


__all__ = ["AiOutputError", "CareerTasks"]

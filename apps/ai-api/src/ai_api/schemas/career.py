"""Request and response shapes for the Career module's AI tasks.

The same models validate what the app sends and what the language model returns, so a malformed
model reply fails here instead of reaching the phone.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator

Stage = Literal["saved", "applied", "interview", "offer", "closed"]
HalalStatus = Literal["clean", "flagged", "unsure"]
Tone = Literal["as-is", "shorter", "warmer", "formal"]


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class HalalCheck(Strict):
    status: HalalStatus
    note: str = Field(max_length=240)


class JobDetails(Strict):
    company: str = Field(default="", max_length=120)
    role: str = Field(default="", max_length=120)
    pay: str = Field(default="", max_length=80, description="As written, e.g. 'Rs 450k–550k / mo'")
    where: str = Field(default="", max_length=80, description="e.g. 'Remote · UK hours'")
    summary: str = Field(default="", max_length=400)
    halal: HalalCheck


class ReadJobRequest(Strict):
    url: HttpUrl | None = None
    text: str | None = Field(default=None, max_length=20_000)

    @model_validator(mode="after")
    def one_source(self) -> "ReadJobRequest":
        if (self.url is None) == (self.text is None or not self.text.strip()):
            raise ValueError("Send either url or text")
        return self


class ParseLineRequest(Strict):
    text: str = Field(min_length=1, max_length=500)
    today: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$", description="The user's local date")


class ParsedApplication(Strict):
    company: str = Field(max_length=120)
    role: str = Field(default="", max_length=120)
    pay: str = Field(default="", max_length=80)
    where: str = Field(default="", max_length=80)
    stage: Stage
    halal: HalalCheck


class ParseLineResponse(Strict):
    """`application` is null when the line is not about a job."""

    application: ParsedApplication | None
    follow_up_in_days: int | None = Field(default=None, ge=1, le=60)
    interview_at: str | None = Field(
        default=None, description="ISO date-time if the line books an interview"
    )


class Story(Strict):
    title: str = Field(max_length=80)
    summary: str = Field(max_length=200)


class NudgeRequest(Strict):
    sender_name: str = Field(max_length=80)
    company: str = Field(max_length=120)
    role: str = Field(default="", max_length=120)
    contact_name: str = Field(default="", max_length=80)
    days_since_applied: int = Field(ge=0, le=365)
    notes: str = Field(default="", max_length=2_000)
    stories: list[Story] = Field(default_factory=list, max_length=6)
    tone: Tone = "as-is"
    current_draft: str | None = Field(default=None, max_length=4_000)


class NudgeResponse(Strict):
    subject: str = Field(max_length=120)
    body: str = Field(max_length=2_000)


class InterviewPrepRequest(Strict):
    company: str = Field(max_length=120)
    role: str = Field(default="", max_length=120)
    round: str = Field(default="", max_length=80, description="e.g. 'Technical round'")
    notes: str = Field(default="", max_length=2_000)
    stories: list[Story] = Field(default_factory=list, max_length=6)


class PrepTopic(Strict):
    title: str = Field(max_length=80)
    detail: str = Field(max_length=160)


class Flashcard(Strict):
    topic: str = Field(max_length=80, description="Which prep topic the card belongs to")
    tag: str = Field(max_length=40, description="Short eyebrow, e.g. 'React · effects'")
    front: str = Field(max_length=200)
    back: str = Field(max_length=300)
    code: str = Field(default="", max_length=200)


class InterviewPrepResponse(Strict):
    topics: list[PrepTopic] = Field(min_length=1, max_length=8)
    questions: list[str] = Field(min_length=1, max_length=6)
    flashcards: list[Flashcard] = Field(min_length=1, max_length=20)


class SkillPathRequest(Strict):
    focus: str = Field(min_length=2, max_length=80)
    weeks: int = Field(default=6, ge=2, le=12)
    context: str = Field(
        default="", max_length=1_000, description="Role targets, upcoming interviews"
    )


class SkillDay(Strict):
    title: str = Field(max_length=60)
    detail: str = Field(max_length=120)


class SkillWeek(Strict):
    title: str = Field(max_length=60)
    goal: str = Field(max_length=120)
    days: list[SkillDay] = Field(min_length=5, max_length=5)


class SkillPathResponse(Strict):
    title: str = Field(max_length=60)
    weeks: list[SkillWeek] = Field(min_length=2, max_length=12)

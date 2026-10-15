from collections.abc import Awaitable

from fastapi import APIRouter, HTTPException, status

from ai_api.api.deps import CareerTasksDep, InternalAuthDep
from ai_api.application.career_tasks import AiOutputError
from ai_api.domain.errors import ProviderError
from ai_api.infrastructure.web_page import PageUnreadableError
from ai_api.schemas.career import (
    InterviewPrepRequest,
    InterviewPrepResponse,
    JobDetails,
    NudgeRequest,
    NudgeResponse,
    ParseLineRequest,
    ParseLineResponse,
    ReadJobRequest,
    SkillPathRequest,
    SkillPathResponse,
)

router = APIRouter(prefix="/career", tags=["career"])


async def _run[Result](task: Awaitable[Result]) -> Result:
    try:
        return await task
    except PageUnreadableError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={"code": error.code, "message": error.message},
        ) from error
    except (ProviderError, AiOutputError) as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": error.code, "message": error.message},
        ) from error


@router.post("/read-job", response_model=JobDetails)
async def read_job(body: ReadJobRequest, tasks: CareerTasksDep, _: InternalAuthDep) -> JobDetails:
    return await _run(tasks.read_job(body))


@router.post("/parse-line", response_model=ParseLineResponse)
async def parse_line(
    body: ParseLineRequest, tasks: CareerTasksDep, _: InternalAuthDep
) -> ParseLineResponse:
    return await _run(tasks.parse_line(body))


@router.post("/nudge", response_model=NudgeResponse)
async def nudge(body: NudgeRequest, tasks: CareerTasksDep, _: InternalAuthDep) -> NudgeResponse:
    return await _run(tasks.draft_nudge(body))


@router.post("/interview-prep", response_model=InterviewPrepResponse)
async def interview_prep(
    body: InterviewPrepRequest, tasks: CareerTasksDep, _: InternalAuthDep
) -> InterviewPrepResponse:
    return await _run(tasks.interview_prep(body))


@router.post("/skill-path", response_model=SkillPathResponse)
async def skill_path(
    body: SkillPathRequest, tasks: CareerTasksDep, _: InternalAuthDep
) -> SkillPathResponse:
    return await _run(tasks.skill_path(body))

from __future__ import annotations

from fastapi import APIRouter

from ..core.ai_client import (
    AIError,
    generate_action_plan,
    generate_deep_dive,
    generate_future_letter,
    generate_perspective,
    generate_weekly_review,
)
from ..models import (
    AIActionPlanRequest,
    AIActionPlanResponse,
    AIDeepDiveRequest,
    AIDeepDiveResponse,
    AIFutureLetterRequest,
    AIFutureLetterResponse,
    AIPerspectiveRequest,
    AIPerspectiveResponse,
    AIWeeklyReviewRequest,
    AIWeeklyReviewResponse,
)

router = APIRouter(prefix="/api/ai", tags=["ai-tools"])


@router.post("/deep-dive", response_model=AIDeepDiveResponse)
async def deep_dive(payload: AIDeepDiveRequest) -> AIDeepDiveResponse:
    if payload.input.crisisDetected:
        return AIDeepDiveResponse(ok=False, reason="crisis")
    try:
        result = await generate_deep_dive(payload.model_dump())
        return AIDeepDiveResponse(ok=True, **result)
    except AIError as exc:
        return AIDeepDiveResponse(ok=False, reason=exc.reason)
    except Exception:
        return AIDeepDiveResponse(ok=False, reason="error")


@router.post("/perspective", response_model=AIPerspectiveResponse)
async def perspective(payload: AIPerspectiveRequest) -> AIPerspectiveResponse:
    if payload.input.crisisDetected:
        return AIPerspectiveResponse(ok=False, reason="crisis")
    try:
        result = await generate_perspective(payload.model_dump())
        return AIPerspectiveResponse(ok=True, perspective=payload.perspective, **result)
    except AIError as exc:
        return AIPerspectiveResponse(ok=False, reason=exc.reason)
    except Exception:
        return AIPerspectiveResponse(ok=False, reason="error")


@router.post("/action-plan", response_model=AIActionPlanResponse)
async def action_plan(payload: AIActionPlanRequest) -> AIActionPlanResponse:
    if payload.input.crisisDetected:
        return AIActionPlanResponse(ok=False, reason="crisis")
    try:
        result = await generate_action_plan(payload.model_dump())
        return AIActionPlanResponse(ok=True, **result)
    except AIError as exc:
        return AIActionPlanResponse(ok=False, reason=exc.reason)
    except Exception:
        return AIActionPlanResponse(ok=False, reason="error")


@router.post("/weekly-review", response_model=AIWeeklyReviewResponse)
async def weekly_review(payload: AIWeeklyReviewRequest) -> AIWeeklyReviewResponse:
    if any(record.crisisDetected for record in payload.records):
        return AIWeeklyReviewResponse(ok=False, reason="crisis")
    try:
        result = await generate_weekly_review(payload.model_dump())
        return AIWeeklyReviewResponse(ok=True, **result)
    except AIError as exc:
        return AIWeeklyReviewResponse(ok=False, reason=exc.reason)
    except Exception:
        return AIWeeklyReviewResponse(ok=False, reason="error")


@router.post("/future-letter", response_model=AIFutureLetterResponse)
async def future_letter(payload: AIFutureLetterRequest) -> AIFutureLetterResponse:
    if payload.input.crisisDetected:
        return AIFutureLetterResponse(ok=False, reason="crisis")
    try:
        result = await generate_future_letter(payload.model_dump())
        return AIFutureLetterResponse(ok=True, **result)
    except AIError as exc:
        return AIFutureLetterResponse(ok=False, reason=exc.reason)
    except Exception:
        return AIFutureLetterResponse(ok=False, reason="error")

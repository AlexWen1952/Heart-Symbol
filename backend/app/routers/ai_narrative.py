"""AI narrative endpoint — mirrors the original ``/api/ai-narrative`` contract.

GET  -> availability probe ``{ available: bool }``
POST -> ``{ ok, narrative | reason }``; falls back gracefully on any failure.
"""
from __future__ import annotations

from fastapi import APIRouter

from ..core.ai_client import AIError, generate_narrative
from ..core.config import settings
from ..models import (
    AIAvailabilityResponse,
    AINarrativeRequest,
    AINarrativeResponse,
    AIReadingResult,
)

router = APIRouter(prefix="/api", tags=["ai"])


@router.get("/ai-narrative", response_model=AIAvailabilityResponse)
def ai_availability() -> AIAvailabilityResponse:
    return AIAvailabilityResponse(available=settings.ai_available)


@router.post("/ai-narrative", response_model=AINarrativeResponse)
async def ai_narrative(payload: AINarrativeRequest) -> AINarrativeResponse:
    input_data = payload.input.model_dump()
    result = payload.result.model_dump()
    try:
        narrative = await generate_narrative(input_data, result, payload.tone)
    except AIError as exc:
        return AINarrativeResponse(ok=False, reason=exc.reason)
    except Exception:  # pragma: no cover - safety net; never leak details
        return AINarrativeResponse(ok=False, reason="error")
    return AINarrativeResponse(ok=True, narrative=AIReadingResult(**narrative))

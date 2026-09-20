"""Concern validation + crisis detection endpoint."""
from __future__ import annotations

from dataclasses import asdict

from fastapi import APIRouter

from ..core.concern import validate_concern
from ..core.crisis_detection import detect_crisis
from ..models import (
    ConcernValidateRequest,
    ConcernValidateResponse,
    ConcernValidationModel,
)

router = APIRouter(prefix="/api", tags=["concern"])


@router.post("/concern/validate", response_model=ConcernValidateResponse)
def validate_concern_endpoint(payload: ConcernValidateRequest) -> ConcernValidateResponse:
    validation = validate_concern(payload.text)
    return ConcernValidateResponse(
        validation=ConcernValidationModel(**asdict(validation)),
        crisisDetected=detect_crisis(payload.text),
    )

"""Reading + symbol-selection endpoints."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..core.data import symbol_ids, symbols_by_id
from ..core.reading_engine import generate_reading
from ..core.symbol_selector import select_symbol
from ..models import (
    GenerateReadingRequest,
    ReadingResult,
    SelectSymbolRequest,
    SelectSymbolResponse,
    SymbolsResponse,
    SymbolSummary,
)

router = APIRouter(prefix="/api", tags=["reading"])


@router.get("/symbols", response_model=SymbolsResponse)
def list_symbols() -> SymbolsResponse:
    by_id = symbols_by_id()
    summaries = [
        SymbolSummary(
            id=by_id[sid]["id"],
            family=by_id[sid]["family"],
            names=by_id[sid]["names"],
            shortMeaning=by_id[sid]["shortMeaning"],
        )
        for sid in symbol_ids()
    ]
    return SymbolsResponse(symbolIds=symbol_ids(), symbols=summaries)


@router.post("/select-symbol", response_model=SelectSymbolResponse)
def select_symbol_endpoint(payload: SelectSymbolRequest) -> SelectSymbolResponse:
    symbol_id = select_symbol(payload.topic, payload.emotion, payload.dateString)
    return SelectSymbolResponse(symbolId=symbol_id)


@router.post("/reading", response_model=ReadingResult)
def generate_reading_endpoint(payload: GenerateReadingRequest) -> ReadingResult:
    try:
        result = generate_reading(
            topic=payload.topic,
            emotion=payload.emotion,
            symbol_id=payload.symbolId,
            locale=payload.locale,
            crisis_detected=bool(payload.crisisDetected),
        )
    except KeyError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ReadingResult(**result)

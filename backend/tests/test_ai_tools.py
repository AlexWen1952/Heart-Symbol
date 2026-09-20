from __future__ import annotations

import asyncio

import pytest
from pydantic import ValidationError

from app.models import (
    AIDeepDiveRequest,
    AIPerspectiveRequest,
    AIWeeklyReviewRequest,
)
from app.routers import ai_tools


def _input(crisis: bool = False) -> dict:
    return {
        "topic": "self",
        "emotion": "anxious",
        "symbolId": "moon",
        "concern": "I keep second-guessing an important personal decision.",
        "locale": "en",
        "dateString": "2026-09-16",
        "crisisDetected": crisis,
    }


def _result() -> dict:
    sentence = "This is a sufficiently long and grounded reflection sentence."
    return {
        "emotionalMirror": sentence,
        "symbolMeaning": sentence,
        "possibleBlindSpot": sentence,
        "reflectionQuestions": [sentence, sentence, sentence],
        "oneActionForToday": sentence,
        "closingLine": sentence,
        "symbolMeta": {"id": "moon", "names": {"en": "Moon", "zh": "月亮"}},
    }


def _deep_dive_request(crisis: bool = False) -> AIDeepDiveRequest:
    return AIDeepDiveRequest.model_validate({
        "input": _input(crisis),
        "result": _result(),
        "question": "What part of this decision feels within your control?",
        "answer": "I can choose when to have the conversation.",
    })


def test_deep_dive_crisis_falls_back_without_ai():
    response = asyncio.run(ai_tools.deep_dive(_deep_dive_request(True)))
    assert response.model_dump() == {
        "ok": False,
        "reason": "crisis",
        "followUpQuestion": None,
    }


def test_perspective_rejects_unknown_kind():
    with pytest.raises(ValidationError):
        AIPerspectiveRequest.model_validate({
            "input": _input(),
            "result": _result(),
            "perspective": "fortuneTeller",
        })


def test_weekly_review_limits_record_count():
    record = {
        "topic": "self",
        "emotion": "anxious",
        "symbolName": "Moon",
        "concern": "A valid concern",
        "reflectionAnswer": "",
        "action": "",
        "followUpNote": "",
        "crisisDetected": False,
    }
    with pytest.raises(ValidationError):
        AIWeeklyReviewRequest.model_validate({"locale": "en", "records": [record] * 8})


def test_deep_dive_returns_validated_contract(monkeypatch):
    async def fake_generate(_data):
        return {"followUpQuestion": "What feels most important to name honestly right now?"}

    monkeypatch.setattr(ai_tools, "generate_deep_dive", fake_generate)
    response = asyncio.run(ai_tools.deep_dive(_deep_dive_request()))
    assert response.ok is True
    assert response.followUpQuestion.endswith("?")

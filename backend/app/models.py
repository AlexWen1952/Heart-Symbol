"""Pydantic request/response models.

Field names intentionally mirror the original TypeScript types in
``src/types/reading.ts`` so the frontend contract is a drop-in.
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Locale = Literal["en", "zh"]
Topic = Literal["love", "career", "money", "family", "self", "health"]
Emotion = Literal["anxious", "confused", "sad", "hopeful", "stuck"]


class LocalizedString(BaseModel):
    en: str
    zh: str


class SymbolMeta(BaseModel):
    id: str
    names: LocalizedString


class ReadingInput(BaseModel):
    topic: Topic
    emotion: Emotion
    symbolId: str
    concern: str = Field(default="", max_length=300)
    locale: Locale
    dateString: str
    crisisDetected: bool | None = None


class ReadingResult(BaseModel):
    emotionalMirror: str
    symbolMeaning: str
    possibleBlindSpot: str
    reflectionQuestions: list[str]
    oneActionForToday: str
    closingLine: str
    symbolMeta: SymbolMeta


# --- Reading generation -----------------------------------------------------


class GenerateReadingRequest(BaseModel):
    topic: Topic
    emotion: Emotion
    symbolId: str
    locale: Locale
    concern: str = ""
    crisisDetected: bool | None = None


# --- Symbol selection -------------------------------------------------------


class SelectSymbolRequest(BaseModel):
    topic: Topic
    emotion: Emotion
    dateString: str


class SelectSymbolResponse(BaseModel):
    symbolId: str


class SymbolSummary(BaseModel):
    id: str
    family: str
    names: LocalizedString
    shortMeaning: LocalizedString


class SymbolsResponse(BaseModel):
    symbolIds: list[str]
    symbols: list[SymbolSummary]


# --- Concern validation -----------------------------------------------------


class ConcernValidateRequest(BaseModel):
    text: str = ""


class ConcernValidationModel(BaseModel):
    isValid: bool
    trimmedLength: int
    rawLength: int
    remaining: int
    atMax: bool


class ConcernValidateResponse(BaseModel):
    validation: ConcernValidationModel
    crisisDetected: bool


# --- AI narrative -----------------------------------------------------------


Tone = Literal["gentle", "direct", "poetic"]


class AINarrativeRequest(BaseModel):
    input: ReadingInput
    result: ReadingResult
    tone: Tone | None = None


class AIReadingResult(BaseModel):
    emotionalMirror: str
    symbolMeaning: str
    possibleBlindSpot: str
    reflectionQuestions: list[str]
    oneActionForToday: str
    closingLine: str
    locale: str


class AINarrativeResponse(BaseModel):
    ok: bool
    narrative: AIReadingResult | None = None
    reason: str | None = None


class AIAvailabilityResponse(BaseModel):
    available: bool


Perspective = Literal["friend", "pragmatic", "selfCompassion"]
ActionStatus = Literal["pending", "completed", "skipped"]


class AIToolResponse(BaseModel):
    ok: bool
    reason: str | None = None


class AIDeepDiveRequest(BaseModel):
    input: ReadingInput
    result: ReadingResult
    question: str = Field(min_length=10, max_length=500)
    answer: str = Field(min_length=1, max_length=1000)


class AIDeepDiveResponse(AIToolResponse):
    followUpQuestion: str | None = None


class AIPerspectiveRequest(BaseModel):
    input: ReadingInput
    result: ReadingResult
    perspective: Perspective


class AIPerspectiveResponse(AIToolResponse):
    perspective: Perspective | None = None
    text: str | None = None


class AIActionPlanRequest(BaseModel):
    input: ReadingInput
    result: ReadingResult
    action: str = Field(min_length=1, max_length=500)


class AIActionPlanResponse(AIToolResponse):
    steps: list[str] | None = None
    fallback: str | None = None


class WeeklyReviewItem(BaseModel):
    topic: Topic
    emotion: Emotion
    symbolName: str = Field(min_length=1, max_length=100)
    concern: str = Field(default="", max_length=300)
    reflectionAnswer: str = Field(default="", max_length=1000)
    action: str = Field(default="", max_length=500)
    actionStatus: ActionStatus | None = None
    followUpNote: str = Field(default="", max_length=1000)
    crisisDetected: bool = False


class AIWeeklyReviewRequest(BaseModel):
    locale: Locale
    records: list[WeeklyReviewItem] = Field(min_length=1, max_length=7)


class AIWeeklyReviewResponse(AIToolResponse):
    summary: str | None = None
    patterns: list[str] | None = None
    encouragement: str | None = None
    nextQuestion: str | None = None


class AIFutureLetterRequest(BaseModel):
    input: ReadingInput
    result: ReadingResult
    reflectionAnswer: str = Field(default="", max_length=1000)
    unlockDate: str = Field(min_length=10, max_length=10)


class AIFutureLetterResponse(AIToolResponse):
    text: str | None = None

"""Concern validation — port of ``src/lib/concern.ts``."""
from __future__ import annotations

from dataclasses import dataclass

CONCERN_MAX_LENGTH = 300
CONCERN_MIN_LENGTH = 10


def trim_concern(text: str) -> str:
    return text.strip()


@dataclass
class ConcernValidation:
    isValid: bool
    trimmedLength: int
    rawLength: int
    remaining: int
    atMax: bool


def validate_concern(text: str) -> ConcernValidation:
    trimmed = trim_concern(text)
    raw_length = len(text)
    trimmed_length = len(trimmed)
    remaining = CONCERN_MAX_LENGTH - raw_length
    return ConcernValidation(
        isValid=trimmed_length >= CONCERN_MIN_LENGTH and raw_length <= CONCERN_MAX_LENGTH,
        trimmedLength=trimmed_length,
        rawLength=raw_length,
        remaining=max(0, remaining),
        atMax=raw_length >= CONCERN_MAX_LENGTH,
    )

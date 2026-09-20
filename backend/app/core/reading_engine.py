"""Pure, deterministic reading engine — port of ``src/lib/readingEngine.ts``.

Takes a reading input and returns a fully-localized reading result. No side
effects. Input is never mutated. All combinations of
(topic x emotion x symbol_id x locale) produce valid, non-empty output.
"""
from __future__ import annotations

from typing import Any

from .data import (
    blind_spots,
    closing_lines,
    emotional_mirrors,
    get_symbol,
)
from .hash import simple_hash


def generate_reading(
    *,
    topic: str,
    emotion: str,
    symbol_id: str,
    locale: str,
    crisis_detected: bool = False,
) -> dict[str, Any]:
    symbol = get_symbol(symbol_id)

    # Step 1 - Emotional Mirror: (emotion x topic) lookup
    emotional_mirror = emotional_mirrors()[emotion][topic][locale]

    # Step 2 - Symbol Meaning: (symbol x topic) localized
    symbol_meaning = symbol["topicInterpretations"][topic][locale]

    # Step 3 - Possible Blind Spot: (emotion x symbolFamily) lookup
    possible_blind_spot = blind_spots()[emotion][symbol["family"]][locale]

    # Step 4 - Reflection Questions: all three, localized
    reflection_questions = [
        symbol["reflectionQuestions"][0][locale],
        symbol["reflectionQuestions"][1][locale],
        symbol["reflectionQuestions"][2][locale],
    ]

    # Step 5 - One Action for Today: deterministic selection from 3 actions.
    # Uses (topic + emotion) so the action is stable for the same inputs.
    action_index = simple_hash(topic + emotion) % 3
    one_action_for_today = symbol["realisticActions"][action_index][locale]

    # Step 6 - Closing Line: (topic) lookup
    closing_line = closing_lines()[topic][locale]

    # When crisis_detected, the reading content itself remains unchanged — the
    # UI layer keeps safety resources prominent (see SAFETY notes in original).
    _ = crisis_detected

    return {
        "emotionalMirror": emotional_mirror,
        "symbolMeaning": symbol_meaning,
        "possibleBlindSpot": possible_blind_spot,
        "reflectionQuestions": reflection_questions,
        "oneActionForToday": one_action_for_today,
        "closingLine": closing_line,
        "symbolMeta": {
            "id": symbol["id"],
            "names": symbol["names"],
        },
    }

"""Crisis keyword detection — port of ``src/lib/crisisDetection.ts``.

Pure function. When a trigger phrase is found, the UI shows a compassionate
banner with a crisis helpline. The user is NEVER blocked from continuing.
Intentionally simple; false positives and negatives are expected.
"""
from __future__ import annotations

# English triggers — checked case-insensitively.
EN_TRIGGERS: tuple[str, ...] = (
    # Suicidality
    "kill myself",
    "end my life",
    "don't want to be here anymore",
    "dont want to be here anymore",
    "suicide",
    "suicidal",
    # Self-harm
    "hurt myself",
    "cutting",
    "self-harm",
    "self harm",
    # Harm to others
    "hurt someone",
    "hurt him",
    "hurt her",
    # Immediate crisis
    "emergency",
    "in danger",
    "being abused",
    "abuse me",
)

# Chinese triggers — checked as substring (Chinese has no case).
ZH_TRIGGERS: tuple[str, ...] = (
    # Suicidality
    "想死",
    "不想活",
    "自杀",
    "结束生命",
    "活不下去",
    # Self-harm
    "伤害自己",
    "割腕",
    "自残",
    # Harm to others
    "伤害他",
    "伤害她",
    "打人",
    # Immediate crisis
    "有危险",
    "被虐待",
    "紧急",
)


def detect_crisis(text: str) -> bool:
    """Return True if the concern text contains any high-risk phrase."""
    if not text:
        return False
    lower = text.lower()
    if any(phrase in lower for phrase in EN_TRIGGERS):
        return True
    if any(phrase in text for phrase in ZH_TRIGGERS):
        return True
    return False

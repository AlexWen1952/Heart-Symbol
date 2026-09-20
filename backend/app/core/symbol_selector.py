"""Deterministic symbol selection — port of ``src/lib/symbolSelector.ts``.

The same ``(topic, emotion, date_string)`` triple always yields the same symbol.
``date_string`` must be ISO ``YYYY-MM-DD``. No randomness is used.
"""
from __future__ import annotations

from .data import symbol_ids
from .hash import simple_hash


def select_symbol(topic: str, emotion: str, date_string: str) -> str:
    ids = symbol_ids()
    key = f"{topic}-{emotion}-{date_string}"
    index = simple_hash(key) % len(ids)
    return ids[index]

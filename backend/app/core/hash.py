"""djb2-style 32-bit hash — a bit-exact port of the original TypeScript
``simpleHash`` in ``src/lib/hash.ts``.

The algorithm MUST match the JavaScript version exactly, because deterministic
symbol selection depends on it. Changing it would remap every user's symbols.

JavaScript reference::

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // convert to 32-bit signed integer
    }
    return Math.abs(hash);

Notes on fidelity:
- ``str.charCodeAt`` returns UTF-16 code units. Python's ``ord`` returns full
  Unicode code points, which differ for characters outside the BMP (> 0xFFFF).
  All hashed inputs here are ASCII (topic/emotion/date), so this is equivalent.
- ``hash |= 0`` coerces to a signed 32-bit integer (wrapping overflow).
"""

_UINT32_MASK = 0xFFFFFFFF


def _to_int32(value: int) -> int:
    """Emulate JavaScript's ``value | 0`` — wrap to signed 32-bit."""
    value &= _UINT32_MASK
    if value >= 0x80000000:
        value -= 0x100000000
    return value


def _utf16_code_units(text: str) -> list[int]:
    """Return UTF-16 code units, matching JS ``String.prototype.charCodeAt``.

    For BMP characters this equals ``ord(char)``; characters outside the BMP
    split into a surrogate pair, exactly as JavaScript iterates them.
    """
    raw = text.encode("utf-16-le")
    return [raw[i] | (raw[i + 1] << 8) for i in range(0, len(raw), 2)]


def simple_hash(text: str) -> int:
    """Return a non-negative integer hash identical to the TS ``simpleHash``."""
    hash_value = 0
    for code in _utf16_code_units(text):
        hash_value = (hash_value << 5) - hash_value + code
        hash_value = _to_int32(hash_value)
    return abs(hash_value)

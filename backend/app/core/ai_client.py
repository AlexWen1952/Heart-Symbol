"""OpenAI-compatible chat client for the AI narrative feature.

Calls the configured chat-completions endpoint requesting a JSON object, then
delegates parsing/validation to ``ai_safety``. All failures are converted to a
small set of safe reason codes — error details never reach the client.
"""
from __future__ import annotations

import asyncio
import json
from typing import Any

import httpx

from . import ai_safety
from .config import settings


class AIError(Exception):
    """Carries a safe reason code for the client (never a raw message)."""

    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


def _strip_code_fence(text: str) -> str:
    """Return the JSON body from a response that may be wrapped in a markdown
    code fence. Bedrock/Claude via Portkey returns ```json ... ``` even when a
    JSON object is requested; plain OpenAI returns bare JSON (unchanged)."""
    s = text.strip()
    if s.startswith("```"):
        s = s[3:]
        if s[:4].lower() == "json":
            s = s[4:]
        end = s.rfind("```")
        if end != -1:
            s = s[:end]
    return s.strip()


_AI_SEMAPHORE = asyncio.Semaphore(4)


async def _request_json(
    system_prompt: str,
    user_prompt: str,
    *,
    max_tokens: int = 1024,
) -> dict[str, Any]:
    if not settings.ai_available:
        raise AIError("no-api-key")

    payload: dict[str, Any] = {
        "model": settings.AI_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.7,
        "max_tokens": max_tokens,
    }
    headers = {
        "Authorization": f"Bearer {settings.AI_API_KEY}",
        "x-portkey-api-key": settings.AI_API_KEY,
        "Content-Type": "application/json",
    }
    if settings.ai_is_portkey:
        headers["x-portkey-metadata"] = json.dumps(
            {"_user": settings.AI_USER, "application_name": settings.AI_APP_NAME}
        )
    else:
        payload["response_format"] = {"type": "json_object"}

    url = f"{settings.AI_BASE_URL.rstrip('/')}/chat/completions"
    try:
        async with _AI_SEMAPHORE:
            async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT_SECONDS) as client:
                response = await client.post(url, json=payload, headers=headers)
    except httpx.TimeoutException as exc:
        raise AIError("timeout") from exc
    except httpx.HTTPError as exc:
        raise AIError("error") from exc
    if response.status_code != 200:
        raise AIError("error")
    try:
        body = response.json()
        content = body["choices"][0]["message"]["content"]
        raw = json.loads(_strip_code_fence(content))
    except (KeyError, IndexError, ValueError, TypeError) as exc:
        raise AIError("invalid-response") from exc
    if not isinstance(raw, dict):
        raise AIError("invalid-response")
    return raw


async def generate_narrative(
    input_data: dict[str, Any],
    result: dict[str, Any],
    tone: str | None = None,
) -> dict[str, Any]:
    locale = input_data["locale"]
    raw = await _request_json(
        ai_safety.build_system_prompt(locale, tone),
        ai_safety.build_user_prompt(input_data, result),
    )
    try:
        return ai_safety.parse_ai_response(raw, locale)
    except ValueError as exc:
        # Validation / safety failure — fall back to deterministic reading.
        raise AIError("invalid-response") from exc


async def generate_deep_dive(data: dict[str, Any]) -> dict[str, str]:
    locale = data["input"]["locale"]
    raw = await _request_json(
        ai_safety.build_tool_system_prompt(
            locale,
            "Ask exactly one deeper question based on the selected reflection question and the user's answer.",
            '{"followUpQuestion": "<one question>"}',
        ),
        ai_safety.build_tool_user_prompt(data),
        max_tokens=300,
    )
    try:
        return ai_safety.parse_deep_dive_response(raw, locale)
    except ValueError as exc:
        raise AIError("invalid-response") from exc


async def generate_perspective(data: dict[str, Any]) -> dict[str, str]:
    locale = data["input"]["locale"]
    perspective = data["perspective"]
    task = {
        "friend": "Offer a brief perspective like a caring, honest friend.",
        "pragmatic": "Offer a brief practical perspective focused on what is known and controllable.",
        "selfCompassion": "Offer a brief self-compassion perspective without minimizing difficulty.",
    }[perspective]
    raw = await _request_json(
        ai_safety.build_tool_system_prompt(locale, task, '{"text": "<brief perspective>"}'),
        ai_safety.build_tool_user_prompt(data),
        max_tokens=500,
    )
    try:
        return ai_safety.parse_perspective_response(raw, locale)
    except ValueError as exc:
        raise AIError("invalid-response") from exc


async def generate_action_plan(data: dict[str, Any]) -> dict[str, Any]:
    locale = data["input"]["locale"]
    raw = await _request_json(
        ai_safety.build_tool_system_prompt(
            locale,
            "Break the chosen action into exactly three tiny, realistic steps and one lower-effort fallback.",
            '{"steps": ["<step 1>", "<step 2>", "<step 3>"], "fallback": "<fallback>"}',
        ),
        ai_safety.build_tool_user_prompt(data),
        max_tokens=600,
    )
    try:
        return ai_safety.parse_action_plan_response(raw, locale)
    except ValueError as exc:
        raise AIError("invalid-response") from exc


async def generate_weekly_review(data: dict[str, Any]) -> dict[str, Any]:
    locale = data["locale"]
    raw = await _request_json(
        ai_safety.build_tool_system_prompt(
            locale,
            "Summarize only observed themes across these records. Name up to three patterns, one grounded encouragement, and one next reflection question. Do not infer personality or mental health.",
            '{"summary": "<summary>", "patterns": ["<pattern>"], "encouragement": "<encouragement>", "nextQuestion": "<question>"}',
        ),
        ai_safety.build_tool_user_prompt(data),
        max_tokens=900,
    )
    try:
        return ai_safety.parse_weekly_review_response(raw, locale)
    except ValueError as exc:
        raise AIError("invalid-response") from exc


async def generate_future_letter(data: dict[str, Any]) -> dict[str, str]:
    locale = data["input"]["locale"]
    raw = await _request_json(
        ai_safety.build_tool_system_prompt(
            locale,
            "Write a short letter from the user's present self to their future self. Reflect what they know and hope to remember without predicting what happens.",
            '{"text": "<letter>"}',
        ),
        ai_safety.build_tool_user_prompt(data),
        max_tokens=900,
    )
    try:
        return ai_safety.parse_future_letter_response(raw, locale)
    except ValueError as exc:
        raise AIError("invalid-response") from exc

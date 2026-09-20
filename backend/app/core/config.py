"""Runtime configuration loaded from environment variables."""
from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    # AI (OpenAI-compatible) configuration.
    # PORTKEY_* env vars are accepted as aliases so a Portkey gateway can be
    # configured without renaming the provided credentials.
    AI_API_KEY: str = os.getenv("AI_API_KEY") or os.getenv("PORTKEY_API_KEY", "")
    AI_BASE_URL: str = (
        os.getenv("AI_BASE_URL")
        or os.getenv("PORTKEY_BASE_URL")
        or "https://api.openai.com/v1"
    )
    AI_MODEL: str = os.getenv("AI_MODEL", "gpt-4o-mini")
    AI_TIMEOUT_SECONDS: float = float(os.getenv("AI_TIMEOUT_SECONDS", "20"))
    # Portkey gateways enforce a mandatory-metadata guardrail: requests must send
    # an ``x-portkey-metadata`` header carrying ``_user`` and ``application_name``
    # (HTTP 446 otherwise). These are only used when the base URL is a Portkey
    # gateway; harmless for plain OpenAI.
    AI_APP_NAME: str = (
        os.getenv("AI_APP_NAME")
        or os.getenv("NIMBLEAI_APPLICATION_NAME")
        or "heart-symbol"
    )
    AI_USER: str = os.getenv("AI_USER", "heart-symbol")

    @property
    def ai_is_portkey(self) -> bool:
        return "portkey" in self.AI_BASE_URL or "airouter" in self.AI_BASE_URL

    # Comma-separated list of allowed CORS origins for the React frontend.
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ]

    @property
    def ai_available(self) -> bool:
        return bool(self.AI_API_KEY)


settings = Settings()

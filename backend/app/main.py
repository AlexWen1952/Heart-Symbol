"""FastAPI application entrypoint for the Heart Symbol backend."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .routers import ai_narrative, ai_tools, concern, reading

app = FastAPI(
    title="Heart Symbol API",
    description="Backend for the bilingual reflection app Heart Symbol (心符).",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reading.router)
app.include_router(concern.router)
app.include_router(ai_narrative.router)
app.include_router(ai_tools.router)


@app.get("/api/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}

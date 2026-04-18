"""
Opportunity Inbox Copilot — FastAPI Backend

Multi-agent AI pipeline:
  Emails → Classifier → Extractor → Validator → Scoring → Ranker → Output

Endpoints:
  POST /api/pipeline        — full pipeline (emails + profile → ranked)
  POST /api/pipeline/sample — run with built-in sample data
  POST /api/classify        — classification only (debug)
  POST /api/score           — scoring only (debug)
  GET  /api/sample-data     — get sample emails + default profile
  GET  /api/health          — health check
"""

from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .models import (
    EmailInput,
    PipelineRequest,
    PipelineResponse,
    StudentProfile,
    ValidatedOpportunity,
)
from .pipeline import run_pipeline
from .scoring import score_opportunity
from .agents.classifier import ClassifierAgent
from .sample_data import SAMPLE_EMAILS, DEFAULT_STUDENT_PROFILE

# ── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(name)-18s │ %(levelname)-7s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("app")


# ── App Setup ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Opportunity Inbox Copilot starting up")
    yield
    logger.info("👋 Shutting down")


app = FastAPI(
    title="Opportunity Inbox Copilot",
    description="Multi-agent AI pipeline for classifying, scoring, and ranking student opportunities.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health Check ─────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Opportunity Inbox Copilot",
        "version": "1.0.0",
        "pipeline": [
            "1. Classifier  (gemini-2.5-flash-lite)",
            "2. Extractor   (gemini-2.5-flash)",
            "3. Validator   (gemini-2.5-flash-lite)",
            "4. Scoring     (deterministic + gemini-embedding-001)",
            "5. Ranker      (gemini-2.5-pro)",
        ],
    }


# ── Sample Data ──────────────────────────────────────────────────────────────

@app.get("/api/sample-data")
async def get_sample_data():
    """Return sample emails and default student profile for testing."""
    return {
        "emails": [e.model_dump() for e in SAMPLE_EMAILS],
        "student_profile": DEFAULT_STUDENT_PROFILE.model_dump(),
    }


# ── Full Pipeline ────────────────────────────────────────────────────────────

@app.post("/api/pipeline", response_model=PipelineResponse)
async def run_full_pipeline(request: PipelineRequest):
    """
    Run the full multi-agent pipeline:
    Classify → Extract → Validate → Score → Rank
    """
    start = time.time()
    logger.info("═══ Pipeline request: %d emails ═══", len(request.emails))

    try:
        result = await run_pipeline(request.emails, request.student_profile)
        elapsed = time.time() - start
        logger.info("Pipeline completed in %.1fs", elapsed)
        result.message += f" (completed in {elapsed:.1f}s)"
        return result

    except ValueError as exc:
        logger.error("Pipeline validation error: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc))
    except RuntimeError as exc:
        logger.error("Pipeline runtime error: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected pipeline error")
        raise HTTPException(status_code=500, detail=f"Internal error: {exc}")


# ── Run with Sample Data ─────────────────────────────────────────────────────

@app.post("/api/pipeline/sample")
async def run_sample_pipeline():
    """Run the full pipeline with built-in sample data."""
    request = PipelineRequest(
        emails=SAMPLE_EMAILS,
        student_profile=DEFAULT_STUDENT_PROFILE,
    )
    return await run_full_pipeline(request)


# ── Debug: Classification Only ───────────────────────────────────────────────

class ClassifyRequest(BaseModel):
    emails: list[EmailInput]


@app.post("/api/classify")
async def classify_only(request: ClassifyRequest):
    """Run only the classification stage (Agent 1) for debugging."""
    try:
        classifier = ClassifierAgent()
        results = await classifier.run(request.emails)
        return {
            "classifications": [r.model_dump() for r in results],
            "opportunities": sum(1 for r in results if r.is_opportunity),
            "rejected": sum(1 for r in results if not r.is_opportunity),
        }
    except Exception as exc:
        logger.exception("Classification error")
        raise HTTPException(status_code=500, detail=str(exc))


# ── Debug: Scoring Only ──────────────────────────────────────────────────────

class ScoreRequest(BaseModel):
    opportunities: list[ValidatedOpportunity]
    student_profile: StudentProfile = StudentProfile()


@app.post("/api/score")
async def score_only(request: ScoreRequest):
    """Run only the scoring engine (with embeddings) for debugging."""
    import asyncio
    results = await asyncio.gather(
        *[score_opportunity(opp, request.student_profile)
          for opp in request.opportunities]
    )
    return {
        "scores": [r.model_dump() for r in results],
    }

"""
Pipeline Orchestrator

Runs the full multi-agent pipeline:
  1. Classifier → filter real opportunities from noise
  2. Extractor → pull structured fields
  3. Validator → normalise and clean
  4. Scoring Engine (deterministic code)
  5. Ranker → final ranked + explained output

Stores intermediate results at each stage for transparency / debugging.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from .agents import ClassifierAgent, ExtractorAgent, ValidatorAgent, RankerAgent
from .models import (
    EmailInput,
    PipelineResponse,
    StudentProfile,
)
from .scoring import score_opportunity

logger = logging.getLogger("pipeline")


async def run_pipeline(
    emails: list[EmailInput],
    student_profile: StudentProfile,
) -> PipelineResponse:
    """
    Execute the full Opportunity Inbox Copilot pipeline.

    Parameters
    ----------
    emails : list[EmailInput]
        Raw emails to process.
    student_profile : StudentProfile
        The student's profile for scoring and ranking.

    Returns
    -------
    PipelineResponse
        Ranked opportunities with full debug info.
    """
    stages: dict[str, Any] = {}

    # ── Stage 1: Classify ────────────────────────────────────────────────
    logger.info("═══ Stage 1: Classification (%d emails) ═══", len(emails))
    classifier = ClassifierAgent()
    classifications = await classifier.run(emails)
    stages["classification"] = [c.model_dump() for c in classifications]

    # Filter to confirmed opportunities
    confirmed_ids = {
        c.id for c in classifications if c.is_opportunity
    }
    confirmed_emails = [e for e in emails if e.id in confirmed_ids]

    if not confirmed_emails:
        logger.info("No real opportunities found. Pipeline complete.")
        return PipelineResponse(
            ranked=[],
            rejected_count=len(emails),
            total_emails=len(emails),
            pipeline_stages=stages,
            message="No real opportunities found in this batch.",
        )

    logger.info(
        "Classified: %d opportunities, %d rejected",
        len(confirmed_emails),
        len(emails) - len(confirmed_emails),
    )

    # ── Stage 2: Extract ─────────────────────────────────────────────────
    logger.info("═══ Stage 2: Extraction (%d emails) ═══", len(confirmed_emails))
    extractor = ExtractorAgent()
    extracted = await extractor.run(confirmed_emails)
    stages["extraction"] = [e.model_dump() for e in extracted]

    # ── Stage 3: Validate ────────────────────────────────────────────────
    logger.info("═══ Stage 3: Validation (%d opportunities) ═══", len(extracted))
    validator = ValidatorAgent()
    validated = await validator.run(extracted)
    stages["validation"] = [v.model_dump() for v in validated]

    # ── Stage 4: Scoring + Embeddings ──────────────────────────────────
    logger.info("═══ Stage 4: Scoring (%d opportunities) ═══", len(validated))
    scored = await asyncio.gather(
        *[score_opportunity(v, student_profile) for v in validated]
    )
    stages["scoring"] = [s.model_dump() for s in scored]

    # Merge validated data + scores for the ranker
    validated_and_scored: list[dict[str, Any]] = []
    for v, s in zip(validated, scored):
        merged = {**v.model_dump(), **s.model_dump()}
        validated_and_scored.append(merged)

    # ── Stage 5: Rank + Explain ──────────────────────────────────────────
    logger.info("═══ Stage 5: Ranking (%d opportunities) ═══", len(validated_and_scored))
    ranker = RankerAgent()
    ranked = await ranker.run(student_profile, validated_and_scored)
    stages["ranking"] = [r.model_dump() for r in ranked]

    logger.info("══════ Pipeline complete ══════")

    return PipelineResponse(
        ranked=ranked,
        rejected_count=len(emails) - len(confirmed_emails),
        total_emails=len(emails),
        pipeline_stages=stages,
        message=f"Processed {len(emails)} emails → {len(ranked)} opportunities ranked.",
    )

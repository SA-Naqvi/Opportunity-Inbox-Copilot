"""
Agent 1 — Classifier

Determines whether each email contains a REAL student opportunity.
Model: google/gemini-flash-1.5 (fast, cheap — binary classification task)
"""

from __future__ import annotations

import json
import logging
from typing import Any

from ..llm_client import call_llm_json, CLASSIFIER_MODEL
from ..models import ClassificationResult, EmailInput

logger = logging.getLogger("agent.classifier")

SYSTEM_PROMPT = """\
You are the Classifier agent in the Opportunity Inbox Copilot pipeline.

Your only job is to decide, for each email, whether it contains a REAL OPPORTUNITY
that a university student might act on.

DEFINITION OF A REAL OPPORTUNITY:
An opportunity is a specific, actionable offering directed at students. It must fall
into at least one of these types:
  internship | scholarship | fellowship | competition | hackathon | research_position
  | grant | admission | exchange_program | job | award | conference_with_call_for_papers

NOT an opportunity:
  - General newsletters or digests
  - Promotions, discounts, sales
  - Event announcements with no student call-to-action
  - Spam or phishing
  - Vague announcements ("exciting things coming soon")
  - Informational updates with no application or submission process

STRICT RULES:
  - Do NOT use world knowledge to fill in missing details. Only use what is in the email.
  - If you are genuinely unsure, set is_opportunity: false and confidence < 0.5
  - Never infer that something is an opportunity unless the email explicitly describes one.

OUTPUT FORMAT (strict JSON array, one object per input email):
[
  {
    "id": "email_001",
    "is_opportunity": true,
    "opportunity_type": "internship",
    "confidence": 0.95,
    "reasoning": "Email explicitly invites applications for a summer internship at XYZ Corp with a stated deadline."
  }
]

Rules for confidence:
  0.9–1.0  → explicit, clear opportunity with stated call-to-action
  0.7–0.89 → strong signals but some ambiguity (e.g., deadline or type unclear)
  0.5–0.69 → partial signals, could be opportunity or not
  < 0.5    → set is_opportunity: false

Only output valid JSON. No preamble, no markdown fences, no extra text.\
"""


class ClassifierAgent:
    """Classifies emails as real student opportunities or noise."""

    model = CLASSIFIER_MODEL

    async def run(self, emails: list[EmailInput]) -> list[ClassificationResult]:
        """
        Classify a batch of emails.

        Returns a ClassificationResult for every input email.
        """
        emails_payload = [e.model_dump() for e in emails]
        user_message = (
            "Classify each of the following emails. Return a JSON array as instructed.\n\n"
            "EMAILS:\n"
            f"{json.dumps(emails_payload, indent=2)}"
        )

        logger.info("Classifying %d emails with model=%s", len(emails), self.model)

        raw: list[dict[str, Any]] = await call_llm_json(
            model=self.model,
            system_prompt=SYSTEM_PROMPT,
            user_message=user_message,
        )

        results: list[ClassificationResult] = []
        for item in raw:
            try:
                results.append(ClassificationResult(**item))
            except Exception as exc:
                logger.warning("Skipping malformed classification item: %s — %s", item, exc)
                continue

        # Ensure every input email has a result (default to non-opportunity)
        result_ids = {r.id for r in results}
        for email in emails:
            if email.id not in result_ids:
                logger.warning("No classification for email %s — defaulting to non-opportunity", email.id)
                results.append(
                    ClassificationResult(
                        id=email.id,
                        is_opportunity=False,
                        opportunity_type=None,
                        confidence=0.0,
                        reasoning="No classification returned by LLM.",
                    )
                )

        logger.info(
            "Classification complete: %d opportunities, %d rejected",
            sum(1 for r in results if r.is_opportunity),
            sum(1 for r in results if not r.is_opportunity),
        )
        return results

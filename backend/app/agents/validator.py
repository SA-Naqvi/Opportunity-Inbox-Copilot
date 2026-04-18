"""
Agent 3 — Validator

Normalises dates, cleans lists, and flags completeness / suspicious issues.
Model: google/gemini-flash-1.5 (structured cleaning task)
"""

from __future__ import annotations

import json
import logging
from datetime import date
from typing import Any

from ..llm_client import call_llm_json, VALIDATOR_MODEL
from ..models import ExtractedOpportunity, ValidatedOpportunity

logger = logging.getLogger("agent.validator")

SYSTEM_PROMPT = """\
You are the Validator agent in the Opportunity Inbox Copilot pipeline.

You receive extracted opportunity data and must clean and validate it.

YOUR TASKS:

1. DATE NORMALISATION
   - Convert all deadline values to ISO format: YYYY-MM-DD
   - If deadline is a relative expression like "in 2 weeks" → use today's date
     (provided below) to compute the absolute date
   - If deadline cannot be parsed at all → set deadline to null and add a flag
   - If deadline has already passed (relative to today) → flag as "deadline_passed"

2. LIST CLEANING
   - Remove duplicate items from eligibility_conditions and required_documents
   - Remove empty strings, whitespace-only entries, or meaningless entries like "etc."
   - Trim leading/trailing whitespace from each item

3. COMPLETENESS FLAGS
   Return a completeness_flags array listing which key fields are null:
   Key fields: title, deadline, eligibility_conditions, application_link

4. SUSPICIOUS FLAGS
   Flag the entry if:
   - The application_link looks like a phishing URL (IP address, misspelled domain)
   - The deadline has already passed
   - No eligibility conditions AND no required documents are present

5. DO NOT change the extracted values themselves unless:
   - You are normalising a date
   - You are deduplicating a list
   - You are cleaning whitespace

OUTPUT FORMAT (strict JSON array):
[
  {
    "id": "email_001",
    "title": "Google Summer Internship 2025",
    "organization": "Google",
    "opportunity_type": "internship",
    "deadline": "2025-05-30",
    "eligibility_conditions": ["Must be enrolled in BS/BE program", "Minimum CGPA 3.0"],
    "required_documents": ["CV", "Transcript", "Cover letter"],
    "stipend_or_amount": "$500/month",
    "location": "Lahore, Pakistan",
    "application_link": "https://example.com/apply",
    "contact_information": "hr@example.com",
    "duration": "2 months",
    "completeness_flags": [],
    "suspicious_flags": []
  }
]

Today's date: {{today_date}}

Only output valid JSON. No preamble, no markdown fences, no extra text.\
"""


class ValidatorAgent:
    """Validates, normalises, and flags extracted opportunity data."""

    model = VALIDATOR_MODEL

    async def run(
        self, extracted: list[ExtractedOpportunity]
    ) -> list[ValidatedOpportunity]:
        """
        Validate and clean extracted opportunity data.
        """
        today = date.today().isoformat()
        system = SYSTEM_PROMPT.replace("{{today_date}}", today)

        extracted_payload = [e.model_dump() for e in extracted]
        user_message = (
            f"Validate and clean the following extracted opportunity data.\n"
            f"Today's date is {today}.\n\n"
            "EXTRACTED DATA:\n"
            f"{json.dumps(extracted_payload, indent=2)}"
        )

        logger.info("Validating %d opportunities with model=%s", len(extracted), self.model)

        raw: list[dict[str, Any]] = await call_llm_json(
            model=self.model,
            system_prompt=system,
            user_message=user_message,
        )

        results: list[ValidatedOpportunity] = []
        for item in raw:
            try:
                results.append(ValidatedOpportunity(**item))
            except Exception as exc:
                logger.warning("Skipping malformed validation item: %s — %s", item, exc)
                continue

        logger.info("Validation complete: %d opportunities validated", len(results))
        return results

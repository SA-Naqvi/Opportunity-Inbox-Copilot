"""
Agent 2 — Extractor

Extracts structured fields from confirmed opportunity emails.
Model: anthropic/claude-sonnet-4-20250514 (strong structured output)
"""

from __future__ import annotations

import json
import logging
from typing import Any

from ..llm_client import call_llm_json, EXTRACTOR_MODEL
from ..models import EmailInput, ExtractedOpportunity

logger = logging.getLogger("agent.extractor")

SYSTEM_PROMPT = """\
You are the Extractor agent in the Opportunity Inbox Copilot pipeline.

You receive emails that have already been confirmed as real opportunities.
Your job is to extract every structured field you can find.

EXTRACTION FIELDS (extract exactly these):
  title                  → name of the opportunity or program
  organization           → issuing body / company / institution
  opportunity_type       → one of: internship | scholarship | fellowship | competition
                           | hackathon | research_position | grant | admission
                           | exchange_program | job | award | conference_cfp
  deadline               → extract EXACTLY as written. Do not normalise here.
  eligibility_conditions → list of strings, each a discrete condition
  required_documents     → list of strings, each a discrete document
  stipend_or_amount      → any mentioned financial value (string, as written)
  location               → physical location, country, or "Remote"
  application_link       → full URL if present
  contact_information    → email address, phone, or contact name if present
  duration               → length of the program/internship/etc. if mentioned

ABSOLUTE RULES — READ CAREFULLY:
  1. If a field is not explicitly stated in the email → return null for that field.
  2. DO NOT infer, assume, or guess any field value.
  3. DO NOT fabricate URLs, email addresses, names, or dates.
  4. Copy eligibility_conditions and required_documents as discrete items, not as
     one long string. Split on "and", commas, bullet points, or line breaks.
  5. DO NOT merge two different fields into one.
  6. DO NOT add information from your training knowledge about the organisation.

OUTPUT FORMAT (strict JSON array):
[
  {
    "id": "email_001",
    "title": null,
    "organization": null,
    "opportunity_type": "internship",
    "deadline": "May 30, 2025",
    "eligibility_conditions": ["Must be enrolled in BS/BE program", "Minimum CGPA 3.0"],
    "required_documents": ["CV", "Transcript", "Cover letter"],
    "stipend_or_amount": "$500/month",
    "location": "Lahore, Pakistan",
    "application_link": "https://example.com/apply",
    "contact_information": "hr@example.com",
    "duration": "2 months"
  }
]

Only output valid JSON. No preamble, no markdown fences, no extra text.\
"""


class ExtractorAgent:
    """Extracts structured opportunity data from confirmed emails."""

    model = EXTRACTOR_MODEL

    async def run(self, confirmed_emails: list[EmailInput]) -> list[ExtractedOpportunity]:
        """
        Extract structured fields from each confirmed opportunity email.
        """
        emails_payload = [e.model_dump() for e in confirmed_emails]
        user_message = (
            "Extract structured fields from the following confirmed opportunity emails.\n\n"
            "EMAILS:\n"
            f"{json.dumps(emails_payload, indent=2)}"
        )

        logger.info("Extracting from %d emails with model=%s", len(confirmed_emails), self.model)

        raw: list[dict[str, Any]] = await call_llm_json(
            model=self.model,
            system_prompt=SYSTEM_PROMPT,
            user_message=user_message,
        )

        results: list[ExtractedOpportunity] = []
        for item in raw:
            try:
                results.append(ExtractedOpportunity(**item))
            except Exception as exc:
                logger.warning("Skipping malformed extraction item: %s — %s", item, exc)
                continue

        logger.info("Extraction complete: %d opportunities extracted", len(results))
        return results

"""
Agent 4 — Ranker + Explainer

Takes validated + scored opportunities and generates the final ranked output
with student-specific explanations, strengths, risks, and next steps.
Model: anthropic/claude-sonnet-4-20250514 (nuanced reasoning)
"""

from __future__ import annotations

import json
import logging
from typing import Any

from ..llm_client import call_llm_json, RANKER_MODEL
from ..models import RankedOpportunity, StudentProfile, ValidatedOpportunity, ScoredOpportunity

logger = logging.getLogger("agent.ranker")

SYSTEM_PROMPT = """\
You are the Ranker and Explainer agent — the final stage of the Opportunity Inbox
Copilot pipeline.

You receive:
  1. Validated opportunity data (from the Validator)
  2. Computed scores (from the deterministic scoring engine)
  3. The student profile

Your job is to generate a final, ranked, human-readable output that tells the student:
  - Which opportunities to act on first
  - Why each opportunity is relevant to THEM specifically
  - What the key strengths and risks are
  - Exactly what to do next

STRICT RULES:
  1. DO NOT change the total_score or any score_breakdown values. They are fixed.
  2. Sort the output array by total_score descending.
  3. Opportunities with eligibility_hard_block: true must appear AFTER all
     non-blocked opportunities, regardless of score.
  4. Explanations must be SPECIFIC to the student profile provided. Do not write
     generic descriptions. Reference actual skills, interests, or profile fields.
  5. next_steps must be concrete and actionable. Not "check the website" but
     "Visit https://example.com/apply and submit your CV and transcript before May 30."
  6. If deadline has passed → add a risk: "Deadline has passed. Verify if the
     organisation accepts late applications."
  7. Keep why_relevant to 1–2 sentences MAXIMUM. Be concise.
  8. Keep key_strengths to 2–3 bullet points MAXIMUM (short phrases only).
  9. Keep risks to 1–2 items MAXIMUM (short phrases only).
 10. Keep next_steps to 2–3 items MAXIMUM (one action per step).
 11. DO NOT hallucinate any details not present in the validated data.
 12. CRITICAL: You must output a complete, valid JSON array. Every opened brace
     must be closed. Never truncate the output.

OUTPUT FORMAT (strict JSON array, sorted by total_score descending):
[
  {
    "rank": 1,
    "id": "email_001",
    "title": "Google Summer Internship 2025",
    "organization": "Google",
    "opportunity_type": "internship",
    "deadline": "2025-05-30",
    "deadline_urgency": "HIGH — 4 days remaining",
    "total_score": 78,
    "score_breakdown": {
      "urgency": 25,
      "profile_match": 28,
      "eligibility": 20,
      "completeness": 5
    },
    "eligibility_hard_block": false,
    "why_relevant": "This internship directly matches your Python and ML skills and is listed under your preferred type. The location is Lahore, aligning with your preference.",
    "key_strengths": [
      "Matches 3 of your listed skills: Python, ML, React",
      "Internship type is in your preferred list",
      "Paid position — relevant given your financial need"
    ],
    "risks": [
      "Deadline is in 4 days — act immediately",
      "Cover letter required — allow 1–2 hours to prepare"
    ],
    "next_steps": [
      "Visit https://example.com/apply today",
      "Prepare CV and transcript (required documents)",
      "Write a cover letter highlighting your Python and ML experience",
      "Submit before 2025-05-30"
    ],
    "extracted_fields": {
      "eligibility_conditions": ["BS/BE enrolled", "CGPA >= 3.0"],
      "required_documents": ["CV", "Transcript", "Cover letter"],
      "stipend_or_amount": "$500/month",
      "location": "Lahore, Pakistan",
      "application_link": "https://example.com/apply",
      "contact_information": "hr@example.com",
      "duration": "2 months"
    },
    "completeness_flags": [],
    "suspicious_flags": []
  }
]

Only output valid JSON. No preamble, no markdown fences, no extra text.\
"""


class RankerAgent:
    """Generates the final ranked + explained output for the student."""

    model = RANKER_MODEL

    async def run(
        self,
        student_profile: StudentProfile,
        validated_and_scored: list[dict[str, Any]],
    ) -> list[RankedOpportunity]:
        """
        Rank and explain opportunities for a specific student.

        Parameters
        ----------
        student_profile : StudentProfile
            The student's profile.
        validated_and_scored : list[dict]
            Merged validated opportunity data + score data.
        """
        user_message = (
            "Generate the final ranked output.\n\n"
            "STUDENT PROFILE:\n"
            f"{json.dumps(student_profile.model_dump(), indent=2)}\n\n"
            "VALIDATED OPPORTUNITIES (with scores already attached):\n"
            f"{json.dumps(validated_and_scored, indent=2)}"
        )

        logger.info(
            "Ranking %d opportunities with model=%s",
            len(validated_and_scored),
            self.model,
        )

        raw: list[dict[str, Any]] = await call_llm_json(
            model=self.model,
            system_prompt=SYSTEM_PROMPT,
            user_message=user_message,
            max_tokens=16384,   # ranker output grows with opportunity count; 4 K default truncates JSON
        )

        results: list[RankedOpportunity] = []
        for item in raw:
            try:
                results.append(RankedOpportunity(**item))
            except Exception as exc:
                logger.warning("Skipping malformed ranked item: %s — %s", item, exc)
                continue

        # Ensure sorting: non-blocked first (desc by score), blocked last (desc by score)
        non_blocked = sorted(
            [r for r in results if not r.eligibility_hard_block],
            key=lambda r: r.total_score,
            reverse=True,
        )
        blocked = sorted(
            [r for r in results if r.eligibility_hard_block],
            key=lambda r: r.total_score,
            reverse=True,
        )
        final = non_blocked + blocked

        # Re-assign ranks
        for i, item in enumerate(final, 1):
            item.rank = i

        logger.info("Ranking complete: %d items ranked", len(final))
        return final

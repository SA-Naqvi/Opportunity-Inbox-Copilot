"""
Deterministic Scoring Engine (with Semantic Embeddings)

Total score = Urgency (30) + Profile Match (35) + Eligibility Fit (25) + Completeness (10)

The scoring formula is 100% deterministic code.
Embeddings are used ONLY for semantic skill/interest matching:
  - "Machine Learning" ↔ "ML", "deep learning", "neural networks"
  - "software engineering" ↔ "coding", "development", "programming"

Same input + same embeddings → same score, every time.
"""

from __future__ import annotations

import re
import logging
from datetime import date, datetime
from typing import Optional

from .llm_client import get_embeddings, cosine_similarity
from .models import (
    ScoreBreakdown,
    ScoredOpportunity,
    StudentProfile,
    ValidatedOpportunity,
)

logger = logging.getLogger("scoring")

# Similarity threshold for semantic matching
SKILL_SIMILARITY_THRESHOLD = 0.65
INTEREST_SIMILARITY_THRESHOLD = 0.60


# ── Helpers ──────────────────────────────────────────────────────────────────

def _parse_date(date_str: Optional[str]) -> Optional[date]:
    """Try to parse an ISO date string (YYYY-MM-DD)."""
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str.strip(), "%Y-%m-%d").date()
    except ValueError:
        for fmt in ("%Y/%m/%d", "%d-%m-%Y", "%m/%d/%Y"):
            try:
                return datetime.strptime(date_str.strip(), fmt).date()
            except ValueError:
                continue
        return None


def _build_opportunity_text(opp: ValidatedOpportunity) -> str:
    """Concatenate all text fields into a single lowercase search string."""
    parts = [
        opp.title or "",
        opp.organization or "",
        opp.opportunity_type or "",
        opp.location or "",
        opp.stipend_or_amount or "",
        opp.duration or "",
    ]
    if opp.eligibility_conditions:
        parts.extend(opp.eligibility_conditions)
    if opp.required_documents:
        parts.extend(opp.required_documents)
    return " ".join(parts).lower()


def _extract_cgpa_requirement(conditions: Optional[list[str]]) -> Optional[float]:
    """Parse eligibility conditions for a CGPA/GPA requirement."""
    if not conditions:
        return None

    patterns = [
        r"cgpa\s*(?:>=?|above|minimum|at\s+least|of)\s*(\d+\.?\d*)",
        r"gpa\s*(?:>=?|above|minimum|at\s+least|of)\s*(\d+\.?\d*)",
        r"minimum\s+(?:cgpa|gpa)\s*(?:of\s+)?(\d+\.?\d*)",
        r"(\d+\.?\d*)\s*(?:cgpa|gpa)\s*(?:or\s+(?:above|higher))",
    ]

    for condition in conditions:
        cond_lower = condition.lower()
        for pattern in patterns:
            match = re.search(pattern, cond_lower)
            if match:
                try:
                    return float(match.group(1))
                except ValueError:
                    continue
    return None


def _check_degree_match(conditions: Optional[list[str]], student_degree: str) -> Optional[bool]:
    """Check if eligibility mentions a degree requirement and whether it matches."""
    if not conditions:
        return None

    degree_keywords = [
        "bs", "b.s.", "bachelor", "be", "b.e.", "bsc", "b.sc.",
        "ms", "m.s.", "master", "msc", "m.sc.",
        "phd", "ph.d.", "doctorate",
        "computer science", "cs", "software", "engineering",
        "data science", "information technology", "it",
    ]

    student_lower = student_degree.lower()
    has_degree_requirement = False

    for condition in conditions:
        cond_lower = condition.lower()
        found_keywords = [kw for kw in degree_keywords if kw in cond_lower]
        if not found_keywords:
            continue
        has_degree_requirement = True
        for kw in found_keywords:
            if kw in student_lower:
                return True

    if has_degree_requirement:
        return False
    return None


def _check_experience_requirement(
    conditions: Optional[list[str]],
    student_semester: int,
    student_experience: list[str],
) -> Optional[bool]:
    """Check if the student meets semester or experience requirements."""
    if not conditions:
        return None

    semester_pattern = r"semester\s*(?:>=?|above|at\s+least)?\s*(\d+)"
    year_pattern = r"(?:(\d+)(?:st|nd|rd|th)?\s+year|year\s*(\d+))"

    for condition in conditions:
        cond_lower = condition.lower()
        match = re.search(semester_pattern, cond_lower)
        if match:
            return student_semester >= int(match.group(1))
        match = re.search(year_pattern, cond_lower)
        if match:
            required_year = int(match.group(1) or match.group(2))
            return (student_semester + 1) // 2 >= required_year

    return None


# ── Main Scoring Functions ───────────────────────────────────────────────────

def compute_urgency_score(deadline_str: Optional[str]) -> tuple[int, str]:
    """Urgency score (max 30) based on days until deadline."""
    deadline = _parse_date(deadline_str)

    if deadline is None:
        return 5, "UNKNOWN"

    days = (deadline - date.today()).days

    if days < 0:
        return 0, "EXPIRED"
    elif days <= 3:
        return 30, "CRITICAL"
    elif days <= 7:
        return 25, "HIGH"
    elif days <= 14:
        return 18, "MEDIUM"
    elif days <= 30:
        return 10, "LOW"
    else:
        return 4, "LOW"


async def compute_profile_match_score(
    opp: ValidatedOpportunity,
    profile: StudentProfile,
) -> int:
    """
    Profile match score (max 35) — uses EMBEDDINGS for semantic matching.

    Sub-components: skill (15) + type (10) + interest (5) + financial (3) + location (2)
    """
    opp_text = _build_opportunity_text(opp)

    # ── Semantic Skill overlap (max 15) ──
    # Embed student skills and opportunity text, compare semantically
    try:
        skill_texts = profile.skills + [opp_text]
        embeddings = await get_embeddings(skill_texts)

        opp_embedding = embeddings[-1]
        skill_embeddings = embeddings[:-1]

        matched_skills = 0
        for i, skill_emb in enumerate(skill_embeddings):
            sim = cosine_similarity(skill_emb, opp_embedding)
            if sim >= SKILL_SIMILARITY_THRESHOLD:
                matched_skills += 1
                logger.debug(
                    "Skill match: '%s' ↔ opp [%s]  sim=%.3f ✓",
                    profile.skills[i], opp.id, sim,
                )

    except Exception as exc:
        # Fallback to keyword matching if embeddings fail
        logger.warning("Embedding failed, falling back to keyword matching: %s", exc)
        matched_skills = sum(
            1 for skill in profile.skills if skill.lower() in opp_text
        )

    skill_score = min(15, matched_skills * 4)

    # ── Opportunity type match (max 10) ──
    opp_type = (opp.opportunity_type or "").lower().replace("_", " ")
    type_score = 0
    for pref in profile.preferred_opportunity_types:
        if pref.lower().replace("_", " ") in opp_type or opp_type in pref.lower().replace("_", " "):
            type_score = 10
            break

    # ── Semantic Interest overlap (max 5) ──
    try:
        interest_texts = profile.interests + [opp_text]
        embeddings = await get_embeddings(interest_texts)

        opp_embedding = embeddings[-1]
        interest_embeddings = embeddings[:-1]

        matched_interests = 0
        for i, int_emb in enumerate(interest_embeddings):
            sim = cosine_similarity(int_emb, opp_embedding)
            if sim >= INTEREST_SIMILARITY_THRESHOLD:
                matched_interests += 1
                logger.debug(
                    "Interest match: '%s' ↔ opp [%s]  sim=%.3f ✓",
                    profile.interests[i], opp.id, sim,
                )

    except Exception as exc:
        logger.warning("Embedding failed for interests, falling back: %s", exc)
        matched_interests = sum(
            1 for interest in profile.interests if interest.lower() in opp_text
        )

    interest_score = min(5, matched_interests * 2)

    # ── Financial need alignment (max 3) ──
    if profile.financial_need:
        financial_score = 3 if opp.stipend_or_amount else 0
    else:
        financial_score = 2  # neutral

    # ── Location preference (max 2) ──
    location_score = 0
    opp_location = (opp.location or "").lower()
    pref_parts = [p.strip().lower() for p in profile.location_preference.split("/")]
    for pref in pref_parts:
        if pref in opp_location:
            location_score = 2
            break
    if "remote" in opp_location:
        location_score = 2

    total = skill_score + type_score + interest_score + financial_score + location_score
    logger.info(
        "Profile match [%s]: skill=%d type=%d interest=%d financial=%d location=%d → %d",
        opp.id, skill_score, type_score, interest_score, financial_score, location_score, total,
    )
    return total


def compute_eligibility_score(
    opp: ValidatedOpportunity,
    profile: StudentProfile,
) -> tuple[int, bool]:
    """
    Eligibility fit score (max 25).
    Sub-components: cgpa (10) + degree (10) + experience (5).
    Returns (score, is_hard_blocked).
    """
    conditions = opp.eligibility_conditions
    hard_block = False

    required_cgpa = _extract_cgpa_requirement(conditions)
    if required_cgpa is None:
        cgpa_score = 10
    elif profile.cgpa >= required_cgpa:
        cgpa_score = 10
    else:
        cgpa_score = 0
        hard_block = True

    degree_match = _check_degree_match(conditions, profile.degree)
    if degree_match is None:
        degree_score = 8
    elif degree_match:
        degree_score = 10
    else:
        degree_score = 0
        hard_block = True

    exp_match = _check_experience_requirement(
        conditions, profile.semester, profile.past_experience
    )
    if exp_match is None:
        experience_score = 5
    elif exp_match:
        experience_score = 5
    else:
        experience_score = 0

    total = cgpa_score + degree_score + experience_score
    logger.debug(
        "Eligibility [%s]: cgpa=%d degree=%d experience=%d hard_block=%s → %d",
        opp.id, cgpa_score, degree_score, experience_score, hard_block, total,
    )
    return total, hard_block


def compute_completeness_score(opp: ValidatedOpportunity) -> int:
    """Completeness score (max 10) — count of non-null key fields."""
    key_fields = [
        opp.title,
        opp.deadline,
        opp.eligibility_conditions,
        opp.required_documents,
        opp.application_link,
    ]
    present = sum(1 for f in key_fields if f is not None)
    return int((present / 5) * 10)


# ── Public API ───────────────────────────────────────────────────────────────

async def score_opportunity(
    opp: ValidatedOpportunity,
    profile: StudentProfile,
) -> ScoredOpportunity:
    """
    Compute the full score for a single opportunity.

    Total = Urgency (30) + Profile Match (35) + Eligibility (25) + Completeness (10)
    Maximum possible score = 100.

    Uses Gemini embeddings for semantic skill/interest matching.
    """
    urgency, urgency_label = compute_urgency_score(opp.deadline)
    profile_match = await compute_profile_match_score(opp, profile)
    eligibility, hard_block = compute_eligibility_score(opp, profile)
    completeness = compute_completeness_score(opp)

    total = urgency + profile_match + eligibility + completeness

    breakdown = ScoreBreakdown(
        urgency=urgency,
        profile_match=profile_match,
        eligibility=eligibility,
        completeness=completeness,
    )

    result = ScoredOpportunity(
        id=opp.id,
        total_score=total,
        score_breakdown=breakdown,
        urgency_label=urgency_label,
        eligibility_hard_block=hard_block,
    )

    logger.info(
        "Scored [%s]: total=%d (U=%d PM=%d E=%d C=%d) urgency=%s blocked=%s",
        opp.id, total, urgency, profile_match, eligibility, completeness,
        urgency_label, hard_block,
    )
    return result

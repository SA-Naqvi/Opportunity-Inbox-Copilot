"""
Pydantic data models for the Opportunity Inbox Copilot pipeline.
Defines strict contracts between every stage: input, agents, scoring, and output.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


# ── Input Models ──────────────────────────────────────────────────────────────

class EmailInput(BaseModel):
    """A single email fed into the pipeline."""
    id: str
    subject: str
    body: str


class StudentProfile(BaseModel):
    """The student whose inbox we are triaging."""
    degree: str = "BS Computer Science"
    semester: int = 6
    cgpa: float = 3.4
    skills: list[str] = Field(default_factory=lambda: ["Python", "Machine Learning", "React"])
    interests: list[str] = Field(default_factory=lambda: ["AI", "software engineering", "research"])
    preferred_opportunity_types: list[str] = Field(
        default_factory=lambda: ["internship", "competition", "fellowship"]
    )
    financial_need: bool = True
    location_preference: str = "Pakistan / Remote"
    past_experience: list[str] = Field(
        default_factory=lambda: ["ICPC 2024 participant", "web dev intern at XYZ"]
    )


# ── Agent 1: Classifier Output ───────────────────────────────────────────────

class ClassificationResult(BaseModel):
    """Output from the Classifier agent for a single email."""
    id: str
    is_opportunity: bool
    opportunity_type: Optional[str] = None
    confidence: float
    reasoning: str


# ── Agent 2: Extractor Output ────────────────────────────────────────────────

class ExtractedOpportunity(BaseModel):
    """Structured fields pulled from a confirmed opportunity email."""
    id: str
    title: Optional[str] = None
    organization: Optional[str] = None
    opportunity_type: Optional[str] = None
    deadline: Optional[str] = None
    eligibility_conditions: Optional[list[str]] = None
    required_documents: Optional[list[str]] = None
    stipend_or_amount: Optional[str] = None
    location: Optional[str] = None
    application_link: Optional[str] = None
    contact_information: Optional[str] = None
    duration: Optional[str] = None


# ── Agent 3: Validator Output ────────────────────────────────────────────────

class ValidatedOpportunity(BaseModel):
    """Cleaned and validated opportunity data."""
    id: str
    title: Optional[str] = None
    organization: Optional[str] = None
    opportunity_type: Optional[str] = None
    deadline: Optional[str] = None  # ISO YYYY-MM-DD after validation
    eligibility_conditions: Optional[list[str]] = None
    required_documents: Optional[list[str]] = None
    stipend_or_amount: Optional[str] = None
    location: Optional[str] = None
    application_link: Optional[str] = None
    contact_information: Optional[str] = None
    duration: Optional[str] = None
    completeness_flags: list[str] = Field(default_factory=list)
    suspicious_flags: list[str] = Field(default_factory=list)


# ── Deterministic Scoring ────────────────────────────────────────────────────

class ScoreBreakdown(BaseModel):
    """Sub-scores for each scoring dimension."""
    urgency: int = 0
    profile_match: int = 0
    eligibility: int = 0
    completeness: int = 0


class ScoredOpportunity(BaseModel):
    """Score output attached to an opportunity."""
    id: str
    total_score: int = 0
    score_breakdown: ScoreBreakdown = Field(default_factory=ScoreBreakdown)
    urgency_label: str = "UNKNOWN"
    eligibility_hard_block: bool = False


# ── Agent 4: Ranker Output ───────────────────────────────────────────────────

class RankedOpportunity(BaseModel):
    """Final human-readable ranked output for a single opportunity."""
    rank: int
    id: str
    title: Optional[str] = None
    organization: Optional[str] = None
    opportunity_type: Optional[str] = None
    deadline: Optional[str] = None
    deadline_urgency: Optional[str] = None
    total_score: int
    score_breakdown: ScoreBreakdown
    eligibility_hard_block: bool = False
    why_relevant: str = ""
    key_strengths: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    next_steps: list[str] = Field(default_factory=list)
    extracted_fields: dict = Field(default_factory=dict)
    completeness_flags: list[str] = Field(default_factory=list)
    suspicious_flags: list[str] = Field(default_factory=list)


# ── Pipeline Request / Response ──────────────────────────────────────────────

class PipelineRequest(BaseModel):
    """Full request to run the pipeline."""
    emails: list[EmailInput]
    student_profile: StudentProfile = Field(default_factory=StudentProfile)


class PipelineResponse(BaseModel):
    """Full response from the pipeline."""
    ranked: list[RankedOpportunity] = Field(default_factory=list)
    rejected_count: int = 0
    total_emails: int = 0
    pipeline_stages: dict = Field(default_factory=dict)  # debug info
    message: str = ""

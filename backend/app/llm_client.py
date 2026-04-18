"""
Groq LLM Client — calls Groq models via the Groq API.

Groq is 100 % OpenAI-API-compatible (same /v1/chat/completions format).
Only the base URL, API key, and model IDs differ.

Model assignment strategy:

  Agent 1 (Classifier)  → llama-3.1-8b-instant
    Why: Simple binary classification (opportunity or not). Llama 3.1 8B is
    Groq's fastest production model at 560 TPS — perfect for yes/no tasks
    and dramatically cheaper than the 70B variant.
    Rate limit (free): 30 RPM / 14,400 TPM / 14,400 RPD

  Agent 2 (Extractor)   → llama-3.3-70b-versatile
    Why: Must extract 11 structured fields without hallucinating. The 70B
    model has significantly better instruction-following and JSON output
    accuracy than the 8B for complex schema-constrained extraction.
    Rate limit (free): 30 RPM / 6,000 TPM / 14,400 RPD

  Agent 3 (Validator)   → llama-3.1-8b-instant
    Why: Date normalisation, list dedup, whitespace cleanup. Systematic
    rule-based cleaning — the 8B model handles this at 560 TPS with
    lower latency and cost.

  Agent 4 (Ranker)      → llama-3.3-70b-versatile
    Why: Generates rich, personalised explanations, risk assessments, and
    next steps. Requires nuanced long-context reasoning — the 70B model
    produces noticeably higher quality output. Max completion: 32,768 tokens.

  Embeddings            → KEYWORD FALLBACK
    Why: Groq does not provide an embeddings API endpoint. The scoring
    engine detects this and falls back to exact keyword matching, which
    still catches direct skill overlaps (e.g. "Python", "React").
    Semantic synonyms (e.g. "ML" ↔ "machine learning") may not match.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("llm_client")

GROQ_API_KEY  = os.getenv("GROQ_API_KEY", "")
GROQ_BASE_URL = "https://api.groq.com/openai/v1"

# ── Model constants ───────────────────────────────────────────────────────────
#
# All agents use llama-3.3-70b-versatile — the only model that consistently
# returns HTTP 200 on the free tier without hitting the 6,000 TPM cap.
# llama-3.1-8b-instant shares the same 6,000 TPM bucket and gets exhausted
# by stage 1 before stage 3 can run, so we use one model across the full
# pipeline and let smart retry-after parsing handle any transient limits.

_GROQ_MODEL     = "llama-3.3-70b-versatile"  # single model for all stages

CLASSIFIER_MODEL = _GROQ_MODEL   # Agent 1 — binary classification
EXTRACTOR_MODEL  = _GROQ_MODEL   # Agent 2 — structured JSON extraction
VALIDATOR_MODEL  = _GROQ_MODEL   # Agent 3 — rule-based cleaning
RANKER_MODEL     = _GROQ_MODEL   # Agent 4 — reasoning & explanation
EMBEDDING_MODEL  = None          # Groq has no embeddings endpoint → keyword fallback


# ── JSON extraction helper ────────────────────────────────────────────────────

def _extract_json_from_text(text: str) -> str:
    """
    Strip markdown fences and surrounding prose, returning just the JSON string.
    Handles ```json ... ``` blocks and bare JSON arrays/objects.
    """
    text = text.strip()

    # 1. Strip markdown code fences
    fence_match = re.search(r"```(?:json)?\s*\n?([\s\S]*?)\n?```", text)
    if fence_match:
        text = fence_match.group(1).strip()

    # 2. Find outermost [ ... ] or { ... }
    for start_char, end_char in [("[", "]"), ("{", "}")]:
        start_idx = text.find(start_char)
        if start_idx == -1:
            continue
        end_idx = text.rfind(end_char)
        if end_idx > start_idx:
            return text[start_idx : end_idx + 1]

    return text


# ── Embeddings — not available on Groq ───────────────────────────────────────

async def get_embeddings(texts: list[str], model: str | None = EMBEDDING_MODEL) -> list[list[float]]:
    """
    Groq does not provide an embeddings API.

    This function always raises NotImplementedError.
    The caller (scoring.py → compute_profile_match_score) catches this and
    falls back to exact keyword matching, which is already implemented there.
    """
    raise NotImplementedError(
        "Groq does not support an embeddings endpoint. "
        "Scoring will use keyword matching as a fallback. "
        "For full semantic matching, configure an OpenAI or Hugging Face embedding key."
    )


# ── Cosine similarity (still used by scoring.py keyword path) ─────────────────

def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Cosine similarity between two vectors (pure Python, no numpy needed)."""
    dot    = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(x * x for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


# ── Retry-after parser ────────────────────────────────────────────────────────

_RETRY_RE = re.compile(r"Please try again in ([\d.]+)(ms|s)", re.IGNORECASE)

def _parse_retry_after(error_body: str, fallback: float = 20.0) -> float:
    """
    Extract the exact wait time from Groq's 429 error body, e.g.:
      "Please try again in 16.53s."   → 17.0 s
      "Please try again in 680ms."    →  1.2 s

    Falls back to `fallback` seconds if no match is found.
    Adds a 0.7 s safety buffer so the TPM window has cleared by the time
    the next request fires.
    """
    m = _RETRY_RE.search(error_body)
    if not m:
        return fallback
    value, unit = float(m.group(1)), m.group(2).lower()
    seconds = value / 1000.0 if unit == "ms" else value
    return seconds + 0.7   # small buffer


# ── Chat Completion API ───────────────────────────────────────────────────────

async def call_llm(
    model: str,
    system_prompt: str,
    user_message: str,
    temperature: float = 0.1,
    max_tokens: int = 4096,
    retries: int = 2,
) -> str:
    """
    Call a Groq chat completion model.

    Uses POST /v1/chat/completions with [system, user] messages —
    identical to the OpenAI format.

    Returns the assistant's response text.
    """
    if not GROQ_API_KEY:
        raise ValueError(
            "GROQ_API_KEY is not set. "
            "Add it to backend/.env as GROQ_API_KEY=gsk_..."
        )

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type":  "application/json",
    }

    payload: dict[str, Any] = {
        "model":       model,
        "temperature": temperature,
        "max_tokens":  max_tokens,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_message},
        ],
    }

    last_error: Exception | None = None

    for attempt in range(1, retries + 2):
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                logger.info(
                    "Groq call attempt %d/%d  (model=%s, max_tokens=%d)",
                    attempt, retries + 1, model, max_tokens,
                )
                response = await client.post(
                    f"{GROQ_BASE_URL}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()

                content       = data["choices"][0]["message"]["content"]
                finish_reason = data["choices"][0].get("finish_reason", "")
                usage         = data.get("usage", {})

                logger.info(
                    "Groq response: %d chars  finish=%s  "
                    "tokens(prompt=%s completion=%s total=%s)  model=%s",
                    len(content),
                    finish_reason,
                    usage.get("prompt_tokens", "?"),
                    usage.get("completion_tokens", "?"),
                    usage.get("total_tokens", "?"),
                    model,
                )

                if finish_reason == "length":
                    logger.warning(
                        "Response hit max_tokens=%d — output may be truncated. "
                        "(llama-3.3-70b-versatile has a 32,768 token completion limit.)",
                        max_tokens,
                    )

                return content

        except httpx.HTTPStatusError as exc:
            last_error = exc
            status = exc.response.status_code
            body   = exc.response.text[:600]
            logger.warning("HTTP %d from Groq (attempt %d): %s", status, attempt, body)

            if status == 429:
                wait = _parse_retry_after(body)
                logger.info("Rate-limited (429). Waiting %.1fs before retry…", wait)
                await asyncio.sleep(wait)
                continue

            if status in (500, 502, 503):
                await asyncio.sleep(4 * attempt)
                continue

            raise   # 400 / 401 / 403 — surface immediately

        except (httpx.RequestError, httpx.TimeoutException) as exc:
            last_error = exc
            logger.warning("Network error on attempt %d: %s", attempt, exc)
            await asyncio.sleep(2 * attempt)
            continue

    raise RuntimeError(
        f"Groq call failed after {retries + 1} attempts: {last_error}"
    )


# ── JSON wrapper ──────────────────────────────────────────────────────────────

async def call_llm_json(
    model: str,
    system_prompt: str,
    user_message: str,
    temperature: float = 0.1,
    max_tokens: int = 4096,
) -> Any:
    """
    Call a Groq model and parse the response as JSON.

    Strips markdown fences, extracts the outermost JSON structure, and
    attempts best-effort repair for truncated arrays/objects.
    """
    raw = await call_llm(
        model=model,
        system_prompt=system_prompt,
        user_message=user_message,
        temperature=temperature,
        max_tokens=max_tokens,
    )

    json_str = _extract_json_from_text(raw)

    try:
        return json.loads(json_str)

    except json.JSONDecodeError:
        # Best-effort repair for truncated JSON (guard against finish_reason="length")
        repaired = json_str.rstrip()

        if repaired.startswith("["):
            last_complete = repaired.rfind("},")
            if last_complete != -1:
                repaired = repaired[: last_complete + 1] + "\n]"
            elif not repaired.endswith("]"):
                repaired = repaired + "\n]"

        elif repaired.startswith("{") and not repaired.endswith("}"):
            repaired = repaired + "\n}"

        try:
            result = json.loads(repaired)
            logger.warning(
                "Repaired truncated JSON from Groq (%d → %d chars)",
                len(json_str), len(repaired),
            )
            return result

        except json.JSONDecodeError as exc:
            logger.error(
                "Failed to parse Groq JSON even after repair.\n"
                "Raw (%d chars): %s...\nExtracted: %s...",
                len(raw), raw[:500], json_str[:500],
            )
            raise ValueError(
                f"Groq returned invalid JSON. Parse error: {exc}\n"
                f"Raw response (first 500 chars): {raw[:500]}"
            ) from exc

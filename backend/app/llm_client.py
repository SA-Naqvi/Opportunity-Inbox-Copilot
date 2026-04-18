"""
Google Gemini LLM Client — calls Gemini models via Google AI Studio REST API.

Model assignment strategy (each agent uses the model best suited to its task):

  Agent 1 (Classifier)  → gemini-2.5-flash-lite
    Why: Simple binary classification (opportunity or not). Needs speed, not deep
    reasoning. Flash-Lite is the cheapest, fastest model — perfect for yes/no tasks.
    Free tier: 30 RPM / 1,500 RPD

  Agent 2 (Extractor)   → gemini-2.5-flash
    Why: Must extract 11 structured fields without hallucinating. Needs strong
    instruction-following and structured JSON output. Flash balances capability
    with speed — handles field-by-field extraction reliably.
    Free tier: 10 RPM / 500 RPD

  Agent 3 (Validator)   → gemini-2.5-flash-lite
    Why: Date normalization, list dedup, whitespace cleanup. Systematic but
    rule-based — no deep reasoning needed. Flash-Lite handles this efficiently.
    Free tier: 30 RPM / 1,500 RPD

  Agent 4 (Ranker)      → gemini-2.5-flash
    Why: Generates personalized explanations, risks, and next steps. Flash is
    fully capable of nuanced reasoning at this scale, and its free tier is 20×
    more generous than Pro (500 RPD vs 25 RPD). Pro caused 429 errors on the
    free tier when processing multiple opportunities in a single pipeline run.
    Free tier: 10 RPM / 500 RPD

  Embeddings            → gemini-embedding-001
    Why: Semantic skill/interest matching in scoring. "Machine Learning" should
    match "ML", "deep learning", etc. Current standard Gemini embedding model.
"""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("llm_client")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

# ── Model constants (explicit per agent, chosen by task requirements) ────────

CLASSIFIER_MODEL = "gemini-2.5-flash-lite"    # Agent 1 — fast binary classification  (30 RPM free)
EXTRACTOR_MODEL  = "gemini-2.5-flash"         # Agent 2 — structured field extraction (10 RPM free)
VALIDATOR_MODEL  = "gemini-2.5-flash-lite"    # Agent 3 — rule-based cleaning          (30 RPM free)
RANKER_MODEL     = "gemini-2.5-flash"         # Agent 4 — reasoning & explanation      (10 RPM free)
EMBEDDING_MODEL  = "gemini-embedding-001"      # Semantic similarity for scoring


def _extract_json_from_text(text: str) -> str:
    """
    Extract JSON from an LLM response that may contain markdown fences
    or preamble text.  Returns the raw JSON string.
    """
    text = text.strip()

    # 1. Strip markdown code fences
    fence_match = re.search(r"```(?:json)?\s*\n?([\s\S]*?)\n?```", text)
    if fence_match:
        text = fence_match.group(1).strip()

    # 2. Find the outermost [ ... ] or { ... }
    for start_char, end_char in [("[", "]"), ("{", "}")]:
        start_idx = text.find(start_char)
        if start_idx == -1:
            continue
        end_idx = text.rfind(end_char)
        if end_idx > start_idx:
            return text[start_idx : end_idx + 1]

    # 3. Last resort: return as-is
    return text


# ── Embedding API ────────────────────────────────────────────────────────────

async def get_embeddings(texts: list[str], model: str = EMBEDDING_MODEL) -> list[list[float]]:
    """
    Get embeddings for a list of texts via Gemini embedding API.

    Parameters
    ----------
    texts : list[str]
        Texts to embed.
    model : str
        Embedding model name.

    Returns
    -------
    list[list[float]]
        List of embedding vectors.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set.")

    url = f"{GEMINI_BASE_URL}/{model}:batchEmbedContents?key={GEMINI_API_KEY}"

    requests_payload = [
        {
            "model": f"models/{model}",
            "content": {"parts": [{"text": t}]},
            "taskType": "SEMANTIC_SIMILARITY",
        }
        for t in texts
    ]

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json={"requests": requests_payload})
        response.raise_for_status()
        data = response.json()

    return [emb["values"] for emb in data["embeddings"]]


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(x * x for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


# ── LLM Generation API ──────────────────────────────────────────────────────

async def call_llm(
    model: str,
    system_prompt: str,
    user_message: str,
    temperature: float = 0.1,
    max_tokens: int = 4096,
    retries: int = 2,
) -> str:
    """
    Call a Gemini model via Google AI Studio REST API.

    Returns
    -------
    str
        The model's response text.
    """
    if not GEMINI_API_KEY:
        raise ValueError(
            "GEMINI_API_KEY is not set. "
            "Add it to backend/.env as GEMINI_API_KEY=your-key"
        )

    url = f"{GEMINI_BASE_URL}/{model}:generateContent?key={GEMINI_API_KEY}"

    payload = {
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": user_message}]
            }
        ],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
            "responseMimeType": "application/json",
        },
    }

    last_error: Exception | None = None

    for attempt in range(1, retries + 2):
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                logger.info(
                    "Gemini call attempt %d/%d  (model=%s)",
                    attempt, retries + 1, model,
                )
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()

                content = data["candidates"][0]["content"]["parts"][0]["text"]
                logger.info(
                    "Gemini response received (%d chars)  model=%s",
                    len(content), model,
                )
                return content

        except httpx.HTTPStatusError as exc:
            last_error = exc
            logger.warning(
                "HTTP %d from Gemini (attempt %d): %s",
                exc.response.status_code, attempt,
                exc.response.text[:300],
            )
            if exc.response.status_code == 429:
                # Rate-limited: wait longer with exponential backoff so we
                # don't keep burning quota.  Free tier resets per minute.
                import asyncio
                wait = 15 * attempt   # 15s, 30s, 45s
                logger.info("Rate-limited (429). Waiting %ds before retry…", wait)
                await asyncio.sleep(wait)
                continue
            if exc.response.status_code in (500, 502, 503):
                import asyncio
                await asyncio.sleep(4 * attempt)
                continue
            raise

        except (httpx.RequestError, httpx.TimeoutException) as exc:
            last_error = exc
            logger.warning("Network error (attempt %d): %s", attempt, exc)
            import asyncio
            await asyncio.sleep(2 * attempt)
            continue

    raise RuntimeError(
        f"Gemini call failed after {retries + 1} attempts: {last_error}"
    )


async def call_llm_json(
    model: str,
    system_prompt: str,
    user_message: str,
    temperature: float = 0.1,
    max_tokens: int = 4096,
) -> Any:
    """
    Call a Gemini model and parse the response as JSON.
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
        # The model may have been cut off before closing the JSON structure.
        # Attempt a best-effort repair: close any open array/object.
        repaired = json_str.rstrip()
        if repaired.startswith("["):
            # Drop the last (incomplete) object and close the array
            last_complete = repaired.rfind("},")
            if last_complete != -1:
                repaired = repaired[: last_complete + 1] + "\n]"
            elif repaired.endswith("]"):
                pass  # already closed somehow
            else:
                repaired = repaired + "\n]"
        elif repaired.startswith("{") and not repaired.endswith("}"):
            repaired = repaired + "\n}"
        try:
            result = json.loads(repaired)
            logger.warning(
                "Repaired truncated JSON from Gemini (%d → %d chars)",
                len(json_str), len(repaired),
            )
            return result
        except json.JSONDecodeError as exc:
            logger.error(
                "Failed to parse Gemini JSON even after repair.\n"
                "Raw (%d chars): %s...\nExtracted: %s...",
                len(raw), raw[:500], json_str[:500],
            )
            raise ValueError(
                f"Gemini returned invalid JSON. Parse error: {exc}\n"
                f"Raw response (first 500 chars): {raw[:500]}"
            ) from exc

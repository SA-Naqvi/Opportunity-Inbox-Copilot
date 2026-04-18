"""
email_fetcher.py

Fetches emails from Gmail (or any IMAP server) using IMAP4_SSL.
Requires the user to supply a Gmail App Password — not their Google
account password.  See: https://support.google.com/accounts/answer/185833

Usage:
    emails = await fetch_gmail_emails("you@gmail.com", "<app-password>", 20)
"""

from __future__ import annotations

import asyncio
import email as email_lib
import imaplib
import logging
import re
from email.header import decode_header
from typing import Any

logger = logging.getLogger(__name__)

GMAIL_HOST = "imap.gmail.com"
GMAIL_PORT = 993


# ── String helpers ────────────────────────────────────────────────────────────

def _safe_decode(raw: bytes | str | None, charset: str = "utf-8") -> str:
    if raw is None:
        return ""
    if isinstance(raw, bytes):
        return raw.decode(charset, errors="replace")
    return raw


def _decode_header_value(value: str | None) -> str:
    """Decode RFC 2047 encoded header (e.g. =?UTF-8?B?...?=)."""
    if not value:
        return ""
    parts = decode_header(value)
    fragments: list[str] = []
    for fragment, charset in parts:
        if isinstance(fragment, bytes):
            fragments.append(fragment.decode(charset or "utf-8", errors="replace"))
        else:
            fragments.append(fragment or "")
    return "".join(fragments).strip()


def _strip_html(html: str) -> str:
    """Very light HTML → plain-text stripping."""
    # Replace block-level tags with newlines for readability
    html = re.sub(r"<br\s*/?>", "\n", html, flags=re.IGNORECASE)
    html = re.sub(r"</(p|div|li|tr|td|th|h[1-6])>", "\n", html, flags=re.IGNORECASE)
    html = re.sub(r"<[^>]+>", "", html)
    html = re.sub(r"[ \t]+", " ", html)
    html = re.sub(r"\n{3,}", "\n\n", html)
    return html.strip()


# ── Body extraction ───────────────────────────────────────────────────────────

def _extract_body(msg: email_lib.message.Message) -> str:
    """Return the plaintext body of an email, stripping HTML if necessary."""
    plain_body = ""
    html_body  = ""

    if msg.is_multipart():
        for part in msg.walk():
            ctype       = part.get_content_type()
            disposition = str(part.get("Content-Disposition", ""))
            if "attachment" in disposition:
                continue

            payload = part.get_payload(decode=True)
            if not payload:
                continue
            cs = part.get_content_charset() or "utf-8"

            if ctype == "text/plain" and not plain_body:
                plain_body = _safe_decode(payload, cs)
            elif ctype == "text/html" and not html_body:
                html_body = _strip_html(_safe_decode(payload, cs))
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            cs    = msg.get_content_charset() or "utf-8"
            ctype = msg.get_content_type()
            raw   = _safe_decode(payload, cs)
            if ctype == "text/html":
                html_body = _strip_html(raw)
            else:
                plain_body = raw

    return (plain_body or html_body).strip()


# ── Sync IMAP fetch (runs in a thread pool) ───────────────────────────────────

def _fetch_sync(
    email_address: str,
    app_password: str,
    max_emails: int,
    folder: str = "INBOX",
) -> list[dict[str, Any]]:
    """
    Blocking IMAP fetch.  Wrapped in run_in_executor so it doesn't
    block the FastAPI event loop.
    """
    imap = imaplib.IMAP4_SSL(GMAIL_HOST, GMAIL_PORT)
    try:
        imap.login(email_address, app_password)
        imap.select(folder)

        status, data = imap.search(None, "ALL")
        if status != "OK" or not data or not data[0]:
            return []

        all_ids: list[bytes] = data[0].split()
        if not all_ids:
            return []

        # Take the most recent `max_emails`, newest first
        recent_ids = all_ids[-max_emails:][::-1]

        results: list[dict[str, Any]] = []
        for eid in recent_ids:
            try:
                fetch_status, msg_data = imap.fetch(eid, "(RFC822)")
                if fetch_status != "OK" or not msg_data or msg_data[0] is None:
                    continue
                if not isinstance(msg_data[0], tuple) or len(msg_data[0]) < 2:
                    continue

                raw_bytes = msg_data[0][1]
                msg = email_lib.message_from_bytes(raw_bytes)

                subject = _decode_header_value(msg.get("Subject"))
                sender  = _decode_header_value(msg.get("From"))
                date    = msg.get("Date", "")
                body    = _extract_body(msg)

                results.append({
                    "subject": subject or "(no subject)",
                    "sender":  sender,
                    "date":    date,
                    # Truncate body to 4 000 chars — enough for the pipeline
                    "body":    body[:4000],
                })
            except Exception as exc:
                logger.warning("Skipping email id=%s: %s", eid, exc)
                continue

        logger.info("IMAP: fetched %d/%d emails from %s", len(results), len(recent_ids), folder)
        return results

    finally:
        try:
            imap.logout()
        except Exception:
            pass


# ── Public async interface ────────────────────────────────────────────────────

async def fetch_gmail_emails(
    email_address: str,
    app_password: str,
    max_emails: int = 20,
    folder: str = "INBOX",
) -> list[dict[str, Any]]:
    """
    Async wrapper — runs the blocking IMAP fetch in a thread pool executor
    so it doesn't block the FastAPI event loop.

    Returns a list of dicts:
        { subject, sender, date, body }
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        _fetch_sync,
        email_address,
        app_password,
        max_emails,
        folder,
    )

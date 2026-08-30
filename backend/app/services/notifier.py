"""Transactional notifications: email (SMTP), SMS (HTTP provider), in-app.

Delivery is best-effort and never blocks order flow: failures are logged and
swallowed. When no SMTP/SMS provider is configured (development), messages are
printed to the log instead — nothing is silently dropped.
"""

import asyncio
import logging
import smtplib
from email.mime.text import MIMEText

import httpx

from app.core.config import get_settings

logger = logging.getLogger("tinceram.notifier")


def _dev_sink(kind: str, to: str, body: str) -> None:
    logger.info("[dev-%s] to=%s body=%s", kind, to, body.replace("\n", " | "))


async def send_email(to: str, subject: str, html_body: str) -> None:
    """Send an HTML email off the event loop. Never raises."""
    s = get_settings()
    if not s.smtp_host:
        _dev_sink("email", f"{to} :: {subject}", html_body[:500])
        return

    def _send() -> None:
        msg = MIMEText(html_body, "html", "utf-8")
        msg["Subject"] = subject
        msg["From"] = s.smtp_from
        msg["To"] = to
        with smtplib.SMTP(s.smtp_host, s.smtp_port, timeout=15) as server:
            if s.smtp_tls:
                server.starttls()
            if s.smtp_user:
                server.login(s.smtp_user, s.smtp_password)
            server.sendmail(s.smtp_from, [to], msg.as_string())

    try:
        await asyncio.to_thread(_send)
    except Exception:
        logger.exception("email delivery to %s failed", to)


async def send_sms(phone: str, message: str) -> None:
    """Send an SMS via the configured HTTP provider. Never raises."""
    s = get_settings()
    if not s.sms_api_url:
        _dev_sink("sms", phone, message)
        return
    url = (
        s.sms_api_url.replace("{api_key}", s.sms_api_key)
        .replace("{sender}", s.sms_sender)
        .replace("{receptor}", phone)
        .replace("{message}", message)
    )
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            await client.get(url)
    except Exception:
        logger.exception("sms delivery to %s failed", phone)


RTL_EMAIL_SHELL = """<!doctype html><html dir="rtl" lang="fa"><body style="font-family:Tahoma,Arial;
background:#faf7f5;padding:24px;"><div style="max-width:520px;margin:auto;background:#fff;
border-radius:12px;padding:24px;border:1px solid #eee;">
<div style="text-align:center;font-size:20px;font-weight:bold;color:#8d5b4c;margin-bottom:16px;">تن‌سِرام</div>
{body}
</div></body></html>"""

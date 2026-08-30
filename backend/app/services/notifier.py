"""Transactional notifications: email (SMTP), SMS (HTTP provider), in-app.

Delivery is best-effort and never blocks order flow: failures are logged and
swallowed. When no SMTP/SMS provider is configured (development), messages are
printed to the log instead — nothing is silently dropped.

Production requires proper SMTP/SMS configuration; critical flows (password
reset, OTP) will log a clear error if the provider is not configured.
"""

import asyncio
import logging
import smtplib
from email.mime.text import MIMEText

import httpx

from app.core.config import get_settings

logger = logging.getLogger("tinceram.notifier")

# Maximum retries for transient SMTP/network failures
_MAX_RETRIES = 2
_RETRY_DELAY_SECONDS = 1


def _dev_sink(kind: str, to: str, body: str) -> None:
    """Log notification in development when no provider is configured."""
    # Sanitize: never log actual OTP codes or tokens in any environment
    sanitized = body
    for sensitive_pattern in ("کد ورود", "token=", "reset"):
        if sensitive_pattern in body:
            sanitized = "[REDACTED — sensitive content]"
            break
    logger.info("[dev-%s] to=%s subject/body_preview=%s", kind, to, sanitized[:200])


def validate_config() -> list[str]:
    """Return a list of configuration warnings for missing providers.

    Called at startup to alert operators about unconfigured delivery channels.
    """
    warnings = []
    s = get_settings()
    if not s.smtp_host:
        warnings.append("SMTP not configured (SMTP_HOST is empty) — emails will be logged to console")
    if not s.sms_api_url:
        warnings.append("SMS not configured (SMS_API_URL is empty) — SMS will be logged to console")
    return warnings


async def send_email(to: str, subject: str, html_body: str) -> None:
    """Send an HTML email off the event loop. Never raises."""
    s = get_settings()
    if not s.smtp_host:
        if s.is_production():
            logger.error(
                "CRITICAL: email delivery to %s failed — SMTP not configured in production. "
                "Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD env vars.",
                to,
            )
        else:
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

    last_exc: Exception | None = None
    for attempt in range(_MAX_RETRIES + 1):
        try:
            await asyncio.to_thread(_send)
            return
        except (smtplib.SMTPException, ConnectionError, TimeoutError) as exc:
            last_exc = exc
            if attempt < _MAX_RETRIES:
                logger.warning(
                    "email delivery to %s attempt %d failed, retrying in %ds: %s",
                    to, attempt + 1, _RETRY_DELAY_SECONDS, exc,
                )
                await asyncio.sleep(_RETRY_DELAY_SECONDS)
            continue
        except Exception as exc:
            # Non-transient failure — don't retry
            logger.exception("email delivery to %s failed (non-transient)", to)
            return

    logger.exception("email delivery to %s failed after %d attempts", to, _MAX_RETRIES + 1)


async def send_sms(phone: str, message: str) -> None:
    """Send an SMS via the configured HTTP provider. Never raises."""
    s = get_settings()
    if not s.sms_api_url:
        if s.is_production():
            logger.error(
                "CRITICAL: SMS delivery to %s failed — SMS_API_URL not configured in production. "
                "Set SMS_API_URL, SMS_API_KEY, SMS_SENDER env vars.",
                phone,
            )
        else:
            _dev_sink("sms", phone, "[OTP message — not logged]")
        return

    url = (
        s.sms_api_url.replace("{api_key}", s.sms_api_key)
        .replace("{sender}", s.sms_sender)
        .replace("{receptor}", phone)
        .replace("{message}", message)
    )

    last_exc: Exception | None = None
    for attempt in range(_MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(url)
                if resp.status_code >= 500:
                    raise httpx.HTTPStatusError(
                        f"SMS provider returned {resp.status_code}",
                        request=resp.request,
                        response=resp,
                    )
                return
        except (httpx.HTTPStatusError, httpx.ConnectError, httpx.TimeoutException) as exc:
            last_exc = exc
            if attempt < _MAX_RETRIES:
                logger.warning(
                    "sms delivery to %s attempt %d failed, retrying in %ds: %s",
                    phone, attempt + 1, _RETRY_DELAY_SECONDS, exc,
                )
                await asyncio.sleep(_RETRY_DELAY_SECONDS)
            continue
        except Exception as exc:
            logger.exception("sms delivery to %s failed (non-transient)", phone)
            return

    logger.exception("sms delivery to %s failed after %d attempts", phone, _MAX_RETRIES + 1)


RTL_EMAIL_SHELL = """<!doctype html><html dir="rtl" lang="fa"><body style="font-family:Tahoma,Arial;
background:#faf7f5;padding:24px;"><div style="max-width:520px;margin:auto;background:#fff;
border-radius:12px;padding:24px;border:1px solid #eee;">
<div style="text-align:center;font-size:20px;font-weight:bold;color:#8d5b4c;margin-bottom:16px;">تن‌سِرام</div>
{body}
</div></body></html>"""

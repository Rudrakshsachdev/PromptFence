"""Email service abstraction for verification and password reset emails."""

import logging
from abc import ABC, abstractmethod

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService(ABC):
    """Abstract base class for email delivery."""

    @abstractmethod
    async def send_verification_email(self, email: str, token: str) -> None:
        """Send verification email with token link."""
        pass

    @abstractmethod
    async def send_password_reset_email(self, email: str, token: str) -> None:
        """Send password reset email with token link."""
        pass


class ConsoleEmailService(EmailService):
    """Console/Log email service for development and testing."""

    async def send_verification_email(self, email: str, token: str) -> None:
        verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        logger.info(
            "=== [EMAIL: VERIFY EMAIL] ===\nTo: %s\nVerification Link: %s\nToken: %s\n=============================",
            email, verify_url, token,
        )

    async def send_password_reset_email(self, email: str, token: str) -> None:
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        logger.info(
            "=== [EMAIL: PASSWORD RESET] ===\nTo: %s\nReset Link: %s\nToken: %s\n=============================",
            email, reset_url, token,
        )


class SMTPEmailService(EmailService):
    """SMTP email service for production."""

    async def send_verification_email(self, email: str, token: str) -> None:
        verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        try:
            import aiosmtplib
            from email.message import EmailMessage

            message = EmailMessage()
            message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            message["To"] = email
            message["Subject"] = "Verify your PromptFence account"
            message.set_content(
                f"Welcome to PromptFence!\n\nPlease verify your email address by visiting:\n{verify_url}\n\n"
                f"Or use token: {token}\n\nThis token will expire in 24 hours."
            )

            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USERNAME or None,
                password=settings.SMTP_PASSWORD or None,
                use_tls=settings.SMTP_USE_TLS,
            )
        except Exception as e:
            logger.error("Failed to send verification email via SMTP: %s", e)

    async def send_password_reset_email(self, email: str, token: str) -> None:
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        try:
            import aiosmtplib
            from email.message import EmailMessage

            message = EmailMessage()
            message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            message["To"] = email
            message["Subject"] = "Reset your PromptFence password"
            message.set_content(
                f"You requested a password reset for your PromptFence account.\n\n"
                f"Click the link below to set a new password:\n{reset_url}\n\n"
                f"Or use token: {token}\n\nThis token will expire in 1 hour. If you did not request this, please ignore this email."
            )

            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USERNAME or None,
                password=settings.SMTP_PASSWORD or None,
                use_tls=settings.SMTP_USE_TLS,
            )
        except Exception as e:
            logger.error("Failed to send password reset email via SMTP: %s", e)


def get_email_service() -> EmailService:
    """Return appropriate email service depending on configuration."""
    if settings.is_development or settings.is_testing or not settings.SMTP_HOST:
        return ConsoleEmailService()
    return SMTPEmailService()


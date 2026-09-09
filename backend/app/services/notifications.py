"""Notification helpers - create rows that surface in the user profile."""

from sqlmodel import Session


def create_notification(
    session: Session,
    user_id: str,
    title: str,
    body: str = "",
) -> None:
    from app.models import Notification

    session.add(Notification(user_id=user_id, title=title, body=body))

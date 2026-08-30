"""Public homepage endpoint — the storefront's single source of truth."""

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db.session import get_session
from app.services.homepage import homepage_payload

router = APIRouter()


@router.get("/homepage")
def get_homepage(session: Session = Depends(get_session)) -> dict:
    return homepage_payload(session)

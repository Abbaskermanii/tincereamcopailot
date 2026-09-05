"""Lightweight admin stats endpoint (HTTP Basic against env credentials)."""

from datetime import datetime, timedelta
from app.compat import UTC

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlmodel.ext.asyncio.session import AsyncSession  # noqa: F401

from app.db.session import get_session
from app.api.v1.auth import admin_user

router = APIRouter()


@router.get("/admin/stats")
async def admin_stats(
    session=Depends(get_session),
    user=Depends(admin_user),
) -> dict:
    since = datetime.now(UTC) - timedelta(days=30)

    rows = session.exec(
        text(
            "SELECT order_number, customer_name, total_amount, status, created_at "
            "FROM orders WHERE created_at >= :since ORDER BY created_at DESC LIMIT 200"
        ).bindparams(since=since),
    ).all()

    return {
        "recent_orders": [
            {
                "order_number": r[0],
                "customer_name": r[1],
                "total_amount": float(r[2]),
                "status": r[3],
                "created_at": str(r[4]),
            }
            for r in rows
        ]
    }

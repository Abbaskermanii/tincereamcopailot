"""Database session with slow query logging."""

import logging
import time
from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import Session

from app.core.config import get_settings

settings = get_settings()

logger = logging.getLogger("tinceram.slow_queries")

engine = create_engine(settings.database_url, pool_pre_ping=True)

SLOW_QUERY_THRESHOLD_MS = 500  # Log queries slower than 500ms


@event.listens_for(Engine, "before_cursor_execute")
def _before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault("query_start_time", []).append(time.monotonic())


@event.listens_for(Engine, "after_cursor_execute")
def _after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    start_times = conn.info.get("query_start_time", [])
    if start_times:
        elapsed_ms = (time.monotonic() - start_times.pop()) * 1000
        if elapsed_ms > SLOW_QUERY_THRESHOLD_MS:
            logger.warning(
                "SLOW QUERY (%.1fms): %s | params: %s",
                elapsed_ms,
                statement[:500],
                str(parameters)[:200] if parameters else "",
            )


SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    expire_on_commit=False,
    class_=Session,
)


def get_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

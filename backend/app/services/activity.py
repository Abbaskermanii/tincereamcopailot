"""Activity log writer — every admin mutation should call log_activity()."""

from app.models import ActivityLog


def log_activity(
    session,
    *,
    actor_id: str | None,
    action: str,
    entity_type: str,
    entity_id: str | None = None,
    metadata: dict | None = None,
) -> None:
    """Persist an audit row inside the caller's transaction (best-effort)."""
    import json

    try:
        session.add(
            ActivityLog(
                actor_id=actor_id,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                metadata_json=json.dumps(metadata or {}, default=str, ensure_ascii=False),
            )
        )
    except Exception:
        # auditing must never break the business transaction
        session.rollback()

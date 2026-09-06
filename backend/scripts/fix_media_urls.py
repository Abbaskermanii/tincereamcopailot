"""One-off repair: normalize stored media URLs to RELATIVE /api/v1/media/... paths.

Historical bug: put_image() prefixed media URLs with the frontend site URL, so
rows stored absolute URLs like http://localhost:3000/api/v1/media/... which 404
whenever the host changes. This script rewrites every known media column to the
host-agnostic relative form. Idempotent — safe to run repeatedly.

Usage (inside backend container or with DATABASE_URL set):
    python -m scripts.fix_media_urls
"""

import re
import sys

from sqlalchemy import text

from app.db.session import engine

ABSOLUTE_MEDIA_RE = re.compile(r"^https?://[^/]+(/api/v1/media/.+)$")

# (table, column) pairs that may hold media URLs
TARGETS: list[tuple[str, str]] = [
    ("product_images", "url"),
    ("product_variants", "image_url"),
    ("categories", "image_url"),
    ("carousels", "image_url"),
    ("articles", "cover_url"),
    ("users", "avatar_url"),
    ("homepage_sections", "image_url"),
]


def normalize(value: str | None) -> str | None:
    if not value:
        return value
    m = ABSOLUTE_MEDIA_RE.match(value.strip())
    if m:
        return m.group(1)
    return None  # no change


def main() -> int:
    fixed_total = 0
    with engine.connect() as conn:
        inspector_tables = set(
            conn.execute(
                text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
            ).scalars()
        )
        for table, column in TARGETS:
            if table not in inspector_tables:
                print(f"skip {table}.{column}: table not found")
                continue
            cols = {
                r[0]
                for r in conn.execute(
                    text(
                        "SELECT column_name FROM information_schema.columns "
                        "WHERE table_schema='public' AND table_name=:t"
                    ),
                    {"t": table},
                ).fetchall()
            }
            if column not in cols:
                print(f"skip {table}.{column}: column not found")
                continue
            rows = conn.execute(text(f'SELECT id, "{column}" FROM "{table}"')).fetchall()
            changed = 0
            for row_id, value in rows:
                new_value = normalize(value)
                if new_value and new_value != value:
                    conn.execute(
                        text(f'UPDATE "{table}" SET "{column}" = :v WHERE id = :i'),
                        {"v": new_value, "i": row_id},
                    )
                    changed += 1
            # settings table: key/value pairs (store_logo_url etc.)
            print(f"{table}.{column}: {changed} row(s) fixed")
            fixed_total += changed

        if "settings" in inspector_tables:
            rows = conn.execute(text("SELECT key, value FROM settings")).fetchall()
            changed = 0
            for key, value in rows:
                new_value = normalize(value)
                if new_value and new_value != value:
                    conn.execute(
                        text("UPDATE settings SET value = :v WHERE key = :k"),
                        {"v": new_value, "k": key},
                    )
                    changed += 1
            print(f"settings.value: {changed} row(s) fixed")
            fixed_total += changed

        conn.commit()
    print(f"DONE — {fixed_total} media URL(s) normalized")
    return 0


if __name__ == "__main__":
    sys.exit(main())

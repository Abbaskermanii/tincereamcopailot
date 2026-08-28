"""Run seed only when the products table is empty (used by docker-compose boot)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlmodel import Session

from app.db.session import engine
from scripts.seed import is_seeded, seed


def main() -> None:
    with Session(engine) as session:
        if is_seeded(session):
            print("database already seeded; skipping")
            return
        seed(session)
        print("database seeded")


if __name__ == "__main__":
    main()

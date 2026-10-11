"""Web search tool backed by the Exa /search endpoint.

Loads EXA_API_KEY from docs/.env (local only; never commit that file).
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from exa_py import Exa

ENV_PATH = Path(__file__).resolve().parent / "docs" / ".env"


def load_local_env(path: Path = ENV_PATH) -> None:
    if not path.is_file():
        raise FileNotFoundError(f"Missing local env file: {path}")
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def web_search(query: str):
    """Search the web. Returns Exa results with token-efficient highlights."""
    load_local_env()
    api_key = os.environ.get("EXA_API_KEY")
    if not api_key:
        raise RuntimeError("EXA_API_KEY is missing from docs/.env")
    exa = Exa(api_key=api_key)
    return exa.search(
        query,
        type="auto",
        contents={"highlights": True},
    )


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit('Usage: python web_search.py "your query"')
    result = web_search(" ".join(sys.argv[1:]))
    for item in result.results:
        print(item.title)
        print(item.url)
        for highlight in getattr(item, "highlights", None) or []:
            print(highlight)
        print()


if __name__ == "__main__":
    main()

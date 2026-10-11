from __future__ import annotations

import os
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent
REPO_ROOT = BACKEND_ROOT.parent


def load_env() -> None:
    try:
        from dotenv import load_dotenv
    except ImportError:
        load_dotenv = None

    paths = [
        REPO_ROOT / ".env",
        REPO_ROOT / "docs" / ".env",
        BACKEND_ROOT / ".env",
    ]
    if load_dotenv:
        for path in paths:
            if path.is_file():
                load_dotenv(path, override=False)
        return
    for path in paths:
        if not path.is_file():
            continue
        for raw in path.read_text().splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def database_url() -> str:
    return (
        os.environ.get("TIGER_DATABASE_URL")
        or os.environ.get("DATABASE_URL")
        or "postgresql:///quantro"
    )


def api_key() -> str | None:
    return os.environ.get("API_KEY") or os.environ.get("QUANTRO_API_KEY")

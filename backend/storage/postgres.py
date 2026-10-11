from __future__ import annotations

from typing import Any

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Json

from config import database_url
from contracts.errors import QuantroError

JOBS_TABLE = "quantro_jobs"
REPORTS_TABLE = "quantro_reports"


def connect() -> psycopg.Connection:
    return psycopg.connect(database_url(), row_factory=dict_row)


def ensure_schema() -> None:
    with connect() as conn:
        conn.execute(
            f"""
            CREATE TABLE IF NOT EXISTS {JOBS_TABLE} (
                job_id TEXT PRIMARY KEY,
                url TEXT NOT NULL,
                status TEXT NOT NULL,
                stage TEXT,
                progress INTEGER NOT NULL DEFAULT 0,
                report_id TEXT,
                error_json JSONB,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
        conn.execute(
            f"""
            CREATE TABLE IF NOT EXISTS {REPORTS_TABLE} (
                report_id TEXT PRIMARY KEY,
                job_id TEXT NOT NULL,
                report_json JSONB NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
        conn.commit()


def ensure_tables() -> None:
    ensure_schema()


def insert_job(job_id: str, url: str) -> None:
    try:
        with connect() as conn:
            conn.execute(
                f"""
                INSERT INTO {JOBS_TABLE} (job_id, url, status, stage, progress)
                VALUES (%s, %s, 'queued', NULL, 0)
                """,
                (job_id, url),
            )
            conn.commit()
    except psycopg.errors.UniqueViolation as exc:
        raise QuantroError(
            code="job_exists",
            message="job already exists",
            details={"job_id": job_id},
            status_code=409,
        ) from exc


def update_job(
    job_id: str,
    *,
    status: str | None = None,
    stage: str | None = None,
    progress: int | None = None,
    report_id: str | None = None,
    error: dict[str, Any] | None = None,
) -> None:
    fields: list[str] = ["updated_at = now()"]
    values: list[Any] = []
    if status is not None:
        fields.append("status = %s")
        values.append(status)
    if stage is not None:
        fields.append("stage = %s")
        values.append(stage)
    if progress is not None:
        fields.append("progress = %s")
        values.append(progress)
    if report_id is not None:
        fields.append("report_id = %s")
        values.append(report_id)
    if error is not None:
        fields.append("error_json = %s")
        values.append(Json(error))
    values.append(job_id)
    with connect() as conn:
        conn.execute(
            f"UPDATE {JOBS_TABLE} SET {', '.join(fields)} WHERE job_id = %s",
            values,
        )
        conn.commit()


def get_job(job_id: str) -> dict[str, Any] | None:
    with connect() as conn:
        row = conn.execute(
            f"SELECT * FROM {JOBS_TABLE} WHERE job_id = %s",
            (job_id,),
        ).fetchone()
    return dict(row) if row else None


def insert_report(report_id: str, job_id: str, report: dict[str, Any]) -> None:
    with connect() as conn:
        conn.execute(
            f"""
            INSERT INTO {REPORTS_TABLE} (report_id, job_id, report_json)
            VALUES (%s, %s, %s)
            ON CONFLICT (report_id) DO UPDATE
            SET job_id = EXCLUDED.job_id, report_json = EXCLUDED.report_json
            """,
            (report_id, job_id, Json(report)),
        )
        conn.commit()


def get_report(report_id: str) -> dict[str, Any] | None:
    with connect() as conn:
        row = conn.execute(
            f"SELECT * FROM {REPORTS_TABLE} WHERE report_id = %s",
            (report_id,),
        ).fetchone()
    if not row:
        return None
    return dict(row)

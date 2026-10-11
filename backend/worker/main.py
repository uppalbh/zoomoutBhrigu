from __future__ import annotations

import os
import sys
import time
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from config import load_env
from contracts.errors import normalize_exception
from storage import postgres
from storage.redis import pop_job
from worker.stubs import STAGES, stub_for_stage, stub_notify, stub_report


def _stage_sleep() -> float:
    return float(os.environ.get("QUANTRO_STAGE_SLEEP", "1"))


def process_job(job_id: str, url: str, conversation_id: str | None = None) -> None:
    sleep_s = _stage_sleep()
    try:
        for index, stage in enumerate(STAGES):
            progress = int(round((index + 1) / len(STAGES) * 100))
            postgres.update_job(
                job_id,
                status="running",
                stage=stage,
                progress=progress,
            )
            if stage == "building_report":
                report_id = f"report_{job_id}"
                report = stub_report(job_id, report_id)
                postgres.insert_report(report_id, job_id, report.model_dump())
                postgres.update_job(job_id, report_id=report_id)
            elif stage == "notifying":
                stub_notify()
            else:
                stub_for_stage(stage)
            if index < len(STAGES) - 1:
                time.sleep(sleep_s)
        postgres.update_job(job_id, status="done", stage="complete", progress=100)
    except Exception as exc:
        error = normalize_exception(exc)
        postgres.update_job(
            job_id,
            status="failed",
            error=error.to_dict(),
        )


def process_one(timeout: int = 5) -> bool:
    payload = pop_job(timeout=timeout)
    if not payload:
        return False
    process_job(
        payload["job_id"],
        payload["url"],
        payload.get("conversation_id"),
    )
    return True


def run_loop() -> None:
    postgres.ensure_schema()
    print("listening on quantro:jobs", flush=True)
    while True:
        try:
            process_one(timeout=1)
        except Exception as exc:
            print(f"worker loop error: {exc}", flush=True)
            time.sleep(1)


def main() -> None:
    load_env()
    run_loop()


if __name__ == "__main__":
    main()

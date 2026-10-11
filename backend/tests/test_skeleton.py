from __future__ import annotations

import os
import sys
import threading
import time
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

os.environ["QUANTRO_QUEUE"] = "memory"
os.environ["API_KEY"] = "test-api-key"
os.environ["QUANTRO_API_KEY"] = "test-api-key"
os.environ["PHOTON_WEBHOOK_SECRET"] = "test-photon"
os.environ.setdefault("DATABASE_URL", "postgresql:///quantro")
os.environ.setdefault("TIGER_DATABASE_URL", "postgresql:///quantro")
os.environ["QUANTRO_STAGE_SLEEP"] = "1"

from fastapi.testclient import TestClient

from api.main import app
from contracts.types import ReportV2
from storage import postgres
from worker.main import process_job, run_loop

API_KEY = {"X-API-Key": "test-api-key"}
_worker_started = False


def _start_worker() -> None:
    global _worker_started
    if _worker_started:
        return
    thread = threading.Thread(target=run_loop, daemon=True)
    thread.start()
    _worker_started = True


def _run_job(job_id: str, url: str) -> None:
    _start_worker()
    threading.Thread(target=process_job, args=(job_id, url), daemon=True).start()


def setup_module() -> None:
    postgres.ensure_schema()
    with postgres.connect() as conn:
        conn.execute("TRUNCATE quantro_jobs, quantro_reports")
        conn.commit()


def client() -> TestClient:
    return TestClient(app)


def test_analyze_requires_api_key() -> None:
    response = client().post("/analyze", json={"url": "https://example.com/no-key"})
    assert response.status_code == 401


def test_analyze_returns_queued_job() -> None:
    response = client().post(
        "/analyze",
        json={"url": "https://example.com/queued-once", "job_id": "job_skeleton_queued"},
        headers=API_KEY,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["job_id"] == "job_skeleton_queued"
    assert body["status"] == "queued"


def test_job_is_queued_immediately() -> None:
    job_id = "job_skeleton_immediate"
    created = client().post(
        "/analyze",
        json={"url": "https://example.com/immediate", "job_id": job_id},
        headers=API_KEY,
    )
    assert created.status_code == 200
    response = client().get(f"/jobs/{job_id}")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "queued"


def test_job_completes_with_report() -> None:
    job_id = "job_skeleton_done"
    created = client().post(
        "/analyze",
        json={"url": "https://example.com/done", "job_id": job_id},
        headers=API_KEY,
    )
    assert created.status_code == 200
    assert client().get(f"/jobs/{job_id}").json()["status"] == "queued"
    _run_job(job_id, "https://example.com/done")
    time.sleep(10)
    response = client().get(f"/jobs/{job_id}")
    body = response.json()
    assert body["status"] == "done"
    assert body["report_id"]


def test_report_matches_fixture_shape() -> None:
    job = client().get("/jobs/job_skeleton_done").json()
    if job.get("status") != "done" or not job.get("report_id"):
        created = client().post(
            "/analyze",
            json={"url": "https://example.com/report-shape", "job_id": "job_skeleton_report"},
            headers=API_KEY,
        )
        assert created.status_code == 200
        _run_job("job_skeleton_report", "https://example.com/report-shape")
        time.sleep(10)
        job = client().get("/jobs/job_skeleton_report").json()
    report_id = job["report_id"]
    response = client().get(f"/reports/{report_id}")
    assert response.status_code == 200
    payload = response.json()
    report = ReportV2.model_validate(payload)
    assert report.schema_version == "2.1"
    assert report.source_match.section == "source"
    assert report.fact_check.section == "fact_check"
    assert report.historical_parallels.section == "historical_parallels"
    assert report.manipulation_check.section == "manipulation_check"
    assert payload["submitted"]["post"]["author"]["display_name"] is None
    assert payload["submitted"]["post"]["published_at"] is None


def test_duplicate_job_id_returns_409() -> None:
    payload = {"url": "https://example.com/dup", "job_id": "job_skeleton_dup"}
    first = client().post("/analyze", json=payload, headers=API_KEY)
    assert first.status_code == 200
    second = client().post("/analyze", json=payload, headers=API_KEY)
    assert second.status_code == 409

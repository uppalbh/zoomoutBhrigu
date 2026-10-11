from __future__ import annotations

import hashlib
import hmac
import os
import sys
import time
import uuid
from collections import defaultdict
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from config import api_key, load_env
from contracts.errors import QuantroError, normalize_exception
from contracts.types import AnalyzeRequest, AnalyzeResponse, JobStatusResponse
from storage import postgres
from storage.redis import push_job

_hits: dict[str, list[float]] = defaultdict(list)

load_env()

app = FastAPI(title="Quantro v2")


@app.on_event("startup")
def _startup() -> None:
    postgres.ensure_schema()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _rate_limited(ip: str) -> bool:
    now = time.time()
    window = [stamp for stamp in _hits[ip] if now - stamp < 60]
    if len(window) >= 10:
        _hits[ip] = window
        return True
    window.append(now)
    _hits[ip] = window
    return False


def _require_api_key(x_api_key: str | None) -> None:
    expected = api_key()
    if not x_api_key or not expected or x_api_key != expected:
        raise HTTPException(status_code=401, detail="invalid or missing API key")


def _job_id_for(request: AnalyzeRequest) -> str:
    if request.job_id:
        return request.job_id
    digest = hashlib.sha256(request.url.encode()).hexdigest()[:16]
    return f"job_{digest}"


@app.exception_handler(QuantroError)
async def _quantro_error(_request: Request, exc: QuantroError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=exc.to_dict())


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/analyze")
def analyze(
    body: AnalyzeRequest,
    request: Request,
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> AnalyzeResponse:
    _require_api_key(x_api_key)
    if _rate_limited(_client_ip(request)):
        raise HTTPException(status_code=429, detail="rate limit exceeded")
    job_id = _job_id_for(body)
    try:
        postgres.insert_job(job_id, body.url)
    except QuantroError as exc:
        if exc.status_code == 409:
            raise HTTPException(status_code=409, detail="job already exists") from exc
        raise
    push_job(
        {
            "job_id": job_id,
            "url": body.url,
            "conversation_id": body.conversation_id,
        }
    )
    return AnalyzeResponse(job_id=job_id, status="queued")


@app.get("/jobs/{job_id}")
def get_job(job_id: str) -> JobStatusResponse:
    row = postgres.get_job(job_id)
    if not row:
        raise HTTPException(status_code=404, detail="job not found")
    return JobStatusResponse(
        status=row["status"],
        stage=row.get("stage"),
        progress=row.get("progress") or 0,
        report_id=row.get("report_id"),
        error=row.get("error_json"),
    )


@app.get("/reports/{report_id}")
def get_report(report_id: str) -> dict:
    row = postgres.get_report(report_id)
    if not row:
        raise HTTPException(status_code=404, detail="report not found")
    return row["report_json"]


@app.get("/media/{media_id}")
def get_media(media_id: str) -> RedirectResponse:
    raise HTTPException(status_code=501, detail="media signed URLs are not implemented")


@app.post("/webhooks/photon")
async def photon_webhook(
    request: Request,
    x_photon_signature: str | None = Header(default=None, alias="X-Photon-Signature"),
) -> dict[str, bool]:
    secret = os.environ.get("PHOTON_WEBHOOK_SECRET", "")
    body = await request.body()
    if secret and x_photon_signature:
        digest = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
        expected = x_photon_signature.removeprefix("sha256=")
        hmac.compare_digest(digest, expected)
    return {"ok": True}


@app.exception_handler(Exception)
async def _unhandled(_request: Request, exc: Exception) -> JSONResponse:
    if isinstance(exc, HTTPException):
        raise exc
    error = normalize_exception(exc)
    return JSONResponse(status_code=error.status_code, content=error.to_dict())

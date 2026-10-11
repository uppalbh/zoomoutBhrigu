# Quantro v2 backend

Fake end-to-end skeleton. Stages return fixture data from `docs/fixtures/`. Whisper, ffmpeg, Exa, and Gemini are not called.

## Required environment

Load these from `docs/.env` (local only, never commit):

- `API_KEY` — required on `X-API-Key` for `POST /analyze`
- `TIGER_DATABASE_URL` — Postgres DSN, e.g. `postgresql:///quantro`
- `REDIS_URL` or `UPSTASH_REDIS_URL` — Redis URL used for the `quantro:jobs` list
- `PHOTON_WEBHOOK_SECRET` — HMAC secret for `POST /webhooks/photon`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` — reserved; media routes are stubbed

Optional:

- `QUANTRO_QUEUE=memory` — in-process queue for tests
- `QUANTRO_STAGE_SLEEP=1` — seconds between worker stages (default 1)

## Run the API

From `backend/`:

```bash
uvicorn api.main:app --port 8000
```

## Run the worker

From `backend/`:

```bash
python -m worker.main
```

The worker `BRPOP`s `quantro:jobs`, writes stage progress to Postgres, sleeps 1s between the nine stub stages (~8s total), then stores a `ReportV2` fixture and marks the job `done`.

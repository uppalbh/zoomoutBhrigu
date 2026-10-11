from __future__ import annotations

import json
import os
import queue
from typing import Any

import redis

JOBS_KEY = "quantro:jobs"
_memory_queue: queue.Queue[dict[str, Any]] = queue.Queue()
_redis_client: redis.Redis | None = None


def _use_memory() -> bool:
    return os.environ.get("QUANTRO_QUEUE", "redis").lower() == "memory"


def client() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        url = os.environ.get("REDIS_URL") or os.environ.get("UPSTASH_REDIS_URL")
        if not url:
            raise RuntimeError("REDIS_URL is not set")
        _redis_client = redis.Redis.from_url(url, decode_responses=True)
    return _redis_client


def push_job(payload: dict[str, Any]) -> None:
    if _use_memory():
        _memory_queue.put(payload)
        return
    client().lpush(JOBS_KEY, json.dumps(payload))


def pop_job(timeout: int = 5) -> dict[str, Any] | None:
    if _use_memory():
        try:
            return _memory_queue.get(timeout=timeout)
        except queue.Empty:
            return None
    item = client().brpop(JOBS_KEY, timeout=timeout)
    if not item:
        return None
    return json.loads(item[1])

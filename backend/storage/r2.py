from __future__ import annotations

import os
from typing import Any


def _client() -> Any:
    import boto3

    account_id = os.environ["R2_ACCOUNT_ID"]
    return boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
    )


def upload_bytes(key: str, data: bytes, content_type: str | None = None) -> str:
    raise NotImplementedError("R2 upload is stubbed in the v2 skeleton")


def signed_get_url(key: str, expires_in: int = 3600) -> str:
    raise NotImplementedError("R2 signed URLs are stubbed in the v2 skeleton")

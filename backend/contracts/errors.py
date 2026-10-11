from __future__ import annotations

from typing import Any


class QuantroError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        details: dict[str, Any] | None = None,
        status_code: int = 500,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details or {}
        self.status_code = status_code

    def to_dict(self) -> dict[str, Any]:
        return {
            "error": {
                "code": self.code,
                "message": self.message,
                "details": self.details,
            }
        }


def normalize_exception(exc: BaseException) -> QuantroError:
    if isinstance(exc, QuantroError):
        return exc
    return QuantroError(
        code="internal_error",
        message=str(exc) or exc.__class__.__name__,
        details={"type": exc.__class__.__name__},
    )

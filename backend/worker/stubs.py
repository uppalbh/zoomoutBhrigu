from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from contracts.types import (
    AnalysisResult,
    FactCheckSection,
    HistoricalParallelsSection,
    ManipulationCheckSection,
    ReportV2,
    SourceMatchSection,
)

REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURES = REPO_ROOT / "docs" / "fixtures"

STAGES = [
    "retrieving",
    "transcribing",
    "searching",
    "aligning",
    "fact_checking",
    "finding_parallels",
    "checking_manipulation",
    "building_report",
    "notifying",
]


def _load(name: str) -> dict[str, Any]:
    return json.loads((FIXTURES / name).read_text())


def stub_source_match() -> SourceMatchSection:
    return SourceMatchSection.model_validate(_load("source.json"))


def stub_fact_check() -> FactCheckSection:
    return FactCheckSection.model_validate(_load("fact_check.json"))


def stub_parallels() -> HistoricalParallelsSection:
    return HistoricalParallelsSection.model_validate(_load("parallels.json"))


def stub_manipulation() -> ManipulationCheckSection:
    return ManipulationCheckSection.model_validate(_load("manipulation.json"))


def stub_report(job_id: str, report_id: str) -> ReportV2:
    payload = deepcopy(_load("report_example.json"))
    payload["job_id"] = job_id
    payload["report_id"] = report_id
    payload["generated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return ReportV2.model_validate(payload)


def stub_analysis(job_id: str, url: str) -> AnalysisResult:
    report = stub_report(job_id, f"report_{job_id}")
    return AnalysisResult(
        job_id=job_id,
        url=url,
        submitted=report.submitted,
        source=report.source,
        source_match=stub_source_match(),
        fact_check=stub_fact_check(),
        historical_parallels=stub_parallels(),
        manipulation_check=stub_manipulation(),
    )


def stub_for_stage(stage: str) -> dict[str, Any]:
    mapping = {
        "retrieving": lambda: {"ok": True},
        "transcribing": lambda: stub_report("job", "report").submitted.transcript.model_dump(),
        "searching": lambda: stub_report("job", "report").source.model_dump(),
        "aligning": lambda: stub_source_match().model_dump(),
        "fact_checking": lambda: stub_fact_check().model_dump(),
        "finding_parallels": lambda: stub_parallels().model_dump(),
        "checking_manipulation": lambda: stub_manipulation().model_dump(),
        "building_report": lambda: stub_report("job", "report").model_dump(),
        "notifying": lambda: stub_notify(),
    }
    return mapping[stage]()


def stub_notify() -> dict[str, Any]:
    return {"notified": True}

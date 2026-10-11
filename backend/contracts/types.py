from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class _Model(BaseModel):
    model_config = ConfigDict(extra="ignore")


class Confidence(_Model):
    level: str
    basis: list[str]
    limitations: list[str]


class Author(_Model):
    handle: Optional[str] = None
    display_name: Optional[str] = None
    verified: Optional[bool] = None
    followers_count: Optional[int] = None
    following_count: Optional[int] = None


class Media(_Model):
    media_id: str
    mime_type: str
    playback_url: str
    duration_seconds: float


class Post(_Model):
    post_id: str
    post_url: str
    platform: str
    title: Optional[str] = None
    caption: Optional[str] = None
    published_at: Optional[str] = None
    author: Author
    media: Media
    candidate_id: Optional[str] = None


class TimeRange(_Model):
    start_seconds: float
    end_seconds: float


class Sentence(_Model):
    sentence_id: str
    start_seconds: float
    end_seconds: float
    text: str
    speaker_id: Optional[str] = None


class Transcript(_Model):
    status: str
    processed_ranges: list[TimeRange]
    sentences: list[Sentence]


class SubmittedClip(_Model):
    url: str
    title: Optional[str] = None
    duration_seconds: float
    published_at: Optional[str] = None


class SourceVideo(_Model):
    url: str
    title: Optional[str] = None
    publisher: Optional[str] = None
    published_at: Optional[str] = None
    duration_seconds: float


class MatchEvidence(_Model):
    method: str
    description: str


class SourceMatch(_Model):
    match_id: str
    clip_start_seconds: float
    clip_end_seconds: float
    source_start_seconds: float
    source_end_seconds: float
    quote: str
    evidence: list[MatchEvidence]


class UnmatchedSegment(_Model):
    start_seconds: float
    end_seconds: float
    reason: str


class SourceMatchSection(_Model):
    section: Literal["source"] = "source"
    title: str
    submitted_clip: SubmittedClip
    source_video: SourceVideo
    matches: list[SourceMatch]
    coverage_ratio: float
    matched_clip_seconds: float
    match_confidence: Confidence
    unmatched_clip_segments: list[UnmatchedSegment]
    summary: str


class FactCheckSource(_Model):
    title: str
    url: str


class FactCheckClaim(_Model):
    claim_id: str
    claim: str
    verdict: str
    explanation: str
    sources: list[FactCheckSource]


class FactCheckSection(_Model):
    section: Literal["fact_check"] = "fact_check"
    title: str
    claims: list[FactCheckClaim]
    overall_assessment: str
    confidence: Confidence
    summary: str


class HistoricalMatch(_Model):
    figure: str
    year: int
    context: str
    quote: str
    source_url: Optional[str] = None


class HistoricalParallel(_Model):
    parallel_id: str
    statement: str
    historical_match: HistoricalMatch
    similarity: str
    explanation: str
    confidence: Confidence


class HistoricalParallelsSection(_Model):
    section: Literal["historical_parallels"] = "historical_parallels"
    title: str
    parallels: list[HistoricalParallel]
    confidence: Confidence
    summary: str


class ManipulationSignal(_Model):
    signal_id: str
    type: str
    at_seconds: float
    confidence: Confidence
    explanation: str


class DeepfakeAssessment(_Model):
    status: str
    reason: Optional[str] = None


class ManipulationCheckSection(_Model):
    section: Literal["manipulation_check"] = "manipulation_check"
    title: str
    overall: str
    overall_explanation: str
    signals: list[ManipulationSignal]
    deepfake_assessment: DeepfakeAssessment
    confidence: Confidence
    summary: str


class SubmittedBundle(_Model):
    post: Post
    transcript: Transcript


class SourceBundle(_Model):
    post: Post
    transcript: Transcript


class Job(_Model):
    job_id: str
    url: str
    status: str
    stage: Optional[str] = None
    progress: int = 0
    report_id: Optional[str] = None
    error: Optional[dict[str, Any]] = None
    conversation_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class AnalysisResult(_Model):
    job_id: str
    url: str
    submitted: SubmittedBundle
    source: SourceBundle
    source_match: SourceMatchSection
    fact_check: FactCheckSection
    historical_parallels: HistoricalParallelsSection
    manipulation_check: ManipulationCheckSection


class ReportV2(_Model):
    schema_version: str
    report_id: str
    job_id: str
    generated_at: str
    outcome: str
    submitted: SubmittedBundle
    source: SourceBundle
    source_match: SourceMatchSection
    fact_check: FactCheckSection
    historical_parallels: HistoricalParallelsSection
    manipulation_check: ManipulationCheckSection
    summary: str
    limitations: list[str]


class AnalyzeRequest(_Model):
    url: str
    conversation_id: Optional[str] = None
    job_id: Optional[str] = None


class AnalyzeResponse(_Model):
    job_id: str
    status: Literal["queued"] = "queued"


class JobStatusResponse(_Model):
    status: str
    stage: Optional[str] = None
    progress: int = 0
    report_id: Optional[str] = Field(default=None)
    error: Optional[dict[str, Any]] = None

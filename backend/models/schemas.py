from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field

class IngestType(str, Enum):
    TEXT = "text"
    URL = "url"
    PDF = "pdf"

class LensType(str, Enum):
    NEWS = "news"
    LEARN = "learn"

class PersonaType(str, Enum):
    GENERAL = "general"
    STUDENT = "student"
    EXECUTIVE = "executive"

class VerificationStatus(str, Enum):
    VERIFIED = "VERIFIED"
    CONTRADICTED = "CONTRADICTED"
    UNVERIFIED = "UNVERIFIED"

class Entity(BaseModel):
    name: str = Field(..., description="Name of the entity")
    category: str = Field(..., description="E.g., Person, Organization, Location, Technology, Metric")
    importance: float = Field(default=0.8, description="Relevance score 0.0 to 1.0")
    description: Optional[str] = Field(default=None, description="Brief contextual description")

class Concept(BaseModel):
    name: str = Field(..., description="Key concept or topic name")
    description: str = Field(..., description="Explanation in relation to the source content")

class Claim(BaseModel):
    claim_id: str = Field(..., description="Unique claim identifier, e.g. claim_1")
    quote: str = Field(..., description="Direct quote from the source content")
    normalized_statement: str = Field(..., description="Standardized factual proposition")
    source_span: Optional[str] = Field(default=None, description="Location hint or paragraph anchor in source")
    status: VerificationStatus = Field(default=VerificationStatus.UNVERIFIED, description="Verification status")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0, description="Verification confidence score")
    evidence_quote: Optional[str] = Field(default=None, description="Corroborating or contradicting evidence text")
    external_sources: List[str] = Field(default_factory=list, description="URLs or reference citations")
    fact_invariance_passed: bool = Field(default=True, description="True if no drift from the original source")

class ContentGraph(BaseModel):
    title: str = Field(..., description="Title of the ingested content")
    summary: str = Field(..., description="Concise multi-sentence summary")
    reading_time_minutes: int = Field(default=3, description="Estimated reading time in minutes")
    tone: str = Field(default="objective", description="Tone (e.g. analytical, urgent, educational, neutral)")
    complexity_level: str = Field(default="intermediate", description="Reading difficulty: beginner, intermediate, advanced")
    language: str = Field(default="en", description="Detected or primary language code")
    entities: List[Entity] = Field(default_factory=list)
    concepts: List[Concept] = Field(default_factory=list)
    claims: List[Claim] = Field(default_factory=list)
    trust_score: float = Field(default=0.0, ge=0.0, le=100.0, description="Overall trust score percentage")
    raw_content_preview: Optional[str] = None
    is_cached: bool = Field(default=False, description="True if retrieved from fingerprint cache")


class DialogueTurn(BaseModel):
    speaker: str = Field(..., description="'Host' or 'Analyst'")
    text: str = Field(..., description="Spoken utterance text")

class AudioSegment(BaseModel):
    speaker: str = Field(..., description="'Host' or 'Analyst'")
    text: str = Field(..., description="Spoken utterance text")
    audio_url: Optional[str] = None
    start_time: float = Field(default=0.0, description="Timestamp start in seconds")
    end_time: float = Field(default=0.0, description="Timestamp end in seconds")

class AudioBriefing(BaseModel):
    title: str = Field(..., description="Briefing title")
    duration_seconds: float = Field(default=0.0)
    audio_url: str = Field(..., description="URL to playable audio file")
    transcript: List[AudioSegment] = Field(default_factory=list)

class QuizQuestion(BaseModel):
    question: str
    options: List[str] = Field(..., min_length=4, max_length=4)
    correct_index: int = Field(..., ge=0, le=3)
    explanation: str
    citation_claim_id: Optional[str] = None
    difficulty: str = "medium"

class Quiz(BaseModel):
    title: str
    target_persona: str = "student"
    language: str = "en"
    questions: List[QuizQuestion] = Field(default_factory=list)

class StoryCard(BaseModel):
    card_id: str
    title: str
    headline: str
    key_takeaway: str
    statistic_or_metric: Optional[str] = None
    source_quote: Optional[str] = None
    category: str = "Core Finding"

class StoryDeck(BaseModel):
    title: str
    cards: List[StoryCard] = Field(default_factory=list)

class IngestRequest(BaseModel):
    input_type: IngestType = Field(default=IngestType.TEXT)
    content: Optional[str] = Field(default=None, description="Raw text or base64 PDF")
    url: Optional[str] = Field(default=None, description="Target webpage URL")
    lens: LensType = Field(default=LensType.NEWS)
    persona: PersonaType = Field(default=PersonaType.GENERAL)
    language: str = Field(default="en", description="Target language code (en, hi, mr)")

class JobStage(str, Enum):
    QUEUED = "queued"
    FETCHING = "fetching"
    BUILDING_GRAPH = "building_graph"
    VERIFYING_CLAIMS = "verifying_claims"
    GENERATING_AUDIO = "generating_audio"
    COMPLETED = "completed"
    FAILED = "failed"

class JobStatus(BaseModel):
    job_id: str
    stage: JobStage = JobStage.QUEUED
    progress_pct: int = 0
    message: str = "Job initialized"
    graph: Optional[ContentGraph] = None
    audio: Optional[AudioBriefing] = None
    quiz: Optional[Quiz] = None
    story_deck: Optional[StoryDeck] = None
    error: Optional[str] = None

class SampleItem(BaseModel):
    id: str
    title: str
    description: str
    language: str
    lens: LensType
    input_type: IngestType
    content: str

class ReaderEvent(BaseModel):
    job_id: str
    persona: str = "general"
    language: str = "en"
    format_type: str = "audio" # audio, quiz, story
    section_index: int = 0
    time_spent_ms: int = 0
    completed: bool = False
    dropped_off: bool = False

class DropOffInsight(BaseModel):
    job_id: str
    high_drop_off_section: int
    drop_off_rate_pct: float
    diagnosis: str
    recommended_rewrite: str
    fact_invariance_verified: bool = True

class PublisherMetrics(BaseModel):
    total_readers: int = 14280
    avg_completion_rate: float = 78.4
    credits_used: int = 340
    estimated_cost_savings: str = "$4,200/mo"
    active_lens: str = "news"

class OptimizeRequest(BaseModel):
    job_id: str
    target_section: int

class GroundedQARequest(BaseModel):
    job_id: str
    question: str


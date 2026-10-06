export type IngestType = "text" | "url" | "pdf";
export type LensType = "news" | "learn";
export type PersonaType = "general" | "student" | "executive";
export type VerificationStatus = "VERIFIED" | "CONTRADICTED" | "UNVERIFIED";

export interface Entity {
  name: string;
  category: string;
  importance: number;
  description?: string;
}

export interface Concept {
  name: string;
  description: string;
}

export interface Claim {
  claim_id: string;
  quote: string;
  normalized_statement: string;
  source_span?: string;
  status: VerificationStatus;
  confidence: number;
  evidence_quote?: string;
  external_sources: string[];
  fact_invariance_passed: boolean;
}

export interface ContentGraph {
  title: string;
  summary: string;
  reading_time_minutes: number;
  tone: string;
  complexity_level: string;
  language: string;
  entities: Entity[];
  concepts: Concept[];
  claims: Claim[];
  trust_score: number;
  raw_content_preview?: string;
}

export interface AudioSegment {
  speaker: "Host" | "Analyst" | string;
  text: string;
  audio_url?: string;
  start_time: number;
  end_time: number;
}

export interface AudioBriefing {
  title: string;
  duration_seconds: number;
  audio_url: string;
  transcript: AudioSegment[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  citation_claim_id?: string;
  difficulty?: string;
}

export interface Quiz {
  title: string;
  target_persona: string;
  language: string;
  questions: QuizQuestion[];
}

export interface StoryCard {
  card_id: string;
  title: string;
  headline: string;
  key_takeaway: string;
  statistic_or_metric?: string;
  source_quote?: string;
  category: string;
}

export interface StoryDeck {
  title: string;
  cards: StoryCard[];
}

export type JobStage =
  | "queued"
  | "fetching"
  | "building_graph"
  | "verifying_claims"
  | "generating_audio"
  | "completed"
  | "failed";

export interface JobStatus {
  job_id: string;
  stage: JobStage;
  progress_pct: number;
  message: string;
  graph?: ContentGraph;
  audio?: AudioBriefing;
  quiz?: Quiz;
  story_deck?: StoryDeck;
  error?: string;
}

export interface SampleItem {
  id: string;
  title: string;
  description: string;
  language: string;
  lens: LensType;
  input_type: IngestType;
  content: string;
}

export interface DropOffInsight {
  job_id: string;
  high_drop_off_section: number;
  drop_off_rate_pct: number;
  diagnosis: string;
  recommended_rewrite: string;
  fact_invariance_verified: boolean;
}

export interface PublisherMetrics {
  total_readers: number;
  avg_completion_rate: number;
  credits_used: number;
  estimated_cost_savings: string;
  active_lens: string;
}

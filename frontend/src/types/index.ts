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
  is_cached?: boolean;
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

export interface MetricFlashcard {
  id: string;
  metric: string;
  label: string;
  significance: string;
  verified_source_claim: string;
  claim_id?: string;
}

export interface ExecutiveBrief {
  title: string;
  executive_summary: string;
  strategic_takeaways: string[];
  market_catalysts: string[];
  key_risks_and_limitations: string[];
  action_items: string[];
  flashcards: MetricFlashcard[];
}

export interface GroundedCitation {
  claim_id: string;
  statement: string;
  quote?: string;
  confidence: number;
  external_sources: string[];
}

export interface GroundedQAResponse {
  question: string;
  answer: string;
  trust_score: number;
  citations?: GroundedCitation[];
  suggested_questions?: string[];
}

export interface JobStatus {
  job_id: string;
  stage: JobStage;
  progress_pct: number;
  message: string;
  graph?: ContentGraph;
  audio?: AudioBriefing;
  quiz?: Quiz;
  story_deck?: StoryDeck;
  executive_brief?: ExecutiveBrief;
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

// -------------------------------------------------------------
// Billing & Revenue Architecture Types
// -------------------------------------------------------------

export type PlanTier = "free" | "starter" | "professional" | "enterprise";

export interface PlanDefinition {
  id: PlanTier;
  name: string;
  price_monthly_usd: number;
  price_annual_usd: number;
  monthly_credits: number;
  features: string[];
  max_languages: number;
  supported_formats: string[];
  has_self_healing: boolean;
  has_voice_assistant: boolean;
  has_sponsor_rev_share: boolean;
  rev_share_pct: number;
  support_level: string;
}

export interface APIKeyInfo {
  id: string;
  org_id: string;
  key_prefix: string;
  name: string;
  tier: PlanTier;
  credits_remaining: number;
  credits_total: number;
  rate_limit_rpm: number;
  is_active: boolean;
  created_at: string;
  full_key?: string;
}

export interface UsageSummary {
  org_id: string;
  tier: PlanTier;
  credits_total: number;
  credits_remaining: number;
  credits_consumed: number;
  burn_rate_daily: number;
  estimated_depletion_days: number;
  operation_breakdown: Record<string, number>;
  recent_transactions: Array<{
    operation: string;
    credits: number;
    job_id?: string;
    timestamp: string;
  }>;
}

export interface ROICalculatorParams {
  articles_per_month: number;
  manual_cost_per_article: number;
  languages_count: number;
  formats_count: number;
  monthly_readers: number;
  estimated_cpm: number;
}

export interface ROICalculatorResult {
  articles_per_month: number;
  manual_monthly_cost: number;
  kaleido_monthly_cost: number;
  monthly_cost_savings: number;
  annual_cost_savings: number;
  time_saved_hours_monthly: number;
  estimated_sponsor_revenue_monthly: number;
  net_monthly_gain: number;
  roi_percentage: number;
  break_even_days: number;
}

export interface SponsorCampaign {
  id: string;
  brand: string;
  headline: string;
  creative_text: string;
  cta_url: string;
  cta_label: string;
  cpm_bid: number;
  matching_topics: string[];
  sponsor_badge: string;
  is_active: boolean;
}

export interface SponsorEarningsSummary {
  total_impressions: number;
  gross_ad_revenue_usd: number;
  publisher_share_usd: number;
  kaleido_share_usd: number;
  active_campaigns: number;
  top_performing_format: string;
}

export interface EmbedDomain {
  id: string;
  domain: string;
  theme: string;
  is_premium: boolean;
  impressions_total: number;
}

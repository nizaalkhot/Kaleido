import {
  JobStatus,
  SampleItem,
  DropOffInsight,
  PublisherMetrics,
  IngestType,
  LensType,
  PersonaType,
  GroundedCitation,
  PlanDefinition,
  APIKeyInfo,
  UsageSummary,
  ROICalculatorParams,
  ROICalculatorResult,
  SponsorCampaign,
  SponsorEarningsSummary,
  EmbedDomain
} from "@/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface IngestPayload {
  input_type: IngestType;
  content?: string;
  url?: string;
  lens: LensType;
  persona: PersonaType;
  language: string;
}

export interface GroundedChatResponse {
  question: string;
  answer: string;
  trust_score: number;
  citations?: GroundedCitation[];
  suggested_questions?: string[];
}

export interface OptimizedVariantResponse {
  job_id: string;
  optimized_section: number;
  new_variant_text: string;
  fact_invariance_verified: boolean;
  trust_score: number;
}

export const api = {
  getBackendUrl(): string {
    return BACKEND_URL;
  },

  async checkHealth(): Promise<{ status: string }> {
    const res = await fetch(`${BACKEND_URL}/api/health`);
    if (!res.ok) throw new Error("Backend unhealthy");
    return res.json();
  },

  async getSamples(): Promise<SampleItem[]> {
    const res = await fetch(`${BACKEND_URL}/api/samples`);
    if (!res.ok) throw new Error("Failed to fetch samples");
    return res.json();
  },

  async getSample(sampleId: string): Promise<SampleItem> {
    const res = await fetch(`${BACKEND_URL}/api/samples/${sampleId}`);
    if (!res.ok) throw new Error("Sample not found");
    return res.json();
  },

  async startIngestion(payload: IngestPayload): Promise<{ job_id: string; status: string }> {
    const res = await fetch(`${BACKEND_URL}/api/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Ingestion failed" }));
      throw new Error(err.detail || "Ingestion failed");
    }
    return res.json();
  },

  async getJobDetails(jobId: string): Promise<JobStatus> {
    const res = await fetch(`${BACKEND_URL}/api/jobs/${jobId}`);
    if (!res.ok) throw new Error("Job not found");
    return res.json();
  },

  async recordEvent(event: {
    job_id: string;
    persona?: string;
    language?: string;
    format_type: string;
    section_index: number;
    time_spent_ms: number;
    completed: boolean;
    dropped_off: boolean;
  }): Promise<{ status: string; sink: string }> {
    const res = await fetch(`${BACKEND_URL}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    return res.json();
  },

  async getJobInsights(jobId: string): Promise<DropOffInsight> {
    const res = await fetch(`${BACKEND_URL}/api/insights/${jobId}`);
    if (!res.ok) throw new Error("Failed to load insights");
    return res.json();
  },

  async optimizeVariant(jobId: string, targetSection: number): Promise<OptimizedVariantResponse> {
    const res = await fetch(`${BACKEND_URL}/api/optimize-variant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId, target_section: targetSection }),
    });
    if (!res.ok) throw new Error("Failed to optimize variant");
    return res.json();
  },

  async getPublisherMetrics(): Promise<PublisherMetrics> {
    const res = await fetch(`${BACKEND_URL}/api/metering`);
    if (!res.ok) throw new Error("Failed to load metrics");
    return res.json();
  },

  async sendGroundedChat(jobId: string, question: string): Promise<GroundedChatResponse> {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId, question }),
    });
    if (!res.ok) throw new Error("Chat request failed");
    return res.json();
  },

  // -----------------------------------------------------------
  // Billing & Monetization API
  // -----------------------------------------------------------

  async getPlans(): Promise<Record<string, PlanDefinition>> {
    const res = await fetch(`${BACKEND_URL}/api/billing/plans`);
    if (!res.ok) throw new Error("Failed to load pricing plans");
    return res.json();
  },

  async getUsageSummary(): Promise<UsageSummary> {
    const res = await fetch(`${BACKEND_URL}/api/billing/usage`);
    if (!res.ok) throw new Error("Failed to load usage summary");
    return res.json();
  },

  async getAPIKeys(): Promise<APIKeyInfo[]> {
    const res = await fetch(`${BACKEND_URL}/api/billing/keys`);
    if (!res.ok) throw new Error("Failed to fetch API keys");
    return res.json();
  },

  async createAPIKey(name: string, tier: string): Promise<APIKeyInfo> {
    const res = await fetch(`${BACKEND_URL}/api/billing/keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, tier }),
    });
    if (!res.ok) throw new Error("Failed to create API key");
    return res.json();
  },

  async revokeAPIKey(keyId: string): Promise<{ status: string }> {
    const res = await fetch(`${BACKEND_URL}/api/billing/keys/${keyId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to revoke API key");
    return res.json();
  },

  async checkoutPlan(planTier: string, billingCycle: string): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/billing/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_tier: planTier, billing_cycle: billingCycle }),
    });
    if (!res.ok) throw new Error("Checkout failed");
    return res.json();
  },

  async topupCredits(credits: number, costUsd: number): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/billing/topup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credits, cost_usd: costUsd }),
    });
    if (!res.ok) throw new Error("Credit top-up failed");
    return res.json();
  },

  async calculateROI(params: ROICalculatorParams): Promise<ROICalculatorResult> {
    const res = await fetch(`${BACKEND_URL}/api/billing/roi-calculator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error("ROI calculation failed");
    return res.json();
  },

  async getSponsorCampaigns(): Promise<SponsorCampaign[]> {
    const res = await fetch(`${BACKEND_URL}/api/billing/sponsors`);
    if (!res.ok) throw new Error("Failed to load sponsor campaigns");
    return res.json();
  },

  async recordSponsorImpression(campaignId: string, jobId: string, formatType: string): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/billing/sponsors/impression`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign_id: campaignId, job_id: jobId, format_type: formatType }),
    });
    if (!res.ok) throw new Error("Impression recording failed");
    return res.json();
  },

  async getSponsorEarnings(): Promise<SponsorEarningsSummary> {
    const res = await fetch(`${BACKEND_URL}/api/billing/sponsors/earnings`);
    if (!res.ok) throw new Error("Failed to fetch sponsor earnings");
    return res.json();
  },

  async getEmbedDomains(): Promise<EmbedDomain[]> {
    const res = await fetch(`${BACKEND_URL}/api/billing/embed/domains`);
    if (!res.ok) throw new Error("Failed to load embed domains");
    return res.json();
  },

  async registerEmbedDomain(domain: string, theme: string = "dark"): Promise<EmbedDomain> {
    const res = await fetch(`${BACKEND_URL}/api/billing/embed/domains`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, theme, is_premium: true }),
    });
    if (!res.ok) throw new Error("Failed to register embed domain");
    return res.json();
  },
};

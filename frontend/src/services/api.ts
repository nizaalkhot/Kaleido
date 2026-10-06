import {
  JobStatus,
  SampleItem,
  DropOffInsight,
  PublisherMetrics,
  IngestType,
  LensType,
  PersonaType
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
};

# Kaleido 🔮
> **One source, a verified experience for every audience.**
> An end-to-end multi-format personalization and fact-invariant verification platform powered by Vertex AI Gemini, Cloud Text-to-Speech, edge-tts, BigQuery, and Stripe.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-Vertex_AI-4285F4.svg?logo=google-cloud&logoColor=white)](https://cloud.google.com/vertex-ai)
[![Python Tests](https://img.shields.io/badge/pytest-26%2F26%20Passing-brightgreen.svg?logo=pytest&logoColor=white)](backend/tests/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

---

## 🎬 Interactive Video Demo & Product Tour

Watch the complete **2-minute end-to-end platform showcase** walking through the live ingestion, Vertex AI Gemini Pro Trust Critic with real-world Google Search grounding, neural dual-speaker audio synthesis, interactive quizzes, executive briefings with 3D metric flashcards, BigQuery telemetry self-healing, and publisher billing:

https://github.com/nizaalkhot/Kaleido/raw/master/recordings/kaleido_feature_showcase.mp4

> [!TIP]
> **Direct Video File**: You can also watch or download the recording locally at [`recordings/kaleido_feature_showcase.mp4`](recordings/kaleido_feature_showcase.mp4).

### ⏱️ Video Demo Timeline & Highlights

| Timestamp | Feature / Milestone | What's Happening in the Demo |
| :--- | :--- | :--- |
| `00:00 - 00:18` | **Multi-Modal Ingestion & SSRF Protection** | Ingesting raw text, live web URLs, or PDF documents with strict anti-SSRF IP masking. |
| `00:18 - 00:42` | **Content Graph & Trust Critic** | Gemini Flash deconstructs text into atomic claims; Gemini Pro evaluates source faithfulness. |
| `00:42 - 01:08` | **Vertex AI Search Grounding** | Live Google Search corroboration surfaces real-world citations and flags contradicted claims. |
| `01:08 - 01:28` | **Dual-Speaker Neural Audio Briefing** | Generates Host & Analyst podcast dialogue with synchronized scrubbing and script export. |
| `01:28 - 01:46` | **Executive Strategic Brief & 3D Cards** | C-suite memo with market catalysts, risk matrix, and interactive 3D metric flip cards. |
| `01:46 - 02:02` | **Interactive Quizzes & Story Decks** | Persona-tuned comprehension questions (Student vs. Executive) with citation-backed feedback. |
| `02:02 - 02:18` | **Telemetry Stream & Live Self-Healing** | Real-time BigQuery telemetry identifies friction drop-offs; InsightsAgent generates healed variants. |
| `02:18 - 02:30` | **Publisher Billing & Embed Sandbox** | Exploring subscription plans, interactive ROI calculator, revenue forecasts, and multi-theme embed widgets. |

---

## 🌟 Overview

**Kaleido** solves a fundamental bottleneck in modern digital publishing: *the tension between tailored audience engagement and factual integrity.* 

Traditional automated personalization risks hallucination, bias, and factual drift. Kaleido guarantees **Fact Invariance**:
- You feed in a single authoritative source (article text, webpage URL, or PDF report).
- The engine decomposes the text into a structured **Content Graph** with atomic factual claims.
- A **Two-Stage Trust Critic** verifies faithfulness against the source and grounds claims against real-world truth.
- The **FormatStudio 2.0** concurrently synthesizes verified multi-format artifacts (Podcast-style dual-speaker audio briefings, interactive quizzes, swipeable visual story decks, and executive briefs).
- An **Audience Insights Agent** continuously monitors drop-off telemetry via **BigQuery** and heals high-friction sections with fact-invariant rewrites.
- Publishers can embed verified interactive experiences onto any external domain with a single `<script src="/embed.js">` tag.
- A built-in **Publisher Monetization & Billing Engine** allows turnkey commercialization via Stripe, tiered subscription quotas, and dynamic ROI projections.

---

## 🏗️ Architecture & Pipeline Flow

```mermaid
graph TD
    A[Source Content: Text / URL / PDF] -->|SSRF Guard| B(Ingest & Extract Step)
    B --> C(Content Graph Builder: Gemini Flash)
    C -->|Entities, Concepts, Claims| D{Trust Critic Loop: Gemini Pro}
    D -->|1. Source Faithfulness| D
    D -->|2. Search Grounding| D
    D -->|Trust Score & Certified Claims| E[FormatStudio 2.0: Parallel Engine]
    
    subgraph FormatStudio 2.0
        E --> F[Dual-Speaker Neural Audio: edge-tts + Web Speech]
        E --> G[Executive Brief & 3D Metric Flashcards]
        E --> H[Interactive Quiz: Persona-Tuned + Citations]
        E --> I[Visual Story Deck: Swipeable Cards + Metrics]
    end
    
    F --> J[Next.js Interactive Experience / embed.js]
    G --> J
    H --> J
    I --> J
    
    J -->|Telemetry Stream| K[(Google BigQuery + SQLite Fallback)]
    K --> L[InsightsAgent: Drop-off Diagnosis]
    L -->|Healed Variant with Fact-Invariance| J

    subgraph Publisher Economics
        M[Stripe Checkout & Billing Portal] --> N[(Publisher Credit Ledger & Plans)]
        N --> J
        N --> O[ROI Calculator & Revenue Estimator]
    end
```

---

## ✨ Key Capabilities

### 1. Ingestion & SSRF Protection
- **Multi-Modal Ingestion**: Ingest raw text, live webpage URLs, or base64-encoded PDF documents.
- **Enterprise SSRF Guard**: Strict URL validation blocking loopback, private RFC-1918 subnets, link-local, multicast, and cloud metadata endpoints (`169.254.169.254`).

### 2. Verified Content Graph
- Extracts key entities (Person, Org, Tech, Metric), core thematic concepts, reading time, tone, and difficulty level.
- Deconstructs text into 4–8 atomic factual propositions mapped directly to source text spans.

### 3. Two-Stage Trust Critic & Vertex AI Search Grounding
- **Stage 1 (Source Faithfulness)**: Validates that each claim is faithfully asserted in the original document without editorial drift, exaggeration, or distortion.
- **Stage 2 (World Truth Grounding)**: Corroborates claims against live world knowledge using Vertex AI Gemini Pro armed with the Google Search tool (`types.Tool(google_search=types.GoogleSearch())`).
- **Live Grounding Metadata Extraction**: Directly parses `search_resp.candidates[0].grounding_metadata.grounding_chunks[].web.uri` to attach real web citations to verified propositions.
- **Scientific Factuality Protocol**:
  - Differentiates breakthrough research milestones as valid `VERIFIED` technical claims.
  - Flags physically impossible or scientifically debunked premises as `CONTRADICTED` with thermodynamic evidence quotes.
- Produces a transparent **Trust Score (0–100%)** with per-claim citations, evidence cards, and audit trails.

### 4. Dual-Tier Caching & Deterministic Fingerprints
- **Deterministic SHA-256 Fingerprinting**: Fast in-memory L1 cache and persistent SQLite L2 cache (`content_cache`) return verified graphs in <10ms on repeat inputs.
- **Deterministic Audio Disk Caching**: Caches synthesized podcast files as `briefing_{audio_hash}.mp3`, eliminating redundant TTS quota usage and synthesis latency.

### 5. Parallel FormatStudio 2.0
- **Neural Audio Briefing**: Produces a podcast-style dialogue between a Host and an Analyst.
  - Writer-Critic validation loop harmonizes turns to prevent unverified drift.
  - High-fidelity dual-speaker neural audio synthesis via `edge-tts` (English, Hindi, Marathi, Tamil, Bengali, Spanish).
  - Seamless in-browser Web Speech API fallback with guaranteed pre-calculated timestamps, interactive scrubbing, and animated waveform visualizer.
  - 1-click full dialogue script export (`.txt`).
- **Executive Strategic Brief & 3D Metric Flashcards**:
  - C-suite strategic intelligence memo with key takeaways, market catalysts, risks & bottlenecks, and leadership action items.
  - Interactive 3D flip cards inspecting quantitative figures with direct underlying verified source proof quotes.
- **Interactive Quiz**: Persona-tuned comprehension questions (Student vs. Executive) with immediate feedback and citations directly tied to verified claims.
- **Visual Story Deck**: High-impact cards with bold metric callouts, takeaways, and categorical badges.
- **Multi-Format Export Hub**: Instant 1-click export to **Markdown Strategic Memo**, **Structured Content Graph (JSON)**, and **Print/PDF Fact Sheet**.

### 6. Publisher Monetization & Commercial Billing Engine
- **Tiered Subscriptions**: Preconfigured plans (**Free Tier**, **Starter @ $49/mo**, **Publisher Pro @ $199/mo**, **Enterprise Custom**).
- **Stripe Checkout & Billing Portal**: Seamless checkout sessions and self-serve customer management portal.
- **Interactive ROI Calculator Modal**: Real-time business value projection modeling monthly pageviews, current conversion rates, and projected revenue lift.
- **Publisher Revenue Modal**: Visual simulator showcasing CPM ad revenue lift, audio sponsorship slots, and subscriber retention expansion.
- **Usage & Credit Ledger**: Tracks ingested articles, synthesized audio minutes, and remaining monthly quota.

### 7. India-First & Global Vernacular Transcreation ("The Wedge")
- Supports 7 languages: **English (`en`)**, **Hindi (`hi`)**, **Marathi (`mr`)**, **Tamil (`ta`)**, **Bengali (`bn`)**, **Hinglish (`hi-Latn`)**, and **Spanish (`es`)**.
- Cultural transcreation prompting preserves precise facts while adapting tone and idioms for native readers.

### 8. Grounded Voice & Chat Assistant
- Natural hands-free conversation with Speech-to-Text voice recognition (`webkitSpeechRecognition`) and optional voice readout via SpeechSynthesis.
- Citations dynamically link to corresponding verified claims in the Content Graph with prompt suggestion chips.

### 9. Closed-Loop Telemetry & Live Self-Healing
- Streaming telemetry recorded in **Google Cloud BigQuery** (`team-gain.kaleido_analytics.reader_events`) with local asynchronous SQLite fallback.
- **InsightsAgent** diagnoses drop-off causes and live-patches the Content Graph with verified fact-invariant variants.

### 10. Multi-Theme Publisher Embed Widget v2.0
- Standalone `/embed.js` distribution script supporting `dark`, `light`, and `compact` pill themes with functional in-browser audio playback.
- Built-in live sandbox generator and publisher credit consumption metering.

---

## 📁 Repository Structure

```text
Kaleido/
├── backend/
│   ├── agents/
│   │   ├── audio_pipeline.py       # Dual-speaker TTS generator with writer-critic loop
│   │   ├── chat_agent.py           # Grounded Q&A assistant for verified claims
│   │   ├── format_studio.py        # Parallel synthesis: Quizzes, Story Decks & Exec Briefs
│   │   ├── ingest_pipeline.py      # SSRF-protected ingestion & Graph extraction
│   │   ├── insights_agent.py       # Telemetry diagnosis & variant self-healing
│   │   ├── trust_pipeline.py       # Two-stage source faithfulness & search grounding
│   │   └── workflow_engine.py      # ADK primitives (Sequential, Parallel, Loop)
│   ├── api/
│   │   ├── router.py               # Aggregated APIRouter
│   │   └── routes/
│   │       ├── analytics.py        # Telemetry, insights, optimization, metering
│   │       ├── billing.py          # Stripe subscriptions, credit ledger & ROI calculator
│   │       ├── content.py          # Ingest, jobs, SSE streaming, audio, chat
│   │       ├── health.py           # Engine health check
│   │       └── samples.py          # Golden demo seed samples
│   ├── billing/                    # Stripe billing customer & plan management
│   ├── core/
│   │   ├── config.py               # Central environment, GCP & TTS settings
│   │   └── database.py             # SQLite connection manager & automated migrations
│   ├── db/
│   │   └── repositories/
│   │       └── job_repository.py   # Dedicated JobStatus persistence
│   ├── models/
│   │   └── schemas.py              # Pydantic data schemas
│   ├── services/
│   │   ├── bigquery_service.py     # BigQuery telemetry streaming & SQLite fallback
│   │   ├── demo_seeds.py           # Curated demo articles (Quantum, Climate)
│   │   └── job_manager.py          # Pipeline runner & SSE broadcasting
│   ├── static/
│   │   ├── audio/                  # Synthesized MP3 briefings
│   │   └── embed.js                # Standalone publisher widget script (v2.0)
│   ├── utils/
│   │   └── json_parser.py          # Shared LLM JSON cleaner & extractor
│   ├── tests/                      # Full Pytest test suite (26/26 Passing)
│   ├── config.py                   # Backward-compatibility alias
│   └── main.py                     # Lean FastAPI application entry point
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css         # Liquid glass & modern typography styling
│   │   │   ├── layout.tsx          # Root Next.js layout
│   │   │   └── page.tsx            # Main application dashboard
│   │   ├── components/
│   │   │   ├── AudioPlayer.tsx     # Synchronized multi-speaker player & script exporter
│   │   │   ├── ContentGraphView.tsx# Graph visualizer & grounded Q&A
│   │   │   ├── EmbedSandboxModal.tsx # Publisher widget playground & live preview
│   │   │   ├── ExecutiveBriefView.tsx# C-suite memo & 3D metric flashcards
│   │   │   ├── InsightsDrawer.tsx  # Audience drop-off diagnostics & self-healing
│   │   │   ├── PersonaComparisonModal.tsx # Fact-invariance comparison matrix
│   │   │   ├── PricingModal.tsx    # Stripe subscription tier selection
│   │   │   ├── PublisherRevenueModal.tsx # Publisher revenue lift simulator
│   │   │   ├── QuizWidget.tsx      # Interactive verified quiz
│   │   │   ├── ROICalculatorModal.tsx # Interactive business ROI modeler
│   │   │   ├── StoryCardDeck.tsx   # Swipeable visual story cards
│   │   │   ├── TrustInspector.tsx  # Deep claim verification audit modal
│   │   │   └── UsageDashboardModal.tsx # Ingestion credits & usage metrics
│   │   ├── services/
│   │   │   └── api.ts              # Strongly-typed HTTP API client
│   │   └── types/
│   │       └── index.ts            # Synchronized TypeScript interfaces
│   ├── package.json
│   └── tsconfig.json
│
├── recordings/
│   └── kaleido_feature_showcase.mp4# Complete 2-minute MP4 video tour of all features
├── scripts/
│   └── record_showcase.js          # Automated Playwright video capture script
├── PLAN.md                         # Product specification & architectural design
├── package.json                    # Root workspace script definitions
├── pytest.ini                      # Pytest asynchronous configuration
└── README.md                       # Platform documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** and **npm**
- **Google Cloud Platform Project** with Application Default Credentials (ADC):
  ```bash
  gcloud auth application-default login
  ```
- *Optional APIs*: Vertex AI API, Cloud Text-to-Speech API, BigQuery API.
- *Optional Billing*: Stripe API Key (`STRIPE_SECRET_KEY`) for live subscription checkouts.

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn backend.main:app --port 8000 --reload
```
The backend API is now running at `http://localhost:8000`. You can inspect interactive Swagger documentation at `http://localhost:8000/docs`.

---

### 2. Frontend Setup

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the Kaleido dashboard.

---

## 🧪 Testing & Verification

Kaleido includes comprehensive unit tests and automated end-to-end integration verification:

### Run Complete Backend Test Suite (26/26 Passed)
```bash
pytest backend/tests/ -v
```

### Run Audio & Trust Critic Upgrades Test Specifically
```bash
pytest backend/tests/test_audio_and_trust_upgrades.py -v
```
*Validates*: High-fidelity neural audio synthesis via `edge-tts` (>10KB valid MP3) + Vertex AI Google Search Grounding with contradiction detection.

### Run End-to-End Pipeline Job Test
```bash
pytest backend/tests/test_end_to_end.py -v
```
*Validates*: Health check -> SSRF Ingestion -> Content Graph Extraction -> Grounded Trust Critic -> Multi-Speaker Audio -> Interactive Quiz -> Story Cards -> BigQuery / SQLite Telemetry.

### Run Frontend Production Build
```bash
npm --prefix frontend run build
```
*Validates*: Clean Next.js 16.3 Turbopack production compilation and strict TypeScript static analysis.

---

## 🔌 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health, active GCP project, and configured models. |
| `GET` | `/api/samples` | List curated 1-click golden demo articles. |
| `GET` | `/api/samples/{id}` | Retrieve specific sample article by ID. |
| `POST` | `/api/ingest` | Initiates asynchronous ingestion pipeline job. |
| `GET` | `/api/jobs/{job_id}` | Query current job status, pipeline progress, and generated artifacts. |
| `GET` | `/api/jobs/{job_id}/stream` | Server-Sent Events (SSE) real-time pipeline event stream. |
| `GET` | `/api/audio/{filename}` | Serve synthesized MP3 audio briefing. |
| `POST` | `/api/chat` | Verified claim-grounded Q&A chat. |
| `POST` | `/api/events` | Record reader interaction telemetry to BigQuery / SQLite. |
| `GET` | `/api/insights/{job_id}` | Run InsightsAgent drop-off analysis. |
| `POST` | `/api/optimize-variant` | Generate fact-invariant optimized section rewrite. |
| `GET` | `/api/metering` | Retrieve publisher audience metrics and cost economics. |
| `GET` | `/api/billing/plans` | Fetch available subscription tiers, pricing, and feature sets. |
| `GET` | `/api/billing/usage` | Retrieve current month credit usage and billing limits. |
| `POST` | `/api/billing/create-checkout-session` | Create Stripe Checkout Session for subscription upgrade. |
| `POST` | `/api/billing/create-portal-session` | Open Stripe Customer Portal for managing active subscriptions. |
| `POST` | `/api/billing/roi-calculator` | Calculate projected financial ROI based on traffic and conversion metrics. |
| `GET` | `/embed.js` | Serve standalone publisher widget script with provenance header. |

---

## 🌐 Standalone Publisher Embed

Publishers can embed Kaleido verified briefings into any website:

```html
<!-- Include in any article or CMS page -->
<div id="kaleido-widget"></div>
<script 
  src="https://your-kaleido-domain/embed.js" 
  data-kaleido="job_fb9f236aef" 
  data-theme="dark"
  async>
</script>
```

---

## 🛡️ License

Distributed under the Apache 2.0 License. See `LICENSE` for details.

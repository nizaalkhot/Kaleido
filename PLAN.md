# Kaleido: one source, a verified experience for every audience

Kaleido takes any piece of content (article, PDF, lecture, video) and turns it into trusted, personalized, multilingual, multi-format experiences. It then watches how audiences respond and improves what it generates.

I'd verify exact model IDs at build time. My searches showed Gemini 3.x, Veo 3.1 and an ADK line moving toward 2.0. ADK v1.x composes agents as classes with workflow agents, while the in-flight 2.0 line adds explicit graph-based workflows. So pin versions and keep model names in one config file.

## 1. The pitch

**Problem.** Good content is trapped in one format, one language and one reading level. Publishers and educators can't afford to adapt it. Generic AI "repurposing" tools produce plausible-sounding drift from the source and never learn what worked.

**USP, three things competitors don't combine:**
1. **Fact-invariant personalization.** Personalization changes the format, depth, tone and language of a piece, never its claims. A checker agent enforces this on every output.
2. **Trust layer.** Every generated asset links back to the source claims it came from. Claims are checked against the source and against the world via Search grounding, with confidence and evidence shown. Outputs carry provenance labels.
3. **Closed loop.** Reader events flow into BigQuery. An insights agent finds where each audience drops off and which format works for whom, then proposes and regenerates better variants.

**Wedge.** Start India-first and vernacular: Hindi, Marathi, Tamil, Bengali and code-mixed Hinglish. This is where translation quality and format gaps hurt most, and where Cloud Translation plus Gemini can do transcreation (cultural adaptation) rather than literal translation. The engine is language-agnostic, so it generalizes later.

## 2. Features

| Layer | Feature | Google tech |
|---|---|---|
| Understand | Ingest URL, PDF, YouTube or audio into a **Content Graph** (claims, entities, concepts, tone, difficulty) | Gemini multimodal, long context |
| Trust | Claim extraction, verification, Trust Score, contradiction flags | Search grounding, Gemini Pro as critic |
| Create | Audio briefing (multi-speaker), explainer video, interactive story, quiz or flashcards, social cards | Gemini TTS or Cloud TTS, Veo, image model, Gemini |
| Adapt | Persona engine (language, reading level, attention span, accessibility) and transcreation | Cloud Translation, Gemini |
| Experience | Adaptive player: "simpler", "switch to audio", "why should I care", grounded Q&A, voice conversation | Gemini Live, Next.js |
| Learn | Insights and optimization agents, bandit-style variant selection | BigQuery, Pub/Sub |
| Distribute | One-line **embed widget** for publishers | Cloud Run, CDN |

**Two presets on one engine:**
- **News Lens:** brief, verified, localized.
- **Learn Lens:** lesson, quiz, adaptive difficulty.

Lead the demo with one of them and show the other as proof of generality.

## 3. Revenue

- **Hero:** the embed widget plus an audience-insights dashboard, sold to publishers and educators by monthly active readers. It raises time-on-page and gives them data they don't have today.
- **Usage credits** for renders. Video is premium and audio and text are cheap.
- **Sponsored-content adaptation** with a brand-safety agent, as a revenue share.
- **API and white-label** for edtech and media platforms.
- **Self-serve free tier** for creators and educators as the funnel.

## 4. Architecture

**ADK agent design.** Use workflow agents wherever the order is known and LLM agents only where judgment is needed.

- `Orchestrator` (LLM agent) handles user intent.
- `IngestPipeline` (Sequential): fetch → parse → graph builder.
- `TrustPipeline`: a Parallel claim verifier, then a Loop of writer and critic until the fact-invariance check passes or retries run out.
- `FormatStudio` (Parallel): audio, video, story, quiz and social agents.
- `Localizer` for transcreation, with a glossary tool.
- `InsightsAgent` with BigQuery as a tool. Keep it read-only, with a SQL allowlist.

**Services.**
- FastAPI wraps the ADK Runner. Endpoints: `/ingest`, `/jobs/{id}/stream` (SSE progress), `/assets`, `/events`, `/chat`.
- Next.js App Router for the app, with the embed widget as a small separate bundle.
- Cloud Run for services. Cloud Tasks or Workflows for long jobs, since Veo is asynchronous.
- Cloud Storage for media, Postgres or Firestore for metadata, Pub/Sub into BigQuery for events, Secret Manager for keys.
- Use API keys for dev only. Move to Vertex AI and service accounts for production for quotas, data terms and IAM.

**Progressive delivery.** Text and the Content Graph arrive in about 10 seconds, audio in about 30, and video later. The user never waits on the slowest asset.

**Cost control.**
- Flash-tier models for extraction and Pro only for the critic.
- Cache by content hash, and use context caching.
- Make a storyboard video (images, motion and TTS) the default, with Veo as the on-demand premium option. One recent roundup put Veo 3.1 Standard at roughly $0.40 per second, so check the current rate card before pricing anything.

**Quality.**
- ADK evalsets plus user simulation.
- A golden set of about 30 sources across languages, scored on faithfulness, fact-invariance and native-speaker fluency.
- An LLM judge for scale and humans for the final call.

## 5. Arguing against it

1. **"It's a wrapper, and NotebookLM exists."** Fair. Generation alone is not a moat. The defensible parts are the trust layer, the feedback loop that accumulates per-audience data, and publisher distribution through the embed. If a reviewer says "NotebookLM does audio," the answer is that it doesn't verify claims, doesn't localize deeply, and doesn't learn from your readers.
2. **"LLM fact-checking can be wrong."** Yes, so separate two claims in the UI. *Faithful to source* is checkable and strong. *True in the world* is probabilistic. Show evidence and confidence, and abstain ("unverified") instead of guessing. Never show a green badge without a source link.
3. **"You're transforming other people's content."** Restrict to content the user owns or has rights to. For the embed, verify domain ownership. Keep source attribution in every asset.
4. **"Multi-agent systems are slow and over-engineered."** True if every step is an LLM. Hence deterministic workflow agents for known flows, and agents only for judgment (claims, critic, insights).
5. **"Personalization is creepy and creates filter bubbles."** Personalize on declared preferences and session behavior, not identity. Keep facts invariant across personas. Collect consent as required under India's DPDP Act, and confirm the current rules with counsel.
6. **"Simulated audience insights are fake data."** Keep synthetic personas strictly for pre-publication testing and label them clearly. Real insights come only from real events.
7. **"Low-resource language quality will embarrass you."** Use native reviewers on the golden set, show an "AI-adapted" label, and launch only languages that pass your threshold. Fewer languages done well beats 22 done badly.
8. **"Who actually pays?"** Publishers have thin budgets and long sales cycles. So go self-serve first with educators and creators, and chase 3 to 5 publisher pilots for the embed. Treat the revenue story as a hypothesis until a pilot pays.
9. **"Prompt injection and SSRF."** Ingested pages are untrusted input. Strip instructions from fetched content, sandbox the fetcher, block internal IP ranges, and give agents least-privilege tools.
10. **"Deepfake and misuse risk."** No voice cloning, no real-person likeness, and keep Google's watermarking and provenance labels on.
11. **"Scope creep."** The real risk. See the cut line below.
12. **"ADK churn."** Pin versions and wrap ADK behind your own thin interface so a 2.0 migration is contained.

## 6. Build phases

1. **Core spine.** Ingest, Content Graph, one format (audio), FastAPI with SSE, minimal Next.js player. Eval harness from day one.
2. **Trust layer.** Claim extraction, verification, writer and critic loop, source-linked UI.
3. **Breadth.** Quiz and story formats, localization for 3 languages, persona controls, grounded Q&A.
4. **Loop and money.** Event pipeline to BigQuery, insights agent, variant optimization, embed widget, credit metering.
5. **Polish.** Video (storyboard first, Veo as premium), demo data, load test, security pass.

**Cut line if time runs short.** Keep ingest, trust layer, audio and quiz, 3 languages, and the insights dashboard. Drop Veo, Live voice and the marketplace.

## 7. Demo script (about 3 minutes)

1. Paste a long Hindi or English article. Kaleido builds the Content Graph live.
2. Show claims with a Trust Score and one flagged claim with its evidence.
3. Generate a Marathi audio brief and a Hinglish quiz for a "college student" persona versus a "busy professional" persona. Prove the facts match by showing the fact-invariance check.
4. Open the insights view. It shows a drop-off point and a suggested rewrite, then regenerates the variant.
5. Close on the embed snippet and the pricing model.
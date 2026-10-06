"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Sparkles,
  Link as LinkIcon,
  FileText,
  Upload,
  Play,
  CheckCircle2,
  Radio,
  ShieldCheck,
  Zap,
  BookOpen,
  HelpCircle,
  BarChart3,
  ArrowRightLeft,
  Code,
  Newspaper
} from "lucide-react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { TrustInspector } from "@/components/TrustInspector";
import { ContentGraphView } from "@/components/ContentGraphView";
import { QuizWidget } from "@/components/QuizWidget";
import { StoryCardDeck } from "@/components/StoryCardDeck";
import { PersonaComparisonModal } from "@/components/PersonaComparisonModal";
import { InsightsDrawer } from "@/components/InsightsDrawer";
import { EmbedSandboxModal } from "@/components/EmbedSandboxModal";
import {
  IngestType,
  LensType,
  PersonaType,
  JobStatus,
  SampleItem
} from "@/types";
import { api } from "@/services/api";

const BACKEND_URL = api.getBackendUrl();

export default function Home() {
  const [lens, setLens] = useState<LensType>("news");
  const [persona, setPersona] = useState<PersonaType>("general");
  const [language, setLanguage] = useState<string>("en");
  const [inputType, setInputType] = useState<IngestType>("text");
  const [textContent, setTextContent] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const [samples, setSamples] = useState<SampleItem[]>([]);

  // Pipeline execution state
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);

  // Active Output Format Tab
  const [activeFormat, setActiveFormat] = useState<"audio" | "quiz" | "story">("audio");

  // Modals state
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [showInsightsDrawer, setShowInsightsDrawer] = useState(false);
  const [showEmbedSandbox, setShowEmbedSandbox] = useState(false);

  // Fetch backend health and demo samples on load
  useEffect(() => {
    api.checkHealth()
      .then(() => setBackendHealthy(true))
      .catch(() => setBackendHealthy(false));

    api.getSamples()
      .then((data) => setSamples(data))
      .catch((err) => console.warn("Failed to load samples:", err));
  }, []);

  // Handle SSE streaming updates for the active job
  useEffect(() => {
    if (!currentJobId) return;

    const eventSource = new EventSource(`${api.getBackendUrl()}/api/jobs/${currentJobId}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const update: JobStatus = JSON.parse(event.data);
        setJobStatus(update);

        if (update.stage === "completed" || update.stage === "failed") {
          setIsProcessing(false);
          eventSource.close();
        }
      } catch (e) {
        console.error("Error parsing SSE event:", e);
      }
    };

    eventSource.onerror = () => {
      console.warn("SSE connection closed or errored.");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [currentJobId]);

  const loadSample = (sample: SampleItem) => {
    setInputType(sample.input_type);
    setTextContent(sample.content);
    setLanguage(sample.language);
    setLens(sample.lens);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      setTextContent(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    if (inputType === "text" && !textContent.trim()) return;
    if (inputType === "url" && !urlInput.trim()) return;
    if (inputType === "pdf" && !textContent) return;

    setIsProcessing(true);
    setJobStatus(null);
    setCurrentJobId(null);

    try {
      const data = await api.startIngestion({
        input_type: inputType,
        content: inputType === "url" ? undefined : textContent,
        url: inputType === "url" ? urlInput : undefined,
        lens,
        persona,
        language,
      });

      setCurrentJobId(data.job_id);
    } catch (err: any) {
      alert(`Error starting pipeline: ${err.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100 selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Background radial atmosphere */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(6,182,212,0.12),rgba(9,9,11,0))]" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-sm">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-white">
                Kaleido
              </span>
              <span className="ml-2 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-400 border border-white/5">
                Vertex AI ADK
              </span>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-2">
            {jobStatus?.graph && (
              <>
                <button
                  onClick={() => setShowPersonaModal(true)}
                  className="tactile-btn hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-zinc-900/80 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5 text-cyan-400" /> Persona Matrix
                </button>
                <button
                  onClick={() => setShowInsightsDrawer(true)}
                  className="tactile-btn hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
                >
                  <BarChart3 className="h-3.5 w-3.5 text-amber-400" /> Audience Insights
                </button>
              </>
            )}

            <button
              onClick={() => setShowEmbedSandbox(true)}
              className="tactile-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-zinc-900/80 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <Code className="h-3.5 w-3.5 text-cyan-400" /> Publisher Embed
            </button>
          </div>

          {/* Lens Switcher & Health Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-zinc-900 border border-white/5 rounded-xl p-1 gap-1">
              <button
                onClick={() => setLens("news")}
                className={`tactile-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  lens === "news"
                    ? "bg-zinc-800 text-cyan-300 border border-cyan-500/30 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Newspaper className="h-3.5 w-3.5" /> News Lens
              </button>
              <button
                onClick={() => setLens("learn")}
                className={`tactile-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  lens === "learn"
                    ? "bg-zinc-800 text-cyan-300 border border-cyan-500/30 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" /> Learn Lens
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
              <span
                className={`h-2 w-2 rounded-full ${
                  backendHealthy === true
                    ? "bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse"
                    : backendHealthy === false
                    ? "bg-rose-500"
                    : "bg-amber-500"
                }`}
              />
              <span className="text-zinc-400 text-[11px]">
                {backendHealthy ? "Vertex AI Live" : "Connecting..."}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 relative">
        {/* Asymmetric Split Hero & Ingestion Console */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Cols 1-7): Editorial Manifesto & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>ADAPTIVE PUBLISHING ENGINE • ZERO-DRIFT GUARANTEE</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white leading-[1.06]">
              One source of truth. <br />
              <span className="text-cyan-400">Infinite verified formats.</span>
            </h1>

            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-[62ch]">
              Personalization alters format, depth, and vernacular—never the underlying factual claims. Concurrently generates certified multi-speaker audio podcasts, interactive comprehension quizzes, and visual story decks with Vertex AI Search Grounding.
            </p>

            {/* Key Invariant Badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="liquid-card rounded-xl p-3 border border-white/5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Invariance</div>
                <div className="text-base font-bold font-mono text-emerald-400">100% Strict</div>
              </div>
              <div className="liquid-card rounded-xl p-3 border border-white/5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Critic Layer</div>
                <div className="text-base font-bold font-mono text-cyan-300">Vertex AI Grounded</div>
              </div>
              <div className="liquid-card rounded-xl p-3 border border-white/5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Fingerprint Cache</div>
                <div className="text-base font-bold font-mono text-amber-300">&lt;10ms Instant</div>
              </div>
            </div>

            {/* Quick 1-Click Golden Samples */}
            {samples.length > 0 && (
              <div className="pt-2">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-400" /> Fast Demo Presets
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {samples.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => loadSample(s)}
                      className="tactile-btn flex items-center justify-between rounded-xl border border-white/5 bg-zinc-900/70 p-3 text-xs font-medium text-zinc-200 hover:border-cyan-500/40 hover:bg-zinc-900 text-left"
                    >
                      <div className="truncate pr-2">
                        <div className="truncate font-semibold text-zinc-100">{s.title}</div>
                        <div className="text-[10px] text-zinc-400 truncate">{s.content.slice(0, 60)}...</div>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 border border-white/5 shrink-0">
                        {s.language}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Cols 8-12): Liquid Glass Ingestion Console */}
          <div className="lg:col-span-5">
            <div className="liquid-glass rounded-2xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-400" />
                  <h3 className="font-bold text-sm text-zinc-100 tracking-tight">Ingest & Adapt Console</h3>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  SSRF Guarded
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Input Modality Tabs */}
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-zinc-950/70 border border-white/5">
                  <button
                    type="button"
                    onClick={() => setInputType("text")}
                    className={`tactile-btn py-1.5 text-xs font-semibold rounded-lg text-center transition ${
                      inputType === "text"
                        ? "bg-zinc-800 text-cyan-300 shadow-sm border border-cyan-500/30"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Raw Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputType("url")}
                    className={`tactile-btn py-1.5 text-xs font-semibold rounded-lg text-center transition ${
                      inputType === "url"
                        ? "bg-zinc-800 text-cyan-300 shadow-sm border border-cyan-500/30"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Web URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputType("pdf")}
                    className={`tactile-btn py-1.5 text-xs font-semibold rounded-lg text-center transition ${
                      inputType === "pdf"
                        ? "bg-zinc-800 text-cyan-300 shadow-sm border border-cyan-500/30"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    PDF Upload
                  </button>
                </div>

                {/* Input Fields */}
                {inputType === "text" && (
                  <div>
                    <textarea
                      rows={5}
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Paste raw article text, news release, or policy document here..."
                      className="w-full rounded-xl border border-white/5 bg-zinc-950/80 p-3.5 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
                    />
                  </div>
                )}

                {inputType === "url" && (
                  <div>
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/article (Protected against SSRF)"
                      className="w-full rounded-xl border border-white/5 bg-zinc-950/80 px-3.5 py-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
                    />
                  </div>
                )}

                {inputType === "pdf" && (
                  <div className="rounded-xl border border-dashed border-white/10 p-5 text-center bg-zinc-950/50">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileUpload}
                      id="pdf-input"
                      className="hidden"
                    />
                    <label
                      htmlFor="pdf-input"
                      className="cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                      <Upload className="h-6 w-6 text-cyan-400" />
                      <span className="text-xs font-medium text-zinc-300">
                        {pdfFileName ? `Selected: ${pdfFileName}` : "Click to select and upload a PDF"}
                      </span>
                    </label>
                  </div>
                )}

                {/* Target Adaptation Controls */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      Audience Persona
                    </label>
                    <select
                      value={persona}
                      onChange={(e) => setPersona(e.target.value as PersonaType)}
                      className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 focus:border-cyan-500/50 focus:outline-none"
                    >
                      <option value="general">General Audience</option>
                      <option value="student">College Student</option>
                      <option value="executive">Executive Brief</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 focus:border-cyan-500/50 focus:outline-none"
                    >
                      <option value="en">English (Global)</option>
                      <option value="hi">Hindi (हिंदी)</option>
                      <option value="mr">Marathi (मराठी)</option>
                    </select>
                  </div>
                </div>

                {/* Launch Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="tactile-btn w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-xs font-bold text-zinc-950 shadow-[0_0_24px_rgba(6,182,212,0.3)] hover:bg-cyan-300 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                        <span>Processing Multi-Format Pipeline...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Synthesize Multi-Format Experience</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Live SSE Pipeline Progress Ribbon */}
        {jobStatus && (
          <div className="liquid-glass rounded-2xl p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className={`h-2.5 w-2.5 rounded-full ${
                  jobStatus.stage === "completed"
                    ? "bg-emerald-400"
                    : jobStatus.stage === "failed"
                    ? "bg-rose-500"
                    : "bg-cyan-400 animate-pulse"
                }`} />
                <span className="font-semibold text-zinc-100">
                  Pipeline Stage: <span className="capitalize font-mono text-cyan-300">{jobStatus.stage.replace("_", " ")}</span>
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-cyan-300">{jobStatus.progress_pct}%</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-500 ease-out"
                style={{ width: `${jobStatus.progress_pct}%` }}
              />
            </div>

            <p className="text-xs text-zinc-400 font-mono">{jobStatus.message}</p>
          </div>
        )}

        {/* Completed Results Display — Bento Grid Architecture */}
        {jobStatus?.graph && (
          <div className="space-y-6 pt-4">
            {/* Bento Studio Switcher Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center bg-zinc-900/90 border border-white/5 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setActiveFormat("audio")}
                  className={`tactile-btn flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeFormat === "audio"
                      ? "bg-zinc-800 text-cyan-300 border border-cyan-500/30 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Radio className="h-4 w-4" /> Audio Briefing
                </button>
                <button
                  onClick={() => setActiveFormat("quiz")}
                  className={`tactile-btn flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeFormat === "quiz"
                      ? "bg-zinc-800 text-cyan-300 border border-cyan-500/30 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <HelpCircle className="h-4 w-4" /> Interactive Quiz
                </button>
                <button
                  onClick={() => setActiveFormat("story")}
                  className={`tactile-btn flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeFormat === "story"
                      ? "bg-zinc-800 text-cyan-300 border border-cyan-500/30 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Layers className="h-4 w-4" /> Visual Story Cards
                </button>
              </div>

              {/* Invariance Proof quick launcher */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPersonaModal(true)}
                  className="tactile-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs font-semibold text-emerald-400 hover:bg-emerald-900/30"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Fact-Invariance Proof
                </button>
                <button
                  onClick={() => setShowInsightsDrawer(true)}
                  className="tactile-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-950/20 text-xs font-semibold text-amber-300 hover:bg-amber-900/30"
                >
                  <BarChart3 className="h-3.5 w-3.5" /> Drop-Off Insights
                </button>
              </div>
            </div>

            {/* Asymmetric Bento Architecture: Row 1 (8 + 4) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8">
                <ContentGraphView
                  graph={jobStatus.graph}
                  jobId={jobStatus.job_id}
                  backendBaseUrl={BACKEND_URL}
                />
              </div>

              <div className="lg:col-span-4">
                <TrustInspector
                  claims={jobStatus.graph.claims}
                  trustScore={jobStatus.graph.trust_score}
                  isCached={jobStatus.graph.is_cached}
                />
              </div>
            </div>

            {/* Asymmetric Bento Architecture: Row 2 (5 + 4 + 3) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {jobStatus.audio && (
                <div className="lg:col-span-5">
                  <AudioPlayer
                    briefing={jobStatus.audio}
                    backendBaseUrl={BACKEND_URL}
                  />
                </div>
              )}

              {jobStatus.quiz && (
                <div className="lg:col-span-4">
                  <QuizWidget
                    quiz={jobStatus.quiz}
                    jobId={jobStatus.job_id}
                    backendBaseUrl={BACKEND_URL}
                  />
                </div>
              )}

              {jobStatus.story_deck && (
                <div className="lg:col-span-3">
                  <StoryCardDeck
                    storyDeck={jobStatus.story_deck}
                    jobId={jobStatus.job_id}
                    backendBaseUrl={BACKEND_URL}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals & Drawers */}
      {jobStatus?.graph && (
        <>
          <PersonaComparisonModal
            graph={jobStatus.graph}
            isOpen={showPersonaModal}
            onClose={() => setShowPersonaModal(false)}
          />

          <InsightsDrawer
            jobId={jobStatus.job_id}
            isOpen={showInsightsDrawer}
            onClose={() => setShowInsightsDrawer(false)}
            backendBaseUrl={BACKEND_URL}
          />
        </>
      )}

      <EmbedSandboxModal
        jobId={jobStatus?.job_id || "sample_quantum_tech"}
        isOpen={showEmbedSandbox}
        onClose={() => setShowEmbedSandbox(false)}
        backendBaseUrl={BACKEND_URL}
      />
    </div>
  );
}

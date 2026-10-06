"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Sparkles,
  Link as LinkIcon,
  FileText,
  Upload,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Radio,
  ShieldCheck,
  ChevronRight,
  Code,
  Zap,
  BookOpen,
  Newspaper,
  HelpCircle,
  BarChart3,
  ArrowRightLeft,
  CreditCard
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
  SampleItem,
  ContentGraph,
  AudioBriefing
} from "@/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

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
    fetch(`${BACKEND_URL}/api/health`)
      .then((res) => res.json())
      .then(() => setBackendHealthy(true))
      .catch(() => setBackendHealthy(false));

    fetch(`${BACKEND_URL}/api/samples`)
      .then((res) => res.json())
      .then((data) => setSamples(data))
      .catch((err) => console.warn("Failed to load samples:", err));
  }, []);

  // Handle SSE streaming updates for the active job
  useEffect(() => {
    if (!currentJobId) return;

    const eventSource = new EventSource(`${BACKEND_URL}/api/jobs/${currentJobId}/stream`);

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
      const payload = {
        input_type: inputType,
        content: inputType === "url" ? undefined : textContent,
        url: inputType === "url" ? urlInput : undefined,
        lens,
        persona,
        language,
      };

      const res = await fetch(`${BACKEND_URL}/api/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Ingest failed: ${res.statusText}`);
      }

      const data = await res.json();
      setCurrentJobId(data.job_id);
    } catch (err: any) {
      alert(`Error starting pipeline: ${err.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-indigo-500 selection:text-white">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))]" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="h-full w-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                <Layers className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                Kaleido
              </span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                ADK Engine
              </span>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-2">
            {jobStatus?.graph && (
              <>
                <button
                  onClick={() => setShowPersonaModal(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/30 transition"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" /> Persona Matrix
                </button>
                <button
                  onClick={() => setShowInsightsDrawer(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-950/20 text-xs font-semibold text-amber-300 hover:bg-amber-900/30 transition"
                >
                  <BarChart3 className="h-3.5 w-3.5" /> Audience Insights
                </button>
              </>
            )}

            <button
              onClick={() => setShowEmbedSandbox(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-700 bg-neutral-800/80 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition"
            >
              <Code className="h-3.5 w-3.5 text-indigo-400" /> Publisher Embed
            </button>
          </div>

          {/* Lens Switcher & Health Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 gap-1">
              <button
                onClick={() => setLens("news")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  lens === "news"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Newspaper className="h-3.5 w-3.5" /> News Lens
              </button>
              <button
                onClick={() => setLens("learn")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  lens === "learn"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" /> Learn Lens
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  backendHealthy === true
                    ? "bg-emerald-500 shadow-sm shadow-emerald-500 animate-pulse"
                    : backendHealthy === false
                    ? "bg-rose-500"
                    : "bg-amber-500"
                }`}
              />
              <span className="text-neutral-400">
                {backendHealthy ? "Vertex AI Connected" : "Connecting..."}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-100">
            One source, a{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              verified experience
            </span>{" "}
            for every audience.
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
            Personalization alters format, depth, and language—never the claims. Concurrently generates multi-speaker audio, interactive quizzes, and visual story cards with a closed-loop BigQuery analytics engine.
          </p>
        </div>

        {/* Ingestion & Config Card */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-2xl backdrop-blur">
          {/* Quick 1-Click Golden Samples */}
          {samples.length > 0 && (
            <div className="mb-6 pb-6 border-b border-neutral-800/80">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-400" /> 1-Click Golden Demo Samples (Section 7 Demo Script)
              </div>
              <div className="flex flex-wrap gap-2.5">
                {samples.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadSample(s)}
                    className="flex items-center gap-2 rounded-xl border border-neutral-700/80 bg-neutral-800/70 px-3.5 py-2 text-xs font-medium text-neutral-200 hover:border-indigo-500 hover:bg-neutral-800 transition text-left"
                  >
                    <span className="h-2 w-2 rounded-full bg-indigo-400" />
                    <span>{s.title}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400">
                      {s.language}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input Modality Tabs */}
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
              <button
                type="button"
                onClick={() => setInputType("text")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  inputType === "text"
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <FileText className="h-4 w-4" /> Raw Article / Text
              </button>
              <button
                type="button"
                onClick={() => setInputType("url")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  inputType === "url"
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <LinkIcon className="h-4 w-4" /> Web URL
              </button>
              <button
                type="button"
                onClick={() => setInputType("pdf")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  inputType === "pdf"
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Upload className="h-4 w-4" /> PDF Document
              </button>
            </div>

            {/* Input Fields */}
            {inputType === "text" && (
              <div>
                <textarea
                  rows={6}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Paste raw article text, news release, or policy document here..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {inputType === "url" && (
              <div>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://news.ycombinator.com/item?id=... (SSRF Protected)"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950/70 px-4 py-3 text-xs text-neutral-200 placeholder-neutral-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {inputType === "pdf" && (
              <div className="rounded-xl border-2 border-dashed border-neutral-800 p-6 text-center bg-neutral-950/40">
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
                  <Upload className="h-8 w-8 text-neutral-400" />
                  <span className="text-xs font-medium text-neutral-300">
                    {pdfFileName ? `Selected: ${pdfFileName}` : "Click to select and upload a PDF document"}
                  </span>
                </label>
              </div>
            )}

            {/* Target Adaptation Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Target Audience Persona
                </label>
                <select
                  value={persona}
                  onChange={(e) => setPersona(e.target.value as PersonaType)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-neutral-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="general">General Public</option>
                  <option value="student">College Student (Engaged, Explanatory)</option>
                  <option value="executive">Executive Brief (High-level, Concise)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Target Language (Transcreation)
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-neutral-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="en">English (US/Global)</option>
                  <option value="hi">Hindi (हिंदी / Hinglish)</option>
                  <option value="mr">Marathi (मराठी)</option>
                </select>
              </div>
            </div>

            {/* Launch Action */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isProcessing}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 transition"
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Processing Multi-Format Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Analyze & Generate Multi-Format Experience</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live SSE Pipeline Progress */}
        {jobStatus && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-xl backdrop-blur space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${
                  jobStatus.stage === "completed"
                    ? "bg-emerald-400"
                    : jobStatus.stage === "failed"
                    ? "bg-rose-500"
                    : "bg-indigo-500 animate-pulse"
                }`} />
                <span className="font-semibold text-neutral-200">
                  Pipeline Stage: <span className="capitalize">{jobStatus.stage.replace("_", " ")}</span>
                </span>
              </div>
              <span className="font-mono text-neutral-400">{jobStatus.progress_pct}%</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                style={{ width: `${jobStatus.progress_pct}%` }}
              />
            </div>

            <p className="text-xs text-neutral-400">{jobStatus.message}</p>
          </div>
        )}

        {/* Completed Results Display */}
        {jobStatus?.graph && (
          <div className="space-y-6">
            {/* Format Studio Switcher Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setActiveFormat("audio")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                    activeFormat === "audio"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <Radio className="h-4 w-4" /> Audio Briefing
                </button>
                <button
                  onClick={() => setActiveFormat("quiz")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                    activeFormat === "quiz"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <HelpCircle className="h-4 w-4" /> Interactive Quiz
                </button>
                <button
                  onClick={() => setActiveFormat("story")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                    activeFormat === "story"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <Layers className="h-4 w-4" /> Visual Story Cards
                </button>
              </div>

              {/* Invariance Proof quick launcher */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPersonaModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs font-semibold text-emerald-400 hover:bg-emerald-900/30 transition"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Fact-Invariance Proof
                </button>
                <button
                  onClick={() => setShowInsightsDrawer(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-950/20 text-xs font-semibold text-amber-300 hover:bg-amber-900/30 transition"
                >
                  <BarChart3 className="h-3.5 w-3.5" /> Drop-Off Insights
                </button>
              </div>
            </div>

            {/* 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Left Column: Content Graph + Active Format Generator */}
              <div className="space-y-6">
                <ContentGraphView
                  graph={jobStatus.graph}
                  jobId={jobStatus.job_id}
                  backendBaseUrl={BACKEND_URL}
                />

                {/* Active Format Component */}
                {activeFormat === "audio" && jobStatus.audio && (
                  <AudioPlayer
                    briefing={jobStatus.audio}
                    backendBaseUrl={BACKEND_URL}
                  />
                )}

                {activeFormat === "quiz" && jobStatus.quiz && (
                  <QuizWidget
                    quiz={jobStatus.quiz}
                    jobId={jobStatus.job_id}
                    backendBaseUrl={BACKEND_URL}
                  />
                )}

                {activeFormat === "story" && jobStatus.story_deck && (
                  <StoryCardDeck
                    storyDeck={jobStatus.story_deck}
                    jobId={jobStatus.job_id}
                    backendBaseUrl={BACKEND_URL}
                  />
                )}
              </div>

              {/* Right Column: Trust Layer Inspector */}
              <div>
                <TrustInspector
                  claims={jobStatus.graph.claims}
                  trustScore={jobStatus.graph.trust_score}
                />
              </div>
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

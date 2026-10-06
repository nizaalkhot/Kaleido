"use client";

import React, { useState } from "react";
import {
  Network,
  Clock,
  Gauge,
  Sparkles,
  Tag,
  BookOpen,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  HelpCircle,
  Zap,
  Target
} from "lucide-react";
import { ContentGraph } from "@/types";
import { api } from "@/services/api";

interface ContentGraphViewProps {
  graph: ContentGraph;
  jobId: string;
  backendBaseUrl?: string;
}

const CATEGORY_STYLES: Record<string, string> = {
  tech: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  technology: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  system: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  org: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  organization: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  institution: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  person: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  lead: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  metric: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  stat: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  time: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  location: "bg-teal-500/15 text-teal-300 border-teal-500/30",
};

export const ContentGraphView: React.FC<ContentGraphViewProps> = ({
  graph,
  jobId,
  backendBaseUrl = "http://localhost:8000",
}) => {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ q: string; a: string }>>([]);
  const [isAsking, setIsAsking] = useState(false);

  const executeAsk = async (promptText: string) => {
    if (!promptText.trim() || isAsking) return;
    setIsAsking(true);

    try {
      const data = await api.sendGroundedChat(jobId, promptText);
      setChatHistory((prev) => [...prev, { q: promptText, a: data.answer }]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { q: promptText, a: "Could not retrieve answer grounded in verified facts." },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    setQuestion("");
    await executeAsk(q);
  };

  const handleQuickPrompt = (promptText: string) => {
    setQuestion("");
    executeAsk(promptText);
  };

  const getCategoryColor = (cat: string) => {
    const key = cat.toLowerCase().trim();
    return CATEGORY_STYLES[key] || "bg-neutral-800 text-neutral-300 border-neutral-700";
  };

  return (
    <div className="liquid-card rounded-2xl p-5 shadow-2xl flex flex-col gap-5">
      {/* Overview & Metadata */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Network className="h-5 w-5 text-cyan-400" />
          <h3 className="font-semibold text-zinc-100 text-base tracking-tight">Content Graph & Overview</h3>
        </div>

        <h4 className="text-sm font-bold text-zinc-100 mb-2 tracking-tight">{graph.title}</h4>
        <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3.5 rounded-xl border border-white/5">
          {graph.summary}
        </p>

        {/* Dimension Badges */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] font-mono">
          <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 border border-white/5 px-2.5 py-1 text-zinc-300">
            <Clock className="h-3 w-3 text-cyan-400" /> {graph.reading_time_minutes} min read
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 border border-white/5 px-2.5 py-1 text-zinc-300 capitalize">
            <Gauge className="h-3 w-3 text-amber-400" /> {graph.complexity_level}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 border border-white/5 px-2.5 py-1 text-zinc-300 capitalize">
            <Sparkles className="h-3 w-3 text-emerald-400" /> {graph.tone} tone
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 text-cyan-300 uppercase">
            {graph.language}
          </span>
        </div>
      </div>

      {/* Extracted Entities */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-2">
          <Tag className="h-3.5 w-3.5 text-zinc-500" /> Extracted Entities ({graph.entities.length})
        </div>
        <div className="flex flex-wrap gap-1.5">
          {graph.entities.map((e, idx) => (
            <span
              key={idx}
              title={e.description || e.category}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition hover:scale-105 select-none ${getCategoryColor(
                e.category
              )}`}
            >
              <span>{e.name}</span>
              <span className="text-[9px] opacity-70 font-mono">({e.category})</span>
            </span>
          ))}
        </div>
      </div>

      {/* Key Concepts */}
      {graph.concepts.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-2">
            <BookOpen className="h-3.5 w-3.5 text-zinc-500" /> Core Concepts
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {graph.concepts.map((c, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-white/5 bg-zinc-900/50 p-2.5 text-xs"
              >
                <div className="font-semibold text-zinc-200 mb-0.5">{c.name}</div>
                <p className="text-[11px] text-zinc-400 leading-snug">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grounded Q&A Assistant with Adaptive Quick Actions */}
      <div className="rounded-xl border border-white/5 bg-zinc-950/70 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-cyan-400" /> Grounded Q&A Assistant
          </span>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
            <CheckCircle2 className="h-2.5 w-2.5" /> 100% Fact-Checked Answers
          </span>
        </div>

        {/* Quick Action Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={isAsking}
            onClick={() => handleQuickPrompt("Explain this in simpler terms for a beginner.")}
            className="tactile-btn inline-flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-300 hover:border-cyan-500/40 hover:bg-zinc-800"
          >
            <Zap className="h-3 w-3 text-amber-400" /> Simpler
          </button>
          <button
            type="button"
            disabled={isAsking}
            onClick={() => handleQuickPrompt("Why should I care about this development? What is its real-world impact?")}
            className="tactile-btn inline-flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-300 hover:border-cyan-500/40 hover:bg-zinc-800"
          >
            <Target className="h-3 w-3 text-cyan-400" /> Why should I care?
          </button>
          <button
            type="button"
            disabled={isAsking}
            onClick={() => handleQuickPrompt("What are the key verified numbers and metrics reported?")}
            className="tactile-btn inline-flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-300 hover:border-cyan-500/40 hover:bg-zinc-800"
          >
            <Sparkles className="h-3 w-3 text-emerald-400" /> Key Metrics
          </button>
        </div>

        {/* Chat responses */}
        {chatHistory.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs scrollbar-thin">
            {chatHistory.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="font-medium text-indigo-300 text-[11px]">Q: {item.q}</div>
                <div className="text-neutral-300 bg-neutral-900 p-2 rounded-lg border border-neutral-800 text-[11px] leading-relaxed">
                  {item.a}
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAskQuestion} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about this verified content..."
            disabled={isAsking}
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isAsking || !question.trim()}
            className="flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition"
          >
            {isAsking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </form>
      </div>
    </div>
  );
};

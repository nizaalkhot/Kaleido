"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  TrendingDown,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  ShieldCheck,
  Zap
} from "lucide-react";
import { DropOffInsight } from "@/types";
import { api } from "@/services/api";

interface InsightsDrawerProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  backendBaseUrl?: string;
}

export const InsightsDrawer: React.FC<InsightsDrawerProps> = ({
  jobId,
  isOpen,
  onClose,
  backendBaseUrl = "http://localhost:8000",
}) => {
  const [insight, setInsight] = useState<DropOffInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedVariant, setOptimizedVariant] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && jobId) {
      setLoading(true);
      api.getJobInsights(jobId)
        .then((data) => setInsight(data))
        .catch((err) => console.warn("Failed to load insights:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, jobId]);

  const handleRegenerateVariant = async () => {
    if (!insight) return;
    setIsOptimizing(true);
    try {
      const data = await api.optimizeVariant(jobId, insight.high_drop_off_section);
      setOptimizedVariant(data.new_variant_text);
    } catch (err) {
      alert("Error regenerating variant.");
    } finally {
      setIsOptimizing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl space-y-6 scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                Audience Insights & Drop-Off Optimizer
              </h2>
              <p className="text-xs text-neutral-400">
                Closed-loop telemetry aggregated from BigQuery to diagnose and heal audience disengagement.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mx-auto" />
            <p className="text-xs text-neutral-400">Querying telemetry from BigQuery event store...</p>
          </div>
        ) : insight ? (
          <div className="space-y-5">
            {/* Retention Funnel Visualizer */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Reader Retention Funnel by Section
              </div>

              <div className="space-y-2">
                {/* Section 0 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-neutral-300">
                    <span>Section 0: Introduction</span>
                    <span className="font-mono text-emerald-400">100% Retained</span>
                  </div>
                  <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-full" />
                  </div>
                </div>

                {/* Section 1 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-neutral-300">
                    <span>Section 1: Core Methodology</span>
                    <span className="font-mono text-emerald-400">89% Retained</span>
                  </div>
                  <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[89%]" />
                  </div>
                </div>

                {/* Section 2 (Hotspot!) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-neutral-300">
                    <span className="text-rose-300 font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-rose-400" /> Section {insight.high_drop_off_section}: Technical Breakdown
                    </span>
                    <span className="font-mono text-rose-400 font-bold">
                      {insight.drop_off_rate_pct}% Drop-Off
                    </span>
                  </div>
                  <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${100 - insight.drop_off_rate_pct}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* InsightsAgent Diagnosis */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/15 p-4 space-y-2">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> InsightsAgent AI Diagnosis
              </div>
              <p className="text-xs text-neutral-200 leading-relaxed">
                {insight.diagnosis}
              </p>
            </div>

            {/* Suggested Rewrite Preview */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-indigo-400" /> Proposed Fact-Invariant Variant Rewrite
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <ShieldCheck className="h-3 w-3" /> Invariance Checked
                </span>
              </div>

              <blockquote className="rounded-lg border-l-2 border-indigo-500 bg-neutral-900/60 p-3 text-xs italic text-neutral-200 leading-relaxed">
                "{optimizedVariant || insight.recommended_rewrite}"
              </blockquote>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleRegenerateVariant}
                  disabled={isOptimizing}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 transition"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isOptimizing ? "animate-spin" : ""}`} />
                  <span>{optimizedVariant ? "Variant Applied & Regenerated" : "Regenerate Optimized Variant"}</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="rounded-xl bg-neutral-800 px-5 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition"
          >
            Close Insights
          </button>
        </div>
      </div>
    </div>
  );
};

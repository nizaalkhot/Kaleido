"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calculator,
  TrendingUp,
  DollarSign,
  Clock,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sliders,
  CheckCircle2
} from "lucide-react";
import { api } from "@/services/api";
import { ROICalculatorParams, ROICalculatorResult } from "@/types";

interface ROICalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPricing: () => void;
}

export function ROICalculatorModal({
  isOpen,
  onClose,
  onOpenPricing
}: ROICalculatorModalProps) {
  const [params, setParams] = useState<ROICalculatorParams>({
    articles_per_month: 40,
    manual_cost_per_article: 120,
    languages_count: 3,
    formats_count: 4,
    monthly_readers: 50000,
    estimated_cpm: 14.0
  });

  const [result, setResult] = useState<ROICalculatorResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsCalculating(true);
    api.calculateROI(params)
      .then((res) => setResult(res))
      .catch((err) => console.error("ROI calculation error:", err))
      .finally(() => setIsCalculating(false));
  }, [params, isOpen]);

  if (!isOpen) return null;

  const applyPreset = (preset: "creator" | "newsroom" | "edtech" | "global") => {
    if (preset === "creator") {
      setParams({
        articles_per_month: 15,
        manual_cost_per_article: 80,
        languages_count: 2,
        formats_count: 3,
        monthly_readers: 20000,
        estimated_cpm: 10.0
      });
    } else if (preset === "newsroom") {
      setParams({
        articles_per_month: 60,
        manual_cost_per_article: 140,
        languages_count: 3,
        formats_count: 4,
        monthly_readers: 85000,
        estimated_cpm: 16.0
      });
    } else if (preset === "edtech") {
      setParams({
        articles_per_month: 30,
        manual_cost_per_article: 200,
        languages_count: 4,
        formats_count: 4,
        monthly_readers: 45000,
        estimated_cpm: 12.0
      });
    } else if (preset === "global") {
      setParams({
        articles_per_month: 250,
        manual_cost_per_article: 180,
        languages_count: 7,
        formats_count: 4,
        monthly_readers: 400000,
        estimated_cpm: 22.0
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900/95 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-semibold">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>KALEIDO FINANCIAL ENGINE • VALUE REALIZATION</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Calculator className="h-6 w-6 text-emerald-400" />
              ROI & Revenue Generation Calculator
            </h2>
            <p className="text-xs text-zinc-400">
              Quantify your editorial cost reduction, hours saved, and new 70% sponsor ad revenue.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Archetype Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
            <Sliders className="h-3.5 w-3.5 text-cyan-400" /> Presets:
          </span>
          <button
            onClick={() => applyPreset("creator")}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/5 transition"
          >
            Indie Creator
          </button>
          <button
            onClick={() => applyPreset("newsroom")}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 transition"
          >
            Digital Newsroom
          </button>
          <button
            onClick={() => applyPreset("edtech")}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-950/40 text-amber-300 border border-amber-500/30 transition"
          >
            EdTech & Courseware
          </button>
          <button
            onClick={() => applyPreset("global")}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-950/40 text-purple-300 border border-purple-500/30 transition"
          >
            Global Publisher
          </button>
        </div>

        {/* 2-Column Split: Sliders vs Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 Cols): Inputs */}
          <div className="lg:col-span-5 rounded-xl border border-white/5 bg-zinc-950/60 p-4 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
              Publishing Parameters
            </h3>

            {/* Articles / Month */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Articles / Month</span>
                <span className="font-mono font-bold text-white">{params.articles_per_month}</span>
              </div>
              <input
                type="range"
                min="5"
                max="300"
                step="5"
                value={params.articles_per_month}
                onChange={(e) => setParams({ ...params, articles_per_month: parseInt(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Manual Cost / Article */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Manual Cost / Piece (Freelance/Editor)</span>
                <span className="font-mono font-bold text-white">${params.manual_cost_per_article}</span>
              </div>
              <input
                type="range"
                min="30"
                max="350"
                step="10"
                value={params.manual_cost_per_article}
                onChange={(e) => setParams({ ...params, manual_cost_per_article: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Languages */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Target Languages</span>
                <span className="font-mono font-bold text-cyan-300">{params.languages_count} Languages</span>
              </div>
              <input
                type="range"
                min="1"
                max="7"
                step="1"
                value={params.languages_count}
                onChange={(e) => setParams({ ...params, languages_count: parseInt(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Output Formats */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Concurrent Formats</span>
                <span className="font-mono font-bold text-white">{params.formats_count} (Audio, Quiz, Story, Brief)</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={params.formats_count}
                onChange={(e) => setParams({ ...params, formats_count: parseInt(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Monthly Readers */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Monthly Reader Audience</span>
                <span className="font-mono font-bold text-emerald-400">{params.monthly_readers.toLocaleString()} readers</span>
              </div>
              <input
                type="range"
                min="5000"
                max="300000"
                step="5000"
                value={params.monthly_readers}
                onChange={(e) => setParams({ ...params, monthly_readers: parseInt(e.target.value) })}
                className="w-full accent-emerald-400"
              />
            </div>

            {/* Estimated CPM */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Sponsor Ad CPM</span>
                <span className="font-mono font-bold text-amber-300">${params.estimated_cpm.toFixed(2)} CPM</span>
              </div>
              <input
                type="range"
                min="6"
                max="30"
                step="1"
                value={params.estimated_cpm}
                onChange={(e) => setParams({ ...params, estimated_cpm: parseFloat(e.target.value) })}
                className="w-full accent-amber-400"
              />
            </div>
          </div>

          {/* Right Column (7 Cols): Dynamic ROI Results */}
          <div className="lg:col-span-7 space-y-4">
            {result && (
              <>
                {/* Primary Hero Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-1">
                    <div className="text-[11px] font-mono text-emerald-400 uppercase font-semibold">
                      Annual Cost Savings
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                      ${result.annual_cost_savings.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-400/80">
                      vs human copywriters & audio producers
                    </div>
                  </div>

                  <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 space-y-1">
                    <div className="text-[11px] font-mono text-cyan-400 uppercase font-semibold">
                      Net Monthly ROI
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono">
                      +{result.roi_percentage.toLocaleString()}%
                    </div>
                    <div className="text-[10px] text-cyan-400/80">
                      Breakeven in {result.break_even_days} {result.break_even_days === 1 ? "day" : "days"}
                    </div>
                  </div>
                </div>

                {/* Secondary Breakdown Rows */}
                <div className="rounded-xl border border-white/5 bg-zinc-950/80 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                    <span className="text-zinc-400">Manual Monthly Production:</span>
                    <span className="font-mono font-bold text-rose-400">${result.manual_monthly_cost.toLocaleString()}/mo</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                    <span className="text-zinc-400">Kaleido Automated Pipeline Cost:</span>
                    <span className="font-mono font-bold text-emerald-400">${result.kaleido_monthly_cost.toLocaleString()}/mo</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-cyan-400" /> Editorial Hours Saved:
                    </span>
                    <span className="font-mono font-bold text-cyan-300">{result.time_saved_hours_monthly.toLocaleString()} hrs/mo</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" /> New Sponsor Ad Revenue (70%):
                    </span>
                    <span className="font-mono font-bold text-amber-300">+${result.estimated_sponsor_revenue_monthly.toLocaleString()}/mo</span>
                  </div>
                </div>

                {/* Bottom Total Economic Impact Callout */}
                <div className="rounded-xl border border-white/10 bg-gradient-to-r from-emerald-950/30 to-cyan-950/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">
                      Net Monthly Value Created: <span className="font-mono text-emerald-400 font-bold text-sm">${result.net_monthly_gain.toLocaleString()}/mo</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Savings + verified publisher ad revenue
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenPricing();
                    }}
                    className="tactile-btn shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-400 text-zinc-950 font-bold text-xs hover:bg-cyan-300 transition"
                  >
                    <span>View Subscription Plans</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

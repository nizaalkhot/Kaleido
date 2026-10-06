"use client";

import React, { useState } from "react";
import {
  X,
  Code,
  Copy,
  Check,
  CreditCard,
  TrendingUp,
  Globe,
  Radio,
  ExternalLink
} from "lucide-react";
import { PublisherMetrics } from "@/types";

interface EmbedSandboxModalProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  backendBaseUrl?: string;
}

export const EmbedSandboxModal: React.FC<EmbedSandboxModalProps> = ({
  jobId,
  isOpen,
  onClose,
  backendBaseUrl = "http://localhost:8000",
}) => {
  const [copied, setCopied] = useState(false);
  const snippet = `<script src="${backendBaseUrl}/embed.js" data-kaleido="${jobId || 'sample_job'}"></script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950/95 p-6 shadow-2xl space-y-6 scrollbar-thin text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Code className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
                Publisher Embed Widget & Credit Metering
              </h2>
              <p className="text-xs text-zinc-400">
                1-line distribution snippet for media publishers and edtech LMS portals.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 tactile-btn transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 1-Line Embed Code Box */}
        <div className="liquid-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-300">
            <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-wider">Embed Snippet</span>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-xs font-mono font-medium tactile-btn"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy Snippet"}</span>
            </button>
          </div>
          <pre className="overflow-x-auto rounded-xl bg-black/70 p-3 text-xs font-mono text-zinc-300 border border-white/5">
            {snippet}
          </pre>
        </div>

        {/* Live Publisher News Site Mockup Preview */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-cyan-400" /> Live Simulation: The Daily Global Chronicle
          </div>

          <div className="liquid-card p-6 space-y-4">
            <div className="border-b border-white/5 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">TECH DESK • 4 MIN READ</span>
                <h3 className="text-sm font-semibold text-zinc-100 mt-1">
                  How Neutral-Atom Arrays Unlocked Fault-Tolerant Quantum Scale
                </h3>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Earlier today, experimental physicists achieved logical qubit error suppression by a decisive 12x factor, surpassing fault-tolerant surface code thresholds...
            </p>

            {/* Embedded Kaleido Widget */}
            <div className="rounded-2xl border border-cyan-500/30 bg-zinc-900/80 p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[11px] font-mono tracking-wider text-cyan-300 uppercase">KALEIDO VERIFIED BRIEFING</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                  INVARIANT 100%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 text-black shadow-md shadow-cyan-500/20">
                  <Radio className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-100">Listen: Multi-Speaker Brief (2 min)</div>
                  <div className="text-[11px] text-zinc-400">Host & Analyst dialogue • Google Cloud Neural2 audio</div>
                </div>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              The announcement marks a crucial turning point for enterprise quantum readiness, paving the way for molecular discovery beta testing...
            </p>
          </div>
        </div>

        {/* Publisher Usage Metering & Economics Panel */}
        <div className="space-y-3 border-t border-white/5 pt-4">
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-cyan-400" /> Usage Metering & Unit Economics
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="liquid-card p-3">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Monthly Readers</div>
              <div className="font-mono text-base font-semibold text-zinc-100 mt-1">14,280</div>
            </div>
            <div className="liquid-card p-3">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Completion Rate</div>
              <div className="font-mono text-base font-semibold text-emerald-400 mt-1">78.4%</div>
            </div>
            <div className="liquid-card p-3">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Credits Used</div>
              <div className="font-mono text-base font-semibold text-cyan-400 mt-1">340 / 500</div>
            </div>
            <div className="liquid-card p-3">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Cost Savings</div>
              <div className="font-mono text-base font-semibold text-amber-400 mt-1">$4,200/mo</div>
            </div>
          </div>

          <div className="liquid-card p-3 text-[11px] font-mono text-zinc-400 flex flex-col sm:flex-row justify-between gap-2">
            <span>• Text & Content Graph: <strong className="text-zinc-200">$0.002 / render</strong></span>
            <span>• Multi-Speaker Audio (Cloud TTS): <strong className="text-zinc-200">$0.016 / render</strong></span>
            <span>• Veo Generative Video: <strong className="text-zinc-200">$0.40 / sec (On-Demand)</strong></span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-white/5">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-zinc-900 px-5 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800 tactile-btn transition-colors"
          >
            Close Sandbox
          </button>
        </div>
      </div>
    </div>
  );
};

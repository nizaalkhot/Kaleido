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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl space-y-6 scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Code className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                Publisher Embed Widget & Credit Metering
              </h2>
              <p className="text-xs text-neutral-400">
                1-line distribution snippet for media publishers and edtech LMS portals.
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

        {/* 1-Line Embed Code Box */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
            <span>One-Line Embed Snippet</span>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-xs font-medium"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied!" : "Copy Code"}</span>
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-neutral-900/90 p-3 text-xs font-mono text-neutral-200 border border-neutral-800">
            {snippet}
          </pre>
        </div>

        {/* Live Publisher News Site Mockup Preview */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-sky-400" /> Live Mockup: The Daily Global Chronicle
          </div>

          <div className="rounded-xl border border-neutral-700/80 bg-neutral-950 p-6 space-y-4">
            <div className="border-b border-neutral-800 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">TECH DESK • 4 MIN READ</span>
                <h3 className="text-base font-bold text-neutral-100 mt-1">
                  How Neutral-Atom Arrays Unlocked Fault-Tolerant Quantum Scale
                </h3>
              </div>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Earlier today, experimental physicists achieved logical qubit error suppression by a decisive 12x factor, surpassing fault-tolerant surface code thresholds...
            </p>

            {/* Embedded Kaleido Widget */}
            <div className="rounded-xl border border-indigo-500/40 bg-neutral-900/90 p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-xs font-bold tracking-wider text-indigo-300">KALEIDO VERIFIED BRIEFING</span>
                </div>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  ✓ 100% Invariant
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                  <Radio className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-100">Listen: Multi-Speaker Brief (2 min)</div>
                  <div className="text-[11px] text-neutral-400">Host & Analyst dialogue • Google Cloud Neural2 voices</div>
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              The announcement marks a crucial turning point for enterprise quantum readiness, paving the way for molecular discovery beta testing...
            </p>
          </div>
        </div>

        {/* Publisher Usage Metering & Economics Panel */}
        <div className="space-y-3 border-t border-neutral-800 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-indigo-400" /> Usage Metering & Unit Economics (Section 3 of PLAN.md)
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3">
              <div className="text-[10px] uppercase font-bold text-neutral-500">Monthly Readers</div>
              <div className="font-mono text-base font-bold text-neutral-100 mt-1">14,280</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3">
              <div className="text-[10px] uppercase font-bold text-neutral-500">Completion Rate</div>
              <div className="font-mono text-base font-bold text-emerald-400 mt-1">78.4%</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3">
              <div className="text-[10px] uppercase font-bold text-neutral-500">Credits Used</div>
              <div className="font-mono text-base font-bold text-indigo-400 mt-1">340 / 500</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3">
              <div className="text-[10px] uppercase font-bold text-neutral-500">Cost Savings</div>
              <div className="font-mono text-base font-bold text-amber-400 mt-1">$4,200/mo</div>
            </div>
          </div>

          <div className="rounded-xl bg-neutral-950/40 p-3 border border-neutral-800 text-[11px] text-neutral-400 flex flex-col sm:flex-row justify-between gap-2">
            <span>• Text & Content Graph: <strong>$0.002 / render</strong></span>
            <span>• Multi-Speaker Audio (Cloud TTS): <strong>$0.016 / render</strong></span>
            <span>• Veo Generative Video: <strong>$0.40 / sec (On-Demand)</strong></span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="rounded-xl bg-neutral-800 px-5 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition"
          >
            Close Sandbox
          </button>
        </div>
      </div>
    </div>
  );
};

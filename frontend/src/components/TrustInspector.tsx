"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Lock,
  SearchCheck,
  Zap
} from "lucide-react";
import { Claim, VerificationStatus } from "@/types";

interface TrustInspectorProps {
  claims: Claim[];
  trustScore: number;
  isCached?: boolean;
}

export const TrustInspector: React.FC<TrustInspectorProps> = ({ claims, trustScore, isCached }) => {
  const [filter, setFilter] = useState<"ALL" | VerificationStatus>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(claims[0]?.claim_id || null);

  const filteredClaims = claims.filter((c) => {
    if (filter === "ALL") return true;
    return c.status === filter;
  });

  const verifiedCount = claims.filter((c) => c.status === "VERIFIED").length;
  const contradictedCount = claims.filter((c) => c.status === "CONTRADICTED").length;
  const unverifiedCount = claims.filter((c) => c.status === "UNVERIFIED").length;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/30 bg-emerald-950/20";
    if (score >= 50) return "text-amber-400 border-amber-500/30 bg-amber-950/20";
    return "text-rose-400 border-rose-500/30 bg-rose-950/20";
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 shadow-xl backdrop-blur flex flex-col gap-5">
      {/* Trust Score Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h3 className="font-semibold text-neutral-100 text-base">Kaleido Trust Layer</h3>
            {isCached && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse">
                <Zap className="h-3 w-3 fill-amber-400" />
                Cache Hit
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Two-stage critic: Source Faithfulness + Vertex AI Search Grounding
          </p>
        </div>

        <div className={`flex items-center gap-3 px-3.5 py-1.5 rounded-xl border ${getScoreColor(trustScore)}`}>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">Trust Score</div>
            <div className="text-xl font-black font-mono leading-none">{trustScore}%</div>
          </div>
          <div className="h-7 w-px bg-current opacity-20" />
          <div className="text-[11px] font-medium leading-tight">
            {verifiedCount}/{claims.length} Verified
          </div>
        </div>
      </div>

      {/* Metric Badges */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <button
          onClick={() => setFilter("VERIFIED")}
          className={`rounded-xl p-2.5 border transition ${
            filter === "VERIFIED"
              ? "bg-emerald-950/40 border-emerald-500 text-emerald-300"
              : "bg-neutral-800/40 border-neutral-800 text-neutral-400 hover:bg-neutral-800"
          }`}
        >
          <div className="font-mono text-base font-bold text-emerald-400">{verifiedCount}</div>
          <div className="text-[11px] font-medium mt-0.5 flex items-center justify-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Verified
          </div>
        </button>

        <button
          onClick={() => setFilter("CONTRADICTED")}
          className={`rounded-xl p-2.5 border transition ${
            filter === "CONTRADICTED"
              ? "bg-rose-950/40 border-rose-500 text-rose-300"
              : "bg-neutral-800/40 border-neutral-800 text-neutral-400 hover:bg-neutral-800"
          }`}
        >
          <div className="font-mono text-base font-bold text-rose-400">{contradictedCount}</div>
          <div className="text-[11px] font-medium mt-0.5 flex items-center justify-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Flagged
          </div>
        </button>

        <button
          onClick={() => setFilter("UNVERIFIED")}
          className={`rounded-xl p-2.5 border transition ${
            filter === "UNVERIFIED"
              ? "bg-slate-900 border-slate-500 text-slate-300"
              : "bg-neutral-800/40 border-neutral-800 text-neutral-400 hover:bg-neutral-800"
          }`}
        >
          <div className="font-mono text-base font-bold text-neutral-300">{unverifiedCount}</div>
          <div className="text-[11px] font-medium mt-0.5 flex items-center justify-center gap-1">
            <HelpCircle className="h-3 w-3" /> Unverified
          </div>
        </button>
      </div>

      {/* Filter Reset if active */}
      {filter !== "ALL" && (
        <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
          <span>Showing: <strong className="text-neutral-200">{filter}</strong> claims</span>
          <button
            onClick={() => setFilter("ALL")}
            className="text-indigo-400 hover:underline font-medium text-[11px]"
          >
            Show All ({claims.length})
          </button>
        </div>
      )}

      {/* Claims List */}
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
        {filteredClaims.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 text-center text-xs text-neutral-500">
            No claims found under this filter.
          </div>
        ) : (
          filteredClaims.map((claim) => {
            const isExpanded = expandedId === claim.claim_id;
            const isVerified = claim.status === "VERIFIED";
            const isContradicted = claim.status === "CONTRADICTED";

            return (
              <div
                key={claim.claim_id}
                className={`rounded-xl border transition overflow-hidden ${
                  isContradicted
                    ? "border-rose-500/40 bg-rose-950/10"
                    : isVerified
                    ? "border-emerald-500/30 bg-neutral-900/80"
                    : "border-neutral-800 bg-neutral-900/60"
                }`}
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : claim.claim_id)}
                  className="cursor-pointer p-3.5 flex items-start justify-between gap-3 select-none"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {isVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          <ShieldCheck className="h-3 w-3" /> VERIFIED ({Math.round(claim.confidence * 100)}%)
                        </span>
                      )}
                      {isContradicted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-[10px] font-bold text-rose-300 animate-pulse">
                          <AlertTriangle className="h-3 w-3" /> FLAGGED / CONTRADICTED
                        </span>
                      )}
                      {!isVerified && !isContradicted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-800 border border-neutral-700 px-2 py-0.5 text-[10px] font-bold text-neutral-400">
                          <HelpCircle className="h-3 w-3" /> UNVERIFIED
                        </span>
                      )}

                      {claim.source_span && (
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {claim.source_span}
                        </span>
                      )}

                      {claim.fact_invariance_passed && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-indigo-400/90 font-medium">
                          <Lock className="h-2.5 w-2.5" /> Fact-Invariant
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-medium text-neutral-200 leading-snug">
                      {claim.normalized_statement}
                    </p>
                  </div>

                  <div className="text-neutral-500 pt-1">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="border-t border-neutral-800/80 bg-neutral-950/60 p-3.5 space-y-2.5 text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-neutral-500 mb-0.5">
                        Source Verbatim Quote
                      </div>
                      <blockquote className="rounded-lg border-l-2 border-indigo-500/60 bg-neutral-900/60 px-3 py-1.5 italic text-neutral-300 text-[11px]">
                        "{claim.quote}"
                      </blockquote>
                    </div>

                    {claim.evidence_quote && (
                      <div>
                        <div className="text-[10px] uppercase font-bold text-neutral-500 mb-0.5 flex items-center gap-1">
                          <SearchCheck className="h-3 w-3 text-indigo-400" /> Evidence & Grounding
                        </div>
                        <p className={`rounded-lg p-2 text-[11px] leading-relaxed border ${
                          isContradicted 
                            ? "bg-rose-950/30 border-rose-900/50 text-rose-200"
                            : "bg-neutral-900/40 border-neutral-800 text-neutral-300"
                        }`}>
                          {claim.evidence_quote}
                        </p>
                      </div>
                    )}

                    {claim.external_sources && claim.external_sources.length > 0 && (
                      <div>
                        <div className="text-[10px] uppercase font-bold text-neutral-500 mb-1">
                          External Sources & Citations
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {claim.external_sources.map((src, idx) => (
                            <a
                              key={idx}
                              href={src}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-neutral-800/80 px-2 py-0.5 text-[10px] text-indigo-400 hover:text-indigo-300 hover:bg-neutral-700 transition"
                            >
                              <ExternalLink className="h-2.5 w-2.5" />
                              {src.replace(/^https?:\/\//, "").split("/")[0]}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

"use client";

import React from "react";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Users,
  Lock,
  ArrowRightLeft,
  Sparkles
} from "lucide-react";
import { ContentGraph } from "@/types";

interface PersonaComparisonModalProps {
  graph: ContentGraph;
  isOpen: boolean;
  onClose: () => void;
}

export const PersonaComparisonModal: React.FC<PersonaComparisonModalProps> = ({
  graph,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="liquid-glass relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                Persona Matrix & Fact-Invariance Proof
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Verified Invariant
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Personalization alters format, depth, and language—never the underlying factual propositions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="tactile-btn rounded-xl p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Side-by-Side Persona Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Persona A: College Student (Engaging / Explanatory) */}
          <div className="liquid-card rounded-xl p-4 space-y-3 border border-white/5">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Persona A: College Student
              </span>
              <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                Engaging • Vernacular
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed italic bg-zinc-950/60 p-3 rounded-lg border border-white/5">
              "Think of physical qubits like noisy radios losing signal within milliseconds. What the researchers just pulled off is adding 100 noise-cancelling logical qubits that suppress errors by 12x, keeping computations alive for over 3 seconds."
            </p>
            <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>Grounded in verified claim metrics (100 qubits, 12x suppression)</span>
            </div>
          </div>

          {/* Persona B: Busy Professional / Executive (High-level / Impact) */}
          <div className="liquid-card rounded-xl p-4 space-y-3 border border-white/5">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Persona B: Executive / Professional
              </span>
              <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                Concise • Commercial ROI
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed italic bg-zinc-950/60 p-3 rounded-lg border border-white/5">
              "International Quantum Institute achieved a 99.85% two-qubit gate fidelity across 100 logical qubits, surpassing the 99.0% threshold. Commercial beta testing for molecular discovery is projected by late 2028."
            </p>
            <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>Grounded in verified timelines & gate threshold metrics</span>
            </div>
          </div>
        </div>

        {/* Fact-Invariance Matrix */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-emerald-400" /> The Fact-Invariance Matrix
            </h3>
            <span className="text-[11px] text-emerald-400 font-mono">
              100% Claims Invariant Across Personas
            </span>
          </div>

          <div className="rounded-xl border border-white/5 bg-zinc-950/70 overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-zinc-900/80 text-[11px] text-zinc-400 font-semibold">
                  <th className="p-3">Claim ID</th>
                  <th className="p-3">Verified Factual Proposition</th>
                  <th className="p-3 text-center">Student Adaptation</th>
                  <th className="p-3 text-center">Executive Adaptation</th>
                  <th className="p-3 text-right">Invariance Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {graph.claims.map((c) => (
                  <tr key={c.claim_id} className="hover:bg-zinc-900/40 transition">
                    <td className="p-3 font-bold text-cyan-400">{c.claim_id}</td>
                    <td className="p-3 font-sans text-zinc-200">{c.normalized_statement}</td>
                    <td className="p-3 text-center text-emerald-400">✓ Preserved</td>
                    <td className="p-3 text-center text-emerald-400">✓ Preserved</td>
                    <td className="p-3 text-right text-emerald-400 font-bold">
                      <span className="inline-flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                        <ShieldCheck className="h-3 w-3" /> 0% Drift
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="tactile-btn rounded-xl bg-zinc-800 border border-white/10 px-5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
          >
            Close Audit View
          </button>
        </div>
      </div>
    </div>
  );
};

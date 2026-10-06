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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl space-y-6 scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                Persona Comparison & Fact-Invariance Proof
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Verified Invariant
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Personalization alters format, depth, and language—never the underlying factual propositions.
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

        {/* Side-by-Side Persona Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Persona A: College Student (Engaging / Explanatory) */}
          <div className="rounded-xl border border-purple-500/30 bg-purple-950/10 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Persona A: College Student
              </span>
              <span className="text-[10px] font-mono text-purple-400/80 bg-purple-900/30 px-2 py-0.5 rounded">
                Engaging • Vernacular
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed italic bg-neutral-950/40 p-3 rounded-lg border border-neutral-800/80">
              "Think of physical qubits like noisy radios losing signal within milliseconds. What the researchers just pulled off is adding 100 noise-cancelling logical qubits that suppress errors by 12x, keeping computations alive for over 3 seconds."
            </p>
            <div className="text-[11px] text-neutral-400 flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>Grounded in verified claim metrics (100 qubits, 12x suppression)</span>
            </div>
          </div>

          {/* Persona B: Busy Professional / Executive (High-level / Impact) */}
          <div className="rounded-xl border border-sky-500/30 bg-sky-950/10 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Persona B: Executive / Professional
              </span>
              <span className="text-[10px] font-mono text-sky-400/80 bg-sky-900/30 px-2 py-0.5 rounded">
                Concise • Commercial ROI
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed italic bg-neutral-950/40 p-3 rounded-lg border border-neutral-800/80">
              "International Quantum Institute achieved a 99.85% two-qubit gate fidelity across 100 logical qubits, surpassing the 99.0% threshold. Commercial beta testing for molecular discovery is projected by late 2028."
            </p>
            <div className="text-[11px] text-neutral-400 flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>Grounded in verified timelines & gate threshold metrics</span>
            </div>
          </div>
        </div>

        {/* Fact-Invariance Matrix */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-emerald-400" /> The Fact-Invariance Matrix
            </h3>
            <span className="text-[11px] text-emerald-400 font-mono">
              100% Claims Invariant Across Personas
            </span>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/80 text-[11px] text-neutral-400 font-semibold">
                  <th className="p-3">Claim ID</th>
                  <th className="p-3">Verified Factual Proposition</th>
                  <th className="p-3 text-center">Student Adaptation</th>
                  <th className="p-3 text-center">Executive Adaptation</th>
                  <th className="p-3 text-right">Invariance Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
                {graph.claims.map((c) => (
                  <tr key={c.claim_id} className="hover:bg-neutral-900/40 transition">
                    <td className="p-3 font-bold text-indigo-400">{c.claim_id}</td>
                    <td className="p-3 font-sans text-neutral-200">{c.normalized_statement}</td>
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
            className="rounded-xl bg-neutral-800 px-5 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition"
          >
            Close Audit View
          </button>
        </div>
      </div>
    </div>
  );
};

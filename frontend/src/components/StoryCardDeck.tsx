"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Quote,
  Layers,
  CheckCircle2
} from "lucide-react";
import { StoryDeck } from "@/types";
import { api } from "@/services/api";

interface StoryCardDeckProps {
  storyDeck: StoryDeck;
  jobId: string;
  backendBaseUrl?: string;
}

export const StoryCardDeck: React.FC<StoryCardDeckProps> = ({
  storyDeck,
  jobId,
  backendBaseUrl = "http://localhost:8000",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cards = storyDeck.cards;
  const currentCard = cards[currentIndex];

  const nextCard = () => {
    if (currentIndex + 1 < cards.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      // Fire engagement telemetry via centralized API service
      api.recordEvent({
        job_id: jobId,
        format_type: "story",
        section_index: nextIdx,
        time_spent_ms: 4000,
        completed: nextIdx === cards.length - 1,
        dropped_off: false,
      }).catch(() => {});
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  if (!cards || cards.length === 0) return null;

  return (
    <div className="liquid-card rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100 text-sm tracking-tight">{storyDeck.title}</h3>
            <span className="text-[10px] text-zinc-400 font-mono">
              Card {currentIndex + 1} of {cards.length}
            </span>
          </div>
        </div>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {cards.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentIndex ? "w-5 bg-cyan-400" : "w-1.5 bg-zinc-700 hover:bg-zinc-600"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Active Card Body */}
      <div className="relative rounded-xl border border-white/5 bg-zinc-900/50 p-5 space-y-3 min-h-[220px] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              {currentCard.category}
            </span>
            <span className="text-xs font-semibold text-zinc-400">{currentCard.title}</span>
          </div>

          <h4 className="text-base font-bold text-zinc-100 leading-snug mb-2">
            {currentCard.headline}
          </h4>

          <p className="text-xs text-zinc-300 leading-relaxed">
            {currentCard.key_takeaway}
          </p>
        </div>

        {/* Statistic / Metric Highlight or Quote */}
        {currentCard.statistic_or_metric && (
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 p-2.5 mt-2">
            <TrendingUp className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono font-semibold">Key Metric</div>
              <div className="text-sm font-extrabold font-mono text-emerald-300">
                {currentCard.statistic_or_metric}
              </div>
            </div>
          </div>
        )}

        {currentCard.source_quote && !currentCard.statistic_or_metric && (
          <div className="flex items-start gap-2 text-[11px] text-zinc-400 italic bg-zinc-950/60 p-2.5 rounded-xl border border-white/5">
            <Quote className="h-3.5 w-3.5 text-zinc-500 shrink-0 mt-0.5" />
            <span>"{currentCard.source_quote}"</span>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={prevCard}
          disabled={currentIndex === 0}
          className="tactile-btn flex items-center gap-1 rounded-xl border border-white/10 bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Previous
        </button>

        <span className="text-[10px] text-zinc-500 font-mono">
          Interactive Story Deck
        </span>

        <button
          onClick={nextCard}
          disabled={currentIndex === cards.length - 1}
          className="tactile-btn flex items-center gap-1 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-40"
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

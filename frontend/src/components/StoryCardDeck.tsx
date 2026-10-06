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
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 shadow-xl backdrop-blur space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/25">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-100 text-sm">{storyDeck.title}</h3>
            <span className="text-[11px] text-neutral-400">
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
                idx === currentIndex ? "w-5 bg-indigo-500" : "w-1.5 bg-neutral-700"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Active Card Body */}
      <div className="relative rounded-xl border border-neutral-800 bg-neutral-950/70 p-5 space-y-3 min-h-[220px] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
              {currentCard.category}
            </span>
            <span className="text-xs font-semibold text-neutral-400">{currentCard.title}</span>
          </div>

          <h4 className="text-base font-bold text-neutral-100 leading-snug mb-2">
            {currentCard.headline}
          </h4>

          <p className="text-xs text-neutral-300 leading-relaxed">
            {currentCard.key_takeaway}
          </p>
        </div>

        {/* Statistic / Metric Highlight or Quote */}
        {currentCard.statistic_or_metric && (
          <div className="flex items-center gap-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/30 p-2.5 mt-2">
            <TrendingUp className="h-5 w-5 text-indigo-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">Key Metric</div>
              <div className="text-sm font-extrabold font-mono text-indigo-200">
                {currentCard.statistic_or_metric}
              </div>
            </div>
          </div>
        )}

        {currentCard.source_quote && !currentCard.statistic_or_metric && (
          <div className="flex items-start gap-2 text-[11px] text-neutral-400 italic bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800">
            <Quote className="h-3.5 w-3.5 text-neutral-500 shrink-0 mt-0.5" />
            <span>"{currentCard.source_quote}"</span>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={prevCard}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-800/60 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800 disabled:opacity-40 transition"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Previous
        </button>

        <span className="text-[11px] text-neutral-500 font-mono">
          Swipe or Click Next
        </span>

        <button
          onClick={nextCard}
          disabled={currentIndex === cards.length - 1}
          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 transition shadow"
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

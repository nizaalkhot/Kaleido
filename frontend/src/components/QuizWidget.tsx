"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { Quiz } from "@/types";
import { api } from "@/services/api";

interface QuizWidgetProps {
  quiz: Quiz;
  jobId: string;
  backendBaseUrl?: string;
}

export const QuizWidget: React.FC<QuizWidgetProps> = ({
  quiz,
  jobId,
  backendBaseUrl = "http://localhost:8000",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = quiz.questions[currentIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentQ.correct_index;
    if (isCorrect) {
      setScore((s) => s + 1);
    }

    // Fire telemetry event via centralized API service
    api.recordEvent({
      job_id: jobId,
      persona: quiz.target_persona,
      language: quiz.language,
      format_type: "quiz",
      section_index: currentIndex,
      time_spent_ms: 3200,
      completed: isCorrect,
      dropped_off: false,
    }).catch(() => {});
  };

  const handleNext = () => {
    if (currentIndex + 1 < quiz.questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  if (isFinished) {
    const pct = Math.round((score / quiz.questions.length) * 100);
    return (
      <div className="liquid-card rounded-2xl p-6 shadow-2xl text-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto border border-cyan-500/20">
          <Award className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-bold text-zinc-100 text-lg tracking-tight">Comprehension Mastered</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Grounded comprehension verified against certified source claims.
          </p>
        </div>
        <div className="font-mono text-3xl font-extrabold text-cyan-300">
          {score} / {quiz.questions.length} <span className="text-lg font-normal text-zinc-500">({pct}%)</span>
        </div>
        <button
          onClick={resetQuiz}
          className="tactile-btn inline-flex items-center gap-2 rounded-xl bg-zinc-800 border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Retake Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="liquid-card rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <HelpCircle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100 text-sm tracking-tight">{quiz.title}</h3>
            <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">
              {quiz.target_persona} Persona • Q{currentIndex + 1} of {quiz.questions.length}
            </span>
          </div>
        </div>

        <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-zinc-800/80 border border-white/5 text-zinc-300">
          Score: {score}/{currentIndex + (isAnswered ? 1 : 0)}
        </span>
      </div>

      {/* Question */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-zinc-100 leading-snug">
          {currentQ.question}
        </h4>

        {/* Options */}
        <div className="space-y-2">
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQ.correct_index;

            let btnStyle = "border-white/5 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:border-white/10";
            if (isAnswered) {
              if (isCorrect) {
                btnStyle = "border-emerald-500/40 bg-emerald-950/30 text-emerald-200 ring-1 ring-emerald-500/30";
              } else if (isSelected) {
                btnStyle = "border-rose-500/40 bg-rose-950/30 text-rose-200";
              } else {
                btnStyle = "border-white/5 bg-zinc-950/40 text-zinc-600";
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`tactile-btn w-full text-left p-3 rounded-xl border text-xs font-medium transition flex items-center justify-between gap-3 ${btnStyle}`}
              >
                <span>{option}</span>
                {isAnswered && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-rose-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation & Citation */}
      {isAnswered && (
        <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" /> Explanation
            </span>
            {currentQ.citation_claim_id && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                <ShieldCheck className="h-2.5 w-2.5" /> Cited from {currentQ.citation_claim_id}
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            {currentQ.explanation}
          </p>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleNext}
              className="tactile-btn inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-cyan-300 shadow-[0_0_16px_rgba(6,182,212,0.25)]"
            >
              <span>{currentIndex + 1 < quiz.questions.length ? "Next Question" : "See Results"}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

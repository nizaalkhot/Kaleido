"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  Building,
  Radio,
  Layers,
  ArrowRight
} from "lucide-react";
import { api } from "@/services/api";
import { PlanDefinition, PlanTier } from "@/types";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: PlanTier;
  onPlanUpdated?: (newTier: PlanTier) => void;
}

export function PricingModal({
  isOpen,
  onClose,
  currentTier = "professional",
  onPlanUpdated
}: PricingModalProps) {
  const [plans, setPlans] = useState<Record<string, PlanDefinition>>({});
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    api.getPlans()
      .then((data) => setPlans(data))
      .catch((err) => console.error("Error loading plans:", err));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPlan = async (tier: PlanTier) => {
    if (tier === currentTier) return;
    setLoadingTier(tier);
    try {
      await api.checkoutPlan(tier, billingCycle);
      setUpgradeSuccess(`Successfully upgraded to ${tier.toUpperCase()} tier!`);
      if (onPlanUpdated) onPlanUpdated(tier);
      setTimeout(() => {
        setUpgradeSuccess(null);
        onClose();
      }, 1400);
    } catch (err: any) {
      alert(`Upgrade failed: ${err.message}`);
    } finally {
      setLoadingTier(null);
    }
  };

  const tierKeys: PlanTier[] = ["free", "starter", "professional", "enterprise"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-6xl max-h-[94vh] overflow-y-auto rounded-3xl border border-white/10 bg-zinc-900/95 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-mono font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>SUBSCRIPTION TIERS & SCALE ARCHITECTURE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Predictable, High-ROI Publishing Plans
            </h2>
            <p className="text-xs text-zinc-400">
              Transform raw journalism into 4 certified formats across 7 languages with 100% invariant verification.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Upgrade Toast */}
        {upgradeSuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in">
            <Check className="h-4 w-4" />
            <span>{upgradeSuccess}</span>
          </div>
        )}

        {/* Billing Cycle Switcher */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center bg-zinc-950 border border-white/5 rounded-xl p-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                billingCycle === "monthly"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                billingCycle === "annual"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 4-Tier Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {tierKeys.map((t) => {
            const plan = plans[t];
            const isCurrent = currentTier === t;
            const isPopular = t === "professional";

            if (!plan) return null;

            const monthlyPrice = billingCycle === "monthly"
              ? plan.price_monthly_usd
              : (plan.price_annual_usd / 12);

            return (
              <div
                key={t}
                className={`relative flex flex-col justify-between rounded-2xl p-5 border transition ${
                  isPopular
                    ? "border-cyan-500/50 bg-gradient-to-b from-cyan-950/20 via-zinc-900 to-zinc-900 shadow-[0_0_24px_rgba(6,182,212,0.15)]"
                    : "border-white/5 bg-zinc-950/60 hover:border-white/10"
                }`}
              >
                {/* Popular Pill */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-cyan-400 text-zinc-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                    Most Popular • 70% Ad Share
                  </div>
                )}

                <div className="space-y-4">
                  {/* Plan Name & Tag */}
                  <div>
                    <h3 className="font-bold text-sm text-white">{plan.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white font-mono">
                        ${monthlyPrice.toFixed(0)}
                      </span>
                      <span className="text-xs text-zinc-400">/month</span>
                    </div>
                    {billingCycle === "annual" && plan.price_annual_usd > 0 && (
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        ${plan.price_annual_usd}/year billed annually
                      </div>
                    )}
                  </div>

                  {/* Credits Callout */}
                  <div className="rounded-xl border border-white/5 bg-zinc-900 p-2.5 text-center">
                    <div className="text-[10px] font-mono text-zinc-400 uppercase">Monthly Capacity</div>
                    <div className="text-sm font-bold font-mono text-cyan-300">
                      {plan.monthly_credits.toLocaleString()} Credits
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    {plan.features.map((f, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-tight">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Action CTA */}
                <div className="pt-6">
                  <button
                    disabled={isCurrent || loadingTier === t}
                    onClick={() => handleSelectPlan(t)}
                    className={`tactile-btn w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      isCurrent
                        ? "bg-zinc-800 text-zinc-400 cursor-default border border-white/5"
                        : isPopular
                        ? "bg-cyan-400 text-zinc-950 hover:bg-cyan-300 shadow-md"
                        : "bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10"
                    }`}
                  >
                    {isCurrent ? (
                      <span>Current Plan</span>
                    ) : loadingTier === t ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <>
                        <span>Select {plan.name.split(" ")[0]}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

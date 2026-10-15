"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Zap,
  Key,
  Copy,
  Check,
  Plus,
  Trash2,
  Clock,
  BarChart2,
  TrendingDown,
  Layers,
  Code2
} from "lucide-react";
import { api } from "@/services/api";
import { APIKeyInfo, UsageSummary } from "@/types";

interface UsageDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPricing: () => void;
}

export function UsageDashboardModal({
  isOpen,
  onClose,
  onOpenPricing
}: UsageDashboardModalProps) {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [keys, setKeys] = useState<APIKeyInfo[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState<string | null>(null);

  const loadData = () => {
    api.getUsageSummary().then(setUsage).catch(console.error);
    api.getAPIKeys().then(setKeys).catch(console.error);
  };

  useEffect(() => {
    if (!isOpen) return;
    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setIsCreatingKey(true);
    try {
      const res = await api.createAPIKey(newKeyName.trim(), usage?.tier || "professional");
      if (res.full_key) {
        setNewlyCreatedKey(res.full_key);
      }
      setNewKeyName("");
      loadData();
    } catch (err: any) {
      alert(`Error creating key: ${err.message}`);
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key?")) return;
    try {
      await api.revokeAPIKey(keyId);
      loadData();
    } catch (err: any) {
      alert(`Revoke failed: ${err.message}`);
    }
  };

  const handleTopup = async (credits: number, costUsd: number) => {
    try {
      await api.topupCredits(credits, costUsd);
      setTopupSuccess(`Added ${credits.toLocaleString()} credits to account!`);
      loadData();
      setTimeout(() => setTopupSuccess(null), 3000);
    } catch (err: any) {
      alert(`Top-up failed: ${err.message}`);
    }
  };

  const pctRemaining = usage
    ? Math.round((usage.credits_remaining / Math.max(1, usage.credits_total)) * 100)
    : 84;

  const demoKey = newlyCreatedKey || (keys.length > 0 ? keys[0].key_prefix : "kal_live_9f83...");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/10 bg-zinc-900/95 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-mono font-semibold">
              <Zap className="h-3.5 w-3.5" />
              <span>REAL-TIME METERING & DEVELOPER CONSOLE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Usage, Credits & API Gateway
            </h2>
            <p className="text-xs text-zinc-400">
              Organization: <span className="text-zinc-200 font-semibold">{usage?.org_id || "Acme Media & Publishing Group"}</span> • Plan: <span className="uppercase font-mono text-cyan-300 font-bold">{usage?.tier || "Professional"}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Top-up Toast */}
        {topupSuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>{topupSuccess}</span>
          </div>
        )}

        {/* Credit Gauge & Burn Rate */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main Meter */}
          <div className="md:col-span-2 rounded-2xl border border-white/5 bg-zinc-950/70 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Available Credit Balance
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {pctRemaining}% Remaining
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-white">
                {usage?.credits_remaining.toLocaleString() || "8,420"}
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                / {usage?.credits_total.toLocaleString() || "10,000"} Total Credits
              </span>
            </div>

            <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${pctRemaining}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
              <span>Consumed this period: <strong className="text-zinc-200 font-mono">{usage?.credits_consumed.toLocaleString() || "1,580"}</strong></span>
              <button
                onClick={onOpenPricing}
                className="text-cyan-400 hover:underline font-semibold"
              >
                Upgrade Tier →
              </button>
            </div>
          </div>

          {/* Depletion Projection */}
          <div className="rounded-2xl border border-white/5 bg-zinc-950/70 p-5 space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-400" /> Run-rate Forecast
              </span>
              <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
                ~{usage?.estimated_depletion_days || 59} Days
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                At your average pace of {usage?.burn_rate_daily || 142} credits/day.
              </p>
            </div>

            <div className="flex items-center gap-1.5 pt-2">
              <button
                onClick={() => handleTopup(1000, 15)}
                className="tactile-btn flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/5"
              >
                +1k ($15)
              </button>
              <button
                onClick={() => handleTopup(5000, 60)}
                className="tactile-btn flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-cyan-950/50 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-500/30"
              >
                +5k ($60)
              </button>
            </div>
          </div>
        </div>

        {/* Operation Breakdown */}
        {usage?.operation_breakdown && (
          <div className="rounded-2xl border border-white/5 bg-zinc-950/50 p-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold flex items-center gap-1.5">
              <BarChart2 className="h-3.5 w-3.5 text-cyan-400" /> Consumption by Operation
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(usage.operation_breakdown).map(([op, cr]) => (
                <div key={op} className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/5">
                  <div className="text-[10px] text-zinc-400 truncate">{op}</div>
                  <div className="text-sm font-bold font-mono text-zinc-200 mt-0.5">{cr} credits</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Key Management */}
        <div className="rounded-2xl border border-white/5 bg-zinc-950/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-cyan-400" /> Active API Keys
            </h4>
          </div>

          {/* New Key Form */}
          <form onSubmit={handleCreateKey} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Staging Ingestion Bot"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
            />
            <button
              type="submit"
              disabled={isCreatingKey || !newKeyName.trim()}
              className="tactile-btn flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-400 text-zinc-950 font-bold text-xs hover:bg-cyan-300 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Key</span>
            </button>
          </form>

          {/* Newly created key banner */}
          {newlyCreatedKey && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 space-y-1.5">
              <div className="text-[11px] font-bold text-amber-300">
                ⚠️ Save your API key! It will not be shown again:
              </div>
              <div className="flex items-center justify-between font-mono text-xs text-zinc-100 bg-zinc-900 p-2 rounded-lg border border-white/5">
                <span className="truncate pr-2">{newlyCreatedKey}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newlyCreatedKey);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Keys List */}
          <div className="space-y-2">
            {keys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-zinc-900/80 text-xs"
              >
                <div>
                  <div className="font-semibold text-zinc-200">{k.name}</div>
                  <div className="font-mono text-[10px] text-zinc-500 flex items-center gap-2 mt-0.5">
                    <span>{k.key_prefix}</span>
                    <span>•</span>
                    <span className="uppercase text-cyan-400 font-bold">{k.tier}</span>
                    <span>•</span>
                    <span>Rate limit: {k.rate_limit_rpm} rpm</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    k.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  }`}>
                    {k.is_active ? "Active" : "Revoked"}
                  </span>
                  {k.is_active && (
                    <button
                      onClick={() => handleRevokeKey(k.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition"
                      title="Revoke key"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Code Snippet */}
        <div className="rounded-2xl border border-white/5 bg-zinc-950/70 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-cyan-400" /> API Integration (cURL)
            </span>
          </div>
          <pre className="p-3 rounded-xl bg-zinc-950 font-mono text-[11px] text-cyan-300 overflow-x-auto border border-white/5">
{`curl -X POST "${api.getBackendUrl()}/api/ingest" \\
  -H "X-Kaleido-API-Key: ${demoKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"input_type": "text", "content": "Article body...", "language": "en"}'`}
          </pre>
        </div>
      </div>
    </div>
  );
}

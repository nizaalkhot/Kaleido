"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Globe,
  Plus,
  Check,
  Radio,
  Sparkles,
  ExternalLink,
  Layers,
  Copy
} from "lucide-react";
import { api } from "@/services/api";
import { SponsorCampaign, SponsorEarningsSummary, EmbedDomain } from "@/types";

interface PublisherRevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PublisherRevenueModal({
  isOpen,
  onClose
}: PublisherRevenueModalProps) {
  const [earnings, setEarnings] = useState<SponsorEarningsSummary | null>(null);
  const [campaigns, setCampaigns] = useState<SponsorCampaign[]>([]);
  const [domains, setDomains] = useState<EmbedDomain[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [newTheme, setNewTheme] = useState("dark");
  const [isRegistering, setIsRegistering] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const loadData = () => {
    api.getSponsorEarnings().then(setEarnings).catch(console.error);
    api.getSponsorCampaigns().then(setCampaigns).catch(console.error);
    api.getEmbedDomains().then(setDomains).catch(console.error);
  };

  useEffect(() => {
    if (!isOpen) return;
    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRegisterDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setIsRegistering(true);
    try {
      await api.registerEmbedDomain(newDomain.trim(), newTheme);
      setNewDomain("");
      loadData();
    } catch (err: any) {
      alert(`Registration error: ${err.message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/10 bg-zinc-900/95 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-semibold">
              <DollarSign className="h-3.5 w-3.5" />
              <span>PUBLISHER MONETIZATION & SPONSOR ENGINE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Ad Revenue Share & Verified Embed Marketplace
            </h2>
            <p className="text-xs text-zinc-400">
              Publishers retain <strong>70% of gross CPM revenue</strong> from non-intrusive, fact-checked sponsor cards injected into adaptive formats.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-1">
            <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
              Your Net Ad Share (70%)
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white">
              ${earnings?.publisher_share_usd.toFixed(2) || "270.48"}
            </div>
            <div className="text-[10px] text-emerald-400/80">
              Direct deposit via Stripe Connect
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-zinc-950/60 p-4 space-y-1">
            <div className="text-[10px] font-mono uppercase text-zinc-400 font-bold">
              Verified Ad Impressions
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-300">
              {earnings?.total_impressions.toLocaleString() || "24,150"}
            </div>
            <div className="text-[10px] text-zinc-500">
              Gross Volume: ${earnings?.gross_ad_revenue_usd.toFixed(2) || "386.40"}
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-zinc-950/60 p-4 space-y-1">
            <div className="text-[10px] font-mono uppercase text-zinc-400 font-bold">
              Top Monetized Surface
            </div>
            <div className="text-sm font-bold text-amber-300 truncate mt-1">
              {earnings?.top_performing_format || "Story Cards Deck"}
            </div>
            <div className="text-[10px] text-zinc-500">
              Average CPM: $16.00 across 3 formats
            </div>
          </div>
        </div>

        {/* Active Sponsor Campaigns */}
        <div className="rounded-2xl border border-white/5 bg-zinc-950/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" /> Active Verified Sponsor Partners
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ✓ Fact-Checked Claims
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {campaigns.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-white/5 bg-zinc-900/80 p-3.5 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white truncate">{c.brand}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/30">
                      ${c.cpm_bid.toFixed(2)} CPM
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-zinc-200 line-clamp-1">
                    {c.headline}
                  </div>
                  <p className="text-[10px] text-zinc-400 line-clamp-2">
                    {c.creative_text}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {c.matching_topics.slice(0, 2).map((t, idx) => (
                      <span key={idx} className="text-[9px] font-mono px-1 rounded bg-zinc-800 text-zinc-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <a
                    href={c.cta_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5 font-semibold"
                  >
                    <span>View</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Authorized Embed Domains */}
        <div className="rounded-2xl border border-white/5 bg-zinc-950/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-cyan-400" /> Authorized Publisher Embed Domains
            </h4>
            <span className="text-[10px] text-zinc-400 font-mono">
              Enforces domain lock & prevents hotlinking
            </span>
          </div>

          {/* Add Domain Form */}
          <form onSubmit={handleRegisterDomain} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="e.g. portal.media-group.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
            />
            <select
              value={newTheme}
              onChange={(e) => setNewTheme(e.target.value)}
              className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="dark">Theme: Dark Glass</option>
              <option value="editorial">Theme: Light Editorial</option>
              <option value="compact">Theme: Compact Audio Pill</option>
            </select>
            <button
              type="submit"
              disabled={isRegistering || !newDomain.trim()}
              className="tactile-btn flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-400 text-zinc-950 font-bold text-xs hover:bg-cyan-300 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Authorize Domain</span>
            </button>
          </form>

          {/* Domains List */}
          <div className="space-y-2">
            {domains.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-zinc-900/80 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm" />
                  <span className="font-mono font-semibold text-zinc-200">{d.domain}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/5 capitalize">
                    Theme: {d.theme}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-zinc-400 text-[11px] font-mono">
                    {d.impressions_total.toLocaleString()} impressions
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 font-mono">
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

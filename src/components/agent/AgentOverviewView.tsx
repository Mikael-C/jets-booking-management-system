"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { formatCurrency } from "@/lib/pricingCalculator";
import StatusPill from "@/components/ui/StatusPill";
import {
  Sparkles,
  TrendingUp,
  DollarSign,
  FileText,
  Send,
  CheckCircle2,
  ArrowRight,
  Plane,
  Clock,
  Compass,
  Receipt,
  Coins,
  PlusCircle,
  ExternalLink
} from "lucide-react";

export default function AgentOverviewView() {
  const router = useRouter();
  const {
    bookings,
    agentRequests,
    setActiveNav,
    openDocument,
    tokenBalance,
    tokenTier,
    openTokenModal
  } = useAviation();

  const handleNewRequest = () => {
    setActiveNav("request_quote");
    router.push("/agent/requests/new");
  };

  const confirmedDeals = bookings.filter((b) =>
    ["confirmed", "dispatched", "in_flight", "completed"].includes(b.status)
  );
  const openQuotes = bookings.filter((b) =>
    ["draft", "quote_sent", "client_review"].includes(b.status)
  );

  const totalWonRevenue = confirmedDeals.reduce((sum, b) => sum + b.pricing.totalFlightPrice, 0);
  const totalEarnedCommission = totalWonRevenue * 0.08;
  const potentialCommission = openQuotes.reduce((sum, b) => sum + b.pricing.totalFlightPrice, 0) * 0.08;

  return (
    <div className="space-y-6">
      
      {/* Agent Sales Banner */}
      <div className="bg-[#0F1420] text-white border border-[#1C2436] rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/20 text-[#C9A052] border border-[#C9A052]/40 uppercase">
              CHARTER BROKER DESK
            </span>
            <span className="text-gray-400 text-xs">Standard Brokerage Commission: 8.0%</span>
            <button
              onClick={() => openTokenModal("Refill your agent tokens")}
              className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#141A29] text-[#C9A052] border border-[#C9A052]/40 flex items-center gap-1 hover:bg-[#1C2436] transition-colors"
            >
              <Coins className="w-3 h-3 text-[#C9A052]" />
              <span>{tokenBalance.toLocaleString()} Tokens</span>
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sales & Brokerage Command Center
          </h1>
          <p className="text-xs text-gray-300 leading-relaxed">
            Request luxury private jet proposals from Admin operations, track deals with high-net-worth clients, and earn 8% commission on confirmed charters.
          </p>
        </div>

        {/* Primary Gold CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => openTokenModal("Top up tokens for your broker account")}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#141A29] hover:bg-[#1A2338] border border-[#C9A052]/40 text-white font-mono text-xs font-bold transition-all shadow-md cursor-pointer whitespace-nowrap"
          >
            <Coins className="w-4 h-4 text-[#C9A052]" />
            <span>Refill Tokens</span>
          </button>
          <button
            onClick={handleNewRequest}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-black text-xs uppercase tracking-wider shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span>Request New Quote</span>
          </button>
        </div>
      </div>

      {/* Commission & Token Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Token Balance Card */}
        <div className="bg-gradient-to-br from-[#0F1420] to-[#1A2338] text-white border border-[#C9A052]/40 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A052] font-bold flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" /> AVAILABLE TOKENS
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              {tokenTier.toUpperCase()}
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {tokenBalance.toLocaleString()} <span className="text-xs font-normal text-gray-400">Tokens</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-gray-300 font-mono">
              ~{Math.floor(tokenBalance / 100)} actions remaining
            </p>
            <button
              onClick={() => openTokenModal("Refill tokens for your broker account")}
              className="text-[10px] font-bold text-[#C9A052] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3 h-3" /> Refill
            </button>
          </div>
        </div>

        {/* Commission Earned */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold">
            EARNED BROKERAGE COMMISSION
          </span>
          <div className="text-2xl font-black text-[#C9A052] font-mono">
            {formatCurrency(totalEarnedCommission, "EUR")}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>From {confirmedDeals.length} confirmed flights</span>
          </p>
        </div>

        {/* Pipeline Potential */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold">
            PIPELINE COMMISSION IN REVIEW
          </span>
          <div className="text-2xl font-black text-[#0F1420] font-mono">
            {formatCurrency(potentialCommission, "EUR")}
          </div>
          <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Across {openQuotes.length} proposals</span>
          </p>
        </div>

        {/* Closing Ratio */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold">
            CLOSING CONVERSION RATE
          </span>
          <div className="text-2xl font-black text-[#0F1420] font-mono">
            {bookings.length > 0 ? Math.round((confirmedDeals.length / bookings.length) * 100) : 0}%
          </div>
          <p className="text-[11px] text-gray-500 font-medium">
            European & Global business jet charters
          </p>
        </div>
      </div>

      {/* 3 Quick Launchpad Buttons for Broker Requests */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={handleNewRequest}
          className="bg-white border border-[#E0DAD0] hover:border-[#C9A052] rounded-2xl p-5 shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-[#F5F2EC] group-hover:bg-[#C9A052] transition-colors">
              <Send className="w-5 h-5 text-[#0F1420]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#0F1420]">Request for Quotes</h3>
              <p className="text-[11px] text-gray-500">6-step guided wizard for routing & aircraft</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#C9A052] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Launch Wizard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => setActiveNav("request_brief")}
          className="bg-white border border-[#E0DAD0] hover:border-[#C9A052] rounded-2xl p-5 shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-[#F5F2EC] group-hover:bg-[#C9A052] transition-colors">
              <Compass className="w-5 h-5 text-[#0F1420]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#0F1420]">Request for Flight Briefs</h3>
              <p className="text-[11px] text-gray-500">Provide passenger manifest & FBO requests</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#C9A052] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Fill Brief Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => setActiveNav("request_invoice")}
          className="bg-white border border-[#E0DAD0] hover:border-[#C9A052] rounded-2xl p-5 shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-[#F5F2EC] group-hover:bg-[#C9A052] transition-colors">
              <Receipt className="w-5 h-5 text-[#0F1420]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#0F1420]">Request for Invoice</h3>
              <p className="text-[11px] text-gray-500">Request formal commercial invoice</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#C9A052] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Fill Invoice Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Recent Proposals & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotes for Clients */}
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold font-display text-sm text-[var(--ink)] m-0">
                Active Client Proposals
              </h3>
              <p className="text-xs text-[var(--muted)]">Recent quotes with your 5% broker commission</p>
            </div>
            <Link
              href="/agent/requests"
              className="text-xs font-mono text-[var(--accent)] hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {openQuotes.slice(0, 4).map((b) => {
              const route = b.legs.map((l) => `${l.origin?.iata || l.origin?.icao || "---"} → ${l.destination?.iata || l.destination?.icao || "---"}`).join(", ");
              const comm = b.pricing.totalFlightPrice * 0.05;
              return (
                <div
                  key={b.id}
                  className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg flex items-center justify-between gap-3 hover:border-[var(--accent)] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[var(--ink)]">
                        {b.tripNumber}
                      </span>
                      <StatusPill
                        label={b.quoteStatus?.toUpperCase() || b.status.toUpperCase()}
                        variant={b.quoteStatus === "accepted" ? "green" : "blue"}
                      />
                    </div>
                    <p className="text-xs text-[var(--ink)] font-semibold truncate mt-0.5">
                      {b.client?.fullName || "Client Confidential"} • {b.aircraft?.name || "Midsize Jet"}
                    </p>
                    <p className="text-[11px] text-[var(--muted)] font-mono">
                      {route}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="font-mono font-bold text-xs text-[var(--ink)]">
                      {formatCurrency(b.pricing.totalFlightPrice, b.pricing.currency || "EUR")}
                    </div>
                    <div className="font-mono text-[11px] text-[var(--accent)] font-semibold">
                      +{formatCurrency(comm, b.pricing.currency || "EUR")} comm
                    </div>
                    <Link
                      href={`/agent/quotes/${b.id}`}
                      className="text-[10px] font-mono font-bold text-[var(--muted)] hover:text-[var(--ink)] inline-flex items-center gap-0.5 mt-1"
                    >
                      <span>Detail</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Sourcing Inquiries */}
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold font-display text-sm text-[var(--ink)] m-0">
                Sourcing Requests Queue
              </h3>
              <p className="text-xs text-[var(--muted)]">Flight requests under review by Orbelo Operations</p>
            </div>
            <Link
              href="/agent/requests"
              className="text-xs font-mono text-[var(--accent)] hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {agentRequests.slice(0, 4).map((req) => (
              <div
                key={req.id}
                className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[var(--ink)]">{req.id}</span>
                    <StatusPill
                      label={req.status.replace("_", " ").toUpperCase()}
                      variant={
                        req.status === "completed"
                          ? "green"
                          : req.status === "declined"
                          ? "red"
                          : "amber"
                      }
                    />
                  </div>
                  <p className="text-xs text-[var(--ink)] font-semibold truncate mt-0.5">
                    {req.clientName || "Private Client"}
                  </p>
                  <p className="text-[11px] text-[var(--muted)] font-mono">
                    {req.route || `${req.originIcao || "---"} → ${req.destIcao || "---"}`} • {req.aircraftPreference || "Any Category"}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] font-mono text-[var(--muted)] block">
                    {req.flightDate || "Flexible"}
                  </span>
                  <Link
                    href="/agent/requests"
                    className="text-[10px] font-mono font-bold text-[var(--accent)] hover:underline inline-flex items-center gap-0.5 mt-1"
                  >
                    <span>Track</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

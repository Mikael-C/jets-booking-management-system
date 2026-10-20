"use client";

import React from "react";
import { useAviation } from "@/lib/aviationContext";
import { formatCurrency } from "@/lib/pricingCalculator";
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
  Receipt
} from "lucide-react";

export default function AgentOverviewView() {
  const { bookings, setActiveNav, openDocument } = useAviation();

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
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sales & Brokerage Command Center
          </h1>
          <p className="text-xs text-gray-300 leading-relaxed">
            Request luxury private jet proposals from Admin operations, track deals with high-net-worth clients, and earn 8% commission on confirmed charters.
          </p>
        </div>

        {/* Primary Gold CTA */}
        <button
          onClick={() => setActiveNav("request_quote")}
          className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-black text-xs uppercase tracking-wider shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4" />
          <span>Request New Quote</span>
        </button>
      </div>

      {/* Commission Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
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
            <span>From {confirmedDeals.length} confirmed charter flights</span>
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
            <span>Across {openQuotes.length} pending client proposals</span>
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
          onClick={() => setActiveNav("request_quote")}
          className="bg-white border border-[#E0DAD0] hover:border-[#C9A052] rounded-2xl p-5 shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-[#F5F2EC] group-hover:bg-[#C9A052] transition-colors">
              <Send className="w-5 h-5 text-[#0F1420]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#0F1420]">Request for Quotes</h3>
              <p className="text-[11px] text-gray-500">Submit routing for admin price generation</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#C9A052] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Fill Quote Details</span>
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
    </div>
  );
}

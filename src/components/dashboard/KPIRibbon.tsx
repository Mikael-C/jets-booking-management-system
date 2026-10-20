"use client";

import React from "react";
import { useAviation } from "@/lib/aviationContext";
import { formatCurrency } from "@/lib/pricingCalculator";
import { Plane, DollarSign, Clock, ShieldCheck, TrendingUp, Users } from "lucide-react";

export default function KPIRibbon() {
  const { bookings, role } = useAviation();

  const bookedFlights = bookings.filter((b) => ["confirmed", "dispatched", "in_flight", "completed"].includes(b.status));
  const inProgressQuotes = bookings.filter((b) => ["draft", "quote_sent", "client_review"].includes(b.status));

  const totalBookedRevenue = bookedFlights.reduce((acc, b) => acc + b.pricing.totalFlightPrice, 0);
  const totalPipelineRevenue = inProgressQuotes.reduce((acc, b) => acc + b.pricing.totalFlightPrice, 0);

  // Agent specific metrics
  const agentCommission = totalBookedRevenue * 0.08;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Metric 1: Booked Revenue */}
      <div className="bg-[#0F1420] border border-gray-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-gold/40 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 font-semibold">
            {role === "admin" ? "CONFIRMED BOOKINGS REVENUE" : "ESTIMATED COMMISSION (8%)"}
          </span>
          <div className="p-2 rounded-xl bg-gold/10 text-gold border border-gold/20">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-white font-mono">
            {role === "admin" ? formatCurrency(totalBookedRevenue, "EUR") : formatCurrency(agentCommission, "EUR")}
          </span>
        </div>
        <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1 font-medium">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{bookedFlights.length} flights successfully locked</span>
        </p>
      </div>

      {/* Metric 2: Booked Flights Count */}
      <div className="bg-[#0F1420] border border-gray-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-gold/40 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 font-semibold">
            SUCCESSFULLY BOOKED
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Plane className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-white font-mono">{bookedFlights.length}</span>
          <span className="text-xs text-gray-400">active charters</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          Quotes, Invoices & Briefs ready for download
        </p>
      </div>

      {/* Metric 3: In-Progress Quotes */}
      <div className="bg-[#0F1420] border border-gray-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-gold/40 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 font-semibold">
            IN-PROGRESS QUOTES
          </span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-white font-mono">{inProgressQuotes.length}</span>
          <span className="text-xs text-gray-400 font-mono">({formatCurrency(totalPipelineRevenue, "EUR")})</span>
        </div>
        <p className="text-[11px] text-amber-400 mt-2">
          Pending client signature / review
        </p>
      </div>

      {/* Metric 4: Operations & Dispatch Status */}
      <div className="bg-[#0F1420] border border-gray-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-gold/40 transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 font-semibold">
            DISPATCH READINESS
          </span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-emerald-400 font-mono">92%</span>
          <span className="text-xs text-gray-400">checklists cleared</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          Crew FTL & FBO slots confirmed
        </p>
      </div>
    </div>
  );
}

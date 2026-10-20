"use client";

import React from "react";
import { useAviation } from "@/lib/aviationContext";
import { formatCurrency } from "@/lib/pricingCalculator";
import { Plus, Sparkles, TrendingUp, DollarSign, FileText, Send, CheckCircle2, ArrowUpRight, Plane } from "lucide-react";

export default function AgentDashboard() {
  const { bookings, openNewQuoteModal, openDocument, convertQuoteToBooked } = useAviation();

  const myBookings = bookings;
  const myWonDeals = myBookings.filter((b) => ["confirmed", "dispatched", "in_flight", "completed"].includes(b.status));
  const myOpenQuotes = myBookings.filter((b) => ["draft", "quote_sent", "client_review"].includes(b.status));

  const totalWonRevenue = myWonDeals.reduce((sum, b) => sum + b.pricing.totalFlightPrice, 0);
  const totalEarnedCommission = totalWonRevenue * 0.08;
  const potentialCommission = myOpenQuotes.reduce((sum, b) => sum + b.pricing.totalFlightPrice, 0) * 0.08;

  return (
    <div className="space-y-6">
      {/* Agent Sales Banner */}
      <div className="bg-gradient-to-r from-[#0F1420] via-[#141A29] to-[#0F1420] border border-gold/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gold/20 text-gold border border-gold/30 uppercase">
              Charter Broker Workspace
            </span>
            <span className="text-gray-400 text-xs">Standard Commission: 8.0%</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Sales & Charter Quotation Desk
          </h1>
          <p className="text-xs text-gray-300 leading-relaxed">
            Generate luxury multi-leg private jet proposals, track deals with high-net-worth clients, and download client-ready branded quotations and briefs.
          </p>
        </div>

        <button
          onClick={openNewQuoteModal}
          className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gold hover:bg-gold-light text-[#0F1420] font-bold text-sm shadow-gold transition-all transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate New Quote</span>
        </button>
      </div>

      {/* Agent Commission & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Commission Earned */}
        <div className="bg-[#0F1420] border border-gray-800 rounded-2xl p-5 shadow-lg">
          <span className="text-[11px] font-mono uppercase text-gray-400 font-semibold">EARNED BROKERAGE COMMISSION</span>
          <div className="text-2xl font-extrabold text-gold font-mono mt-1">
            {formatCurrency(totalEarnedCommission, "EUR")}
          </div>
          <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>From {myWonDeals.length} confirmed charter flights</span>
          </p>
        </div>

        {/* Pipeline Potential */}
        <div className="bg-[#0F1420] border border-gray-800 rounded-2xl p-5 shadow-lg">
          <span className="text-[11px] font-mono uppercase text-gray-400 font-semibold">PIPELINE COMMISSION IN REVIEW</span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">
            {formatCurrency(potentialCommission, "EUR")}
          </div>
          <p className="text-[11px] text-amber-400 mt-2">
            Across {myOpenQuotes.length} pending client proposals
          </p>
        </div>

        {/* Closing Ratio */}
        <div className="bg-[#0F1420] border border-gray-800 rounded-2xl p-5 shadow-lg">
          <span className="text-[11px] font-mono uppercase text-gray-400 font-semibold">CLOSING CONVERSION RATE</span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">
            {myBookings.length > 0 ? Math.round((myWonDeals.length / myBookings.length) * 100) : 0}%
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            European & Global business jet charters
          </p>
        </div>
      </div>

      {/* Active Agent Deals Table */}
      <div className="bg-[#0F1420] border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 bg-[#0B101A] border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            My Deals & Client Proposals
          </h2>
          <span className="text-xs text-gray-400">
            {myBookings.length} total managed quotes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#080C14] text-gray-400 font-mono text-[11px] uppercase tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-3 px-4">Trip Reference</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Aircraft</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Quote Total</th>
                <th className="py-3 px-4">Commission</th>
                <th className="py-3 px-4 text-right">Download Proposal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {myBookings.map((b) => {
                const commission = b.pricing.totalFlightPrice * 0.08;
                const isWon = ["confirmed", "dispatched", "in_flight", "completed"].includes(b.status);

                return (
                  <tr key={b.id} className="hover:bg-[#141A29]/70 text-gray-300">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {b.tripNumber}
                      <span className={`block text-[10px] uppercase font-normal ${isWon ? "text-emerald-400" : "text-amber-400"}`}>
                        {b.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-white">{b.client.fullName}</span>
                      <span className="block text-[10px] text-gray-500">{b.client.email}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-gray-200">{b.aircraft.name}</span>
                      <span className="block text-[10px] text-gold font-mono">{b.aircraft.categoryLabel}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {b.legs.map((l) => `${l.origin.icao} → ${l.destination.icao}`).join(" • ")}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {formatCurrency(b.pricing.totalFlightPrice, b.pricing.currency)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gold font-semibold">
                      {formatCurrency(commission, b.pricing.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDocument(b, "quotation")}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gold hover:text-[#0F1420] text-gray-200 text-xs font-semibold border border-gray-700 transition-all cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-gold" />
                          <span>PDF Quote</span>
                        </button>

                        {!isWon && (
                          <button
                            onClick={() => convertQuoteToBooked(b.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm Deal</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

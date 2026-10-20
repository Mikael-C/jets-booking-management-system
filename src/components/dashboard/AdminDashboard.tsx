"use client";

import React, { useState } from "react";
import KPIRibbon from "./KPIRibbon";
import BookingsTable from "./BookingsTable";
import InProgressQuotesTable from "./InProgressQuotesTable";
import { useAviation } from "@/lib/aviationContext";
import { fleetData } from "@/data/fleet";
import { Shield, Sparkles, Filter, CheckCircle2, Clock, AlertTriangle, Plane } from "lucide-react";

export default function AdminDashboard() {
  const { openNewQuoteModal, statusFilter, setStatusFilter } = useAviation();
  const [activeTab, setActiveTab] = useState<"all" | "booked" | "in_progress">("all");

  return (
    <div className="space-y-6">
      {/* Admin Operations Hero */}
      <div className="bg-[#0F1420] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gold/20 text-gold border border-gold/30 uppercase flex items-center gap-1">
              <Shield className="w-3 h-3" />
              ADMINISTRATOR CONTROL CENTER
            </span>
            <span className="text-gray-400 text-xs">Total Operational Authority</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Flight Operations & Charter Management
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage confirmed charter flights, review dispatch compliance, and generate official luxury Quotations, Invoices, Flight Briefs, and Charter Agreements.
          </p>
        </div>

        {/* Tab Controls & Filter */}
        <div className="flex items-center gap-2 bg-[#080C14] p-1.5 rounded-xl border border-gray-800">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "all" ? "bg-gold text-[#0F1420] font-bold shadow-sm" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            All Charters
          </button>
          <button
            onClick={() => setActiveTab("booked")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "booked" ? "bg-gold text-[#0F1420] font-bold shadow-sm" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Confirmed Bookings
          </button>
          <button
            onClick={() => setActiveTab("in_progress")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "in_progress" ? "bg-gold text-[#0F1420] font-bold shadow-sm" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            In-Progress Quotes
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <KPIRibbon />

      {/* Tables Section based on Tab */}
      {(activeTab === "all" || activeTab === "booked") && (
        <BookingsTable filterStatus={statusFilter} />
      )}

      {(activeTab === "all" || activeTab === "in_progress") && (
        <InProgressQuotesTable />
      )}

      {/* Fleet Overview Strip */}
      <div className="bg-[#0F1420] border border-gray-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-gold" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Managed Fleet & Aircraft Readiness
            </h3>
          </div>
          <span className="text-xs text-gray-400 font-mono">
            {fleetData.length} active aircraft in roster
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {fleetData.map((jet) => (
            <div
              key={jet.id}
              className="bg-[#080C14] border border-gray-800 hover:border-gold/30 rounded-xl p-3 space-y-2 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate max-w-[120px]">{jet.name}</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400" title="Airworthy & Available" />
              </div>
              <div className="text-[11px] text-gray-400 space-y-0.5">
                <p>Tail: <strong className="text-gold font-mono">{jet.registration || "OE-FFB"}</strong></p>
                <p>Seats: <strong className="text-gray-200">{jet.passengers} Pax</strong></p>
                <p>Rate: <strong className="text-gray-200 font-mono">€{jet.pricePerHour}/hr</strong></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { useAviation } from "@/lib/aviationContext";
import { formatCurrency } from "@/lib/pricingCalculator";
import {
  Plane,
  TrendingUp,
  ShieldCheck,
  Inbox,
  FilePlus2,
  Compass,
  Receipt,
  Users,
  ArrowRight,
  Clock,
  Sparkles
} from "lucide-react";

export default function OperationsOverview() {
  const { bookings, agentRequests, clients, setActiveNav } = useAviation();

  const confirmedBookings = bookings.filter((b) =>
    ["confirmed", "dispatched", "in_flight", "completed"].includes(b.status)
  );
  const inProgressBookings = bookings.filter((b) =>
    ["draft", "quote_sent", "client_review"].includes(b.status)
  );

  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.pricing.totalFlightPrice, 0);
  const pipelineRevenue = inProgressBookings.reduce((sum, b) => sum + b.pricing.totalFlightPrice, 0);
  const pendingRequests = agentRequests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      
      {/* Executive Hero Banner */}
      <div className="bg-[#0F1420] text-white border border-[#1C2436] rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/20 text-[#C9A052] border border-[#C9A052]/40 uppercase flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              FLIGHT OPERATIONS COMMAND
            </span>
            <span className="text-gray-400 text-xs">Total Administrative Authority</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Orbelo Aviation Management System
          </h1>
          <p className="text-xs text-gray-300 leading-relaxed">
            Centralized hub for private jet charter operations, live flight dispatch, commercial tax invoicing, and broker quote fulfillment.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          <button
            onClick={() => setActiveNav("generate_quote")}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>Generate Quote</span>
          </button>

          <button
            onClick={() => setActiveNav("bookings")}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#141A29] hover:bg-[#1C2436] text-white text-xs font-bold transition-all border border-[#1C2436] cursor-pointer"
          >
            <span>View All Bookings</span>
            <ArrowRight className="w-4 h-4 text-[#C9A052]" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Booked Revenue */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold">
            CONFIRMED CHARTER REVENUE
          </span>
          <div className="text-2xl font-black text-[#0F1420] font-mono">
            {formatCurrency(totalRevenue, "EUR")}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Across {confirmedBookings.length} confirmed flights</span>
          </p>
        </div>

        {/* Quoting Pipeline */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold">
            PROPOSALS IN PIPELINE
          </span>
          <div className="text-2xl font-black text-[#0F1420] font-mono">
            {formatCurrency(pipelineRevenue, "EUR")}
          </div>
          <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{inProgressBookings.length} active quotes in review</span>
          </p>
        </div>

        {/* Pending Agent Inquiries */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold">
            INCOMING AGENT REQUESTS
          </span>
          <div className="text-2xl font-black text-[#C9A052] font-mono">
            {pendingRequests} Requests
          </div>
          <button
            onClick={() => setActiveNav("agent_requests")}
            className="text-[11px] text-[#0F1420] hover:text-[#C9A052] font-bold flex items-center gap-1 transition-colors"
          >
            <span>Review & Fulfill Queue</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Managed Clients */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold">
            ACTIVE CLIENT ACCOUNTS
          </span>
          <div className="text-2xl font-black text-[#0F1420] font-mono">
            {clients.length} Clients
          </div>
          <button
            onClick={() => setActiveNav("clients")}
            className="text-[11px] text-[#0F1420] hover:text-[#C9A052] font-bold flex items-center gap-1 transition-colors"
          >
            <span>View Client Directory</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Quick Launchpad to Core Sections */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveNav("generate_quote")}
          className="bg-white border border-[#E0DAD0] hover:border-[#C9A052] rounded-2xl p-5 shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-[#F5F2EC] group-hover:bg-[#C9A052] transition-colors">
              <FilePlus2 className="w-5 h-5 text-[#0F1420]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#0F1420]">Generate Quote</h3>
              <p className="text-[11px] text-gray-500">Calculate pricing & export official PDF</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#C9A052] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Start Quote Builder</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => setActiveNav("generate_brief")}
          className="bg-white border border-[#E0DAD0] hover:border-[#C9A052] rounded-2xl p-5 shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-[#F5F2EC] group-hover:bg-[#C9A052] transition-colors">
              <Compass className="w-5 h-5 text-[#0F1420]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#0F1420]">Generate Flight Brief</h3>
              <p className="text-[11px] text-gray-500">Assign crew, FBOs & operational NOTAMs</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#C9A052] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Compile Flight Brief</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => setActiveNav("generate_invoice")}
          className="bg-white border border-[#E0DAD0] hover:border-[#C9A052] rounded-2xl p-5 shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-[#F5F2EC] group-hover:bg-[#C9A052] transition-colors">
              <Receipt className="w-5 h-5 text-[#0F1420]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#0F1420]">Generate Tax Invoice</h3>
              <p className="text-[11px] text-gray-500">International VAT exempt & wire details</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#C9A052] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Create Tax Invoice</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

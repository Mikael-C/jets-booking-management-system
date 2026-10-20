"use client";

import React, { useState, useEffect } from "react";
import { useAviation } from "@/lib/aviationContext";
import { Search, Plus, RotateCcw, Clock, Shield, Plane, Sparkles } from "lucide-react";

export default function TopHeader() {
  const {
    role,
    activeNav,
    setActiveNav,
    searchQuery,
    setSearchQuery,
    openNewQuoteModal,
    resetToDefaultData
  } = useAviation();

  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(
        now.toISOString().substring(11, 19) + "z (" + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " Local)"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getSectionTitle = () => {
    switch (activeNav) {
      case "overview":
        return { section: "Operations Command", title: "Operations Overview & Fleet Readiness" };
      case "bookings":
        return { section: "Operations Control", title: "Charter Bookings & Flight Dispatch" };
      case "generate_quote":
        return { section: "Actions", title: "Generate Official Private Charter Quote" };
      case "generate_brief":
        return { section: "Actions", title: "Generate Flight Operations Brief" };
      case "generate_invoice":
        return { section: "Actions", title: "Generate Commercial Tax Invoice" };
      case "agent_requests":
        return { section: "Incoming Queue", title: "Agent Inquiries & RFQ Fulfillment" };
      case "clients":
        return { section: "CRM & Accounts", title: "Company Clients Directory" };
      case "fleet":
        return { section: "Aviation Assets", title: "Managed Aircraft Roster & Specs" };
      case "agent_overview":
        return { section: "Quoting Desk", title: "Charter Broker Sales & Commission" };
      case "request_quote":
        return { section: "Outbound Requests", title: "Request Private Jet Quote from Admin" };
      case "request_invoice":
        return { section: "Outbound Requests", title: "Request Tax Invoice from Admin" };
      case "request_brief":
        return { section: "Outbound Requests", title: "Request Flight Brief from Admin" };
      case "my_requests":
        return { section: "Tracking Desk", title: "My Submitted Requests & Generated Documents" };
      default:
        return { section: "Portal", title: "Private Jet Booking Management" };
    }
  };

  const navInfo = getSectionTitle();

  return (
    <header className="sticky top-0 z-20 bg-[#F5F2EC]/95 backdrop-blur-md border-b border-[#E0DAD0] px-6 py-3.5 flex items-center justify-between gap-4">
      
      {/* Title & Breadcrumbs */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#0F1420]/60 font-bold">
            {navInfo.section}
          </span>
          <span className="text-gray-300">•</span>
          <span className="text-[10px] font-mono uppercase font-bold text-[#9A7A35] bg-[#C9A052]/15 border border-[#C9A052]/30 px-2.5 py-0.5 rounded-full">
            {role === "admin" ? "ADMIN" : "AGENT"}
          </span>
        </div>
        <h1 className="text-lg font-black text-[#0F1420] tracking-tight">
          {navInfo.title}
        </h1>
      </div>

      {/* Middle: Universal Search Bar */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-[#0F1420]/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Trip # (PEU842), Client, Airport (LSGG), Tail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#E0DAD0] rounded-xl pl-9 pr-4 py-2 text-xs text-[#0F1420] placeholder-[#0F1420]/40 focus:outline-none focus:border-[#C9A052] focus:ring-1 focus:ring-[#C9A052] transition-colors shadow-sm"
          />
        </div>
      </div>

      {/* Right Controls: Zulu Clock, Reset Demo, Action CTA */}
      <div className="flex items-center gap-3">
        {/* Aviation Zulu Clock */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E0DAD0] text-[11px] font-mono text-[#0F1420]/80 shadow-sm">
          <Clock className="w-3.5 h-3.5 text-[#C9A052]" />
          <span>{utcTime || "UTC Zulu Active"}</span>
        </div>

        {/* Reset Demo State Button */}
        <button
          onClick={resetToDefaultData}
          title="Reset database to seed demo records"
          className="p-2 rounded-xl bg-white border border-[#E0DAD0] text-[#0F1420]/60 hover:text-[#0F1420] hover:border-[#C9A052] transition-colors shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Primary Gold Action CTA */}
        {role === "admin" ? (
          <button
            onClick={() => setActiveNav("generate_quote")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-extrabold transition-all shadow-md shadow-[#C9A052]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Generate Quote</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveNav("request_quote")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-extrabold transition-all shadow-md shadow-[#C9A052]/20 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Request Quote</span>
          </button>
        )}
      </div>
    </header>
  );
}

"use client";

import React from "react";
import { useAviation } from "@/lib/aviationContext";
import { UserRole } from "@/types/aviation";
import { Shield, UserCheck, Plus, Search, RotateCcw, Plane, Sparkles } from "lucide-react";

export default function Header() {
  const {
    role,
    setRole,
    openNewQuoteModal,
    searchQuery,
    setSearchQuery,
    resetToDefaultData
  } = useAviation();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0F1420]/95 backdrop-blur-md border-b border-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4 py-3">
        
        {/* Brand Logo & Platform Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className="font-display text-2xl font-black tracking-tight"
              style={{ color: "#FF6B00", letterSpacing: "-0.02em" }}
            >
              Orbelo
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold bg-gold/15 text-gold border border-gold/30">
              OPS OPS-CENTER
            </span>
          </div>
          <span className="hidden lg:inline text-gray-500 text-xs">|</span>
          <span className="hidden lg:inline text-gray-400 text-xs font-medium">
            Private Aviation Booking Management
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Trip # (PEU842), Client, Airport (LSGG), Tail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#080C14] border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gold/60 transition-colors"
            />
          </div>
        </div>

        {/* Right Section: Role Switcher & New Quote Button */}
        <div className="flex items-center gap-3">
          {/* Role Switcher Pill */}
          <div className="flex items-center bg-[#080C14] p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setRole("admin")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                role === "admin"
                  ? "bg-gold text-[#0F1420] shadow-sm font-bold"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>

            <button
              onClick={() => setRole("agent")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                role === "agent"
                  ? "bg-gold text-[#0F1420] shadow-sm font-bold"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Agent</span>
            </button>
          </div>

          {/* Reset Demo Button */}
          <button
            onClick={resetToDefaultData}
            title="Reset to default seed data"
            className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* New Quote Button */}
          <button
            onClick={openNewQuoteModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold hover:bg-gold-light text-[#0F1420] text-xs font-bold transition-all shadow-gold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Quote</span>
          </button>
        </div>
      </div>
    </header>
  );
}

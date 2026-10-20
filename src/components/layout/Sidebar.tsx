"use client";

import React from "react";
import { useAviation } from "@/lib/aviationContext";
import {
  LayoutDashboard,
  Plane,
  FilePlus2,
  Compass,
  Receipt,
  Users,
  Inbox,
  LogOut,
  Shield,
  Send,
  FileText,
  Clock,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  ChevronRight
} from "lucide-react";

export default function Sidebar() {
  const {
    role,
    activeNav,
    setActiveNav,
    logout,
    currentUser,
    agentRequests,
    bookings
  } = useAviation();

  const pendingRequestsCount = agentRequests.filter((r) => r.status === "pending").length;
  const inProgressBookingsCount = bookings.filter((b) =>
    ["draft", "quote_sent", "client_review"].includes(b.status)
  ).length;

  return (
    <aside className="w-64 bg-[#0F1420] text-white flex flex-col flex-shrink-0 h-screen sticky top-0 border-r border-[#1C2436] shadow-2xl z-30 select-none">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1C2436] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#141A29] border border-[#C9A052]/40 flex items-center justify-center shadow-md">
            <Plane className="w-5 h-5 text-[#C9A052] transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className="font-display text-xl font-black tracking-tight"
                style={{ color: "#FF6B00", letterSpacing: "-0.03em" }}
              >
                Orbelo
              </span>
              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-[#C9A052]/15 text-[#C9A052] border border-[#C9A052]/30">
                OPS
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium">Private Jet Management</p>
          </div>
        </div>
      </div>

      {/* Role Badge Indicator */}
      <div className="px-5 py-3 bg-[#0B101A] border-b border-[#1C2436] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {role === "admin" ? (
            <Shield className="w-3.5 h-3.5 text-[#C9A052]" />
          ) : (
            <Plane className="w-3.5 h-3.5 text-[#C9A052]" />
          )}
          <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-gray-300">
            {role === "admin" ? "ADMINISTRATOR" : "CHARTER AGENT"}
          </span>
        </div>
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" title="System Online" />
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        
        {/* Navigation for ADMINISTRATOR */}
        {role === "admin" && (
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">
              Operations Control
            </div>

            <button
              onClick={() => setActiveNav("overview")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === "overview"
                  ? "bg-[#C9A052] text-[#0F1420] font-bold shadow-md shadow-[#C9A052]/20"
                  : "text-gray-300 hover:text-white hover:bg-[#141A29]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className={`w-4 h-4 ${activeNav === "overview" ? "text-[#0F1420]" : "text-[#C9A052]"}`} />
                <span>Overview</span>
              </div>
            </button>

            <button
              onClick={() => setActiveNav("bookings")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === "bookings"
                  ? "bg-[#C9A052] text-[#0F1420] font-bold shadow-md shadow-[#C9A052]/20"
                  : "text-gray-300 hover:text-white hover:bg-[#141A29]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Plane className={`w-4 h-4 ${activeNav === "bookings" ? "text-[#0F1420]" : "text-[#C9A052]"}`} />
                <span>Bookings</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                activeNav === "bookings" ? "bg-[#0F1420] text-white" : "bg-[#1C2436] text-gray-300"
              }`}>
                {bookings.length}
              </span>
            </button>

            {/* Direct Document Generators */}
            <div className="pt-4 px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">
              Generate Actions
            </div>

            <button
              onClick={() => setActiveNav("generate_quote")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === "generate_quote"
                  ? "bg-[#C9A052] text-[#0F1420] font-bold shadow-md shadow-[#C9A052]/20"
                  : "text-gray-300 hover:text-white hover:bg-[#141A29]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FilePlus2 className={`w-4 h-4 ${activeNav === "generate_quote" ? "text-[#0F1420]" : "text-[#C9A052]"}`} />
                <span>Generate Quote</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 ${activeNav === "generate_quote" ? "text-[#0F1420]" : "text-gray-500"}`} />
            </button>

            <button
              onClick={() => setActiveNav("generate_brief")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === "generate_brief"
                  ? "bg-[#C9A052] text-[#0F1420] font-bold shadow-md shadow-[#C9A052]/20"
                  : "text-gray-300 hover:text-white hover:bg-[#141A29]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Compass className={`w-4 h-4 ${activeNav === "generate_brief" ? "text-[#0F1420]" : "text-[#C9A052]"}`} />
                <span>Generate Flight Brief</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 ${activeNav === "generate_brief" ? "text-[#0F1420]" : "text-gray-500"}`} />
            </button>

            <button
              onClick={() => setActiveNav("generate_invoice")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === "generate_invoice"
                  ? "bg-[#C9A052] text-[#0F1420] font-bold shadow-md shadow-[#C9A052]/20"
                  : "text-gray-300 hover:text-white hover:bg-[#141A29]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Receipt className={`w-4 h-4 ${activeNav === "generate_invoice" ? "text-[#0F1420]" : "text-[#C9A052]"}`} />
                <span>Generate Invoice</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 ${activeNav === "generate_invoice" ? "text-[#0F1420]" : "text-gray-500"}`} />
            </button>

            {/* Management & Requests */}
            <div className="pt-4 px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">
              Directory & Pipeline
            </div>

            <button
              onClick={() => setActiveNav("agent_requests")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === "agent_requests"
                  ? "bg-[#C9A052] text-[#0F1420] font-bold shadow-md shadow-[#C9A052]/20"
                  : "text-gray-300 hover:text-white hover:bg-[#141A29]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className={`w-4 h-4 ${activeNav === "agent_requests" ? "text-[#0F1420]" : "text-[#C9A052]"}`} />
                <span>Agent Requests</span>
              </div>
              {pendingRequestsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-400 text-[#0F1420] animate-pulse">
                  {pendingRequestsCount} new
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveNav("clients")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === "clients"
                  ? "bg-[#C9A052] text-[#0F1420] font-bold shadow-md shadow-[#C9A052]/20"
                  : "text-gray-300 hover:text-white hover:bg-[#141A29]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className={`w-4 h-4 ${activeNav === "clients" ? "text-[#0F1420]" : "text-[#C9A052]"}`} />
                <span>Clients</span>
              </div>
            </button>

            <button
              onClick={() => setActiveNav("fleet")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === "fleet"
                  ? "bg-[#C9A052] text-[#0F1420] font-bold shadow-md shadow-[#C9A052]/20"
                  : "text-gray-300 hover:text-white hover:bg-[#141A29]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Shield className={`w-4 h-4 ${activeNav === "fleet" ? "text-[#0F1420]" : "text-[#C9A052]"}`} />
                <span>Fleet Roster</span>
              </div>
            </button>
          </div>
        )}

        {/* Navigation for CHARTER AGENT */}
        {role === "agent" && (
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">
              Agent Quoting Desk
            </div>

            <button
              onClick={() => setActiveNav("agent_overview")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === "agent_overview"
                  ? "bg-[#C9A052] text-[#0F1420] font-bold shadow-md shadow-[#C9A052]/20"
                  : "text-gray-300 hover:text-white hover:bg-[#141A29]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className={`w-4 h-4 ${activeNav === "agent_overview" ? "text-[#0F1420]" : "text-[#C9A052]"}`} />
                <span>Sales Overview</span>
              </div>
            </button>

            <div className="pt-3 px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">
              Submit Requests to Admin
            </div>

            <button
              onClick={() => setActiveNav("request_quote")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === "request_quote"
                  ? "bg-[#C9A052] text-[#0F1420] font-bold shadow-md shadow-[#C9A052]/20"
                  : "text-gray-300 hover:text-white hover:bg-[#141A29]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Send className={`w-4 h-4 ${activeNav === "request_quote" ? "text-[#0F1420]" : "text-[#C9A052]"}`} />
                <span>Request for Quotes</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 ${activeNav === "request_quote" ? "text-[#0F1420]" : "text-gray-500"}`} />
            </button>

            <button
              onClick={() => setActiveNav("request_invoice")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === "request_invoice"
                  ? "bg-[#C9A052] text-[#0F1420] font-bold shadow-md shadow-[#C9A052]/20"
                  : "text-gray-300 hover:text-white hover:bg-[#141A29]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Receipt className={`w-4 h-4 ${activeNav === "request_invoice" ? "text-[#0F1420]" : "text-[#C9A052]"}`} />
                <span>Request for Invoice</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 ${activeNav === "request_invoice" ? "text-[#0F1420]" : "text-gray-500"}`} />
            </button>

            <button
              onClick={() => setActiveNav("request_brief")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === "request_brief"
                  ? "bg-[#C9A052] text-[#0F1420] font-bold shadow-md shadow-[#C9A052]/20"
                  : "text-gray-300 hover:text-white hover:bg-[#141A29]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Compass className={`w-4 h-4 ${activeNav === "request_brief" ? "text-[#0F1420]" : "text-[#C9A052]"}`} />
                <span>Request for Flight Briefs</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 ${activeNav === "request_brief" ? "text-[#0F1420]" : "text-gray-500"}`} />
            </button>

            <div className="pt-3 px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">
              Tracking & Directory
            </div>

            <button
              onClick={() => setActiveNav("my_requests")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === "my_requests"
                  ? "bg-[#C9A052] text-[#0F1420] font-bold shadow-md shadow-[#C9A052]/20"
                  : "text-gray-300 hover:text-white hover:bg-[#141A29]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className={`w-4 h-4 ${activeNav === "my_requests" ? "text-[#0F1420]" : "text-[#C9A052]"}`} />
                <span>My Submitted Requests</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                activeNav === "my_requests" ? "bg-[#0F1420] text-white" : "bg-[#1C2436] text-gray-300"
              }`}>
                {agentRequests.length}
              </span>
            </button>

            <button
              onClick={() => setActiveNav("clients")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === "clients"
                  ? "bg-[#C9A052] text-[#0F1420] font-bold shadow-md shadow-[#C9A052]/20"
                  : "text-gray-300 hover:text-white hover:bg-[#141A29]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className={`w-4 h-4 ${activeNav === "clients" ? "text-[#0F1420]" : "text-[#C9A052]"}`} />
                <span>Clients</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* User Profile at Bottom */}
      <div className="p-4 border-t border-[#1C2436] bg-[#0B101A]">

        {/* User Card with Logout */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-[#C9A052] text-[#0F1420] font-black text-xs flex items-center justify-center flex-shrink-0">
              {currentUser?.name ? currentUser.name.charAt(0) : "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{currentUser?.name || "User"}</p>
              <p className="text-[10px] text-gray-400 font-mono truncate">{currentUser?.email || ""}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#141A29] transition-colors"
            title="Log out and return to Login Screen"
          >
            <LogOut className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
    </aside>
  );
}

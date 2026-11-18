"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    role,
    activeNav,
    setActiveNav,
    agentRequests,
    bookings,
    accounts,
    contacts
  } = useAviation();

  const isRequestsActive = activeNav === "agent_requests" || pathname?.startsWith("/requests");
  const isAccountsActive = activeNav === "accounts" || pathname?.startsWith("/accounts");
  const isContactsActive = activeNav === "contacts" || pathname?.startsWith("/contacts");
  const isOverviewActive = activeNav === "overview" && !pathname?.startsWith("/requests") && !pathname?.startsWith("/accounts") && !pathname?.startsWith("/contacts");
  const isQuotesActive = activeNav === "quotes" || pathname?.startsWith("/quotes");
  const isBookingsActive = activeNav === "bookings" || pathname?.startsWith("/bookings");
  const isPaymentsActive = activeNav === "payments" || pathname?.startsWith("/payments");
  const isInvoicesActive = activeNav === "invoices" || pathname?.startsWith("/invoices");
  const isBriefsActive = activeNav === "flight_briefs" || pathname?.startsWith("/flight-briefs");
  const isContractsActive = activeNav === "contracts" || pathname?.startsWith("/contracts");
  const isAgentsActive = activeNav === "agents" || pathname?.startsWith("/agents");
  const isOperatorsActive = activeNav === "operators" || pathname?.startsWith("/operators");
  const isAirportsActive = activeNav === "airports" || pathname?.startsWith("/airports");

  const navigateTo = (navKey: string, route: string) => {
    setActiveNav(navKey);
    router.push(route);
  };

  return (
    <aside className="w-56 bg-[#0B1320] text-white flex flex-col flex-shrink-0 h-screen sticky top-0 border-r border-[#151D2A] select-none z-30">
      {/* Brand Header */}
      <div className="px-5 py-6 flex items-center gap-2.5">
        <div className="w-4 h-4 rounded-[4px] bg-[#E59700] flex-shrink-0" />
        <span className="font-bold text-white text-base tracking-tight font-sans">
          Orbelo
        </span>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-5 text-xs font-sans">
        {/* Overview */}
        <div>
          <button
            onClick={() => navigateTo("overview", "/")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isOverviewActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Overview</span>
          </button>
        </div>

        {/* WORK Section */}
        <div className="space-y-0.5">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            WORK
          </div>
          <button
            onClick={() => navigateTo("agent_requests", "/requests")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isRequestsActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Requests</span>
            <span className="text-xs text-gray-400 font-mono">4</span>
          </button>

          <button
            onClick={() => navigateTo("quotes", "/quotes")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isQuotesActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Quotes</span>
            <span className="text-xs text-gray-400 font-mono">9</span>
          </button>

          <button
            onClick={() => navigateTo("bookings", "/bookings")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isBookingsActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Bookings</span>
            <span className="text-xs text-gray-400 font-mono">5</span>
          </button>

          <button
            onClick={() => navigateTo("payments", "/payments")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isPaymentsActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Payments</span>
            <span className="text-xs text-gray-400 font-mono">3</span>
          </button>
        </div>

        {/* DOCUMENTS Section */}
        <div className="space-y-0.5">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            DOCUMENTS
          </div>
          <button
            onClick={() => navigateTo("invoices", "/invoices")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isInvoicesActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Invoices & credit notes</span>
          </button>
          <button
            onClick={() => navigateTo("flight_briefs", "/flight-briefs")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isBriefsActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Flight briefs</span>
          </button>
          <button
            onClick={() => navigateTo("contracts", "/contracts")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isContractsActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Contracts</span>
          </button>
        </div>

        {/* DIRECTORY Section */}
        <div className="space-y-0.5">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            DIRECTORY
          </div>
          <button
            onClick={() => navigateTo("accounts", "/accounts")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isAccountsActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Accounts</span>
          </button>
          <button
            onClick={() => navigateTo("contacts", "/contacts")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isContactsActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Contacts</span>
          </button>
          <button
            onClick={() => navigateTo("agents", "/agents")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isAgentsActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Agents</span>
          </button>
          <button
            onClick={() => navigateTo("operators", "/operators")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isOperatorsActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Operators</span>
          </button>
          <button
            onClick={() => navigateTo("airports", "/airports")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isAirportsActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Airports</span>
          </button>
          <button
            onClick={() => navigateTo("airports", "/airports")}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#141C2B] transition-all"
          >
            <span>FBOs</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

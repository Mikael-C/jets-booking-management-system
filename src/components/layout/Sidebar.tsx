"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { LogOut } from "lucide-react";

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
    contacts,
    operators,
    unreadMessageCount,
    currentUser,
    logout
  } = useAviation();

  const isRequestsActive = activeNav === "agent_requests" || pathname?.startsWith("/requests");
  const isAccountsActive = activeNav === "accounts" || pathname?.startsWith("/accounts");
  const isContactsActive = activeNav === "contacts" || pathname?.startsWith("/contacts");
  const isOverviewActive = (activeNav === "overview" && (pathname === "/" || pathname === "/overview")) || false;
  const isQuotesActive = activeNav === "quotes" || pathname?.startsWith("/quotes");
  const isBookingsActive = activeNav === "bookings" || pathname?.startsWith("/bookings");
  const isPaymentsActive = activeNav === "payments" || pathname?.startsWith("/payments");
  const isInvoicesActive = activeNav === "invoices" || pathname?.startsWith("/invoices");
  const isBriefsActive = activeNav === "flight_briefs" || pathname?.startsWith("/flight-briefs");
  const isContractsActive = activeNav === "contracts" || pathname?.startsWith("/contracts");
  const isAgentsActive = activeNav === "agents" || pathname?.startsWith("/agents");
  const isOperatorsActive = activeNav === "operators" || pathname?.startsWith("/operators");
  const isAircraftTypesActive = activeNav === "aircraft_types" || activeNav === "fleet" || pathname?.startsWith("/aircraft-types");
  const isAirportsActive = activeNav === "airports" || pathname?.startsWith("/airports");
  const isSettingsActive = activeNav === "settings" || pathname?.startsWith("/settings");
  const isMessagesActive = activeNav === "messages" || pathname?.startsWith("/messages");
  const isActivitiesActive = activeNav === "activities" || pathname?.startsWith("/activities");
  const isProfileActive = activeNav === "profile" || pathname?.startsWith("/profile");
  const isFlightWatchActive = activeNav === "flight_watch" || pathname?.startsWith("/flight-watch");
  const isLibraryActive = activeNav === "manuals_policies" || activeNav === "library" || pathname?.startsWith("/manuals-and-policies") || pathname?.startsWith("/library");
  const isCuratorsActive = activeNav === "curators" || activeNav === "curator_tiers" || pathname?.startsWith("/curators") || pathname?.startsWith("/settings/curators");
  const isFbosActive = activeNav === "fbos" || pathname?.startsWith("/fbos");

  const navigateTo = (navKey: string, route: string) => {
    setActiveNav(navKey);
    router.push(route);
  };

  return (
    <aside className="w-56 bg-[#0B1320] text-white flex flex-col flex-shrink-0 h-screen sticky top-0 border-r border-[#151D2A] select-none z-30">
      {/* Brand Header */}
      <div className="px-5 py-6 flex items-center gap-2.5 flex-shrink-0">
        <div className="w-4 h-4 rounded-[4px] bg-[#E59700] flex-shrink-0" />
        <span className="font-bold text-white text-base tracking-tight font-sans">
          Orbelo
        </span>
      </div>

      {/* Nav List - Scrollable with invisible scrollbar */}
      <div className="flex-1 overflow-y-auto px-3 space-y-5 text-xs font-sans no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
          </button>

          <button
            onClick={() => navigateTo("flight_watch", "/flight-watch")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isFlightWatchActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Flight watch</span>
          </button>

          <button
            onClick={() => navigateTo("messages", "/messages")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isMessagesActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Messages</span>
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

        {/* LIBRARY Section */}
        <div className="space-y-0.5">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            LIBRARY
          </div>
          <button
            onClick={() => navigateTo("manuals_policies", "/manuals-and-policies")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isLibraryActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Manuals & policies</span>
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
            onClick={() => navigateTo("curators", "/curators")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isCuratorsActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Curators</span>
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
            onClick={() => navigateTo("aircraft_types", "/aircraft-types")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isAircraftTypesActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Aircraft types</span>
          </button>
          <button
            onClick={() => navigateTo("airports", "/airports")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isAirportsActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Airports & FBOs</span>
          </button>
         
        </div>

        {/* CONFIGURATION & SYSTEM Section */}
        <div className="space-y-0.5 pb-4">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            CONFIGURATION & SYSTEM
          </div>
          <button
            onClick={() => navigateTo("settings", "/settings")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isSettingsActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Settings</span>
          </button>

          <button
            onClick={() => navigateTo("messages", "/messages")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isMessagesActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Messages & Chat</span>
          </button>

          <button
            onClick={() => navigateTo("activities", "/activities")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isActivitiesActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Activities</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" title="Live Events Active" />
          </button>

          <button
            onClick={() => navigateTo("profile", "/profile")}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
              isProfileActive
                ? "bg-[#1E293B] text-white font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#141C2B]"
            }`}
          >
            <span>Profile</span>
          </button>
        </div>
      </div>

      {/* User Footer Card */}
      {currentUser && (
        <div className="p-3 border-t border-[#151D2A] flex items-center justify-between bg-[#0B1320] flex-shrink-0">
          <button
            onClick={() => navigateTo("profile", "/profile")}
            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-85 transition-opacity"
          >
            <div className="w-7 h-7 rounded-full bg-[#E59700]/20 border border-[#E59700]/40 text-[#E59700] flex items-center justify-center font-bold text-xs flex-shrink-0">
              {currentUser.name ? currentUser.name.charAt(0) : "M"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-white truncate">
                {currentUser.name || "Maximilian von Bern"}
              </div>
              <div className="text-[10px] text-gray-500 truncate">
                {currentUser.email || "superadmin@orbelo.com"}
              </div>
            </div>
          </button>
          <button
            onClick={logout}
            title="Sign out"
            className="text-gray-500 hover:text-white p-1 rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </aside>
  );
}

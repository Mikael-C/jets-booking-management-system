"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAviation } from "@/lib/aviationContext";
import { Search, Plus, RotateCcw, Clock, Shield, Plane, Sparkles, Bell, Check, X, AlertTriangle, Info, CheckCircle2, Coins, User, MessageSquare } from "lucide-react";

export default function TopHeader() {
  const {
    role,
    activeNav,
    setActiveNav,
    searchQuery,
    setSearchQuery,
    openNewQuoteModal,
    resetToDefaultData,
    notifications,
    markNotificationRead,
    tokenBalance,
    openTokenModal,
    unreadMessageCount
  } = useAviation();

  const [utcTime, setUtcTime] = useState("");
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

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

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getSectionTitle = () => {
    switch (activeNav) {
      case "overview":
        return { section: "Operations Command", title: "Operations Overview & Fleet Readiness" };
      case "bookings":
        return { section: "Operations Control", title: "Charter Bookings & Flight Dispatch" };
      case "sourcing":
        return { section: "Admin Queue", title: "Sourcing Log & Operator Responses" };
      case "generate_quote":
        return { section: "Actions", title: "Generate Official Private Charter Quote" };
      case "generate_brief":
        return { section: "Actions", title: "Generate Flight Operations Brief" };
      case "generate_invoice":
        return { section: "Actions", title: "Generate Commercial Tax Invoice" };
      case "agent_requests":
        return { section: "Incoming Queue", title: "Agent Inquiries & RFQ Fulfillment" };
      case "operators":
        return { section: "Reference Data", title: "Operator Management & Qualification" };
      case "payments":
        return { section: "Finance", title: "Payments & Invoice Management" };
      case "activities":
      case "audit_log":
        return { section: "Governance & Security", title: "Activities & Application Audit Trail" };
      case "users":
      case "user_management":
        return { section: "Administration", title: "User & Role-Based Access Control (RBAC)" };
      case "generate_contract":
        return { section: "Actions", title: "Generate Master Charter Broker Agreement" };
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
      case "client_portal":
        return { section: "Client Portal", title: "Client Portal Preview — Quote, Signature, Passengers & Payment" };
      case "notifications":
        return { section: "Communications", title: "Notification Settings & Email Templates" };
      case "messages":
        return { section: "Communications", title: "In-App Messages & Executive Dispatch" };
      case "profile":
        return { section: "User Account", title: "User Profile & Security Settings" };
      default:
        return { section: "Portal", title: "Private Jet Booking Management" };
    }
  };

  const navInfo = getSectionTitle();

  const getRoleBadgeLabel = () => {
    switch (role) {
      case "super_admin":
        return "SUPER ADMIN";
      case "finance":
        return "FINANCE";
      case "operations":
        return "OPERATIONS";
      case "agent":
        return "AGENT";
      case "admin":
      default:
        return "ADMIN";
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />;
      case "success":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />;
      case "error":
        return <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />;
      case "info":
      default:
        return <Info className="w-3.5 h-3.5 text-[#C9A052] flex-shrink-0" />;
    }
  };

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
            {getRoleBadgeLabel()}
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

      {/* Right Controls: Zulu Clock, Notifications, Reset Demo, Action CTA */}
      <div className="flex items-center gap-3">
        {/* Aviation Zulu Clock */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E0DAD0] text-[11px] font-mono text-[#0F1420]/80 shadow-sm">
          <Clock className="w-3.5 h-3.5 text-[#C9A052]" />
          <span>{utcTime || "UTC Zulu Active"}</span>
        </div>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
            title="System Notifications"
            className="relative p-2 rounded-xl bg-white border border-[#E0DAD0] text-[#0F1420]/70 hover:text-[#0F1420] hover:border-[#C9A052] transition-colors shadow-sm"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C9A052] text-[9px] font-mono font-bold text-[#0F1420] shadow-sm animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0F1420] text-white border border-[#1C2436] shadow-2xl z-50 overflow-hidden">
              <div className="p-3.5 border-b border-[#1C2436] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#C9A052]" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-200">
                    Notifications & Alerts
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#141A29] text-[#C9A052] border border-[#C9A052]/30">
                  {unreadCount} new
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[#1C2436]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400">
                    No notifications at this time.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3.5 text-xs transition-colors flex items-start gap-3 ${
                        notif.read ? "bg-[#0F1420]/60 opacity-60" : "bg-[#141A29]/80"
                      }`}
                    >
                      <div className="mt-0.5">{getNotifIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-white text-[11px] truncate">
                            {notif.title}
                          </p>
                          <span className="text-[9px] font-mono text-gray-400 whitespace-nowrap">
                            {notif.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-300 mt-0.5 leading-snug">
                          {notif.message}
                        </p>
                        {!notif.read && (
                          <button
                            onClick={() => markNotificationRead(notif.id)}
                            className="mt-2 text-[10px] font-mono font-bold text-[#C9A052] hover:underline flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark as read</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Agent Token Balance Pill */}
        {role === "agent" && (
          <button
            onClick={() => openTokenModal("Refill your agent tokens")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-[#C9A052]/40 text-[#0F1420] hover:bg-amber-500/20 transition-all text-xs font-mono font-bold shadow-sm cursor-pointer"
            title="Agent Token Balance - Click to refill or view details"
          >
            <Coins className="w-3.5 h-3.5 text-[#C9A052]" />
            <span>{tokenBalance.toLocaleString()} Tokens</span>
          </button>
        )}

        {/* Messages Quick Button */}
        <button
          onClick={() => setActiveNav("messages")}
          className={`relative p-2 rounded-xl border transition-colors shadow-sm cursor-pointer ${
            activeNav === "messages"
              ? "bg-[#0F1420] text-white border-[#0F1420]"
              : "bg-white border-[#E0DAD0] text-[#0F1420]/70 hover:text-[#0F1420] hover:border-[#C9A052]"
          }`}
          title="In-App Messages & Dispatch"
        >
          <MessageSquare className="w-4 h-4" />
          {unreadMessageCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-[#C9A052] text-[#0F1420] font-mono font-black text-[9px] flex items-center justify-center shadow-sm">
              {unreadMessageCount}
            </span>
          )}
        </button>

        {/* Profile & Account Quick Button */}
        <button
          onClick={() => setActiveNav("profile")}
          className={`p-2 rounded-xl border transition-colors shadow-sm cursor-pointer ${
            activeNav === "profile"
              ? "bg-[#0F1420] text-white border-[#0F1420]"
              : "bg-white border-[#E0DAD0] text-[#0F1420]/70 hover:text-[#0F1420] hover:border-[#C9A052]"
          }`}
          title="User Profile & Account Settings"
        >
          <User className="w-4 h-4" />
        </button>

        {/* Reset Demo State Button */}
        <button
          onClick={resetToDefaultData}
          title="Reset database to seed demo records"
          className="p-2 rounded-xl bg-white border border-[#E0DAD0] text-[#0F1420]/60 hover:text-[#0F1420] hover:border-[#C9A052] transition-colors shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Primary Gold Action CTA */}
        {role !== "agent" ? (
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

"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { AgentRequest } from "@/types/aviation";

interface AgentRequestsQueueViewProps {
  selectedRequestId?: string;
}

export default function AgentRequestsQueueView({ selectedRequestId }: AgentRequestsQueueViewProps = {}) {
  const router = useRouter();
  const {
    agentRequests,
    accounts,
    addMessage,
    updateAgentRequestStatus,
    openNewQuoteModal,
    setActiveNav
  } = useAviation();

  const [activeReqId, setActiveReqId] = useState<string | null>(selectedRequestId || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPill, setFilterPill] = useState<"new" | "sourcing" | "quoted" | "declined" | "all">("new");
  const [agentFilter, setAgentFilter] = useState("all");
  const [chatMessage, setChatMessage] = useState("");

  // Sync selectedRequestId prop if passed
  React.useEffect(() => {
    if (selectedRequestId) {
      setActiveReqId(selectedRequestId);
    }
  }, [selectedRequestId]);

  const activeRequest = useMemo(() => {
    if (!activeReqId) return null;
    return agentRequests.find((r) => r.id === activeReqId) || null;
  }, [activeReqId, agentRequests]);

  const linkedAccount = useMemo(() => {
    if (!activeRequest) return null;
    return (
      accounts.find(
        (a) =>
          a.id === activeRequest.accountId ||
          a.name === activeRequest.companyName ||
          a.name === activeRequest.clientName
      ) || null
    );
  }, [activeRequest, accounts]);

  // Counts for filter pills
  const counts = useMemo(() => {
    const newCount = agentRequests.filter((r) => r.status === "pending").length;
    const sourcingCount = agentRequests.filter((r) => r.status === "in_sourcing").length;
    const quotedCount = agentRequests.filter((r) => r.status === "completed").length;
    const declinedCount = agentRequests.filter((r) => r.status === "declined").length;
    return {
      new: newCount,
      sourcing: sourcingCount,
      quoted: quotedCount,
      declined: declinedCount,
      all: agentRequests.length
    };
  }, [agentRequests]);

  // Available unique agents for the dropdown
  const uniqueAgents = useMemo(() => {
    const set = new Set<string>();
    agentRequests.forEach((r) => {
      if (r.agentName) set.add(r.agentName);
    });
    return Array.from(set);
  }, [agentRequests]);

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    return agentRequests.filter((req) => {
      // Filter pill
      if (filterPill === "new" && req.status !== "pending") return false;
      if (filterPill === "sourcing" && req.status !== "in_sourcing") return false;
      if (filterPill === "quoted" && req.status !== "completed") return false;
      if (filterPill === "declined" && req.status !== "declined") return false;

      // Agent dropdown filter
      if (agentFilter !== "all" && req.agentName !== agentFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = req.id.toLowerCase().includes(q);
        const matchAgent = req.agentName?.toLowerCase().includes(q);
        const matchRoute = req.route?.toLowerCase().includes(q) || req.originIcao?.toLowerCase().includes(q) || req.destIcao?.toLowerCase().includes(q);
        const matchClient = req.clientName?.toLowerCase().includes(q) || req.companyName?.toLowerCase().includes(q);
        const matchCat = req.categoryLabel?.toLowerCase().includes(q) || req.aircraftPreference?.toLowerCase().includes(q);
        if (!matchId && !matchAgent && !matchRoute && !matchClient && !matchCat) return false;
      }

      return true;
    });
  }, [agentRequests, filterPill, agentFilter, searchQuery]);

  const handleOpenRequest = (req: AgentRequest) => {
    setActiveReqId(req.id);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/requests/${req.id}`);
    }
  };

  const handleBackToList = () => {
    setActiveReqId(null);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/requests`);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !activeRequest) return;

    addMessage(activeRequest.id, {
      senderName: "Obi",
      senderRole: "Operations Desk",
      content: chatMessage.trim(),
      isFromAdmin: true
    });
    setChatMessage("");
  };

  const handleDecline = () => {
    if (!activeRequest) return;
    updateAgentRequestStatus(activeRequest.id, "declined");
  };

  const handleCreateQuote = () => {
    if (!activeRequest) return;
    router.push(`/quotes/new?fromRequest=${encodeURIComponent(activeRequest.id)}`);
  };

  const getReceivedBadge = (req: AgentRequest) => {
    if (req.isOverdue || req.receivedAgo?.includes("overdue")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">
          {req.receivedAgo || "40 m · overdue"}
        </span>
      );
    }
    if (req.receivedAgo?.includes("m") && !req.receivedAgo?.includes("h")) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
          {req.receivedAgo}
        </span>
      );
    }
    return <span className="text-xs text-gray-700">{req.receivedAgo || "2 h"}</span>;
  };

  const getStatusBadge = (req: AgentRequest) => {
    if (req.status === "pending") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-800">
          New
        </span>
      );
    }
    if (req.status === "in_sourcing") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-800">
          {req.statusLabel || "Sourcing · 4 offers"}
        </span>
      );
    }
    if (req.status === "completed") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
          {req.statusLabel || "Quoted → RB3310"}
        </span>
      );
    }
    if (req.status === "declined") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
          {req.statusLabel || "Declined · no aircraft"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">
        {req.status}
      </span>
    );
  };

  // ==========================================
  // VIEW: DETAILS SCREEN (SCREEN 3)
  // ==========================================
  if (activeRequest) {
    const isRoundTrip = activeRequest.tripType === "round_trip" || activeRequest.route.includes("⇄");
    const leg1Str = activeRequest.leg1Text || `${activeRequest.originIcao || "LFPB"} → ${activeRequest.destIcao || "DNAA"} · ${activeRequest.flightDateFormatted || "24 Nov"} 08:30 LT ±2 h · ${activeRequest.paxCount} pax`;
    const leg2Str = activeRequest.leg2Text || (isRoundTrip ? `${activeRequest.destIcao || "DNAA"} → ${activeRequest.originIcao || "LFPB"} · 30 Nov 16:00 LT · ${activeRequest.paxCount} pax` : null);

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <button
            onClick={handleBackToList}
            className="hover:text-gray-900 transition-colors"
          >
            Requests
          </button>
          <span>/</span>
          <span className="text-gray-800">{activeRequest.id}</span>
        </div>

        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {activeRequest.title || `${activeRequest.id} · Paris ⇄ Abuja`}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              From agent {activeRequest.agentName}{" "}
              {activeRequest.agentCompany ? `(${activeRequest.agentCompany})` : "(Monaco Luxury Jet Brokers)"} · received{" "}
              {activeRequest.flightDateFormatted || "14 Nov"} 11:20 · {activeRequest.tokensUsed ?? 1} token used
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                const inputEl = document.getElementById("request-message-input");
                inputEl?.focus();
              }}
              className="bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 text-xs font-medium px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
            >
              Message agent
            </button>
            <button
              onClick={handleDecline}
              className="bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 text-xs font-medium px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
            >
              Decline
            </button>
            <button
              onClick={handleCreateQuote}
              className="bg-[#111827] text-white hover:bg-gray-800 text-xs font-semibold px-4 py-1.5 rounded-lg shadow-sm transition-all"
            >
              Create quote
            </button>
          </div>
        </div>

        {/* 2-Column Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Request Details Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-5">Request</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                {/* Row 1 */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    CLIENT
                  </div>
                  <div className="font-medium text-gray-900">
                    <button
                      onClick={() => {
                        const accId = linkedAccount?.accountNumber || linkedAccount?.id;
                        setActiveNav("accounts");
                        if (typeof window !== "undefined") {
                          window.history.pushState(null, "", accId ? `/accounts/${accId}` : `/accounts`);
                        }
                      }}
                      className="hover:underline text-blue-600 font-semibold"
                    >
                      {activeRequest.clientName || activeRequest.companyName || (linkedAccount ? linkedAccount.name : "Direct Client")}
                    </button>
                    {activeRequest.passengerNames && (
                      <div className="text-gray-600 font-normal mt-0.5">
                        {activeRequest.passengerNames}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    TRIP TYPE
                  </div>
                  <div className="font-medium text-gray-900">
                    {isRoundTrip ? "Round trip" : "One way"}
                  </div>
                </div>

                {/* Row 2: Leg 1 and Leg 2 */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    LEG 1
                  </div>
                  <div className="font-medium text-gray-900">{leg1Str}</div>
                </div>

                {leg2Str ? (
                  <div>
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      LEG 2
                    </div>
                    <div className="font-medium text-gray-900">{leg2Str}</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      RETURN DATE
                    </div>
                    <div className="font-medium text-gray-900">None (One way)</div>
                  </div>
                )}

                {/* Row 3 */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    CATEGORY
                  </div>
                  <div className="font-medium text-gray-900">
                    {activeRequest.categoryLabel || activeRequest.aircraftPreference || "Super midsize or heavy"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    LAVATORY
                  </div>
                  <div className="font-medium text-gray-900">
                    {activeRequest.lavatoryPreference || "Enclosed, required"}
                  </div>
                </div>

                {/* Row 4 */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    LUGGAGE
                  </div>
                  <div className="font-medium text-gray-900">
                    {activeRequest.luggageDetailsText || "6 large suitcases, 2 soft bags · ≈ 170 kg"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    PETS
                  </div>
                  <div className="font-medium text-gray-900">
                    {activeRequest.petDetailsText || "None"}
                  </div>
                </div>

                {/* Row 5 */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    SERVICES
                  </div>
                  <div className="font-medium text-gray-900">
                    {activeRequest.servicesText || "Limousine on arrival DNAA · VIP menu 1"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    ASK OPERATOR
                  </div>
                  <div className="font-medium text-gray-900">
                    {activeRequest.askOperatorText || "De-icing protection"}
                  </div>
                </div>

                {/* Row 6 */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    AGENT MARGIN
                  </div>
                  <div className="font-medium text-gray-900">
                    {activeRequest.agentMarginPct || 10} %
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    PAYMENT
                  </div>
                  <div className="font-medium text-gray-900">
                    {activeRequest.paymentMethodText || "Bank transfer"}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages with agent Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Messages with agent</h2>

              <div className="space-y-4 mb-4">
                {/* Default/Initial Thread */}
                {(!activeRequest.messages || activeRequest.messages.length === 0) ? (
                  <>
                    <div>
                      <div className="text-[11px] text-gray-500 font-medium mb-1">
                        C. Laurent · 11:20
                      </div>
                      <div className="bg-gray-100/80 rounded-lg p-3 text-xs text-gray-800 leading-relaxed max-w-xl">
                        Client is flexible on the outbound by two hours. Stand-up cabin preferred.
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 font-medium mb-1">
                        Obi · 11:42
                      </div>
                      <div className="bg-[#EAF2FA] border border-[#D5E5F5] rounded-lg p-3 text-xs text-gray-800 leading-relaxed max-w-xl">
                        Sourcing now. First offers within the hour.
                      </div>
                    </div>
                  </>
                ) : (
                  activeRequest.messages.map((msg) => (
                    <div key={msg.id}>
                      <div className="text-[11px] text-gray-500 font-medium mb-1">
                        {msg.senderName} · {msg.timestamp}
                      </div>
                      <div
                        className={`rounded-lg p-3 text-xs text-gray-800 leading-relaxed max-w-xl ${
                          msg.isFromAdmin
                            ? "bg-[#EAF2FA] border border-[#D5E5F5]"
                            : "bg-gray-100/80"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Composer */}
              <form onSubmit={handleSendMessage} className="space-y-2">
                <textarea
                  id="request-message-input"
                  rows={2}
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Write to the agent..."
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 text-xs font-semibold px-4 py-1.5 rounded-lg shadow-sm transition-all"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-5">
              {/* STATUS */}
              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  STATUS
                </div>
                <div className="text-xs font-semibold text-gray-900">
                  {activeRequest.status === "in_sourcing" ? "Sourcing" : activeRequest.status}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {activeRequest.offersLoggedText || "4 operator offers logged"}
                </div>
              </div>

              {/* AGENT */}
              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  AGENT
                </div>
                <div className="text-xs font-semibold text-gray-900">
                  {activeRequest.agentName}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Conversion {activeRequest.agentConversionRate || "31 %"} · {activeRequest.agentTokensRemaining ?? 8} tokens left
                </div>
              </div>

              {/* ACCOUNT */}
              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  ACCOUNT
                </div>
                <div className="text-xs font-semibold text-gray-900">
                  <button
                    onClick={() => {
                      const accId = linkedAccount?.accountNumber || linkedAccount?.id;
                      setActiveNav("accounts");
                      if (typeof window !== "undefined") {
                        window.history.pushState(null, "", accId ? `/accounts/${accId}` : `/accounts`);
                      }
                    }}
                    className="hover:underline text-blue-600"
                  >
                    {activeRequest.companyName || (linkedAccount ? linkedAccount.name : activeRequest.clientName || "Corporate Account")}
                  </button>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {linkedAccount?.accountNumber || `ACC-${activeRequest.id.replace(/[^0-9]/g, "") || "30877"}`} · {activeRequest.accountEarlierTrips ?? linkedAccount?.totalBookings ?? 0} earlier trips
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 px-1 leading-relaxed">
              &ldquo;Create quote&rdquo; opens the New quote builder pre-filled with everything above and creates trip {activeRequest.createdTripId || `MX${activeRequest.id.replace(/[^0-9]/g, "") || "5521"}`}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: LIST SCREEN (SCREEN 2)
  // ==========================================
  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Requests</h1>

      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search input + Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search request, agent, ICAO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3.5 py-1.5 text-xs text-gray-900 placeholder-gray-400 w-64 focus:outline-none focus:border-gray-400 shadow-sm transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterPill("new")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterPill === "new"
                  ? "bg-[#111827] text-white shadow-sm"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              New {counts.new}
            </button>
            <button
              onClick={() => setFilterPill("sourcing")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterPill === "sourcing"
                  ? "bg-[#111827] text-white shadow-sm"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              Sourcing {counts.sourcing}
            </button>
            <button
              onClick={() => setFilterPill("quoted")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterPill === "quoted"
                  ? "bg-[#111827] text-white shadow-sm"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              Quoted
            </button>
            <button
              onClick={() => setFilterPill("declined")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterPill === "declined"
                  ? "bg-[#111827] text-white shadow-sm"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              Declined
            </button>
            <button
              onClick={() => setFilterPill("all")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterPill === "all"
                  ? "bg-[#111827] text-white shadow-sm"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Right: Agent Dropdown */}
        <div>
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="bg-white border border-gray-200 text-gray-700 rounded-full px-3 py-1 text-xs font-medium focus:outline-none focus:border-gray-400 shadow-sm cursor-pointer"
          >
            <option value="all">Agent: all</option>
            {uniqueAgents.map((agent) => (
              <option key={agent} value={agent}>
                {agent}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-white">
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  REQUEST
                </th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  RECEIVED
                </th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  AGENT
                </th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  ROUTE
                </th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  FLIGHT
                </th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  PAX
                </th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  CATEGORY
                </th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  TOKENS
                </th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-[11px] uppercase tracking-wider">
                  STATUS
                </th>
                <th className="py-3.5 px-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRequests.map((req) => (
                <tr
                  key={req.id}
                  onClick={() => handleOpenRequest(req)}
                  className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-mono font-medium text-gray-900">
                    {req.id}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getReceivedBadge(req)}
                  </td>
                  <td className="py-3.5 px-4 text-gray-900 font-medium">
                    {req.agentName}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-900">
                    {req.routeDisplay || req.route}
                  </td>
                  <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                    {req.flightDateFormatted || req.flightDate}
                  </td>
                  <td className="py-3.5 px-4 text-gray-700">
                    {req.paxCount}
                  </td>
                  <td className="py-3.5 px-4 text-gray-700">
                    {req.categoryLabel || req.aircraftPreference || "Light"}
                  </td>
                  <td className="py-3.5 px-4 text-gray-700">
                    {req.tokensUsed ?? 1}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getStatusBadge(req)}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenRequest(req);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}

              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-xs text-gray-400">
                    No requests found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="py-3.5 px-4 border-t border-gray-100 text-[11px] text-gray-400 leading-relaxed bg-white">
          Oldest new request first. A request becomes overdue after 30 minutes without action (set in Settings). Opening it shows the request page, and &ldquo;Create quote&rdquo; turns it into a trip.
        </div>
      </div>
    </div>
  );
}

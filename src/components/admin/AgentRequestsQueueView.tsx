"use client";

import React, { useState, useMemo } from "react";
import TablePager, { usePagedRows } from "@/components/ui/TablePager";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { AgentRequest } from "@/types/aviation";
import { HeaderId } from "@/components/ui/DocId";
import { toast } from "@/components/ui/Toaster";
import { api } from "@/lib/api";

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
    setActiveNav,
    settings,
    refreshAgentRequests,
    agentRequestsLoaded
  } = useAviation();

  // Ticks every 30 s so "received" times and the overdue flag stay current
  const [now, setNow] = useState(() => Date.now());
  const [loadError, setLoadError] = useState<string | null>(null);
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  React.useEffect(() => {
    refreshAgentRequests()
      .then(() => setLoadError(null))
      .catch(() => setLoadError("The requests could not be loaded from the server."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overdueMinutes = Number(settings?.requestOverdueMinutes) || 30;
  const minutesSince = (req: AgentRequest) => {
    const t = new Date(req.createdAt).getTime();
    return Number.isNaN(t) ? null : Math.max(0, Math.floor((now - t) / 60000));
  };
  const agoText = (mins: number) =>
    mins < 60 ? `${mins} m` : mins < 60 * 24 ? `${Math.floor(mins / 60)} h` : `${Math.floor(mins / (60 * 24))} d`;
  const isOverdue = (req: AgentRequest) => {
    const m = minutesSince(req);
    return req.status === "pending" && m !== null && m >= overdueMinutes;
  };
  const receivedAt = (req: AgentRequest) => {
    const d = new Date(req.createdAt);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  };

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
    // Newest request first on every tab (the number breaks ties when two arrive at the same time)
    const byTime = (r: AgentRequest) =>
      new Date((r as any).createdAt || (r as any).receivedAt || (r as any).updatedAt || 0).getTime() || 0;
    const byNumber = (r: AgentRequest) => String(r.requestNumber || r.id || "");
    return [...agentRequests]
      .sort((a, b) => byTime(b) - byTime(a) || byNumber(b).localeCompare(byNumber(a), undefined, { numeric: true }))
      .filter((req) => {
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
        const matchId = (req.requestNumber || req.id).toLowerCase().includes(q);
        const matchAgent = req.agentName?.toLowerCase().includes(q);
        const matchRoute = req.route?.toLowerCase().includes(q) || req.originIcao?.toLowerCase().includes(q) || req.destIcao?.toLowerCase().includes(q);
        const matchClient = req.clientName?.toLowerCase().includes(q) || req.companyName?.toLowerCase().includes(q);
        const matchCat = req.categoryLabel?.toLowerCase().includes(q) || req.aircraftPreference?.toLowerCase().includes(q);
        if (!matchId && !matchAgent && !matchRoute && !matchClient && !matchCat) return false;
      }

      return true;
    });
  }, [agentRequests, filterPill, agentFilter, searchQuery]);

  // Pagination: 15 per page, back to page 1 when the tab, agent or search changes
  const paged = usePagedRows(filteredRequests, 15, JSON.stringify([filterPill, agentFilter, searchQuery]));

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

  // Replies go to the Curator through the backend (they show on the Curator's request page)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !activeRequest) return;
    const text = chatMessage.trim();
    try {
      await api.curatorInbox.reply(activeRequest.requestNumber || activeRequest.id, text);
      setChatMessage("");
      toast(`Message sent to ${activeRequest.agentName || "the Curator"} on ${activeRequest.requestNumber || activeRequest.id}.`);
      refreshAgentRequests().catch(() => undefined);
    } catch (err: any) {
      toast(err?.message || "The message could not be sent.", "error");
    }
  };

  const handleDecline = async () => {
    if (!activeRequest) return;
    if (!window.confirm(`Decline ${activeRequest.requestNumber || activeRequest.id}? The Curator's tokens for it are returned.`)) return;
    try {
      await updateAgentRequestStatus(activeRequest.id, "declined");
      toast(`${activeRequest.requestNumber || activeRequest.id} declined. ${activeRequest.agentName || "The Curator"} has been told.`);
    } catch (err: any) {
      toast(err?.message || "The request could not be declined.", "error");
    }
  };

  const handleCreateQuote = () => {
    if (!activeRequest) return;
    router.push(`/quotes/new?fromRequest=${encodeURIComponent(activeRequest.id)}`);
  };

  const getReceivedBadge = (req: AgentRequest) => {
    const mins = minutesSince(req);
    if (mins === null) return <span className="text-xs text-gray-400">—</span>;
    const text = agoText(mins);
    if (isOverdue(req)) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">
          {text} · overdue
        </span>
      );
    }
    if (req.status === "pending" && mins < 60) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
          {text}
        </span>
      );
    }
    return <span className="text-xs text-gray-700">{text}</span>;
  };

  const offersCount = (req: AgentRequest) => (Array.isArray(req.sourcingOptions) ? req.sourcingOptions.length : 0);
  const quotedRef = (req: AgentRequest) => {
    const raw = req.quoteGroupId || req.tripId || "";
    return raw ? raw.replace(/^(QUO|TRI)-/, "") : "";
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
          Sourcing{offersCount(req) ? ` · ${offersCount(req)} offer${offersCount(req) === 1 ? "" : "s"}` : ""}
        </span>
      );
    }
    if (req.status === "completed") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
          Quoted{quotedRef(req) ? ` → ${quotedRef(req)}` : ""}
        </span>
      );
    }
    if (req.status === "declined") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
          Declined
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
    // Every leg of the request, the first one included (multiLegs is normalised to the full list)
    const allLegs: { originIcao?: string; destIcao?: string; flightDate?: string; departureTime?: string; paxCount?: number }[] =
      activeRequest.multiLegs && activeRequest.multiLegs.length
        ? activeRequest.multiLegs
        : [
            { originIcao: activeRequest.originIcao, destIcao: activeRequest.destIcao, flightDate: activeRequest.flightDate, departureTime: activeRequest.departureTime },
            ...((activeRequest.tripType === "round_trip" || (activeRequest.route || "").includes("⇄")) && activeRequest.returnFlightDate
              ? [{ originIcao: activeRequest.destIcao, destIcao: activeRequest.originIcao, flightDate: activeRequest.returnFlightDate, departureTime: (activeRequest as any).returnDepartureTime }]
              : [])
          ];
    const isMultiLeg = allLegs.length > 2 || activeRequest.tripType === "multi_leg";
    const isRoundTrip =
      !isMultiLeg &&
      (activeRequest.tripType === "round_trip" ||
        (activeRequest.route || "").includes("⇄") ||
        (allLegs.length === 2 && allLegs[1].originIcao === allLegs[0].destIcao && allLegs[1].destIcao === allLegs[0].originIcao));
    const day = (v?: string) => {
      if (!v) return "";
      const d = new Date(v.length === 10 ? `${v}T12:00:00` : v);
      return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    };
    const legText = (from?: string, to?: string, date?: string, time?: string, pax?: number) =>
      [
        `${from || "—"} → ${to || "—"}`,
        [day(date), time ? `${time} LT` : "", activeRequest.isFlexibleTime ? "flexible" : ""].filter(Boolean).join(" "),
        `${pax || activeRequest.paxCount} pax`
      ]
        .filter(Boolean)
        .join(" · ");
    const legStrs = allLegs.map((l) => legText(l.originIcao, l.destIcao, l.flightDate, l.departureTime, l.paxCount));
    const leg1Str = legStrs[0];
    const laterLegs = legStrs.slice(1);
    const pet: any = activeRequest.petDetails || activeRequest.pets;
    const petList: any[] = Array.isArray(pet) ? pet : pet && Object.keys(pet).length ? [pet] : [];
    const petsText = petList.length
      ? petList
          .map((p) =>
            [
              p.petCount ? `${p.petCount}×` : "",
              p.name || "",
              p.breed || p.petType || p.type || "Pet",
              p.totalWeightKg || p.petWeight || p.weightKg ? `(${p.totalWeightKg || p.petWeight || p.weightKg} kg)` : "",
              p.notes ? `· ${p.notes}` : ""
            ]
              .filter(Boolean)
              .join(" ")
          )
          .join(", ")
      : activeRequest.hasPets
        ? "Pets on board (details to follow)"
        : "None";
    const lug: any = activeRequest.luggage;
    const luggageText =
      activeRequest.luggageDetailsText ||
      (lug && (lug.pieceCount || lug.totalWeightKg)
        ? [lug.pieceCount ? `${lug.pieceCount} pieces` : "", lug.totalWeightKg ? `≈ ${lug.totalWeightKg} kg` : "", lug.specialLuggageDescription || ""].filter(Boolean).join(" · ")
        : activeRequest.luggageCount
          ? `${activeRequest.luggageCount} bags`
          : "—");
    const askOperator =
      activeRequest.askOperatorText ||
      [
        activeRequest.deicingInsurance && activeRequest.deicingInsurance !== "none" ? "De-icing protection" : "",
        activeRequest.carbonOffset && activeRequest.carbonOffset !== "none" ? "Carbon offset" : "",
        activeRequest.cancellationInsurance ? "Cancellation insurance" : ""
      ]
        .filter(Boolean)
        .join(", ") ||
      "—";
    const agentReqs = agentRequests.filter((r) => r.agentName === activeRequest.agentName);
    const agentConversion = agentReqs.length
      ? Math.round((agentReqs.filter((r) => r.status === "completed").length / agentReqs.length) * 100)
      : 0;
    const offers = offersCount(activeRequest);

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
          <span className="text-gray-800">
            <HeaderId id={activeRequest.requestNumber || activeRequest.id} affix={0.72} />
          </span>
        </div>

        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              <HeaderId id={activeRequest.requestNumber || activeRequest.id} scale={0.62} affix={0.5} />{" "}
              · {activeRequest.route}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              From agent {activeRequest.agentName}
              {activeRequest.agentCompany ? ` (${activeRequest.agentCompany})` : ""} · received {receivedAt(activeRequest) || "—"} ·{" "}
              {activeRequest.tokensUsed ?? 1} token{(activeRequest.tokensUsed ?? 1) === 1 ? "" : "s"} used
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
                    {isMultiLeg ? `Multi-leg · ${allLegs.length} legs` : isRoundTrip ? "Round trip" : "One way"}
                  </div>
                </div>

                {/* Row 2: Leg 1 and Leg 2 */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    LEG 1
                  </div>
                  <div className="font-medium text-gray-900">{leg1Str}</div>
                </div>

                {laterLegs.length > 0 ? (
                  laterLegs.map((t, i) => (
                    <div key={`leg-${i + 2}`}>
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        {isRoundTrip ? "RETURN · LEG 2" : `LEG ${i + 2}`}
                      </div>
                      <div className="font-medium text-gray-900">{t}</div>
                    </div>
                  ))
                ) : (
                  <div>
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      RETURN
                    </div>
                    <div className="font-medium text-gray-900">{isRoundTrip ? "Return date to be confirmed" : "None (one way)"}</div>
                  </div>
                )}

                {/* Row 3 */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    CATEGORY
                  </div>
                  <div className="font-medium text-gray-900">
                    {activeRequest.categoryLabel || activeRequest.aircraftPreference || "Any"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    LAVATORY
                  </div>
                  <div className="font-medium text-gray-900">
                    {activeRequest.lavatoryPreference || "—"}
                  </div>
                </div>

                {/* Row 4 */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    LUGGAGE
                  </div>
                  <div className="font-medium text-gray-900">
                    {luggageText}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    PETS
                  </div>
                  <div className="font-medium text-gray-900">
                    {petsText}
                  </div>
                </div>

                {/* Row 5 */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    SERVICES
                  </div>
                  <div className="font-medium text-gray-900 space-y-1">
                    {activeRequest.groundTransportation?.enabled && (
                      <div className="text-xs">
                        🚗 Ground: {activeRequest.groundTransportation.onArrival?.dropOffLocation ? `Drop-off: ${activeRequest.groundTransportation.onArrival.dropOffLocation} (${activeRequest.groundTransportation.onArrival.vehiclePreference})` : "Transfer requested"}
                        {activeRequest.groundTransportation.onDeparture?.pickUpLocation ? ` · Pick-up: ${activeRequest.groundTransportation.onDeparture.pickUpLocation}` : ""}
                      </div>
                    )}
                    {activeRequest.helicopterTransfer?.enabled && (
                      <div className="text-xs">
                        🚁 Heli: {activeRequest.helicopterTransfer.onArrival?.dropOffLocation || activeRequest.helicopterTransfer.onDeparture?.pickUpLocation || "Helicopter transfer"}
                      </div>
                    )}
                    {!activeRequest.groundTransportation?.enabled && !activeRequest.helicopterTransfer?.enabled && (
                      <span>{activeRequest.servicesText || (activeRequest.limousineService ? "Limousine requested" : "None")}</span>
                    )}
                    {activeRequest.specialRequests && (
                      <div className="text-xs text-gray-500">
                        Catering / Special: {activeRequest.specialRequests}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    ASK OPERATOR
                  </div>
                  <div className="font-medium text-gray-900">
                    {askOperator}
                  </div>
                </div>

                {/* Row 6 */}
                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    AGENT MARGIN
                  </div>
                  <div className="font-medium text-gray-900">
                    {activeRequest.agentMarginPct != null ? `${activeRequest.agentMarginPct} %` : "—"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    PAYMENT
                  </div>
                  <div className="font-medium text-gray-900">
                    {activeRequest.paymentMethodText || "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages with agent Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Messages with agent</h2>

              <div className="space-y-4 mb-4">
                {(!activeRequest.messages || activeRequest.messages.length === 0) ? (
                  <p className="text-xs text-gray-400">No messages on this request yet.</p>
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
                  {{ pending: "New", in_sourcing: "Sourcing", processing: "Processing", completed: "Quoted", declined: "Declined" }[activeRequest.status as string] || activeRequest.status}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {offers ? `${offers} operator offer${offers === 1 ? "" : "s"} logged` : "No operator offers logged yet"}
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
                  Conversion {agentConversion} % · {agentReqs.length} request{agentReqs.length === 1 ? "" : "s"}
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
                    {activeRequest.companyName || (linkedAccount ? linkedAccount.name : activeRequest.clientName || "—")}
                  </button>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {linkedAccount?.accountNumber || "No account linked"} · {activeRequest.accountEarlierTrips ?? linkedAccount?.totalBookings ?? 0} earlier trips
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 px-1 leading-relaxed">
              &ldquo;Create quote&rdquo; opens the New quote builder pre-filled with everything above and creates trip {activeRequest.tripId || activeRequest.createdTripId || (activeRequest.requestNumber || "").replace(/^REQ-/, "TRI-")}.
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
          <table id="requests-table" className="w-full text-left border-collapse text-xs">
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
              {paged.pageRows.map((req) => (
                <tr
                  key={req.id}
                  onClick={() => handleOpenRequest(req)}
                  className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-mono font-medium text-gray-900">
                    {req.requestNumber || req.id}
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
                    {req.categoryLabel || req.aircraftPreference || "Any"}
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
                    {loadError
                      ? loadError
                      : !agentRequestsLoaded && agentRequests.length === 0
                        ? "Loading requests…"
                        : "No requests found matching your filter criteria."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePager {...paged} label="requests" scrollToId="requests-table" />

        {/* Footer Note */}
        <div className="py-3.5 px-4 border-t border-gray-100 text-[11px] text-gray-400 leading-relaxed bg-white">
          Newest request first. A request becomes overdue after {overdueMinutes} minutes without action (set in Settings). Opening it shows the request page, and &ldquo;Create quote&rdquo; turns it into a trip.
        </div>
      </div>
    </div>
  );
}

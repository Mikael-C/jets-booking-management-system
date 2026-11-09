"use client";

import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import { AgentRequest, SourcingOption, RequestMessage } from "@/types/aviation";
import {
  Inbox,
  Clock,
  CheckCircle2,
  Send,
  FileText,
  Compass,
  Receipt,
  User,
  Plane,
  Calendar,
  AlertCircle,
  Eye,
  Check,
  Sparkles,
  Copy,
  Layers,
  List,
  Kanban,
  MessageSquare,
  Plus,
  Shield,
  Building2,
  ChevronDown,
  ChevronUp,
  Tag,
  Hash,
  Zap,
  RefreshCw,
  Loader2,
  Globe
} from "lucide-react";
import { api } from "@/lib/api";

export default function AgentRequestsQueueView() {
  const {
    agentRequests,
    fulfillRequest,
    updateAgentRequestStatus,
    updateAgentRequestAvinodeId,
    addSourcingOption,
    addMessage,
    currentUser,
    bookings
  } = useAviation();

  const [filter, setFilter] = useState<"all" | "pending" | "in_sourcing" | "completed">("all");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [selectedReqForModal, setSelectedReqForModal] = useState<AgentRequest | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Expanded messages state per request
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});
  const [messageInputs, setMessageInputs] = useState<Record<string, string>>({});

  // Sourcing Modal State
  const [sourcingModalReq, setSourcingModalReq] = useState<AgentRequest | null>(null);
  const [sourcingOperator, setSourcingOperator] = useState("");
  const [sourcingAircraft, setSourcingAircraft] = useState("");
  const [sourcingRegistration, setSourcingRegistration] = useState("");
  const [sourcingBaseAirport, setSourcingBaseAirport] = useState("");
  const [sourcingPrice, setSourcingPrice] = useState<number>(18000);
  const [sourcingCurrency, setSourcingCurrency] = useState<"EUR" | "USD" | "GBP" | "CHF">("EUR");
  const [sourcingTaxesIncluded, setSourcingTaxesIncluded] = useState(true);
  const [sourcingValidUntil, setSourcingValidUntil] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]
  );
  const [sourcingNotes, setSourcingNotes] = useState("");

  // Avinode Live Sourcing Modal State
  const [avinodeModalReq, setAvinodeModalReq] = useState<AgentRequest | null>(null);
  const [avinodeResults, setAvinodeResults] = useState<any[]>([]);
  const [isLoadingAvinode, setIsLoadingAvinode] = useState(false);
  const [avinodeRfqSuccess, setAvinodeRfqSuccess] = useState(false);
  const [avinodeError, setAvinodeError] = useState<string | null>(null);

  const handleQueryAvinode = async (req: AgentRequest) => {
    setAvinodeModalReq(req);
    setIsLoadingAvinode(true);
    setAvinodeError(null);
    setAvinodeRfqSuccess(false);
    try {
      const parts = req.route.split(" ");
      const originIcao = req.originIcao || parts[0] || "LSGG";
      const destIcao = req.destIcao || parts[parts.length - 1] || "LIMJ";
      const results = await api.avinode.searchTrips({
        originIcao,
        destinationIcao: destIcao,
        departureDate: req.flightDate || new Date().toISOString().split("T")[0],
        paxCount: req.paxCount || 4,
        currency: "EUR"
      });
      setAvinodeResults(Array.isArray(results) ? results : []);
    } catch (e: any) {
      console.warn("Avinode search error:", e);
      setAvinodeError(e.message || "Failed to search Avinode marketplace");
      setAvinodeResults([]);
    } finally {
      setIsLoadingAvinode(false);
    }
  };

  const handleSendAvinodeRfq = async (req: AgentRequest) => {
    try {
      setAvinodeError(null);
      const parts = req.route.split(" ");
      const originIcao = req.originIcao || parts[0] || "LSGG";
      const destIcao = req.destIcao || parts[parts.length - 1] || "LIMJ";
      await api.avinode.sendRfq({
        agentRequestId: req.id,
        originIcao,
        destinationIcao: destIcao,
        departureDate: req.flightDate || new Date().toISOString().split("T")[0],
        paxCount: req.paxCount || 4,
        notes: req.specialRequests || `Requested by ${req.agentName}`
      });
      setAvinodeRfqSuccess(true);
      updateAgentRequestStatus(req.id, "in_sourcing");
      setTimeout(() => setAvinodeRfqSuccess(false), 3000);
    } catch (e: any) {
      setAvinodeError(e.message || "Failed to broadcast RFQ");
    }
  };

  const handleAcceptAvinodeOption = (req: AgentRequest, option: any) => {
    addSourcingOption(req.id, {
      operatorName: option.operator?.name || "Avinode Operator",
      aircraftType: option.aircraft?.name || option.aircraft?.category || "Charter Jet",
      aircraftRegistration: option.aircraft?.registration || "TBD",
      baseAirport: option.operator?.country || "Europe",
      price: option.priceUSD || 15000,
      currency: "EUR",
      taxesIncluded: true,
      validUntil: option.validUntil ? option.validUntil.split("T")[0] : new Date(Date.now() + 86400000).toISOString().split("T")[0],
      notes: `Direct from Avinode marketplace. Flight time: ${option.flightTime || 'N/A'}`
    });
    if (option.id) {
      updateAgentRequestAvinodeId(req.id, option.id);
    }
    setAvinodeModalReq(null);
  };

  const filteredRequests = agentRequests.filter((r) => {
    if (filter === "pending") return r.status === "pending";
    if (filter === "in_sourcing") return r.status === "in_sourcing";
    if (filter === "completed") return r.status === "completed";
    return true;
  });

  const pendingCount = agentRequests.filter((r) => r.status === "pending").length;
  const inSourcingCount = agentRequests.filter((r) => r.status === "in_sourcing").length;
  const completedCount = agentRequests.filter((r) => r.status === "completed").length;

  // Copy for Avinode Formatted Text
  const handleCopyAvinode = (req: AgentRequest) => {
    const text = `CHARTER REQUEST - ${req.title}
Route: ${req.route}
Date: ${req.flightDate}${req.returnFlightDate ? ` (Return: ${req.returnFlightDate})` : ""}
Passengers: ${req.paxCount}
Aircraft: ${req.aircraftPreference || "Best Available Category"}
Budget: ${req.budgetNotes || "Market rate"}
Special Requests: ${req.specialRequests || "None"}`;

    navigator.clipboard.writeText(text);
    setCopiedId(req.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const calculateAge = (createdAt: string) => {
    try {
      // Try parsing date string or default to realistic age
      const createdTime = new Date(createdAt).getTime();
      if (isNaN(createdTime)) {
        return "1 day";
      }
      const diffMs = Date.now() - createdTime;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return "< 1 hr";
      if (diffHours < 24) return `${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d`;
    } catch {
      return "1d";
    }
  };

  const getPriorityBadge = (priority?: "normal" | "urgent" | "vip") => {
    switch (priority) {
      case "vip":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/20 text-[#C9A052] border border-[#C9A052]/40 uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> VIP
          </span>
        );
      case "urgent":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-700 border border-red-300 uppercase flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> URGENT
          </span>
        );
      case "normal":
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300 uppercase">
            NORMAL
          </span>
        );
    }
  };

  const handleSendMessage = (reqId: string) => {
    const content = messageInputs[reqId]?.trim();
    if (!content) return;

    addMessage(reqId, {
      senderName: currentUser?.name || "Capt. Alexander Vance",
      senderRole: "Admin Operations",
      content,
      isFromAdmin: true
    });

    setMessageInputs((prev) => ({ ...prev, [reqId]: "" }));
  };

  const handleOpenSourcingModal = (req: AgentRequest) => {
    setSourcingModalReq(req);
    setSourcingOperator("");
    setSourcingAircraft(req.aircraftPreference || "Citation Mustang");
    setSourcingRegistration("");
    setSourcingBaseAirport(req.originIcao || "LSGG");
    setSourcingPrice(22500);
    setSourcingCurrency("EUR");
    setSourcingTaxesIncluded(true);
    setSourcingNotes("");
  };

  const handleSaveSourcingOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourcingModalReq) return;

    addSourcingOption(sourcingModalReq.id, {
      operatorName: sourcingOperator || "Partner Charter Operator",
      aircraftType: sourcingAircraft,
      aircraftRegistration: sourcingRegistration || undefined,
      baseAirport: sourcingBaseAirport,
      price: Number(sourcingPrice),
      currency: sourcingCurrency,
      taxesIncluded: sourcingTaxesIncluded,
      validUntil: sourcingValidUntil,
      notes: sourcingNotes
    });

    setSourcingModalReq(null);
  };

  const toggleMessages = (id: string) => {
    setExpandedMessages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30">
              AGENT INQUIRIES QUEUE
            </span>
            <span className="text-xs text-[#0F1420]/60">Avinode Sourcing & Quote Requests</span>
          </div>
          <h2 className="text-xl font-black text-[#0F1420] tracking-tight">
            Incoming Agent Requests & Sourcing
          </h2>
          <p className="text-xs text-[#0F1420]/65 mt-0.5">
            Review RFQs submitted by charter brokers. Copy for Avinode marketplace sourcing, log operator responses, and compile official quotes.
          </p>
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* List vs Board Toggle */}
          <div className="flex items-center gap-1 bg-[#F5F2EC] p-1 rounded-xl border border-[#E0DAD0]">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === "list"
                  ? "bg-[#0F1420] text-white shadow-sm"
                  : "text-[#0F1420]/70 hover:text-[#0F1420]"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === "board"
                  ? "bg-[#0F1420] text-white shadow-sm"
                  : "text-[#0F1420]/70 hover:text-[#0F1420]"
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-4 h-4" />
              <span className="hidden sm:inline">Board</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#F5F2EC] p-1 rounded-xl border border-[#E0DAD0]">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === "all"
                  ? "bg-[#0F1420] text-white shadow-sm"
                  : "text-[#0F1420]/70 hover:text-[#0F1420]"
              }`}
            >
              All ({agentRequests.length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                filter === "pending"
                  ? "bg-[#0F1420] text-white shadow-sm"
                  : "text-[#0F1420]/70 hover:text-[#0F1420]"
              }`}
            >
              <span>Pending</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-400 text-[#0F1420]">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter("in_sourcing")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                filter === "in_sourcing"
                  ? "bg-[#0F1420] text-white shadow-sm"
                  : "text-[#0F1420]/70 hover:text-[#0F1420]"
              }`}
            >
              <span>In Sourcing</span>
              {inSourcingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#C9A052] text-[#0F1420]">
                  {inSourcingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === "completed"
                  ? "bg-[#0F1420] text-white shadow-sm"
                  : "text-[#0F1420]/70 hover:text-[#0F1420]"
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>
        </div>
      </div>

      {/* RENDER VIEW: LIST OR KANBAN BOARD */}
      {viewMode === "board" ? (
        /* KANBAN BOARD VIEW: Columns: Submitted -> In Sourcing -> Quoted -> Accepted */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          
          {/* Column 1: Submitted (Pending) */}
          <div className="bg-[#EDE9DF]/60 border border-[#E0DAD0] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E0DAD0]">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F1420]">
                1. Submitted ({agentRequests.filter((r) => r.status === "pending").length})
              </span>
              <span className="h-2 w-2 rounded-full bg-amber-400" />
            </div>

            <div className="space-y-3">
              {agentRequests
                .filter((r) => r.status === "pending")
                .map((req) => (
                  <div
                    key={req.id}
                    className="bg-white border border-[#E0DAD0] hover:border-[#C9A052] rounded-xl p-3.5 shadow-sm space-y-2.5 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      {getPriorityBadge(req.priority)}
                      <span className="text-[10px] font-mono text-gray-500">
                        Age: {calculateAge(req.createdAt)}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-xs text-[#0F1420] line-clamp-1">{req.title}</h4>
                      <p className="text-[11px] text-gray-600 font-medium">{req.clientName}</p>
                    </div>

                    <div className="text-[11px] font-mono text-[#0F1420]/80 bg-[#F5F2EC] px-2 py-1 rounded">
                      {req.route} • {req.paxCount} Pax
                    </div>

                    {req.avInodeId && (
                      <p className="text-[10px] font-mono text-[#C9A052] font-bold">
                        Avinode: {req.avInodeId}
                      </p>
                    )}

                    <div className="pt-2 border-t border-[#E0DAD0] flex items-center justify-between">
                      <button
                        onClick={() => handleCopyAvinode(req)}
                        className="text-[10px] font-bold text-[#0F1420] hover:text-[#C9A052] flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedId === req.id ? "Copied!" : "Avinode"}</span>
                      </button>

                      <button
                        onClick={() => handleOpenSourcingModal(req)}
                        className="px-2 py-1 rounded bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-[10px] font-black uppercase"
                      >
                        + Source
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Column 2: In Sourcing */}
          <div className="bg-[#EDE9DF]/60 border border-[#E0DAD0] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E0DAD0]">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F1420]">
                2. In Sourcing ({agentRequests.filter((r) => r.status === "in_sourcing").length})
              </span>
              <span className="h-2 w-2 rounded-full bg-[#C9A052]" />
            </div>

            <div className="space-y-3">
              {agentRequests
                .filter((r) => r.status === "in_sourcing")
                .map((req) => (
                  <div
                    key={req.id}
                    className="bg-white border border-[#E0DAD0] hover:border-[#C9A052] rounded-xl p-3.5 shadow-sm space-y-2.5 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      {getPriorityBadge(req.priority)}
                      <span className="text-[10px] font-mono text-gray-500">
                        Age: {calculateAge(req.createdAt)}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-xs text-[#0F1420] line-clamp-1">{req.title}</h4>
                      <p className="text-[11px] text-gray-600 font-medium">{req.clientName}</p>
                    </div>

                    <div className="text-[11px] font-mono text-[#0F1420]/80 bg-[#F5F2EC] px-2 py-1 rounded">
                      {req.route} • {req.paxCount} Pax
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-emerald-700 font-bold">
                      <span>{(req.sourcingOptions || []).length} responses logged</span>
                    </div>

                    <div className="pt-2 border-t border-[#E0DAD0] flex items-center justify-between">
                      <button
                        onClick={() => handleOpenSourcingModal(req)}
                        className="text-[10px] font-bold text-[#0F1420] hover:text-[#C9A052] flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Log Option</span>
                      </button>

                      <button
                        onClick={() => fulfillRequest(req)}
                        className="px-2 py-1 rounded bg-[#0F1420] hover:bg-[#1A2338] text-white text-[10px] font-bold"
                      >
                        Create Quote
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Column 3: Quoted (Processing / Sent) */}
          <div className="bg-[#EDE9DF]/60 border border-[#E0DAD0] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E0DAD0]">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F1420]">
                3. Quoted ({agentRequests.filter((r) => r.status === "processing").length})
              </span>
              <span className="h-2 w-2 rounded-full bg-blue-500" />
            </div>

            <div className="space-y-3">
              {agentRequests
                .filter((r) => r.status === "processing")
                .map((req) => (
                  <div
                    key={req.id}
                    className="bg-white border border-[#E0DAD0] rounded-xl p-3.5 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      {getPriorityBadge(req.priority)}
                      <span className="text-[10px] font-mono text-gray-500">
                        Age: {calculateAge(req.createdAt)}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-xs text-[#0F1420] line-clamp-1">{req.title}</h4>
                      <p className="text-[11px] text-gray-600 font-medium">{req.clientName}</p>
                    </div>

                    <div className="text-[11px] font-mono text-[#0F1420]/80 bg-[#F5F2EC] px-2 py-1 rounded">
                      {req.route}
                    </div>

                    <div className="pt-2 border-t border-[#E0DAD0] flex items-center justify-between">
                      <span className="text-[10px] font-mono text-blue-700 font-bold">Quote Sent</span>
                      <button
                        onClick={() => updateAgentRequestStatus(req.id, "completed")}
                        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Column 4: Accepted (Completed) */}
          <div className="bg-[#EDE9DF]/60 border border-[#E0DAD0] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E0DAD0]">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F1420]">
                4. Accepted ({agentRequests.filter((r) => r.status === "completed").length})
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>

            <div className="space-y-3">
              {agentRequests
                .filter((r) => r.status === "completed")
                .map((req) => (
                  <div
                    key={req.id}
                    className="bg-white border border-emerald-200 rounded-xl p-3.5 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      {getPriorityBadge(req.priority)}
                      <span className="text-[10px] font-mono text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Booked
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-xs text-[#0F1420] line-clamp-1">{req.title}</h4>
                      <p className="text-[11px] text-gray-600 font-medium">{req.clientName}</p>
                    </div>

                    <div className="text-[11px] font-mono text-[#0F1420]/80 bg-[#F5F2EC] px-2 py-1 rounded">
                      {req.route}
                    </div>

                    <button
                      onClick={() => fulfillRequest(req)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-[#0F1420] text-white text-[10px] font-bold text-center block"
                    >
                      View Generated PDF
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD LIST VIEW WITH FULL CARD DETAILS */
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white border border-[#E0DAD0] rounded-2xl p-12 text-center text-xs text-gray-500">
              No agent requests found in this view.
            </div>
          ) : (
            filteredRequests.map((req) => {
              const isPending = req.status === "pending" || req.status === "in_sourcing";
              const sourcingCount = (req.sourcingOptions || []).length;
              const messagesCount = (req.messages || []).length;
              const isMessagesOpen = !!expandedMessages[req.id];

              return (
                <div
                  key={req.id}
                  className="bg-white border border-[#E0DAD0] hover:border-[#C9A052]/60 rounded-2xl p-5 shadow-sm transition-all space-y-4"
                >
                  {/* Top Row: Type, Status, Agent Info & SLA Age */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E0DAD0]">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30">
                        <Plane className="w-4 h-4 text-[#C9A052]" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#9A7A35] bg-[#C9A052]/15 border border-[#C9A052]/30 px-2 py-0.5 rounded">
                            {req.type === "quote" ? "Quote Request" : req.type === "flight_brief" ? "Flight Brief" : "Invoice"}
                          </span>
                          {getPriorityBadge(req.priority)}
                          <span className="text-xs font-mono text-gray-400">ID: {req.id}</span>
                          <span className="text-xs font-mono text-[#0F1420]/70 font-semibold bg-[#F5F2EC] px-2 py-0.5 rounded">
                            Age: {calculateAge(req.createdAt)}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-[#0F1420] mt-1">
                          {req.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Avinode Marketplace Live Query Button */}
                      <button
                        onClick={() => handleQueryAvinode(req)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F1420] hover:bg-[#1E2538] text-[#C9A052] border border-[#C9A052]/40 text-xs font-bold transition-all shadow-sm cursor-pointer"
                        title="Query live Avinode marketplace for available aircraft and charter quotes"
                      >
                        <Zap className="w-3.5 h-3.5 text-[#C9A052]" />
                        <span>Avinode Marketplace</span>
                      </button>

                      {/* Avinode Copy Button */}
                      <button
                        onClick={() => handleCopyAvinode(req)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          copiedId === req.id
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-[#F5F2EC] hover:bg-[#EAE6DE] text-[#0F1420] border-[#D1C9BC]"
                        }`}
                        title="Copy structured charter request to clipboard for Avinode inquiry"
                      >
                        <Copy className="w-3.5 h-3.5 text-[#C9A052]" />
                        <span>{copiedId === req.id ? "Copied!" : "📋 Copy for Avinode"}</span>
                      </button>

                      {/* Log Operator Response Button */}
                      <button
                        onClick={() => handleOpenSourcingModal(req)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141A29] hover:bg-[#1C2436] text-white text-xs font-bold transition-all"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#C9A052]" />
                        <span>Log Operator Response</span>
                      </button>

                      {req.status === "completed" ? (
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Generated & Sent
                        </span>
                      ) : req.status === "in_sourcing" ? (
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#C9A052]/20 text-[#9A7A35] border border-[#C9A052]/40 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" />
                          In Sourcing ({sourcingCount})
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5 animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          Awaiting Action
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Grid: Client, Route, Dates, Avinode Trip ID */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-gray-400">SUBMITTING AGENT</span>
                      <p className="font-extrabold text-[#0F1420] mt-0.5">{req.agentName}</p>
                      <p className="text-[11px] text-gray-500">{req.agentEmail}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-gray-400">CLIENT / COMPANY</span>
                      <p className="font-extrabold text-[#0F1420] mt-0.5">{req.clientName}</p>
                      <p className="text-[11px] text-gray-500">{req.companyName || "Private HNWI"}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-gray-400">ROUTE & TIMING</span>
                      <p className="font-extrabold font-mono text-[#0F1420] mt-0.5">{req.route}</p>
                      <p className="text-[11px] text-gray-500">Date: {req.flightDate} • {req.paxCount} Pax</p>
                      {req.aircraftPreference && (
                        <p className="text-[10px] text-[#C9A052] font-mono font-bold">{req.aircraftPreference}</p>
                      )}
                    </div>

                    {/* Avinode Trip ID & Sourcing Count */}
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-gray-400">AVINODE TRIP ID</span>
                      <div className="mt-1 flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="e.g. AV-98421"
                          value={req.avInodeId || ""}
                          onChange={(e) => updateAgentRequestAvinodeId(req.id, e.target.value)}
                          className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {sourcingCount > 0 ? (
                          <span className="text-emerald-700 font-bold">{sourcingCount} sourcing response{sourcingCount > 1 ? "s" : ""}</span>
                        ) : (
                          "0 sourcing responses"
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Sourcing Options Preview List if any */}
                  {sourcingCount > 0 && (
                    <div className="p-3 bg-[#F5F2EC] rounded-xl border border-[#E0DAD0] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0F1420] flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#C9A052]" />
                          Logged Operator Responses ({sourcingCount})
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {req.sourcingOptions?.map((opt) => (
                          <div
                            key={opt.id}
                            className="bg-white border border-[#E0DAD0] rounded-lg p-2.5 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-[#0F1420]">{opt.operatorName}</span>
                              <span className="font-mono font-bold text-[#C9A052]">
                                {opt.currency} {opt.price.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-600">
                              {opt.aircraftType} {opt.aircraftRegistration ? `(${opt.aircraftRegistration})` : ""}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono">
                              Base: {opt.baseAirport} • Valid: {opt.validUntil}
                            </p>
                            {opt.notes && (
                              <p className="text-[10px] text-gray-500 italic mt-0.5 line-clamp-1">
                                {opt.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Collapsible Message Thread Section */}
                  <div className="border border-[#E0DAD0] rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleMessages(req.id)}
                      className="w-full px-4 py-2 bg-[#FDFCFA] hover:bg-[#F5F2EC] flex items-center justify-between text-xs font-bold text-[#0F1420] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-[#C9A052]" />
                        <span>Internal Messages & Broker Notes ({messagesCount})</span>
                      </div>
                      {isMessagesOpen ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </button>

                    {isMessagesOpen && (
                      <div className="p-4 bg-white space-y-3 border-t border-[#E0DAD0]">
                        {/* Existing Messages */}
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {messagesCount === 0 ? (
                            <p className="text-xs text-gray-400 italic">No messages on this inquiry yet.</p>
                          ) : (
                            req.messages?.map((msg) => (
                              <div
                                key={msg.id}
                                className={`p-2.5 rounded-xl text-xs max-w-lg ${
                                  msg.isFromAdmin
                                    ? "ml-auto bg-[#0F1420] text-white"
                                    : "bg-[#F5F2EC] text-[#0F1420] border border-[#E0DAD0]"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className={`font-bold text-[10px] ${msg.isFromAdmin ? "text-[#C9A052]" : "text-gray-700"}`}>
                                    {msg.senderName} ({msg.senderRole})
                                  </span>
                                  <span className="text-[9px] font-mono opacity-60">{msg.timestamp}</span>
                                </div>
                                <p className="leading-relaxed">{msg.content}</p>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Input Box to Send Message */}
                        <div className="flex items-center gap-2 pt-2 border-t border-[#E0DAD0]">
                          <input
                            type="text"
                            placeholder="Add administrative message or broker update..."
                            value={messageInputs[req.id] || ""}
                            onChange={(e) =>
                              setMessageInputs((prev) => ({ ...prev, [req.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSendMessage(req.id);
                            }}
                            className="flex-1 bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                          />
                          <button
                            type="button"
                            onClick={() => handleSendMessage(req.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#0F1420] hover:bg-[#1A2338] text-white text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <Send className="w-3.5 h-3.5 text-[#C9A052]" />
                            <span>Send</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Actions */}
                  <div className="pt-2 border-t border-[#E0DAD0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-[#0F1420]/70 font-mono">
                      {req.adminNotes ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          {req.adminNotes}
                        </span>
                      ) : (
                        <span>Click to compile official document and deliver to {req.agentName}.</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedReqForModal(req)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#F5F2EC] hover:bg-[#EAE6DE] text-[#0F1420] text-xs font-bold transition-all border border-[#D1C9BC]"
                      >
                        View Full Details
                      </button>

                      <button
                        onClick={() => fulfillRequest(req)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{req.status === "completed" ? "View Generated PDF" : "Generate Document & Send"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SOURCING OPTION MODAL FORM */}
      {sourcingModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-[#E0DAD0] rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Pinned Header */}
            <div className="px-5 py-4 border-b border-[#E0DAD0] flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#C9A052]" />
                <h3 className="text-base font-extrabold text-[#0F1420]">
                  Log Sourcing Option / Operator Response
                </h3>
              </div>
              <button
                onClick={() => setSourcingModalReq(null)}
                className="text-gray-400 hover:text-gray-700 font-bold text-base p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveSourcingOption} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-[#0F1420] uppercase font-mono mb-1">
                      Operator Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GlobeAir AG, VistaJet, Luxaviation"
                      value={sourcingOperator}
                      onChange={(e) => setSourcingOperator(e.target.value)}
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#0F1420] uppercase font-mono mb-1">
                      Aircraft Model *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Citation Mustang, Challenger 350"
                      value={sourcingAircraft}
                      onChange={(e) => setSourcingAircraft(e.target.value)}
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#0F1420] uppercase font-mono mb-1">
                      Tail Registration (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="OE-FFB, 9H-VJC"
                      value={sourcingRegistration}
                      onChange={(e) => setSourcingRegistration(e.target.value)}
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono uppercase text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#0F1420] uppercase font-mono mb-1">
                      Base Airport (ICAO) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="LSGG, LOWL, LFMN"
                      value={sourcingBaseAirport}
                      onChange={(e) => setSourcingBaseAirport(e.target.value)}
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono uppercase text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#0F1420] uppercase font-mono mb-1">
                      Quoted Operator Price *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={sourcingCurrency}
                        onChange={(e) => setSourcingCurrency(e.target.value as any)}
                        className="bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-2 py-2 text-xs font-mono font-bold"
                      >
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                        <option value="CHF">CHF</option>
                      </select>
                      <input
                        type="number"
                        required
                        min={0}
                        value={sourcingPrice}
                        onChange={(e) => setSourcingPrice(Number(e.target.value))}
                        className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                      />
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center justify-between p-2.5 bg-[#F5F2EC] rounded-xl border border-[#E0DAD0]">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-[#0F1420]">
                      <input
                        type="checkbox"
                        checked={sourcingTaxesIncluded}
                        onChange={(e) => setSourcingTaxesIncluded(e.target.checked)}
                        className="rounded text-[#C9A052] focus:ring-[#C9A052]"
                      />
                      <span>All Airport Taxes & Fees Included in Rate</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-500">Valid Until:</span>
                      <input
                        type="date"
                        value={sourcingValidUntil}
                        onChange={(e) => setSourcingValidUntil(e.target.value)}
                        className="bg-white border border-[#E0DAD0] rounded-lg px-2 py-1 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-[#0F1420] uppercase font-mono mb-1">
                      Internal Operator Notes / Terms
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Owner approval required, de-icing billed at cost, catering included."
                      value={sourcingNotes}
                      onChange={(e) => setSourcingNotes(e.target.value)}
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl p-2.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                </div>
              </div>

              {/* Pinned Footer */}
              <div className="px-5 py-3 border-t border-[#E0DAD0] flex justify-end gap-2 shrink-0 bg-[#FAF8F5]">
                <button
                  type="button"
                  onClick={() => setSourcingModalReq(null)}
                  className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer"
                >
                  Save Sourcing Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL DETAILS MODAL */}
      {selectedReqForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-[#E0DAD0] rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Pinned Header */}
            <div className="px-5 py-4 border-b border-[#E0DAD0] flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-[#C9A052]" />
                <h3 className="text-base font-extrabold text-[#0F1420]">
                  {selectedReqForModal.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReqForModal(null)}
                className="text-gray-400 hover:text-gray-700 font-bold text-base p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 text-xs text-[#0F1420]/80">
              <p><strong>Submitting Agent:</strong> {selectedReqForModal.agentName} ({selectedReqForModal.agentEmail})</p>
              <p><strong>Client:</strong> {selectedReqForModal.clientName} ({selectedReqForModal.clientEmail}, {selectedReqForModal.clientPhone})</p>
              <p><strong>Company:</strong> {selectedReqForModal.companyName || "N/A"}</p>
              <p><strong>Routing:</strong> {selectedReqForModal.route}</p>
              <p><strong>Flight Date:</strong> {selectedReqForModal.flightDate}</p>
              <p><strong>Passengers:</strong> {selectedReqForModal.paxCount} Pax</p>
              {selectedReqForModal.luggageCount !== undefined && (
                <p><strong>Luggage Count:</strong> {selectedReqForModal.luggageCount} pieces</p>
              )}
              {selectedReqForModal.hasPets && (
                <p className="text-amber-700 font-bold">🐾 Travelling with Pets</p>
              )}
              {selectedReqForModal.isFlexibleTime && (
                <p className="text-blue-700 font-bold">⏱ Flexible Departure Time (±2 hours)</p>
              )}
              {selectedReqForModal.specialNeeds && (
                <p><strong>Special Needs / Accessibility:</strong> {selectedReqForModal.specialNeeds}</p>
              )}
              {selectedReqForModal.aircraftPreference && (
                <p><strong>Aircraft Preference:</strong> {selectedReqForModal.aircraftPreference}</p>
              )}
              {selectedReqForModal.budgetNotes && (
                <p><strong>Budget / Pricing Notes:</strong> {selectedReqForModal.budgetNotes}</p>
              )}
              {selectedReqForModal.specialRequests && (
                <p><strong>VIP Wishes:</strong> {selectedReqForModal.specialRequests}</p>
              )}
            </div>

            {/* Pinned Footer */}
            <div className="px-5 py-3 border-t border-[#E0DAD0] flex justify-end gap-2 shrink-0 bg-[#FAF8F5]">
              <button
                onClick={() => setSelectedReqForModal(null)}
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  fulfillRequest(selectedReqForModal);
                  setSelectedReqForModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                Generate Document Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AVINODE MARKETPLACE RESULTS MODAL ── */}
      {avinodeModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-[#E0DAD0] rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Pinned Header */}
            <div className="px-5 py-4 border-b border-[#E0DAD0] flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0F1420] flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-[#C9A052]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#0F1420]">
                    Avinode Marketplace Live Sourcing
                  </h3>
                  <p className="text-[11px] text-gray-500 font-mono">
                    Route: {avinodeModalReq.route} • {avinodeModalReq.flightDate} • {avinodeModalReq.paxCount} Pax
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAvinodeModalReq(null)}
                className="text-gray-400 hover:text-gray-700 text-base font-bold p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body Viewport */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              {/* Broadcast RFQ Action Banner */}
              <div className="bg-[#0F1420] text-white p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[#C9A052] flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    Avinode Operator Network Broadcast
                  </p>
                  <p className="text-[11px] text-gray-300 mt-0.5">
                    Broadcast this RFQ directly to certified European & global charter operators.
                  </p>
                </div>
                <button
                  onClick={() => handleSendAvinodeRfq(avinodeModalReq)}
                  disabled={avinodeRfqSuccess}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap self-start sm:self-auto cursor-pointer ${
                    avinodeRfqSuccess
                      ? "bg-emerald-500 text-white"
                      : "bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420]"
                  }`}
                >
                  {avinodeRfqSuccess ? "✓ RFQ Broadcasted!" : "Send Avinode RFQ"}
                </button>
              </div>

              {/* Loading state */}
              {isLoadingAvinode && (
                <div className="py-10 text-center space-y-3">
                  <Loader2 className="w-7 h-7 text-[#C9A052] animate-spin mx-auto" />
                  <p className="text-xs font-mono text-gray-600">
                    Querying live operator fleet availability and empty legs across Avinode...
                  </p>
                </div>
              )}

              {/* Error notice */}
              {!isLoadingAvinode && avinodeError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start justify-between gap-2">
                  <span>{avinodeError}</span>
                  <button onClick={() => setAvinodeError(null)} className="text-amber-500 hover:text-amber-800 font-bold cursor-pointer">×</button>
                </div>
              )}

              {/* Results list */}
              {!isLoadingAvinode && avinodeResults.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-[11px] font-mono font-bold text-gray-500 uppercase tracking-wider">
                    Available Market Options ({avinodeResults.length})
                  </p>
                  {avinodeResults.map((opt, i) => (
                    <div
                      key={opt.id || i}
                      className="p-3 bg-[#F5F2EC] border border-[#E0DAD0] hover:border-[#C9A052] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-xs text-[#0F1420]">
                            {opt.aircraft?.name || "Private Jet"}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-gray-700 border border-[#E0DAD0]">
                            {opt.aircraft?.category || "Light"}
                          </span>
                          {opt.aircraft?.registration && (
                            <span className="text-[10px] font-mono text-gray-500">
                              {opt.aircraft.registration}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">
                          Operator: <strong className="text-[#0F1420]">{opt.operator?.name || "Charter Operator"}</strong> ({opt.operator?.country || "Europe"})
                          {opt.flightTime && ` • Est. ${opt.flightTime}`}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E0DAD0]/60">
                        <div className="text-left sm:text-right">
                          <span className="text-xs font-mono font-extrabold text-[#0F1420]">
                            €{(opt.priceUSD || 15000).toLocaleString()}
                          </span>
                          <span className="block text-[9px] font-mono text-emerald-700 font-bold">
                            Avinode Direct
                          </span>
                        </div>
                        <button
                          onClick={() => handleAcceptAvinodeOption(avinodeModalReq, opt)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#0F1420] hover:bg-[#1E2538] text-[#C9A052] text-xs font-bold transition-all shadow-sm whitespace-nowrap cursor-pointer"
                        >
                          + Import Option
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isLoadingAvinode && avinodeResults.length === 0 && !avinodeError && (
                <div className="py-8 text-center text-xs text-gray-500">
                  No immediate marketplace direct quotes found. Click "Send Avinode RFQ" above to broadcast to operators.
                </div>
              )}
            </div>

            {/* Pinned Footer */}
            <div className="px-5 py-3 border-t border-[#E0DAD0] flex justify-end shrink-0 bg-[#FAF8F5]">
              <button
                onClick={() => setAvinodeModalReq(null)}
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import { AgentRequest, SourcingOption, RequestMessage, Booking } from "@/types/aviation";
import { formatCurrency } from "@/lib/pricingCalculator";
import {
  Clock,
  CheckCircle2,
  FileText,
  Compass,
  Receipt,
  Send,
  Sparkles,
  Download,
  AlertCircle,
  Copy,
  Layers,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Link,
  Check,
  Plane,
  Building,
  CreditCard,
  Plus
} from "lucide-react";

export default function AgentRequestsListView() {
  const {
    agentRequests,
    refreshAgentRequests,
    openDocument,
    bookings,
    setActiveNav,
    addMessage,
    addAgentRequest,
    currentUser
  } = useAviation();

  useEffect(() => {
    void refreshAgentRequests();
  }, []);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});
  const [messageInputs, setMessageInputs] = useState<Record<string, string>>({});
  const [comparisonModalReq, setComparisonModalReq] = useState<AgentRequest | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Status mapping per PDF AGT-4: Submitted, In sourcing, Quoted, Accepted, Paid, Confirmed, Flown, Cancelled, Expired
  const filtered = agentRequests.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  const handleOpenDocForRequest = (req: AgentRequest, forcedType?: "quotation" | "flight_brief" | "invoice") => {
    const b = bookings.find((item) => item.id === req.bookingId || item.id === req.generatedBookingId) || bookings[0];
    const docType = forcedType || (req.type === "quote" ? "quotation" : req.type === "flight_brief" ? "flight_brief" : "invoice");
    openDocument(b, docType);
  };

  const handleDuplicateRequest = async (req: AgentRequest) => {
    const { id, ...requestData } = req;
    await addAgentRequest({
      ...requestData,
      title: `${req.title} (Duplicate)`,
      messages: []
    });
  };

  const handleSendMessage = (reqId: string) => {
    const text = messageInputs[reqId]?.trim();
    if (!text) return;

    addMessage(reqId, {
      senderName: currentUser?.name || "Marcus Vance",
      senderRole: "Charter Agent",
      content: text,
      isFromAdmin: false
    });

    setMessageInputs((prev) => ({ ...prev, [reqId]: "" }));
  };

  const handleShareClientLink = (req: AgentRequest) => {
    const booking = bookings.find((b) => b.id === req.bookingId || b.id === req.generatedBookingId) || bookings[0];
    const link = `https://app.orbelo.com/portal/${booking.id}?token=secure-client-token`;
    navigator.clipboard?.writeText(link);
    setCopiedLinkId(req.id);
    setTimeout(() => setCopiedLinkId(null), 2500);
  };

  const getStatusBadge = (status: AgentRequest["status"]) => {
    switch (status) {
      case "pending":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">Submitted</span>;
      case "in_sourcing":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-300">In Sourcing</span>;
      case "processing":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-300">Processing</span>;
      case "completed":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Quoted / Ready</span>;
      case "declined":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gray-100 text-gray-700 border border-gray-300">Declined</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30">
              AGENT PORTAL DESK [AGT-4 & AGT-7]
            </span>
            <span className="text-xs text-[#0F1420]/60">Requests, Quotes & Flight Status</span>
          </div>
          <h2 className="text-xl font-black text-[#0F1420] tracking-tight">
            My Submitted Requests & Generated Quotes
          </h2>
          <p className="text-xs text-[#0F1420]/65 mt-0.5">
            Monitor quotes, side-by-side aircraft comparisons, client links, desk messages, and flight briefs.
          </p>
        </div>

        <button
          onClick={() => setActiveNav("request_quote")}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F1420] text-white text-xs font-bold hover:bg-[#1A2338] transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-[#C9A052]" />
          <span>New Charter Request</span>
        </button>
      </div>

      {/* Status Filter Pills per AGT-4 */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-[#F5F2EC] p-1.5 rounded-xl border border-[#E0DAD0]">
        {[
          { key: "all", label: `All (${agentRequests.length})` },
          { key: "pending", label: "Submitted" },
          { key: "in_sourcing", label: "In Sourcing" },
          { key: "completed", label: "Quoted" },
          { key: "declined", label: "Declined" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === tab.key ? "bg-[#0F1420] text-white shadow-sm" : "text-[#0F1420]/70 hover:text-[#0F1420]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-12 text-center text-xs text-gray-500">
            No requests found in this status.
          </div>
        ) : (
          filtered.map((req) => {
            const isCompleted = req.status === "completed";
            const linkedBooking = bookings.find((b) => b.id === req.bookingId || b.id === req.generatedBookingId);
            const options = req.sourcingOptions || [];
            const hasMultipleOptions = options.length > 1;
            const messages = req.messages || [];
            const isMsgExpanded = expandedMessages[req.id] || false;

            return (
              <div
                key={req.id}
                className="bg-white border border-[#E0DAD0] hover:border-[#C9A052]/50 rounded-2xl p-5 shadow-sm transition-all space-y-4"
              >
                {/* Main Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30 flex-shrink-0 mt-0.5">
                      {req.type === "quote" && <FileText className="w-5 h-5" />}
                      {req.type === "flight_brief" && <Compass className="w-5 h-5" />}
                      {req.type === "invoice" && <Receipt className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(req.status)}
                        <span className="text-[10px] font-mono text-gray-400">
                          ID: {req.id} · Submitted: {req.createdAt}
                        </span>
                        {req.priority && (
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                            req.priority === "vip" ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-gray-100 text-gray-700"
                          }`}>
                            {req.priority}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-extrabold text-[#0F1420]">
                        {req.title}
                      </h3>

                      <div className="text-xs text-[#0F1420]/75 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px]">
                        <span>Client: <strong className="text-[#0F1420]">{req.clientName}</strong></span>
                        <span>Route: <strong className="text-[#0F1420]">{req.route}</strong></span>
                        <span>Date: <strong className="text-[#0F1420]">{req.flightDate}</strong></span>
                        <span>Pax: <strong className="text-[#0F1420]">{req.paxCount}</strong></span>
                        {req.luggageCount !== undefined && <span>Luggage: <strong>{req.luggageCount}</strong></span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                    {/* Duplicate button (AGT-2) */}
                    <button
                      onClick={() => handleDuplicateRequest(req)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F5F2EC] hover:bg-[#EAE6DE] text-[#0F1420] text-xs font-bold border border-[#D1C9BC] transition-all"
                      title="Duplicate this request"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Duplicate</span>
                    </button>

                    {/* Compare options button (AGT-5) */}
                    {hasMultipleOptions && (
                      <button
                        onClick={() => setComparisonModalReq(req)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0F1420] text-white text-xs font-bold hover:bg-[#1A2338] transition-all"
                      >
                        <Layers className="w-3.5 h-3.5 text-[#C9A052]" />
                        <span>Compare Options ({options.length})</span>
                      </button>
                    )}

                    {/* Share Client Link (AGT-5) */}
                    {isCompleted && (
                      <button
                        onClick={() => handleShareClientLink(req)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F5F2EC] hover:bg-[#EAE6DE] text-[#0F1420] text-xs font-bold border border-[#D1C9BC] transition-all"
                      >
                        {copiedLinkId === req.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link className="w-3.5 h-3.5" />}
                        <span>{copiedLinkId === req.id ? "Link Copied!" : "Client Link"}</span>
                      </button>
                    )}

                    {/* Download PDF button */}
                    {isCompleted ? (
                      <button
                        onClick={() => handleOpenDocForRequest(req)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black uppercase tracking-wider transition-all shadow-md"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-gray-500 bg-[#F5F2EC] px-3 py-1.5 rounded-xl border border-[#E0DAD0]">
                        Sourcing in Progress...
                      </span>
                    )}
                  </div>
                </div>

                {/* Linked Trip & Payment Status Strip (AGT-7) */}
                {linkedBooking && (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#F5F2EC] rounded-xl text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-[#0F1420]">Trip #{linkedBooking.tripNumber}</span>
                      <span className="text-gray-500 font-mono">Invoice #{linkedBooking.invoiceNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        linkedBooking.paymentStatus === "fully_paid"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : linkedBooking.paymentStatus === "deposit_paid"
                          ? "bg-blue-100 text-blue-800 border border-blue-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}>
                        {linkedBooking.paymentStatus === "fully_paid" ? "Paid in Full" : linkedBooking.paymentStatus === "deposit_paid" ? "Deposit Paid" : "Payment Pending"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDocForRequest(req, "flight_brief")}
                        className="text-xs text-[#0F1420] font-bold hover:underline"
                      >
                        Flight Brief
                      </button>
                      <span className="text-gray-300">·</span>
                      <button
                        onClick={() => handleOpenDocForRequest(req, "invoice")}
                        className="text-xs text-[#0F1420] font-bold hover:underline"
                      >
                        Invoice
                      </button>
                    </div>
                  </div>
                )}

                {/* Desk Messaging Section (AGT-6) */}
                <div className="border-t border-[#E0DAD0] pt-2">
                  <button
                    onClick={() => setExpandedMessages((prev) => ({ ...prev, [req.id]: !isMsgExpanded }))}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#0F1420]/70 hover:text-[#0F1420] transition-colors py-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#C9A052]" />
                    <span>Admin Desk Messages ({messages.length})</span>
                    {isMsgExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isMsgExpanded && (
                    <div className="mt-2 space-y-2 bg-[#FDFCFA] p-3 rounded-xl border border-[#E0DAD0]">
                      {messages.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic">No messages yet. Send an inquiry to the flight desk.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`p-2 rounded-lg text-xs ${
                                msg.isFromAdmin
                                  ? "bg-[#F5F2EC] border border-[#E0DAD0] text-[#0F1420]"
                                  : "bg-[#0F1420] text-white ml-6"
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] opacity-75 font-mono mb-0.5">
                                <span>{msg.senderName} ({msg.senderRole})</span>
                                <span>{msg.timestamp}</span>
                              </div>
                              <p>{msg.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Box */}
                      <div className="flex gap-2 pt-2 border-t border-[#E0DAD0]">
                        <input
                          type="text"
                          placeholder="Type message to flight operations desk..."
                          value={messageInputs[req.id] || ""}
                          onChange={(e) => setMessageInputs((prev) => ({ ...prev, [req.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(req.id); }}
                          className="flex-1 bg-white border border-[#E0DAD0] rounded-lg px-3 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        />
                        <button
                          onClick={() => handleSendMessage(req.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#C9A052] text-[#0F1420] font-bold text-xs hover:bg-[#B88F42] flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Side-by-Side Sourcing Comparison Modal (AGT-5) */}
      {comparisonModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 max-w-3xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#C9A052]" />
                <h3 className="text-base font-bold text-[#0F1420]">
                  Compare Sourcing Options — {comparisonModalReq.title}
                </h3>
              </div>
              <button onClick={() => setComparisonModalReq(null)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Multiple aircraft options have been sourced for this trip. Compare specifications and client pricing side by side:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(comparisonModalReq.sourcingOptions || []).map((opt, i) => (
                <div key={opt.id} className="border border-[#E0DAD0] rounded-xl p-4 bg-[#F5F2EC] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase bg-[#0F1420] text-white px-2 py-0.5 rounded">
                      Option {i + 1}
                    </span>
                    <span className="text-xs font-mono font-black text-[#C9A052]">
                      {formatCurrency(opt.price, opt.currency)}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-[#0F1420]">{opt.aircraftType}</h4>
                    <p className="text-xs text-gray-500 font-mono">Base: {opt.baseAirport}</p>
                    {opt.aircraftRegistration && (
                      <p className="text-xs text-gray-500 font-mono">Tail: {opt.aircraftRegistration}</p>
                    )}
                  </div>

                  <div className="text-[11px] text-gray-600 border-t border-[#E0DAD0] pt-2 space-y-1">
                    <p>Valid until: <strong>{opt.validUntil}</strong></p>
                    <p>Taxes included: <strong>{opt.taxesIncluded ? "Yes" : "No"}</strong></p>
                    {opt.notes && <p className="italic text-gray-500">{opt.notes}</p>}
                  </div>

                  <button
                    onClick={() => {
                      setComparisonModalReq(null);
                      handleShareClientLink(comparisonModalReq);
                    }}
                    className="w-full py-2 rounded-lg bg-[#C9A052] text-[#0F1420] text-xs font-bold hover:bg-[#B88F42] transition-all"
                  >
                    Select & Send to Client
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

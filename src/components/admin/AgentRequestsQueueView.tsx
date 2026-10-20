"use client";

import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import { AgentRequest } from "@/types/aviation";
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
  Sparkles
} from "lucide-react";

export default function AgentRequestsQueueView() {
  const {
    agentRequests,
    fulfillRequest,
    updateAgentRequestStatus,
    openDocument,
    bookings
  } = useAviation();

  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [selectedReqForModal, setSelectedReqForModal] = useState<AgentRequest | null>(null);

  const filteredRequests = agentRequests.filter((r) => {
    if (filter === "pending") return r.status === "pending";
    if (filter === "completed") return r.status === "completed";
    return true;
  });

  const pendingCount = agentRequests.filter((r) => r.status === "pending").length;
  const completedCount = agentRequests.filter((r) => r.status === "completed").length;

  const getTypeIcon = (type: AgentRequest["type"]) => {
    switch (type) {
      case "quote":
        return <FileText className="w-4 h-4 text-[#C9A052]" />;
      case "flight_brief":
        return <Compass className="w-4 h-4 text-[#C9A052]" />;
      case "invoice":
        return <Receipt className="w-4 h-4 text-[#C9A052]" />;
    }
  };

  const getTypeLabel = (type: AgentRequest["type"]) => {
    switch (type) {
      case "quote":
        return "Quote Request";
      case "flight_brief":
        return "Flight Brief Request";
      case "invoice":
        return "Invoice Request";
    }
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
            <span className="text-xs text-[#0F1420]/60">Broker Submissions Desk</span>
          </div>
          <h2 className="text-xl font-black text-[#0F1420] tracking-tight">
            Incoming Agent Requests
          </h2>
          <p className="text-xs text-[#0F1420]/65 mt-0.5">
            Review quotes, flight briefs, and invoice requests submitted by charter agents. Generate official documents and send them to brokers.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-[#F5F2EC] p-1.5 rounded-xl border border-[#E0DAD0]">
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

      {/* Requests Grid / List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-12 text-center text-xs text-gray-500">
            No agent requests found in this view.
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isPending = req.status === "pending";

            return (
              <div
                key={req.id}
                className="bg-white border border-[#E0DAD0] hover:border-[#C9A052]/60 rounded-2xl p-5 shadow-sm transition-all space-y-4"
              >
                {/* Top Row: Type, Status, Agent Info & Submitted Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E0DAD0]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30">
                      {getTypeIcon(req.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#9A7A35] bg-[#C9A052]/15 border border-[#C9A052]/30 px-2 py-0.5 rounded">
                          {getTypeLabel(req.type)}
                        </span>
                        <span className="text-xs font-mono text-gray-400">ID: {req.id}</span>
                      </div>
                      <h3 className="text-base font-extrabold text-[#0F1420] mt-0.5">
                        {req.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isPending ? (
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5 animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        Awaiting Admin Action
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Generated & Sent
                      </span>
                    )}

                    <span className="text-xs text-gray-500 font-mono hidden sm:inline">
                      Submitted: {req.createdAt}
                    </span>
                  </div>
                </div>

                {/* Middle Grid: Client, Route, Dates, Agent */}
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
                    <p className="text-[11px] text-gray-500">{req.clientPhone}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-gray-400">ROUTE & TIMING</span>
                    <p className="font-extrabold font-mono text-[#0F1420] mt-0.5">{req.route}</p>
                    <p className="text-[11px] text-gray-500">Date: {req.flightDate} • {req.paxCount} Pax</p>
                    {req.aircraftPreference && (
                      <p className="text-[10px] text-[#C9A052] font-mono font-bold">{req.aircraftPreference}</p>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-gray-400">SPECIAL REQUESTS / BUDGET</span>
                    <p className="text-[11px] text-[#0F1420]/80 mt-0.5 line-clamp-2">
                      {req.specialRequests || req.budgetNotes || "Standard VIP dispatch requested."}
                    </p>
                  </div>
                </div>

                {/* Bottom Row: Actions */}
                <div className="pt-3 border-t border-[#E0DAD0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                    {/* View Details modal */}
                    <button
                      onClick={() => setSelectedReqForModal(req)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#F5F2EC] hover:bg-[#EAE6DE] text-[#0F1420] text-xs font-bold transition-all border border-[#D1C9BC]"
                    >
                      View Full Details
                    </button>

                    {/* Primary Gold Generation & Fulfillment Button */}
                    <button
                      onClick={() => fulfillRequest(req)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isPending ? "Generate Document & Send" : "View Generated PDF"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Details Slide-Over or Modal */}
      {selectedReqForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E0DAD0] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
              <div className="flex items-center gap-2">
                {getTypeIcon(selectedReqForModal.type)}
                <h3 className="text-sm font-extrabold text-[#0F1420]">
                  {selectedReqForModal.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReqForModal(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#0F1420]/80">
              <p><strong>Submitting Agent:</strong> {selectedReqForModal.agentName} ({selectedReqForModal.agentEmail})</p>
              <p><strong>Client:</strong> {selectedReqForModal.clientName} ({selectedReqForModal.clientEmail}, {selectedReqForModal.clientPhone})</p>
              <p><strong>Company:</strong> {selectedReqForModal.companyName || "N/A"}</p>
              <p><strong>Routing:</strong> {selectedReqForModal.route}</p>
              <p><strong>Flight Date:</strong> {selectedReqForModal.flightDate}</p>
              <p><strong>Passengers:</strong> {selectedReqForModal.paxCount} Pax</p>
              {selectedReqForModal.aircraftPreference && (
                <p><strong>Aircraft Preference:</strong> {selectedReqForModal.aircraftPreference}</p>
              )}
              {selectedReqForModal.budgetNotes && (
                <p><strong>Budget / Pricing Notes:</strong> {selectedReqForModal.budgetNotes}</p>
              )}
              {selectedReqForModal.specialRequests && (
                <p><strong>Special Requirements / Catering:</strong> {selectedReqForModal.specialRequests}</p>
              )}
            </div>

            <div className="pt-3 border-t border-[#E0DAD0] flex justify-end gap-2">
              <button
                onClick={() => setSelectedReqForModal(null)}
                className="px-4 py-2 rounded-xl bg-gray-200 text-gray-800 text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  fulfillRequest(selectedReqForModal);
                  setSelectedReqForModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black uppercase tracking-wider"
              >
                Generate Document Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

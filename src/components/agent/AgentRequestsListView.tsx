"use client";

import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import { AgentRequest } from "@/types/aviation";
import {
  Clock,
  CheckCircle2,
  FileText,
  Compass,
  Receipt,
  Send,
  Sparkles,
  Download,
  AlertCircle
} from "lucide-react";

export default function AgentRequestsListView() {
  const { agentRequests, openDocument, bookings, setActiveNav } = useAviation();
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = agentRequests.filter((r) => {
    if (filterType !== "all" && r.type !== filterType) return false;
    return true;
  });

  const handleOpenDocForRequest = (req: AgentRequest) => {
    // Find booking
    const b = bookings.find((item) => item.id === req.bookingId || item.id === req.generatedBookingId) || bookings[0];
    const docType = req.type === "quote" ? "quotation" : req.type === "flight_brief" ? "flight_brief" : "invoice";
    openDocument(b, docType);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30">
              AGENT TRACKING DESK
            </span>
            <span className="text-xs text-[#0F1420]/60">Live Broker Status Monitor</span>
          </div>
          <h2 className="text-xl font-black text-[#0F1420] tracking-tight">
            My Submitted Requests & Generated Documents
          </h2>
          <p className="text-xs text-[#0F1420]/65 mt-0.5">
            Monitor quotes, flight briefs, and invoices requested from Admin Operations. Download official PDFs when ready.
          </p>
        </div>

        {/* Filter Type Pills */}
        <div className="flex items-center gap-1.5 bg-[#F5F2EC] p-1.5 rounded-xl border border-[#E0DAD0]">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === "all" ? "bg-[#0F1420] text-white shadow-sm" : "text-[#0F1420]/70"
            }`}
          >
            All ({agentRequests.length})
          </button>
          <button
            onClick={() => setFilterType("quote")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === "quote" ? "bg-[#0F1420] text-white shadow-sm" : "text-[#0F1420]/70"
            }`}
          >
            Quotes
          </button>
          <button
            onClick={() => setFilterType("flight_brief")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === "flight_brief" ? "bg-[#0F1420] text-white shadow-sm" : "text-[#0F1420]/70"
            }`}
          >
            Briefs
          </button>
          <button
            onClick={() => setFilterType("invoice")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === "invoice" ? "bg-[#0F1420] text-white shadow-sm" : "text-[#0F1420]/70"
            }`}
          >
            Invoices
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-12 text-center text-xs text-gray-500">
            No requests found in this category.
          </div>
        ) : (
          filtered.map((req) => {
            const isCompleted = req.status === "completed";

            return (
              <div
                key={req.id}
                className="bg-white border border-[#E0DAD0] hover:border-[#C9A052]/50 rounded-2xl p-5 shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30 flex-shrink-0 mt-0.5">
                    {req.type === "quote" && <FileText className="w-5 h-5" />}
                    {req.type === "flight_brief" && <Compass className="w-5 h-5" />}
                    {req.type === "invoice" && <Receipt className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase bg-[#F5F2EC] text-[#0F1420] px-2 py-0.5 rounded border border-[#E0DAD0]">
                        {req.type.replace("_", " ").toUpperCase()}
                      </span>
                      <span className="text-xs font-mono text-gray-400">Submitted: {req.createdAt}</span>
                    </div>

                    <h3 className="text-sm font-extrabold text-[#0F1420]">
                      {req.title}
                    </h3>

                    <div className="text-xs text-[#0F1420]/75 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px]">
                      <span>Client: <strong className="text-[#0F1420]">{req.clientName}</strong></span>
                      <span>Route: <strong className="text-[#0F1420]">{req.route}</strong></span>
                      <span>Date: <strong className="text-[#0F1420]">{req.flightDate}</strong></span>
                      <span>Pax: <strong className="text-[#0F1420]">{req.paxCount}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3 self-end sm:self-center">
                  {isCompleted ? (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Admin Generated
                      </span>

                      {/* Primary Gold Download Button */}
                      <button
                        onClick={() => handleOpenDocForRequest(req)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        In Admin Queue
                      </span>

                      <span className="text-[11px] text-gray-500 italic hidden md:inline">
                        Admin is reviewing request details
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { AgentRequest } from "@/types/aviation";
import StatusPill from "@/components/ui/StatusPill";
import {
  Inbox,
  Clock,
  ArrowRight,
  Plane,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  Send,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  Plus
} from "lucide-react";

interface RequestDetailProps {
  requestId: string;
}

export default function RequestDetailView({ requestId }: RequestDetailProps) {
  const router = useRouter();
  const { agentRequests, addMessage, updateAgentRequestStatus } = useAviation();
  const [chatMessage, setChatMessage] = useState("");

  const request = agentRequests.find((r) => r.id === requestId) || agentRequests[0];

  if (!request) {
    return (
      <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-8 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-[var(--amber)] mx-auto" />
        <h2 className="text-xl font-bold font-display text-[var(--ink)]">Request not found</h2>
        <Link href="/requests" className="btn-secondary inline-flex text-xs">
          Back to Requests
        </Link>
      </div>
    );
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    addMessage(request.id, {
      senderName: "Operations Desk",
      senderRole: "Admin",
      content: chatMessage.trim(),
      isFromAdmin: true
    });
    setChatMessage("");
  };

  const handleCreateQuote = () => {
    router.push(`/quotes/new?fromRequest=${request.id}`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--muted)] mb-1">
            <Link href="/requests" className="hover:underline">Requests</Link>
            <span>/</span>
            <span>{request.id}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-display text-[var(--ink)] m-0">
              Inquiry #{request.id}
            </h1>
            <StatusPill
              label={request.status.toUpperCase()}
              variant={
                request.status === "completed"
                  ? "green"
                  : request.status === "in_sourcing"
                  ? "blue"
                  : "amber"
              }
            />
          </div>
        </div>

        <button
          onClick={handleCreateQuote}
          className="btn-primary text-xs"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Create Quote from Request</span>
        </button>
      </div>

      {/* Main Grid: Details Left, Messages & Broker Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Request Details in Sourcing Order (R-033) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Client & Passenger Block */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-3">
            <h3 className="font-display font-bold text-sm text-[var(--ink)] m-0 uppercase tracking-wider text-[var(--muted)]">
              01 • Client & Contact Info
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs font-sans">
              <div>
                <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Client Name:</span>
                <span className="font-bold text-[var(--ink)]">{request.clientName}</span>
              </div>
              <div>
                <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Email:</span>
                <span className="font-mono">{request.clientEmail}</span>
              </div>
              <div>
                <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Phone:</span>
                <span className="font-mono">{request.clientPhone}</span>
              </div>
              <div>
                <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Company / Account:</span>
                <span className="font-medium">{request.companyName || "Private VIP"}</span>
              </div>
            </div>
          </div>

          {/* Routing & Schedule Block */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-3">
            <h3 className="font-display font-bold text-sm text-[var(--ink)] m-0 uppercase tracking-wider text-[var(--muted)]">
              02 • Sourcing Route & Timings
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-[var(--paper)] rounded border border-[var(--line)]">
                <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Origin</span>
                <span className="font-bold text-base text-[var(--ink)] block mt-0.5">{request.originIcao || "LSGG"}</span>
              </div>
              <div className="p-3 bg-[var(--paper)] rounded border border-[var(--line)]">
                <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Destination</span>
                <span className="font-bold text-base text-[var(--ink)] block mt-0.5">{request.destIcao || "EGSS"}</span>
              </div>
              <div className="p-3 bg-[var(--paper)] rounded border border-[var(--line)]">
                <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Flight Date</span>
                <span className="font-bold text-sm text-[var(--ink)] block mt-0.5">{request.flightDate}</span>
              </div>
              <div className="p-3 bg-[var(--paper)] rounded border border-[var(--line)]">
                <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Departure Time</span>
                <span className="font-bold text-sm text-[var(--ink)] block mt-0.5">{request.departureTime || "10:00"} Local</span>
              </div>
            </div>
          </div>

          {/* Aircraft & Passenger Payload */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-3">
            <h3 className="font-display font-bold text-sm text-[var(--ink)] m-0 uppercase tracking-wider text-[var(--muted)]">
              03 • Aircraft Preference & Passenger Payload
            </h3>
            <div className="grid grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 bg-[var(--paper)] rounded border border-[var(--line)]">
                <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Passengers</span>
                <span className="font-bold text-base text-[var(--ink)]">{request.paxCount} Pax</span>
              </div>
              <div className="p-3 bg-[var(--paper)] rounded border border-[var(--line)]">
                <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Category</span>
                <span className="font-bold text-sm text-[var(--ink)] truncate block">{request.aircraftPreference || "Midsize Jet"}</span>
              </div>
              <div className="p-3 bg-[var(--paper)] rounded border border-[var(--line)]">
                <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Luggage</span>
                <span className="font-bold text-sm text-[var(--ink)]">{request.luggageCount || 4} Pieces</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Broker & Messaging Thread (R-033) */}
        <div className="space-y-4">
          {/* Agent Box */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-4 space-y-2">
            <span className="font-display uppercase text-[10px] font-bold text-[var(--muted)] tracking-wider block">
              Submitting Broker
            </span>
            <div className="font-bold text-sm text-[var(--ink)]">{request.agentName}</div>
            <p className="font-mono text-xs text-[var(--muted)] m-0">{request.agentEmail}</p>
            <div className="pt-2 border-t border-[var(--line)] text-xs font-mono flex justify-between">
              <span>Tokens Used:</span>
              <span className="font-bold text-[var(--green)]">1 Token</span>
            </div>
          </div>

          {/* Interactive Messages Thread with Agent */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-4 space-y-3">
            <span className="font-display uppercase text-[10px] font-bold text-[var(--muted)] tracking-wider block">
              Message Thread with Broker
            </span>

            <div className="space-y-2 max-h-64 overflow-y-auto p-2 bg-[var(--paper)] rounded-lg border border-[var(--line)] text-xs font-sans">
              {(request.messages && request.messages.length > 0) ? (
                request.messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg text-xs space-y-0.5 ${
                      m.isFromAdmin
                        ? "bg-[var(--ink)] text-[var(--card)] ml-4"
                        : "bg-[var(--card)] text-[var(--ink)] mr-4 border border-[var(--line)]"
                    }`}
                  >
                    <div className="flex justify-between text-[10px] opacity-75 font-mono">
                      <span>{m.senderName}</span>
                      <span>{m.timestamp}</span>
                    </div>
                    <p className="m-0">{m.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-[var(--muted)] text-xs font-mono">
                  No messages yet. Send a note to the agent below.
                </p>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Reply to agent..."
                className="flex-1 bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-1.5 text-xs text-[var(--ink)] focus:outline-none"
              />
              <button type="submit" className="btn-primary text-xs">
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

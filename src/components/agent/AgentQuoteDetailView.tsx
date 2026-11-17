"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { formatCurrency } from "@/lib/pricingCalculator";
import { formatTripVersion } from "@/lib/idGenerator";
import StatusPill from "@/components/ui/StatusPill";
import {
  Plane,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Share2,
  Copy,
  Check,
  ArrowLeft,
  Calendar,
  Sparkles,
  Luggage,
  Coins
} from "lucide-react";

interface AgentQuoteDetailViewProps {
  quoteId: string;
}

export default function AgentQuoteDetailView({ quoteId }: AgentQuoteDetailViewProps) {
  const router = useRouter();
  const { bookings, openDocument, currentUser, settings } = useAviation();
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  // Find booking matching quoteId or tripId
  const booking = bookings.find(
    (b) => b.id === quoteId || b.tripId === quoteId || b.tripNumber === quoteId
  ) || bookings[0];

  const rootId = (booking.tripId || booking.tripNumber || "FE4578").split("-")[0];
  const versionNum = booking.quoteVersion || 1;
  const versionBadge = formatTripVersion(rootId, versionNum);
  const clientPrice = booking.pricing.totalFlightPrice;
  const agentCommission = clientPrice * 0.05; // 5% agent commission

  const handleCopyClientLink = () => {
    const link = `https://app.orbelo.com/client-quote/${rootId}`;
    navigator.clipboard?.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Back & Header Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/agent/requests"
          className="btn-secondary text-xs inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Requests</span>
        </Link>

        <span className="pill blue font-mono text-[10px] uppercase font-bold">
          DIRECTION B · AGENT QUOTE PORTAL
        </span>
      </div>

      {/* Main Quote Card */}
      <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-[var(--muted)]">Trip {rootId}</span>
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                {versionBadge}
              </span>
              <StatusPill label="OFFICIAL QUOTE" variant="green" />
            </div>
            <h1 className="text-2xl font-bold font-display text-[var(--ink)] m-0">
              {booking.legs[0]?.origin?.icao} ⇄ {booking.legs[0]?.destination?.icao}
            </h1>
            <p className="text-xs text-[var(--muted)] mt-1 font-sans">
              Client: <strong className="text-[var(--ink)]">{booking.client.fullName}</strong> ({booking.client.companyName || "Private VIP"})
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => openDocument(booking, "quotation")}
              className="btn-secondary text-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Quote PDF</span>
            </button>

            <button
              onClick={handleCopyClientLink}
              className="btn-secondary text-xs"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "Link Copied!" : "Client Share Link"}</span>
            </button>

            <button
              onClick={() => setIsAccepted(true)}
              disabled={isAccepted}
              className="btn-primary text-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isAccepted ? "Quote Accepted" : "Accept & Proceed"}</span>
            </button>
          </div>
        </div>

        {/* Schedule & Flight Itinerary */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-sm text-[var(--ink)] m-0">Flight Schedule & Routing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {booking.legs.map((leg, idx) => (
              <div key={idx} className="border border-[var(--line)] rounded-lg p-4 bg-[var(--paper)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[var(--muted)]">LEG 0{idx + 1}</span>
                  <span className="font-mono text-xs text-[var(--ink)]">{leg.flightDate}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="font-display font-bold text-base text-[var(--ink)] block">
                      {leg.origin?.city || "Geneva"} ({leg.origin?.icao})
                    </span>
                    <span className="font-mono text-xs text-[var(--muted)]">{leg.departureTimeLocal} Local</span>
                  </div>
                  <span className="text-xs text-[var(--muted)]">→</span>
                  <div className="text-right">
                    <span className="font-display font-bold text-base text-[var(--ink)] block">
                      {leg.destination?.city || "London"} ({leg.destination?.icao})
                    </span>
                    <span className="font-mono text-xs text-[var(--muted)]">{leg.arrivalTimeLocal} Local</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[var(--line)] text-xs text-[var(--muted)] font-mono flex justify-between">
                  <span>Flight time: ~{leg.flightTimeFormatted || "1h 45m"}</span>
                  <span>{leg.paxCount} Pax</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Aircraft Specification (Clean - NO OPERATOR NAME PER R-040) */}
        <div className="border border-[var(--line)] rounded-xl p-5 bg-[var(--paper)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display uppercase text-[10px] font-bold text-[var(--muted)] tracking-wider">
              OFFERED AIRCRAFT
            </span>
            <span className="pill green text-[10px]">VERIFIED CHARTER</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Category:</span>
              <span className="font-bold text-sm text-[var(--ink)] font-sans">{booking.aircraft.categoryLabel || "Midsize Jet"}</span>
            </div>
            <div>
              <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Model:</span>
              <span className="font-bold text-sm text-[var(--ink)] font-sans">{booking.aircraft.name}</span>
            </div>
            <div>
              <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Configuration:</span>
              <span className="text-[var(--ink)]">{booking.aircraft.passengers} Club Seats</span>
            </div>
            <div>
              <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Amenities:</span>
              <span className="text-[var(--ink)]">Lavatory, Wi-Fi</span>
            </div>
          </div>
        </div>

        {/* Financial Breakdown (Transparent for Agent - NO OPERATOR COST, NO COMPANY MARGIN TIER PER R-040) */}
        <div className="border border-[var(--line)] rounded-xl p-5 bg-[var(--paper)] space-y-3">
          <span className="font-display uppercase text-[10px] font-bold text-[var(--muted)] tracking-wider block">
            PRICING & BROKER COMMISSION
          </span>
          <div className="divide-y divide-[var(--line)] text-xs font-mono">
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-[var(--muted)] font-sans">Client Charter Total (Wire Base):</span>
              <span className="font-black text-lg text-[var(--ink)]">
                {formatCurrency(clientPrice, booking.pricing.currency)}
              </span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <div>
                <span className="font-bold text-[var(--accent)] font-sans block">Agent Commission (5.0%):</span>
                <span className="text-[11px] text-[var(--muted)] font-sans">Retained earnings payable to your broker account</span>
              </div>
              <span className="font-bold text-base text-[var(--green)]">
                + {formatCurrency(agentCommission, booking.pricing.currency)}
              </span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-[var(--muted)] font-sans">Client Credit Card Payment Amount:</span>
              <span className="font-bold text-[var(--ink)]">
                {formatCurrency(clientPrice * 1.035, booking.pricing.currency)} (+3.5% card processing)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

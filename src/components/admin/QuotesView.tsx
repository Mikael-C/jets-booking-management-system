"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { Booking } from "@/types/aviation";
import { formatTripVersion, formatDocumentId, extractFeToken } from "@/lib/idGenerator";
import { formatCurrency } from "@/lib/pricingCalculator";
import StatusPill from "@/components/ui/StatusPill";
import MissingDataBadge from "@/components/ui/MissingDataBadge";
import {
  FileText,
  Search,
  Plus,
  Plane,
  Clock,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Filter,
  ArrowRight,
  User,
  Shield,
  CreditCard
} from "lucide-react";

type QuoteFilter = "open" | "expiring_today" | "agent_confirmed" | "draft" | "expired" | "declined" | "all";

export default function QuotesView() {
  const router = useRouter();
  const {
    bookings,
    openDocument,
    convertQuoteToBooked,
    role
  } = useAviation();

  const [activeFilter, setActiveFilter] = useState<QuoteFilter>("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  // Read any quote selected from creation flow
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("orbelo_selected_quote_id");
      if (stored) {
        setSelectedQuoteId(stored);
        sessionStorage.removeItem("orbelo_selected_quote_id");
      }
    }
  }, []);

  // Filter out trips that are already booked (Bookings shows Booked onward only)
  // And group to get ONLY the latest version per trip root
  const quoteRows = useMemo(() => {
    // Collect all trip versions that are NOT yet booked as flights
    const unbookedTrips = bookings.filter((b) => {
      const isBooked = Boolean(
        b.isBooked ||
        ["confirmed", "dispatched", "in_flight", "completed", "flown"].includes(b.status)
      );
      return !isBooked;
    });

    const getQuoteGroupRoot = (b: Booking): string => {
      const feToken = extractFeToken(b.tripId || b.tripNumber || b.quoteReference || b.id);
      if (feToken) return `TRI-${feToken}`;
      if (b.tripNumber && !b.tripNumber.toUpperCase().startsWith("QTE-")) {
        return b.tripNumber;
      }
      if (b.tripId) {
        return b.tripId;
      }
      return b.id;
    };

    // Group by root trip ID
    const rootMap = new Map<string, Booking[]>();
    unbookedTrips.forEach((b) => {
      const root = getQuoteGroupRoot(b);
      const list = rootMap.get(root) || [];
      list.push(b);
      rootMap.set(root, list);
    });

    // Return the latest version of each group
    const latestList: { booking: Booking; versionsCount: number; rootId: string }[] = [];
    rootMap.forEach((versions, rootId) => {
      const sorted = [...versions].sort((a, b) => (a.quoteVersion || 1) - (b.quoteVersion || 1));
      const latest = sorted[sorted.length - 1];
      latestList.push({
        booking: latest,
        versionsCount: versions.length,
        rootId
      });
    });

    return latestList;
  }, [bookings]);

  // Selected quote for preview panel
  const selectedItem = useMemo(() => {
    if (!selectedQuoteId && quoteRows.length > 0) {
      return quoteRows[0];
    }
    return quoteRows.find((item) => item.booking.id === selectedQuoteId) || quoteRows[0];
  }, [selectedQuoteId, quoteRows]);

  // Counts for chips
  const counts = useMemo(() => {
    return {
      all: quoteRows.length,
      open: quoteRows.filter((q) => !["declined", "expired", "draft"].includes(q.booking.quoteStatus || "")).length,
      expiring_today: quoteRows.filter((q) => (q.booking.quoteExpirationDate || "").toLowerCase().includes("today") || (q.booking.quoteExpirationDate || "").toLowerCase().includes("19:")).length,
      agent_confirmed: quoteRows.filter((q) => q.booking.agentConfirmedPendingSuperAdmin || q.booking.quoteStatus === "accepted").length,
      draft: quoteRows.filter((q) => q.booking.quoteStatus === "draft" || q.booking.status === "draft").length,
      expired: quoteRows.filter((q) => q.booking.quoteStatus === "expired" || q.booking.status === "expired").length,
      declined: quoteRows.filter((q) => q.booking.quoteStatus === "declined").length
    };
  }, [quoteRows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return quoteRows.filter(({ booking, rootId }) => {
      // Chip filter
      if (activeFilter === "open") {
        if (["declined", "expired", "draft"].includes(booking.quoteStatus || "")) return false;
      } else if (activeFilter === "expiring_today") {
        const exp = (booking.quoteExpirationDate || "").toLowerCase();
        if (!exp.includes("today") && !exp.includes("19:")) return false;
      } else if (activeFilter === "agent_confirmed") {
        if (!booking.agentConfirmedPendingSuperAdmin && booking.quoteStatus !== "accepted") return false;
      } else if (activeFilter === "draft") {
        if (booking.quoteStatus !== "draft" && booking.status !== "draft") return false;
      } else if (activeFilter === "expired") {
        if (booking.quoteStatus !== "expired" && booking.status !== "expired") return false;
      } else if (activeFilter === "declined") {
        if (booking.quoteStatus !== "declined") return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const clientName = (booking.client?.fullName || "").toLowerCase();
        const accountNum = (booking.accountNumber || "").toLowerCase();
        const aircraft = (booking.aircraft?.name || "").toLowerCase();
        const route = booking.legs.map((l) => `${l.origin?.icao} ${l.destination?.icao}`).join(" ").toLowerCase();
        return (
          rootId.toLowerCase().includes(q) ||
          clientName.includes(q) ||
          accountNum.includes(q) ||
          aircraft.includes(q) ||
          route.includes(q)
        );
      }

      return true;
    });
  }, [quoteRows, activeFilter, searchQuery]);

  const chips: { id: QuoteFilter; label: string; count: number }[] = [
    { id: "open", label: "Open", count: counts.open },
    { id: "expiring_today", label: "Expiring today", count: counts.expiring_today },
    { id: "agent_confirmed", label: "Agent confirmed", count: counts.agent_confirmed },
    { id: "draft", label: "Draft", count: counts.draft },
    { id: "expired", label: "Expired", count: counts.expired },
    { id: "declined", label: "Declined", count: counts.declined },
    { id: "all", label: "All quotes", count: counts.all }
  ];

  const handleOpenTrip = (targetTripId: string) => {
    router.push(`/trips/${encodeURIComponent(targetTripId)}/itinerary`);
  };

  return (
    <div className="space-y-4">
      {/* Page Title & Create Action (No hero banner per Section 02) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
        <div>
          <h1 className="text-2xl font-bold font-display text-[var(--ink)] m-0">
            Quotation Management
          </h1>
          <p className="text-xs text-[var(--muted)] font-mono mt-0.5">
            R-012 • Active quote iterations with side inspection preview
          </p>
        </div>

        <Link href="/quotes/new" className="btn-primary text-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>New Quote</span>
        </Link>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {chips.map((chip) => {
            const isSelected = activeFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setActiveFilter(chip.id)}
                className={`text-xs font-mono px-3 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[var(--ink)] text-[var(--card)] border-[var(--ink)] font-semibold"
                    : "bg-[var(--card)] text-[var(--muted)] border-[var(--line)] hover:border-[var(--muted)]"
                }`}
              >
                <span>{chip.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? "bg-[var(--card)] text-[var(--ink)]" : "bg-[var(--wf)] text-[var(--muted)]"
                  }`}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search quotes by client, ID, route..."
            className="w-full bg-[var(--card)] border border-[var(--line)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] font-sans"
          />
        </div>
      </div>

      {/* Main Split Layout: Dense Table + Preview Rail */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left 2 Cols: Dense Quotes Table */}
        <div className="xl:col-span-2">
          <div className="tablewrap">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Quote</th>
                  <th>Flight Date & Time</th>
                  <th>Route & Type</th>
                  <th>Account & Agent</th>
                  <th>Aircraft</th>
                  <th>Pax</th>
                  <th>Client Price</th>
                  <th>Expires In</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-[var(--muted)]">
                      <p className="text-sm">No quotes matching this filter</p>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map(({ booking, versionsCount, rootId }) => {
                    const isSelected = selectedItem?.booking.id === booking.id;
                    const targetId = booking.tripId || rootId || booking.id;
                    const verLabel = booking.tripNumber || formatTripVersion(rootId, booking.quoteVersion || 1);
                    const leg = booking.legs[0];

                    return (
                      <tr
                        key={booking.id}
                        onClick={() => setSelectedQuoteId(booking.id)}
                        onDoubleClick={() => handleOpenTrip(targetId)}
                        className={`clickable-row ${isSelected ? "bg-[var(--accent-soft)]" : ""}`}
                      >
                        <td>
                          <Link
                            href={`/trips/${encodeURIComponent(targetId)}/itinerary`}
                            className="font-mono font-bold text-xs block text-[var(--ink)] hover:text-[var(--accent)] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {verLabel}
                          </Link>
                          <span className="font-mono text-[10px] text-[var(--muted)]">
                            {versionsCount} {versionsCount === 1 ? "version" : "versions"}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono text-xs font-semibold block">
                            {leg?.flightDate || "—"}
                          </span>
                          <span className="font-mono text-[11px] text-[var(--muted)]">
                            {leg?.departureTimeLocal || "10:00"}
                          </span>
                        </td>
                        <td>
                          <span className="font-display font-bold text-sm block">
                            {leg?.origin?.icao || "LSGG"} ⇄ {leg?.destination?.icao || "EGSS"}
                          </span>
                          <span className="font-mono text-[10px] uppercase text-[var(--muted)]">
                            {booking.tripType.replace("_", " ")}
                          </span>
                        </td>
                        <td>
                          <span className="font-sans font-semibold text-xs block text-[var(--ink)]">
                            {booking.client?.fullName || "Edward Brinkmann"}
                          </span>
                          <span className="font-mono text-[10px] text-[var(--muted)]">
                            {booking.agentName ? `Rep: ${booking.agentName.split(" ")[0]}` : booking.accountNumber}
                          </span>
                        </td>
                        <td>
                          <span className="font-sans text-xs font-medium block">
                            {booking.aircraft?.name || "Mustang"}
                          </span>
                          <span className="font-mono text-[10px] text-[var(--muted)]">
                            {booking.aircraft?.categoryLabel || "Entry-level"}
                          </span>
                        </td>
                        <td className="font-mono font-bold text-xs">
                          {leg?.paxCount || 4}
                        </td>
                        <td>
                          <span className="font-mono font-bold text-xs text-[var(--ink)]">
                            {formatCurrency(booking.pricing.totalFlightPrice, booking.pricing.currency)}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono text-[11px] text-[var(--amber)] font-medium">
                            {booking.quoteExpirationDate ? "in 18h" : "48h"}
                          </span>
                        </td>
                        <td>
                          <StatusPill
                            label={(booking.quoteStatus || booking.status || "open").toUpperCase()}
                            variant={
                              booking.quoteStatus === "accepted"
                                ? "green"
                                : booking.quoteStatus === "expired"
                                ? "red"
                                : "blue"
                            }
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Preview Panel (R-012) */}
        {selectedItem && (() => {
          const previewTargetId = selectedItem.booking.tripId || selectedItem.rootId || selectedItem.booking.id;
          const previewLabel = selectedItem.booking.tripNumber || formatTripVersion(selectedItem.rootId, selectedItem.booking.quoteVersion || 1);

          return (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-[var(--muted)]">
                    Quote Preview
                  </span>
                  <h3 className="font-mono font-bold text-lg text-[var(--ink)] m-0">
                    {previewLabel}
                  </h3>
                </div>

                <button
                  onClick={() => handleOpenTrip(previewTargetId)}
                  className="btn-secondary text-xs"
                >
                  <span>Open trip</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

            {/* Itinerary Snippet */}
            <div className="space-y-1.5 text-xs font-sans">
              <span className="font-display font-bold uppercase text-[10px] text-[var(--muted)] tracking-wider">
                Routing & Schedule
              </span>
              <div className="p-3 bg-[var(--paper)] rounded-lg border border-[var(--line)] space-y-1">
                <div className="font-display font-bold text-sm text-[var(--ink)]">
                  {selectedItem.booking.legs[0]?.origin?.name || "Geneva"} ({selectedItem.booking.legs[0]?.origin?.icao}) ⇄{" "}
                  {selectedItem.booking.legs[0]?.destination?.name || "London"} ({selectedItem.booking.legs[0]?.destination?.icao})
                </div>
                <div className="font-mono text-xs text-[var(--muted)]">
                  Date: {selectedItem.booking.legs[0]?.flightDate} • {selectedItem.booking.legs[0]?.departureTimeLocal} Local
                </div>
              </div>
            </div>

            {/* Aircraft & Pax */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-[var(--paper)] rounded border border-[var(--line)]">
                <span className="text-[10px] text-[var(--muted)] uppercase block">Aircraft</span>
                <span className="font-bold text-[var(--ink)] block truncate">
                  {selectedItem.booking.aircraft?.name}
                </span>
              </div>
              <div className="p-2.5 bg-[var(--paper)] rounded border border-[var(--line)]">
                <span className="text-[10px] text-[var(--muted)] uppercase block">Passengers</span>
                <span className="font-bold text-[var(--ink)] block">
                  {selectedItem.booking.legs[0]?.paxCount || 4} Pax
                </span>
              </div>
            </div>

            {/* Price Build (Admin Visibility) */}
            <div className="space-y-1.5 text-xs font-mono">
              <span className="font-display font-bold uppercase text-[10px] text-[var(--muted)] tracking-wider">
                Price Build (Admin)
              </span>
              <div className="p-3 bg-[var(--paper)] rounded-lg border border-[var(--line)] space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Direct Flight Cost:</span>
                  <span>€11,200.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Company Margin (Tier 2):</span>
                  <span>+ €1,120.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Agent Commission:</span>
                  <span>+ €550.00</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[var(--line)] font-bold text-sm text-[var(--ink)]">
                  <span>Client Total:</span>
                  <span>{formatCurrency(selectedItem.booking.pricing.totalFlightPrice, selectedItem.booking.pricing.currency)}</span>
                </div>
              </div>
            </div>

            {/* Actions: Quote PDF, Revise, Book */}
            <div className="space-y-2 pt-2 border-t border-[var(--line)]">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => openDocument(selectedItem.booking, "quotation")}
                  className="btn-secondary text-xs justify-center"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Quote PDF</span>
                </button>

                <Link
                  href={`/quotes/${selectedItem.booking.id}/revise`}
                  className="btn-secondary text-xs justify-center"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Revise</span>
                </Link>
              </div>

              <button
                onClick={async () => {
                  await convertQuoteToBooked(selectedItem.booking.id, selectedItem.booking);
                }}
                className="w-full btn-primary text-xs justify-center"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Book This Quote</span>
              </button>
            </div>
          </div>
        );
      })()}
      </div>
    </div>
  );
}

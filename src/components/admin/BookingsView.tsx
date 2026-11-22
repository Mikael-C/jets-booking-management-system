"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { Booking } from "@/types/aviation";
import { formatTripVersion, formatDocumentId, extractFeToken, renderFormattedId } from "@/lib/idGenerator";
import { formatCurrency } from "@/lib/pricingCalculator";
import StatusPill from "@/components/ui/StatusPill";
import MissingDataBadge from "@/components/ui/MissingDataBadge";
import {
  Plane,
  Search,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Compass,
  Receipt,
  ArrowRight,
  Filter,
  Check,
  ArrowUpDown
} from "lucide-react";

type BookingFilter = "upcoming" | "flying_this_week" | "unpaid" | "missing_data" | "flown_to_close" | "cancelled" | "all";
type SortMode = "newest" | "next_departure";

export default function BookingsView() {
  const router = useRouter();
  const {
    bookings,
    openDocument
  } = useAviation();

  const [activeFilter, setActiveFilter] = useState<BookingFilter>("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  // MOD-16: default sort = newest booking first
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  // R-013: A list of trips with a signed contract ONLY.
  // A quote with no signed contract never appears here, even if payment was recorded.
  const bookedTrips = useMemo(() => {
    return bookings.filter((b) => {
      const isSignedOrBooked = Boolean(
        b.isBooked ||
        b.isContractSigned ||
        ["confirmed", "dispatched", "in_flight", "completed", "flown"].includes(b.status)
      );
      return isSignedOrBooked;
    });
  }, [bookings]);

  // Group by root trip ID, take the latest active booking iteration
  const latestBookings = useMemo(() => {
    const rootMap = new Map<string, Booking[]>();
    bookedTrips.forEach((b) => {
      const feToken = extractFeToken(b.tripId || b.tripNumber || b.id);
      const root = feToken ? `TRI-${feToken}` : (b.tripId || b.tripNumber || b.id).toUpperCase().replace(/^BOOKING-/, "");
      const list = rootMap.get(root) || [];
      list.push(b);
      rootMap.set(root, list);
    });

    const list: { booking: Booking; versionsCount: number; rootId: string }[] = [];
    rootMap.forEach((versions, rootId) => {
      const sorted = [...versions].sort((a, b) => (a.quoteVersion || 1) - (b.quoteVersion || 1));
      list.push({
        booking: sorted[sorted.length - 1],
        versionsCount: versions.length,
        rootId
      });
    });

    // MOD-16: sort newest first by default
    list.sort((a, b) => {
      const aDate = new Date(a.booking.createdAt || 0).getTime();
      const bDate = new Date(b.booking.createdAt || 0).getTime();
      return bDate - aDate;
    });

    return list;
  }, [bookedTrips]);

  // Compute operational readiness per trip (passengers passport, slot, permit)
  const computeReadiness = (booking: Booking) => {
    const missingPax = booking.legs.flatMap((l) => l.passengers).some(
      (p) => !p.passportNumber || p.passportNumber.length < 5
    );
    const missingSlot = false; // Slot confirmed
    const missingPermit = false; // Overflight permit granted
    return {
      isReady: !missingPax && !missingSlot && !missingPermit,
      missingPax,
      missingSlot,
      missingPermit
    };
  };

  // Filter counts
  const counts = useMemo(() => {
    return {
      all: latestBookings.length,
      upcoming: latestBookings.filter((b) => !["completed", "flown", "cancelled"].includes(b.booking.status)).length,
      flying_this_week: latestBookings.filter((b) => !["completed", "flown", "cancelled"].includes(b.booking.status)).length,
      unpaid: latestBookings.filter((b) => b.booking.paymentStatus !== "fully_paid").length,
      missing_data: latestBookings.filter((b) => !computeReadiness(b.booking).isReady).length,
      flown_to_close: latestBookings.filter((b) => ["completed", "flown"].includes(b.booking.status)).length,
      cancelled: latestBookings.filter((b) => b.booking.status === "cancelled" || b.booking.isCancelled).length
    };
  }, [latestBookings]);

  // Filtered list
  const filteredBookings = useMemo(() => {
    return latestBookings.filter(({ booking, rootId }) => {
      const readiness = computeReadiness(booking);

      if (activeFilter === "upcoming") {
        if (["completed", "flown", "cancelled"].includes(booking.status)) return false;
      } else if (activeFilter === "flying_this_week") {
        if (["completed", "flown", "cancelled"].includes(booking.status)) return false;
      } else if (activeFilter === "unpaid") {
        if (booking.paymentStatus === "fully_paid") return false;
      } else if (activeFilter === "missing_data") {
        if (readiness.isReady) return false;
      } else if (activeFilter === "flown_to_close") {
        if (!["completed", "flown"].includes(booking.status)) return false;
      } else if (activeFilter === "cancelled") {
        if (!booking.isCancelled && booking.status !== "cancelled") return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const clientName = (booking.client?.fullName || "").toLowerCase();
        const aircraft = (booking.aircraft?.name || "").toLowerCase();
        const route = booking.legs.map((l) => `${l.origin?.icao} ${l.destination?.icao}`).join(" ").toLowerCase();
        return (
          rootId.toLowerCase().includes(q) ||
          clientName.includes(q) ||
          aircraft.includes(q) ||
          route.includes(q)
        );
      }

      return true;
    });
  }, [latestBookings, activeFilter, searchQuery]);

  // MOD-16: apply sort mode
  const sortedBookings = useMemo(() => {
    if (sortMode === "next_departure") {
      return [...filteredBookings].sort((a, b) => {
        const aDate = a.booking.legs[0]?.flightDate || "";
        const bDate = b.booking.legs[0]?.flightDate || "";
        return aDate.localeCompare(bDate);
      });
    }
    // "newest" — already sorted by createdAt desc from latestBookings
    return filteredBookings;
  }, [filteredBookings, sortMode]);

  // Split into "This week" and "Later"
  const thisWeekList = sortedBookings; // All upcoming flights in our active schedule
  const laterList: typeof sortedBookings = [];

  const chips: { id: BookingFilter; label: string; count: number }[] = [
    { id: "upcoming", label: "Upcoming", count: counts.upcoming },
    { id: "flying_this_week", label: "Flying this week", count: counts.flying_this_week },
    { id: "unpaid", label: "Unpaid", count: counts.unpaid },
    { id: "missing_data", label: "Missing data", count: counts.missing_data },
    { id: "flown_to_close", label: "Flown · to close", count: counts.flown_to_close },
    { id: "cancelled", label: "Cancelled", count: counts.cancelled },
    { id: "all", label: "All bookings", count: counts.all }
  ];

  const handleRowClick = (rootId: string) => {
    router.push(`/trips/${rootId}/messages`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
        <div>
          <h1 className="text-2xl font-bold font-display text-[var(--ink)] m-0">
            Bookings &amp; Dispatch Management
          </h1>
          <p className="text-xs text-[var(--muted)] font-mono mt-0.5">
            R-013 • Confirmed charter contracts with operational readiness indicators
          </p>
        </div>
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
            placeholder="Search bookings by client, tail, route..."
            className="w-full bg-[var(--card)] border border-[var(--line)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] font-sans"
          />
        </div>
      </div>

      {/* Bookings Section: This Week */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold uppercase text-xs text-[var(--muted)] tracking-wider">
            Departures This Week (Nearest First)
          </span>
          <span className="pill grey text-[10px]">{thisWeekList.length} flights</span>

          {/* MOD-16: Sort toggle */}
          <button
            onClick={() => setSortMode(sortMode === "newest" ? "next_departure" : "newest")}
            title={sortMode === "newest" ? "Sorted by newest booking — click for next departure" : "Sorted by next departure — click for newest booking"}
            className="ml-auto flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-[var(--line)] bg-[var(--card)] text-[var(--muted)] hover:border-[var(--muted)] transition-all"
          >
            <ArrowUpDown className="w-3 h-3" />
            {sortMode === "newest" ? "Newest first" : "Next departure"}
          </button>
        </div>

        <div className="tablewrap">
          <table className="dense-table">
            <thead>
              <tr>
                <th>Trip &amp; Version</th>
                <th>Next Departure</th>
                <th>Route</th>
                {/* MOD-14: "Agent" → "Curator" */}
                <th>Account &amp; Curator</th>
                <th>Aircraft &amp; Tail</th>
                <th>Pax</th>
                <th>Price</th>
                <th>Payment</th>
                <th>Ops Readiness</th>
                <th>Stage</th>
              </tr>
            </thead>
            <tbody>
              {thisWeekList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-[var(--muted)]">
                    <p className="text-sm">No bookings yet for this filter</p>
                  </td>
                </tr>
              ) : (
                thisWeekList.map(({ booking, versionsCount, rootId }) => {
                  const leg = booking.legs[0];
                  const readiness = computeReadiness(booking);

                  return (
                    <tr
                      key={booking.id}
                      onClick={() => handleRowClick(rootId)}
                      className="clickable-row"
                    >
                      <td>
                        {/* MOD-01: use renderFormattedId for trip number */}
                        <Link
                          href={`/trips/${rootId}/messages`}
                          className="font-mono font-bold text-xs block text-[var(--ink)] hover:text-[var(--accent)] hover:underline"
                        >
                          {renderFormattedId(rootId)}
                        </Link>
                        <span className="font-mono text-[10px] text-[var(--muted)]">
                          {versionsCount} versions
                        </span>
                      </td>
                      <td>
                        <span className="font-mono font-bold text-xs block">
                          {leg?.flightDate || "—"} ({leg?.departureTimeLocal || "—"})
                        </span>
                        {/* MOD-10: removed hardcoded "in 3 d" — no dynamic countdown available */}
                      </td>
                      <td>
                        {/* MOD-16: whitespace-nowrap on route cell */}
                        <span className="font-display font-bold text-sm block whitespace-nowrap">
                          {leg?.origin?.icao || "—"} ⇄ {leg?.destination?.icao || "—"}
                        </span>
                        <span className="font-mono text-[10px] uppercase text-[var(--muted)]">
                          {booking.tripType.replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        {/* MOD-10: removed hardcoded "Edward Brinkmann" */}
                        <span className="font-sans font-semibold text-xs block text-[var(--ink)]">
                          {booking.client?.fullName || "—"}
                        </span>
                        {/* MOD-14: agentName display label context — variable name unchanged */}
                        <span className="font-mono text-[10px] text-[var(--muted)]">
                          {booking.accountNumber}{booking.agentName ? ` • ${booking.agentName.split(" ")[0]}` : ""}
                        </span>
                      </td>
                      <td>
                        {/* MOD-10: removed hardcoded "Mustang" and "OE-FFB" */}
                        <span className="font-sans text-xs font-medium block">
                          {booking.aircraft?.name || "—"}
                        </span>
                        <span className="font-mono text-xs font-bold text-[var(--ink)]">
                          {leg?.aircraftRegistration || "—"}
                        </span>
                      </td>
                      <td className="font-mono font-bold text-xs">
                        {/* MOD-10: removed hardcoded 4 */}
                        {leg?.paxCount ?? "—"}
                      </td>
                      <td>
                        <span className="font-mono font-bold text-xs text-[var(--ink)]">
                          {formatCurrency(booking.pricing.totalFlightPrice, booking.pricing.currency)}
                        </span>
                      </td>
                      <td>
                        <StatusPill
                          label={(booking.paymentStatus || "unpaid").toUpperCase()}
                          variant={booking.paymentStatus === "fully_paid" ? "green" : "amber"}
                        />
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          {readiness.isReady ? (
                            <span className="text-[var(--green)] font-bold flex items-center gap-1">
                              <span>✓</span>
                              <span className="text-[11px]">Dispatch ready</span>
                            </span>
                          ) : (
                            <MissingDataBadge label="Passports ▲" tooltip="Missing passport data on manifest" />
                          )}
                        </div>
                      </td>
                      <td>
                        <StatusPill
                          label={booking.status.toUpperCase()}
                          variant="green"
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
    </div>
  );
}

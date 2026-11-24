"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { Booking } from "@/types/aviation";
import { extractFeToken, renderFormattedId } from "@/lib/idGenerator";
import { formatCurrency } from "@/lib/pricingCalculator";
import {
  Search,
  ChevronDown
} from "lucide-react";

type BookingFilter =
  | "upcoming"
  | "flying_this_week"
  | "unpaid"
  | "missing_data"
  | "flown_to_close"
  | "cancelled";

interface BookingRowData {
  id: string;
  rootId: string;
  tripCode: string;
  versionsCount: number;
  departureDate: string;
  departureTimeStr: string;
  route: string;
  account: string;
  curator: string;
  aircraftCategory: string;
  aircraftModel: string;
  tailNumber: string;
  pax: number;
  price: string;
  paymentStatus: "paid" | "partially_paid" | "awaiting_wire" | "unpaid";
  paymentLabel: string;
  readiness: {
    paxStatus: "ok" | "alert" | "missing" | "fraction";
    paxLabel?: string;
    slotStatus: "ok" | "alert" | "none";
    slotLabel?: string;
    permitStatus: "ok" | "alert" | "none";
    permitLabel?: string;
  };
  section: "this_week" | "later";
  status: "confirmed" | "flown" | "cancelled" | "booked";
  createdAt: string;
}

// Baseline mock data removed per request - purely dynamic from aviationContext


export default function BookingsView() {
  const router = useRouter();
  const { bookings } = useAviation();

  const [activeFilter, setActiveFilter] = useState<BookingFilter>("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<"newest" | "departure">("newest");

  // Dynamically derive booked rows from aviation context (R-013: signed contract / booked only)
  const combinedRows = useMemo(() => {
    const bookedTrips = bookings.filter((b) => {
      const isSignedOrBooked = Boolean(
        b.isBooked ||
        b.isContractSigned ||
        ["confirmed", "dispatched", "in_flight", "completed", "flown"].includes(b.status)
      );
      return isSignedOrBooked;
    });

    const rootMap = new Map<string, Booking[]>();
    bookedTrips.forEach((b) => {
      const feToken = extractFeToken(b.tripId || b.tripNumber || b.id);
      const rootId = feToken ? `TRI-${feToken}` : (b.tripId || b.tripNumber || b.id);
      const list = rootMap.get(rootId) || [];
      list.push(b);
      rootMap.set(rootId, list);
    });

    const list: BookingRowData[] = [];
    rootMap.forEach((versions, rootId) => {
      const sorted = [...versions].sort((a, b) => (a.quoteVersion || 1) - (b.quoteVersion || 1));
      const latest = sorted[sorted.length - 1];
      const leg = latest.legs[0];
      const isPaid = latest.paymentStatus === "fully_paid";
      const isPartiallyPaid = (latest.paymentStatus as string) === "deposit_paid" || (latest.paymentStatus as string) === "partially_paid";
      const totalPax = leg?.paxCount || leg?.passengers?.length || 4;
      const missingPax = leg?.passengers?.filter((p) => !p.passportNumber || p.passportNumber.length < 5).length || 0;

      const feToken = extractFeToken(latest.tripId || latest.tripNumber || latest.id) || rootId.replace(/^TRI-/, "");
      const vNum = latest.quoteVersion || versions.length || 1;
      const tripCode = `TRI - ${feToken} -${String(vNum).padStart(3, "0")}`;

      let paymentStatus: "paid" | "partially_paid" | "awaiting_wire" | "unpaid" = "unpaid";
      let paymentLabel = "Unpaid";
      if (isPaid) {
        paymentStatus = "paid";
        paymentLabel = "Paid";
      } else if (isPartiallyPaid) {
        paymentStatus = "partially_paid";
        paymentLabel = "Partially paid";
      } else if ((latest.paymentStatus as string) === "awaiting_wire" || (latest.paymentStatus as string) === "invoice_sent") {
        paymentStatus = "awaiting_wire";
        paymentLabel = "Awaiting wire";
      }

      // Check if departure date falls within 7 days
      let isThisWeek = true;
      if (leg?.flightDate) {
        const d = new Date(leg.flightDate);
        if (!isNaN(d.getTime())) {
          const diffDays = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
          isThisWeek = diffDays >= -1 && diffDays <= 7;
        }
      }

      list.push({
        id: latest.id,
        rootId,
        tripCode,
        versionsCount: versions.length,
        departureDate: leg?.flightDate || "Upcoming",
        departureTimeStr: leg?.departureTimeLocal ? `${leg.departureTimeLocal} LT` : "—",
        route: leg?.origin?.icao && leg?.destination?.icao ? `${leg.origin.icao} → ${leg.destination.icao}` : "—",
        account: latest.client?.companyName || latest.client?.fullName || "—",
        curator: latest.agentName || "M. Vance",
        aircraftCategory: latest.aircraft?.categoryLabel || latest.aircraft?.category || "Light",
        aircraftModel: latest.aircraft?.name || (latest.aircraft as any)?.model || "—",
        tailNumber: leg?.aircraftRegistration || latest.aircraft?.registration || "tail TBA",
        pax: totalPax,
        price: formatCurrency(latest.pricing?.totalFlightPrice || 0, latest.pricing?.currency || "EUR"),
        paymentStatus,
        paymentLabel,
        readiness: {
          paxStatus: missingPax > 0 ? "fraction" : "ok",
          paxLabel: missingPax > 0 ? `Pax ${totalPax - missingPax}/${totalPax}` : "Pax ✓",
          slotStatus: "none",
          permitStatus: "none"
        },
        section: isThisWeek ? "this_week" : "later",
        status: (latest.status as any) || "confirmed",
        createdAt: latest.createdAt || new Date().toISOString()
      });
    });

    return list;
  }, [bookings]);

  // Counts for pills
  const counts = useMemo(() => {
    return {
      upcoming: combinedRows.filter((r) => r.status !== "cancelled" && r.status !== "flown").length,
      flying_this_week: combinedRows.filter((r) => r.section === "this_week" && r.status !== "cancelled" && r.status !== "flown").length,
      unpaid: combinedRows.filter((r) => r.paymentStatus !== "paid").length,
      missing_data: combinedRows.filter((r) => r.readiness.paxStatus !== "ok" || r.readiness.slotStatus === "alert").length,
      flown_to_close: combinedRows.filter((r) => r.status === "flown").length,
      cancelled: combinedRows.filter((r) => r.status === "cancelled").length
    };
  }, [combinedRows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return combinedRows.filter((r) => {
      if (activeFilter === "upcoming") {
        if (r.status === "cancelled" || r.status === "flown") return false;
      } else if (activeFilter === "flying_this_week") {
        if (r.section !== "this_week") return false;
      } else if (activeFilter === "unpaid") {
        if (r.paymentStatus === "paid") return false;
      } else if (activeFilter === "missing_data") {
        if (r.readiness.paxStatus === "ok" && r.readiness.slotStatus !== "alert") return false;
      } else if (activeFilter === "flown_to_close") {
        if (r.status !== "flown") return false;
      } else if (activeFilter === "cancelled") {
        if (r.status !== "cancelled") return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          r.tripCode.toLowerCase().includes(q) ||
          r.account.toLowerCase().includes(q) ||
          r.curator.toLowerCase().includes(q) ||
          r.route.toLowerCase().includes(q) ||
          r.tailNumber.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [combinedRows, activeFilter, searchQuery]);

  // Group by this week and later
  const thisWeekItems = filteredRows.filter((r) => r.section === "this_week");
  const laterItems = filteredRows.filter((r) => r.section === "later");

  const handleRowClick = (rootId: string) => {
    router.push(`/trips/${rootId}/itinerary`);
  };

  return (
    <div className="w-full space-y-5 pb-12">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 m-0">
          Bookings
        </h1>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            List
          </button>
          <button
            type="button"
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3.5 py-1.5 rounded-lg text-xs font-medium shadow-2xs transition-colors"
          >
            Calendar
          </button>
          <button
            type="button"
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3.5 py-1.5 rounded-lg text-xs font-medium shadow-2xs transition-colors"
          >
            Export
          </button>
        </div>
      </div>

      {/* ─── Filter Pills & Search ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[260px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, client, tail, ICAO..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 font-sans shadow-2xs"
            />
          </div>

          <button
            type="button"
            onClick={() => setActiveFilter("upcoming")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeFilter === "upcoming"
                ? "bg-[#0f172a] text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Upcoming {counts.upcoming}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("flying_this_week")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeFilter === "flying_this_week"
                ? "bg-[#0f172a] text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Flying this week {counts.flying_this_week}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("unpaid")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeFilter === "unpaid"
                ? "bg-[#0f172a] text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Unpaid {counts.unpaid}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("missing_data")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeFilter === "missing_data"
                ? "bg-[#0f172a] text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Missing data {counts.missing_data}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("flown_to_close")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeFilter === "flown_to_close"
                ? "bg-[#0f172a] text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Flown · to close {counts.flown_to_close}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("cancelled")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeFilter === "cancelled"
                ? "bg-[#0f172a] text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Cancelled
          </button>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 self-end lg:self-auto shrink-0">
          <span>Sort</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:border-slate-400 cursor-pointer shadow-2xs"
          >
            <option value="newest">Newest booking first</option>
            <option value="departure">Next departure first</option>
          </select>
        </div>
      </div>

      {/* ─── Table ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-white">
                <th className="py-3 px-4">TRIP</th>
                <th className="py-3 px-4">NEXT DEPARTURE</th>
                <th className="py-3 px-4">ROUTE</th>
                <th className="py-3 px-4">ACCOUNT · CURATOR</th>
                <th className="py-3 px-4">AIRCRAFT · TAIL</th>
                <th className="py-3 px-4">PAX</th>
                <th className="py-3 px-4">PRICE</th>
                <th className="py-3 px-4">PAYMENT</th>
                <th className="py-3 px-4">OPS READINESS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* THIS WEEK Section */}
              {thisWeekItems.length > 0 && (
                <>
                  <tr className="bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <td colSpan={9} className="py-2 px-4">
                      THIS WEEK
                    </td>
                  </tr>
                  {thisWeekItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => handleRowClick(item.rootId)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      {/* Trip */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">
                          {item.tripCode}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {item.versionsCount} {item.versionsCount === 1 ? "version" : "versions"}
                        </span>
                      </td>

                      {/* Next departure */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900 block">
                          {item.departureDate}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {item.departureTimeStr}
                        </span>
                      </td>

                      {/* Route */}
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {item.route}
                      </td>

                      {/* Account · Curator */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900 block">
                          {item.account}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {item.curator}
                        </span>
                      </td>

                      {/* Aircraft · Tail */}
                      <td className="py-3 px-4">
                        <span className="text-slate-900 block">
                          {item.aircraftCategory} · {item.aircraftModel}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {item.tailNumber}
                        </span>
                      </td>

                      {/* Pax */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {item.pax}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {item.price}
                      </td>

                      {/* Payment */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.paymentStatus === "paid" && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            Paid
                          </span>
                        )}
                        {item.paymentStatus === "partially_paid" && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/80">
                            {item.paymentLabel}
                          </span>
                        )}
                        {item.paymentStatus === "awaiting_wire" && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#FEF3C7] text-[#92400E] border border-amber-200/80">
                            Awaiting wire
                          </span>
                        )}
                      </td>

                      {/* Ops Readiness */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.readiness.paxLabel && (
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                item.readiness.paxStatus === "ok"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                                  : "bg-amber-50 text-amber-800 border border-amber-200/80"
                              }`}
                            >
                              {item.readiness.paxLabel}
                            </span>
                          )}

                          {item.readiness.slotLabel && (
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                item.readiness.slotStatus === "alert"
                                  ? "bg-amber-50 text-amber-800 border border-amber-200/80"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {item.readiness.slotLabel}
                            </span>
                          )}

                          {item.readiness.permitLabel && (
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                item.readiness.permitStatus === "ok"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {item.readiness.permitLabel}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {/* LATER Section */}
              {laterItems.length > 0 && (
                <>
                  <tr className="bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <td colSpan={9} className="py-2 px-4">
                      LATER
                    </td>
                  </tr>
                  {laterItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => handleRowClick(item.rootId)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      {/* Trip */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">
                          {item.tripCode}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {item.versionsCount} {item.versionsCount === 1 ? "version" : "versions"}
                        </span>
                      </td>

                      {/* Next departure */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900 block">
                          {item.departureDate}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {item.departureTimeStr}
                        </span>
                      </td>

                      {/* Route */}
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {item.route}
                      </td>

                      {/* Account · Curator */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900 block">
                          {item.account}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {item.curator}
                        </span>
                      </td>

                      {/* Aircraft · Tail */}
                      <td className="py-3 px-4">
                        <span className="text-slate-900 block">
                          {item.aircraftCategory} · {item.aircraftModel}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {item.tailNumber}
                        </span>
                      </td>

                      {/* Pax */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {item.pax}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {item.price}
                      </td>

                      {/* Payment */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.paymentStatus === "paid" && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            Paid
                          </span>
                        )}
                        {item.paymentStatus === "partially_paid" && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/80">
                            {item.paymentLabel}
                          </span>
                        )}
                        {item.paymentStatus === "awaiting_wire" && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#FEF3C7] text-[#92400E] border border-amber-200/80">
                            Awaiting wire
                          </span>
                        )}
                      </td>

                      {/* Ops Readiness */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.readiness.paxLabel && (
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                item.readiness.paxStatus === "ok"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                                  : item.readiness.paxStatus === "alert"
                                  ? "bg-amber-50 text-amber-800 border border-amber-200/80"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {item.readiness.paxLabel}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    No bookings found matching this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Footer Note ───────────────────────────────────────────────────── */}
      <div className="text-xs text-slate-400">
        Only trips with a signed contract appear here. One row per trip, showing its latest version. Click a row to open the Trip page.
      </div>
    </div>
  );
}

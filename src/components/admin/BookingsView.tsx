"use client";

import React, { useState, useEffect } from "react";
import { useAviation } from "@/lib/aviationContext";
import { formatCurrency } from "@/lib/pricingCalculator";
import { Booking } from "@/types/aviation";
import { getQuoteIterationGroupKey } from "@/lib/quoteIterations";
import { RefreshCw } from "lucide-react";

export default function BookingsView() {
  const {
    bookings,
    searchQuery,
    openDocument,
    refreshBookings,
    isBookingsLoading,
    bookingsSource,
    setActiveNav,
    setBookingToRevise
  } = useAviation();

  // Fetch live bookings from backend database on mount
  useEffect(() => {
    refreshBookings();
  }, []);

  const [activeTab, setActiveTab] = useState<
    "all" | "confirmed" | "quotes_sent" | "quotes_pending" | "quotes_undecided" | "completed"
  >("all");
  const [selectedTripKey, setSelectedTripKey] = useState<string | null>(null);
  const [historyTab, setHistoryTab] = useState<"bookings" | "quotes">("bookings");

  const bookedFamilies = new Set(bookings
    .filter((booking) => booking.isBooked || ["confirmed", "dispatched", "in_flight", "completed", "flown"].includes(booking.status))
    .map((booking) => booking.tripId || booking.quoteGroupId)
    .filter(Boolean));
  const visibleBookings = bookings.filter((booking) =>
    !((booking.isCancelled || booking.status === "cancelled") &&
      !booking.isBooked &&
      (booking.quoteId || booking.quoteReference) &&
      !bookedFamilies.has(booking.tripId || booking.quoteGroupId))
  );
  const getIterationGroupKey = (booking: Booking) => {
    const isBookedRecord = booking.isBooked ||
      ["confirmed", "dispatched", "in_flight", "completed", "flown"].includes(booking.status);
    return isBookedRecord || booking.tripId || booking.quoteGroupId
      ? booking.tripId || booking.quoteGroupId || booking.tripNumber || booking.id
      : booking.quoteId || booking.quoteReference
        ? getQuoteIterationGroupKey(booking)
        : booking.id;
  };
  const countAll = new Set(visibleBookings.map(getIterationGroupKey)).size;
  const countConfirmed = new Set(visibleBookings
    .filter((booking) => ["confirmed", "dispatched", "in_flight"].includes(booking.status))
    .map((booking) => booking.tripId || booking.tripNumber || booking.id)).size;
  const countQuotesSent = visibleBookings.filter((b) => b.quoteStatus === "sent" || b.status === "quote_sent").length;
  const countQuotesPending = visibleBookings.filter((b) => b.quoteStatus === "pending").length;
  const countQuotesUndecided = visibleBookings.filter((b) => b.quoteStatus === "undecided" || b.status === "client_review").length;
  const countCompleted = visibleBookings.filter((b) => b.status === "completed").length;

  const filteredBookings = visibleBookings.filter((b) => {
    // Status filter
    if (activeTab === "confirmed") {
      if (!["confirmed", "dispatched", "in_flight"].includes(b.status)) return false;
    } else if (activeTab === "quotes_sent") {
      if (b.quoteStatus !== "sent" && b.status !== "quote_sent") return false;
    } else if (activeTab === "quotes_pending") {
      if (b.quoteStatus !== "pending") return false;
    } else if (activeTab === "quotes_undecided") {
      if (b.quoteStatus !== "undecided" && b.status !== "client_review") return false;
    } else if (activeTab === "completed") {
      if (b.status !== "completed") return false;
    }

    // Search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchTrip = (b.tripNumber || "").toLowerCase().includes(q);
      const matchQuoteRef = (b.quoteReference || "").toLowerCase().includes(q);
      const matchClient = (b.client?.fullName || "").toLowerCase().includes(q);
      const matchCompany = (b.client?.companyName || "").toLowerCase().includes(q);
      const matchAircraft = (b.aircraft?.name || "").toLowerCase().includes(q) || ((b.aircraft?.registration || "").toLowerCase().includes(q));
      const matchRoute = (b.legs || []).some(
        (l) =>
          (l.origin?.icao || "").toLowerCase().includes(q) ||
          (l.destination?.icao || "").toLowerCase().includes(q) ||
          (l.origin?.city || "").toLowerCase().includes(q) ||
          (l.destination?.city || "").toLowerCase().includes(q)
      );
      if (!matchTrip && !matchQuoteRef && !matchClient && !matchCompany && !matchAircraft && !matchRoute) return false;
    }

    return true;
  });

  const allBookingGroups = (() => {
    const groups = new Map<string, Booking[]>();
    visibleBookings.forEach((booking) => {
      const tripKey = getIterationGroupKey(booking);
      groups.set(tripKey, [...(groups.get(tripKey) || []), booking]);
    });

    return Array.from(groups.entries()).map(([tripKey, revisions]) => {
      const byVersion = (a: Booking, b: Booking) => {
        const bothQuoteIterations =
          Boolean(a.quoteId || a.quoteReference) && Boolean(b.quoteId || b.quoteReference);
        if (bothQuoteIterations) {
          const quoteVersionDifference = (a.quoteVersion || 1) - (b.quoteVersion || 1);
          if (quoteVersionDifference !== 0) return quoteVersionDifference;
        }
        const aVersion = Number((a.bookingRevisionId || "").split("-").pop()) || 1;
        const bVersion = Number((b.bookingRevisionId || "").split("-").pop()) || 1;
        const versionDifference = aVersion - bVersion;
        if (versionDifference !== 0) return versionDifference;
        return Date.parse(a.updatedAt || a.createdAt || "") - Date.parse(b.updatedAt || b.createdAt || "");
      };
      const ordered = [...revisions].sort(byVersion);
      const active = ordered.filter((revision) => !revision.isCancelled && revision.status !== "cancelled");
      const currentRevisions = active.length ? active : ordered;
      const latest = currentRevisions[currentRevisions.length - 1];
      const primary = currentRevisions.find((revision) => revision.isBooked && !revision.isSupplementalRevision)
        || currentRevisions[0];
      return { tripKey, revisions: ordered, latest, primary };
    });
  })();
  const bookingGroups = allBookingGroups.filter((group) =>
    filteredBookings.some((booking) =>
      group.revisions.some((revision) => revision.id === booking.id)
    )
  );
  const selectedTripGroup = allBookingGroups.find((group) => group.tripKey === selectedTripKey);
  const selectedTripBookings = selectedTripGroup?.revisions.filter((revision) =>
    revision.isBooked || ["confirmed", "dispatched", "in_flight", "completed", "flown"].includes(revision.status)
  ) || [];
  const selectedTripQuotes = selectedTripGroup?.revisions.filter((revision) =>
    !revision.isBooked &&
    !["confirmed", "dispatched", "in_flight", "completed", "flown"].includes(revision.status) &&
    Boolean(revision.quoteId || revision.quoteReference)
  ) || [];

  return (
    <div className="space-y-6">
      
      {/* Category Tabs & Subheader Bar */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#F5F2EC] p-1.5 rounded-xl border border-[#E0DAD0]">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "all"
                ? "bg-[#0F1420] text-white shadow-sm"
                : "text-[#0F1420]/70 hover:text-[#0F1420]"
            }`}
          >
            <span>All Bookings</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${activeTab === "all" ? "bg-[#C9A052] text-[#0F1420]" : "bg-[#E0DAD0] text-gray-700"}`}>
              {countAll}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("confirmed")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "confirmed"
                ? "bg-[#0F1420] text-white shadow-sm"
                : "text-[#0F1420]/70 hover:text-[#0F1420]"
            }`}
          >
            <span>Confirmed Flights</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${activeTab === "confirmed" ? "bg-emerald-400 text-[#0F1420]" : "bg-[#E0DAD0] text-gray-700"}`}>
              {countConfirmed}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("quotes_sent")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "quotes_sent"
                ? "bg-[#0F1420] text-white shadow-sm"
                : "text-[#0F1420]/70 hover:text-[#0F1420]"
            }`}
          >
            <span>Quotes Sent</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${activeTab === "quotes_sent" ? "bg-blue-400 text-white" : "bg-[#E0DAD0] text-gray-700"}`}>
              {countQuotesSent}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("quotes_pending")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "quotes_pending"
                ? "bg-[#0F1420] text-white shadow-sm"
                : "text-[#0F1420]/70 hover:text-[#0F1420]"
            }`}
          >
            <span>Quotes Pending</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${activeTab === "quotes_pending" ? "bg-amber-400 text-[#0F1420]" : "bg-[#E0DAD0] text-gray-700"}`}>
              {countQuotesPending}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("quotes_undecided")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "quotes_undecided"
                ? "bg-[#0F1420] text-white shadow-sm"
                : "text-[#0F1420]/70 hover:text-[#0F1420]"
            }`}
          >
            <span>Quotes Undecided</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${activeTab === "quotes_undecided" ? "bg-purple-400 text-white" : "bg-[#E0DAD0] text-gray-700"}`}>
              {countQuotesUndecided}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "completed"
                ? "bg-[#0F1420] text-white shadow-sm"
                : "text-[#0F1420]/70 hover:text-[#0F1420]"
            }`}
          >
            <span>Completed</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${activeTab === "completed" ? "bg-[#C9A052] text-[#0F1420]" : "bg-[#E0DAD0] text-gray-700"}`}>
              {countCompleted}
            </span>
          </button>
        </div>

        <div className="text-xs text-[#0F1420]/60 hidden md:block">
          Click any trip to view its booking and quote history.
        </div>
      </div>

      {selectedTripGroup ? (
        <section className="space-y-5">
          <button
            type="button"
            onClick={() => setSelectedTripKey(null)}
            className="rounded-lg border border-[#E0DAD0] bg-white px-3 py-2 text-xs font-bold text-[#0F1420] hover:border-[#C9A052]"
          >
            ← Back to Bookings
          </button>
          <div className="rounded-2xl border border-[#E0DAD0] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#9A7A35]">
              Trip History
            </p>
            <h2 className="mt-1 break-all text-xl font-black text-[#0F1420]">
              Trip ID ({selectedTripGroup.primary.tripId || "Pending assignment"})
            </h2>
          </div>

          <div className="flex flex-wrap gap-2 rounded-xl border border-[#E0DAD0] bg-white p-3">
            <button
              type="button"
              onClick={() => setHistoryTab("bookings")}
              className={`rounded-lg px-4 py-2 text-xs font-bold ${
                historyTab === "bookings" ? "bg-[#0F1420] text-white" : "bg-[#F5F2EC] text-[#0F1420] hover:bg-[#EBE5DB]"
              }`}
            >
              Booking revisions ({selectedTripBookings.length})
            </button>
            <button
              type="button"
              onClick={() => setHistoryTab("quotes")}
              className={`rounded-lg px-4 py-2 text-xs font-bold ${
                historyTab === "quotes" ? "bg-[#0F1420] text-white" : "bg-[#F5F2EC] text-[#0F1420] hover:bg-[#EBE5DB]"
              }`}
            >
              Revised quotes ({selectedTripQuotes.length})
            </button>
          </div>

          {historyTab === "quotes" ? (
            selectedTripQuotes.length ? (
              <div className="overflow-x-auto rounded-xl border border-[#E0DAD0] bg-white">
                <table className="w-full min-w-[820px] table-fixed border-collapse text-left text-xs">
                  <colgroup>
                    <col className="w-[18%]" />
                    <col className="w-[18%]" />
                    <col className="w-[24%]" />
                    <col className="w-[7%]" />
                    <col className="w-[15%]" />
                    <col className="w-[18%]" />
                  </colgroup>
                  <thead className="border-b border-[#E0DAD0] bg-[#F5F2EC] text-[10px] font-mono uppercase tracking-wider text-[#0F1420]/70">
                    <tr>
                      <th className="px-3 py-3 font-bold">Quote ID</th>
                      <th className="px-3 py-3 font-bold">Route</th>
                      <th className="px-3 py-3 font-bold">Account</th>
                      <th className="px-3 py-3 font-bold">Pax</th>
                      <th className="px-3 py-3 font-bold">Total Price</th>
                      <th className="px-3 py-3 text-right font-bold">Status / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0DAD0]">
                    {selectedTripQuotes.map((revision) => (
                      <tr key={revision.id} className="bg-white">
                        <td className="break-all px-3 py-4 align-middle font-mono font-bold text-[#0F1420]">
                          {revision.quoteId || revision.quoteReference || "Quote iteration"}
                        </td>
                        <td className="px-3 py-4 align-middle">
                          <div className="flex flex-col gap-1">
                            {(revision.legs || []).map((leg, index) => (
                              <span key={leg.legNumber || index} className="font-mono text-[11px] font-bold text-[#0F1420]">
                                {leg.origin?.icao || "—"} <span className="text-[#C9A052]">→</span> {leg.destination?.icao || "—"}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="break-words px-3 py-4 align-middle font-semibold text-[#0F1420]">
                          {revision.client?.companyName || revision.client?.fullName || "Account unavailable"}
                        </td>
                        <td className="px-3 py-4 align-middle font-mono text-[#0F1420]">{revision.legs[0]?.paxCount ?? "—"}</td>
                        <td className="px-3 py-4 align-middle font-mono font-bold text-[#0F1420]">
                          {formatCurrency(revision.pricing.totalFlightPrice, revision.pricing.currency)}
                        </td>
                        <td className="px-3 py-4 align-middle">
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700">
                              Cancelled
                            </span>
                            <button
                              type="button"
                              onClick={() => openDocument(revision, "quotation")}
                              className="rounded-lg border border-[#E0DAD0] bg-[#F5F2EC] px-3 py-1.5 text-[10px] font-bold text-[#0F1420] hover:border-[#C9A052]"
                            >
                              View PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-xl border border-[#E0DAD0] bg-white px-4 py-5 text-sm text-gray-600">
                No revised quotes are available for this trip.
              </p>
            )
          ) : selectedTripBookings.length ? (
            <div className="overflow-x-auto rounded-xl border border-[#E0DAD0] bg-white">
              <table className="w-full min-w-[820px] table-fixed border-collapse text-left text-xs">
                <colgroup>
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                  <col className="w-[24%]" />
                  <col className="w-[7%]" />
                  <col className="w-[15%]" />
                  <col className="w-[18%]" />
                </colgroup>
                <thead className="border-b border-[#E0DAD0] bg-[#F5F2EC] text-[10px] font-mono uppercase tracking-wider text-[#0F1420]/70">
                  <tr>
                    <th className="px-3 py-3 font-bold">Booking Revision</th>
                    <th className="px-3 py-3 font-bold">Route</th>
                    <th className="px-3 py-3 font-bold">Account</th>
                    <th className="px-3 py-3 font-bold">Pax</th>
                    <th className="px-3 py-3 font-bold">Total Price</th>
                    <th className="px-3 py-3 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0DAD0]">
                  {selectedTripBookings.map((revision) => {
                    const isLatestActiveBooking = revision.id === selectedTripGroup.latest.id &&
                      !revision.isCancelled && revision.status !== "cancelled";
                    return (
                      <tr key={revision.id} className="bg-white">
                        <td className="break-all px-3 py-4 align-middle font-mono font-bold text-[#0F1420]">
                          {revision.bookingRevisionId || "Initial booking"}
                          {revision.isSupplementalRevision && <span className="mt-1 block text-[10px] font-sans font-normal text-blue-700">Additional</span>}
                        </td>
                        <td className="px-3 py-4 align-middle">
                          <div className="flex flex-col gap-1">
                            {(revision.legs || []).map((leg, index) => (
                              <span key={leg.legNumber || index} className="font-mono text-[11px] font-bold text-[#0F1420]">
                                {leg.origin?.icao || "—"} <span className="text-[#C9A052]">→</span> {leg.destination?.icao || "—"}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="break-words px-3 py-4 align-middle font-semibold text-[#0F1420]">
                          {revision.client?.companyName || revision.client?.fullName || "Account unavailable"}
                        </td>
                        <td className="px-3 py-4 align-middle font-mono text-[#0F1420]">{revision.legs[0]?.paxCount ?? "—"}</td>
                        <td className="px-3 py-4 align-middle font-mono font-bold text-[#0F1420]">
                          {formatCurrency(revision.pricing.totalFlightPrice, revision.pricing.currency)}
                        </td>
                        <td className="px-3 py-4 align-middle">
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openDocument(revision, "invoice")}
                              className="rounded-lg border border-[#E0DAD0] bg-[#F5F2EC] px-3 py-1.5 text-[10px] font-bold text-[#0F1420] hover:border-[#C9A052]"
                            >
                              Invoice
                            </button>
                            {isLatestActiveBooking && (
                              <button
                                type="button"
                                onClick={() => {
                                  setBookingToRevise(revision);
                                  setActiveNav("quotes");
                                }}
                                className="rounded-lg bg-[#0F1420] px-3 py-1.5 text-[10px] font-bold text-[#C9A052] hover:bg-[#1C2436]"
                              >
                                Revise Trip
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-xl border border-[#E0DAD0] bg-white px-4 py-5 text-sm text-gray-600">
              No booking revisions are available for this trip.
            </p>
          )}
        </section>
      ) : (
      <div className="bg-white border border-[#E0DAD0] rounded-2xl shadow-sm overflow-hidden">
        
        <div className="p-4 bg-[#F5F2EC]/80 border-b border-[#E0DAD0] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-xs font-mono uppercase tracking-wider text-[#0F1420]">
              Flight Operations Register
            </span>
            <span className="text-xs text-gray-500">({bookingGroups.length} results)</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${
              bookingsSource === "backend"
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-amber-50 text-amber-800 border-amber-300"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${bookingsSource === "backend" ? "bg-emerald-600 animate-pulse" : "bg-amber-600"}`} />
              {bookingsSource === "backend" ? "Live Backend Synced" : "Local Database"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refreshBookings()}
              disabled={isBookingsLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E0DAD0] bg-white hover:bg-gray-50 text-[#0F1420] text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              title="Refresh live bookings from backend database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isBookingsLoading ? "animate-spin text-[#C9A052]" : "text-gray-600"}`} />
              <span>{isBookingsLoading ? "Refreshing..." : "Refresh Live"}</span>
            </button>
            <span className="text-xs text-[#0F1420]/60 font-mono hidden md:inline">
              EASA Part-CAT & Austrian Law Applicable
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F2EC] text-[#0F1420]/70 font-mono text-[11px] uppercase tracking-wider border-b border-[#E0DAD0]">
              <tr>
                <th className="py-3 px-4 font-bold">Trip ID</th>
                <th className="py-3 px-4 font-bold">Route</th>
                <th className="py-3 px-4 font-bold">Account</th>
                <th className="py-3 px-4 font-bold">Pax</th>
                <th className="py-3 px-4 font-bold">Total Price</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0DAD0]">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 text-xs">
                    No bookings found matching current tab and search query.
                  </td>
                </tr>
              ) : (
                bookingGroups.map(({ tripKey, revisions, latest: latestRevision, primary: booking }) => {
                  const isBookedRecord = booking.isBooked ||
                    ["confirmed", "dispatched", "in_flight", "completed", "flown"].includes(booking.status);
                  const hasIterations = revisions.length > 1;

                  return (
                    <React.Fragment key={tripKey}>
                      <tr
                        onClick={() => {
                          setSelectedTripKey(tripKey);
                          setHistoryTab("bookings");
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedTripKey(tripKey);
                            setHistoryTab("bookings");
                          }
                        }}
                        tabIndex={0}
                        className="hover:bg-[#F5F2EC]/60 transition-colors cursor-pointer group"
                      >
                      {/* Trip ID */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          {isBookedRecord ? (
                            <span className="font-extrabold text-[#0F1420] font-mono text-sm tracking-wide group-hover:text-[#C9A052] transition-colors flex items-center gap-1.5">
                              Trip ID ({booking.tripId || "Pending assignment"})
                              {hasIterations && <span className="text-[10px] text-[#C9A052]">{revisions.length} Iterations</span>}
                            </span>
                          ) : (
                            <div className="flex flex-col">
                              <span className="font-bold text-[#9A7A35] font-mono text-xs tracking-wide group-hover:text-[#C9A052] transition-colors flex items-center gap-1.5">
                                Trip ID ({booking.tripId || "Pending assignment"})
                                {hasIterations && <span className="text-[10px] text-[#C9A052]">{revisions.length} Iterations</span>}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono italic">
                                {booking.quoteId || booking.quoteReference || "Quote ID pending"}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Route */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 max-w-[190px]">
                          {(booking.legs || []).map((leg, lIdx) => (
                            <span key={leg.legNumber || lIdx} className="font-bold text-[#0F1420] font-mono text-[11px]">
                              {leg.origin?.icao || "---"} <span className="text-[#C9A052]">→</span> {leg.destination?.icao || "---"}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Account */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#0F1420] text-xs">
                            {booking.client?.companyName || booking.client?.fullName || "Private Client"}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            Acc: {booking.accountNumber || booking.client?.accountNumber || "ACC-001"}
                          </span>
                        </div>
                      </td>

                      {/* Passengers */}
                      <td className="py-4 px-4 font-mono text-[#0F1420]">
                        {(booking.legs || [])[0]?.paxCount ?? "—"}
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4 font-mono">
                        <div className="flex flex-col">
                          <span className="font-black text-[#0F1420] text-sm">
                            {formatCurrency(booking.pricing.totalFlightPrice, booking.pricing.currency)}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-medium">VAT 0% Exempt</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openDocument(booking, "quotation")}
                            className="rounded-lg bg-[#C9A052] hover:bg-[#B88F42] px-2.5 py-1.5 text-[11px] font-bold text-[#0F1420] shadow-sm"
                            title="Generate or view the quotation"
                          >
                            Generate Quote
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setBookingToRevise(latestRevision);
                              setActiveNav("quotes");
                            }}
                            className="rounded-lg border border-[#E0DAD0] bg-[#F5F2EC] hover:bg-[#EBE5DB] px-2.5 py-1.5 text-[11px] font-bold text-[#0F1420]"
                            title="Revise this trip or its booking"
                          >
                            Revise Trip
                          </button>
                          <button
                            type="button"
                            onClick={() => openDocument(booking, "invoice")}
                            disabled={!isBookedRecord}
                            className="rounded-lg bg-[#C9A052] hover:bg-[#B88F42] disabled:cursor-not-allowed disabled:opacity-45 px-2.5 py-1.5 text-[11px] font-bold text-[#0F1420] shadow-sm"
                            title={isBookedRecord ? "Generate or view the invoice" : "Available after booking"}
                          >
                            Invoice
                          </button>
                          <button
                            type="button"
                            onClick={() => openDocument(booking, "flight_brief")}
                            disabled={!isBookedRecord}
                            className="rounded-lg bg-[#C9A052] hover:bg-[#B88F42] disabled:cursor-not-allowed disabled:opacity-45 px-2.5 py-1.5 text-[11px] font-bold text-[#0F1420] shadow-sm"
                            title={isBookedRecord ? "Generate or view the flight brief" : "Available after booking"}
                          >
                            Flight Brief
                          </button>
                        </div>
                      </td>
                      </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}

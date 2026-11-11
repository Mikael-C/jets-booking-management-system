"use client";

import React, { useState, useEffect } from "react";
import { useAviation } from "@/lib/aviationContext";
import { formatCurrency } from "@/lib/pricingCalculator";
import { Booking } from "@/types/aviation";
import { getQuoteIterationGroupKey } from "@/lib/quoteIterations";
import {
  FileText,
  Receipt,
  Compass,
  ScrollText,
  CheckSquare,
  Plane,
  Eye,
  Filter,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  RotateCcw
} from "lucide-react";

export default function BookingsView() {
  const {
    bookings,
    searchQuery,
    openDocument,
    setSelectedBookingForDetail,
    convertQuoteToBooked,
    refreshBookings,
    isBookingsLoading,
    bookingsSource,
    setActiveNav
  } = useAviation();

  // Fetch live bookings from backend database on mount
  useEffect(() => {
    refreshBookings();
  }, []);

  const [activeTab, setActiveTab] = useState<
    "all" | "confirmed" | "quotes_sent" | "quotes_pending" | "quotes_undecided" | "completed"
  >("all");
  const [expandedTripIds, setExpandedTripIds] = useState<Set<string>>(new Set());

  const visibleBookings = bookings.filter((booking) =>
    !((booking.isCancelled || booking.status === "cancelled") &&
      !booking.isBooked &&
      (booking.quoteId || booking.quoteReference))
  );
  const getIterationGroupKey = (booking: Booking) => {
    const isBookedRecord = booking.isBooked ||
      ["confirmed", "dispatched", "in_flight", "completed", "flown"].includes(booking.status);
    return isBookedRecord
      ? booking.tripId || booking.tripNumber || booking.id
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

  const bookingGroups = (() => {
    const groups = new Map<string, Booking[]>();
    visibleBookings.forEach((booking) => {
      const tripKey = getIterationGroupKey(booking);
      groups.set(tripKey, [...(groups.get(tripKey) || []), booking]);
    });

    return Array.from(groups.entries()).map(([tripKey, revisions]) => {
      const byVersion = (a: Booking, b: Booking) => {
        const bothQuotes = !a.isBooked && !b.isBooked &&
          Boolean(a.quoteId || a.quoteReference) && Boolean(b.quoteId || b.quoteReference);
        if (bothQuotes) {
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
      return { tripKey, revisions: ordered, latest: currentRevisions[currentRevisions.length - 1] };
    }).filter((group) => filteredBookings.some((booking) =>
      group.revisions.some((revision) => revision.id === booking.id)
    ));
  })();

  const getStatusBadge = (status: Booking["status"]) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-max">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            CONFIRMED
          </span>
        );
      case "dispatched":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-300 flex items-center gap-1 w-max">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
            DISPATCHED
          </span>
        );
      case "in_flight":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1 w-max animate-pulse">
            <Plane className="w-2.5 h-2.5" />
            IN FLIGHT
          </span>
        );
      case "completed":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gray-200 text-gray-700 border border-gray-300 flex items-center gap-1 w-max">
            COMPLETED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 w-max">
            <Clock className="w-2.5 h-2.5" />
            {status.toUpperCase().replace("_", " ")}
          </span>
        );
    }
  };

  const getQuoteBadge = (b: Booking) => {
    const isBooked = ["confirmed", "dispatched", "in_flight", "completed"].includes(b.status);
    if (isBooked) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          BOOKED FLIGHT
        </span>
      );
    }
    const qStatus = (b.quoteStatus || (b.status === "quote_sent" ? "sent" : b.status === "client_review" ? "undecided" : "draft")).toLowerCase();
    switch (qStatus) {
      case "sent":
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-300">
            QUOTE: SENT
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
            QUOTE: PENDING
          </span>
        );
      case "undecided":
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-300">
            QUOTE: UNDECIDED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-gray-100 text-gray-700 border border-gray-300">
            QUOTE: DRAFT
          </span>
        );
    }
  };

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
          Click any row to open the full flight record and live dispatch checklist.
        </div>
      </div>

      {/* Main Bookings Table Card */}
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
                <th className="py-3 px-4 font-bold">Trip & Status</th>
                <th className="py-3 px-4 font-bold">Client / Account</th>
                <th className="py-3 px-4 font-bold">Aircraft & Tail</th>
                <th className="py-3 px-4 font-bold">Routing & Schedule</th>
                <th className="py-3 px-4 font-bold">Total Price</th>
                <th className="py-3 px-4 font-bold">Dispatch Checklist</th>
                <th className="py-3 px-4 font-bold text-right">Actions & Documents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0DAD0]">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 text-xs">
                    No bookings found matching current tab and search query.
                  </td>
                </tr>
              ) : (
                bookingGroups.map(({ tripKey, revisions, latest: booking }) => {
                  const totalChecklist = (booking.checklist || []).length;
                  const completedChecklist = (booking.checklist || []).filter((c) => c.isCompleted || (c as any).completed).length;
                  const isAllReady = totalChecklist > 0 && completedChecklist === totalChecklist;
                  const isBookedRecord = booking.isBooked ||
                    ["confirmed", "dispatched", "in_flight", "completed", "flown"].includes(booking.status);
                  const isInProgress = !isBookedRecord;
                  const hasIterations = revisions.length > 1;
                  const isExpanded = expandedTripIds.has(tripKey);

                  return (
                    <React.Fragment key={tripKey}>
                      <tr
                        onClick={() => setSelectedBookingForDetail(booking)}
                        className="hover:bg-[#F5F2EC]/60 transition-colors cursor-pointer group"
                      >
                      {/* Trip & Status */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          {isBookedRecord ? (
                            <span className="font-extrabold text-[#0F1420] font-mono text-sm tracking-wide group-hover:text-[#C9A052] transition-colors flex items-center gap-1.5">
                              Trip #{booking.tripNumber}
                              <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#C9A052]" />
                            </span>
                          ) : (
                            <div className="flex flex-col">
                              <span className="font-bold text-[#9A7A35] font-mono text-xs tracking-wide group-hover:text-[#C9A052] transition-colors flex items-center gap-1.5">
                                {booking.quoteReference || `QTE-${booking.tripNumber}`}
                                <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#C9A052]" />
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono italic">
                                (Trip # assigned on booking)
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 flex-wrap">
                            {getStatusBadge(booking.status)}
                            {getQuoteBadge(booking)}
                            {hasIterations && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setExpandedTripIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(tripKey)) next.delete(tripKey);
                                    else next.add(tripKey);
                                    return next;
                                  });
                                }}
                                className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-300 hover:bg-purple-200"
                              >
                                {revisions.length} Iterations {isExpanded ? "−" : "+"}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Client / Account */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#0F1420] text-xs">{booking.client?.fullName || "Private Client"}</span>
                          {booking.client?.companyName && (
                            <span className="text-[11px] text-gray-600">{booking.client.companyName}</span>
                          )}
                          <span className="text-[10px] text-gray-400 font-mono">Acc: {booking.accountNumber || booking.client?.accountNumber || "ACC-001"}</span>
                        </div>
                      </td>

                      {/* Aircraft & Tail */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#0F1420]">{booking.aircraft?.name || "Jet"}</span>
                          <span className="text-[11px] font-mono font-bold text-[#C9A052]">
                            Tail: {booking.aircraft?.registration || "OE-FFB"}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {booking.aircraft?.passengers || 4} Seats • {booking.aircraft?.categoryLabel || "Jet"}
                          </span>
                        </div>
                      </td>

                      {/* Routing & Schedule */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 max-w-[210px]">
                          {(booking.legs || []).map((leg, lIdx) => (
                            <div key={leg.legNumber || lIdx} className="text-[11px] flex items-center justify-between gap-2">
                              <span className="font-extrabold text-[#0F1420] font-mono flex items-center gap-1">
                                <span>{leg.origin?.icao || "---"}</span>
                                <span className="text-[#C9A052]">→</span>
                                <span>{leg.destination?.icao || "---"}</span>
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono">
                                {leg.flightDate ? leg.flightDate.slice(5) : "---"} • {leg.departureTimeLocal || "10:00"}
                              </span>
                            </div>
                          ))}
                          <span className="text-[10px] text-gray-500">
                            {(booking.legs || []).length} {(booking.legs || []).length > 1 ? "legs" : "leg"} • {(booking.legs || [])[0]?.paxCount || 2} Pax
                          </span>
                        </div>
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

                      {/* Dispatch Checklist Badge */}
                      <td className="py-4 px-4">
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-mono font-bold w-max ${
                            isAllReady
                              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                              : "bg-amber-50 border-amber-300 text-amber-800"
                          }`}
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>
                            {completedChecklist}/{totalChecklist} Cleared
                          </span>
                        </div>
                      </td>

                      {/* Actions & Documents: Lifecycle flow Quote -> Contract -> Booked Contract */}
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Booked Contract Actions: Generate Flight Brief, Invoice, Credit Note */}
                          {!isInProgress ? (
                            <>
                              {/* Flight Brief */}
                              <button
                                onClick={() => openDocument(booking, "flight_brief")}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-[11px] font-bold transition-all shadow-sm"
                                title="Generate & View Flight Brief"
                              >
                                <Compass className="w-3.5 h-3.5" />
                                <span>Brief</span>
                              </button>

                              {/* Tax Invoice */}
                              <button
                                onClick={() => openDocument(booking, "invoice")}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-[11px] font-bold transition-all shadow-sm"
                                title="Generate & View Tax Invoice"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Invoice</span>
                              </button>

                              {/* Charter Contract */}
                              <button
                                onClick={() => openDocument(booking, "charter_agreement")}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#141A29] hover:bg-[#1E2638] text-[#C9A052] text-[11px] font-bold transition-all shadow-sm"
                                title="View Executed Charter Contract Agreement"
                              >
                                <ScrollText className="w-3.5 h-3.5" />
                                <span>Contract</span>
                              </button>

                              {/* Credit Note */}
                              {booking.creditNotes?.length ? (
                                <button
                                  onClick={() => openDocument(booking, "credit_note")}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-900 border border-red-300 text-[11px] font-bold transition-all shadow-sm"
                                  title="View the credit note for this iteration"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-red-700" />
                                  <span>Credit Note</span>
                                </button>
                              ) : null}
                            </>
                          ) : (
                            /* Quote / Contract in progress actions */
                            <>
                              {/* Quote */}
                              <button
                                onClick={() => openDocument(booking, "quotation")}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-[11px] font-bold transition-all shadow-sm"
                                title="Generate & View Quotation"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Quote</span>
                              </button>

                              {/* Proceed to Contract */}
                              <button
                                onClick={() => setActiveNav("generate_contract")}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#141A29] hover:bg-[#1E2638] text-[#C9A052] text-[11px] font-bold transition-all shadow-sm"
                                title="Proceed to Contract Generation"
                              >
                                <ScrollText className="w-3.5 h-3.5" />
                                <span>Contract</span>
                              </button>

                              {/* Lock in & Confirm Booking */}
                              <button
                                onClick={() => convertQuoteToBooked(booking.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all shadow-sm"
                                title="Confirm Contract & Book Flight"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Confirm</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      </tr>
                      {hasIterations && isExpanded && (
                        <tr className="bg-[#FAF8F5]">
                          <td colSpan={7} className="px-5 py-3">
                            <div className="space-y-2 border-l-2 border-[#C9A052] pl-4">
                              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500">
                                Booking history · {tripKey}
                              </p>
                              {revisions.map((revision) => (
                                <div
                                  key={revision.id}
                                  className={`w-full flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${
                                    revision.id === booking.id
                                      ? "border-emerald-300 bg-emerald-50"
                                      : "border-[#E0DAD0] bg-white"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => setSelectedBookingForDetail(revision)}
                                    className="flex flex-1 flex-wrap items-center justify-between gap-2 text-left min-w-[220px]"
                                  >
                                    <span className="font-mono font-bold text-[#0F1420]">
                                      {revision.isBooked
                                        ? revision.bookingRevisionId || revision.tripNumber
                                        : revision.quoteId || revision.quoteReference || revision.tripNumber}
                                      {revision.id === booking.id && <span className="ml-2 text-emerald-700">Current</span>}
                                      {(revision.isCancelled || revision.status === "cancelled") && <span className="ml-2 text-red-600">Archived</span>}
                                    </span>
                                    <span className="text-gray-500">{revision.updatedAt || revision.createdAt || "Date unavailable"}</span>
                                    <span className="font-mono font-bold text-[#0F1420]">
                                      {formatCurrency(revision.pricing.totalFlightPrice, revision.pricing.currency)}
                                    </span>
                                    <span className="text-gray-600">{revision.cancellationReason || revision.status.replace("_", " ")}</span>
                                  </button>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openDocument(revision, revision.isBooked ? "invoice" : "quotation")}
                                      className="text-[11px] font-bold text-[#9A7A35] hover:text-[#0F1420]"
                                      title={revision.isBooked
                                        ? `View invoice ${revision.invoiceNumber || ""} for this iteration`
                                        : `View quote ${revision.quoteReference || ""} for this iteration`}
                                    >
                                      {revision.isBooked ? "Invoice" : "Quote"}
                                    </button>
                                    {revision.isBooked && revision.creditNotes?.length ? (
                                      <button
                                        type="button"
                                        onClick={() => openDocument(revision, "credit_note")}
                                        className="text-[11px] font-bold text-red-700 hover:text-red-900"
                                        title={`View credit note for ${revision.bookingRevisionId || "this iteration"}`}
                                      >
                                        Credit Note
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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

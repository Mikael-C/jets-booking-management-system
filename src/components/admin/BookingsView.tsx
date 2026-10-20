"use client";

import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import { formatCurrency } from "@/lib/pricingCalculator";
import { Booking } from "@/types/aviation";
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
  AlertCircle
} from "lucide-react";

export default function BookingsView() {
  const {
    bookings,
    searchQuery,
    openDocument,
    setSelectedBookingForDetail,
    convertQuoteToBooked
  } = useAviation();

  const [activeTab, setActiveTab] = useState<"all" | "in_progress" | "confirmed" | "completed">("all");

  const filteredBookings = bookings.filter((b) => {
    // Status filter
    if (activeTab === "in_progress") {
      if (!["draft", "quote_sent", "client_review"].includes(b.status)) return false;
    } else if (activeTab === "confirmed") {
      if (!["confirmed", "dispatched", "in_flight"].includes(b.status)) return false;
    } else if (activeTab === "completed") {
      if (b.status !== "completed") return false;
    }

    // Search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchTrip = b.tripNumber.toLowerCase().includes(q);
      const matchClient = b.client.fullName.toLowerCase().includes(q);
      const matchCompany = b.client.companyName?.toLowerCase().includes(q) ?? false;
      const matchAircraft = b.aircraft.name.toLowerCase().includes(q) || (b.aircraft.registration?.toLowerCase().includes(q) ?? false);
      const matchRoute = b.legs.some(
        (l) =>
          l.origin.icao.toLowerCase().includes(q) ||
          l.destination.icao.toLowerCase().includes(q) ||
          l.origin.city.toLowerCase().includes(q) ||
          l.destination.city.toLowerCase().includes(q)
      );
      if (!matchTrip && !matchClient && !matchCompany && !matchAircraft && !matchRoute) return false;
    }

    return true;
  });

  const getStatusBadge = (status: Booking["status"]) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-max">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            CONFIRMED
          </span>
        );
      case "dispatched":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-300 flex items-center gap-1 w-max">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
            DISPATCHED
          </span>
        );
      case "in_flight":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1 w-max animate-pulse">
            <Plane className="w-2.5 h-2.5" />
            IN FLIGHT
          </span>
        );
      case "completed":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-gray-200 text-gray-700 border border-gray-300 flex items-center gap-1 w-max">
            COMPLETED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 w-max">
            <Clock className="w-2.5 h-2.5" />
            {status.toUpperCase().replace("_", " ")}
          </span>
        );
    }
  };

  const countAll = bookings.length;
  const countInProgress = bookings.filter((b) => ["draft", "quote_sent", "client_review"].includes(b.status)).length;
  const countConfirmed = bookings.filter((b) => ["confirmed", "dispatched", "in_flight"].includes(b.status)).length;
  const countCompleted = bookings.filter((b) => b.status === "completed").length;

  return (
    <div className="space-y-6">
      
      {/* Category Tabs & Subheader Bar */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#F5F2EC] p-1.5 rounded-xl border border-[#E0DAD0]">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
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
            onClick={() => setActiveTab("in_progress")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "in_progress"
                ? "bg-[#0F1420] text-white shadow-sm"
                : "text-[#0F1420]/70 hover:text-[#0F1420]"
            }`}
          >
            <span>In-Progress Quotes</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${activeTab === "in_progress" ? "bg-amber-400 text-[#0F1420]" : "bg-[#E0DAD0] text-gray-700"}`}>
              {countInProgress}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("confirmed")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
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
            onClick={() => setActiveTab("completed")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
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
        
        <div className="p-4 bg-[#F5F2EC]/80 border-b border-[#E0DAD0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs font-mono uppercase tracking-wider text-[#0F1420]">
              Flight Operations Register
            </span>
            <span className="text-xs text-gray-500">({filteredBookings.length} results)</span>
          </div>
          <span className="text-xs text-[#0F1420]/60 font-mono">
            EASA Part-CAT & Austrian Law Applicable
          </span>
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
                filteredBookings.map((booking) => {
                  const totalChecklist = booking.checklist.length;
                  const completedChecklist = booking.checklist.filter((c) => c.isCompleted).length;
                  const isAllReady = completedChecklist === totalChecklist;
                  const isInProgress = ["draft", "quote_sent", "client_review"].includes(booking.status);

                  return (
                    <tr
                      key={booking.id}
                      onClick={() => setSelectedBookingForDetail(booking)}
                      className="hover:bg-[#F5F2EC]/60 transition-colors cursor-pointer group"
                    >
                      {/* Trip & Status */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-extrabold text-[#0F1420] font-mono text-sm tracking-wide group-hover:text-[#C9A052] transition-colors flex items-center gap-1.5">
                            {booking.tripNumber}
                            <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#C9A052]" />
                          </span>
                          {getStatusBadge(booking.status)}
                        </div>
                      </td>

                      {/* Client / Account */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#0F1420] text-xs">{booking.client.fullName}</span>
                          {booking.client.companyName && (
                            <span className="text-[11px] text-gray-600">{booking.client.companyName}</span>
                          )}
                          <span className="text-[10px] text-gray-400 font-mono">Acc: {booking.accountNumber}</span>
                        </div>
                      </td>

                      {/* Aircraft & Tail */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#0F1420]">{booking.aircraft.name}</span>
                          <span className="text-[11px] font-mono font-bold text-[#C9A052]">
                            Tail: {booking.aircraft.registration || "OE-FFB"}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {booking.aircraft.passengers} Seats • {booking.aircraft.categoryLabel}
                          </span>
                        </div>
                      </td>

                      {/* Routing & Schedule */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 max-w-[210px]">
                          {booking.legs.map((leg) => (
                            <div key={leg.legNumber} className="text-[11px] flex items-center justify-between gap-2">
                              <span className="font-extrabold text-[#0F1420] font-mono flex items-center gap-1">
                                <span>{leg.origin.icao}</span>
                                <span className="text-[#C9A052]">→</span>
                                <span>{leg.destination.icao}</span>
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono">
                                {leg.flightDate.slice(5)} • {leg.departureTimeLocal}
                              </span>
                            </div>
                          ))}
                          <span className="text-[10px] text-gray-500">
                            {booking.legs.length} {booking.legs.length > 1 ? "legs" : "leg"} • {booking.legs[0]?.paxCount || 2} Pax
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

                      {/* Actions & Documents */}
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quote */}
                          <button
                            onClick={() => openDocument(booking, "quotation")}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-[11px] font-bold transition-all shadow-sm"
                            title="Generate & View Quotation"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Quote</span>
                          </button>

                          {/* Invoice */}
                          <button
                            onClick={() => openDocument(booking, "invoice")}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-[11px] font-bold transition-all shadow-sm"
                            title="Generate & View Tax Invoice"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Invoice</span>
                          </button>

                          {/* Brief */}
                          <button
                            onClick={() => openDocument(booking, "flight_brief")}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-[11px] font-bold transition-all shadow-sm"
                            title="Generate & View Flight Brief"
                          >
                            <Compass className="w-3.5 h-3.5" />
                            <span>Brief</span>
                          </button>

                          {/* Confirm deal if in progress */}
                          {isInProgress && (
                            <button
                              onClick={() => convertQuoteToBooked(booking.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all shadow-sm ml-1"
                              title="Lock in Confirmed Booking"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirm</span>
                            </button>
                          )}
                        </div>
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

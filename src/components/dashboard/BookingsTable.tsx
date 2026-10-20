"use client";

import React from "react";
import { useAviation } from "@/lib/aviationContext";
import { Booking } from "@/types/aviation";
import { formatCurrency } from "@/lib/pricingCalculator";
import {
  FileText,
  Receipt,
  Compass,
  ScrollText,
  CheckSquare,
  Plane,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

interface BookingsTableProps {
  filterStatus?: string;
}

export default function BookingsTable({ filterStatus = "all" }: BookingsTableProps) {
  const { bookings, openDocument, openChecklist, searchQuery } = useAviation();

  // Filter for successfully booked flights: confirmed, dispatched, in_flight, completed
  const bookedList = bookings.filter((b) => {
    const isBookedStatus = ["confirmed", "dispatched", "in_flight", "completed"].includes(b.status);
    if (!isBookedStatus) return false;

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchTrip = b.tripNumber.toLowerCase().includes(q);
      const matchClient = b.client.fullName.toLowerCase().includes(q);
      const matchAircraft = b.aircraft.name.toLowerCase().includes(q) || (b.aircraft.registration?.toLowerCase().includes(q) ?? false);
      const matchRoute = b.legs.some(
        (l) => l.origin.icao.toLowerCase().includes(q) || l.destination.icao.toLowerCase().includes(q) || l.origin.city.toLowerCase().includes(q) || l.destination.city.toLowerCase().includes(q)
      );
      if (!matchTrip && !matchClient && !matchAircraft && !matchRoute) return false;
    }

    if (filterStatus !== "all" && b.status !== filterStatus) return false;
    return true;
  });

  const getStatusBadge = (status: Booking["status"]) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-max">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            CONFIRMED
          </span>
        );
      case "dispatched":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center gap-1 w-max">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            DISPATCHED
          </span>
        );
      case "in_flight":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1 w-max animate-pulse">
            <Plane className="w-2.5 h-2.5" />
            IN FLIGHT
          </span>
        );
      case "completed":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-gray-500/15 text-gray-400 border border-gray-500/30 flex items-center gap-1 w-max">
            COMPLETED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-max">
            {status.toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0F1420] border border-gray-800 rounded-2xl shadow-xl overflow-hidden mb-8">
      {/* Table Header / Subheading */}
      <div className="p-5 bg-[#0B101A] border-b border-gray-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-gold font-bold">
            CONFIRMED CHARTER FLIGHTS
          </span>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            Successfully Booked Flights
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-gray-800 text-gray-300">
              {bookedList.length} trips
            </span>
          </h2>
        </div>
        <div className="text-xs text-gray-400 hidden sm:block">
          Click any action button to instantly preview or download official documents.
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#080C14] text-gray-400 font-mono text-[11px] uppercase tracking-wider border-b border-gray-800">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Trip & Status</th>
              <th className="py-3.5 px-4 font-semibold">Client & Account</th>
              <th className="py-3.5 px-4 font-semibold">Aircraft & Tail</th>
              <th className="py-3.5 px-4 font-semibold">Routing & Schedule</th>
              <th className="py-3.5 px-4 font-semibold">Price</th>
              <th className="py-3.5 px-4 font-semibold">Dispatch Checklist</th>
              <th className="py-3.5 px-4 font-semibold text-right">Generate & Download Documents</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/80">
            {bookedList.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500 text-sm">
                  No confirmed bookings match your search criteria.
                </td>
              </tr>
            ) : (
              bookedList.map((booking) => {
                const totalChecklist = booking.checklist.length;
                const completedChecklist = booking.checklist.filter((c) => c.isCompleted).length;
                const isAllReady = completedChecklist === totalChecklist;

                return (
                  <tr
                    key={booking.id}
                    className="hover:bg-[#141A29]/70 transition-colors group text-gray-300"
                  >
                    {/* Trip & Status */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-white font-mono text-sm tracking-wide">
                          {booking.tripNumber}
                        </span>
                        {getStatusBadge(booking.status)}
                      </div>
                    </td>

                    {/* Client & Account */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white text-xs">{booking.client.fullName}</span>
                        {booking.client.companyName && (
                          <span className="text-[11px] text-gray-400">{booking.client.companyName}</span>
                        )}
                        <span className="text-[10px] text-gray-500 font-mono">Acc: {booking.accountNumber}</span>
                      </div>
                    </td>

                    {/* Aircraft & Tail */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-200">{booking.aircraft.name}</span>
                        <span className="text-[10px] font-mono font-bold text-gold">
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
                            <span className="font-bold text-white font-mono flex items-center gap-1">
                              <span>{leg.origin.icao}</span>
                              <span className="text-gold">→</span>
                              <span>{leg.destination.icao}</span>
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {leg.flightDate.slice(5)} • {leg.departureTimeLocal}
                            </span>
                          </div>
                        ))}
                        <span className="text-[10px] text-gray-500">
                          {booking.legs.length} {booking.legs.length > 1 ? "legs" : "leg"} • Total Pax: {booking.legs[0]?.paxCount || 2}
                        </span>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-4 px-4 font-mono">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">
                          {formatCurrency(booking.pricing.totalFlightPrice, booking.pricing.currency)}
                        </span>
                        <span className="text-[10px] text-gray-500">VAT 0% Exempt</span>
                      </div>
                    </td>

                    {/* Dispatch Checklist Button */}
                    <td className="py-4 px-4">
                      <button
                        onClick={() => openChecklist(booking)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-mono font-semibold transition-all ${
                          isAllReady
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                        }`}
                        title="Open live dispatch checklist"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>
                          {completedChecklist}/{totalChecklist} Cleared
                        </span>
                      </button>
                    </td>

                    {/* Designated Download / View Buttons */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. Quotation */}
                        <button
                          onClick={() => openDocument(booking, "quotation")}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gold hover:text-[#0F1420] text-gray-200 text-[11px] font-semibold border border-gray-700 transition-all cursor-pointer group/btn"
                          title="Generate & Download Quotation"
                        >
                          <FileText className="w-3.5 h-3.5 text-gold group-hover/btn:text-[#0F1420]" />
                          <span>Quote</span>
                        </button>

                        {/* 2. Invoice */}
                        <button
                          onClick={() => openDocument(booking, "invoice")}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gold hover:text-[#0F1420] text-gray-200 text-[11px] font-semibold border border-gray-700 transition-all cursor-pointer group/btn"
                          title="Generate & Download Tax Invoice"
                        >
                          <Receipt className="w-3.5 h-3.5 text-gold group-hover/btn:text-[#0F1420]" />
                          <span>Invoice</span>
                        </button>

                        {/* 3. Flight Brief */}
                        <button
                          onClick={() => openDocument(booking, "flight_brief")}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gold hover:text-[#0F1420] text-gray-200 text-[11px] font-semibold border border-gray-700 transition-all cursor-pointer group/btn"
                          title="Generate & Download Flight Operations Brief"
                        >
                          <Compass className="w-3.5 h-3.5 text-gold group-hover/btn:text-[#0F1420]" />
                          <span>Brief</span>
                        </button>

                        {/* 4. Charter Agreement */}
                        <button
                          onClick={() => openDocument(booking, "charter_agreement")}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gold hover:text-[#0F1420] text-gray-200 text-[11px] font-semibold border border-gray-700 transition-all cursor-pointer group/btn"
                          title="Generate & Download Charter Agreement"
                        >
                          <ScrollText className="w-3.5 h-3.5 text-gold group-hover/btn:text-[#0F1420]" />
                          <span>Agreement</span>
                        </button>
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
  );
}

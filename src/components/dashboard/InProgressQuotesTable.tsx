"use client";

import React from "react";
import { useAviation } from "@/lib/aviationContext";
import { formatCurrency } from "@/lib/pricingCalculator";
import { FileText, CheckCircle2, Clock, Send, ScrollText, Sparkles } from "lucide-react";

export default function InProgressQuotesTable() {
  const { bookings, openDocument, convertQuoteToBooked, searchQuery } = useAviation();

  // In-progress statuses
  const inProgressList = bookings.filter((b) => {
    const isInProgress = ["draft", "quote_sent", "client_review"].includes(b.status);
    if (!isInProgress) return false;

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchTrip = b.tripNumber.toLowerCase().includes(q);
      const matchClient = b.client.fullName.toLowerCase().includes(q);
      const matchAircraft = b.aircraft.name.toLowerCase().includes(q);
      if (!matchTrip && !matchClient && !matchAircraft) return false;
    }
    return true;
  });

  return (
    <div className="bg-[#0F1420] border border-gray-800 rounded-2xl shadow-xl overflow-hidden mb-8">
      {/* Table Header */}
      <div className="p-5 bg-[#0B101A] border-b border-gray-800 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
            QUOTING PIPELINE & PROPOSALS
          </span>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            In-Progress Bookings
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-amber-500/20 text-amber-300">
              {inProgressList.length} active leads
            </span>
          </h2>
        </div>
        <div className="text-xs text-gray-400 hidden sm:block">
          Review proposals, send quotes to clients, or lock in confirmed charters.
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#080C14] text-gray-400 font-mono text-[11px] uppercase tracking-wider border-b border-gray-800">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Quote Ref & State</th>
              <th className="py-3.5 px-4 font-semibold">Client Name</th>
              <th className="py-3.5 px-4 font-semibold">Aircraft Model</th>
              <th className="py-3.5 px-4 font-semibold">Route & Dates</th>
              <th className="py-3.5 px-4 font-semibold">Quote Value</th>
              <th className="py-3.5 px-4 font-semibold">Expiration</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/80">
            {inProgressList.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-500">
                  No active in-progress quotes found. Use &quot;New Quote&quot; to create one.
                </td>
              </tr>
            ) : (
              inProgressList.map((booking) => (
                <tr
                  key={booking.id}
                  className="hover:bg-[#141A29]/70 transition-colors text-gray-300"
                >
                  {/* Quote Ref & State */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-white font-mono">{booking.tripNumber}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 w-max flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {booking.status === "quote_sent"
                          ? "QUOTE SENT"
                          : booking.status === "client_review"
                          ? "CLIENT REVIEWING"
                          : "DRAFT PROPOSAL"}
                      </span>
                    </div>
                  </td>

                  {/* Client */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{booking.client.fullName}</span>
                      <span className="text-[11px] text-gray-400">{booking.client.companyName || "Private Individual"}</span>
                    </div>
                  </td>

                  {/* Aircraft */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-200">{booking.aircraft.name}</span>
                      <span className="text-[10px] text-gray-500">{booking.aircraft.categoryLabel}</span>
                    </div>
                  </td>

                  {/* Route & Dates */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col text-[11px]">
                      {booking.legs.map((leg) => (
                        <span key={leg.legNumber} className="font-mono text-gray-200">
                          {leg.origin.icao} → {leg.destination.icao} ({leg.flightDate})
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Quote Value */}
                  <td className="py-4 px-4 font-mono font-bold text-white text-sm">
                    {formatCurrency(booking.pricing.totalFlightPrice, booking.pricing.currency)}
                  </td>

                  {/* Expiration */}
                  <td className="py-4 px-4">
                    <span className="text-[11px] font-mono text-gray-400">
                      {booking.quoteExpirationDate}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openDocument(booking, "quotation")}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gold hover:text-[#0F1420] text-gray-200 text-xs font-semibold border border-gray-700 transition-all cursor-pointer"
                        title="View and download proposal"
                      >
                        <FileText className="w-3.5 h-3.5 text-gold" />
                        <span>View Quote</span>
                      </button>

                      <button
                        onClick={() => convertQuoteToBooked(booking.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                        title="Convert proposal into Confirmed Booking"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Booking</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

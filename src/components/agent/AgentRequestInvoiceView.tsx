"use client";

import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import { Receipt, Plane, User, Calendar, Send, CheckCircle2, Building, DollarSign } from "lucide-react";

export default function AgentRequestInvoiceView() {
  const { addAgentRequest, currentUser, setActiveNav, bookings } = useAviation();

  const [selectedBookingId, setSelectedBookingId] = useState(bookings[0]?.id || "");
  const selectedBooking = bookings.find((b) => b.id === selectedBookingId) || bookings[0];

  const [clientName, setClientName] = useState(selectedBooking?.client.fullName || "Edward Brinkmann");
  const [companyName, setCompanyName] = useState(selectedBooking?.client.companyName || "Edward Brinkmann");
  const [clientAddress, setClientAddress] = useState(selectedBooking?.client.streetAddress || "3606 Enterprise Ave");
  const [clientCityCountry, setClientCityCountry] = useState(
    selectedBooking?.client.cityPostalCountry || "FL-34104 Naples, United States"
  );
  const [vatNumber, setVatNumber] = useState(selectedBooking?.client.vatNumber || "US-8492041");
  const [invoiceDueDate, setInvoiceDueDate] = useState("03.10.2026");
  const [billingNotes, setBillingNotes] = useState(
    "Standard international charter tax exemption §6 Abs. 1 Zif. 3 applies. SEPA wiring preferred. Broker commission 8% agreed."
  );

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const title = `Invoice Request: ${selectedBooking?.tripNumber || "Flight Charter"} (${clientName})`;

    addAgentRequest({
      type: "invoice",
      title,
      agentName: currentUser?.name || "Marcus Vance",
      agentEmail: currentUser?.email || "agent@orbelo.com",
      clientName,
      clientEmail: selectedBooking?.client.email || "client@email.com",
      clientPhone: selectedBooking?.client.phone || "+1 239 555 0192",
      companyName,
      clientAddress,
      clientCityCountry,
      clientVatNumber: vatNumber,
      route: selectedBooking ? selectedBooking.legs.map((l) => `${l.origin.icao} → ${l.destination.icao}`).join(" • ") : "LSGG → LIMJ",
      flightDate: selectedBooking?.legs[0]?.flightDate || "2026-10-24",
      paxCount: selectedBooking?.legs[0]?.paxCount || 2,
      bookingId: selectedBooking?.id,
      invoiceDueDate,
      specialRequests: `Billing VAT: ${vatNumber}\nDue Date: ${invoiceDueDate}\nAddress: ${clientAddress}, ${clientCityCountry}\nBilling Notes: ${billingNotes}`
    });

    setSubmitted(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30">
              COMMERCIAL SETTLEMENT
            </span>
            <span className="text-xs text-[#0F1420]/60">Invoice Request Desk</span>
          </div>
          <h2 className="text-xl font-black text-[#0F1420] tracking-tight">
            Request Commercial Tax Invoice from Admin
          </h2>
          <p className="text-xs text-[#0F1420]/65 mt-0.5">
            Submit charter contract details, billing entity information, and settlement instructions to Admin Finance.
          </p>
        </div>
      </div>

      {submitted ? (
        <div className="bg-white border border-emerald-300 rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-[#0F1420]">
            Invoice Request Forwarded to Administrator!
          </h3>
          <p className="text-xs text-[#0F1420]/70 max-w-md mx-auto">
            Your invoice request for <strong>{clientName}</strong> has been transmitted to Admin Commercial Operations. Once generated, you can view and download the official PDF from your tracking desk.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setActiveNav("my_requests")}
              className="px-5 py-2.5 rounded-xl bg-[#0F1420] hover:bg-[#1A2338] text-white text-xs font-bold transition-all"
            >
              Track in My Requests
            </button>
            <button
              onClick={() => setSubmitted(false)}
              className="px-5 py-2.5 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black uppercase tracking-wider transition-all"
            >
              Submit Another Invoice Request
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Select Booking */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E0DAD0]">
              <Plane className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                Select Charter Flight
              </h3>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Charter Booking Reference
              </label>
              <select
                value={selectedBookingId}
                onChange={(e) => {
                  setSelectedBookingId(e.target.value);
                  const b = bookings.find((item) => item.id === e.target.value);
                  if (b) {
                    setClientName(b.client.fullName);
                    setCompanyName(b.client.companyName || b.client.fullName);
                    setClientAddress(b.client.streetAddress);
                    setClientCityCountry(b.client.cityPostalCountry);
                    setVatNumber(b.client.vatNumber || "");
                  }
                }}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              >
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.tripNumber} — {b.client.fullName} ({b.aircraft.name} • €{b.pricing.totalFlightPrice.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Billing Entity */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E0DAD0]">
              <Building className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                Bill-To Entity & Settlement Schedule
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Client Full Name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  placeholder="Edward Brinkmann"
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Edward Brinkmann"
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Client Tax / VAT Identification
                </label>
                <input
                  type="text"
                  placeholder="e.g. ATU 6335 7619 or US-8492041"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  placeholder="3606 Enterprise Ave"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  City, State / Postal & Country
                </label>
                <input
                  type="text"
                  placeholder="FL-34104 Naples, United States"
                  value={clientCityCountry}
                  onChange={(e) => setClientCityCountry(e.target.value)}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Payment Due Date
                </label>
                <input
                  type="text"
                  value={invoiceDueDate}
                  onChange={(e) => setInvoiceDueDate(e.target.value)}
                  required
                  placeholder="03.10.2026"
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#C9A052] focus:outline-none focus:border-[#C9A052]"
                />
              </div>
            </div>
          </div>

          {/* Billing Instructions */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-3">
            <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
              Billing Remarks & Commission Notes
            </label>
            <textarea
              rows={3}
              value={billingNotes}
              onChange={(e) => setBillingNotes(e.target.value)}
              className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl p-3 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="py-3.5 px-8 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Submit Tax Invoice Request</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

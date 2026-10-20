"use client";

import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import { Compass, Plane, User, Calendar, Send, CheckCircle2 } from "lucide-react";

export default function AgentRequestBriefView() {
  const { addAgentRequest, currentUser, setActiveNav, bookings } = useAviation();

  const [selectedBookingId, setSelectedBookingId] = useState(bookings[0]?.id || "");
  const selectedBooking = bookings.find((b) => b.id === selectedBookingId) || bookings[0];

  const [leadPax, setLeadPax] = useState(selectedBooking?.client.fullName || "Edward Brinkmann");
  const [guestManifest, setGuestManifest] = useState("Guest 1: Aysel Nail Qizi Aliyeva (Passport: AZ8819201, Nationality: AZE)");
  const [fboNotes, setFboNotes] = useState("Client requests private ramp meet-and-greet with dedicated baggage porter at Geneva Jet Aviation.");
  const [cateringNotes, setCateringNotes] = useState("Premium seasonal fruit platter, still Evian water, chilled vintage champagne.");

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const title = `Flight Brief Request: ${selectedBooking?.tripNumber || "Charter Flight"} (${leadPax})`;

    addAgentRequest({
      type: "flight_brief",
      title,
      agentName: currentUser?.name || "Marcus Vance",
      agentEmail: currentUser?.email || "agent@orbelo.com",
      clientName: leadPax,
      clientEmail: selectedBooking?.client.email || "client@email.com",
      clientPhone: selectedBooking?.client.phone || "+1 239 555 0192",
      companyName: selectedBooking?.client.companyName,
      route: selectedBooking ? selectedBooking.legs.map((l) => `${l.origin.icao} → ${l.destination.icao}`).join(" • ") : "LSGG → LIMJ",
      flightDate: selectedBooking?.legs[0]?.flightDate || "2026-10-24",
      paxCount: selectedBooking?.legs[0]?.paxCount || 2,
      bookingId: selectedBooking?.id,
      specialRequests: `Passenger Manifest: ${guestManifest}\nFBO Handling: ${fboNotes}\nCatering: ${cateringNotes}`
    });

    setSubmitted(true);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      
      {/* Header */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30">
              OPERATIONS REQUEST
            </span>
            <span className="text-xs text-[#0F1420]/60">Flight Brief Generation Desk</span>
          </div>
          <h2 className="text-xl font-black text-[#0F1420] tracking-tight">
            Request Flight Operations Brief
          </h2>
          <p className="text-xs text-[#0F1420]/65 mt-0.5">
            Submit passenger manifest, handling requirements, and VIP requests to Admin Operations to compile the official crew brief.
          </p>
        </div>
      </div>

      {submitted ? (
        <div className="bg-white border border-emerald-300 rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-[#0F1420]">
            Flight Brief Request Transmitted to Administrator!
          </h3>
          <p className="text-xs text-[#0F1420]/70 max-w-md mx-auto">
            Your flight brief request has been queued to Admin Flight Dispatch. Once generated, the official PDF will be available on your tracking desk.
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
              Submit Another Brief Request
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Select Trip */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E0DAD0]">
              <Plane className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                Select Confirmed Charter Flight
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
                  if (b) setLeadPax(b.client.fullName);
                }}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              >
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.tripNumber} — {b.client.fullName} ({b.aircraft.name} • {b.legs.map((l) => `${l.origin.icao}→${l.destination.icao}`).join(",")})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Passenger Manifest */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E0DAD0]">
              <User className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                Passenger Manifest Details
              </h3>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Lead Passenger Name
              </label>
              <input
                type="text"
                value={leadPax}
                onChange={(e) => setLeadPax(e.target.value)}
                required
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Guest Passengers & Passport Details
              </label>
              <textarea
                rows={3}
                value={guestManifest}
                onChange={(e) => setGuestManifest(e.target.value)}
                placeholder="Name, Passport #, Nationality, Expiry Date..."
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl p-3 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>
          </div>

          {/* FBO Handling & VIP Catering */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E0DAD0]">
              <Compass className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                Handling & Service Specifications
              </h3>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                FBO Ramp & Ground Handling Preferences
              </label>
              <textarea
                rows={2}
                value={fboNotes}
                onChange={(e) => setFboNotes(e.target.value)}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl p-3 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                VIP In-Flight Catering Requirements
              </label>
              <textarea
                rows={2}
                value={cateringNotes}
                onChange={(e) => setCateringNotes(e.target.value)}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl p-3 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="py-3.5 px-8 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Submit Flight Brief Request</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

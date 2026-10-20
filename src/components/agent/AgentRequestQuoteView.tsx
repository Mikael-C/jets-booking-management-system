"use client";

import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import { airportsData } from "@/data/airports";
import { fleetData } from "@/data/fleet";
import { TripType } from "@/types/aviation";
import { Send, Plane, User, Calendar, Clock, Sparkles, CheckCircle2, Shield, Building } from "lucide-react";

export default function AgentRequestQuoteView() {
  const { addAgentRequest, currentUser, setActiveNav, clients } = useAviation();

  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientCityCountry, setClientCityCountry] = useState("");
  const [clientVatNumber, setClientVatNumber] = useState("");

  const [tripType, setTripType] = useState<TripType>("round_trip");
  const [originIcao, setOriginIcao] = useState("LSGG");
  const [destIcao, setDestIcao] = useState("LFMN");
  const [flightDate, setFlightDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]
  );
  const [returnFlightDate, setReturnFlightDate] = useState(
    new Date(Date.now() + 86400000 * 6).toISOString().split("T")[0]
  );
  const [departureTime, setDepartureTime] = useState("11:00");
  const [paxCount, setPaxCount] = useState(4);
  const [aircraftPreference, setAircraftPreference] = useState("Super Midsize Jet (Challenger 350)");
  const [budgetNotes, setBudgetNotes] = useState("Budget: €25,000 - €32,000. Stand-up cabin preferred.");
  const [specialRequests, setSpecialRequests] = useState(
    "VIP champagne catering, tarmac limousine transfer upon landing, luggage for 4 large suitcases."
  );

  // Additional Services Requested
  const [limousineService, setLimousineService] = useState(false);
  const [luxuryCarRental, setLuxuryCarRental] = useState(false);
  const [helicopterService, setHelicopterService] = useState(false);
  const [deicingInsurance, setDeicingInsurance] = useState<"none" | "at_reservation" | "within_48h">("none");
  const [carbonOffset, setCarbonOffset] = useState<"none" | "neutral" | "positive" | "double_neutral">("neutral");
  const [cancellationInsurance, setCancellationInsurance] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  const handleClientSelect = (id: string) => {
    setSelectedClientId(id);
    const found = clients.find((c) => c.id === id);
    if (found) {
      setClientName(found.fullName);
      setCompanyName(found.companyName || "");
      setClientEmail(found.email);
      setClientPhone(found.phone);
      setClientAddress(found.streetAddress || "");
      setClientCityCountry(found.cityPostalCountry || "");
      setClientVatNumber(found.vatNumber || "");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const routeText =
      tripType === "round_trip"
        ? `${originIcao} ⇄ ${destIcao}`
        : `${originIcao} → ${destIcao}`;

    const title = `Quote Request: ${routeText} (${clientName || "Client"})`;

    addAgentRequest({
      type: "quote",
      title,
      agentName: currentUser?.name || "Marcus Vance",
      agentEmail: currentUser?.email || "agent@orbelo.com",
      clientName: clientName || "Private Client",
      clientEmail: clientEmail || "client@email.com",
      clientPhone: clientPhone || "+1 555 0192",
      companyName,
      clientAddress,
      clientCityCountry,
      clientVatNumber,
      tripType,
      route: routeText,
      originIcao,
      destIcao,
      flightDate,
      returnFlightDate: tripType === "round_trip" ? returnFlightDate : undefined,
      departureTime,
      paxCount: Number(paxCount),
      aircraftPreference,
      budgetNotes,
      specialRequests,
      limousineService,
      luxuryCarRental,
      helicopterService,
      deicingInsurance,
      carbonOffset,
      cancellationInsurance
    });

    setSubmitted(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* View Header */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30">
              BROKER REQUEST WORKSPACE
            </span>
            <span className="text-xs text-[#0F1420]/60">Standard Commission: 8%</span>
          </div>
          <h2 className="text-xl font-black text-[#0F1420] tracking-tight">
            Request Private Jet Quote from Admin
          </h2>
          <p className="text-xs text-[#0F1420]/65 mt-0.5">
            Fill in the trip parameters, client fiscal info, and services to submit directly to Admin Flight Dispatch to generate the official quotation.
          </p>
        </div>
      </div>

      {submitted ? (
        <div className="bg-white border border-emerald-300 rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-[#0F1420]">
            Quote Request Forwarded to Administrator!
          </h3>
          <p className="text-xs text-[#0F1420]/70 max-w-md mx-auto">
            Your request for <strong>{originIcao} → {destIcao}</strong> has been transmitted to Admin Flight Operations. Once generated, you can view and download the official PDF proposal from your tracking desk.
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
              Submit Another Quote Request
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Client Information */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#C9A052]" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                  Client Contact & Billing Information
                </h3>
              </div>

              {/* CRM Dropdown */}
              <select
                value={selectedClientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              >
                <option value="">Select Existing Client (Optional)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} {c.companyName ? `(${c.companyName})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Client Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Edward Brinkmann"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Brinkmann Capital SAM"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Client Tax / VAT ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. US-8492041 or ATU 6335 7619"
                  value={clientVatNumber}
                  onChange={(e) => setClientVatNumber(e.target.value)}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="e.brinkmann@luxurycap.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  required
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Phone / Mobile *
                </label>
                <input
                  type="tel"
                  placeholder="+1 239 555 0192"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  required
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
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

              <div className="sm:col-span-2 md:col-span-3">
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  City, State / Postal Code & Country
                </label>
                <input
                  type="text"
                  placeholder="FL-34104 Naples, United States"
                  value={clientCityCountry}
                  onChange={(e) => setClientCityCountry(e.target.value)}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>
            </div>
          </div>

          {/* Route & Aircraft */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E0DAD0]">
              <Plane className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                Flight Route, Schedule & Aircraft Preference
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Trip Format
                </label>
                <select
                  value={tripType}
                  onChange={(e) => setTripType(e.target.value as any)}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                >
                  <option value="round_trip">RoundTripPlus (Return)</option>
                  <option value="one_way">One-Way Charter</option>
                  <option value="multi_leg">Multi-Leg Itinerary</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Origin Airport
                </label>
                <select
                  value={originIcao}
                  onChange={(e) => setOriginIcao(e.target.value)}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                >
                  {airportsData.map((a) => (
                    <option key={a.icao} value={a.icao}>
                      {a.icao} - {a.city} ({a.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Destination Airport
                </label>
                <select
                  value={destIcao}
                  onChange={(e) => setDestIcao(e.target.value)}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                >
                  {airportsData.map((a) => (
                    <option key={a.icao} value={a.icao}>
                      {a.icao} - {a.city} ({a.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Departure Flight Date
                </label>
                <input
                  type="date"
                  value={flightDate}
                  onChange={(e) => setFlightDate(e.target.value)}
                  required
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              {tripType === "round_trip" && (
                <div>
                  <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                    Return Flight Date
                  </label>
                  <input
                    type="date"
                    value={returnFlightDate}
                    onChange={(e) => setReturnFlightDate(e.target.value)}
                    required
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Preferred Departure Time
                </label>
                <input
                  type="text"
                  placeholder="11:00"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Passenger Count (Pax)
                </label>
                <input
                  type="number"
                  min={1}
                  max={19}
                  value={paxCount}
                  onChange={(e) => setPaxCount(Number(e.target.value))}
                  required
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Aircraft Category Preference
                </label>
                <select
                  value={aircraftPreference}
                  onChange={(e) => setAircraftPreference(e.target.value)}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                >
                  <option value="Very Light Jet (Phenom 100 / Citation Mustang)">Very Light Jet (Mustang / Phenom 100)</option>
                  <option value="Light Jet (Phenom 300 / Citation CJ4)">Light Jet (Phenom 300 / Citation CJ4)</option>
                  <option value="Super Midsize Jet (Challenger 350)">Super Midsize Jet (Challenger 350)</option>
                  <option value="Heavy Jet (Gulfstream G550 / Global 6000)">Heavy Jet (Gulfstream G550 / Global 6000)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Services Requested */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E0DAD0]">
              <Shield className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                Concierge, Insurance & Sustainability Options
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-[#E0DAD0] bg-[#FDFCFA] cursor-pointer">
                <input
                  type="checkbox"
                  checked={limousineService}
                  onChange={(e) => setLimousineService(e.target.checked)}
                  className="rounded text-[#C9A052] focus:ring-[#C9A052]"
                />
                <span className="font-medium text-[#0F1420]">VIP Limousine Service</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-[#E0DAD0] bg-[#FDFCFA] cursor-pointer">
                <input
                  type="checkbox"
                  checked={luxuryCarRental}
                  onChange={(e) => setLuxuryCarRental(e.target.checked)}
                  className="rounded text-[#C9A052] focus:ring-[#C9A052]"
                />
                <span className="font-medium text-[#0F1420]">Luxury Car Rental</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-[#E0DAD0] bg-[#FDFCFA] cursor-pointer">
                <input
                  type="checkbox"
                  checked={helicopterService}
                  onChange={(e) => setHelicopterService(e.target.checked)}
                  className="rounded text-[#C9A052] focus:ring-[#C9A052]"
                />
                <span className="font-medium text-[#0F1420]">Helicopter Transfer</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-[#C9A052]/40 bg-[#C9A052]/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cancellationInsurance}
                  onChange={(e) => setCancellationInsurance(e.target.checked)}
                  className="rounded text-[#C9A052] focus:ring-[#C9A052]"
                />
                <span className="font-bold text-[#0F1420]">Cancellation Insurance (€1,000/leg)</span>
              </label>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">De-Icing Option</label>
                <select
                  value={deicingInsurance}
                  onChange={(e) => setDeicingInsurance(e.target.value as any)}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-2.5 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                >
                  <option value="none">None (Standard)</option>
                  <option value="at_reservation">Option 1: At Reservation (€400/leg)</option>
                  <option value="within_48h">Option 2: Book Later (€800/leg)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">Carbon Offset</label>
                <select
                  value={carbonOffset}
                  onChange={(e) => setCarbonOffset(e.target.value as any)}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-2.5 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                >
                  <option value="none">None</option>
                  <option value="neutral">Fly Neutral (€33/hr)</option>
                  <option value="positive">Fly Positive (€50/hr)</option>
                  <option value="double_neutral">Fly Double Neutral (€66/hr)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Budget & Special Requests */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Target Budget / Commercial Notes
                </label>
                <input
                  type="text"
                  value={budgetNotes}
                  onChange={(e) => setBudgetNotes(e.target.value)}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  VIP Catering & Handling Wishes
                </label>
                <input
                  type="text"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Transmit Quote Request to Flight Operations</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

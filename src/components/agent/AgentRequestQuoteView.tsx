"use client";

import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import AirportSearchSelect from "@/components/common/AirportSearchSelect";
import { fleetData } from "@/data/fleet";
import { TripType, RequestLegItem } from "@/types/aviation";
import {
  Send,
  Plane,
  User,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  Shield,
  Building,
  Plus,
  Trash2,
  Luggage,
  HeartHandshake,
  Save,
  Coins
} from "lucide-react";

export default function AgentRequestQuoteView() {
  const {
    addAgentRequest,
    currentUser,
    setActiveNav,
    clients,
    checkAndSpendTokens,
    tokenBalance,
    openTokenModal
  } = useAviation();

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

  // Expanded fields required in Task 6
  const [luggageCount, setLuggageCount] = useState<number>(4);
  const [hasPets, setHasPets] = useState<boolean>(false);
  const [specialNeeds, setSpecialNeeds] = useState<string>("");
  const [isFlexibleTime, setIsFlexibleTime] = useState<boolean>(false);

  // Dynamic multi-leg itinerary (up to 6 legs)
  const [multiLegs, setMultiLegs] = useState<RequestLegItem[]>([
    {
      originIcao: "LSGG",
      destIcao: "LFMN",
      flightDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
      departureTime: "11:00"
    },
    {
      originIcao: "LFMN",
      destIcao: "LIMJ",
      flightDate: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
      departureTime: "14:30"
    }
  ]);

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

  const handleAddLeg = () => {
    if (multiLegs.length >= 6) return;
    const lastLeg = multiLegs[multiLegs.length - 1];
    setMultiLegs([
      ...multiLegs,
      {
        originIcao: lastLeg?.destIcao || "LFMN",
        destIcao: "EGGW",
        flightDate: new Date(Date.now() + 86400000 * (multiLegs.length + 3)).toISOString().split("T")[0],
        departureTime: "12:00"
      }
    ]);
  };

  const handleRemoveLeg = (index: number) => {
    if (multiLegs.length <= 1) return;
    setMultiLegs(multiLegs.filter((_, i) => i !== index));
  };

  const handleMultiLegChange = (index: number, field: keyof RequestLegItem, value: string) => {
    setMultiLegs((prev) =>
      prev.map((leg, i) => (i === index ? { ...leg, [field]: value } : leg))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let routeText = "";
    if (tripType === "multi_leg") {
      routeText = multiLegs.map((l) => `${l.originIcao} → ${l.destIcao}`).join(" | ");
    } else if (tripType === "round_trip") {
      routeText = `${originIcao} ⇄ ${destIcao}`;
    } else {
      routeText = `${originIcao} → ${destIcao}`;
    }

    const hasTokens = await checkAndSpendTokens(
      "Submit Quote Request",
      100,
      `Quote Request for route ${routeText} (${clientName || "Client"})`
    );
    if (!hasTokens) return;

    const title = `Quote Request: ${routeText} (${clientName || "Client"})`;

    await addAgentRequest({
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
      originIcao: tripType === "multi_leg" ? multiLegs[0]?.originIcao : originIcao,
      destIcao: tripType === "multi_leg" ? multiLegs[multiLegs.length - 1]?.destIcao : destIcao,
      flightDate: tripType === "multi_leg" ? multiLegs[0]?.flightDate : flightDate,
      returnFlightDate: tripType === "round_trip" ? returnFlightDate : undefined,
      departureTime: tripType === "multi_leg" ? multiLegs[0]?.departureTime : departureTime,
      paxCount: Number(paxCount),
      aircraftPreference,
      budgetNotes,
      specialRequests,
      luggageCount: Number(luggageCount),
      hasPets,
      specialNeeds,
      isFlexibleTime,
      multiLegs: tripType === "multi_leg" ? multiLegs : undefined,
      limousineService,
      luxuryCarRental,
      helicopterService,
      deicingInsurance,
      carbonOffset,
      cancellationInsurance
    });

    setSubmitted(true);
  };

  const handleSaveDraft = async () => {
    let routeText = "";
    if (tripType === "multi_leg") {
      routeText = multiLegs.map((l) => `${l.originIcao} → ${l.destIcao}`).join(" | ");
    } else if (tripType === "round_trip") {
      routeText = `${originIcao} ⇄ ${destIcao}`;
    } else {
      routeText = `${originIcao} → ${destIcao}`;
    }

    const title = `[DRAFT] Quote: ${routeText} (${clientName || "Client"})`;

    await addAgentRequest({
      type: "quote",
      title,
      agentName: currentUser?.name || "Marcus Vance",
      agentEmail: currentUser?.email || "agent@orbelo.com",
      clientName: clientName || "Draft Client",
      clientEmail: clientEmail || "draft@email.com",
      clientPhone: clientPhone || "+1 555 0000",
      companyName,
      clientAddress,
      clientCityCountry,
      clientVatNumber,
      tripType,
      route: routeText,
      originIcao: tripType === "multi_leg" ? multiLegs[0]?.originIcao : originIcao,
      destIcao: tripType === "multi_leg" ? multiLegs[multiLegs.length - 1]?.destIcao : destIcao,
      flightDate: tripType === "multi_leg" ? multiLegs[0]?.flightDate : flightDate,
      returnFlightDate: tripType === "round_trip" ? returnFlightDate : undefined,
      departureTime: tripType === "multi_leg" ? multiLegs[0]?.departureTime : departureTime,
      paxCount: Number(paxCount),
      aircraftPreference,
      budgetNotes,
      specialRequests,
      luggageCount: Number(luggageCount),
      hasPets,
      specialNeeds,
      isFlexibleTime,
      multiLegs: tripType === "multi_leg" ? multiLegs : undefined,
      deicingInsurance,
      carbonOffset,
      cancellationInsurance
    });

    setActiveNav("my_requests");
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
            Fill in the trip parameters, passenger requirements, client fiscal info, and options to transmit directly to Admin Flight Dispatch.
          </p>
        </div>

        {/* Token Balance & Cost Badge */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0]">
          <div>
            <div className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-[#0F1420]/60">
              <Coins className="w-3.5 h-3.5 text-[#C9A052]" /> Action Cost
            </div>
            <div className="text-xs font-black font-mono text-emerald-800">
              100 Tokens
            </div>
            <p className="text-[10px] text-gray-500 font-mono">
              Balance: {tokenBalance.toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            onClick={() => openTokenModal("Top up tokens for quote generation")}
            className="px-2.5 py-1.5 rounded-lg bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-[10px] font-black uppercase tracking-wider transition-all shadow-sm"
          >
            Refill
          </button>
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
            Your charter request has been transmitted to Admin Flight Operations. Once generated, you can view and download the official PDF proposal from your tracking desk.
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
              <div className="col-span-1 sm:col-span-2 md:col-span-4">
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Trip Format
                </label>
                <select
                  value={tripType}
                  onChange={(e) => setTripType(e.target.value as any)}
                  className="w-full sm:w-72 bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                >
                  <option value="round_trip">RoundTripPlus (Return)</option>
                  <option value="one_way">One-Way Charter</option>
                  <option value="multi_leg">Multi-Leg Itinerary</option>
                </select>
              </div>

              {/* Standard One-Way / Round-Trip Inputs */}
              {tripType !== "multi_leg" ? (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                      Origin Airport
                    </label>
                    <AirportSearchSelect
                      value={originIcao}
                      onChange={setOriginIcao}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                      Destination Airport
                    </label>
                    <AirportSearchSelect
                      value={destIcao}
                      onChange={setDestIcao}
                    />
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
                      Departure Time
                    </label>
                    <input
                      type="text"
                      placeholder="11:00"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                </>
              ) : (
                /* Dynamic Multi-Leg Builder */
                <div className="col-span-1 sm:col-span-2 md:col-span-4 space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-mono font-bold uppercase text-[#0F1420]">
                      Itinerary Flight Legs ({multiLegs.length}/6)
                    </span>
                    {multiLegs.length < 6 && (
                      <button
                        type="button"
                        onClick={handleAddLeg}
                        className="px-3 py-1 rounded-lg bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-extrabold flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Leg</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {multiLegs.map((leg, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#F5F2EC] rounded-xl border border-[#E0DAD0] grid grid-cols-1 sm:grid-cols-5 gap-3 items-center"
                      >
                        <div className="sm:col-span-1">
                          <span className="text-[10px] font-mono font-bold uppercase text-gray-500 block mb-0.5">
                            Leg {idx + 1} Origin
                          </span>
                          <AirportSearchSelect
                            value={leg.originIcao}
                            onChange={(value) => handleMultiLegChange(idx, "originIcao", value)}
                          />
                        </div>

                        <div className="sm:col-span-1">
                          <span className="text-[10px] font-mono font-bold uppercase text-gray-500 block mb-0.5">
                            Leg {idx + 1} Destination
                          </span>
                          <AirportSearchSelect
                            value={leg.destIcao}
                            onChange={(value) => handleMultiLegChange(idx, "destIcao", value)}
                          />
                        </div>

                        <div className="sm:col-span-1">
                          <span className="text-[10px] font-mono font-bold uppercase text-gray-500 block mb-0.5">
                            Flight Date
                          </span>
                          <input
                            type="date"
                            value={leg.flightDate}
                            onChange={(e) => handleMultiLegChange(idx, "flightDate", e.target.value)}
                            required
                            className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs font-mono"
                          />
                        </div>

                        <div className="sm:col-span-1">
                          <span className="text-[10px] font-mono font-bold uppercase text-gray-500 block mb-0.5">
                            Time
                          </span>
                          <input
                            type="text"
                            placeholder="11:00"
                            value={leg.departureTime || "11:00"}
                            onChange={(e) => handleMultiLegChange(idx, "departureTime", e.target.value)}
                            className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                          />
                        </div>

                        <div className="sm:col-span-1 flex items-end justify-end">
                          {multiLegs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLeg(idx)}
                              className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                              title="Remove Leg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

          {/* Passenger Luggage, Pets & Accessibility (Task 6 Fields) */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E0DAD0]">
              <Luggage className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                Luggage, Pets & Passenger Accessibility
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Luggage Items
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={luggageCount}
                  onChange={(e) => setLuggageCount(Number(e.target.value))}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#E0DAD0] bg-[#FDFCFA] cursor-pointer w-full">
                  <input
                    type="checkbox"
                    checked={hasPets}
                    onChange={(e) => setHasPets(e.target.checked)}
                    className="rounded text-[#C9A052] focus:ring-[#C9A052]"
                  />
                  <span className="font-bold text-[#0F1420]">Travelling with Pets (In-Cabin)</span>
                </label>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#E0DAD0] bg-[#FDFCFA] cursor-pointer w-full">
                  <input
                    type="checkbox"
                    checked={isFlexibleTime}
                    onChange={(e) => setIsFlexibleTime(e.target.checked)}
                    className="rounded text-[#C9A052] focus:ring-[#C9A052]"
                  />
                  <span className="font-bold text-[#0F1420]">Flexible Departure Time (±2 hours)</span>
                </label>
              </div>

              <div className="col-span-1 sm:col-span-2 md:col-span-3">
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Special Needs / Passenger Accessibility
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Wheelchair ramp requested, elderly passenger assistance, dietary restrictions..."
                  value={specialNeeds}
                  onChange={(e) => setSpecialNeeds(e.target.value)}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl p-3 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>
            </div>
          </div>

          {/* Concierge, Insurance & Sustainability Options */}
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

          {/* Budget & Catering Requests */}
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

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#F5F2EC] hover:bg-[#EAE6DE] text-[#0F1420] font-bold text-xs uppercase tracking-wider transition-all border border-[#D1C9BC] cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#C9A052]" />
              <span>Save as Draft</span>
            </button>
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

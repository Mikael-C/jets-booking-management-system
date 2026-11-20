"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import AirportSearchSelect from "@/components/common/AirportSearchSelect";
import { TripType, RequestLegItem } from "@/types/aviation";
import { CheckCircle2, Copy, Check, ArrowRight, Plane, Car, Send } from "lucide-react";

const STEPS = [
  { num: 1, label: "Client" },
  { num: 2, label: "Route & dates" },
  { num: 3, label: "Aircraft" },
  { num: 4, label: "Passengers, luggage, pets" },
  { num: 5, label: "Services" },
  { num: 6, label: "Margin & send" },
];

const FLEXIBLE_OPTIONS = ["Fixed", "± 1 hour", "± 2 hours", "± 3 hours", "Same day"];

export default function AgentNewRequestWizard() {
  const router = useRouter();
  const {
    addAgentRequest,
    currentUser,
    tokenBalance,
    checkAndSpendTokens,
    openTokenModal,
  } = useAviation();

  // Mode: "wizard" vs "estimate" (Screen 3)
  const [viewMode, setViewMode] = useState<"wizard" | "estimate">("wizard");

  // --- Price Estimate State (Screen 3) ---
  const [estFrom, setEstFrom] = useState("Lagos (DNMM)");
  const [estTo, setEstTo] = useState("Abuja (DNAA)");
  const [estDate, setEstDate] = useState("Thu 10 Dec");
  const [estPax, setEstPax] = useState("4");
  const [estTrip, setEstTrip] = useState("Return same day");
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // --- Wizard State ---
  const [step, setStep] = useState(2); // Start at step 2 per design
  const [tripType, setTripType] = useState<TripType>("round_trip");
  const [clientName, setClientName] = useState("Adeyemi Holdings Ltd");
  const [clientContact, setClientContact] = useState("T. Adeyemi");
  const [clientEmail, setClientEmail] = useState("office@adeyemi.com");

  // Leg 1
  const [leg1From, setLeg1From] = useState("DNMM");
  const [leg1To, setLeg1To] = useState("EGLF");
  const [leg1Date, setLeg1Date] = useState("2026-12-05");
  const [leg1Time, setLeg1Time] = useState("09:00");
  const [leg1Pax, setLeg1Pax] = useState(5);
  const [leg1Flex, setLeg1Flex] = useState("± 2 hours");

  // Leg 2 (return)
  const [leg2Date, setLeg2Date] = useState("2026-12-12");
  const [leg2Time, setLeg2Time] = useState("16:00");
  const [leg2Pax, setLeg2Pax] = useState(5);
  const [leg2Flex, setLeg2Flex] = useState("Fixed");

  // Multi-leg
  const [multiLegs, setMultiLegs] = useState<RequestLegItem[]>([
    { originIcao: "DNMM", destIcao: "EGLF", flightDate: "2026-12-05", departureTime: "09:00" },
    { originIcao: "EGLF", destIcao: "LSGG", flightDate: "2026-12-10", departureTime: "11:00" },
  ]);

  // Step 3 Aircraft
  const [categoryPreference, setCategoryPreference] = useState("Super Midsize Jet");

  // Step 4 Passengers, luggage, pets (Screen 5)
  const [suitcases, setSuitcases] = useState(3);
  const [hasPets, setHasPets] = useState(false);
  const [petCount, setPetCount] = useState(1);
  const [petWeight, setPetWeight] = useState(8);
  const [petBreed, setPetBreed] = useState("French Bulldog");
  const [petNotes, setPetNotes] = useState("");

  // Step 5 Services - Ground Transportation (Screen 6)
  const [groundRequired, setGroundRequired] = useState(false);
  const [groundLegs, setGroundLegs] = useState<string[]>(["Leg 1"]);
  const [groundLegOther, setGroundLegOther] = useState("");
  const [groundArrivalRequired, setGroundArrivalRequired] = useState(true);
  const [groundArrivalDropoff, setGroundArrivalDropoff] = useState("");
  const [groundArrivalVehicle, setGroundArrivalVehicle] = useState<"Sedan" | "SUV" | "Van" | "Luxury">("Sedan");
  const [groundDepartureRequired, setGroundDepartureRequired] = useState(false);
  const [groundDeparturePickup, setGroundDeparturePickup] = useState("");
  const [groundDepartureVehicle, setGroundDepartureVehicle] = useState<"Sedan" | "SUV" | "Van" | "Luxury">("SUV");
  const [groundPassengers, setGroundPassengers] = useState(4);
  const [groundInstructions, setGroundInstructions] = useState("");
  const [extraGroundTransfers, setExtraGroundTransfers] = useState<{ route: string; notes: string }[]>([]);

  // Step 5 Services - Helicopter Transfer (Screen 6)
  const [heliRequired, setHeliRequired] = useState(false);
  const [heliLegs, setHeliLegs] = useState<string[]>(["Leg 1"]);
  const [heliLegOther, setHeliLegOther] = useState("");
  const [heliArrivalRequired, setHeliArrivalRequired] = useState(false);
  const [heliArrivalDropoff, setHeliArrivalDropoff] = useState("");
  const [heliArrivalPreference, setHeliArrivalPreference] = useState("Twin Engine VIP (AW139 / EC155)");
  const [heliDepartureRequired, setHeliDepartureRequired] = useState(false);
  const [heliDeparturePickup, setHeliDeparturePickup] = useState("");
  const [heliDeparturePreference, setHeliDeparturePreference] = useState("Twin Engine VIP (AW139 / EC155)");
  const [heliPassengers, setHeliPassengers] = useState(4);
  const [heliInstructions, setHeliInstructions] = useState("");
  const [extraHeliTransfers, setExtraHeliTransfers] = useState<{ route: string; notes: string }[]>([]);

  // Catering & special requests
  const [catering, setCatering] = useState("");

  // Step 6 Margin
  const [agentMarginPct, setAgentMarginPct] = useState(8);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const getAirportLabel = (icao: string) => {
    const labels: Record<string, string> = {
      DNMM: "Lagos Murtala Muhammed",
      DNAA: "Abuja Nnamdi Azikiwe",
      EGLF: "London Farnborough",
      LSGG: "Geneva",
      LFPB: "Paris Le Bourget",
      LIML: "Milan Linate",
      LEIB: "Ibiza",
    };
    return labels[icao] || icao;
  };

  const handleCopyWhatsApp = () => {
    const text = `Lagos–Abuja return, 4 pax, light jet from about $9,000. Shall I get you a firm offer?`;
    navigator.clipboard?.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  const handleSelectEstimateCategory = (categoryName: string) => {
    setCategoryPreference(categoryName);
    setLeg1From("DNMM");
    setLeg1To("DNAA");
    setLeg1Pax(Number(estPax) || 4);
    setTripType("round_trip");
    setViewMode("wizard");
    setStep(3);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg("");

    const hasToken = await checkAndSpendTokens("Submit Charter Request", 1, `${leg1From} → ${leg1To} (${clientName})`);
    if (!hasToken) {
      setIsSubmitting(false);
      openTokenModal();
      return;
    }

    const routeText =
      tripType === "round_trip"
        ? `${leg1From} ⇄ ${leg1To}`
        : tripType === "multi_leg"
        ? multiLegs.map((l) => `${l.originIcao} → ${l.destIcao}`).join(" | ")
        : `${leg1From} → ${leg1To}`;

    await addAgentRequest({
      type: "quote",
      title: `Charter Request: ${routeText} (${clientName})`,
      agentName: currentUser?.name || "Agent",
      agentEmail: currentUser?.email || "agent@orbelo.com",
      clientName,
      clientEmail,
      clientPhone: "",
      companyName: clientName,
      tripType,
      route: routeText,
      originIcao: leg1From,
      destIcao: leg1To,
      flightDate: leg1Date,
      returnFlightDate: tripType === "round_trip" ? leg2Date : undefined,
      departureTime: leg1Time,
      paxCount: leg1Pax,
      aircraftPreference: categoryPreference,
      luggageCount: suitcases,
      hasPets,
      petDetails: hasPets
        ? {
            hasPets: true,
            petCount,
            petWeight,
            totalWeightKg: petWeight,
            breed: petBreed,
            petType: petBreed,
            notes: petNotes,
          }
        : undefined,
      groundTransportation: groundRequired
        ? {
            enabled: true,
            flightLeg: groundLegs,
            flightLegOther: groundLegOther,
            onArrival: {
              required: groundArrivalRequired,
              dropOffLocation: groundArrivalDropoff,
              vehiclePreference: groundArrivalVehicle,
            },
            onDeparture: {
              required: groundDepartureRequired,
              pickUpLocation: groundDeparturePickup,
              vehiclePreference: groundDepartureVehicle,
            },
            additionalRequirements: {
              passengers: groundPassengers,
              specialInstructions: groundInstructions,
            },
            extraTransfers: extraGroundTransfers,
          }
        : undefined,
      helicopterTransfer: heliRequired
        ? {
            enabled: true,
            flightLeg: heliLegs,
            flightLegOther: heliLegOther,
            onArrival: {
              required: heliArrivalRequired,
              dropOffLocation: heliArrivalDropoff,
              vehiclePreference: heliArrivalPreference,
            },
            onDeparture: {
              required: heliDepartureRequired,
              pickUpLocation: heliDeparturePickup,
              vehiclePreference: heliDeparturePreference,
            },
            additionalRequirements: {
              passengers: heliPassengers,
              specialInstructions: heliInstructions,
            },
            extraTransfers: extraHeliTransfers,
          }
        : undefined,
      limousineService: groundRequired,
      specialRequests: catering,
      agentMarginPct,
      multiLegs: tripType === "multi_leg" ? multiLegs : undefined,
    });

    setIsSubmitting(false);
    router.push("/agent/requests");
  };

  const canGoNext = step < 6;
  const canGoPrev = step > 1;

  return (
    <div className="space-y-4">
      {/* View Mode Toggle: Price estimate vs New request wizard */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("estimate")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              viewMode === "estimate"
                ? "bg-[#C9A052] text-[#0F1420]"
                : "bg-[#141C2E] text-gray-300 hover:text-white border border-white/10"
            }`}
          >
            Price estimate
          </button>
          <button
            onClick={() => setViewMode("wizard")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              viewMode === "wizard"
                ? "bg-[#C9A052] text-[#0F1420]"
                : "bg-[#141C2E] text-gray-300 hover:text-white border border-white/10"
            }`}
          >
            New request wizard
          </button>
        </div>
        <span className="text-xs text-gray-400">
          Balance: <strong className="text-[#C9A052] font-mono">{tokenBalance} tokens</strong>
        </span>
      </div>

      {/* =========================================================================
          SCREEN 3: PRICE ESTIMATE VIEW
         ========================================================================= */}
      {viewMode === "estimate" ? (
        <div className="space-y-6 pt-1 max-w-6xl">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Price estimate</h1>
            <p className="text-sm text-gray-400 mt-1">
              A quick range to share in conversation. Not an offer: the desk confirms the real price within hours.
            </p>
          </div>

          {/* Form Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-[#141C2E] border border-white/10 rounded-xl p-4">
            <div>
              <label className="text-[11px] text-gray-400 font-medium block mb-1">From</label>
              <input
                type="text"
                value={estFrom}
                onChange={(e) => setEstFrom(e.target.value)}
                className="w-full bg-[#0F1420] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 font-medium block mb-1">To</label>
              <input
                type="text"
                value={estTo}
                onChange={(e) => setEstTo(e.target.value)}
                className="w-full bg-[#0F1420] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 font-medium block mb-1">Date</label>
              <input
                type="text"
                value={estDate}
                onChange={(e) => setEstDate(e.target.value)}
                className="w-full bg-[#0F1420] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 font-medium block mb-1">Passengers</label>
              <input
                type="text"
                value={estPax}
                onChange={(e) => setEstPax(e.target.value)}
                className="w-full bg-[#0F1420] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 font-medium block mb-1">Trip</label>
              <select
                value={estTrip}
                onChange={(e) => setEstTrip(e.target.value)}
                className="w-full bg-[#0F1420] border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
              >
                <option>Return same day</option>
                <option>One way</option>
                <option>Multi-leg</option>
              </select>
            </div>
          </div>

          {/* Pricing Table */}
          <div className="bg-[#141C2E] border border-white/10 rounded-xl overflow-hidden shadow-lg">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-gray-400 font-medium bg-[#101726]">
                  <th className="py-3.5 px-5">Category</th>
                  <th className="py-3.5 px-5">Seats</th>
                  <th className="py-3.5 px-5">Flying time each way</th>
                  <th className="py-3.5 px-5 text-right">Estimated range, return, all-in</th>
                  <th className="py-3.5 px-5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { cat: "Light jet", seats: "4–7", time: "≈ 1 h 05", range: "$ 9,000 – 12,500" },
                  { cat: "Midsize", seats: "7–8", time: "≈ 1 h 00", range: "$ 12,000 – 16,000" },
                  { cat: "Super-midsize", seats: "8–9", time: "≈ 1 h 00", range: "$ 15,000 – 20,000" },
                  { cat: "Heavy jet", seats: "10–14", time: "≈ 1 h 00", range: "$ 22,000 – 30,000" },
                ].map((row) => (
                  <tr key={row.cat} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-5 font-bold text-white">{row.cat}</td>
                    <td className="py-4 px-5 text-gray-300 font-mono text-xs">{row.seats}</td>
                    <td className="py-4 px-5 text-gray-300 text-xs">{row.time}</td>
                    <td className="py-4 px-5 text-right font-mono font-bold text-white text-sm">
                      {row.range}
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleSelectEstimateCategory(row.cat)}
                        className="text-[#C9A052] hover:text-[#e0b769] hover:underline font-semibold text-xs transition-colors"
                      >
                        Request this
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Two Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* How the range is built */}
            <div className="bg-[#141C2E] border border-white/10 rounded-xl p-5 space-y-2">
              <h3 className="text-sm font-bold text-white">How the range is built</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Hourly rates by category from OrbAero&apos;s rate table (updated monthly from real quotes) × flying time both ways, plus typical positioning, landing, handling and waiting fees, plus your margin and OrbAero&apos;s fee. December peak season adds 10–20 %. Ranges shown are placeholders until the rate table is filled.
              </p>
            </div>

            {/* Share via WhatsApp */}
            <div className="bg-[#141C2E] border border-white/10 rounded-xl p-5 space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-2">Share</h3>
                <p className="text-xs text-gray-300 italic bg-[#0F1420] border border-white/10 rounded-lg p-3">
                  Send as text: &quot;Lagos–Abuja return, 4 pax, light jet from about $9,000. Shall I get you a firm offer?&quot;
                </p>
              </div>
              <button
                onClick={handleCopyWhatsApp}
                className="w-full py-2.5 bg-[#C9A052] hover:bg-[#b88f42] text-[#0F1420] font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {copiedWhatsApp ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-black" />
                    <span>Copied for WhatsApp!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy for WhatsApp</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500 pt-2">
            Each estimate uses no tokens. Turning it into a request uses 1 token, as usual.
          </p>
        </div>
      ) : (
        /* =========================================================================
            WIZARD VIEW (STEPS 1 - 6)
           ========================================================================= */
        <div className="flex gap-0 min-h-[calc(100vh-100px)] -mx-6 -mt-2">
          {/* Left sidebar steps */}
          <div className="w-56 bg-[#0A0F1A] border-r border-white/10 py-8 px-4 flex-shrink-0">
            <div className="space-y-1">
              {STEPS.map((s) => {
                const isDone = s.num < step;
                const isActive = s.num === step;
                return (
                  <button
                    key={s.num}
                    onClick={() => setStep(s.num)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-[#141C2E] text-white border-l-2 border-[#C9A052]"
                        : isDone
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-400"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isDone
                          ? "bg-emerald-500/20 text-emerald-400"
                          : isActive
                          ? "bg-[#C9A052] text-[#0F1420]"
                          : "bg-white/10 text-gray-500"
                      }`}
                    >
                      {isDone ? "✓" : s.num}
                    </span>
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-8 overflow-y-auto">
            {/* STEP 1: CLIENT */}
            {step === 1 && (
              <div className="max-w-xl space-y-4">
                <h1 className="text-2xl font-bold text-white mb-6">Client details</h1>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Company / Entity</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-[#141C2E] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Authorized Contact</label>
                  <input
                    type="text"
                    value={clientContact}
                    onChange={(e) => setClientContact(e.target.value)}
                    className="w-full bg-[#141C2E] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Email</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full bg-[#141C2E] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: ROUTE & DATES */}
            {step === 2 && (
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Route & dates</h1>
                <p className="text-sm text-gray-400 mb-6">
                  Estimate uses no tokens. Submitting to desk uses 1 token per leg.
                </p>

                {/* Trip Type Selector */}
                <div className="flex items-center gap-2 mb-6">
                  {(["round_trip", "one_way", "multi_leg"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTripType(t)}
                      className={`px-4 py-2 rounded text-xs font-semibold transition-colors ${
                        tripType === t
                          ? "bg-[#C9A052] text-[#0F1420]"
                          : "bg-[#141C2E] text-gray-300 hover:text-white border border-white/10"
                      }`}
                    >
                      {t === "round_trip" ? "Round trip" : t === "one_way" ? "One way" : "Multi-leg"}
                    </button>
                  ))}
                </div>

                {/* Leg 1 */}
                <div className="bg-[#141C2E] border border-white/10 rounded-lg p-5 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Leg 1</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">From</label>
                      <AirportSearchSelect
                        value={leg1From}
                        onChange={setLeg1From}
                        placeholder="Search departure..."
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">To</label>
                      <AirportSearchSelect
                        value={leg1To}
                        onChange={setLeg1To}
                        placeholder="Search destination..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Date</label>
                      <input
                        type="date"
                        value={leg1Date}
                        onChange={(e) => setLeg1Date(e.target.value)}
                        className="w-full bg-[#0F1420] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Depart (LT)</label>
                      <input
                        type="time"
                        value={leg1Time}
                        onChange={(e) => setLeg1Time(e.target.value)}
                        className="w-full bg-[#0F1420] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Passengers</label>
                      <input
                        type="number"
                        value={leg1Pax}
                        onChange={(e) => setLeg1Pax(Number(e.target.value))}
                        min={1}
                        max={20}
                        className="w-full bg-[#0F1420] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Flexible</label>
                      <select
                        value={leg1Flex}
                        onChange={(e) => setLeg1Flex(e.target.value)}
                        className="w-full bg-[#0F1420] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                      >
                        {FLEXIBLE_OPTIONS.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Leg 2 (Round trip return) */}
                {tripType === "round_trip" && (
                  <div className="bg-[#141C2E] border border-white/10 rounded-lg p-5 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-white">Leg 2 · Return</h3>
                      <span className="text-xs text-gray-500">Departure locked to leg 1 arrival</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">From</label>
                        <div className="bg-[#0A0F1A] border border-white/10 rounded px-3 py-2.5 text-sm text-gray-400">
                          {leg1To} · {getAirportLabel(leg1To)}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">To</label>
                        <div className="bg-[#0A0F1A] border border-white/10 rounded px-3 py-2.5 text-sm text-gray-400">
                          {leg1From} · {getAirportLabel(leg1From)}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Date</label>
                        <input
                          type="date"
                          value={leg2Date}
                          onChange={(e) => setLeg2Date(e.target.value)}
                          className="w-full bg-[#0F1420] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Depart (LT)</label>
                        <input
                          type="time"
                          value={leg2Time}
                          onChange={(e) => setLeg2Time(e.target.value)}
                          className="w-full bg-[#0F1420] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Passengers</label>
                        <input
                          type="number"
                          value={leg2Pax}
                          onChange={(e) => setLeg2Pax(Number(e.target.value))}
                          min={1}
                          max={20}
                          className="w-full bg-[#0F1420] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Flexible</label>
                        <select
                          value={leg2Flex}
                          onChange={(e) => setLeg2Flex(e.target.value)}
                          className="w-full bg-[#0F1420] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                        >
                          {FLEXIBLE_OPTIONS.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Multi-leg */}
                {tripType === "multi_leg" &&
                  multiLegs.map((leg, idx) => (
                    <div key={idx} className="bg-[#141C2E] border border-white/10 rounded-lg p-5 mb-4">
                      <h3 className="text-sm font-semibold text-white mb-4">Leg {idx + 1}</h3>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">From</label>
                          <AirportSearchSelect
                            value={leg.originIcao}
                            onChange={(code) => {
                              const updated = [...multiLegs];
                              updated[idx] = { ...updated[idx], originIcao: code };
                              setMultiLegs(updated);
                            }}
                            placeholder="Origin..."
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">To</label>
                          <AirportSearchSelect
                            value={leg.destIcao}
                            onChange={(code) => {
                              const updated = [...multiLegs];
                              updated[idx] = { ...updated[idx], destIcao: code };
                              setMultiLegs(updated);
                            }}
                            placeholder="Destination..."
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Date</label>
                          <input
                            type="date"
                            value={leg.flightDate}
                            onChange={(e) => {
                              const u = [...multiLegs];
                              u[idx] = { ...u[idx], flightDate: e.target.value };
                              setMultiLegs(u);
                            }}
                            className="w-full bg-[#0F1420] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Depart (LT)</label>
                          <input
                            type="time"
                            value={leg.departureTime || ""}
                            onChange={(e) => {
                              const u = [...multiLegs];
                              u[idx] = { ...u[idx], departureTime: e.target.value };
                              setMultiLegs(u);
                            }}
                            className="w-full bg-[#0F1420] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                {tripType === "multi_leg" && (
                  <button
                    onClick={() =>
                      setMultiLegs([
                        ...multiLegs,
                        { originIcao: "", destIcao: "", flightDate: leg1Date, departureTime: "10:00" },
                      ])
                    }
                    className="text-sm text-[#C9A052] hover:underline"
                  >
                    + Add leg
                  </button>
                )}
              </div>
            )}

            {/* STEP 3: AIRCRAFT */}
            {step === 3 && (
              <div>
                <h1 className="text-2xl font-bold text-white mb-6">Which aircraft category?</h1>
                <div className="grid grid-cols-2 gap-3 max-w-2xl">
                  {["Very Light Jet", "Light Jet", "Midsize Jet", "Super Midsize Jet", "Heavy Jet", "Ultra Long Range"].map(
                    (cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryPreference(cat)}
                        className={`p-4 rounded-lg border text-left transition-colors ${
                          categoryPreference === cat
                            ? "border-[#C9A052] bg-[#1A2338] text-white"
                            : "border-white/10 bg-[#141C2E] text-gray-300 hover:border-white/30"
                        }`}
                      >
                        <p className="font-semibold text-sm">{cat}</p>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: PASSENGERS, LUGGAGE, PETS (Screen 5) */}
            {step === 4 && (
              <div>
                <h1 className="text-2xl font-bold text-white mb-6">Passengers, luggage, pets</h1>
                <div className="space-y-6 max-w-xl">
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Suitcases</label>
                    <input
                      type="number"
                      value={suitcases}
                      onChange={(e) => setSuitcases(Number(e.target.value))}
                      min={0}
                      max={50}
                      className="w-full bg-[#141C2E] border border-white/20 rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  {/* Pets Subsection (Screen 5) */}
                  <div className="bg-[#141C2E] border border-white/10 rounded-lg p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={hasPets}
                        onChange={(e) => setHasPets(e.target.checked)}
                        id="pets"
                        className="w-4 h-4 accent-[#C9A052] rounded"
                      />
                      <label htmlFor="pets" className="text-sm font-semibold text-white cursor-pointer">
                        Travelling with pets
                      </label>
                    </div>

                    {hasPets && (
                      <div className="pt-3 border-t border-white/10 space-y-4">
                        <p className="text-xs text-[#C9A052] font-medium">Pet Details (In-Cabin & Manifest Requirements)</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Number of pets</label>
                            <input
                              type="number"
                              min={1}
                              value={petCount}
                              onChange={(e) => setPetCount(Math.max(1, Number(e.target.value)))}
                              className="w-full bg-[#0F1420] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Pet weight (kg)</label>
                            <input
                              type="number"
                              min={1}
                              value={petWeight}
                              onChange={(e) => setPetWeight(Math.max(1, Number(e.target.value)))}
                              className="w-full bg-[#0F1420] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Breed / Animal type</label>
                            <input
                              type="text"
                              value={petBreed}
                              onChange={(e) => setPetBreed(e.target.value)}
                              placeholder="e.g. French Bulldog"
                              className="w-full bg-[#0F1420] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Special pet instructions / notes</label>
                          <input
                            type="text"
                            value={petNotes}
                            onChange={(e) => setPetNotes(e.target.value)}
                            placeholder="e.g. Soft carrier under 8kg, pet passport up to date"
                            className="w-full bg-[#0F1420] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: SERVICES - GROUND & HELI TRANSPORTATION (Screen 6) */}
            {step === 5 && (
              <div>
                <h1 className="text-2xl font-bold text-white mb-6">Services</h1>
                <div className="space-y-6 max-w-2xl">
                  {/* GROUND TRANSPORTATION (Screen 6) */}
                  <div className="bg-[#141C2E] border border-white/10 rounded-lg p-5 space-y-4">
                    <h3 className="text-xs font-bold text-[#C9A052] uppercase tracking-wider">GROUND TRANSPORTATION</h3>
                    <p className="text-sm font-medium text-white">Would you like to add ground transportation?</p>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-200">
                        <input
                          type="radio"
                          name="groundTransportChoice"
                          checked={groundRequired}
                          onChange={() => setGroundRequired(true)}
                          className="accent-[#C9A052]"
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-200">
                        <input
                          type="radio"
                          name="groundTransportChoice"
                          checked={!groundRequired}
                          onChange={() => setGroundRequired(false)}
                          className="accent-[#C9A052]"
                        />
                        <span>No</span>
                      </label>
                    </div>

                    {groundRequired && (
                      <div className="pt-4 border-t border-white/10 space-y-5">
                        <div>
                          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide block mb-2">
                            Transfer Requirements · Flight Leg
                          </label>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-200">
                            {["Leg 1", "Leg 2", "Leg 3"].map((legOption) => (
                              <label key={legOption} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={groundLegs.includes(legOption)}
                                  onChange={(e) => {
                                    if (e.target.checked) setGroundLegs([...groundLegs, legOption]);
                                    else setGroundLegs(groundLegs.filter((l) => l !== legOption));
                                  }}
                                  className="accent-[#C9A052] rounded"
                                />
                                <span>{legOption}</span>
                              </label>
                            ))}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">Other:</span>
                              <input
                                type="text"
                                value={groundLegOther}
                                onChange={(e) => setGroundLegOther(e.target.value)}
                                placeholder="Custom leg..."
                                className="bg-[#0F1420] border border-white/20 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#C9A052] w-28"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 1. On Arrival */}
                        <div className="bg-[#0F1420] border border-white/10 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white">1. On Arrival</span>
                            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={groundArrivalRequired}
                                onChange={(e) => setGroundArrivalRequired(e.target.checked)}
                                className="accent-[#C9A052] rounded"
                              />
                              <span>Required</span>
                            </label>
                          </div>
                          {groundArrivalRequired && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              <div>
                                <label className="text-xs text-gray-400 block mb-1">Drop-off Location</label>
                                <input
                                  type="text"
                                  value={groundArrivalDropoff}
                                  onChange={(e) => setGroundArrivalDropoff(e.target.value)}
                                  placeholder="Hotel, villa, or address"
                                  className="w-full bg-[#141C2E] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-400 block mb-1">Vehicle Preference</label>
                                <div className="grid grid-cols-4 gap-1.5">
                                  {(["Sedan", "SUV", "Van", "Luxury"] as const).map((v) => (
                                    <button
                                      key={v}
                                      type="button"
                                      onClick={() => setGroundArrivalVehicle(v)}
                                      className={`py-1.5 px-2 text-xs font-medium rounded border transition-colors ${
                                        groundArrivalVehicle === v
                                          ? "bg-[#C9A052] text-[#0F1420] border-[#C9A052] font-bold"
                                          : "bg-[#141C2E] text-gray-300 border-white/10 hover:border-white/30"
                                      }`}
                                    >
                                      {v}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 2. On Departure */}
                        <div className="bg-[#0F1420] border border-white/10 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white">2. On Departure</span>
                            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={groundDepartureRequired}
                                onChange={(e) => setGroundDepartureRequired(e.target.checked)}
                                className="accent-[#C9A052] rounded"
                              />
                              <span>Required</span>
                            </label>
                          </div>
                          {groundDepartureRequired && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              <div>
                                <label className="text-xs text-gray-400 block mb-1">Pick-up Location</label>
                                <input
                                  type="text"
                                  value={groundDeparturePickup}
                                  onChange={(e) => setGroundDeparturePickup(e.target.value)}
                                  placeholder="Origin address or hotel"
                                  className="w-full bg-[#141C2E] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-400 block mb-1">Vehicle Preference</label>
                                <div className="grid grid-cols-4 gap-1.5">
                                  {(["Sedan", "SUV", "Van", "Luxury"] as const).map((v) => (
                                    <button
                                      key={v}
                                      type="button"
                                      onClick={() => setGroundDepartureVehicle(v)}
                                      className={`py-1.5 px-2 text-xs font-medium rounded border transition-colors ${
                                        groundDepartureVehicle === v
                                          ? "bg-[#C9A052] text-[#0F1420] border-[#C9A052] font-bold"
                                          : "bg-[#141C2E] text-gray-300 border-white/10 hover:border-white/30"
                                      }`}
                                    >
                                      {v}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 3. Additional Requirements */}
                        <div className="bg-[#0F1420] border border-white/10 rounded-lg p-4 space-y-3">
                          <span className="text-sm font-bold text-white block">3. Additional Requirements</span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs text-gray-400 block mb-1">Number of Passengers</label>
                              <input
                                type="number"
                                min={1}
                                value={groundPassengers}
                                onChange={(e) => setGroundPassengers(Number(e.target.value))}
                                className="w-full bg-[#141C2E] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-xs text-gray-400 block mb-1">Special Requests / Instructions</label>
                              <input
                                type="text"
                                value={groundInstructions}
                                onChange={(e) => setGroundInstructions(e.target.value)}
                                placeholder="Child seats, meet & greet at luggage carousel..."
                                className="w-full bg-[#141C2E] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Additional transfers */}
                        {extraGroundTransfers.map((xfr, i) => (
                          <div key={i} className="bg-[#0F1420] border border-white/10 rounded-lg p-3 text-xs space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-[#C9A052]">Additional Transfer #{i + 2}</span>
                              <button
                                type="button"
                                onClick={() => setExtraGroundTransfers(extraGroundTransfers.filter((_, idx) => idx !== i))}
                                className="text-red-400 hover:text-red-300"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Route / Pickup / Dropoff"
                                value={xfr.route}
                                onChange={(e) => {
                                  const u = [...extraGroundTransfers];
                                  u[i].route = e.target.value;
                                  setExtraGroundTransfers(u);
                                }}
                                className="bg-[#141C2E] border border-white/20 rounded px-2.5 py-1.5 text-xs text-white"
                              />
                              <input
                                type="text"
                                placeholder="Vehicle & Pax notes"
                                value={xfr.notes}
                                onChange={(e) => {
                                  const u = [...extraGroundTransfers];
                                  u[i].notes = e.target.value;
                                  setExtraGroundTransfers(u);
                                }}
                                className="bg-[#141C2E] border border-white/20 rounded px-2.5 py-1.5 text-xs text-white"
                              />
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => setExtraGroundTransfers([...extraGroundTransfers, { route: "", notes: "" }])}
                          className="text-xs text-[#C9A052] hover:underline font-semibold flex items-center gap-1"
                        >
                          + Add Another Transfer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* HELICOPTER TRANSFER (Screen 6) */}
                  <div className="bg-[#141C2E] border border-white/10 rounded-lg p-5 space-y-4">
                    <h3 className="text-xs font-bold text-[#C9A052] uppercase tracking-wider">HELICOPTER TRANSFER</h3>
                    <p className="text-sm font-medium text-white">Would you like to add helicopter transfer?</p>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-200">
                        <input
                          type="radio"
                          name="heliTransportChoice"
                          checked={heliRequired}
                          onChange={() => setHeliRequired(true)}
                          className="accent-[#C9A052]"
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-200">
                        <input
                          type="radio"
                          name="heliTransportChoice"
                          checked={!heliRequired}
                          onChange={() => setHeliRequired(false)}
                          className="accent-[#C9A052]"
                        />
                        <span>No</span>
                      </label>
                    </div>

                    {heliRequired && (
                      <div className="pt-4 border-t border-white/10 space-y-5">
                        <div>
                          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide block mb-2">
                            Transfer Requirements · Flight Leg
                          </label>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-200">
                            {["Leg 1", "Leg 2", "Leg 3"].map((legOption) => (
                              <label key={legOption} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={heliLegs.includes(legOption)}
                                  onChange={(e) => {
                                    if (e.target.checked) setHeliLegs([...heliLegs, legOption]);
                                    else setHeliLegs(heliLegs.filter((l) => l !== legOption));
                                  }}
                                  className="accent-[#C9A052] rounded"
                                />
                                <span>{legOption}</span>
                              </label>
                            ))}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">Other:</span>
                              <input
                                type="text"
                                value={heliLegOther}
                                onChange={(e) => setHeliLegOther(e.target.value)}
                                placeholder="Custom leg..."
                                className="bg-[#0F1420] border border-white/20 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#C9A052] w-28"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 1. On Arrival Heliport */}
                        <div className="bg-[#0F1420] border border-white/10 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white">1. On Arrival Heliport</span>
                            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={heliArrivalRequired}
                                onChange={(e) => setHeliArrivalRequired(e.target.checked)}
                                className="accent-[#C9A052] rounded"
                              />
                              <span>Required</span>
                            </label>
                          </div>
                          {heliArrivalRequired && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              <div>
                                <label className="text-xs text-gray-400 block mb-1">Drop-off Heliport / Destination</label>
                                <input
                                  type="text"
                                  value={heliArrivalDropoff}
                                  onChange={(e) => setHeliArrivalDropoff(e.target.value)}
                                  placeholder="e.g. Monaco Heliport (LNMC) or private pad"
                                  className="w-full bg-[#141C2E] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-400 block mb-1">Helicopter Type / Preference</label>
                                <select
                                  value={heliArrivalPreference}
                                  onChange={(e) => setHeliArrivalPreference(e.target.value)}
                                  className="w-full bg-[#141C2E] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                                >
                                  <option>Twin Engine VIP (AW139 / EC155)</option>
                                  <option>Single Engine (Airbus H125 / EC130)</option>
                                  <option>Light Twin (Airbus H135 / H145)</option>
                                  <option>Luxury Custom Shuttle</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 2. On Departure Heliport */}
                        <div className="bg-[#0F1420] border border-white/10 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white">2. On Departure Heliport</span>
                            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={heliDepartureRequired}
                                onChange={(e) => setHeliDepartureRequired(e.target.checked)}
                                className="accent-[#C9A052] rounded"
                              />
                              <span>Required</span>
                            </label>
                          </div>
                          {heliDepartureRequired && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              <div>
                                <label className="text-xs text-gray-400 block mb-1">Pick-up Heliport / Location</label>
                                <input
                                  type="text"
                                  value={heliDeparturePickup}
                                  onChange={(e) => setHeliDeparturePickup(e.target.value)}
                                  placeholder="e.g. Battersea Heliport (EGLW)"
                                  className="w-full bg-[#141C2E] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-400 block mb-1">Helicopter Type / Preference</label>
                                <select
                                  value={heliDeparturePreference}
                                  onChange={(e) => setHeliDeparturePreference(e.target.value)}
                                  className="w-full bg-[#141C2E] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                                >
                                  <option>Twin Engine VIP (AW139 / EC155)</option>
                                  <option>Single Engine (Airbus H125 / EC130)</option>
                                  <option>Light Twin (Airbus H135 / H145)</option>
                                  <option>Luxury Custom Shuttle</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 3. Additional Requirements */}
                        <div className="bg-[#0F1420] border border-white/10 rounded-lg p-4 space-y-3">
                          <span className="text-sm font-bold text-white block">3. Additional Requirements</span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs text-gray-400 block mb-1">Number of Passengers</label>
                              <input
                                type="number"
                                min={1}
                                value={heliPassengers}
                                onChange={(e) => setHeliPassengers(Number(e.target.value))}
                                className="w-full bg-[#141C2E] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-xs text-gray-400 block mb-1">Special Requests / Helipad Instructions</label>
                              <input
                                type="text"
                                value={heliInstructions}
                                onChange={(e) => setHeliInstructions(e.target.value)}
                                placeholder="Luggage volume restrictions, yacht helipad landing permit..."
                                className="w-full bg-[#141C2E] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Additional heli transfers */}
                        {extraHeliTransfers.map((hx, i) => (
                          <div key={i} className="bg-[#0F1420] border border-white/10 rounded-lg p-3 text-xs space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-[#C9A052]">Additional Heli Transfer #{i + 2}</span>
                              <button
                                type="button"
                                onClick={() => setExtraHeliTransfers(extraHeliTransfers.filter((_, idx) => idx !== i))}
                                className="text-red-400 hover:text-red-300"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Heliport route / Coordinates"
                                value={hx.route}
                                onChange={(e) => {
                                  const u = [...extraHeliTransfers];
                                  u[i].route = e.target.value;
                                  setExtraHeliTransfers(u);
                                }}
                                className="bg-[#141C2E] border border-white/20 rounded px-2.5 py-1.5 text-xs text-white"
                              />
                              <input
                                type="text"
                                placeholder="Heli type & instructions"
                                value={hx.notes}
                                onChange={(e) => {
                                  const u = [...extraHeliTransfers];
                                  u[i].notes = e.target.value;
                                  setExtraHeliTransfers(u);
                                }}
                                className="bg-[#141C2E] border border-white/20 rounded px-2.5 py-1.5 text-xs text-white"
                              />
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => setExtraHeliTransfers([...extraHeliTransfers, { route: "", notes: "" }])}
                          className="text-xs text-[#C9A052] hover:underline font-semibold flex items-center gap-1"
                        >
                          + Add Another Heli Transfer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CATERING & SPECIAL REQUESTS */}
                  <div className="bg-[#141C2E] border border-white/10 rounded-lg p-5 space-y-3">
                    <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">
                      Catering / Special In-Flight Requests
                    </label>
                    <textarea
                      value={catering}
                      onChange={(e) => setCatering(e.target.value)}
                      className="w-full bg-[#0F1420] border border-white/20 rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A052] h-24 resize-none"
                      placeholder="VIP catering menu, Halal/Kosher, dietary allergies, champagne preference..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: MARGIN & SEND */}
            {step === 6 && (
              <div>
                <h1 className="text-2xl font-bold text-white mb-6">Margin & send</h1>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Your margin (%)</label>
                    <input
                      type="number"
                      value={agentMarginPct}
                      onChange={(e) => setAgentMarginPct(Number(e.target.value))}
                      min={0}
                      max={30}
                      step={0.5}
                      className="w-full bg-[#141C2E] border border-white/20 rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This margin is added on top of the net price. It is never shown to the client.
                    </p>
                  </div>
                  <div className="bg-[#141C2E] border border-white/10 rounded-lg p-4">
                    <p className="text-sm text-gray-300 mb-2">
                      Submitting this request costs <span className="text-[#C9A052] font-bold">1 token</span>.
                    </p>
                    <p className="text-xs text-gray-500">Current balance: {tokenBalance} tokens</p>
                  </div>
                  {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || tokenBalance < 1}
                    className="w-full py-3 bg-[#C9A052] text-[#0F1420] font-bold rounded hover:bg-[#B88F42] disabled:opacity-50 transition-colors shadow-lg"
                  >
                    {isSubmitting ? "Submitting..." : "Submit request · 1 token"}
                  </button>
                </div>
              </div>
            )}

            {/* Back / Next */}
            <div className="flex items-center gap-3 mt-8">
              {canGoPrev && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-5 py-2.5 bg-[#141C2E] border border-white/20 text-white text-sm font-medium rounded hover:bg-[#1A2338] transition-colors"
                >
                  Back
                </button>
              )}
              {canGoNext && (
                <button
                  onClick={() => setStep(step + 1)}
                  className="px-5 py-2.5 bg-[#C9A052] text-[#0F1420] text-sm font-bold rounded hover:bg-[#B88F42] transition-colors"
                >
                  Next: {STEPS[step]?.label || "continue"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import AirportSearchSelect from "@/components/common/AirportSearchSelect";
import { TripType, RequestLegItem } from "@/types/aviation";
import { CheckCircle2 } from "lucide-react";

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
    agentRequests,
    bookings,
  } = useAviation();

  const [step, setStep] = useState(2); // Start at step 2 (Route & dates) per screenshot
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

  // Step 3
  const [categoryPreference, setCategoryPreference] = useState("Super Midsize Jet");

  // Step 4
  const [suitcases, setSuitcases] = useState(3);
  const [hasPets, setHasPets] = useState(false);

  // Step 5
  const [limousine, setLimousine] = useState(false);
  const [catering, setCatering] = useState("");

  // Step 6
  const [agentMarginPct, setAgentMarginPct] = useState(8);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Rough estimate based on route
  const roughEstimateLow = 78000;
  const roughEstimateHigh = 118000;

  const getAirportLabel = (icao: string) => {
    const labels: Record<string, string> = {
      DNMM: "Lagos Murtala Muhammed",
      EGLF: "London Farnborough",
      LSGG: "Geneva",
      LFPB: "Paris Le Bourget",
      LIML: "Milan Linate",
      LEIB: "Ibiza",
    };
    return labels[icao] || icao;
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
      limousineService: limousine,
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
    <div className="flex gap-0 min-h-[calc(100vh-56px)] -mx-6 -mt-8">
      {/* Left sidebar steps */}
      <div className="w-56 bg-[#0A0F1A] border-r border-white/10 py-8 px-4 flex-shrink-0">
        <div className="space-y-1">
          {STEPS.map((s) => {
            const isDone = s.num < step;
            const isActive = s.num === step;
            return (
              <button
                key={s.num}
                onClick={() => isDone && setStep(s.num)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  isActive
                    ? "bg-[#1A2338] text-white font-semibold"
                    : isDone
                    ? "text-gray-400 hover:text-white cursor-pointer"
                    : "text-gray-600 cursor-default"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                ) : (
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isActive
                        ? "bg-[#C9A052] text-[#0F1420]"
                        : "bg-white/10 text-gray-500"
                    }`}
                  >
                    {s.num}
                  </span>
                )}
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex gap-6 px-8 py-8 overflow-auto">
        {/* Form area */}
        <div className="flex-1 min-w-0">
          {/* Step header */}
          <p className="text-xs text-gray-500 mb-1">
            Step {step} of {STEPS.length} · {clientName}
          </p>

          {/* STEP 1: CLIENT */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-6">Who is the client?</h1>
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Client / Company name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-[#141C2E] border border-white/20 rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                    placeholder="Adeyemi Holdings Ltd"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Contact person</label>
                  <input
                    type="text"
                    value={clientContact}
                    onChange={(e) => setClientContact(e.target.value)}
                    className="w-full bg-[#141C2E] border border-white/20 rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                    placeholder="T. Adeyemi"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Email</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full bg-[#141C2E] border border-white/20 rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ROUTE & DATES */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-6">Where and when?</h1>

              {/* Trip type tabs */}
              <div className="flex items-center gap-1 mb-6 border border-white/20 rounded-lg p-1 w-fit">
                {(["one_way", "round_trip", "multi_leg"] as TripType[]).map((t) => {
                  const labels: Record<TripType, string> = {
                    one_way: "One-way",
                    round_trip: "Round trip",
                    multi_leg: "Multi-leg",
                  };
                  return (
                    <button
                      key={t}
                      onClick={() => setTripType(t)}
                      className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                        tripType === t
                          ? "bg-[#C9A052] text-[#0F1420] font-bold"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {labels[t]}
                    </button>
                  );
                })}
              </div>

              {/* Leg 1 */}
              <div className="bg-[#141C2E] border border-white/10 rounded-lg p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">
                    Leg 1 · Outbound
                  </h3>
                  <span className="text-xs text-gray-400">≈ 6 h 18 m block</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">From</label>
                    <AirportSearchSelect
                      value={leg1From}
                      onChange={(code) => setLeg1From(code)}
                      placeholder="Origin airport..."
                      
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {getAirportLabel(leg1From)}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">FBO: choose later or let the desk pick</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">To</label>
                    <AirportSearchSelect
                      value={leg1To}
                      onChange={(code) => setLeg1To(code)}
                      placeholder="Destination airport..."
                      
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {getAirportLabel(leg1To)}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">Private-only airport · H24 not available</p>
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
                      {FLEXIBLE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
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
                        {FLEXIBLE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Multi-leg additional legs */}
              {tripType === "multi_leg" && multiLegs.map((leg, idx) => (
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
                      <input type="date" value={leg.flightDate}
                        onChange={(e) => { const u = [...multiLegs]; u[idx] = { ...u[idx], flightDate: e.target.value }; setMultiLegs(u); }}
                        className="w-full bg-[#0F1420] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Depart (LT)</label>
                      <input type="time" value={leg.departureTime || ""}
                        onChange={(e) => { const u = [...multiLegs]; u[idx] = { ...u[idx], departureTime: e.target.value }; setMultiLegs(u); }}
                        className="w-full bg-[#0F1420] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A052]" />
                    </div>
                  </div>
                </div>
              ))}
              {tripType === "multi_leg" && (
                <button
                  onClick={() => setMultiLegs([...multiLegs, { originIcao: "", destIcao: "", flightDate: leg1Date, departureTime: "10:00" }])}
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
                {["Very Light Jet", "Light Jet", "Midsize Jet", "Super Midsize Jet", "Heavy Jet", "Ultra Long Range"].map((cat) => (
                  <button key={cat} onClick={() => setCategoryPreference(cat)}
                    className={`p-4 rounded-lg border text-left transition-colors ${categoryPreference === cat ? "border-[#C9A052] bg-[#1A2338] text-white" : "border-white/10 bg-[#141C2E] text-gray-300 hover:border-white/30"}`}>
                    <p className="font-semibold text-sm">{cat}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: PASSENGERS */}
          {step === 4 && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-6">Passengers, luggage, pets</h1>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Suitcases</label>
                  <input type="number" value={suitcases} onChange={(e) => setSuitcases(Number(e.target.value))} min={0} max={50}
                    className="w-full bg-[#141C2E] border border-white/20 rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A052]" />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={hasPets} onChange={(e) => setHasPets(e.target.checked)} id="pets" className="accent-[#C9A052]" />
                  <label htmlFor="pets" className="text-sm text-gray-300">Travelling with pets</label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: SERVICES */}
          {step === 5 && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-6">Services</h1>
              <div className="space-y-4 max-w-md">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={limousine} onChange={(e) => setLimousine(e.target.checked)} id="limo" className="accent-[#C9A052]" />
                  <label htmlFor="limo" className="text-sm text-gray-300">Limousine / ground transfer</label>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Catering / special requests</label>
                  <textarea value={catering} onChange={(e) => setCatering(e.target.value)}
                    className="w-full bg-[#141C2E] border border-white/20 rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A052] h-24 resize-none"
                    placeholder="VIP catering, dietary requirements..." />
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
                  <input type="number" value={agentMarginPct} onChange={(e) => setAgentMarginPct(Number(e.target.value))} min={0} max={30} step={0.5}
                    className="w-full bg-[#141C2E] border border-white/20 rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A052]" />
                  <p className="text-xs text-gray-500 mt-1">This margin is added on top of the net price. It is never shown to the client.</p>
                </div>
                <div className="bg-[#141C2E] border border-white/10 rounded-lg p-4">
                  <p className="text-sm text-gray-300 mb-2">Submitting this request costs <span className="text-[#C9A052] font-bold">1 token</span>.</p>
                  <p className="text-xs text-gray-500">Current balance: {tokenBalance} tokens</p>
                </div>
                {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}
                <button onClick={handleSubmit} disabled={isSubmitting || tokenBalance < 1}
                  className="w-full py-3 bg-[#C9A052] text-[#0F1420] font-bold rounded hover:bg-[#B88F42] disabled:opacity-50 transition-colors">
                  {isSubmitting ? "Submitting..." : "Submit request · 1 token"}
                </button>
              </div>
            </div>
          )}

          {/* Back / Next */}
          <div className="flex items-center gap-3 mt-8">
            {canGoPrev && (
              <button onClick={() => setStep(step - 1)}
                className="px-5 py-2.5 bg-[#141C2E] border border-white/20 text-white text-sm font-medium rounded hover:bg-[#1A2338] transition-colors">
                Back
              </button>
            )}
            {canGoNext && (
              <button onClick={() => setStep(step + 1)}
                className="px-5 py-2.5 bg-[#C9A052] text-[#0F1420] text-sm font-bold rounded hover:bg-[#B88F42] transition-colors">
                Next: {STEPS[step]?.label || "continue"}
              </button>
            )}
          </div>
        </div>

        {/* Right: Request ticket + Rough estimate */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {/* Request Ticket - Cream / off-white paper card */}
          <div className="bg-[#FAF7F0] text-[#0F1420] rounded-xl p-5 shadow-sm font-sans">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs uppercase tracking-wider font-mono text-[#0F1420]">
                REQUEST TICKET
              </span>
              <span className="text-gray-500 font-mono text-xs">draft</span>
            </div>
            <p className="text-gray-600 text-xs mb-4 leading-relaxed">
              The desk copies this, in this order, into the marketplace.
            </p>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-gray-500 w-24 flex-shrink-0">Client</span>
                <span className="font-semibold text-right text-[#0F1420] truncate">
                  {clientName.replace(" Ltd", "")} · {clientContact}
                </span>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-gray-500 w-14 flex-shrink-0">Leg 1</span>
                <span className="text-right text-[#0F1420] truncate">
                  {leg1From} → {leg1To} · 05 Dec 09:00 ±2h · {leg1Pax}
                </span>
              </div>
              {tripType === "round_trip" && (
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-gray-500 w-14 flex-shrink-0">Leg 2</span>
                  <span className="text-right text-[#0F1420] truncate">
                    {leg1To} → {leg1From} · 12 Dec 16:00 · {leg2Pax}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-gray-500 w-20 flex-shrink-0">Category</span>
                <span className="text-gray-600">step 3</span>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-gray-500 w-24 flex-shrink-0">Luggage / pets</span>
                <span className="text-gray-600">step 4</span>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-gray-500 w-20 flex-shrink-0">Services</span>
                <span className="text-gray-600">step 5</span>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-gray-500 w-24 flex-shrink-0">Agent margin</span>
                <span className="text-gray-600">step 6</span>
              </div>
            </div>
          </div>

          {/* Rough Estimate - Dark card */}
          <div className="bg-[#141C2E] border border-white/10 rounded-xl p-5">
            <h3 className="font-semibold text-sm text-white mb-1">Rough estimate</h3>
            <p className="text-gray-400 text-xs mb-3 leading-relaxed">
              Market average for this route. Pick a category to narrow it.
            </p>
            <p className="text-2xl font-bold text-[#FFB84D] font-mono mb-2">
              € 78k – 118k
            </p>
            <p className="text-gray-400 text-xs">
              Free to view. Submitting uses 1 token.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

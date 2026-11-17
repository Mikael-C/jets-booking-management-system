"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import AirportSearchSelect from "@/components/common/AirportSearchSelect";
import { TripType, RequestLegItem } from "@/types/aviation";
import { formatCurrency } from "@/lib/pricingCalculator";
import {
  Plane,
  Calendar,
  Users,
  Luggage,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Coins,
  Shield,
  Clock,
  Compass,
  Building
} from "lucide-react";

export default function AgentRequestWizard() {
  const router = useRouter();
  const {
    addAgentRequest,
    currentUser,
    tokenBalance,
    checkAndSpendTokens,
    openTokenModal,
    settings
  } = useAviation();

  const [step, setStep] = useState<number>(1);
  const [tripType, setTripType] = useState<TripType>("round_trip");
  const [originIcao, setOriginIcao] = useState("LSGG");
  const [destIcao, setDestIcao] = useState("LFMN");
  const [flightDate, setFlightDate] = useState("2026-11-24");
  const [returnFlightDate, setReturnFlightDate] = useState("2026-11-30");
  const [departureTime, setDepartureTime] = useState("10:00");
  const [paxCount, setPaxCount] = useState<number>(4);
  const [categoryPreference, setCategoryPreference] = useState<string>("Super Midsize Jet");
  const [suitcases, setSuitcases] = useState<number>(4);
  const [hasPets, setHasPets] = useState<boolean>(false);
  const [petDetails, setPetDetails] = useState<string>("");
  const [cateringRequest, setCateringRequest] = useState<string>("VIP Champagne & Canapés");
  const [limousineTransfer, setLimousineTransfer] = useState<boolean>(true);
  const [clientName, setClientName] = useState("Bello Family Office");
  const [clientEmail, setClientEmail] = useState("office@bellogroup.com");
  const [budgetNotes, setBudgetNotes] = useState("Target budget: €28,000 – €35,000");

  // Multi-leg handling
  const [multiLegs, setMultiLegs] = useState<RequestLegItem[]>([
    { originIcao: "LSGG", destIcao: "LFMN", flightDate: "2026-11-24", departureTime: "10:00" },
    { originIcao: "LFMN", destIcao: "LIMJ", flightDate: "2026-11-26", departureTime: "14:00" }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const aircraftCategories = [
    { label: "Entry Level / Very Light Jet", seats: "4 seats", typical: "Citation Mustang, Phenom 100" },
    { label: "Light Jet", seats: "6–7 seats", typical: "Citation CJ3+, Nextant 400XTi" },
    { label: "Midsize Jet", seats: "7–8 seats", typical: "Hawker 800XP, Citation XLS+" },
    { label: "Super Midsize Jet", seats: "8–10 seats", typical: "Challenger 350, Citation Latitude" },
    { label: "Heavy Jet", seats: "10–14 seats", typical: "Challenger 605, Falcon 2000LXS" },
    { label: "Ultra Long Range", seats: "14–16 seats", typical: "Global 6000, Gulfstream G650" }
  ];

  // Submit Handler: Deducts 1 token per R-026
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage("");

    // Check token balance: 1 token cost
    const hasToken = await checkAndSpendTokens(
      "Submit Charter Request",
      1,
      `Request: ${originIcao} ${tripType === "round_trip" ? "⇄" : "→"} ${destIcao} (${clientName})`
    );

    if (!hasToken) {
      setIsSubmitting(false);
      openTokenModal();
      return;
    }

    const routeText = tripType === "multi_leg"
      ? multiLegs.map((l) => `${l.originIcao} → ${l.destIcao}`).join(" | ")
      : tripType === "round_trip"
      ? `${originIcao} ⇄ ${destIcao}`
      : `${originIcao} → ${destIcao}`;

    await addAgentRequest({
      type: "quote",
      title: `Charter Request: ${routeText} (${clientName})`,
      agentName: currentUser?.name || "Marcus Vance",
      agentEmail: currentUser?.email || "agent@orbelo.com",
      clientName,
      clientEmail,
      clientPhone: "+44 20 7946 0912",
      tripType,
      route: routeText,
      originIcao,
      destIcao,
      flightDate,
      returnFlightDate: tripType === "round_trip" ? returnFlightDate : undefined,
      departureTime,
      paxCount,
      aircraftPreference: categoryPreference,
      budgetNotes,
      specialRequests: `${cateringRequest} • ${limousineTransfer ? "Limousine requested" : "No ground transfer"} • ${hasPets ? `Pet: ${petDetails}` : "No pets"}`,
      luggageCount: suitcases,
      hasPets,
      multiLegs: tripType === "multi_leg" ? multiLegs : undefined,
      limousineService: limousineTransfer
    });

    setIsSubmitting(false);
    router.push("/agent/requests");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Wizard Header */}
      <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="pill blue font-mono text-[10px] uppercase font-bold">
              DIRECTION B · AGENT PORTAL
            </span>
            <span className="text-xs text-[var(--muted)]">6-Step Guided Charter Request Wizard</span>
          </div>
          <h2 className="text-xl font-bold font-display text-[var(--ink)] m-0">
            Submit Private Jet Request
          </h2>
        </div>

        {/* Token Balance Badge */}
        <div className="flex items-center gap-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg px-4 py-2 text-xs font-mono">
          <Coins className="w-4 h-4 text-[var(--amber)]" />
          <div>
            <span className="text-[var(--muted)] block text-[10px] uppercase">Token Balance</span>
            <span className="font-bold text-[var(--ink)]">{tokenBalance} Available</span>
          </div>
          <span className="pill grey text-[10px]">Cost: 1 Token</span>
        </div>
      </div>

      {/* Progress Stepper (6 Steps) */}
      <div className="grid grid-cols-6 gap-2 text-xs font-display uppercase font-bold text-center">
        {[
          { num: 1, title: "1. Route" },
          { num: 2, title: "2. Schedule" },
          { num: 3, title: "3. Aircraft" },
          { num: 4, title: "4. Manifest" },
          { num: 5, title: "5. Services" },
          { num: 6, title: "6. Review" }
        ].map((s) => (
          <div
            key={s.num}
            onClick={() => s.num < step && setStep(s.num)}
            className={`py-2 px-1 rounded-lg border transition-all ${
              step === s.num
                ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)] shadow-sm"
                : step > s.num
                ? "bg-[var(--card)] border-[var(--green)]/40 text-[var(--green)] cursor-pointer"
                : "bg-[var(--card)] border-[var(--line)] text-[var(--muted)] opacity-50"
            }`}
          >
            {s.title}
          </div>
        ))}
      </div>

      {/* Main Grid: Wizard Form + Right Info Rail (Live Ticket) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step Forms */}
        <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--line)] rounded-xl p-6 shadow-sm space-y-6">
          {/* STEP 1: ROUTE & TRIP TYPE */}
          {step === 1 && (
            <div className="space-y-5">
              <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                Step 1: Trip Type & Routing
              </h3>

              {/* Trip Type Pills */}
              <div className="flex items-center gap-2">
                {[
                  { id: "round_trip", label: "Round Trip" },
                  { id: "one_way", label: "One Way" },
                  { id: "multi_leg", label: "Multi-Leg" }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTripType(t.id as TripType)}
                    className={`px-4 py-2 rounded-lg text-xs font-display uppercase font-bold transition-all border ${
                      tripType === t.id
                        ? "bg-[var(--accent)] text-black border-[var(--accent)]"
                        : "bg-[var(--paper)] text-[var(--muted)] border-[var(--line)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Origin & Destination Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                    Origin Airport (ICAO / IATA):
                  </label>
                  <AirportSearchSelect
                    value={originIcao}
                    onChange={(code) => setOriginIcao(code)}
                    placeholder="Search origin e.g. LSGG, Geneva..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                    Destination Airport (ICAO / IATA):
                  </label>
                  <AirportSearchSelect
                    value={destIcao}
                    onChange={(code) => setDestIcao(code)}
                    placeholder="Search destination e.g. LFMN, Nice..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SCHEDULE */}
          {step === 2 && (
            <div className="space-y-5">
              <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                Step 2: Flight Schedule & Departure Times
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                    Departure Date:
                  </label>
                  <input
                    type="date"
                    value={flightDate}
                    onChange={(e) => setFlightDate(e.target.value)}
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 text-xs font-mono text-[var(--ink)]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                    Departure Time (Local Station):
                  </label>
                  <input
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 text-xs font-mono text-[var(--ink)]"
                  />
                </div>

                {tripType === "round_trip" && (
                  <div>
                    <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                      Return Flight Date:
                    </label>
                    <input
                      type="date"
                      value={returnFlightDate}
                      onChange={(e) => setReturnFlightDate(e.target.value)}
                      className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 text-xs font-mono text-[var(--ink)]"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: AIRCRAFT CATEGORY */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                Step 3: Select Aircraft Category Preference
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {aircraftCategories.map((cat) => {
                  const isSelected = categoryPreference === cat.label;
                  return (
                    <div
                      key={cat.label}
                      onClick={() => setCategoryPreference(cat.label)}
                      className={`border rounded-xl p-4 cursor-pointer transition-all ${
                        isSelected
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]"
                          : "border-[var(--line)] bg-[var(--paper)] hover:border-[var(--muted)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-display font-bold text-sm text-[var(--ink)]">{cat.label}</span>
                        <span className="pill grey text-[10px]">{cat.seats}</span>
                      </div>
                      <p className="text-[11px] text-[var(--muted)] m-0 font-sans">{cat.typical}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: PASSENGERS & LUGGAGE */}
          {step === 4 && (
            <div className="space-y-5">
              <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                Step 4: Passenger Manifest & Luggage
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                    Passenger Count:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={19}
                    value={paxCount}
                    onChange={(e) => setPaxCount(Number(e.target.value))}
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 text-xs font-mono text-[var(--ink)]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                    Standard Suitcases:
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={suitcases}
                    onChange={(e) => setSuitcases(Number(e.target.value))}
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 text-xs font-mono text-[var(--ink)]"
                  />
                </div>
              </div>

              {/* Pets Toggle */}
              <div className="border border-[var(--line)] rounded-lg p-3 bg-[var(--paper)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-[var(--ink)] block">Traveling with Animals / Pets?</span>
                    <span className="text-[11px] text-[var(--muted)]">DEFRA / Pet Travel Scheme compliant</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasPets}
                    onChange={(e) => setHasPets(e.target.checked)}
                    className="rounded border-[var(--line)]"
                  />
                </div>
                {hasPets && (
                  <input
                    type="text"
                    placeholder="Enter pet species, breed, and weight (e.g. Dog, 4 kg)"
                    value={petDetails}
                    onChange={(e) => setPetDetails(e.target.value)}
                    className="w-full bg-[var(--card)] border border-[var(--line)] rounded px-3 py-1.5 text-xs text-[var(--ink)]"
                  />
                )}
              </div>
            </div>
          )}

          {/* STEP 5: SPECIAL SERVICES */}
          {step === 5 && (
            <div className="space-y-5">
              <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                Step 5: Catering & Concierge Services
              </h3>

              <div>
                <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                  In-Flight Catering Requests:
                </label>
                <textarea
                  rows={3}
                  value={cateringRequest}
                  onChange={(e) => setCateringRequest(e.target.value)}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 text-xs text-[var(--ink)]"
                />
              </div>

              <div className="flex items-center justify-between border border-[var(--line)] rounded-lg p-3 bg-[var(--paper)]">
                <div>
                  <span className="font-bold text-xs text-[var(--ink)] block">VIP Tarmac Chauffeur Transfer</span>
                  <span className="text-[11px] text-[var(--muted)]">Mercedes S-Class meeting aircraft on apron</span>
                </div>
                <input
                  type="checkbox"
                  checked={limousineTransfer}
                  onChange={(e) => setLimousineTransfer(e.target.checked)}
                  className="rounded border-[var(--line)]"
                />
              </div>

              <div>
                <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                  Client Budget & Pricing Notes:
                </label>
                <input
                  type="text"
                  value={budgetNotes}
                  onChange={(e) => setBudgetNotes(e.target.value)}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 text-xs text-[var(--ink)]"
                />
              </div>
            </div>
          )}

          {/* STEP 6: REVIEW & SUBMIT */}
          {step === 6 && (
            <div className="space-y-5">
              <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                Step 6: Review & Submit Charter Request
              </h3>

              <div className="callout text-xs font-mono">
                Submitting this request will deduct <strong className="text-[var(--accent)]">1 token</strong> from your broker account. Our operations desk will source verified operator quotes within the 30-minute SLA window.
              </div>

              <div className="border border-[var(--line)] rounded-lg p-4 bg-[var(--paper)] space-y-3 text-xs">
                <div className="flex justify-between border-b border-[var(--line)] pb-2">
                  <span className="text-[var(--muted)]">Routing:</span>
                  <span className="font-mono font-bold text-[var(--ink)]">
                    {originIcao} {tripType === "round_trip" ? "⇄" : "→"} {destIcao}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[var(--line)] pb-2">
                  <span className="text-[var(--muted)]">Schedule:</span>
                  <span className="font-mono text-[var(--ink)]">
                    {flightDate} @ {departureTime} Local
                  </span>
                </div>
                <div className="flex justify-between border-b border-[var(--line)] pb-2">
                  <span className="text-[var(--muted)]">Aircraft Category:</span>
                  <span className="font-bold text-[var(--ink)]">{categoryPreference}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--line)] pb-2">
                  <span className="text-[var(--muted)]">Passengers:</span>
                  <span className="font-mono text-[var(--ink)]">{paxCount} Pax • {suitcases} Suitcases</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Token Deduction:</span>
                  <span className="font-mono font-bold text-[var(--accent)]">1 Token (€0.00 cash due now)</span>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--line)]">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="btn-secondary text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : <div />}

            {step < 6 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="btn-primary text-xs"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="btn-primary text-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Submitting..." : "Submit Request (1 Token)"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Info Rail: Live Summary Ticket (R-026) */}
        <div className="space-y-4 text-xs font-sans">
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
              <span className="font-display uppercase text-[10px] font-bold text-[var(--muted)] tracking-wider">
                LIVE REQUEST TICKET
              </span>
              <span className="pill green text-[10px]">READY</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between font-mono">
                <span className="text-[var(--muted)]">Route:</span>
                <span className="font-bold text-[var(--ink)]">
                  {originIcao} {tripType === "round_trip" ? "⇄" : "→"} {destIcao}
                </span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[var(--muted)]">Departure:</span>
                <span className="text-[var(--ink)]">{flightDate}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[var(--muted)]">Category:</span>
                <span className="text-[var(--ink)]">{categoryPreference}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[var(--muted)]">Capacity:</span>
                <span className="text-[var(--ink)]">{paxCount} Pax</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--line)] font-mono text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Token Balance:</span>
                <span>{tokenBalance}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-[var(--muted)]">Cost to Submit:</span>
                <span className="text-[var(--accent)]">1 Token</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

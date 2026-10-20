"use client";

import React, { useState } from "react";
import { useAviation } from "@/lib/aviationContext";
import { airportsData, findAirportByCode } from "@/data/airports";
import { fleetData } from "@/data/fleet";
import { defaultOperator } from "@/data/initialBookings";
import { Booking, FlightLeg, AdditionalServices } from "@/types/aviation";
import { calculatePricing, calculateDistanceNm, formatFlightTime, estimateFlightTimeMinutes, formatCurrency } from "@/lib/pricingCalculator";
import { X, Plus, Trash2, Plane, Sparkles, Check } from "lucide-react";

export default function NewQuoteModal() {
  const { isNewQuoteModalOpen, closeNewQuoteModal, addBooking, openDocument, role } = useAviation();

  // Wizard Form State
  const [clientName, setClientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientCityCountry, setClientCityCountry] = useState("");
  
  const [selectedAircraftId, setSelectedAircraftId] = useState("cessna-citation-mustang");
  const [tripType, setTripType] = useState<"one_way" | "round_trip" | "multi_leg">("one_way");

  // Legs State
  const [legs, setLegs] = useState<Array<{
    originIcao: string;
    destIcao: string;
    flightDate: string;
    departureTime: string;
    paxCount: number;
  }>>([
    {
      originIcao: "LSGG",
      destIcao: "LIMJ",
      flightDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
      departureTime: "11:00",
      paxCount: 2
    }
  ]);

  // Additional Services State
  const [services, setServices] = useState<AdditionalServices>({
    limousineService: false,
    luxuryCarRental: false,
    helicopterService: false,
    vipCateringDetails: "",
    deicingInsurance: "none",
    deicingCostPerLeg: 0,
    carbonOffset: "neutral",
    carbonOffsetRatePerHour: 33
  });

  if (!isNewQuoteModalOpen) return null;

  const currentAircraft = fleetData.find((a) => a.id === selectedAircraftId) || fleetData[0];

  // Helper to add leg
  const handleAddLeg = () => {
    const lastLeg = legs[legs.length - 1];
    setLegs([
      ...legs,
      {
        originIcao: lastLeg ? lastLeg.destIcao : "LSGG",
        destIcao: "LFPB",
        flightDate: lastLeg ? lastLeg.flightDate : new Date().toISOString().split("T")[0],
        departureTime: "14:00",
        paxCount: lastLeg ? lastLeg.paxCount : 2
      }
    ]);
  };

  const handleRemoveLeg = (index: number) => {
    if (legs.length <= 1) return;
    setLegs(legs.filter((_, i) => i !== index));
  };

  const handleLegChange = (index: number, field: string, value: any) => {
    const updated = [...legs];
    updated[index] = { ...updated[index], [field]: value };
    setLegs(updated);
  };

  // Build full flight legs
  const compiledLegs: FlightLeg[] = legs.map((leg, idx) => {
    const originAirport = findAirportByCode(leg.originIcao);
    const destAirport = findAirportByCode(leg.destIcao);
    const dist = calculateDistanceNm(
      originAirport.coordinates?.lat || 46.2,
      originAirport.coordinates?.lng || 6.1,
      destAirport.coordinates?.lat || 44.4,
      destAirport.coordinates?.lng || 8.8
    );
    const flightMinutes = estimateFlightTimeMinutes(dist);

    return {
      legNumber: idx + 1,
      flightDate: leg.flightDate,
      origin: originAirport,
      destination: destAirport,
      departureTimeLocal: `${leg.departureTime} h`,
      arrivalTimeLocal: `${String(Math.floor((parseInt(leg.departureTime.split(":")[0]) * 60 + parseInt(leg.departureTime.split(":")[1]) + flightMinutes) / 60) % 24).padStart(2, "0")}:${String((parseInt(leg.departureTime.split(":")[1]) + flightMinutes) % 60).padStart(2, "0")} h`,
      flightTimeFormatted: formatFlightTime(flightMinutes),
      paxCount: leg.paxCount,
      flightNumber: `ORB${Math.floor(100 + Math.random() * 899)}X`,
      aircraftRegistration: currentAircraft.registration || "OE-FFB",
      distanceNm: dist,
      crew: [
        { role: "CMDR", name: "Capt. Audrain, Emmanuel", phone: "+43 664 8489 904" },
        { role: "F/O", name: "El Hassani Amrani, Hajar", phone: "+43 664 8489 928" }
      ],
      passengers: [
        { id: "p1", fullName: clientName || "Guest Passenger 1", isLeadPassenger: true }
      ],
      departureHandling: {
        name: `${originAirport.name} FBO`,
        airportCode: originAirport.icao,
        phone: "+41 58 158 1811",
        email: `ops@${originAirport.icao.toLowerCase()}.handling.aero`
      },
      arrivalHandling: {
        name: `${destAirport.name} FBO`,
        airportCode: destAirport.icao,
        phone: "+39 010 601 5412",
        email: `ops@${destAirport.icao.toLowerCase()}.handling.aero`
      }
    };
  });

  const estimatedPricing = calculatePricing(currentAircraft, compiledLegs, services, "EUR");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newTripNumber = `PEU${randomSuffix}-001`;
    const newInvoiceNumber = `0010${Math.floor(6000 + Math.random() * 3000)}`;
    const newAccountNumber = `${Math.floor(200000 + Math.random() * 800000)}`;

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      tripNumber: newTripNumber,
      invoiceNumber: newInvoiceNumber,
      accountNumber: newAccountNumber,
      contractDate: new Date().toLocaleDateString("de-DE"),
      quoteExpirationDate: new Date(Date.now() + 86400000 * 2).toLocaleDateString("de-DE") + ", 18:00z",
      paymentDueDate: new Date(Date.now() + 86400000 * 3).toLocaleDateString("de-DE"),
      status: "quote_sent",
      tripType: tripType,
      aircraft: currentAircraft,
      client: {
        fullName: clientName || "Valued Private Client",
        companyName: companyName || undefined,
        streetAddress: clientAddress || "Private Aviation Terminal",
        cityPostalCountry: clientCityCountry || "Monaco / Geneva",
        phone: clientPhone || "+44 20 7946 0000",
        email: clientEmail || "client@privatecharter.com"
      },
      operator: defaultOperator,
      legs: compiledLegs,
      pricing: estimatedPricing,
      services: services,
      agentName: role === "agent" ? "Charter Sales Agent" : "Ezeokeke, Obiefuna",
      agentEmail: "customercare@orbelo.com",
      commissionPercentage: 8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      checklist: [
        { id: "c1", label: "Aircraft Maintenance Release & Airworthiness Signoff", category: "aircraft", isCompleted: true, completedAt: "Just now", completedBy: "System Auto-check", requiredForDispatch: true },
        { id: "c2", label: "Overflight & Landing Slots / PPR Confirmed", category: "permits", isCompleted: false, requiredForDispatch: true },
        { id: "c3", label: "Crew Assignment & FTL Legality Confirmed", category: "crew", isCompleted: true, completedAt: "Just now", completedBy: "Roster Engine", requiredForDispatch: true },
        { id: "c4", label: "Departure FBO Handling Confirmed", category: "ground", isCompleted: false, requiredForDispatch: true },
        { id: "c5", label: "Arrival FBO Handling Confirmed", category: "ground", isCompleted: false, requiredForDispatch: true },
        { id: "c6", label: "Passenger Passport & APIS Data Validated", category: "passengers", isCompleted: false, requiredForDispatch: true },
        { id: "c7", label: "VIP Catering Ordered & Confirmed", category: "ground", isCompleted: false, requiredForDispatch: false },
        { id: "c8", label: "De-icing Status Evaluated", category: "safety", isCompleted: false, requiredForDispatch: true },
        { id: "c9", label: "Flight Brief Issued & Sent to Crew", category: "crew", isCompleted: false, requiredForDispatch: true },
        { id: "c10", label: "Escrow Payment Received / Invoice Cleared", category: "finance", isCompleted: false, requiredForDispatch: true }
      ]
    };

    addBooking(newBooking);
    closeNewQuoteModal();
    // Open the generated quote immediately
    openDocument(newBooking, "quotation");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0F1420] border border-gold/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-[#080C14] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold/10 border border-gold/30 text-gold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-gold font-bold">
                QUOTE & CHARTER GENERATOR
              </span>
              <h2 className="text-base font-bold text-white">New Private Jet Quotation</h2>
            </div>
          </div>
          <button onClick={closeNewQuoteModal} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-gray-200">
          {/* Section 1: Client Information */}
          <div className="bg-[#0B101A] p-4 rounded-xl border border-gray-800 space-y-3">
            <h3 className="font-bold text-gold text-xs uppercase tracking-wider">1. Client / Charterer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Edward Brinkmann"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-[#080C14] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Company Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Brinkmann Global Capital"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#080C14] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. e.brinkmann@example.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-[#080C14] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Direct Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +1 239 555 0192"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-[#080C14] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. 3606 Enterprise Ave"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full bg-[#080C14] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">City, State / Country</label>
                <input
                  type="text"
                  placeholder="e.g. FL-34104 Naples, United States"
                  value={clientCityCountry}
                  onChange={(e) => setClientCityCountry(e.target.value)}
                  className="w-full bg-[#080C14] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-gold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Aircraft Selection */}
          <div className="bg-[#0B101A] p-4 rounded-xl border border-gray-800 space-y-3">
            <h3 className="font-bold text-gold text-xs uppercase tracking-wider">2. Aircraft Selection</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {fleetData.map((aircraft) => {
                const isSelected = selectedAircraftId === aircraft.id;
                return (
                  <div
                    key={aircraft.id}
                    onClick={() => setSelectedAircraftId(aircraft.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-gold bg-gold/10 shadow-gold"
                        : "border-gray-800 bg-[#080C14] hover:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-xs">{aircraft.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gold font-mono">
                        {aircraft.categoryLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mb-2">Cap: {aircraft.passengers} seats • Range: {aircraft.range} nm</p>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-800 text-xs">
                      <span className="text-gray-400 font-mono">€{aircraft.pricePerHour}/hr</span>
                      {isSelected && <Check className="w-4 h-4 text-gold" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Routing & Flight Legs */}
          <div className="bg-[#0B101A] p-4 rounded-xl border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gold text-xs uppercase tracking-wider">3. Flight Routing & Legs</h3>
              <button
                type="button"
                onClick={handleAddLeg}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold text-xs font-semibold border border-gold/30 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Leg</span>
              </button>
            </div>

            <div className="space-y-3">
              {legs.map((leg, idx) => (
                <div key={idx} className="p-3 bg-[#080C14] rounded-lg border border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-gold text-[11px]">LEG #{idx + 1}</span>
                    {legs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLeg(idx)}
                        className="text-gray-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-gray-400 text-[10px] mb-1">Origin Airport (ICAO/IATA)</label>
                      <select
                        value={leg.originIcao}
                        onChange={(e) => handleLegChange(idx, "originIcao", e.target.value)}
                        className="w-full bg-[#0F1420] border border-gray-700 rounded-lg px-2 py-1.5 text-white font-mono text-xs focus:border-gold focus:outline-none"
                      >
                        {airportsData.map((a) => (
                          <option key={a.id} value={a.icao}>
                            {a.icao} - {a.city} ({a.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-[10px] mb-1">Destination Airport</label>
                      <select
                        value={leg.destIcao}
                        onChange={(e) => handleLegChange(idx, "destIcao", e.target.value)}
                        className="w-full bg-[#0F1420] border border-gray-700 rounded-lg px-2 py-1.5 text-white font-mono text-xs focus:border-gold focus:outline-none"
                      >
                        {airportsData.map((a) => (
                          <option key={a.id} value={a.icao}>
                            {a.icao} - {a.city} ({a.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-[10px] mb-1">Flight Date</label>
                      <input
                        type="date"
                        value={leg.flightDate}
                        onChange={(e) => handleLegChange(idx, "flightDate", e.target.value)}
                        className="w-full bg-[#0F1420] border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs focus:border-gold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 text-[10px] mb-1">Departure Time (Local)</label>
                      <input
                        type="time"
                        value={leg.departureTime}
                        onChange={(e) => handleLegChange(idx, "departureTime", e.target.value)}
                        className="w-full bg-[#0F1420] border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs focus:border-gold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 text-[10px] mb-1">Passengers (Pax)</label>
                      <input
                        type="number"
                        min="1"
                        max={currentAircraft.passengers}
                        value={leg.paxCount}
                        onChange={(e) => handleLegChange(idx, "paxCount", parseInt(e.target.value) || 1)}
                        className="w-full bg-[#0F1420] border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs focus:border-gold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Additional VIP Services & Insurance */}
          <div className="bg-[#0B101A] p-4 rounded-xl border border-gray-800 space-y-3">
            <h3 className="font-bold text-gold text-xs uppercase tracking-wider">4. VIP Concierge, Insurance & Sustainability</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-800 bg-[#080C14] cursor-pointer">
                <input
                  type="checkbox"
                  checked={services.limousineService}
                  onChange={(e) => setServices({ ...services, limousineService: e.target.checked })}
                  className="rounded text-gold"
                />
                <span>Limousine Service (+€450/leg)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-800 bg-[#080C14] cursor-pointer">
                <input
                  type="checkbox"
                  checked={services.helicopterService}
                  onChange={(e) => setServices({ ...services, helicopterService: e.target.checked })}
                  className="rounded text-gold"
                />
                <span>Helicopter Transfer (+€1,800)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-gold/40 bg-gold/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!services.cancellationInsurance}
                  onChange={(e) => setServices({ ...services, cancellationInsurance: e.target.checked })}
                  className="rounded text-gold"
                />
                <span className="text-white font-medium">Cancellation Insurance (+€1,000/leg)</span>
              </label>

              <div className="flex flex-col">
                <label className="text-gray-400 text-[10px] mb-1">De-icing Insurance</label>
                <select
                  value={services.deicingInsurance}
                  onChange={(e) => setServices({ ...services, deicingInsurance: e.target.value as any })}
                  className="bg-[#080C14] border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs focus:border-gold focus:outline-none"
                >
                  <option value="none">None (Billed post-flight)</option>
                  <option value="at_reservation">Book at Reservation (€400/leg)</option>
                  <option value="within_48h">Book within 48h (€800/leg)</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-gray-400 text-[10px] mb-1">Carbon Offset Program</label>
                <select
                  value={services.carbonOffset}
                  onChange={(e) => setServices({ ...services, carbonOffset: e.target.value as any })}
                  className="bg-[#080C14] border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs focus:border-gold focus:outline-none"
                >
                  <option value="none">None (Standard)</option>
                  <option value="neutral">Fly Neutral (€33/hr)</option>
                  <option value="positive">Fly Positive (€50/hr)</option>
                  <option value="double_neutral">Fly Double Neutral (€66/hr)</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-gray-400 text-[10px] mb-1">Trip Type Format</label>
                <select
                  value={tripType}
                  onChange={(e) => setTripType(e.target.value as any)}
                  className="bg-[#080C14] border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs focus:border-gold focus:outline-none"
                >
                  <option value="round_trip">RoundTripPlus</option>
                  <option value="one_way">One-Way Charter</option>
                  <option value="multi_leg">Multi-Leg Itinerary</option>
                </select>
              </div>
            </div>
          </div>

          {/* Live Pricing Preview Bar */}
          <div className="bg-gradient-to-r from-gold/10 to-transparent p-4 rounded-xl border border-gold/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-gold">CALCULATED TOTAL FLIGHT PRICE</span>
              <p className="text-xl font-bold text-white font-mono">
                {formatCurrency(estimatedPricing.totalFlightPrice, "EUR")}
              </p>
            </div>
            <div className="text-right text-[11px] text-gray-400">
              <p>Flight Base: {formatCurrency(estimatedPricing.flightPrice, "EUR")}</p>
              <p>Fees & Taxes: {formatCurrency(estimatedPricing.airportFees + estimatedPricing.passengerFees + estimatedPricing.inboundPassengerTax * 2, "EUR")}</p>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeNewQuoteModal}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gold hover:bg-gold-light text-[#0F1420] font-bold text-xs shadow-gold transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Quote & Documents</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

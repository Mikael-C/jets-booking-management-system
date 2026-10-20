"use client";

import React, { useState, useEffect } from "react";
import { useAviation } from "@/lib/aviationContext";
import { airportsData, findAirportByCode } from "@/data/airports";
import { fleetData } from "@/data/fleet";
import { defaultOperator } from "@/data/initialBookings";
import { Booking, FlightLeg, AdditionalServices, TripType } from "@/types/aviation";
import {
  calculatePricing,
  calculateDistanceNm,
  formatFlightTime,
  estimateFlightTimeMinutes,
  formatCurrency
} from "@/lib/pricingCalculator";
import {
  Plane,
  User,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  Building,
  Mail,
  Phone,
  FileText,
  Shield,
  MapPin,
  RefreshCw,
  Landmark,
  Receipt,
  Check,
  ChevronDown,
  Layers
} from "lucide-react";

interface QuoteLegInput {
  originIcao: string;
  destIcao: string;
  flightDate: string;
  departureTime: string;
  arrivalTime: string;
  paxCount: number;
  flightNumber: string;
  aircraftRegistration: string;
  depHandlerName: string;
  depHandlerPhone: string;
  depHandlerEmail: string;
  arrHandlerName: string;
  arrHandlerPhone: string;
  arrHandlerEmail: string;
}

export default function GenerateQuoteView() {
  const { clients, addBooking, openDocument, prefillClientForQuote, setPrefillClientForQuote } = useAviation();

  // Document & Contract Identifiers (Page 1 Details Box)
  const [contractDate, setContractDate] = useState("01.10.2026");
  const [tripNumber, setTripNumber] = useState("PEU842-001");
  const [accountNumber, setAccountNumber] = useState("2{21737}");
  const [quoteExpirationDate, setQuoteExpirationDate] = useState("02.10.2026, 19:53z");
  const [tripType, setTripType] = useState<TripType>("round_trip");
  const [currency, setCurrency] = useState<"EUR" | "USD" | "GBP" | "CHF">("EUR");

  // Client Details (Page 1 TO Box)
  const [selectedClientId, setSelectedClientId] = useState<string>(
    prefillClientForQuote ? prefillClientForQuote.id : clients[0]?.id || ""
  );
  const [clientName, setClientName] = useState(prefillClientForQuote?.fullName || "Edward Brinkmann");
  const [companyName, setCompanyName] = useState(prefillClientForQuote?.companyName || "Brinkmann Capital SAM");
  const [clientEmail, setClientEmail] = useState(prefillClientForQuote?.email || "e.brinkmann@luxurycap.com");
  const [clientPhone, setClientPhone] = useState(prefillClientForQuote?.phone || "+1 239 555 0192");
  const [clientAddress, setClientAddress] = useState(prefillClientForQuote?.streetAddress || "3606 Enterprise Ave");
  const [clientCityCountry, setClientCityCountry] = useState(
    prefillClientForQuote?.cityPostalCountry || "FL-34104 Naples, United States"
  );
  const [vatNumber, setVatNumber] = useState(prefillClientForQuote?.vatNumber || "US-8492041");

  // Jet Details (Page 1 Aircraft Box)
  const [selectedAircraftId, setSelectedAircraftId] = useState("cessna-citation-mustang");
  const currentAircraft = fleetData.find((a) => a.id === selectedAircraftId) || fleetData[0];

  const [aircraftNameOverride, setAircraftNameOverride] = useState("");
  const [tailRegistrationOverride, setTailRegistrationOverride] = useState("");
  const [yearOfManufactureOverride, setYearOfManufactureOverride] = useState("");
  const [yearOfRefurbishmentOverride, setYearOfRefurbishmentOverride] = useState("");
  const [passengerSeatsOverride, setPassengerSeatsOverride] = useState<number | "">("");
  const [toiletteOverride, setToiletteOverride] = useState<boolean>(true);
  const [smokingCabinOverride, setSmokingCabinOverride] = useState<boolean>(false);

  // Legs State with Per-Leg Itinerary, Callsign, and FBO Ground Handling
  const [legs, setLegs] = useState<QuoteLegInput[]>([
    {
      originIcao: "LSGG",
      destIcao: "LIMJ",
      flightDate: "2026-10-03",
      departureTime: "11:00",
      arrivalTime: "11:55",
      paxCount: 2,
      flightNumber: "PEU842-001",
      aircraftRegistration: "OE-FFB",
      depHandlerName: "Jet Aviation",
      depHandlerPhone: "+41 58 158 1811",
      depHandlerEmail: "gvafbo@jetaviation.com",
      arrHandlerName: "Ags Ops",
      arrHandlerPhone: "+39 010 601 5412",
      arrHandlerEmail: "dutymanager@airport.genova.it"
    },
    {
      originIcao: "LIMJ",
      destIcao: "LSGG",
      flightDate: "2026-10-06",
      departureTime: "15:00",
      arrivalTime: "16:04",
      paxCount: 2,
      flightNumber: "PEU842-002",
      aircraftRegistration: "OE-FFB",
      depHandlerName: "Ags Ops",
      depHandlerPhone: "+39 010 601 5412",
      depHandlerEmail: "dutymanager@airport.genova.it",
      arrHandlerName: "Jet Aviation",
      arrHandlerPhone: "+41 58 158 1811",
      arrHandlerEmail: "gvafbo@jetaviation.com"
    }
  ]);

  // Additional Services (Pages 2 & 3 of PDF)
  const [services, setServices] = useState<AdditionalServices>({
    limousineService: false,
    luxuryCarRental: false,
    helicopterService: false,
    vipCateringDetails: "Complimentary Taittinger Champagne, premium snacks and artisanal canapés",
    deicingInsurance: "none",
    deicingCostPerLeg: 0,
    carbonOffset: "neutral",
    carbonOffsetRatePerHour: 33,
    cancellationInsurance: false
  });

  // Custom Pricing Line Item Overrides
  const [overridePricing, setOverridePricing] = useState(false);
  const [customFlightPrice, setCustomFlightPrice] = useState<number>(11500);
  const [customAirportFees, setCustomAirportFees] = useState<number>(1140);
  const [customPassengerFees, setCustomPassengerFees] = useState<number>(80);
  const [customDayOfWeekDiscount, setCustomDayOfWeekDiscount] = useState<number>(-250);
  const [customInboundTax, setCustomInboundTax] = useState<number>(200);
  const [customOutboundTax, setCustomOutboundTax] = useState<number>(200);
  const [customAdditionalServices, setCustomAdditionalServices] = useState<number>(0);

  // Bank & Remittance Details (Page 1 Payment Conditions)
  const [bankName, setBankName] = useState(defaultOperator.bankName);
  const [iban, setIban] = useState(defaultOperator.iban);
  const [bic, setBic] = useState(defaultOperator.bic);
  const [accountHolder, setAccountHolder] = useState(defaultOperator.accountHolder);
  const [repName, setRepName] = useState(defaultOperator.representativeName);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // When prefill client is provided via CRM
  useEffect(() => {
    if (prefillClientForQuote) {
      setSelectedClientId(prefillClientForQuote.id);
      setClientName(prefillClientForQuote.fullName);
      setCompanyName(prefillClientForQuote.companyName || "");
      setClientEmail(prefillClientForQuote.email);
      setClientPhone(prefillClientForQuote.phone);
      setClientAddress(prefillClientForQuote.streetAddress);
      setClientCityCountry(prefillClientForQuote.cityPostalCountry);
      setVatNumber(prefillClientForQuote.vatNumber || "");
    }
  }, [prefillClientForQuote]);

  // Sync client dropdown
  const handleClientSelectChange = (id: string) => {
    setSelectedClientId(id);
    const found = clients.find((c) => c.id === id);
    if (found) {
      setClientName(found.fullName);
      setCompanyName(found.companyName || "");
      setClientEmail(found.email);
      setClientPhone(found.phone);
      setClientAddress(found.streetAddress);
      setClientCityCountry(found.cityPostalCountry);
      setVatNumber(found.vatNumber || "");
    }
  };

  // Helper to re-generate random numbers
  const handleRegenerateNumbers = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setTripNumber(`PEU${randomSuffix}-001`);
    setAccountNumber(`${Math.floor(200000 + Math.random() * 800000)}`);
  };

  // Helper to add leg
  const handleAddLeg = () => {
    const lastLeg = legs[legs.length - 1];
    const originIcao = lastLeg ? lastLeg.destIcao : "LSGG";
    const destIcao = "LFPB";
    const origAirport = findAirportByCode(originIcao);
    const destAirport = findAirportByCode(destIcao);

    const dist = calculateDistanceNm(
      origAirport.coordinates?.lat || 46.2,
      origAirport.coordinates?.lng || 6.1,
      destAirport.coordinates?.lat || 48.9,
      destAirport.coordinates?.lng || 2.4
    );
    const flightMinutes = estimateFlightTimeMinutes(dist);

    setLegs([
      ...legs,
      {
        originIcao,
        destIcao,
        flightDate: lastLeg ? lastLeg.flightDate : new Date().toISOString().split("T")[0],
        departureTime: "14:00",
        arrivalTime: "15:15",
        paxCount: lastLeg ? lastLeg.paxCount : 2,
        flightNumber: `PEU${Math.floor(100 + Math.random() * 899)}`,
        aircraftRegistration: tailRegistrationOverride || currentAircraft.registration || "OE-FFB",
        depHandlerName: `${origAirport.name} FBO`,
        depHandlerPhone: "+41 58 158 1811",
        depHandlerEmail: `ops@${originIcao.toLowerCase()}.handling.aero`,
        arrHandlerName: `${destAirport.name} FBO`,
        arrHandlerPhone: "+33 1 48 62 00 00",
        arrHandlerEmail: `ops@${destIcao.toLowerCase()}.handling.aero`
      }
    ]);
  };

  const handleRemoveLeg = (idx: number) => {
    if (legs.length <= 1) return;
    setLegs(legs.filter((_, i) => i !== idx));
  };

  const handleLegChange = (idx: number, field: keyof QuoteLegInput, val: any) => {
    const updated = [...legs];
    updated[idx] = { ...updated[idx], [field]: val };

    // Auto-update arrival time if departureTime, origin or dest changed
    if (field === "departureTime" || field === "originIcao" || field === "destIcao") {
      const orig = findAirportByCode(field === "originIcao" ? val : updated[idx].originIcao);
      const dest = findAirportByCode(field === "destIcao" ? val : updated[idx].destIcao);
      const dist = calculateDistanceNm(
        orig.coordinates?.lat || 46.2,
        orig.coordinates?.lng || 6.1,
        dest.coordinates?.lat || 44.4,
        dest.coordinates?.lng || 8.8
      );
      const flightMinutes = estimateFlightTimeMinutes(dist);
      const depTime = field === "departureTime" ? val : updated[idx].departureTime;
      const [hStr, mStr] = depTime.split(":");
      const depMinutes = (parseInt(hStr, 10) || 10) * 60 + (parseInt(mStr, 10) || 0);
      const arrTotalMin = depMinutes + flightMinutes;
      const arrH = String(Math.floor(arrTotalMin / 60) % 24).padStart(2, "0");
      const arrM = String(arrTotalMin % 60).padStart(2, "0");
      updated[idx].arrivalTime = `${arrH}:${arrM}`;
    }

    setLegs(updated);
  };

  // Compile full flight legs
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
      departureTimeLocal: leg.departureTime.includes("h") ? leg.departureTime : `${leg.departureTime} h`,
      arrivalTimeLocal: leg.arrivalTime.includes("h") ? leg.arrivalTime : `${leg.arrivalTime} h`,
      flightTimeFormatted: formatFlightTime(flightMinutes),
      paxCount: leg.paxCount,
      flightNumber: leg.flightNumber || `PEU842`,
      aircraftRegistration: leg.aircraftRegistration || tailRegistrationOverride || currentAircraft.registration || "OE-FFB",
      distanceNm: dist,
      crew: [
        { role: "CMDR", name: "Capt. Audrain, Emmanuel", phone: "+43 664 8489 904" },
        { role: "F/O", name: "El Hassani Amrani, Hajar", phone: "+43 664 8489 928" }
      ],
      passengers: [
        { id: `p-${idx}-1`, fullName: clientName || "Lead Passenger", isLeadPassenger: true }
      ],
      departureHandling: {
        name: leg.depHandlerName || `${originAirport.name} FBO`,
        airportCode: originAirport.icao,
        phone: leg.depHandlerPhone || "+41 58 158 1811",
        email: leg.depHandlerEmail || `ops@${originAirport.icao.toLowerCase()}.handling.aero`
      },
      arrivalHandling: {
        name: leg.arrHandlerName || `${destAirport.name} FBO`,
        airportCode: destAirport.icao,
        phone: leg.arrHandlerPhone || "+39 010 601 5412",
        email: leg.arrHandlerEmail || `ops@${destAirport.icao.toLowerCase()}.handling.aero`
      }
    };
  });

  // Effective Aircraft
  const effectiveAircraft = {
    ...currentAircraft,
    name: aircraftNameOverride || currentAircraft.name,
    registration: tailRegistrationOverride || currentAircraft.registration,
    yearOfManufacture: yearOfManufactureOverride || currentAircraft.yearOfManufacture,
    yearOfRefurbishment: yearOfRefurbishmentOverride !== "" ? yearOfRefurbishmentOverride : currentAircraft.yearOfRefurbishment,
    passengers: typeof passengerSeatsOverride === "number" ? passengerSeatsOverride : currentAircraft.passengers,
    toilette: toiletteOverride,
    smokingCabin: smokingCabinOverride
  };

  // Base pricing from calculation
  const autoPricing = calculatePricing(effectiveAircraft, compiledLegs, services, currency);

  // Effective pricing based on manual override vs auto
  const effectivePricing = overridePricing
    ? {
        flightPrice: customFlightPrice,
        airportFees: customAirportFees,
        passengerFees: customPassengerFees,
        dayOfWeekDiscount: customDayOfWeekDiscount,
        inboundPassengerTax: customInboundTax,
        outboundPassengerTax: customOutboundTax,
        additionalServicesTotal: customAdditionalServices,
        subtotal:
          customFlightPrice +
          customAirportFees +
          customPassengerFees +
          customDayOfWeekDiscount +
          customInboundTax +
          customOutboundTax +
          customAdditionalServices,
        vatRate: 0,
        vatAmount: 0,
        totalFlightPrice:
          customFlightPrice +
          customAirportFees +
          customPassengerFees +
          customDayOfWeekDiscount +
          customInboundTax +
          customOutboundTax +
          customAdditionalServices,
        currency
      }
    : autoPricing;

  // Sync auto pricing to custom inputs if not overriding
  useEffect(() => {
    if (!overridePricing) {
      setCustomFlightPrice(autoPricing.flightPrice);
      setCustomAirportFees(autoPricing.airportFees);
      setCustomPassengerFees(autoPricing.passengerFees);
      setCustomDayOfWeekDiscount(autoPricing.dayOfWeekDiscount);
      setCustomInboundTax(autoPricing.inboundPassengerTax);
      setCustomOutboundTax(autoPricing.outboundPassengerTax);
      setCustomAdditionalServices(autoPricing.additionalServicesTotal);
    }
  }, [autoPricing, overridePricing]);

  const handleGenerateQuote = (e: React.FormEvent) => {
    e.preventDefault();

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      tripNumber,
      invoiceNumber: `0010${Math.floor(6000 + Math.random() * 3000)}`,
      accountNumber,
      contractDate,
      quoteExpirationDate,
      paymentDueDate: new Date(Date.now() + 86400000 * 3).toLocaleDateString("de-DE"),
      status: "quote_sent",
      tripType,
      aircraft: effectiveAircraft,
      client: {
        fullName: clientName || "VIP Client",
        companyName,
        streetAddress: clientAddress || "3606 Enterprise Ave",
        cityPostalCountry: clientCityCountry || "FL-34104 Naples, United States",
        phone: clientPhone || "+1 239 555 0192",
        email: clientEmail || "client@globeair.com",
        vatNumber
      },
      operator: {
        ...defaultOperator,
        representativeName: repName || defaultOperator.representativeName,
        bankName: bankName || defaultOperator.bankName,
        iban: iban || defaultOperator.iban,
        bic: bic || defaultOperator.bic,
        accountHolder: accountHolder || defaultOperator.accountHolder
      },
      legs: compiledLegs,
      pricing: effectivePricing,
      services,
      checklist: [
        { id: "step-1", label: "Aircraft Airworthiness & ARC Validity Verified", category: "aircraft", isCompleted: true, completedAt: "18.10.2026, 08:30", completedBy: "Flight Dispatcher", requiredForDispatch: true },
        { id: "step-2", label: "ATC Eurocontrol Flight Plan Filed & Accepted", category: "permits", isCompleted: true, completedAt: "18.10.2026, 08:45", completedBy: "Flight Dispatcher", requiredForDispatch: true },
        { id: "step-3", label: "Origin & Destination FBO Ramp Handling Booked", category: "ground", isCompleted: false, requiredForDispatch: true },
        { id: "step-4", label: "Airport Slots & PPR Cleared", category: "permits", isCompleted: false, requiredForDispatch: true },
        { id: "step-5", label: "Jet A-1 Fuel Uplift & Release Ordered", category: "ground", isCompleted: false, requiredForDispatch: true },
        { id: "step-6", label: "Crew Duty Time & Fatigue Risk Assessment Validated", category: "crew", isCompleted: true, completedAt: "18.10.2026, 09:00", completedBy: "Crew Ops", requiredForDispatch: true },
        { id: "step-7", label: "VIP In-Flight Catering & Bar Stocked", category: "passengers", isCompleted: false, requiredForDispatch: false },
        { id: "step-8", label: "Customs, Immigration & GAR Form Submitted", category: "permits", isCompleted: false, requiredForDispatch: true }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addBooking(newBooking);
    setSuccessMessage(`Official Quotation ${tripNumber} successfully generated!`);
    openDocument(newBooking, "quotation");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* View Header */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30">
              EXECUTIVE QUOTATION ENGINE
            </span>
            <span className="text-xs text-[#0F1420]/60">Full Template Fidelity</span>
          </div>
          <h2 className="text-xl font-black text-[#0F1420] tracking-tight">
            Generate Official Private Jet Quotation
          </h2>
          <p className="text-xs text-[#0F1420]/65 mt-0.5">
            Configure all document parameters, routing, aircraft specifications, handling agents, services, and pricing breakdown.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#0F1420]/70">Currency:</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CHF">CHF</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleRegenerateNumbers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5F2EC] hover:bg-[#EAE6DE] border border-[#E0DAD0] text-xs font-mono font-bold text-[#0F1420]"
            title="Generate new Trip & Account numbers"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#C9A052]" />
            <span>Regenerate IDs</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Quote Creation Form */}
      <form onSubmit={handleGenerateQuote} className="space-y-6">
        
        {/* SECTION 1: Document Reference & Client Information */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                1. Quotation Details & Client (TO / DETAILS)
              </h3>
            </div>

            {/* Quick Prefill from CRM */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#0F1420]/70 font-semibold hidden sm:inline">
                Quick Select Client:
              </span>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientSelectChange(e.target.value)}
                className="bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-1.5 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} {c.companyName ? `(${c.companyName})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Document Reference Identifiers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-[#F5F2EC] rounded-xl border border-[#E0DAD0]">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                Trip Type
              </label>
              <select
                value={tripType}
                onChange={(e) => setTripType(e.target.value as any)}
                className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              >
                <option value="round_trip">RoundTripPlus</option>
                <option value="one_way">One-Way Charter</option>
                <option value="multi_leg">Multi-Leg Itinerary</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                Contract Date
              </label>
              <input
                type="text"
                value={contractDate}
                onChange={(e) => setContractDate(e.target.value)}
                required
                placeholder="01.10.2026"
                className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                Trip Number
              </label>
              <input
                type="text"
                value={tripNumber}
                onChange={(e) => setTripNumber(e.target.value)}
                required
                placeholder="PEU842-001"
                className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                placeholder="2{21737}"
                className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                Quote Expiration
              </label>
              <input
                type="text"
                value={quoteExpirationDate}
                onChange={(e) => setQuoteExpirationDate(e.target.value)}
                required
                placeholder="02.10.2026, 19:53z"
                className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-red-600 focus:outline-none focus:border-[#C9A052]"
              />
            </div>
          </div>

          {/* Client Details Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Client Full Name *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                placeholder="e.g. Edward Brinkmann"
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
                placeholder="e.g. Brinkmann Capital SAM"
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Client VAT / Tax ID
              </label>
              <input
                type="text"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder="e.g. US-8492041 or ATU 6335 7619"
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                required
                placeholder="e.g. e.brinkmann@luxurycap.com"
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Telephone / Mobile *
              </label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                required
                placeholder="e.g. +1 239 555 0192"
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="e.g. 3606 Enterprise Ave"
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                City, State / Postal Code & Country
              </label>
              <input
                type="text"
                value={clientCityCountry}
                onChange={(e) => setClientCityCountry(e.target.value)}
                placeholder="e.g. FL-34104 Naples, United States or MC-98000 Monaco"
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Aircraft Selection & Jet Specifications Override */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                2. Jet Details (Aircraft Specifications)
              </h3>
            </div>
            <span className="text-xs text-[#0F1420]/60 font-mono">
              Model: <strong className="text-[#0F1420]">{effectiveAircraft.name}</strong>
            </span>
          </div>

          {/* Visual Aircraft Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {fleetData.map((jet) => {
              const isSelected = selectedAircraftId === jet.id;
              return (
                <div
                  key={jet.id}
                  onClick={() => setSelectedAircraftId(jet.id)}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative ${
                    isSelected
                      ? "border-[#C9A052] bg-[#F5F2EC] shadow-sm"
                      : "border-[#E0DAD0] bg-white hover:border-[#C9A052]/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-xs text-[#0F1420]">{jet.name}</span>
                    <span className="text-[10px] font-mono font-bold bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30 px-1.5 py-0.5 rounded">
                      {jet.registration || "OE-FFB"}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-2">{jet.categoryLabel}</p>
                  <div className="text-[11px] font-mono text-[#0F1420]/80 space-y-0.5">
                    <p>Seats: <strong>{jet.passengers} Pax</strong></p>
                    <p>Rate: <strong>€{jet.pricePerHour.toLocaleString()}/hr</strong></p>
                    <p>Range: <strong>{jet.range} nm</strong></p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Jet Specifications Form Overrides */}
          <div className="p-4 bg-[#F5F2EC] rounded-xl border border-[#E0DAD0] space-y-3">
            <span className="text-[11px] font-mono font-bold uppercase text-[#0F1420]/80">
              Customize Jet Specifications for Quotation (Optional Overrides)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                  Model Label
                </label>
                <input
                  type="text"
                  placeholder={currentAircraft.name}
                  value={aircraftNameOverride}
                  onChange={(e) => setAircraftNameOverride(e.target.value)}
                  className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                  Tail Registration
                </label>
                <input
                  type="text"
                  placeholder={currentAircraft.registration || "OE-FFB"}
                  value={tailRegistrationOverride}
                  onChange={(e) => setTailRegistrationOverride(e.target.value)}
                  className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                  Year of Manufacture
                </label>
                <input
                  type="text"
                  placeholder={String(currentAircraft.yearOfManufacture || "2008 - 2010")}
                  value={yearOfManufactureOverride}
                  onChange={(e) => setYearOfManufactureOverride(e.target.value)}
                  className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                  Year Refurbished
                </label>
                <input
                  type="text"
                  placeholder="0"
                  value={yearOfRefurbishmentOverride}
                  onChange={(e) => setYearOfRefurbishmentOverride(e.target.value)}
                  className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                  Passenger Seats
                </label>
                <input
                  type="number"
                  placeholder={String(currentAircraft.passengers)}
                  value={passengerSeatsOverride}
                  onChange={(e) => setPassengerSeatsOverride(e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                  Enclosed Lavatory
                </label>
                <select
                  value={toiletteOverride ? "yes" : "no"}
                  onChange={(e) => setToiletteOverride(e.target.value === "yes")}
                  className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                >
                  <option value="yes">YES</option>
                  <option value="no">NO</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Flight Routing, Per-Leg Schedule & FBO Ground Handling */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
            <div className="flex items-center gap-2.5">
              <Plane className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                3. Routing Itinerary & FBO Ground Handling Agents
              </h3>
            </div>

            <button
              type="button"
              onClick={handleAddLeg}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F1420] text-white hover:bg-[#1A2338] text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#C9A052]" />
              <span>Add Flight Leg</span>
            </button>
          </div>

          <div className="space-y-4">
            {legs.map((leg, index) => (
              <div
                key={index}
                className="p-5 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0] space-y-4 shadow-sm"
              >
                {/* Leg Header Badge & Actions */}
                <div className="flex items-center justify-between border-b border-[#E0DAD0] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-[#0F1420] text-[#C9A052] font-mono font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-mono font-extrabold text-[#0F1420]">
                      Flight Leg #{index + 1}: {leg.originIcao} → {leg.destIcao}
                    </span>
                  </div>

                  {legs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLeg(index)}
                      className="flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove Leg</span>
                    </button>
                  )}
                </div>

                {/* Primary Flight Leg Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3 text-xs">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                      Origin Airport (ICAO)
                    </label>
                    <select
                      value={leg.originIcao}
                      onChange={(e) => handleLegChange(index, "originIcao", e.target.value)}
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-2 text-xs text-[#0F1420] font-mono font-bold focus:outline-none focus:border-[#C9A052]"
                    >
                      {airportsData.map((a) => (
                        <option key={a.icao} value={a.icao}>
                          {a.icao} - {a.city} ({a.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                      Destination Airport (ICAO)
                    </label>
                    <select
                      value={leg.destIcao}
                      onChange={(e) => handleLegChange(index, "destIcao", e.target.value)}
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-2 text-xs text-[#0F1420] font-mono font-bold focus:outline-none focus:border-[#C9A052]"
                    >
                      {airportsData.map((a) => (
                        <option key={a.icao} value={a.icao}>
                          {a.icao} - {a.city} ({a.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={leg.flightDate}
                      onChange={(e) => handleLegChange(index, "flightDate", e.target.value)}
                      required
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs text-[#0F1420] font-mono focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                      Departure (LT)
                    </label>
                    <input
                      type="text"
                      placeholder="11:00"
                      value={leg.departureTime}
                      onChange={(e) => handleLegChange(index, "departureTime", e.target.value)}
                      required
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs text-[#0F1420] font-mono font-bold focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                      Arrival (LT)
                    </label>
                    <input
                      type="text"
                      placeholder="11:55"
                      value={leg.arrivalTime}
                      onChange={(e) => handleLegChange(index, "arrivalTime", e.target.value)}
                      required
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs text-[#0F1420] font-mono font-bold focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                </div>

                {/* Secondary Leg Metadata: Pax, Callsign, Registration */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white/70 p-3 rounded-lg border border-[#E0DAD0]">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                      Passengers (# Pax)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={19}
                      value={leg.paxCount}
                      onChange={(e) => handleLegChange(index, "paxCount", Number(e.target.value))}
                      required
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                      Flight # / Callsign
                    </label>
                    <input
                      type="text"
                      placeholder="PEU842"
                      value={leg.flightNumber}
                      onChange={(e) => handleLegChange(index, "flightNumber", e.target.value)}
                      required
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                      Tail Registration
                    </label>
                    <input
                      type="text"
                      placeholder="OE-FFB"
                      value={leg.aircraftRegistration}
                      onChange={(e) => handleLegChange(index, "aircraftRegistration", e.target.value)}
                      required
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>
                </div>

                {/* FBO Ground Handling Agents for this Leg */}
                <div className="bg-white p-3.5 rounded-lg border border-[#E0DAD0] space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-[#0F1420]">
                    <Building className="w-3.5 h-3.5 text-[#C9A052]" />
                    <span>Handling Agents for Leg #{index + 1} (Displayed in Quotation Handling Table)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Departure Handler */}
                    <div className="p-2.5 bg-[#F9F8F5] rounded-lg border border-[#E0DAD0] space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#9A7A35]">
                        Departure Handler ({leg.originIcao})
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Jet Aviation"
                        value={leg.depHandlerName}
                        onChange={(e) => handleLegChange(index, "depHandlerName", e.target.value)}
                        className="w-full bg-white border border-[#E0DAD0] rounded-md px-2 py-1 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="tel"
                          placeholder="+41 58 158 1811"
                          value={leg.depHandlerPhone}
                          onChange={(e) => handleLegChange(index, "depHandlerPhone", e.target.value)}
                          className="w-full bg-white border border-[#E0DAD0] rounded-md px-2 py-1 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        />
                        <input
                          type="email"
                          placeholder="gvafbo@jetaviation.com"
                          value={leg.depHandlerEmail}
                          onChange={(e) => handleLegChange(index, "depHandlerEmail", e.target.value)}
                          className="w-full bg-white border border-[#E0DAD0] rounded-md px-2 py-1 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        />
                      </div>
                    </div>

                    {/* Arrival Handler */}
                    <div className="p-2.5 bg-[#F9F8F5] rounded-lg border border-[#E0DAD0] space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#9A7A35]">
                        Arrival Handler ({leg.destIcao})
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Ags Ops"
                        value={leg.arrHandlerName}
                        onChange={(e) => handleLegChange(index, "arrHandlerName", e.target.value)}
                        className="w-full bg-white border border-[#E0DAD0] rounded-md px-2 py-1 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="tel"
                          placeholder="+39 010 601 5412"
                          value={leg.arrHandlerPhone}
                          onChange={(e) => handleLegChange(index, "arrHandlerPhone", e.target.value)}
                          className="w-full bg-white border border-[#E0DAD0] rounded-md px-2 py-1 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        />
                        <input
                          type="email"
                          placeholder="dutymanager@airport.genova.it"
                          value={leg.arrHandlerEmail}
                          onChange={(e) => handleLegChange(index, "arrHandlerEmail", e.target.value)}
                          className="w-full bg-white border border-[#E0DAD0] rounded-md px-2 py-1 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: Additional Services, De-Icing & Carbon Offset (Pages 2 & 3 of PDF) */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E0DAD0]">
            <Shield className="w-4 h-4 text-[#C9A052]" />
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#0F1420]">
              4. Additional Services, De-Icing, Cancellation Insurance & Carbon Offset (Pages 2 & 3)
            </h3>
          </div>

          {/* Last-Minute Trip Cancellation Insurance (Page 2) */}
          <div className="p-4 rounded-xl bg-[#C9A052]/10 border border-[#C9A052]/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F1420]">
                Last - Minute Trip Cancellation Insurance (Quotation Page 2)
              </span>
              <span className="text-xs font-mono font-bold text-[#9A7A35]">€ 1 000.- / leg</span>
            </div>
            <p className="text-xs text-[#0F1420]/75">
              Client can cancel free of charge up to 24 hours before confirmed departure time.
            </p>
            <label className="flex items-center gap-2.5 text-xs font-bold text-[#0F1420] pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={!!services.cancellationInsurance}
                onChange={(e) => setServices({ ...services, cancellationInsurance: e.target.checked })}
                className="rounded text-[#C9A052] focus:ring-[#C9A052] h-4 w-4"
              />
              <span>Opt-in: Include free of charge trip cancellation up to 24h before departure</span>
            </label>
          </div>

          {/* Catering & Ground Transfers (Page 3) */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase text-[#0F1420]">
              Catering & Partner Services (Quotation Page 3)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-[#E0DAD0] bg-[#FDFCFA] hover:bg-[#F5F2EC] cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={services.limousineService}
                  onChange={(e) => setServices({ ...services, limousineService: e.target.checked })}
                  className="rounded text-[#C9A052] focus:ring-[#C9A052]"
                />
                <span className="font-medium text-[#0F1420]">VIP Limousine Service</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-[#E0DAD0] bg-[#FDFCFA] hover:bg-[#F5F2EC] cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={services.luxuryCarRental}
                  onChange={(e) => setServices({ ...services, luxuryCarRental: e.target.checked })}
                  className="rounded text-[#C9A052] focus:ring-[#C9A052]"
                />
                <span className="font-medium text-[#0F1420]">Luxury Car Rental</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-[#E0DAD0] bg-[#FDFCFA] hover:bg-[#F5F2EC] cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={services.helicopterService}
                  onChange={(e) => setServices({ ...services, helicopterService: e.target.checked })}
                  className="rounded text-[#C9A052] focus:ring-[#C9A052]"
                />
                <span className="font-medium text-[#0F1420]">Helicopter Transfer</span>
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Bespoke In-Flight VIP Catering & Any Other Services
              </label>
              <input
                type="text"
                placeholder="e.g. Taittinger Champagne, artisanal canapés, gluten-free warm meals"
                value={services.vipCateringDetails || ""}
                onChange={(e) => setServices({ ...services, vipCateringDetails: e.target.value })}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>
          </div>

          {/* De-Icing Protection Insurance (Page 3) */}
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase text-[#0F1420]">
              De-Icing Insurance Options (Quotation Page 3)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label className={`p-3 rounded-xl border cursor-pointer transition-all ${services.deicingInsurance === "none" ? "border-[#C9A052] bg-[#C9A052]/10" : "border-[#E0DAD0] bg-white"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="deicing"
                    checked={services.deicingInsurance === "none"}
                    onChange={() => setServices({ ...services, deicingInsurance: "none", deicingCostPerLeg: 0 })}
                  />
                  <span className="font-bold text-[#0F1420]">Uninsured</span>
                </div>
                <p className="text-[11px] text-gray-500 pl-5">Billed post-flight if incurred (&gt;€2,500)</p>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer transition-all ${services.deicingInsurance === "at_reservation" ? "border-[#C9A052] bg-[#C9A052]/10" : "border-[#E0DAD0] bg-white"}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="deicing"
                      checked={services.deicingInsurance === "at_reservation"}
                      onChange={() => setServices({ ...services, deicingInsurance: "at_reservation", deicingCostPerLeg: 400 })}
                    />
                    <span className="font-bold text-[#0F1420]">Option 1: At Reservation</span>
                  </div>
                  <span className="font-mono font-bold text-[#9A7A35]">€400/leg</span>
                </div>
                <p className="text-[11px] text-gray-500 pl-5">Secure upon signing agreement</p>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer transition-all ${services.deicingInsurance === "within_48h" ? "border-[#C9A052] bg-[#C9A052]/10" : "border-[#E0DAD0] bg-white"}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="deicing"
                      checked={services.deicingInsurance === "within_48h"}
                      onChange={() => setServices({ ...services, deicingInsurance: "within_48h", deicingCostPerLeg: 800 })}
                    />
                    <span className="font-bold text-[#0F1420]">Option 2: Book Later</span>
                  </div>
                  <span className="font-mono font-bold text-gray-700">€800/leg</span>
                </div>
                <p className="text-[11px] text-gray-500 pl-5">Book up to 48h before flight</p>
              </label>
            </div>
          </div>

          {/* Carbon Offset Program (Page 3) */}
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase text-[#0F1420]">
              Carbon Offset Program (Quotation Page 3)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <label className={`p-3 rounded-xl border cursor-pointer transition-all ${services.carbonOffset === "none" ? "border-[#C9A052] bg-[#C9A052]/10" : "border-[#E0DAD0] bg-white"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="carbon"
                    checked={services.carbonOffset === "none"}
                    onChange={() => setServices({ ...services, carbonOffset: "none", carbonOffsetRatePerHour: 0 })}
                  />
                  <span className="font-bold text-[#0F1420]">None</span>
                </div>
                <p className="text-[11px] text-gray-500 pl-5">Standard emissions</p>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer transition-all ${services.carbonOffset === "neutral" ? "border-[#C9A052] bg-[#C9A052]/10" : "border-[#E0DAD0] bg-white"}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="carbon"
                      checked={services.carbonOffset === "neutral"}
                      onChange={() => setServices({ ...services, carbonOffset: "neutral", carbonOffsetRatePerHour: 33 })}
                    />
                    <span className="font-bold text-[#0F1420]">Fly Neutral</span>
                  </div>
                  <span className="font-mono text-[11px] text-gray-600">€33/hr</span>
                </div>
                <p className="text-[11px] text-gray-500 pl-5">Compensate 100%</p>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer transition-all ${services.carbonOffset === "positive" ? "border-[#C9A052] bg-[#C9A052]/10" : "border-[#E0DAD0] bg-white"}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="carbon"
                      checked={services.carbonOffset === "positive"}
                      onChange={() => setServices({ ...services, carbonOffset: "positive", carbonOffsetRatePerHour: 50 })}
                    />
                    <span className="font-bold text-[#0F1420]">Fly Positive</span>
                  </div>
                  <span className="font-mono text-[11px] text-gray-600">€50/hr</span>
                </div>
                <p className="text-[11px] text-gray-500 pl-5">+50% extra offset</p>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer transition-all ${services.carbonOffset === "double_neutral" ? "border-[#C9A052] bg-[#C9A052]/10" : "border-[#E0DAD0] bg-white"}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="carbon"
                      checked={services.carbonOffset === "double_neutral"}
                      onChange={() => setServices({ ...services, carbonOffset: "double_neutral", carbonOffsetRatePerHour: 66 })}
                    />
                    <span className="font-bold text-[#0F1420]">Fly Double</span>
                  </div>
                  <span className="font-mono text-[11px] text-gray-600">€66/hr</span>
                </div>
                <p className="text-[11px] text-gray-500 pl-5">200% carbon offset</p>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 5: Detailed Pricing Itemization & Overrides */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
            <div className="flex items-center gap-2.5">
              <Receipt className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                5. Pricing Breakdown Line Items (Quotation Page 1)
              </h3>
            </div>

            <label className="flex items-center gap-2 text-xs font-mono font-bold text-[#0F1420] cursor-pointer">
              <input
                type="checkbox"
                checked={overridePricing}
                onChange={(e) => setOverridePricing(e.target.checked)}
                className="rounded text-[#C9A052] focus:ring-[#C9A052]"
              />
              <span>Manual Line-Item Overrides</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                Flight Price
              </label>
              <input
                type="number"
                value={effectivePricing.flightPrice}
                onChange={(e) => setCustomFlightPrice(Number(e.target.value))}
                disabled={!overridePricing}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0F1420] disabled:bg-[#F5F2EC] disabled:opacity-80 focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                - Airport Fees
              </label>
              <input
                type="number"
                value={effectivePricing.airportFees}
                onChange={(e) => setCustomAirportFees(Number(e.target.value))}
                disabled={!overridePricing}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono text-[#0F1420] disabled:bg-[#F5F2EC] disabled:opacity-80 focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                - Passenger Fees
              </label>
              <input
                type="number"
                value={effectivePricing.passengerFees}
                onChange={(e) => setCustomPassengerFees(Number(e.target.value))}
                disabled={!overridePricing}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono text-[#0F1420] disabled:bg-[#F5F2EC] disabled:opacity-80 focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                - Day of Week Discount
              </label>
              <input
                type="number"
                value={effectivePricing.dayOfWeekDiscount}
                onChange={(e) => setCustomDayOfWeekDiscount(Number(e.target.value))}
                disabled={!overridePricing}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono text-emerald-700 font-bold disabled:bg-[#F5F2EC] disabled:opacity-80 focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                - Inbound Passenger Tax
              </label>
              <input
                type="number"
                value={effectivePricing.inboundPassengerTax}
                onChange={(e) => setCustomInboundTax(Number(e.target.value))}
                disabled={!overridePricing}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono text-[#0F1420] disabled:bg-[#F5F2EC] disabled:opacity-80 focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                - Outbound Passenger Tax
              </label>
              <input
                type="number"
                value={effectivePricing.outboundPassengerTax}
                onChange={(e) => setCustomOutboundTax(Number(e.target.value))}
                disabled={!overridePricing}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono text-[#0F1420] disabled:bg-[#F5F2EC] disabled:opacity-80 focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                Additional Services Total
              </label>
              <input
                type="number"
                value={effectivePricing.additionalServicesTotal}
                onChange={(e) => setCustomAdditionalServices(Number(e.target.value))}
                disabled={!overridePricing}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono text-[#0F1420] disabled:bg-[#F5F2EC] disabled:opacity-80 focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#0F1420]/70 mb-1">
                European VAT Rate (0%)
              </label>
              <input
                type="text"
                value="0% (§6 Abs. 1 Zif. 3)"
                disabled
                className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono text-emerald-800 font-bold opacity-80"
              />
            </div>
          </div>
        </div>

        {/* SECTION 6: Payment Conditions & Bank References (Page 1 Footer) */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E0DAD0]">
            <Landmark className="w-4 h-4 text-[#C9A052]" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
              6. Payment Terms & Wire References (Quotation Page 1 Footer)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                IBAN Number
              </label>
              <input
                type="text"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                BIC / SWIFT
              </label>
              <input
                type="text"
                value={bic}
                onChange={(e) => setBic(e.target.value)}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Account Holder
              </label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>
          </div>
        </div>

        {/* SECTION 7: Live Pricing Total & Action Submission */}
        <div className="bg-[#0F1420] text-white border border-[#1C2436] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1C2436]">
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-[#C9A052] font-bold">
                FINAL TOTAL CHARTER FLIGHT PRICE
              </span>
              <h3 className="text-3xl font-black text-white font-mono mt-0.5">
                {formatCurrency(effectivePricing.totalFlightPrice, currency)}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Subtotal: {formatCurrency(effectivePricing.subtotal, currency)} • International Aviation VAT Exempt 0% (§6 Abs. 1 Zif. 3)
              </p>
            </div>

            {/* Primary Gold Generation Button */}
            <button
              type="submit"
              className="py-3.5 px-8 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Official Quotation PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
            <div>
              <span className="text-gray-400 text-[10px]">BASE FLIGHT</span>
              <p className="font-bold text-gray-200">{formatCurrency(effectivePricing.flightPrice, currency)}</p>
            </div>
            <div>
              <span className="text-gray-400 text-[10px]">AIRPORT FEES</span>
              <p className="font-bold text-gray-200">{formatCurrency(effectivePricing.airportFees, currency)}</p>
            </div>
            <div>
              <span className="text-gray-400 text-[10px]">PASSENGER FEES</span>
              <p className="font-bold text-gray-200">{formatCurrency(effectivePricing.passengerFees, currency)}</p>
            </div>
            <div>
              <span className="text-gray-400 text-[10px]">SERVICES & INS.</span>
              <p className="font-bold text-gray-200">{formatCurrency(effectivePricing.additionalServicesTotal, currency)}</p>
            </div>
            <div>
              <span className="text-[#C9A052] text-[10px]">FINAL TOTAL</span>
              <p className="font-black text-[#C9A052] text-sm">{formatCurrency(effectivePricing.totalFlightPrice, currency)}</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useAviation } from "@/lib/aviationContext";
import { Booking, FlightLeg, TripType } from "@/types/aviation";
import { airportsData, findAirportByCode, getAirportFbos } from "@/data/airports";
import { fleetData } from "@/data/fleet";
import { defaultOperator } from "@/data/initialBookings";
import { formatCurrency, calculateCardFee } from "@/lib/pricingCalculator";
import {
  ScrollText,
  Plane,
  User,
  Calendar,
  Building,
  CheckCircle2,
  FileText,
  DollarSign,
  Landmark,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  ShieldCheck,
  Search,
  ArrowRight,
  CreditCard,
  AlertTriangle
} from "lucide-react";

export default function GenerateContractView() {
  const { bookings, addBooking, openDocument, setActiveNav, addAuditEntry, currentUser } = useAviation();

  // Search / Lookup input (Key in Trip #, Quote Ref, or Invoice #)
  const [lookupQuery, setLookupQuery] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState<string>(bookings[0]?.id || "");

  // Contract Metadata
  const [contractRef, setContractRef] = useState("CA-PEU842-001");
  const [tripNumber, setTripNumber] = useState("PEU842-001");
  const [accountNumber, setAccountNumber] = useState("ACC-21737");
  const [contractDate, setContractDate] = useState("02.10.2026");
  const [paymentDueDate, setPaymentDueDate] = useState("03.10.2026");
  const [currency, setCurrency] = useState<"EUR" | "USD" | "GBP" | "CHF">("EUR");

  // Carrier (The Operator)
  const [carrierEntity, setCarrierEntity] = useState(defaultOperator.legalEntity);
  const [carrierRegistry, setCarrierRegistry] = useState(defaultOperator.commercialRegistry);
  const [carrierVat, setCarrierVat] = useState(defaultOperator.vatNumber);
  const [carrierRep, setCarrierRep] = useState(defaultOperator.representativeName);

  // Charterer (Client)
  const [clientName, setClientName] = useState("Edward Brinkmann");
  const [companyName, setCompanyName] = useState("Brinkmann Capital SAM");
  const [clientEmail, setClientEmail] = useState("e.brinkmann@luxurycap.com");
  const [clientPhone, setClientPhone] = useState("+1 239 555 0192");
  const [streetAddress, setStreetAddress] = useState("3606 Enterprise Ave");
  const [cityCountry, setCityCountry] = useState("FL-34104 Naples, United States");

  // Aircraft & Itinerary
  const [aircraftName, setAircraftName] = useState("Cessna Citation Mustang");
  const [aircraftCategory, setAircraftCategory] = useState("Entry Level Jet");
  const [passengerSeats, setPassengerSeats] = useState(4);
  const [tripType, setTripType] = useState<TripType>("round_trip");

  const [legs, setLegs] = useState<FlightLeg[]>([
    {
      legNumber: 1,
      flightDate: "2026-10-03",
      origin: findAirportByCode("LSGG") || airportsData[0],
      destination: findAirportByCode("LIMJ") || airportsData[1],
      departureTimeLocal: "11:00 h",
      arrivalTimeLocal: "11:55 h",
      flightTimeFormatted: "00:55",
      paxCount: 2,
      flightNumber: "PEU842",
      aircraftRegistration: "OE-FFB",
      crew: [
        { role: "CMDR", name: "Captain Audrain", phone: "+43 664 8489 904" },
        { role: "F/O", name: "First Officer Hajar", phone: "+43 664 8489 928" },
        { role: "Cabin Attendant", name: "Claire Dupont", phone: "+33 6 44 19 88 03" }
      ],
      passengers: [
        { id: "p1", fullName: "Edward Brinkmann", isLeadPassenger: true }
      ],
      departureHandling: { name: "Signature Flight Support", airportCode: "LSGG", phone: "+41 22 717 8400", email: "gva@signatureflight.com" },
      arrivalHandling: { name: "Genoa Aviation Services", airportCode: "LIMJ", phone: "+39 010 601 5459", email: "ops@genoa-aviation.it" }
    },
    {
      legNumber: 2,
      flightDate: "2026-10-06",
      origin: findAirportByCode("LIMJ") || airportsData[1],
      destination: findAirportByCode("LSGG") || airportsData[0],
      departureTimeLocal: "15:00 h",
      arrivalTimeLocal: "16:04 h",
      flightTimeFormatted: "01:04",
      paxCount: 2,
      flightNumber: "PEU842",
      aircraftRegistration: "OE-FFB",
      crew: [
        { role: "CMDR", name: "Captain Audrain", phone: "+43 664 8489 904" },
        { role: "F/O", name: "First Officer Hajar", phone: "+43 664 8489 928" },
        { role: "Cabin Attendant", name: "Claire Dupont", phone: "+33 6 44 19 88 03" }
      ],
      passengers: [
        { id: "p1", fullName: "Edward Brinkmann", isLeadPassenger: true }
      ],
      departureHandling: { name: "Genoa Aviation Services", airportCode: "LIMJ", phone: "+39 010 601 5459", email: "ops@genoa-aviation.it" },
      arrivalHandling: { name: "Signature Flight Support", airportCode: "LSGG", phone: "+41 22 717 8400", email: "gva@signatureflight.com" }
    }
  ]);

  // Pricing & Terms
  const [flightPrice, setFlightPrice] = useState<number>(11500);
  const [airportFees, setAirportFees] = useState<number>(1140);
  const [passengerFees, setPassengerFees] = useState<number>(80);
  const [paymentChoice, setPaymentChoice] = useState<"wire" | "card">("wire");
  const cardFee = calculateCardFee(flightPrice + airportFees + passengerFees);

  const [signatoryCarrier, setSignatoryCarrier] = useState(defaultOperator.representativeName);
  const [signatoryClient, setSignatoryClient] = useState("Edward Brinkmann");
  const [hasAgreedTerms, setHasAgreedTerms] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Sync when selected booking changes
  const populateFromBooking = (b: Booking) => {
    setSelectedBookingId(b.id);
    setTripNumber(b.tripNumber || `PEU842-${b.id.slice(-3)}`);
    setContractRef(`CA-${b.tripNumber || b.quoteReference || b.id}`);
    setAccountNumber(b.accountNumber || b.client.accountNumber || "ACC-21737");
    setContractDate(b.contractDate || "02.10.2026");
    setPaymentDueDate(b.paymentDueDate || "03.10.2026");
    setCurrency(b.pricing?.currency || "EUR");

    setCarrierEntity(b.operator.legalEntity || defaultOperator.legalEntity);
    setCarrierRegistry(b.operator.commercialRegistry || defaultOperator.commercialRegistry);
    setCarrierVat(b.operator.vatNumber || defaultOperator.vatNumber);
    setCarrierRep(b.operator.representativeName || defaultOperator.representativeName);

    setClientName(b.client.fullName);
    setCompanyName(b.client.companyName || b.client.fullName);
    setClientEmail(b.client.email);
    setClientPhone(b.client.phone);
    setStreetAddress(b.client.streetAddress);
    setCityCountry(b.client.cityPostalCountry);

    setAircraftName(b.aircraft.name);
    setAircraftCategory(b.aircraft.categoryLabel || "Executive Jet");
    setPassengerSeats(b.aircraft.passengers);
    setTripType(b.tripType || "round_trip");

    if (b.legs && b.legs.length > 0) {
      setLegs(b.legs);
    }

    if (b.pricing) {
      setFlightPrice(b.pricing.flightPrice || 11500);
      setAirportFees(b.pricing.airportFees || 1140);
      setPassengerFees(b.pricing.passengerFees || 80);
    }

    setSignatoryCarrier(b.operator.representativeName || defaultOperator.representativeName);
    setSignatoryClient(b.client.fullName);
  };

  const handleBookingSelect = (id: string) => {
    const b = bookings.find((item) => item.id === id);
    if (b) {
      populateFromBooking(b);
    }
  };

  // Quick lookup by keying in Trip #, Invoice #, or Quote Ref
  const handleKeyedLookup = (query: string) => {
    setLookupQuery(query);
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return;

    const matched = bookings.find((b) =>
      (b.tripNumber && b.tripNumber.toLowerCase().includes(trimmed)) ||
      (b.quoteReference && b.quoteReference.toLowerCase().includes(trimmed)) ||
      (b.invoiceNumber && b.invoiceNumber.toLowerCase().includes(trimmed)) ||
      (b.accountNumber && b.accountNumber.toLowerCase().includes(trimmed)) ||
      (b.client.fullName.toLowerCase().includes(trimmed))
    );

    if (matched) {
      populateFromBooking(matched);
      setFeedbackMsg(`✓ Matched record for ${matched.client.fullName} (${matched.tripNumber || matched.quoteReference})`);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const totalAmount = flightPrice + airportFees + passengerFees;

  // Build current Booking object for preview or execution
  const currentContractBooking: Booking = {
    id: selectedBookingId || `booking-${Date.now()}`,
    tripNumber: tripNumber || `PEU842-${Math.floor(100 + Math.random() * 900)}`,
    invoiceNumber: "00106020",
    quoteReference: `QTE-${Date.now().toString().slice(-6)}`,
    accountNumber: accountNumber,
    contractDate,
    quoteExpirationDate: "02.10.2026, 19:53z",
    paymentDueDate,
    status: "confirmed",
    quoteStatus: "accepted",
    paymentStatus: "unpaid",
    tripType,
    client: {
      fullName: clientName,
      companyName,
      email: clientEmail,
      phone: clientPhone,
      streetAddress,
      cityPostalCountry: cityCountry,
      accountNumber
    },
    operator: {
      ...defaultOperator,
      companyName: carrierEntity,
      legalEntity: carrierEntity,
      commercialRegistry: carrierRegistry,
      vatNumber: carrierVat,
      representativeName: carrierRep
    },
    aircraft: {
      id: "contract-ac",
      name: aircraftName,
      manufacturer: aircraftName.split(" ")[0] || "Cessna",
      category: "light",
      categoryLabel: aircraftCategory,
      registration: "", // Tail number omitted from client-facing view
      tagline: "Executive charter aircraft",
      description: "Dedicated executive charter aircraft configured for passenger comfort.",
      passengers: passengerSeats,
      passengersLabel: `${passengerSeats} passengers`,
      range: 2000,
      rangeLabel: "2,000 nm",
      cabinHeight: "1.45 m",
      cabinWidth: "1.48 m",
      baggageVolume: "59 cu ft",
      cruiseSpeed: "410 ktas",
      yearOfManufacture: 2018,
      yearOfRefurbishment: 2023,
      pricePerHour: 2800,
      toilette: true,
      smokingCabin: false,
      imageExterior: "/images/fleet/citation-mustang/exterior.jpg",
      imageInterior: "/images/fleet/citation-mustang/interior.jpg"
    },
    legs,
    pricing: {
      flightPrice,
      airportFees,
      passengerFees,
      dayOfWeekDiscount: 0,
      inboundPassengerTax: 0,
      outboundPassengerTax: 0,
      additionalServicesTotal: 0,
      subtotal: totalAmount,
      vatRate: 0,
      vatAmount: 0,
      totalFlightPrice: totalAmount,
      currency
    },
    services: {
      limousineService: false,
      luxuryCarRental: false,
      helicopterService: false,
      deicingInsurance: "none",
      deicingCostPerLeg: 0,
      carbonOffset: "none",
      carbonOffsetRatePerHour: 0
    },
    checklist: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Preview Document
  const handlePreviewContract = () => {
    openDocument(currentContractBooking, "charter_agreement");
  };

  // Sign & Book Flight -> Moves directly to Bookings Tab
  const handleConfirmAndBook = () => {
    const officialTripNumber = tripNumber && tripNumber.trim() !== "" ? tripNumber : `PEU842-${Math.floor(100 + Math.random() * 900)}`;
    const finalBooking: Booking = {
      ...currentContractBooking,
      tripNumber: officialTripNumber,
      status: "confirmed",
      quoteStatus: "accepted",
      paymentMethodChoice: paymentChoice,
      cardFeePercentage: 3.5,
      cardFeeAmount: paymentChoice === "card" ? cardFee.feeAmount : 0,
      totalWithCardFee: paymentChoice === "card" ? cardFee.totalWithFee : totalAmount
    };

    addBooking(finalBooking);

    if (currentUser) {
      addAuditEntry({
        userEmail: currentUser.email,
        userName: currentUser.name,
        action: "CONTRACT_EXECUTED",
        entityType: "Contract",
        entityId: officialTripNumber,
        details: `Charter Agreement ${contractRef} executed for client ${clientName}. Confirmed as flight ${officialTripNumber}.`
      });
    }

    setFeedbackMsg(`Success! Flight confirmed under Trip #${officialTripNumber}. Redirecting to Bookings...`);
    setTimeout(() => {
      setActiveNav("bookings");
    }, 900);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F1420] text-white p-6 sm:p-8 rounded-2xl border border-[#1C2436] shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#C9A052]/20 text-[#C9A052] border border-[#C9A052]/30">
              <ScrollText className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-bold tracking-wider text-[#C9A052] uppercase">
              Legal Documents Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight">
            Aircraft Charter Agreement
          </h1>
          <p className="text-xs sm:text-sm text-gray-300">
            Generate, customize, and legally execute binding air carriage agreements under Austrian Law.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePreviewContract}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#141A29] text-gray-200 border border-[#242F48] hover:bg-[#1E2638] hover:text-white transition-all shadow-md"
          >
            <FileText className="w-4 h-4 text-[#C9A052]" />
            Preview Contract PDF
          </button>
          <button
            onClick={handleConfirmAndBook}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#C9A052] text-[#0F1420] hover:bg-[#dbb366] transition-all shadow-lg shadow-[#C9A052]/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            Sign & Book Flight
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {feedbackMsg}
        </div>
      )}

      {/* Booking / Key-in Lookup Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#E0DAD0] shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-6">
          <label className="block text-[11px] font-mono uppercase text-gray-500 font-bold mb-1.5 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-[#C9A052]" />
            Key in Trip #, Invoice #, Quote Ref, or Account #
          </label>
          <input
            type="text"
            value={lookupQuery}
            onChange={(e) => handleKeyedLookup(e.target.value)}
            placeholder="Type e.g. PEU842, 00106020, QTE-2026, or ACC-21737 to auto-fill..."
            className="w-full text-xs bg-[#FBF9F5] border border-gray-300 rounded-xl px-3.5 py-2.5 font-mono focus:border-[#C9A052] focus:bg-white outline-none"
          />
        </div>

        <div className="md:col-span-6">
          <label className="block text-[11px] font-mono uppercase text-gray-500 font-bold mb-1.5">
            Or Select From Existing Proposals & Bookings:
          </label>
          <select
            value={selectedBookingId}
            onChange={(e) => handleBookingSelect(e.target.value)}
            className="w-full text-xs bg-[#FBF9F5] border border-gray-300 rounded-xl px-3.5 py-2.5 font-medium focus:border-[#C9A052] focus:bg-white outline-none"
          >
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.tripNumber ? `[Trip: ${b.tripNumber}]` : `[Quote: ${b.quoteReference || b.id}]`} - {b.client.fullName} ({b.aircraft.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: 2 Columns for Parties & Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: The Carrier (Operator) */}
        <div className="bg-white p-6 rounded-2xl border border-[#E0DAD0] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-[#C9A052]" />
              1. The Carrier (Private Jet Operator)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              EASA Part-CAT
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Carrier Legal Entity</label>
              <input
                type="text"
                value={carrierEntity}
                onChange={(e) => setCarrierEntity(e.target.value)}
                className="w-full bg-[#FBF9F5] border border-gray-300 rounded-xl px-3 py-2 font-medium focus:border-[#C9A052] outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Commercial Registry</label>
                <input
                  type="text"
                  value={carrierRegistry}
                  onChange={(e) => setCarrierRegistry(e.target.value)}
                  className="w-full bg-[#FBF9F5] border border-gray-300 rounded-xl px-3 py-2 font-mono text-gray-700 focus:border-[#C9A052] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">VAT Number</label>
                <input
                  type="text"
                  value={carrierVat}
                  onChange={(e) => setCarrierVat(e.target.value)}
                  className="w-full bg-[#FBF9F5] border border-gray-300 rounded-xl px-3 py-2 font-mono text-gray-700 focus:border-[#C9A052] outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Authorized Carrier Officer</label>
              <input
                type="text"
                value={carrierRep}
                onChange={(e) => setCarrierRep(e.target.value)}
                className="w-full bg-[#FBF9F5] border border-gray-300 rounded-xl px-3 py-2 font-medium focus:border-[#C9A052] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: The Charterer (Client) */}
        <div className="bg-white p-6 rounded-2xl border border-[#E0DAD0] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
              <User className="w-4 h-4 text-[#C9A052]" />
              2. The Charterer (Client Account)
            </h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Ref: {accountNumber}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Charterer Full Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-[#FBF9F5] border border-gray-300 rounded-xl px-3 py-2 font-medium focus:border-[#C9A052] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Linked Account #</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-gray-100 border border-gray-300 rounded-xl px-3 py-2 font-mono text-gray-700 font-bold focus:border-[#C9A052] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Company / Entity</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#FBF9F5] border border-gray-300 rounded-xl px-3 py-2 focus:border-[#C9A052] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Client Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-[#FBF9F5] border border-gray-300 rounded-xl px-3 py-2 focus:border-[#C9A052] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Billing Street Address</label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full bg-[#FBF9F5] border border-gray-300 rounded-xl px-3 py-2 focus:border-[#C9A052] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">City, State / Country</label>
                <input
                  type="text"
                  value={cityCountry}
                  onChange={(e) => setCityCountry(e.target.value)}
                  className="w-full bg-[#FBF9F5] border border-gray-300 rounded-xl px-3 py-2 focus:border-[#C9A052] outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Aircraft & Flight Routing Schedule */}
      <div className="bg-white p-6 rounded-2xl border border-[#E0DAD0] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-200 gap-2">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
            <Plane className="w-4 h-4 text-[#C9A052]" />
            3. Designated Aircraft & Routing Schedule
          </h3>
          <span className="text-xs text-gray-500 font-mono">
            Note: Aircraft tail numbers omitted from quotation & contract view.
          </span>
        </div>

        {/* Aircraft details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#FBF9F5] p-4 rounded-xl border border-gray-200 text-xs">
          <div>
            <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Aircraft Model</label>
            <select
              value={aircraftName}
              onChange={(e) => {
                const found = fleetData.find((f) => f.name === e.target.value);
                setAircraftName(e.target.value);
                if (found) {
                  setAircraftCategory(found.categoryLabel);
                  setPassengerSeats(found.passengers);
                }
              }}
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 font-bold text-gray-900 focus:border-[#C9A052] outline-none"
            >
              {fleetData.map((f) => (
                <option key={f.id} value={f.name}>
                  {f.name} ({f.categoryLabel})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Aircraft Category</label>
            <input
              type="text"
              value={aircraftCategory}
              onChange={(e) => setAircraftCategory(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 font-medium focus:border-[#C9A052] outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Passenger Seats</label>
            <input
              type="number"
              value={passengerSeats}
              onChange={(e) => setPassengerSeats(Number(e.target.value))}
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 font-medium focus:border-[#C9A052] outline-none"
            />
          </div>
        </div>

        {/* Flight Legs Table with Airport Dropdowns */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-gray-700">Flight Legs</span>
            <button
              onClick={() => {
                const last = legs[legs.length - 1];
                const nextLeg: FlightLeg = {
                  legNumber: legs.length + 1,
                  flightDate: last ? last.flightDate : "2026-10-06",
                  origin: last ? last.destination : airportsData[0],
                  destination: airportsData[1],
                  departureTimeLocal: "14:00 h",
                  arrivalTimeLocal: "15:30 h",
                  flightTimeFormatted: "01:30",
                  paxCount: 2,
                  flightNumber: `PEU842-00${legs.length + 1}`,
                  aircraftRegistration: last ? last.aircraftRegistration : "OE-FFB",
                  crew: last ? last.crew : [],
                  passengers: last ? last.passengers : [],
                  departureHandling: last ? last.arrivalHandling : { name: "Signature Flight Support", airportCode: "LSGG", phone: "+41 22 717 8400", email: "gva@signatureflight.com" },
                  arrivalHandling: { name: "Handling Agent", airportCode: "LIMJ", phone: "+39 010 601 5459", email: "ops@handling.com" }
                };
                setLegs([...legs, nextLeg]);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#141A29] text-[#C9A052] hover:bg-[#1E2638] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Leg
            </button>
          </div>

          <div className="space-y-3">
            {legs.map((leg, index) => (
              <div key={index} className="p-4 bg-[#FBF9F5] border border-gray-200 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs">
                <div className="md:col-span-1 text-center font-mono font-bold text-[#C9A052] text-sm">
                  Leg {leg.legNumber}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Date</label>
                  <input
                    type="text"
                    value={leg.flightDate}
                    onChange={(e) => {
                      const updated = [...legs];
                      updated[index].flightDate = e.target.value;
                      setLegs(updated);
                    }}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 font-mono focus:border-[#C9A052] outline-none"
                  />
                </div>

                {/* Origin Dropdown */}
                <div className="md:col-span-3 space-y-1.5">
                  <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Origin Airport & FBO</label>
                  <select
                    value={leg.origin.icao}
                    onChange={(e) => {
                      const found = airportsData.find((a) => a.icao === e.target.value);
                      if (found) {
                        const updated = [...legs];
                        updated[index].origin = found;
                        const fbos = getAirportFbos(found.icao);
                        if (fbos.length > 0) {
                          updated[index].departureHandling = {
                            name: fbos[0].name,
                            airportCode: found.icao,
                            phone: fbos[0].phone || "",
                            email: fbos[0].email || ""
                          };
                        }
                        setLegs(updated);
                      }
                    }}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 font-medium focus:border-[#C9A052] outline-none text-[11px]"
                  >
                    {airportsData.map((a) => (
                      <option key={a.icao} value={a.icao}>
                        [{a.icao}] {a.city} — {a.name}
                      </option>
                    ))}
                  </select>

                  {/* FBO Picker */}
                  {getAirportFbos(leg.origin.icao).length > 0 && (
                    <select
                      value={getAirportFbos(leg.origin.icao).find((f) => f.name === leg.departureHandling?.name)?.id || ""}
                      onChange={(e) => {
                        const found = getAirportFbos(leg.origin.icao).find((f) => f.id === e.target.value);
                        if (found) {
                          const updated = [...legs];
                          updated[index].departureHandling = {
                            name: found.name,
                            airportCode: leg.origin.icao,
                            phone: found.phone || "",
                            email: found.email || ""
                          };
                          setLegs(updated);
                        }
                      }}
                      className="w-full bg-[#F5F2EC] border border-[#C9A052]/40 rounded-lg px-2 py-1 text-[10px] font-semibold text-[#0F1420] outline-none"
                    >
                      {getAirportFbos(leg.origin.icao).map((f) => (
                        <option key={f.id} value={f.id}>
                          FBO: {f.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Destination Dropdown */}
                <div className="md:col-span-3 space-y-1.5">
                  <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Destination Airport & FBO</label>
                  <select
                    value={leg.destination.icao}
                    onChange={(e) => {
                      const found = airportsData.find((a) => a.icao === e.target.value);
                      if (found) {
                        const updated = [...legs];
                        updated[index].destination = found;
                        const fbos = getAirportFbos(found.icao);
                        if (fbos.length > 0) {
                          updated[index].arrivalHandling = {
                            name: fbos[0].name,
                            airportCode: found.icao,
                            phone: fbos[0].phone || "",
                            email: fbos[0].email || ""
                          };
                        }
                        setLegs(updated);
                      }
                    }}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 font-medium focus:border-[#C9A052] outline-none text-[11px]"
                  >
                    {airportsData.map((a) => (
                      <option key={a.icao} value={a.icao}>
                        [{a.icao}] {a.city} — {a.name}
                      </option>
                    ))}
                  </select>

                  {/* FBO Picker */}
                  {getAirportFbos(leg.destination.icao).length > 0 && (
                    <select
                      value={getAirportFbos(leg.destination.icao).find((f) => f.name === leg.arrivalHandling?.name)?.id || ""}
                      onChange={(e) => {
                        const found = getAirportFbos(leg.destination.icao).find((f) => f.id === e.target.value);
                        if (found) {
                          const updated = [...legs];
                          updated[index].arrivalHandling = {
                            name: found.name,
                            airportCode: leg.destination.icao,
                            phone: found.phone || "",
                            email: found.email || ""
                          };
                          setLegs(updated);
                        }
                      }}
                      className="w-full bg-[#F5F2EC] border border-[#C9A052]/40 rounded-lg px-2 py-1 text-[10px] font-semibold text-[#0F1420] outline-none"
                    >
                      {getAirportFbos(leg.destination.icao).map((f) => (
                        <option key={f.id} value={f.id}>
                          FBO: {f.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Times</label>
                  <input
                    type="text"
                    value={`${leg.departureTimeLocal} - ${leg.arrivalTimeLocal}`}
                    onChange={(e) => {
                      const [dep, arr] = e.target.value.split("-");
                      const updated = [...legs];
                      if (dep) updated[index].departureTimeLocal = dep.trim();
                      if (arr) updated[index].arrivalTimeLocal = arr.trim();
                      setLegs(updated);
                    }}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 font-mono text-[11px] focus:border-[#C9A052] outline-none"
                  />
                </div>

                <div className="md:col-span-1 text-right">
                  {legs.length > 1 && (
                    <button
                      onClick={() => setLegs(legs.filter((_, i) => i !== index))}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remove Leg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 4: Charter Pricing & Payment Methods */}
      <div className="bg-white p-6 rounded-2xl border border-[#E0DAD0] shadow-sm space-y-6">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-200">
          <DollarSign className="w-4 h-4 text-[#C9A052]" />
          4. Charter Pricing, Fees & Payment Terms
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Aircraft Base Charter Fee</label>
              <input
                type="number"
                value={flightPrice}
                onChange={(e) => setFlightPrice(Number(e.target.value))}
                className="w-full bg-[#FBF9F5] border border-gray-300 rounded-xl px-3 py-2 font-mono font-bold focus:border-[#C9A052] outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Airport & Handling Surcharges</label>
              <input
                type="number"
                value={airportFees}
                onChange={(e) => setAirportFees(Number(e.target.value))}
                className="w-full bg-[#FBF9F5] border border-gray-300 rounded-xl px-3 py-2 font-mono focus:border-[#C9A052] outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1">Passenger Terminal Fees</label>
              <input
                type="number"
                value={passengerFees}
                onChange={(e) => setPassengerFees(Number(e.target.value))}
                className="w-full bg-[#FBF9F5] border border-gray-300 rounded-xl px-3 py-2 font-mono focus:border-[#C9A052] outline-none"
              />
            </div>
          </div>

          {/* Payment Choice (Wire vs Card 3.5%) */}
          <div className="p-4 bg-[#FBF9F5] rounded-xl border border-gray-200 space-y-3 text-xs">
            <label className="block text-[10px] font-mono uppercase text-gray-500 font-bold">
              Payment Choice & Card Processing
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200 cursor-pointer">
                <input
                  type="radio"
                  name="paymentChoice"
                  checked={paymentChoice === "wire"}
                  onChange={() => setPaymentChoice("wire")}
                  className="text-[#C9A052]"
                />
                <div>
                  <p className="font-bold text-gray-900">Direct Bank Wire / SEPA</p>
                  <p className="text-[10px] text-gray-500">0% transaction surcharge (Preferred)</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200 cursor-pointer">
                <input
                  type="radio"
                  name="paymentChoice"
                  checked={paymentChoice === "card"}
                  onChange={() => setPaymentChoice("card")}
                  className="text-[#C9A052]"
                />
                <div>
                  <p className="font-bold text-gray-900">Credit / Debit Card</p>
                  <p className="text-[10px] text-amber-700 font-medium">+3.5% processing fee ({formatCurrency(cardFee.feeAmount, currency)})</p>
                </div>
              </label>
            </div>

            <div className="pt-2 border-t border-gray-200 font-mono text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(totalAmount, currency)}</span>
              </div>
              {paymentChoice === "card" && (
                <div className="flex justify-between text-amber-700">
                  <span>Card Fee (3.5%):</span>
                  <span>+{formatCurrency(cardFee.feeAmount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 pt-1 text-sm">
                <span>Total Due:</span>
                <span className="text-[#0F1420]">
                  {formatCurrency(paymentChoice === "card" ? cardFee.totalWithFee : totalAmount, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Legal Clauses Notice */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              Contractual Terms & Operator Conditions
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              • <strong>Cancellation Policy:</strong> Will be updated later. Standard private aviation charter carriage terms apply.
            </p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              • <strong>Operational Authority:</strong> Commander (Captain) holds absolute operational and safety authority regarding flight routing, weather divergence, and payload.
            </p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              • <strong>Jurisdiction:</strong> English Law with exclusive jurisdiction of the Commercial Court of London / Geneva Arbitration.
            </p>
          </div>
        </div>
      </div>

      {/* Section 5: Legal Execution & Digital Signatures */}
      <div className="bg-white p-6 rounded-2xl border border-[#E0DAD0] shadow-sm space-y-4">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-200">
          <ShieldCheck className="w-4 h-4 text-[#C9A052]" />
          5. Execution & Authorized Signatories
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="p-4 bg-[#FBF9F5] border border-gray-200 rounded-xl space-y-2">
            <span className="font-bold text-gray-800">For and on behalf of Carrier:</span>
            <input
              type="text"
              value={signatoryCarrier}
              onChange={(e) => setSignatoryCarrier(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 font-serif italic text-base text-gray-900 outline-none"
            />
            <p className="text-[10px] text-gray-500 font-mono">Carrier Authorized Representative • London & Geneva</p>
          </div>

          <div className="p-4 bg-[#FBF9F5] border border-gray-200 rounded-xl space-y-2">
            <span className="font-bold text-gray-800">For and on behalf of Charterer:</span>
            <input
              type="text"
              value={signatoryClient}
              onChange={(e) => setSignatoryClient(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 font-serif italic text-base text-gray-900 outline-none"
            />
            <p className="text-[10px] text-gray-500 font-mono">Signatory / Authorized Passenger</p>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200">
          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={hasAgreedTerms}
              onChange={(e) => setHasAgreedTerms(e.target.checked)}
              className="w-4 h-4 rounded text-[#C9A052]"
            />
            <span>I confirm this contract adheres to standard EASA Part-CAT and UK-CAA charter carriage regulations.</span>
          </label>

          <button
            onClick={handleConfirmAndBook}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-[#C9A052] text-[#0F1420] hover:bg-[#dbb366] transition-all shadow-md font-mono"
          >
            <CheckCircle2 className="w-4 h-4" />
            EXECUTE CONTRACT & BOOK FLIGHT
          </button>
        </div>
      </div>
    </div>
  );
}

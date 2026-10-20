"use client";

import React, { useState, useEffect } from "react";
import { useAviation } from "@/lib/aviationContext";
import { Booking, FlightLeg, TripType } from "@/types/aviation";
import { airportsData, findAirportByCode } from "@/data/airports";
import { defaultOperator } from "@/data/initialBookings";
import { formatCurrency } from "@/lib/pricingCalculator";
import {
  Receipt,
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
  Percent,
  RefreshCw
} from "lucide-react";

interface EditableFlownLeg {
  flightDate: string;
  originIcao: string;
  destIcao: string;
  departureTime: string;
  arrivalTime: string;
  paxCount: number;
  flightNumber: string;
}

export default function GenerateInvoiceView() {
  const { bookings, openDocument } = useAviation();

  const [selectedBookingId, setSelectedBookingId] = useState<string>(bookings[0]?.id || "");
  const selectedBooking = bookings.find((b) => b.id === selectedBookingId) || bookings[0];

  // Invoice & Trip References
  const [invoiceNumber, setInvoiceNumber] = useState("00106020");
  const [tripNumber, setTripNumber] = useState("PEU842-001");
  const [accountNumber, setAccountNumber] = useState("2{21737}");
  const [invoiceDate, setInvoiceDate] = useState("02.10.2026");
  const [paymentDueDate, setPaymentDueDate] = useState("03.10.2026");
  const [currency, setCurrency] = useState<"EUR" | "USD" | "GBP" | "CHF">("EUR");

  // Bill-To Entity (TO)
  const [clientName, setClientName] = useState("Edward Brinkmann");
  const [companyName, setCompanyName] = useState("Edward Brinkmann");
  const [streetAddress, setStreetAddress] = useState("3606 Enterprise Ave");
  const [cityCountry, setCityCountry] = useState("FL-34104 Naples, United States");
  const [clientVat, setClientVat] = useState("ATU 6335 7619");

  // Remittance Entity (FROM)
  const [operatorName, setOperatorName] = useState("GlobeAir GmbH");
  const [repName, setRepName] = useState("Ezeokeke, Obiefuna");
  const [operatorEmail, setOperatorEmail] = useState("customercare@globeair.com");
  const [operatorPhone, setOperatorPhone] = useState("00437221727400");
  const [operatorVat, setOperatorVat] = useState("ATU 6335 7619");

  // Trip Summary
  const [aircraftName, setAircraftName] = useState("Cessna Citation Mustang");
  const [tripType, setTripType] = useState<TripType>("round_trip");

  // Flown Legs Table
  const [flownLegs, setFlownLegs] = useState<EditableFlownLeg[]>([
    {
      flightDate: "03.10.2026",
      originIcao: "LSGG",
      destIcao: "LIMJ",
      departureTime: "11:00 h",
      arrivalTime: "11:55 h",
      paxCount: 2,
      flightNumber: "PEU842"
    },
    {
      flightDate: "06.10.2026",
      originIcao: "LIMJ",
      destIcao: "LSGG",
      departureTime: "15:00 h",
      arrivalTime: "16:04 h",
      paxCount: 2,
      flightNumber: "PEU842"
    }
  ]);

  // Pricing Line Items
  const [flightPrice, setFlightPrice] = useState<number>(11500);
  const [airportFees, setAirportFees] = useState<number>(1140);
  const [passengerFees, setPassengerFees] = useState<number>(80);
  const [dayOfWeekDiscount, setDayOfWeekDiscount] = useState<number>(-250);
  const [inboundTax, setInboundTax] = useState<number>(200);
  const [outboundTax, setOutboundTax] = useState<number>(200);
  const [additionalService, setAdditionalService] = useState<number>(0);

  // Bank References
  const [bankName, setBankName] = useState("Raiffeisenlandesbank Oberösterreich AG");
  const [iban, setIban] = useState("AT32 3400 0000 0266 7483");
  const [bic, setBic] = useState("RZOOAT2LXXX");
  const [accountHolder, setAccountHolder] = useState("GlobeAir GmbH");
  const [paymentTermsNote, setPaymentTermsNote] = useState(
    "Jetcard Customer agrees to pay all bank charges. SEPA wiring is preferred."
  );

  const [success, setSuccess] = useState(false);

  // Sync state when selecting a booking from dropdown
  const handleBookingChange = (id: string) => {
    setSelectedBookingId(id);
    const b = bookings.find((item) => item.id === id);
    if (b) {
      setInvoiceNumber(b.invoiceNumber || "00106020");
      setTripNumber(b.tripNumber || "PEU842-001");
      setAccountNumber(b.accountNumber || "2{21737}");
      setInvoiceDate(b.contractDate || "02.10.2026");
      setPaymentDueDate(b.paymentDueDate || "03.10.2026");
      setCurrency(b.pricing?.currency || "EUR");

      setClientName(b.client.fullName);
      setCompanyName(b.client.companyName || b.client.fullName);
      setStreetAddress(b.client.streetAddress);
      setCityCountry(b.client.cityPostalCountry);
      setClientVat(b.client.vatNumber || "");

      setOperatorName(b.operator.companyName || "GlobeAir GmbH");
      setRepName(b.operator.representativeName || "Ezeokeke, Obiefuna");
      setOperatorEmail(b.operator.supportEmail || "customercare@globeair.com");
      setOperatorPhone(b.operator.supportPhone || "00437221727400");
      setOperatorVat(b.operator.vatNumber || "ATU 6335 7619");

      setAircraftName(b.aircraft.name);
      setTripType(b.tripType || "round_trip");

      if (b.legs && b.legs.length > 0) {
        setFlownLegs(
          b.legs.map((leg) => ({
            flightDate: leg.flightDate,
            originIcao: leg.origin.icao,
            destIcao: leg.destination.icao,
            departureTime: leg.departureTimeLocal,
            arrivalTime: leg.arrivalTimeLocal,
            paxCount: leg.paxCount,
            flightNumber: leg.flightNumber
          }))
        );
      }

      if (b.pricing) {
        setFlightPrice(b.pricing.flightPrice || 11500);
        setAirportFees(b.pricing.airportFees || 1140);
        setPassengerFees(b.pricing.passengerFees || 80);
        setDayOfWeekDiscount(b.pricing.dayOfWeekDiscount || 0);
        setInboundTax(b.pricing.inboundPassengerTax || 200);
        setOutboundTax(b.pricing.outboundPassengerTax || 200);
        setAdditionalService(b.pricing.additionalServicesTotal || 0);
      }

      setBankName(b.operator.bankName || defaultOperator.bankName);
      setIban(b.operator.iban || defaultOperator.iban);
      setBic(b.operator.bic || defaultOperator.bic);
      setAccountHolder(b.operator.accountHolder || defaultOperator.accountHolder);
    }
  };

  // Pricing calculations
  const subtotal =
    Number(flightPrice) +
    Number(airportFees) +
    Number(passengerFees) +
    Number(dayOfWeekDiscount) +
    Number(inboundTax) +
    Number(outboundTax) +
    Number(additionalService);

  const vatAmount = 0; // 0% International Tax Exemption
  const totalFlightPrice = subtotal + vatAmount;

  const handleLegChange = (idx: number, field: keyof EditableFlownLeg, value: any) => {
    const updated = [...flownLegs];
    updated[idx] = { ...updated[idx], [field]: value };
    setFlownLegs(updated);
  };

  const handleAddLeg = () => {
    const last = flownLegs[flownLegs.length - 1];
    setFlownLegs([
      ...flownLegs,
      {
        flightDate: last ? last.flightDate : "06.10.2026",
        originIcao: last ? last.destIcao : "LSGG",
        destIcao: "LIMJ",
        departureTime: "15:00 h",
        arrivalTime: "16:04 h",
        paxCount: last ? last.paxCount : 2,
        flightNumber: last ? last.flightNumber : "PEU842"
      }
    ]);
  };

  const handleRemoveLeg = (idx: number) => {
    if (flownLegs.length <= 1) return;
    setFlownLegs(flownLegs.filter((_, i) => i !== idx));
  };

  const handleGenerateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    // Update in-memory booking with all invoice input fields
    selectedBooking.invoiceNumber = invoiceNumber;
    selectedBooking.tripNumber = tripNumber;
    selectedBooking.accountNumber = accountNumber;
    selectedBooking.contractDate = invoiceDate;
    selectedBooking.paymentDueDate = paymentDueDate;
    selectedBooking.tripType = tripType;

    selectedBooking.client.fullName = clientName;
    selectedBooking.client.companyName = companyName;
    selectedBooking.client.streetAddress = streetAddress;
    selectedBooking.client.cityPostalCountry = cityCountry;
    selectedBooking.client.vatNumber = clientVat;

    selectedBooking.operator.companyName = operatorName;
    selectedBooking.operator.representativeName = repName;
    selectedBooking.operator.supportEmail = operatorEmail;
    selectedBooking.operator.supportPhone = operatorPhone;
    selectedBooking.operator.vatNumber = operatorVat;
    selectedBooking.operator.bankName = bankName;
    selectedBooking.operator.iban = iban;
    selectedBooking.operator.bic = bic;
    selectedBooking.operator.accountHolder = accountHolder;

    selectedBooking.aircraft.name = aircraftName;

    // Update legs
    selectedBooking.legs = flownLegs.map((fl, idx) => {
      const orig = findAirportByCode(fl.originIcao);
      const dest = findAirportByCode(fl.destIcao);
      const existing = selectedBooking.legs[idx];

      return {
        legNumber: idx + 1,
        flightDate: fl.flightDate,
        origin: orig,
        destination: dest,
        departureTimeLocal: fl.departureTime.includes("h") ? fl.departureTime : `${fl.departureTime} h`,
        arrivalTimeLocal: fl.arrivalTime.includes("h") ? fl.arrivalTime : `${fl.arrivalTime} h`,
        flightTimeFormatted: existing?.flightTimeFormatted || "1h 15m",
        paxCount: fl.paxCount,
        flightNumber: fl.flightNumber,
        aircraftRegistration: existing?.aircraftRegistration || selectedBooking.aircraft.registration || "OE-FFB",
        crew: existing?.crew || [
          { role: "CMDR", name: "Capt. Audrain, Emmanuel", phone: "+43 664 8489 904" },
          { role: "F/O", name: "El Hassani Amrani, Hajar", phone: "+43 664 8489 928" }
        ],
        passengers: existing?.passengers || [{ id: "p1", fullName: clientName, isLeadPassenger: true }],
        departureHandling: existing?.departureHandling || {
          name: `${orig.name} FBO`,
          airportCode: orig.icao,
          phone: "+41 58 158 1811",
          email: `ops@${orig.icao.toLowerCase()}.handling.aero`
        },
        arrivalHandling: existing?.arrivalHandling || {
          name: `${dest.name} FBO`,
          airportCode: dest.icao,
          phone: "+39 010 601 5412",
          email: `ops@${dest.icao.toLowerCase()}.handling.aero`
        }
      };
    });

    // Update pricing breakdown
    selectedBooking.pricing = {
      flightPrice: Number(flightPrice),
      airportFees: Number(airportFees),
      passengerFees: Number(passengerFees),
      dayOfWeekDiscount: Number(dayOfWeekDiscount),
      inboundPassengerTax: Number(inboundTax),
      outboundPassengerTax: Number(outboundTax),
      additionalServicesTotal: Number(additionalService),
      subtotal,
      vatRate: 0,
      vatAmount: 0,
      totalFlightPrice,
      currency
    };

    setSuccess(true);
    openDocument(selectedBooking, "invoice");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* View Header */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/15 text-[#9A7A35] border border-[#C9A052]/30">
              COMMERCIAL INVOICING DESK
            </span>
            <span className="text-xs text-[#0F1420]/60">Austrian Tax & VAT Exempt System</span>
          </div>
          <h2 className="text-xl font-black text-[#0F1420] tracking-tight">
            Generate Commercial Tax Invoice
          </h2>
          <p className="text-xs text-[#0F1420]/65 mt-0.5">
            Compile official charter tax invoice with complete line-item breakdown, flown legs, and SEPA wire instructions.
          </p>
        </div>

        {/* Trip Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-[#0F1420]/70">Trip:</span>
          <select
            value={selectedBookingId}
            onChange={(e) => handleBookingChange(e.target.value)}
            className="bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
          >
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.tripNumber} ({b.client.fullName} • {formatCurrency(b.pricing?.totalFlightPrice || 12870, b.pricing?.currency || "EUR")})
              </option>
            ))}
          </select>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Tax Invoice #{invoiceNumber} for {clientName} ({tripNumber}) compiled and opened!</span>
          </div>
        </div>
      )}

      <form onSubmit={handleGenerateInvoice} className="space-y-6">
        
        {/* SECTION 1: Invoice Numbers & Settlement Dates */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E0DAD0]">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                1. Invoice Metadata & References (INVOICE DETAILS Box)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#0F1420]/70">Currency:</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CHF">CHF</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
                placeholder="00106020"
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Trip Number
              </label>
              <input
                type="text"
                value={tripNumber}
                onChange={(e) => setTripNumber(e.target.value)}
                required
                placeholder="PEU842-001"
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                placeholder="2{21737}"
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Invoice Date
              </label>
              <input
                type="text"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
                placeholder="02.10.2026"
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Payment Due Date
              </label>
              <input
                type="text"
                value={paymentDueDate}
                onChange={(e) => setPaymentDueDate(e.target.value)}
                required
                placeholder="03.10.2026"
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#C9A052] focus:outline-none focus:border-[#C9A052]"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: TO & FROM Entities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* TO: Bill-To Client */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E0DAD0]">
              <User className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                2. Bill-To Client (TO Box)
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                    Client Full Name *
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
                    Company / Attention
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Edward Brinkmann"
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="3606 Enterprise Ave"
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                    City, State / Postal & Country
                  </label>
                  <input
                    type="text"
                    value={cityCountry}
                    onChange={(e) => setCityCountry(e.target.value)}
                    placeholder="FL-34104 Naples, United States"
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                    Client VAT / Tax ID
                  </label>
                  <input
                    type="text"
                    value={clientVat}
                    onChange={(e) => setClientVat(e.target.value)}
                    placeholder="ATU 6335 7619"
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* FROM: Operator Entity */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E0DAD0]">
              <Building className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                3. Issuing Operator (FROM Box)
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                    Representative
                  </label>
                  <input
                    type="text"
                    value={repName}
                    onChange={(e) => setRepName(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={operatorEmail}
                    onChange={(e) => setOperatorEmail(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={operatorPhone}
                    onChange={(e) => setOperatorPhone(e.target.value)}
                    className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  VAT #
                </label>
                <input
                  type="text"
                  value={operatorVat}
                  onChange={(e) => setOperatorVat(e.target.value)}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Trip Summary */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E0DAD0]">
            <Plane className="w-4 h-4 text-[#C9A052]" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
              4. Trip Summary Box
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Aircraft Model Name
              </label>
              <input
                type="text"
                value={aircraftName}
                onChange={(e) => setAircraftName(e.target.value)}
                required
                placeholder="Cessna Citation Mustang"
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Trip Type
              </label>
              <select
                value={tripType}
                onChange={(e) => setTripType(e.target.value as any)}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              >
                <option value="round_trip">RoundTripPlus</option>
                <option value="one_way">One-Way Charter</option>
                <option value="multi_leg">Multi-Leg Itinerary</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Number of Legs
              </label>
              <input
                type="text"
                value={flownLegs.length}
                disabled
                className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#0F1420] opacity-80"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: Flown Legs Table */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E0DAD0]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#C9A052]" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
                5. Flown Legs (Please note that all times are local times)
              </h3>
            </div>

            <button
              type="button"
              onClick={handleAddLeg}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F1420] text-white hover:bg-[#1A2338] text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#C9A052]" />
              <span>Add Flown Leg</span>
            </button>
          </div>

          <div className="space-y-3">
            {flownLegs.map((leg, index) => (
              <div
                key={index}
                className="p-3.5 rounded-xl bg-[#F5F2EC] border border-[#E0DAD0] grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5 items-end text-xs"
              >
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    placeholder="03.10.2026"
                    value={leg.flightDate}
                    onChange={(e) => handleLegChange(index, "flightDate", e.target.value)}
                    required
                    className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                    From (ICAO)
                  </label>
                  <select
                    value={leg.originIcao}
                    onChange={(e) => handleLegChange(index, "originIcao", e.target.value)}
                    className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  >
                    {airportsData.map((a) => (
                      <option key={a.icao} value={a.icao}>
                        {a.city} ({a.icao})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                    To (ICAO)
                  </label>
                  <select
                    value={leg.destIcao}
                    onChange={(e) => handleLegChange(index, "destIcao", e.target.value)}
                    className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  >
                    {airportsData.map((a) => (
                      <option key={a.icao} value={a.icao}>
                        {a.city} ({a.icao})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                    Departure
                  </label>
                  <input
                    type="text"
                    placeholder="11:00 h"
                    value={leg.departureTime}
                    onChange={(e) => handleLegChange(index, "departureTime", e.target.value)}
                    required
                    className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                    Arrival
                  </label>
                  <input
                    type="text"
                    placeholder="11:55 h"
                    value={leg.arrivalTime}
                    onChange={(e) => handleLegChange(index, "arrivalTime", e.target.value)}
                    required
                    className="w-full bg-white border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex-1">
                    <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                      # Pax
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={leg.paxCount}
                      onChange={(e) => handleLegChange(index, "paxCount", Number(e.target.value))}
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-1.5 py-1.5 text-xs font-mono text-center font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                      Flight#
                    </label>
                    <input
                      type="text"
                      placeholder="PEU842"
                      value={leg.flightNumber}
                      onChange={(e) => handleLegChange(index, "flightNumber", e.target.value)}
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-1.5 py-1.5 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                    />
                  </div>

                  {flownLegs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLeg(index)}
                      className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors mb-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5: Pricing Calculation Line Items */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E0DAD0]">
            <DollarSign className="w-4 h-4 text-[#C9A052]" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
              6. Itemized Invoice Pricing Table (Matches Official PDF)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Flight Price (€)
              </label>
              <input
                type="number"
                value={flightPrice}
                onChange={(e) => setFlightPrice(Number(e.target.value))}
                required
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                - Airport Fees (€)
              </label>
              <input
                type="number"
                value={airportFees}
                onChange={(e) => setAirportFees(Number(e.target.value))}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                - Passenger Fees (€)
              </label>
              <input
                type="number"
                value={passengerFees}
                onChange={(e) => setPassengerFees(Number(e.target.value))}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                - Day of Week Discount (€)
              </label>
              <input
                type="number"
                value={dayOfWeekDiscount}
                onChange={(e) => setDayOfWeekDiscount(Number(e.target.value))}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono text-emerald-700 font-bold focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                - Inbound Passenger Tax (€)
              </label>
              <input
                type="number"
                value={inboundTax}
                onChange={(e) => setInboundTax(Number(e.target.value))}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                - Outbound Passenger Tax (€)
              </label>
              <input
                type="number"
                value={outboundTax}
                onChange={(e) => setOutboundTax(Number(e.target.value))}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Additional Service (€)
              </label>
              <input
                type="number"
                value={additionalService}
                onChange={(e) => setAdditionalService(Number(e.target.value))}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                VAT Rate (Exempt)
              </label>
              <input
                type="text"
                value="0% (§6 Abs. 1 Zif. 3)"
                disabled
                className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono text-emerald-800 font-bold opacity-80"
              />
            </div>
          </div>
        </div>

        {/* SECTION 6: Payment Conditions & Bank References */}
        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E0DAD0]">
            <Landmark className="w-4 h-4 text-[#C9A052]" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#0F1420]">
              7. Payment Conditions & Bank Wire References (NEW)
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                Payment Conditions Note
              </label>
              <input
                type="text"
                value={paymentTermsNote}
                onChange={(e) => setPaymentTermsNote(e.target.value)}
                className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
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
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
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
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
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
                  className="w-full bg-[#FDFCFA] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Total Calculation & Action Submit */}
        <div className="bg-[#0F1420] text-white border border-[#1C2436] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1C2436]">
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-[#C9A052] font-bold">
                TOTAL INVOICE PAYABLE AMOUNT
              </span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-3xl font-black text-white font-mono">
                  {formatCurrency(totalFlightPrice, currency)}
                </span>
                <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold border border-emerald-500/30">
                  VAT 0% Exempt (§6 Abs. 1 Zif. 3)
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="py-3.5 px-8 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>Generate & Open Tax Invoice PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div>
              <span className="text-gray-400 text-[10px]">FLIGHT PRICE</span>
              <p className="font-bold text-gray-200">{formatCurrency(flightPrice, currency)}</p>
            </div>
            <div>
              <span className="text-gray-400 text-[10px]">FEES & TAXES</span>
              <p className="font-bold text-gray-200">
                {formatCurrency(airportFees + passengerFees + inboundTax + outboundTax, currency)}
              </p>
            </div>
            <div>
              <span className="text-gray-400 text-[10px]">DISCOUNTS</span>
              <p className="font-bold text-emerald-400">{formatCurrency(dayOfWeekDiscount, currency)}</p>
            </div>
            <div>
              <span className="text-[#C9A052] text-[10px]">TOTAL PAYABLE</span>
              <p className="font-black text-[#C9A052] text-sm">{formatCurrency(totalFlightPrice, currency)}</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

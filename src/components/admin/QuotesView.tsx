"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAviation } from "@/lib/aviationContext";
import { Booking, FlightLeg, AdditionalServices, TripType, Aircraft } from "@/types/aviation";
import { airportsData, findAirportByCode } from "@/data/airports";
import { fleetData } from "@/data/fleet";
import { defaultOperator } from "@/data/initialBookings";
import {
  calculatePricing,
  formatCurrency,
  estimateFlightTimeMinutes,
  formatFlightTime,
  calculateDistanceNm
} from "@/lib/pricingCalculator";
import {
  FileText,
  Search,
  Plus,
  Plane,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ScrollText,
  Check,
  ChevronRight,
  Eye,
  Calendar,
  Image as ImageIcon,
  Building,
  User,
  ArrowRight,
  Receipt,
  Compass,
  FileCheck,
  SlidersHorizontal,
  X,
  Upload
} from "lucide-react";

export default function QuotesView() {
  const {
    bookings,
    addBooking,
    openDocument,
    convertQuoteToBooked,
    setSelectedBookingForDetail,
    setActiveNav,
    accounts,
    contacts,
    currentUser,
    addAuditEntry,
    bookingToRevise,
    setBookingToRevise
  } = useAviation();

  const [activeTab, setActiveTab] = useState<"list" | "builder">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedQuoteForDocs, setSelectedQuoteForDocs] = useState<Booking | null>(null);

  // All Quotes (bookings in draft, quote_sent, client_review, or having quoteStatus)
  const quotesList = useMemo(() => {
    return bookings.filter((b) => b.quoteReference || b.quoteStatus || ["draft", "quote_sent", "client_review"].includes(b.status));
  }, [bookings]);

  const filteredQuotes = useMemo(() => {
    return quotesList.filter((b) => {
      if (statusFilter !== "all") {
        if (statusFilter === "draft" && b.quoteStatus !== "draft" && b.status !== "draft") return false;
        if (statusFilter === "sent" && b.quoteStatus !== "sent" && b.status !== "quote_sent") return false;
        if (statusFilter === "accepted" && b.quoteStatus !== "accepted" && b.status !== "confirmed") return false;
      }

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchRef = (b.quoteReference || "").toLowerCase().includes(q);
        const matchTrip = (b.tripNumber || "").toLowerCase().includes(q);
        const matchClient = (b.client.fullName || "").toLowerCase().includes(q);
        const matchAircraft = (b.aircraft.name || "").toLowerCase().includes(q);
        const matchRoute = (b.legs || []).some(
          (l) =>
            l.origin.icao.toLowerCase().includes(q) ||
            l.destination.icao.toLowerCase().includes(q) ||
            l.origin.city.toLowerCase().includes(q) ||
            l.destination.city.toLowerCase().includes(q)
        );
        if (!matchRef && !matchTrip && !matchClient && !matchAircraft && !matchRoute) return false;
      }

      return true;
    });
  }, [quotesList, statusFilter, searchQuery]);

  // ================= QUOTE BUILDER & REVISION STATE =================
  const [quoteReference, setQuoteReference] = useState("");
  const [contractDate, setContractDate] = useState("01.10.2026");
  const [quoteExpirationDate, setQuoteExpirationDate] = useState("05.10.2026, 18:00z");
  const [tripType, setTripType] = useState<TripType>("round_trip");
  const [currency, setCurrency] = useState<"EUR" | "USD" | "GBP" | "CHF">("EUR");

  // Client
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [clientName, setClientName] = useState("Edward Brinkmann");
  const [clientEmail, setClientEmail] = useState("ebrinkmann@bgcapital.com");
  const [clientPhone, setClientPhone] = useState("+377 97 97 12 00");
  const [clientAddress, setClientAddress] = useState("7 Boulevard Albert 1er, Monaco");
  const [accountNumber, setAccountNumber] = useState("ACC-21737");

  // Aircraft Selection & IMAGE CUSTOMIZATION
  const [selectedAircraftId, setSelectedAircraftId] = useState("cessna-citation-mustang");
  const [customExteriorImage, setCustomExteriorImage] = useState("");
  const [customInteriorImage, setCustomInteriorImage] = useState("");
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  // Flight Legs
  const [legs, setLegs] = useState<
    Array<{
      originIcao: string;
      destIcao: string;
      flightDate: string;
      departureTime: string;
      paxCount: number;
    }>
  >([
    {
      originIcao: "LSGG",
      destIcao: "LIMJ",
      flightDate: "2026-10-15",
      departureTime: "09:00",
      paxCount: 4
    },
    {
      originIcao: "LIMJ",
      destIcao: "LSGG",
      flightDate: "2026-10-18",
      departureTime: "17:00",
      paxCount: 4
    }
  ]);

  // Additional Services
  const [vipCatering, setVipCatering] = useState(true);
  const [limousineService, setLimousineService] = useState(true);
  const [helicopterService, setHelicopterService] = useState(false);
  const [deicingInsurance, setDeicingInsurance] = useState<"none" | "at_reservation" | "within_48h">("at_reservation");
  const [carbonOffset, setCarbonOffset] = useState<"none" | "neutral" | "positive" | "double_neutral">("neutral");

  // Validation
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected aircraft object
  const currentAircraft = useMemo(() => {
    return fleetData.find((a) => a.id === selectedAircraftId) || fleetData[0];
  }, [selectedAircraftId]);

  // When aircraft changes, update default images if not custom
  useEffect(() => {
    if (currentAircraft && !customExteriorImage) {
      setCustomExteriorImage(currentAircraft.imageExterior || "");
    }
    if (currentAircraft && !customInteriorImage) {
      setCustomInteriorImage(currentAircraft.imageInterior || "");
    }
  }, [currentAircraft]);

  // Populate from bookingToRevise if revising
  useEffect(() => {
    if (bookingToRevise) {
      setActiveTab("builder");
      setQuoteReference(`REV-${bookingToRevise.quoteReference || bookingToRevise.tripNumber}`);
      setClientName(bookingToRevise.client.fullName);
      setClientEmail(bookingToRevise.client.email);
      setClientPhone(bookingToRevise.client.phone);
      setClientAddress(bookingToRevise.client.streetAddress);
      setAccountNumber(bookingToRevise.accountNumber || "ACC-21737");
      setSelectedAircraftId(bookingToRevise.aircraft.id || "cessna-citation-mustang");
      setCustomExteriorImage(bookingToRevise.aircraftCustomImages?.exterior || bookingToRevise.aircraft.imageExterior || "");
      setCustomInteriorImage(bookingToRevise.aircraftCustomImages?.interior || bookingToRevise.aircraft.imageInterior || "");
      if (bookingToRevise.legs && bookingToRevise.legs.length > 0) {
        setLegs(
          bookingToRevise.legs.filter((l) => !l.isCancelled).map((l) => ({
            originIcao: l.origin.icao,
            destIcao: l.destination.icao,
            flightDate: l.flightDate,
            departureTime: l.departureTimeLocal || "10:00",
            paxCount: l.paxCount || 4
          }))
        );
      }
    } else {
      setQuoteReference(`QTE-2026-${Math.floor(100 + Math.random() * 899)}`);
    }
  }, [bookingToRevise]);

  // Account selector sync
  const handleSelectAccount = (accId: string) => {
    setSelectedAccountId(accId);
    const match = accounts.find((a) => a.id === accId);
    if (match) {
      setClientName(match.preferredContactName || match.name);
      setClientEmail(match.preferredContactEmail || match.email);
      setClientPhone(match.preferredContactPhone || match.phone);
      setClientAddress(match.billingAddress || match.country);
      setAccountNumber(match.accountNumber);
    }
  };

  // Add Leg
  const handleAddLeg = () => {
    const lastLeg = legs[legs.length - 1];
    setLegs((prev) => [
      ...prev,
      {
        originIcao: lastLeg ? lastLeg.destIcao : "LSGG",
        destIcao: "LFMN",
        flightDate: lastLeg ? lastLeg.flightDate : "2026-10-20",
        departureTime: "11:00",
        paxCount: 4
      }
    ]);
  };

  // Remove Leg
  const handleRemoveLeg = (idx: number) => {
    if (legs.length <= 1) return;
    setLegs((prev) => prev.filter((_, i) => i !== idx));
  };

  // Calculated Pricing
  const calculatedPricing = useMemo(() => {
    const compiledLegs: FlightLeg[] = legs.map((leg, idx) => {
      const origin = findAirportByCode(leg.originIcao);
      const destination = findAirportByCode(leg.destIcao);
      const distanceNm = calculateDistanceNm(
        origin.coordinates?.lat || 46.2,
        origin.coordinates?.lng || 6.1,
        destination.coordinates?.lat || 44.4,
        destination.coordinates?.lng || 8.8
      );
      const minutes = estimateFlightTimeMinutes(distanceNm);
      return {
        legNumber: idx + 1,
        flightDate: leg.flightDate,
        origin,
        destination,
        departureTimeLocal: leg.departureTime,
        arrivalTimeLocal: "11:30",
        flightTimeFormatted: formatFlightTime(minutes),
        paxCount: leg.paxCount,
        flightNumber: `PEU842`,
        aircraftRegistration: currentAircraft.registration || "OE-FFB",
        crew: [],
        passengers: [],
        departureHandling: { name: "Executive FBO", airportCode: origin.icao, phone: "+41 58 158 1811", email: "ops@fbo.aero" },
        arrivalHandling: { name: "Executive FBO", airportCode: destination.icao, phone: "+33 4 93 21 38 10", email: "ops@fbo.aero" },
        distanceNm
      };
    });

    const services: AdditionalServices = {
      limousineService,
      luxuryCarRental: false,
      helicopterService,
      deicingInsurance,
      deicingCostPerLeg: deicingInsurance === "at_reservation" ? 400 : deicingInsurance === "within_48h" ? 800 : 0,
      carbonOffset,
      carbonOffsetRatePerHour: carbonOffset === "neutral" ? 33 : carbonOffset === "positive" ? 50 : carbonOffset === "double_neutral" ? 66 : 0
    };

    return calculatePricing(currentAircraft, compiledLegs, services, currency);
  }, [legs, currentAircraft, limousineService, helicopterService, deicingInsurance, carbonOffset, currency]);

  // Submit & Generate Quote
  const handleGenerateQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (!quoteReference.trim()) errors.push("Quote Reference ID is required.");
    if (!clientName.trim()) errors.push("Client / Account Name is required.");
    if (!clientEmail.trim() || !clientEmail.includes("@")) errors.push("Valid Client Email is required.");
    if (!clientPhone.trim()) errors.push("Client Telephone is required.");

    legs.forEach((leg, idx) => {
      if (!leg.originIcao.trim()) errors.push(`Leg #${idx + 1}: Departure Airport ICAO is required.`);
      if (!leg.destIcao.trim()) errors.push(`Leg #${idx + 1}: Destination Airport ICAO is required.`);
      if (!leg.flightDate.trim()) errors.push(`Leg #${idx + 1}: Flight Date is required.`);
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const compiledLegs: FlightLeg[] = legs.map((leg, idx) => {
      const origin = findAirportByCode(leg.originIcao);
      const destination = findAirportByCode(leg.destIcao);
      const distanceNm = calculateDistanceNm(
        origin.coordinates?.lat || 46.2,
        origin.coordinates?.lng || 6.1,
        destination.coordinates?.lat || 44.4,
        destination.coordinates?.lng || 8.8
      );
      const minutes = estimateFlightTimeMinutes(distanceNm);
      return {
        legNumber: idx + 1,
        flightDate: leg.flightDate,
        origin,
        destination,
        departureTimeLocal: leg.departureTime,
        arrivalTimeLocal: "11:30",
        flightTimeFormatted: formatFlightTime(minutes),
        paxCount: leg.paxCount,
        flightNumber: `PEU842`,
        aircraftRegistration: currentAircraft.registration || "OE-FFB",
        crew: [],
        passengers: [],
        departureHandling: { name: `${origin.name} Executive FBO`, airportCode: origin.icao, phone: "+41 58 158 1811", email: "ops@fbo.aero" },
        arrivalHandling: { name: `${destination.name} Executive FBO`, airportCode: destination.icao, phone: "+33 4 93 21 38 10", email: "ops@fbo.aero" },
        distanceNm
      };
    });

    const customizedAircraft: Aircraft = {
      ...currentAircraft,
      imageExterior: customExteriorImage || currentAircraft.imageExterior,
      imageInterior: customInteriorImage || currentAircraft.imageInterior
    };

    const newBooking: Booking = {
      id: bookingToRevise ? bookingToRevise.id : `booking-qte-${Date.now()}`,
      tripNumber: bookingToRevise ? bookingToRevise.tripNumber : `PEU${Math.floor(100 + Math.random() * 899)}-001`,
      quoteReference,
      invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      accountNumber,
      contractDate,
      quoteExpirationDate,
      paymentDueDate: "10.10.2026",
      status: "quote_sent",
      quoteStatus: "sent",
      paymentStatus: "unpaid",
      tripType,
      aircraft: customizedAircraft,
      aircraftCustomImages: {
        exterior: customExteriorImage,
        interior: customInteriorImage
      },
      client: {
        fullName: clientName,
        email: clientEmail,
        phone: clientPhone,
        streetAddress: clientAddress,
        cityPostalCountry: clientAddress,
        accountNumber
      },
      operator: defaultOperator,
      legs: compiledLegs,
      pricing: calculatedPricing,
      services: {
        limousineService,
        luxuryCarRental: false,
        helicopterService,
        deicingInsurance,
        deicingCostPerLeg: deicingInsurance === "at_reservation" ? 400 : 800,
        carbonOffset,
        carbonOffsetRatePerHour: 33
      },
      checklist: bookingToRevise?.checklist || [
        { id: "step-1", label: "AOC & Safety Audit Verification", category: "safety", isCompleted: true, requiredForDispatch: true },
        { id: "step-2", label: "Slots & Ground Handling Confirmation", category: "ground", isCompleted: false, requiredForDispatch: true },
        { id: "step-3", label: "Passenger Manifest APIS Cleared", category: "passengers", isCompleted: false, requiredForDispatch: true }
      ],
      tripActionAudit: [
        {
          id: `act-${Date.now()}`,
          action: bookingToRevise ? "QUOTE_REVISED" : "QUOTE_GENERATED",
          details: `${bookingToRevise ? "Revised" : "Generated"} Quotation [${quoteReference}] for ${clientName}. Total: ${formatCurrency(calculatedPricing.totalFlightPrice, currency)}. Customized aircraft images attached.`,
          timestamp: new Date().toLocaleString(),
          author: currentUser?.name || "Operations Desk",
          docType: "quotation"
        },
        ...(bookingToRevise?.tripActionAudit || [])
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addBooking(newBooking);
    setBookingToRevise(null);
    setActiveTab("list");
    openDocument(newBooking, "quotation");
  };

  // Convert Quote directly to Confirmed Booking
  const handleBookQuote = (b: Booking) => {
    convertQuoteToBooked(b.id);
    setActiveNav("bookings");
  };

  // Revise Quote action
  const handleStartRevise = (b: Booking) => {
    setBookingToRevise(b);
    setActiveTab("builder");
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-[#0F1420] text-white rounded-2xl p-6 sm:p-8 border border-[#1C2436] shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/20 text-[#C9A052] border border-[#C9A052]/40 uppercase flex items-center gap-1">
              <FileText className="w-3 h-3" />
              COMMERCIAL PROPOSALS & QUOTATIONS
            </span>
            <span className="text-gray-400 text-xs font-mono">• {quotesList.length} Generated Proposals</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Quotation Management & Generator
          </h1>
          <p className="text-xs text-gray-300 leading-relaxed">
            Review all generated proposals with official ID numbers, execute charter contract agreements, convert directly to confirmed flight bookings, or revise routes and customize aircraft exterior and cabin imagery.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#141A29] border border-[#1C2436]">
          <button
            onClick={() => {
              setBookingToRevise(null);
              setActiveTab("list");
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "list" ? "bg-[#C9A052] text-[#0F1420] shadow-sm font-black" : "text-gray-300 hover:text-white"
            }`}
          >
            All Generated Quotes ({quotesList.length})
          </button>
          <button
            onClick={() => setActiveTab("builder")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "builder" ? "bg-[#C9A052] text-[#0F1420] shadow-sm font-black" : "text-gray-300 hover:text-white"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{bookingToRevise ? "Revise Quote" : "Create Quote"}</span>
          </button>
        </div>
      </div>

      {activeTab === "list" ? (
        <div className="space-y-5">
          {/* Search & Status Filters */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Quote ID (e.g. QTE-2026-842), Client Name, Aircraft, or Airport Code..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E0DAD0] bg-[#F5F2EC] text-xs text-[#0F1420] font-medium placeholder-gray-400 focus:outline-none focus:border-[#C9A052] focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === "all" ? "bg-[#0F1420] text-white" : "bg-[#F5F2EC] text-gray-700 hover:bg-[#EBE5DB]"
                }`}
              >
                All Proposals
              </button>
              <button
                onClick={() => setStatusFilter("sent")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === "sent" ? "bg-[#0F1420] text-white" : "bg-[#F5F2EC] text-gray-700 hover:bg-[#EBE5DB]"
                }`}
              >
                Active Sent
              </button>
              <button
                onClick={() => setStatusFilter("accepted")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === "accepted" ? "bg-[#0F1420] text-white" : "bg-[#F5F2EC] text-gray-700 hover:bg-[#EBE5DB]"
                }`}
              >
                Booked Contracts
              </button>
            </div>
          </div>

          {/* Quotes List Cards */}
          <div className="space-y-4">
            {filteredQuotes.map((quote) => {
              const isBooked = ["confirmed", "dispatched", "in_flight", "completed"].includes(quote.status);
              const isContractSent = quote.status === "contract_sent";

              return (
                <div
                  key={quote.id}
                  className="bg-white border border-[#E0DAD0] hover:border-[#C9A052] rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 group"
                >
                  {/* Left: ID & Route Information */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Aircraft Thumbnail */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#E0DAD0] bg-[#141A29] flex-shrink-0 relative group">
                      <img
                        src={quote.aircraftCustomImages?.exterior || quote.aircraft.imageExterior}
                        alt={quote.aircraft.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-1">
                        <span className="text-[9px] font-mono font-bold text-white uppercase truncate">
                          {quote.aircraft.registration || "OE-FFB"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-black text-[#0F1420] px-2.5 py-0.5 rounded bg-[#F5F2EC] border border-[#E0DAD0]">
                          {quote.quoteReference || (quote.tripNumber ? `QTE-${quote.tripNumber}` : "QTE-PENDING")}
                        </span>
                        {quote.quoteVersion && quote.quoteVersion > 1 && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
                            Version {quote.quoteVersion} (Revised)
                          </span>
                        )}
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                          isBooked
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : isContractSent
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : "bg-amber-100 text-amber-800 border-amber-300"
                        }`}>
                          {isBooked ? "BOOKED AS FLIGHT" : isContractSent ? "CONTRACT ISSUED" : "QUOTATION SENT"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-[#0F1420]">
                          {quote.legs[0]?.origin.city || "Geneva"} ({quote.legs[0]?.origin.icao})
                        </h3>
                        <span className="text-[#C9A052] font-bold">⇄</span>
                        <h3 className="text-base font-extrabold text-[#0F1420]">
                          {quote.legs[0]?.destination.city || "Genoa"} ({quote.legs[0]?.destination.icao})
                        </h3>
                        {quote.legs.length > 2 && (
                          <span className="text-xs text-gray-400 font-mono">+{quote.legs.length - 1} legs</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="font-semibold text-[#0F1420] flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>{quote.client.fullName}</span>
                        </span>
                        <span>•</span>
                        <span className="font-medium flex items-center gap-1">
                          <Plane className="w-3.5 h-3.5 text-gray-400" />
                          <span>{quote.aircraft.name}</span>
                        </span>
                        <span>•</span>
                        <span className="font-mono text-gray-500">
                          Expires: {quote.quoteExpirationDate || "48 Hours"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Price & Required Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-mono text-gray-500 uppercase block">Total Flight Price</span>
                      <div className="text-xl font-black font-mono text-[#0F1420]">
                        {formatCurrency(quote.pricing.totalFlightPrice, quote.pricing.currency || "EUR")}
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700">0% VAT §6 Abs. 1 Zif. 3</span>
                    </div>

                    {/* Interactive Action Buttons per User Requirement:
                        - Contract agreement button
                        - Book button (moves to Bookings)
                        - Revise button
                        - View documents dropdown */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Contract Agreement Button */}
                      <button
                        onClick={() => openDocument(quote, "charter_agreement")}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141A29] hover:bg-[#1C2436] text-[#C9A052] font-bold text-xs shadow-sm transition-all cursor-pointer"
                        title="Open or execute Master Charter Agreement"
                      >
                        <ScrollText className="w-3.5 h-3.5" />
                        <span>Contract Agreement</span>
                      </button>

                      {/* Book Button */}
                      {!isBooked ? (
                        <button
                          onClick={() => handleBookQuote(quote)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer"
                          title="Convert quotation immediately to confirmed booking"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Book</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedBookingForDetail(quote);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Booked ({quote.tripNumber})</span>
                        </button>
                      )}

                      {/* Revise Button */}
                      <button
                        onClick={() => handleStartRevise(quote)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F5F2EC] hover:bg-[#EBE5DB] text-[#0F1420] border border-[#E0DAD0] font-bold text-xs shadow-sm transition-all cursor-pointer"
                        title="Revise route, aircraft images, and pricing"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#C9A052]" />
                        <span>Revise</span>
                      </button>

                      {/* Show Other Documents Modal Trigger */}
                      <button
                        onClick={() => setSelectedQuoteForDocs(quote)}
                        className="p-2 rounded-xl bg-[#F5F2EC] hover:bg-[#EBE5DB] text-[#0F1420] border border-[#E0DAD0] transition-colors"
                        title="View other generated documents (Briefs, Invoices, Agreements, Credit Notes)"
                      >
                        <FileText className="w-4 h-4 text-[#C9A052]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredQuotes.length === 0 && (
            <div className="bg-white border border-[#E0DAD0] rounded-2xl p-12 text-center space-y-3">
              <FileText className="w-10 h-10 text-gray-300 mx-auto" />
              <h3 className="text-base font-bold text-[#0F1420]">No quotes matching filters</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                No quotation records found for your search. Click below to start the quote generator.
              </p>
              <button
                onClick={() => setActiveTab("builder")}
                className="px-4 py-2 rounded-xl bg-[#0F1420] text-white text-xs font-bold"
              >
                + Create New Quote
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ================= QUOTE BUILDER & REVISION VIEW ================= */
        <form onSubmit={handleGenerateQuoteSubmit} className="space-y-6">
          {/* Top Banner Notice */}
          {bookingToRevise && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold">
                <RotateCcw className="w-4 h-4 text-[#C9A052]" />
                <span>Revising Existing Proposal: {bookingToRevise.quoteReference || bookingToRevise.tripNumber}. Altering routes will supersede previous itineraries and adjust accounting automatically.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBookingToRevise(null);
                  setActiveTab("list");
                }}
                className="text-xs text-amber-800 underline font-bold"
              >
                Cancel Revision
              </button>
            </div>
          )}

          {/* Validation Warnings */}
          {validationErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs text-red-800">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>Important fields must be filled before quotation submission:</span>
              </div>
              <ul className="list-disc list-inside text-xs text-red-700 pl-1 space-y-0.5">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* SECTION 1: Quote Details & Client Link */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E0DAD0]">
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#0F1420] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C9A052]" />
                <span>1. Quotation Identification & Client Account</span>
              </h3>

              {/* Quick Select Account Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-bold hidden sm:inline">Linked Account:</span>
                <select
                  value={selectedAccountId}
                  onChange={(e) => handleSelectAccount(e.target.value)}
                  className="bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-1.5 text-xs text-[#0F1420] font-semibold focus:outline-none focus:border-[#C9A052]"
                >
                  <option value="">-- Choose Account from Registry --</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.accountNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0F1420] mb-1">
                  Quote Reference ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={quoteReference}
                  onChange={(e) => setQuoteReference(e.target.value)}
                  placeholder="QTE-2026-842"
                  className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F1420] mb-1">
                  Contract Issue Date
                </label>
                <input
                  type="text"
                  value={contractDate}
                  onChange={(e) => setContractDate(e.target.value)}
                  className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F1420] mb-1">
                  Quote Expiration (UTC)
                </label>
                <input
                  type="text"
                  value={quoteExpirationDate}
                  onChange={(e) => setQuoteExpirationDate(e.target.value)}
                  className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F1420] mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#0F1420] font-bold focus:outline-none focus:border-[#C9A052]"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CHF">CHF (CHF)</option>
                </select>
              </div>
            </div>

            {/* Client Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#0F1420] mb-1">
                  Client Full Legal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Edward Brinkmann"
                  className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F1420] mb-1">
                  Client Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="ebrinkmann@bgcapital.com"
                  className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F1420] mb-1">
                  Client Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+377 97 97 12 00"
                  className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs text-[#0F1420] font-medium focus:outline-none focus:border-[#C9A052]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Aircraft Selection & AIRCRAFT IMAGES CUSTOMIZATION */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E0DAD0]">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#0F1420] flex items-center gap-2">
                  <Plane className="w-4 h-4 text-[#C9A052]" />
                  <span>2. Aircraft Assignment & Image Customization</span>
                </h3>
                <p className="text-[11px] text-gray-500">
                  Select fleet model and edit exterior and cabin interior images rendered on the official quote PDF.
                </p>
              </div>

              <select
                value={selectedAircraftId}
                onChange={(e) => setSelectedAircraftId(e.target.value)}
                className="bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-1.5 text-xs text-[#0F1420] font-bold focus:outline-none focus:border-[#C9A052]"
              >
                {fleetData.slice(0, 25).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.categoryLabel} - {a.passengers} seats)
                  </option>
                ))}
              </select>
            </div>

            {/* Live Aircraft Preview and Image Editors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              {/* Exterior Image Customizer */}
              <div className="p-4 rounded-xl border border-[#E0DAD0] bg-[#FDFCFA] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F1420] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#C9A052]" />
                    <span>Aircraft Exterior Image</span>
                  </span>
                  <span className="text-[10px] font-mono text-gray-500">Shown on Proposal Cover</span>
                </div>

                <div className="h-44 rounded-xl overflow-hidden border border-gray-200 bg-[#141A29] relative">
                  <img
                    src={customExteriorImage || currentAircraft.imageExterior}
                    alt="Aircraft Exterior"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-white font-mono text-[10px] font-bold">
                    Exterior Preview
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Exterior Photo Image URL (or paste custom asset):
                  </label>
                  <input
                    type="url"
                    value={customExteriorImage}
                    onChange={(e) => setCustomExteriorImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>

              {/* Interior Cabin Image Customizer */}
              <div className="p-4 rounded-xl border border-[#E0DAD0] bg-[#FDFCFA] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F1420] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#C9A052]" />
                    <span>VIP Cabin Interior Image</span>
                  </span>
                  <span className="text-[10px] font-mono text-gray-500">Shown in Cabin Spec</span>
                </div>

                <div className="h-44 rounded-xl overflow-hidden border border-gray-200 bg-[#141A29] relative">
                  <img
                    src={customInteriorImage || currentAircraft.imageInterior}
                    alt="Cabin Interior"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-white font-mono text-[10px] font-bold">
                    Cabin Interior Preview
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Cabin Interior Photo URL:
                  </label>
                  <input
                    type="url"
                    value={customInteriorImage}
                    onChange={(e) => setCustomInteriorImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl px-3 py-1.5 text-xs font-mono text-[#0F1420] focus:outline-none focus:border-[#C9A052]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Itinerary Legs */}
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E0DAD0]">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#0F1420] flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#C9A052]" />
                  <span>3. Flight Itinerary Routing ({legs.length} Legs)</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddLeg}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0F1420] text-[#C9A052] font-bold text-xs hover:bg-[#1C2436]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Leg</span>
              </button>
            </div>

            <div className="space-y-3">
              {legs.map((leg, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-[#E0DAD0] bg-[#FDFCFA] grid grid-cols-1 sm:grid-cols-6 gap-3 items-end"
                >
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">
                      Origin ICAO <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={leg.originIcao}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setLegs((prev) => prev.map((l, i) => (i === idx ? { ...l, originIcao: val } : l)));
                      }}
                      placeholder="LSGG"
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[#0F1420]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">
                      Dest ICAO <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={leg.destIcao}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setLegs((prev) => prev.map((l, i) => (i === idx ? { ...l, destIcao: val } : l)));
                      }}
                      placeholder="LIMJ"
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[#0F1420]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">
                      Flight Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={leg.flightDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLegs((prev) => prev.map((l, i) => (i === idx ? { ...l, flightDate: val } : l)));
                      }}
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">
                      Dep Time Local
                    </label>
                    <input
                      type="time"
                      value={leg.departureTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLegs((prev) => prev.map((l, i) => (i === idx ? { ...l, departureTime: val } : l)));
                      }}
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">
                      Passengers
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={currentAircraft.passengers}
                      value={leg.paxCount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setLegs((prev) => prev.map((l, i) => (i === idx ? { ...l, paxCount: val } : l)));
                      }}
                      className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-lg px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>

                  <div className="flex justify-end">
                    {legs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLeg(idx)}
                        className="p-2 text-red-500 hover:text-red-700 text-xs font-bold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Preview & Submit Bar */}
          <div className="bg-[#0F1420] text-white rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <span className="text-[10px] font-mono text-[#C9A052] uppercase block font-bold">
                ESTIMATED PROPOSAL TOTAL
              </span>
              <div className="text-3xl font-black font-mono text-white">
                {formatCurrency(calculatedPricing.totalFlightPrice, currency)}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Includes Base Charter ({formatCurrency(calculatedPricing.flightPrice, currency)}), Airport Fees ({formatCurrency(calculatedPricing.airportFees, currency)}), and Services ({formatCurrency(calculatedPricing.additionalServicesTotal, currency)}).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("list")}
                className="px-4 py-2.5 rounded-xl border border-gray-600 text-xs font-bold text-gray-300 hover:text-white"
              >
                Back to Quotes List
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                {bookingToRevise ? "Compile Revised Quote" : "Generate Official Quotation"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Show Other Documents Modal */}
      {selectedQuoteForDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#D1C9BC] space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#C9A052] font-bold">
                  ASSOCIATED CHARTER DOCUMENTS
                </span>
                <h3 className="text-lg font-black text-[#0F1420]">
                  Documents for {selectedQuoteForDocs.quoteReference || selectedQuoteForDocs.tripNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedQuoteForDocs(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setSelectedQuoteForDocs(null);
                  openDocument(selectedQuoteForDocs, "quotation");
                }}
                className="w-full p-3 rounded-xl bg-[#F5F2EC] hover:bg-[#EBE5DB] flex items-center justify-between transition-colors text-xs font-bold text-[#0F1420]"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[#C9A052]" />
                  <span>Official Quotation PDF</span>
                </div>
                <span className="text-[11px] font-mono text-gray-500">DOC-1 (Quotation)</span>
              </button>

              <button
                onClick={() => {
                  setSelectedQuoteForDocs(null);
                  openDocument(selectedQuoteForDocs, "charter_agreement");
                }}
                className="w-full p-3 rounded-xl bg-[#F5F2EC] hover:bg-[#EBE5DB] flex items-center justify-between transition-colors text-xs font-bold text-[#0F1420]"
              >
                <div className="flex items-center gap-2.5">
                  <ScrollText className="w-4 h-4 text-[#C9A052]" />
                  <span>Charter Agreement Contract</span>
                </div>
                <span className="text-[11px] font-mono text-gray-500">Agreement Contract</span>
              </button>

              <button
                onClick={() => {
                  setSelectedQuoteForDocs(null);
                  openDocument(selectedQuoteForDocs, "flight_brief");
                }}
                className="w-full p-3 rounded-xl bg-[#F5F2EC] hover:bg-[#EBE5DB] flex items-center justify-between transition-colors text-xs font-bold text-[#0F1420]"
              >
                <div className="flex items-center gap-2.5">
                  <Compass className="w-4 h-4 text-[#C9A052]" />
                  <span>Flight Brief & Operational Dispatch</span>
                </div>
                <span className="text-[11px] font-mono text-gray-500">Crew & Handlers</span>
              </button>

              <button
                onClick={() => {
                  setSelectedQuoteForDocs(null);
                  openDocument(selectedQuoteForDocs, "invoice");
                }}
                className="w-full p-3 rounded-xl bg-[#F5F2EC] hover:bg-[#EBE5DB] flex items-center justify-between transition-colors text-xs font-bold text-[#0F1420]"
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 text-[#C9A052]" />
                  <span>Commercial Tax Invoice</span>
                </div>
                <span className="text-[11px] font-mono text-gray-500">Tax Invoice</span>
              </button>

              <button
                onClick={() => {
                  setSelectedQuoteForDocs(null);
                  openDocument(selectedQuoteForDocs, "credit_note");
                }}
                className="w-full p-3 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-between transition-colors text-xs font-bold text-red-900 border border-red-200"
              >
                <div className="flex items-center gap-2.5">
                  <RotateCcw className="w-4 h-4 text-red-600" />
                  <span>Credit Note & Settlement Document</span>
                </div>
                <span className="text-[11px] font-mono text-red-700">Credit Adjustment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

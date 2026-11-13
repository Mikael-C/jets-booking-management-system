"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAviation } from "@/lib/aviationContext";
import { Booking, FlightLeg, TripType } from "@/types/aviation";
import { findAirportByCode } from "@/data/airports";
import AirportSearchSelect from "@/components/common/AirportSearchSelect";
import { defaultOperator } from "@/data/initialBookings";
import { formatCurrency } from "@/lib/pricingCalculator";
import { api } from "@/lib/api";
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
  RefreshCw,
  Search,
  Layers,
  ArrowRight,
  ChevronRight,
  X,
  Eye,
  Edit2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RotateCcw
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
  const { bookings, openDocument, createInvoice, getInvoices } = useAviation();

  const [activeTab, setActiveTab] = useState<"list" | "builder">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [selectedBookingId, setSelectedBookingId] = useState<string>(bookings[0]?.id || "");
  const selectedBooking = bookings.find((b) => b.id === selectedBookingId) || bookings[0];

  const [expandedTripIds, setExpandedTripIds] = useState<Set<string>>(new Set());
  const [consolidatedInvoiceError, setConsolidatedInvoiceError] = useState("");

  // Group invoices / booked flights by tripId
  const tripGroupedInvoices = useMemo(() => {
    const map = new Map<string, { latest: Booking; allRevisions: Booking[] }>();
    const invoiceEligible = bookings.filter(
      (b) => b.isBooked || ["confirmed", "dispatched", "in_flight", "completed", "flown"].includes(b.status)
    );
    for (const b of invoiceEligible) {
      const tId = b.tripId || b.id;
      const existing = map.get(tId);
      if (!existing) {
        map.set(tId, { latest: b, allRevisions: [b] });
      } else {
        existing.allRevisions.push(b);
        const active = !b.isCancelled;
        const latestActive = !existing.latest.isCancelled;
        if (active && !latestActive) {
          existing.latest = b;
        } else if (active === latestActive && Number((b.bookingRevisionId || "").split("-").pop()) >
          Number((existing.latest.bookingRevisionId || "").split("-").pop())) {
          existing.latest = b;
        }
      }
    }
    return Array.from(map.values()).map((g) => ({
      ...g,
      allRevisions: g.allRevisions.sort((a, b) =>
        Number((b.bookingRevisionId || "").split("-").pop()) - Number((a.bookingRevisionId || "").split("-").pop())
      )
    }));
  }, [bookings]);

  const invoicesList = useMemo(() => {
    return tripGroupedInvoices.map((g) => g.latest);
  }, [tripGroupedInvoices]);

  const filteredTripInvoices = useMemo(() => {
    return tripGroupedInvoices.filter(({ latest: b }) => {
      if (statusFilter !== "all") {
        if (statusFilter === "paid" && b.paymentStatus !== "fully_paid") return false;
        if (statusFilter === "unpaid" && b.paymentStatus !== "unpaid") return false;
        if (statusFilter === "overdue" && b.paymentStatus !== "overdue") return false;
      }
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchInv = (b.invoiceNumber || "").toLowerCase().includes(q);
        const matchTrip = (b.tripNumber || b.tripId || "").toLowerCase().includes(q);
        const matchClient = (b.client?.fullName || "").toLowerCase().includes(q);
        const matchAccount = (b.accountNumber || "").toLowerCase().includes(q);
        if (!matchInv && !matchTrip && !matchClient && !matchAccount) return false;
      }
      return true;
    });
  }, [tripGroupedInvoices, statusFilter, searchQuery]);

  const toggleTripExpand = (tripId: string) => {
    setExpandedTripIds((prev) => {
      const next = new Set(prev);
      if (next.has(tripId)) next.delete(tripId);
      else next.add(tripId);
      return next;
    });
  };

  const openConsolidatedInvoice = async (booking: Booking) => {
    const revisions = bookings.filter((item) =>
      (booking.tripId ? item.tripId === booking.tripId : item.tripNumber === booking.tripNumber) &&
      (item.isBooked || ["confirmed", "dispatched", "in_flight", "completed", "flown"].includes(item.status))
    );
    const creditNotes = new Map<string, NonNullable<Booking["creditNotes"]>[number]>();
    revisions.forEach((revision) => (revision.creditNotes || []).forEach((note) => {
      const key = note.creditNoteNumber || note.number || note.id;
      if (key) creditNotes.set(key, note);
    }));
    const localLedger = [
      ...revisions.map((revision) => ({
        type: "invoice" as const,
        invoiceNumber: revision.invoiceNumber,
        bookingRevisionId: revision.bookingRevisionId,
        amount: revision.pricing.totalFlightPrice || 0
      })),
      ...Array.from(creditNotes.values()).map((note) => ({
        type: "credit_note" as const,
        creditNoteNumber: note.creditNoteNumber || note.number,
        amount: note.amount,
        reason: note.reason
      }))
    ];
    let consolidatedInvoice = {
      tripId: booking.tripId || booking.tripNumber,
      currency: booking.pricing.currency,
      finalBalance: booking.pricing.totalFlightPrice || 0,
      latestBookingRevisionId: booking.bookingRevisionId || "",
      invoiceCount: revisions.filter((revision) => revision.invoiceNumber).length,
      ledger: localLedger
    };

    try {
      const response = await api.bookings.tripInvoices(booking.tripId || booking.tripNumber);
      if (response?.consolidated) {
        consolidatedInvoice = { ...response.consolidated, ledger: response.ledger || localLedger };
      }
      setConsolidatedInvoiceError("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "The backend trip ledger is unavailable.";
      setConsolidatedInvoiceError(`Using available local revision data. ${message}`);
      console.warn("Consolidated invoice backend lookup notice:", message);
    }

    openDocument({ ...booking, consolidatedInvoice }, "invoice");
  };

  // Invoice & Trip References
  const [invoiceNumber, setInvoiceNumber] = useState("00106020");
  const [tripNumber, setTripNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("2{21737}");
  const [invoiceDate, setInvoiceDate] = useState("02.10.2026");
  const [paymentDueDate, setPaymentDueDate] = useState("03.10.2026");
  const [currency, setCurrency] = useState<"EUR" | "USD" | "GBP" | "CHF">("EUR");

  // Bill-To Entity (TO)
  const [clientName, setClientName] = useState("Edward Brinkmann");
  const [companyName, setCompanyName] = useState("Edward Brinkmann");
  const [streetAddress, setStreetAddress] = useState("3606 Enterprise Ave");
  const [cityCountry, setCityCountry] = useState("FL-34104 Naples, United States");
  const [clientVat, setClientVat] = useState("US-8492041");

  // Remittance Entity (FROM)
  const [operatorName, setOperatorName] = useState(defaultOperator.companyName);
  const [repName, setRepName] = useState(defaultOperator.representativeName);
  const [operatorEmail, setOperatorEmail] = useState(defaultOperator.supportEmail);
  const [operatorPhone, setOperatorPhone] = useState(defaultOperator.supportPhone);
  const [operatorVat, setOperatorVat] = useState(defaultOperator.vatNumber);

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
  const [bankName, setBankName] = useState(defaultOperator.bankName);
  const [iban, setIban] = useState(defaultOperator.iban);
  const [bic, setBic] = useState(defaultOperator.bic);
  const [accountHolder, setAccountHolder] = useState(defaultOperator.accountHolder);
  const [paymentTermsNote, setPaymentTermsNote] = useState(
    "Customer agrees to pay all bank charges. SEPA wiring or Fedwire is preferred."
  );

  const [success, setSuccess] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchGeneratedCount, setBatchGeneratedCount] = useState<number | null>(null);

  const populateFromBooking = (b: Booking) => {
    setSelectedBookingId(b.id);
    setInvoiceNumber(b.invoiceNumber || `0010${Math.floor(6020 + Math.random() * 3970)}`);
    setTripNumber(b.tripNumber || "");
    setAccountNumber(b.accountNumber || "ACC-21737");
    setInvoiceDate(b.contractDate || "02.10.2026");
    setPaymentDueDate(b.paymentDueDate || "03.10.2026");
    setCurrency(b.pricing?.currency || "EUR");

    setClientName(b.client.fullName);
    setCompanyName(b.client.companyName || b.client.fullName);
    setStreetAddress(b.client.streetAddress);
    setCityCountry(b.client.cityPostalCountry);
    setClientVat(b.client.vatNumber || "");

    setOperatorName(b.operator?.companyName || defaultOperator.companyName);
    setRepName(b.operator?.representativeName || defaultOperator.representativeName);
    setOperatorEmail(b.operator?.supportEmail || defaultOperator.supportEmail);
    setOperatorPhone(b.operator?.supportPhone || defaultOperator.supportPhone);
    setOperatorVat(b.operator?.vatNumber || defaultOperator.vatNumber);

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
  };

  // Sync state when selecting a booking from dropdown
  const handleBookingChange = (id: string) => {
    const b = bookings.find((item) => item.id === id);
    if (b) {
      populateFromBooking(b);
    }
  };

  // Keyed smart lookup by Trip #, Invoice #, Quote Ref, Account #, or Client name
  const handleKeyedLookup = (query: string) => {
    setLookupQuery(query);
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return;

    const matched = bookings.find((b) =>
      (b.tripNumber && b.tripNumber.toLowerCase().includes(trimmed)) ||
      (b.invoiceNumber && b.invoiceNumber.toLowerCase().includes(trimmed)) ||
      (b.quoteReference && b.quoteReference.toLowerCase().includes(trimmed)) ||
      (b.accountNumber && b.accountNumber.toLowerCase().includes(trimmed)) ||
      (b.client.fullName.toLowerCase().includes(trimmed))
    );

    if (matched) {
      populateFromBooking(matched);
      setFeedbackMsg(`✓ Loaded flight details for ${matched.client.fullName} (${matched.tripNumber})`);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  // Generate unique collision-free invoice number
  const generateUniqueInvoiceNumber = () => {
    const existing = new Set(bookings.map((b) => b.invoiceNumber));
    let uniqueNum = "";
    let attempts = 0;
    do {
      uniqueNum = `0010${Math.floor(6020 + Math.random() * 3970)}`;
      attempts++;
    } while (existing.has(uniqueNum) && attempts < 100);
    setInvoiceNumber(uniqueNum);
    setFeedbackMsg(`✓ Assigned new unique invoice #${uniqueNum}`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Batch generate unique invoices in one click
  const handleBatchGenerateInvoices = () => {
    let baseSeq = 106030;
    const existing = new Set(bookings.map((b) => b.invoiceNumber));
    let count = 0;
    bookings.forEach((b) => {
      if (!b.invoiceNumber || b.invoiceNumber === "00106020" || b.invoiceNumber.includes("PENDING")) {
        while (existing.has(`00${baseSeq}`)) {
          baseSeq++;
        }
        const newInv = `00${baseSeq}`;
        existing.add(newInv);
        b.invoiceNumber = newInv;
        count++;
        baseSeq++;
      }
    });
    setBatchGeneratedCount(count);
    setFeedbackMsg(`✓ Successfully batch generated ${count} unique commercial invoices with sequential numbering!`);
    setTimeout(() => {
      setIsBatchModalOpen(false);
      setFeedbackMsg(null);
    }, 3500);
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

    createInvoice(selectedBooking).then((saved) => {
      setSuccess(true);
      setActiveTab("list");
      openDocument(saved, "invoice");
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-[#0F1420] text-white rounded-2xl p-6 sm:p-8 border border-[#1C2436] shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C9A052]/20 text-[#C9A052] border border-[#C9A052]/40 uppercase flex items-center gap-1">
              <Receipt className="w-3 h-3" />
              COMMERCIAL INVOICING & SETTLEMENTS
            </span>
            <span className="text-gray-400 text-xs font-mono">• {invoicesList.length} Generated Invoices</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Invoice Management & Generator
          </h1>
          <p className="text-xs text-gray-300 leading-relaxed">
            Review all generated commercial tax invoices with official tax numbers, inspect payment and settlement statuses, view official invoice PDFs, or compile a new commercial flight invoice.
          </p>
        </div>

        {/* Tab Switcher at Top Right */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#141A29] border border-[#1C2436]">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "list"
                ? "bg-[#C9A052] text-[#0F1420] shadow-sm font-black"
                : "text-gray-300 hover:text-white"
            }`}
          >
            All Generated Invoices ({invoicesList.length})
          </button>
          <button
            onClick={() => setActiveTab("builder")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "builder"
                ? "bg-[#C9A052] text-[#0F1420] shadow-sm font-black"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate New Invoice</span>
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
                placeholder="Search by Invoice # (e.g. 00106020), Trip #, Client Name, or Account..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E0DAD0] bg-[#F5F2EC] text-xs text-[#0F1420] font-medium placeholder-gray-400 focus:outline-none focus:border-[#C9A052] focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === "all" ? "bg-[#0F1420] text-white" : "bg-[#F5F2EC] text-gray-700 hover:bg-[#EBE5DB]"
                }`}
              >
                All Invoices
              </button>
              <button
                onClick={() => setStatusFilter("paid")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === "paid" ? "bg-[#0F1420] text-white" : "bg-[#F5F2EC] text-gray-700 hover:bg-[#EBE5DB]"
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setStatusFilter("unpaid")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === "unpaid" ? "bg-[#0F1420] text-white" : "bg-[#F5F2EC] text-gray-700 hover:bg-[#EBE5DB]"
                }`}
              >
                Unpaid
              </button>
              <button
                onClick={() => setStatusFilter("overdue")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === "overdue" ? "bg-[#0F1420] text-white" : "bg-[#F5F2EC] text-gray-700 hover:bg-[#EBE5DB]"
                }`}
              >
                Overdue
              </button>
            </div>
          </div>

          {/* Invoices List Cards Grouped by Trip */}
          <div className="space-y-4">
            {filteredTripInvoices.map(({ latest: inv, allRevisions }) => {
              const tId = inv.tripId || inv.id;
              const isExpanded = expandedTripIds.has(tId);
              const hasMultiple = allRevisions.length > 1;
              const isPaid = inv.paymentStatus === "fully_paid";
              const isOverdue = inv.paymentStatus === "overdue";
              const isDeposit = inv.paymentStatus === "deposit_paid";
              const invoiceTotal = inv.pricing?.totalFlightPrice || 12870;
              const currencySymbol = inv.pricing?.currency || "EUR";

              return (
                <div
                  key={tId}
                  className="bg-white border border-[#E0DAD0] hover:border-[#C9A052] rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 group">
                    {/* Left: Invoice Reference & Route */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#E0DAD0] flex items-center justify-center flex-shrink-0 group-hover:border-[#C9A052] transition-colors">
                        <Receipt className="w-6 h-6 text-[#C9A052]" />
                      </div>

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-black text-[#0F1420] px-2.5 py-0.5 rounded bg-[#F5F2EC] border border-[#E0DAD0]">
                            INV-{inv.invoiceNumber || inv.tripNumber}
                          </span>
                          <span className="text-xs font-mono text-[#0F1420] font-bold px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E0DAD0]">
                            Trip: {inv.tripId || "Not assigned"}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                              isPaid
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : isOverdue
                                ? "bg-red-100 text-red-800 border-red-300"
                                : isDeposit
                                ? "bg-blue-100 text-blue-800 border-blue-300"
                                : "bg-amber-100 text-amber-800 border-amber-300"
                            }`}
                          >
                            {isPaid ? "FULLY PAID" : isOverdue ? "OVERDUE" : isDeposit ? "DEPOSIT PAID" : "PAYMENT PENDING"}
                          </span>

                          {hasMultiple && (
                            <button
                              type="button"
                              onClick={() => toggleTripExpand(tId)}
                              className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1 hover:bg-purple-200 transition-colors"
                            >
                              <span>{allRevisions.length} Trip Iterations</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-[#0F1420]">
                            {inv.legs[0]?.origin.city || "Geneva"} ({inv.legs[0]?.origin.icao})
                          </h3>
                          <span className="text-[#C9A052] font-bold">⇄</span>
                          <h3 className="text-base font-extrabold text-[#0F1420]">
                            {inv.legs[inv.legs.length - 1]?.destination.city || "Genoa"} ({inv.legs[inv.legs.length - 1]?.destination.icao})
                          </h3>
                          {inv.legs.length > 2 && (
                            <span className="text-xs text-gray-400 font-mono">+{inv.legs.length - 1} legs</span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span className="font-semibold text-[#0F1420] flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span>{inv.client.fullName}</span>
                          </span>
                          <span>•</span>
                          <span className="font-mono text-gray-500">Acc: {inv.accountNumber || "ACC-21737"}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-gray-500">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>Due: {inv.paymentDueDate || "03.10.2026"}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Pricing & Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between lg:justify-end gap-4 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] font-mono text-gray-400 uppercase">Total Payable</div>
                        <div className="text-lg font-black text-[#0F1420] font-mono">
                          {formatCurrency(invoiceTotal, currencySymbol)}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-600 font-bold">
                          VAT 0% Exempt (§6 Abs. 1)
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Consolidated Invoice Button */}
                        <button
                          onClick={() => openConsolidatedInvoice(inv)}
                          className="px-3 py-2 rounded-xl bg-[#0F1420] hover:bg-[#1A2338] text-[#C9A052] border border-[#C9A052]/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                          title="Generate Consolidated All-Iterations Commercial Invoice"
                        >
                          <Receipt className="w-3.5 h-3.5 text-[#C9A052]" />
                          <span>Consolidated Invoice</span>
                        </button>

                        <button
                          onClick={() => openDocument(inv, "invoice")}
                          className="px-3.5 py-2 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                          title="View official tax invoice PDF"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View PDF</span>
                        </button>

                        <button
                          onClick={() => {
                            populateFromBooking(inv);
                            setActiveTab("builder");
                          }}
                          className="px-3 py-2 rounded-xl bg-[#F5F2EC] hover:bg-[#EBE5DB] text-[#0F1420] text-xs font-bold transition-all border border-[#E0DAD0] flex items-center gap-1 cursor-pointer"
                          title="Edit and re-compile this invoice"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  {consolidatedInvoiceError && (
                    <p className="px-5 pb-2 text-[10px] text-amber-700 font-mono">{consolidatedInvoiceError}</p>
                  )}

                  {/* Expandable Revisions Sublevel */}
                  {hasMultiple && isExpanded && (
                    <div className="border-t border-[#E0DAD0] bg-[#FAFAF8]">
                      <div className="px-5 py-2.5 flex items-center justify-between text-[11px] font-mono font-bold uppercase text-gray-500 tracking-wider border-b border-[#E0DAD0]">
                        <span className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#C9A052]" />
                          All Invoiced Iterations for Trip {inv.tripId || inv.tripNumber}
                        </span>
                        <span className="text-[#C9A052]">Strictly Synchronized with Booking Records</span>
                      </div>
                      <div className="divide-y divide-[#E0DAD0]">
                        {allRevisions.map((rev, revIdx) => (
                          <div key={rev.id || revIdx} className="px-6 py-3 flex items-center justify-between gap-4 text-xs bg-white hover:bg-[#FDFCFA] transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-[#0F1420]">
                                    {rev.bookingRevisionId || rev.quoteId || `Iteration ${rev.quoteVersion || revIdx + 1}`}
                                  </span>
                                  {rev.id === inv.id && (
                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      Latest Active
                                    </span>
                                  )}
                                  <span className="font-mono text-gray-400 text-[11px]">
                                    Inv #{rev.invoiceNumber || inv.invoiceNumber}
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                                  Routing: {rev.legs?.[0]?.origin?.icao} → {rev.legs?.[rev.legs?.length - 1]?.destination?.icao} · Total: {formatCurrency(rev.pricing?.totalFlightPrice || 12870, rev.pricing?.currency || "EUR")}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => openDocument(rev, "invoice")}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F5F2EC] hover:bg-[#EBE5DB] text-[#0F1420] font-bold text-[11px] border border-[#E0DAD0] transition-colors flex-shrink-0"
                            >
                              <Eye className="w-3 h-3 text-[#C9A052]" />
                              <span>View Iteration PDF</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredTripInvoices.length === 0 && (
              <div className="bg-white border border-[#E0DAD0] rounded-2xl p-12 text-center space-y-4">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="text-base font-bold text-[#0F1420]">No Invoices Found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  No generated tax invoices matched your search criteria. Compile a new commercial flight invoice.
                </p>
                <button
                  onClick={() => setActiveTab("builder")}
                  className="px-5 py-2.5 rounded-xl bg-[#C9A052] text-[#0F1420] font-black text-xs transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate New Invoice</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Invoice Builder Form */
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
          {/* Back to List Navigation Banner */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveTab("list")}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#0F1420] hover:text-[#C9A052] transition-colors bg-white px-4 py-2 rounded-xl border border-[#E0DAD0] shadow-sm cursor-pointer"
            >
              ← Back to All Generated Invoices
            </button>
            <span className="text-xs font-mono text-gray-500">Invoice Compiler Mode</span>
          </div>

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

            {/* Trip Selector & Batch Invoicing */}
            <div className="flex flex-wrap items-center gap-3">
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

              <button
                type="button"
                onClick={() => setIsBatchModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F1420] hover:bg-[#1A2338] text-[#C9A052] border border-[#C9A052]/40 text-xs font-mono font-bold transition-all shadow-sm"
                title="Batch generate unique invoices for multiple flights in one click"
              >
                <Layers className="w-3.5 h-3.5 text-[#C9A052]" />
                <span>Batch Generate Invoices</span>
              </button>
            </div>
          </div>

      {/* Keyed Smart Lookup Bar */}
      <div className="p-4 bg-white border border-[#E0DAD0] rounded-2xl shadow-sm space-y-2">
        <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#0F1420]">
          Keyed Booking Lookup (Auto-Populate All Details)
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Key in Trip Number (e.g. PEU842-001), Invoice #, Quote Ref, Account #, or Client Name to auto-fill..."
              value={lookupQuery}
              onChange={(e) => handleKeyedLookup(e.target.value)}
              className="w-full bg-[#F5F2EC] border border-[#E0DAD0] rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-[#0F1420] placeholder-gray-400 focus:outline-none focus:border-[#C9A052]"
            />
          </div>
          {lookupQuery && (
            <button
              type="button"
              onClick={() => setLookupQuery("")}
              className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-mono text-gray-600"
            >
              Clear
            </button>
          )}
        </div>
        <p className="text-[10px] text-gray-500 font-mono">
          Keying in any identifier instantly matches the booked flight and links all client, route, and financial breakdown details.
        </p>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-xl bg-[#C9A052]/15 border border-[#C9A052]/40 text-[#0F1420] text-xs font-bold flex items-center justify-between">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-gray-500 hover:text-black">✕</button>
        </div>
      )}

      {/* Batch Invoices Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0DAD0]">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#C9A052]" />
                <h3 className="text-sm font-black font-mono uppercase text-[#0F1420]">
                  Batch Invoicing Engine
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="text-gray-400 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Generate unique sequential invoice numbers across all booked flights in the register in one single batch action.
            </p>

            <div className="p-3.5 bg-[#F5F2EC] rounded-xl border border-[#E0DAD0] text-xs font-mono space-y-1">
              <p>Total Bookings in Registry: <strong>{bookings.length}</strong></p>
              <p>Unassigned / Default Invoices: <strong>{bookings.filter((b) => !b.invoiceNumber || b.invoiceNumber === "00106020" || b.invoiceNumber.includes("PENDING")).length}</strong></p>
              <p className="text-emerald-700 font-bold">Uniqueness Constraint: Guaranteed (Collision-Free Series)</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-[#0F1420]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchGenerateInvoices}
                className="px-4 py-2 rounded-xl bg-[#C9A052] hover:bg-[#B88F42] text-[#0F1420] text-xs font-black uppercase font-mono tracking-wider shadow-md"
              >
                Generate All Invoices
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-[#0F1420]/80 uppercase font-mono">
                  Invoice Number
                </label>
                <button
                  type="button"
                  onClick={generateUniqueInvoiceNumber}
                  className="text-[10px] font-mono text-[#9A7A35] hover:text-[#0F1420] flex items-center gap-0.5"
                  title="Generate Unique Number"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Unique</span>
                </button>
              </div>
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
                readOnly
                placeholder="Assigned by the server"
                title="Trip number is assigned by the backend"
                className="w-full bg-gray-100 border border-[#E0DAD0] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#0F1420] cursor-not-allowed"
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
                  <AirportSearchSelect
                    value={leg.originIcao}
                    onChange={(value) => handleLegChange(index, "originIcao", value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-[#0F1420]/70 mb-1">
                    To (ICAO)
                  </label>
                  <AirportSearchSelect
                    value={leg.destIcao}
                    onChange={(value) => handleLegChange(index, "destIcao", value)}
                  />
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
  )}
</div>
  );
}

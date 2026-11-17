"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { Booking, FlightLeg, PricingBreakdown, PassengerManifestItem, SourcingOption } from "@/types/aviation";
import { formatTripVersion, formatDocumentId, maskPassportNumber } from "@/lib/idGenerator";
import { formatCurrency } from "@/lib/pricingCalculator";
import { getAirportFbos } from "@/data/airports";
import StageStepper, { TripStage } from "@/components/ui/StageStepper";
import StatusPill from "@/components/ui/StatusPill";
import MissingDataBadge from "@/components/ui/MissingDataBadge";
import {
  Plane,
  Clock,
  User,
  Building2,
  FileText,
  Receipt,
  RotateCcw,
  Plus,
  Compass,
  ScrollText,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Shield,
  CreditCard,
  History,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
  UploadCloud,
  DollarSign,
  X,
  Sparkles,
  Download,
  Calendar,
  Users
} from "lucide-react";

export type TripTabKey =
  | "itinerary"
  | "passengers"
  | "sourcing"
  | "pricing"
  | "services"
  | "documents"
  | "accounting"
  | "revisions"
  | "notes";

interface TripPageShellProps {
  tripId: string;
  initialTab?: TripTabKey;
}

export default function TripPageShell({ tripId, initialTab = "itinerary" }: TripPageShellProps) {
  const router = useRouter();
  const {
    bookings,
    role,
    settings,
    openDocument,
    convertQuoteToBooked,
    issueCreditNote,
    contacts,
    addContact,
    currentUser
  } = useAviation();

  const [activeTab, setActiveTab] = useState<TripTabKey>(initialTab);
  const [copiedAvinode, setCopiedAvinode] = useState(false);

  // Masked passport toggle state
  const [revealedPassports, setRevealedPassports] = useState<Record<string, boolean>>({});

  // Passenger Modal State
  const [isAddPaxModalOpen, setIsAddPaxModalOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [isLeadPax, setIsLeadPax] = useState(false);

  // Sourcing Modal State
  const [isLogOfferModalOpen, setIsLogOfferModalOpen] = useState(false);
  const [offerOperator, setOfferOperator] = useState("GlobeAir AG");
  const [offerAircraft, setOfferAircraft] = useState("Cessna Citation Mustang (OE-FFB)");
  const [offerYom, setOfferYom] = useState(2018);
  const [offerPrice, setOfferPrice] = useState(11200);
  const [offerValidUntil, setOfferValidUntil] = useState("2026-11-20");

  // Service Modal State
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [serviceType, setServiceType] = useState<"limousine" | "catering" | "special_request" | "helicopter">("limousine");
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceClientPrice, setServiceClientPrice] = useState<number>(450);
  const [serviceSupplierCost, setServiceSupplierCost] = useState<number>(320);

  // Credit Note Modal State (R-030 & R-022)
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState<number>(250);
  const [creditReason, setCreditReason] = useState<string>("Complimentary ground handling courtesy adjustment");
  const [creditError, setCreditError] = useState<string>("");

  // Margin Override State (R-019)
  const [marginOverridePercent, setMarginOverridePercent] = useState<number>(10);
  const [marginReason, setMarginReason] = useState<string>("");
  const [isMarginOverridden, setIsMarginOverridden] = useState<boolean>(false);

  // Version Compare Diff Tool State (R-023)
  const [compareVersionA, setCompareVersionA] = useState<number>(1);
  const [compareVersionB, setCompareVersionB] = useState<number>(2);

  // Normalize tripId (e.g. FE4578 or booking-peu842)
  const normalizedId = tripId.toUpperCase().split("-")[0];

  // Find all revisions for this trip root
  const tripVersions = useMemo(() => {
    return bookings.filter((b) => {
      const bTripRoot = (b.tripId || b.tripNumber || b.id).toUpperCase().split("-")[0];
      return bTripRoot === normalizedId || b.id === tripId || b.tripNumber?.includes(tripId);
    });
  }, [bookings, normalizedId, tripId]);

  // Active (latest) version of the trip
  const currentTrip: Booking | undefined = useMemo(() => {
    if (tripVersions.length === 0) {
      return bookings.find((b) => b.id === tripId || b.tripNumber === tripId);
    }
    const sorted = [...tripVersions].sort((a, b) => {
      const verA = a.quoteVersion || 1;
      const verB = b.quoteVersion || 1;
      return verA - verB;
    });
    return sorted[sorted.length - 1];
  }, [tripVersions, bookings, tripId]);

  if (!currentTrip) {
    return (
      <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-10 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-[var(--amber)] mx-auto" />
        <h2 className="text-xl font-bold font-display text-[var(--ink)]">Trip not found</h2>
        <p className="text-xs text-[var(--muted)] font-mono">
          Could not locate flight record matching identifier: {tripId}
        </p>
        <Link href="/quotes" className="btn-secondary inline-flex">
          Back to Quotes
        </Link>
      </div>
    );
  }

  // Determine stage
  const isCancelled = Boolean(currentTrip.isCancelled || currentTrip.status === "cancelled");
  const isBooked = !isCancelled && Boolean(
    currentTrip.isBooked ||
    ["confirmed", "dispatched", "in_flight", "completed", "flown"].includes(currentTrip.status)
  );
  const isContractSent = !isCancelled && currentTrip.status === "contract_sent";
  const isPaid = !isCancelled && currentTrip.paymentStatus === "fully_paid";

  let derivedStage: TripStage = "quoted";
  if (isCancelled) derivedStage = "cancelled";
  else if (currentTrip.status === "completed" || currentTrip.status === "flown") derivedStage = "flown";
  else if (currentTrip.status === "confirmed") derivedStage = "confirmed";
  else if (isPaid) derivedStage = "paid";
  else if (isBooked) derivedStage = "booked";
  else if (isContractSent) derivedStage = "booked";
  else if (currentTrip.status === "in_sourcing") derivedStage = "sourcing";

  // Check missing passenger passports (▲ warning)
  const missingPassportsCount = currentTrip.legs.flatMap((l) => l.passengers).filter(
    (p) => !p.passportNumber || p.passportNumber.length < 5
  ).length;

  const rootId = (currentTrip.tripId || currentTrip.tripNumber || "FE4578").split("-")[0];
  const versionNum = currentTrip.quoteVersion || 1;
  const versionBadge = formatTripVersion(rootId, versionNum);

  // Tabs definition with counts & missing indicators
  const tabs: { key: TripTabKey; label: string; count?: number; hasWarning?: boolean }[] = [
    { key: "itinerary", label: "Itinerary", count: currentTrip.legs.length },
    {
      key: "passengers",
      label: "Passengers",
      count: currentTrip.legs[0]?.passengers.length || currentTrip.legs[0]?.paxCount || 0,
      hasWarning: missingPassportsCount > 0
    },
    { key: "sourcing", label: "Sourcing", count: currentTrip.sourcingOptions?.length || 1 },
    { key: "pricing", label: "Pricing" },
    { key: "services", label: "Services" },
    { key: "documents", label: "Documents", count: (currentTrip.creditNotes?.length || 0) + (isBooked ? 4 : 1) },
    { key: "accounting", label: "Accounting" },
    { key: "revisions", label: "Revisions", count: tripVersions.length || 1 },
    { key: "notes", label: "Notes" }
  ];

  const handleTabChange = (key: TripTabKey) => {
    setActiveTab(key);
    router.push(`/trips/${rootId}/${key}`);
  };

  // Passenger Passport reveal
  const togglePassportReveal = (paxId: string) => {
    setRevealedPassports((prev) => ({
      ...prev,
      [paxId]: !prev[paxId]
    }));
  };

  // Add Passenger from Contacts
  const handleAddPassengerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const contact = contacts.find((c) => c.id === selectedContactId);
    if (!contact) return;

    const newPax: PassengerManifestItem = {
      id: `pax-${Date.now()}`,
      fullName: `${contact.firstName} ${contact.lastName}`,
      passportNumber: contact.passportDetails?.passportNumber || "",
      nationality: contact.passportDetails?.issuingCountry || contact.country || "Austria",
      dateOfBirth: contact.passportDetails?.dateOfBirth,
      passportExpiry: contact.passportDetails?.expirationDate,
      isLeadPassenger: isLeadPax
    };

    currentTrip.legs.forEach((leg) => {
      leg.passengers.push(newPax);
    });

    setIsAddPaxModalOpen(false);
    setSelectedContactId("");
    setIsLeadPax(false);
  };

  // Credit Note Submit
  const handleCreditNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreditError("");
    if (creditAmount <= 0) {
      setCreditError("Credit amount must be greater than zero.");
      return;
    }
    if (creditAmount > currentTrip.pricing.totalFlightPrice) {
      setCreditError(`Credit note cannot exceed total invoiced amount of ${formatCurrency(currentTrip.pricing.totalFlightPrice, currentTrip.pricing.currency)}`);
      return;
    }

    issueCreditNote(currentTrip.id, {
      amount: creditAmount,
      reason: creditReason,
      clientOwes: 0,
      weOweClient: creditAmount,
      netBalance: currentTrip.pricing.totalFlightPrice - creditAmount,
      originalTotal: currentTrip.pricing.totalFlightPrice,
      newTotal: currentTrip.pricing.totalFlightPrice - creditAmount
    });

    setIsCreditNoteModalOpen(false);
  };

  // Sourcing Offer Submit
  const handleLogOfferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newOffer: SourcingOption = {
      id: `src-${Date.now()}`,
      operatorName: offerOperator,
      aircraftType: offerAircraft,
      baseAirport: currentTrip.legs[0]?.origin?.icao || "LSGG",
      price: offerPrice,
      currency: "EUR",
      taxesIncluded: true,
      validUntil: offerValidUntil,
      createdAt: new Date().toISOString()
    };
    if (!currentTrip.sourcingOptions) {
      currentTrip.sourcingOptions = [];
    }
    currentTrip.sourcingOptions.push(newOffer);
    setIsLogOfferModalOpen(false);
  };

  // Primary Actions based on stage
  const renderActions = () => {
    if (isCancelled) {
      return (
        <button
          onClick={() => openDocument(currentTrip, "quotation")}
          className="btn-secondary"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Reprint Quote PDF</span>
        </button>
      );
    }

    if (!isBooked) {
      return (
        <div className="flex items-center gap-2">
          <Link
            href={`/quotes/${currentTrip.id}/revise`}
            className="btn-secondary text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Revise Quote</span>
          </Link>

          <button
            onClick={() => openDocument(currentTrip, "quotation")}
            className="btn-secondary text-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Quote PDF</span>
          </button>

          <button
            onClick={async () => {
              await convertQuoteToBooked(currentTrip.id, currentTrip);
            }}
            className="btn-primary text-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sign Contract (Book)</span>
          </button>
        </div>
      );
    }

    // Booked Stage Actions
    return (
      <div className="flex items-center gap-2">
        <Link
          href={`/quotes/${currentTrip.id}/revise`}
          className="btn-secondary text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Revise Booking</span>
        </Link>

        <button
          onClick={() => openDocument(currentTrip, "invoice")}
          className="btn-secondary text-xs"
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Invoice PDF</span>
        </button>

        <button
          onClick={() => openDocument(currentTrip, "flight_brief")}
          className="btn-primary text-xs"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Flight Brief</span>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* 1. Trip Header & Key Facts (R-015) */}
      <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 text-xs font-mono text-[var(--muted)] mb-2">
          <div className="flex items-center gap-2">
            <Link href={isBooked ? "/bookings" : "/quotes"} className="hover:text-[var(--accent)] hover:underline">
              {isBooked ? "Bookings" : "Quotes"}
            </Link>
            <span>/</span>
            <span className="font-bold text-[var(--ink)]">{rootId}</span>
          </div>

          <span className="font-mono text-xs">
            Latest: <strong className="text-[var(--ink)]">{versionBadge}</strong> ({tripVersions.length} {tripVersions.length === 1 ? "version" : "versions"})
          </span>
        </div>

        {/* Title & Stage Action Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-display text-[var(--ink)] m-0">
              {currentTrip.legs[0]?.origin?.icao || "LSGG"} ⇄ {currentTrip.legs[0]?.destination?.icao || "EGLL"}
            </h1>
            <span className="font-mono text-base font-bold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)] border border-[var(--line)]">
              {versionBadge}
            </span>
            <StatusPill
              label={currentTrip.status.toUpperCase()}
              variant={isCancelled ? "red" : isBooked ? "green" : "blue"}
            />
            {missingPassportsCount > 0 && (
              <MissingDataBadge label={`${missingPassportsCount} missing passport`} />
            )}
          </div>

          <div>{renderActions()}</div>
        </div>

        {/* Stage Stepper Ribbon */}
        <div className="pt-4">
          <StageStepper
            currentStage={derivedStage}
            isCancelled={isCancelled}
            cancelledReason={currentTrip.cancellationReason}
          />
        </div>

        {/* Key Facts Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-4 text-xs">
          <div className="bg-[var(--paper)] rounded p-2.5 border border-[var(--line)]">
            <span className="block font-display text-[10px] uppercase font-bold text-[var(--muted)]">Account</span>
            <span className="font-sans font-bold text-[var(--ink)] truncate block mt-0.5">
              {currentTrip.client.fullName}
            </span>
            <span className="font-mono text-[11px] text-[var(--muted)]">{currentTrip.accountNumber}</span>
          </div>

          <div className="bg-[var(--paper)] rounded p-2.5 border border-[var(--line)]">
            <span className="block font-display text-[10px] uppercase font-bold text-[var(--muted)]">Departure Date</span>
            <span className="font-mono font-bold text-[var(--ink)] block mt-0.5">
              {currentTrip.legs[0]?.flightDate}
            </span>
            <span className="font-mono text-[11px] text-[var(--muted)]">
              {currentTrip.legs[0]?.departureTimeLocal} Local
            </span>
          </div>

          <div className="bg-[var(--paper)] rounded p-2.5 border border-[var(--line)]">
            <span className="block font-display text-[10px] uppercase font-bold text-[var(--muted)]">Aircraft Category</span>
            <span className="font-sans font-bold text-[var(--ink)] truncate block mt-0.5">
              {currentTrip.aircraft.categoryLabel || "Midsize Jet"}
            </span>
            <span className="font-mono text-[11px] text-[var(--muted)]">{currentTrip.aircraft.name}</span>
          </div>

          <div className="bg-[var(--paper)] rounded p-2.5 border border-[var(--line)]">
            <span className="block font-display text-[10px] uppercase font-bold text-[var(--muted)]">Total Passengers</span>
            <span className="font-mono font-bold text-sm text-[var(--ink)] block mt-0.5">
              {currentTrip.legs[0]?.passengers?.length || currentTrip.legs[0]?.paxCount || 4} Pax
            </span>
            <span className="font-mono text-[11px] text-[var(--muted)]">
              {currentTrip.services?.limousineService ? "+ Limousine" : "Standard transfers"}
            </span>
          </div>

          <div className="bg-[var(--paper)] rounded p-2.5 border border-[var(--line)]">
            <span className="block font-display text-[10px] uppercase font-bold text-[var(--muted)]">Client Total</span>
            <span className="font-mono font-black text-sm text-[var(--ink)] block mt-0.5">
              {formatCurrency(currentTrip.pricing.totalFlightPrice, currentTrip.pricing.currency)}
            </span>
            <span className="font-mono text-[11px] text-[var(--muted)]">
              Wire Base ({currentTrip.pricing.currency})
            </span>
          </div>

          <div className="bg-[var(--paper)] rounded p-2.5 border border-[var(--line)]">
            <span className="block font-display text-[10px] uppercase font-bold text-[var(--muted)]">Payment Status</span>
            <span className="font-mono font-bold text-xs block mt-0.5">
              <StatusPill
                label={(currentTrip.paymentStatus || "unpaid").toUpperCase()}
                variant={currentTrip.paymentStatus === "fully_paid" ? "green" : "amber"}
              />
            </span>
          </div>
        </div>
      </div>

      {/* 2. Sub-Tabs Navigation (R-015) */}
      <div className="flex items-center gap-1 border-b border-[var(--line)] overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-display uppercase tracking-wider font-bold transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? "border-[var(--ink)] text-[var(--ink)] bg-[var(--card)] rounded-t-lg"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--line)]"
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-[var(--ink)] text-[var(--card)]" : "bg-[var(--wf)] text-[var(--muted)]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {tab.hasWarning && <span className="text-[var(--amber)]">▲</span>}
            </button>
          );
        })}
      </div>

      {/* 3. Main Workspace Grid: Content + Right Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Tab Content Area */}
        <div className="lg:col-span-3 space-y-5">
          {/* TAB 1: ITINERARY (R-016) */}
          {activeTab === "itinerary" && (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">Flight Itinerary & Schedule</h3>
                  <p className="text-xs text-[var(--muted)]">Local times with UTC simultaneously, FBO ground handling facilities, and airport facts</p>
                </div>
                <span className="font-mono text-xs text-[var(--muted)]">
                  Block Time: ~{currentTrip.legs[0]?.flightTimeFormatted || "1h 45m"}
                </span>
              </div>

              {/* Legs Schedule Cards with UTC + Local times simultaneously (R-016) */}
              <div className="space-y-4">
                {currentTrip.legs.map((leg, idx) => {
                  const depFbos = getAirportFbos(leg.origin?.icao || "LSGG");
                  const arrFbos = getAirportFbos(leg.destination?.icao || "EGSS");
                  const isFboMissing = !leg.departureHandling?.name || leg.departureHandling.name === "TBA";

                  return (
                    <div key={idx} className="border border-[var(--line)] rounded-xl p-4 bg-[var(--paper)] space-y-4">
                      <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                            LEG {String(idx + 1).padStart(2, "0")}
                          </span>
                          <span className="font-mono font-semibold text-xs text-[var(--ink)]">{leg.flightDate}</span>
                        </div>
                        <StatusPill label="ON SCHEDULE" variant="green" />
                      </div>

                      {/* Origin & Destination Stations */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Origin Station */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-display uppercase font-bold text-[var(--muted)] tracking-wider">
                              DEPARTURE STATION
                            </span>
                            <span className="pill grey text-[10px]">UTC+1</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono font-black text-2xl text-[var(--ink)]">
                              {leg.departureTimeLocal}
                            </span>
                            <span className="text-xs text-[var(--muted)] font-mono">
                              ({leg.departureTimeUtc || "08:00 UTC"})
                            </span>
                          </div>
                          <div>
                            <span className="font-display font-bold text-sm text-[var(--ink)] block">
                              {leg.origin?.name || "Geneva Airport"} ({leg.origin?.icao})
                            </span>
                            <span className="text-xs text-[var(--muted)] font-mono">
                              FBO: {leg.departureHandling?.name || depFbos[0]?.name || "TAG Aviation Geneva"}
                            </span>
                          </div>
                          {/* FBO Selector strictly filtered to this airport (R-016) */}
                          <div className="pt-1">
                            <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                              FBO Facility (Airport Filtered):
                            </label>
                            <select
                              value={leg.departureHandling?.name || depFbos[0]?.name}
                              onChange={(e) => {
                                const matchedFbo = depFbos.find((f) => f.name === e.target.value);
                                if (matchedFbo) {
                                  leg.departureHandling = {
                                    name: matchedFbo.name,
                                    airportCode: leg.origin?.icao || "LSGG",
                                    address: matchedFbo.address,
                                    phone: matchedFbo.phone,
                                    email: matchedFbo.email
                                  };
                                }
                              }}
                              className="w-full bg-[var(--card)] border border-[var(--line)] rounded px-2.5 py-1.5 text-xs font-sans text-[var(--ink)]"
                            >
                              {depFbos.map((fbo) => (
                                <option key={fbo.id} value={fbo.name}>
                                  {fbo.name} ({fbo.vhfFrequency || "VHF Active"})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Destination Station */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-display uppercase font-bold text-[var(--muted)] tracking-wider">
                              ARRIVAL STATION
                            </span>
                            <span className="pill grey text-[10px]">UTC+0</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono font-black text-2xl text-[var(--ink)]">
                              {leg.arrivalTimeLocal}
                            </span>
                            <span className="text-xs text-[var(--muted)] font-mono">
                              ({leg.arrivalTimeUtc || "09:45 UTC"})
                            </span>
                          </div>
                          <div>
                            <span className="font-display font-bold text-sm text-[var(--ink)] block">
                              {leg.destination?.name || "London Stansted"} ({leg.destination?.icao})
                            </span>
                            <span className="text-xs text-[var(--muted)] font-mono">
                              FBO: {leg.arrivalHandling?.name || arrFbos[0]?.name || "Harrods Aviation"}
                            </span>
                          </div>
                          {/* FBO Selector strictly filtered to destination */}
                          <div className="pt-1">
                            <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                              FBO Facility (Airport Filtered):
                            </label>
                            <select
                              value={leg.arrivalHandling?.name || arrFbos[0]?.name}
                              onChange={(e) => {
                                const matchedFbo = arrFbos.find((f) => f.name === e.target.value);
                                if (matchedFbo) {
                                  leg.arrivalHandling = {
                                    name: matchedFbo.name,
                                    airportCode: leg.destination?.icao || "EGSS",
                                    address: matchedFbo.address,
                                    phone: matchedFbo.phone,
                                    email: matchedFbo.email
                                  };
                                }
                              }}
                              className="w-full bg-[var(--card)] border border-[var(--line)] rounded px-2.5 py-1.5 text-xs font-sans text-[var(--ink)]"
                            >
                              {arrFbos.map((fbo) => (
                                <option key={fbo.id} value={fbo.name}>
                                  {fbo.name} ({fbo.vhfFrequency || "VHF Active"})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Airport Fact Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="border border-[var(--line)] rounded-lg p-4 bg-[var(--paper)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-sm text-[var(--ink)]">
                      {currentTrip.legs[0]?.origin?.icao || "LSGG"} — {currentTrip.legs[0]?.origin?.name || "Geneva Airport"}
                    </span>
                    <Link href={`/airports`} className="text-xs text-[var(--accent)] font-mono hover:underline">
                      Station Profile →
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Runway:</span>
                      <span>3,900 m (Cat III)</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Hours:</span>
                      <span>06:00 – 22:00 Local</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Extension:</span>
                      <span>Up to 23:30 (Surcharge €450)</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Slot Req:</span>
                      <span>Mandatory PPR</span>
                    </div>
                  </div>
                </div>

                <div className="border border-[var(--line)] rounded-lg p-4 bg-[var(--paper)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-sm text-[var(--ink)]">
                      {currentTrip.legs[0]?.destination?.icao || "EGSS"} — {currentTrip.legs[0]?.destination?.name || "London Stansted"}
                    </span>
                    <Link href={`/airports`} className="text-xs text-[var(--accent)] font-mono hover:underline">
                      Station Profile →
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Runway:</span>
                      <span>3,048 m (Grooved Asphalt)</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Hours:</span>
                      <span>24/7 Unrestricted</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Customs:</span>
                      <span>24/7 Dedicated Border Force</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Noise:</span>
                      <span>QC2 Night Cap Applicable</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PASSENGERS (R-017) */}
          {activeTab === "passengers" && (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">Passenger Manifest & Crew</h3>
                  <p className="text-xs text-[var(--muted)]">Travelers linked directly from Contacts directory; masked passport numbers with authorized reveal</p>
                </div>
                <button
                  onClick={() => setIsAddPaxModalOpen(true)}
                  className="btn-primary text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add from Contacts</span>
                </button>
              </div>

              {missingPassportsCount > 0 && (
                <div className="callout amber text-xs">
                  <p className="font-bold">▲ Missing Travel Documents</p>
                  <p>
                    {missingPassportsCount} passenger(s) lack valid passport credentials. Updating the contact will automatically update this flight brief.
                  </p>
                </div>
              )}

              <div className="tablewrap">
                <table className="dense-table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Passenger Name</th>
                      <th>Nationality</th>
                      <th>Document (Masked)</th>
                      <th>Expires</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTrip.legs[0]?.passengers.map((pax, idx) => {
                      const hasDoc = Boolean(pax.passportNumber && pax.passportNumber.length >= 5);
                      const isRevealed = Boolean(revealedPassports[pax.id || String(idx)]);

                      return (
                        <tr key={pax.id || idx}>
                          <td>
                            <span className={`pill ${idx === 0 || pax.isLeadPassenger ? "gold" : "grey"} text-[10px]`}>
                              {idx === 0 || pax.isLeadPassenger ? "★ LEAD CHARTERER" : "GUEST"}
                            </span>
                          </td>
                          <td className="font-bold text-[var(--ink)]">{pax.fullName}</td>
                          <td className="font-mono text-xs">{pax.nationality || "British"}</td>
                          <td className="font-mono text-xs">
                            {hasDoc ? (
                              isRevealed ? (
                                <span className="font-bold text-[var(--ink)]">{pax.passportNumber}</span>
                              ) : (
                                <span>{maskPassportNumber(pax.passportNumber)}</span>
                              )
                            ) : (
                              <span className="text-[var(--amber)]">▲ Not on file</span>
                            )}
                          </td>
                          <td className="font-mono text-xs">
                            {pax.passportExpiry || "2031-08-20"}
                          </td>
                          <td>
                            <StatusPill
                              label={hasDoc ? "VERIFIED" : "PENDING"}
                              variant={hasDoc ? "green" : "amber"}
                            />
                          </td>
                          <td className="text-right">
                            {hasDoc && (
                              <button
                                onClick={() => togglePassportReveal(pax.id || String(idx))}
                                className="btn-secondary text-[11px] py-1 px-2"
                                title="Toggle reveal passport number"
                              >
                                {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                <span>{isRevealed ? "Hide" : "Reveal"}</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pets Section (R-017) */}
              <div className="pt-2 border-t border-[var(--line)]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-display font-bold text-sm text-[var(--ink)] m-0">Animals / Pets on Board</h4>
                  <span className="text-xs text-[var(--muted)] font-mono">DEFRA / Pet Travel Scheme compliant</span>
                </div>
                <div className="border border-[var(--line)] rounded-lg p-3 bg-[var(--paper)] text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-[var(--ink)]">Toby (Yorkshire Terrier, 3.2 kg)</span>
                    <p className="text-[var(--muted)] font-mono text-[11px] m-0">
                      Pet Passport: GB84920412 · Microchip: 985141002948211 · In-Cabin Carriage
                    </p>
                  </div>
                  <span className="pill green">PET CLEARED</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SOURCING (R-018) */}
          {activeTab === "sourcing" && (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">Operator Sourcing Desk</h3>
                  <p className="text-xs text-[var(--muted)]">Direct marketplace offers, verified AOC records, and Avinode integration</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const text = `TRIP REQUEST: ${currentTrip.legs[0]?.origin?.icao} - ${currentTrip.legs[0]?.destination?.icao} | DATE: ${currentTrip.legs[0]?.flightDate} | TIME: ${currentTrip.legs[0]?.departureTimeLocal} | PAX: ${currentTrip.legs[0]?.paxCount} | CAT: ${currentTrip.aircraft.categoryLabel}`;
                      navigator.clipboard.writeText(text);
                      setCopiedAvinode(true);
                      setTimeout(() => setCopiedAvinode(false), 2000);
                    }}
                    className="btn-secondary text-xs"
                  >
                    {copiedAvinode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAvinode ? "Copied!" : "Copy for Avinode"}</span>
                  </button>

                  <button
                    onClick={() => setIsLogOfferModalOpen(true)}
                    className="btn-primary text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Operator Offer</span>
                  </button>
                </div>
              </div>

              {/* Sourced Offers Table */}
              <div className="tablewrap">
                <table className="dense-table">
                  <thead>
                    <tr>
                      <th>Operator</th>
                      <th>Aircraft & Tail</th>
                      <th>YOM</th>
                      <th>Capacity</th>
                      <th>AOC Status</th>
                      <th className="text-right">Net Cost</th>
                      <th>Validity</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Default verified offer */}
                    <tr>
                      <td>
                        <span className="font-bold text-[var(--ink)] block">GlobeAir AG</span>
                        <span className="text-[11px] font-mono text-[var(--muted)]">AOC: AT.AOC.024</span>
                      </td>
                      <td>
                        <span className="font-semibold block text-[var(--ink)]">Citation Mustang</span>
                        <span className="font-mono text-xs text-[var(--muted)]">OE-FFB</span>
                      </td>
                      <td className="font-mono text-xs">2016</td>
                      <td className="font-mono text-xs font-bold">4 Pax</td>
                      <td><span className="pill green">VALID AOC</span></td>
                      <td className="font-mono font-bold text-xs text-right text-[var(--ink)]">€11,200.00</td>
                      <td className="font-mono text-xs text-[var(--muted)]">24h</td>
                      <td className="text-right">
                        <span className="pill green">SELECTED</span>
                      </td>
                    </tr>

                    {/* Additional logged offers */}
                    {(currentTrip.sourcingOptions || []).map((opt) => (
                      <tr key={opt.id}>
                        <td className="font-bold text-[var(--ink)]">{opt.operatorName}</td>
                        <td className="font-sans text-xs">{opt.aircraftType}</td>
                        <td className="font-mono text-xs">2018</td>
                        <td className="font-mono text-xs font-bold">4 Pax</td>
                        <td><span className="pill green">AOC VERIFIED</span></td>
                        <td className="font-mono font-bold text-xs text-right text-[var(--ink)]">
                          {formatCurrency(opt.price, opt.currency)}
                        </td>
                        <td className="font-mono text-xs text-[var(--muted)]">{opt.validUntil}</td>
                        <td className="text-right">
                          <button className="btn-secondary text-[11px] py-1 px-2">
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PRICING (R-019) */}
          {activeTab === "pricing" && (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">Price Build & Margin Breakdown</h3>
                  <p className="text-xs text-[var(--muted)]">Transparent cost progression from operator net to card settlement</p>
                </div>
                <span className="pill grey font-mono text-[11px]">
                  Card Processing: +{settings?.pricing?.cardFeePercent || 3.5}%
                </span>
              </div>

              {/* Price Breakdown Stack */}
              <div className="border border-[var(--line)] rounded-lg overflow-hidden bg-[var(--paper)]">
                <div className="divide-y divide-[var(--line)] text-xs font-mono">
                  {role !== "agent" && (
                    <div className="p-3.5 flex justify-between items-center bg-[var(--card)]">
                      <div>
                        <span className="font-bold text-[var(--ink)] block">1. Operator Net Cost (Direct Flight Rate)</span>
                        <span className="text-[11px] text-[var(--muted)] font-sans">Internal Admin Only — hidden from Agent and Client</span>
                      </div>
                      <span className="font-bold">€11,200.00</span>
                    </div>
                  )}

                  {role !== "agent" && (
                    <div className="p-3.5 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-[var(--ink)] block">
                          2. Company Margin (Tier 2: €10k–€35k @ {marginOverridePercent}%)
                        </span>
                        <span className="text-[11px] text-[var(--muted)] font-sans">Settings-governed automated tier</span>
                      </div>
                      <span className="font-bold text-[var(--accent)]">
                        + €{((11200 * marginOverridePercent) / 100).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="p-3.5 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-[var(--ink)] block">3. Agent Margin / Commission</span>
                      <span className="text-[11px] text-[var(--muted)] font-sans">Retained broker commission</span>
                    </div>
                    <span className="font-bold text-[var(--accent)]">+ €550.00</span>
                  </div>

                  <div className="p-3.5 flex justify-between items-center">
                    <span className="font-semibold text-[var(--ink)]">4. Concierge & Ground Services</span>
                    <span className="font-bold text-[var(--accent)]">+ €0.00</span>
                  </div>

                  <div className="p-4 flex justify-between items-center bg-[var(--wf)] text-sm font-bold">
                    <div>
                      <span className="text-[var(--ink)] block">CLIENT TOTAL (Wire Transfer Base)</span>
                      <span className="text-[10px] text-[var(--muted)] font-normal font-sans">Standard wire bank settlement</span>
                    </div>
                    <span className="text-[var(--ink)] text-base">
                      {formatCurrency(currentTrip.pricing.totalFlightPrice, currentTrip.pricing.currency)}
                    </span>
                  </div>

                  <div className="p-3.5 flex justify-between items-center bg-[var(--paper)]">
                    <div>
                      <span className="font-semibold text-[var(--ink)] block">
                        5. Card Payment Amount (+{settings?.pricing?.cardFeePercent || 3.5}% Card Fee)
                      </span>
                      <span className="text-[11px] text-[var(--muted)] font-sans">Formula: Total × 1.035</span>
                    </div>
                    <span className="font-bold text-sm text-[var(--ink)]">
                      {formatCurrency(currentTrip.pricing.totalFlightPrice * (1 + (settings?.pricing?.cardFeePercent || 3.5) / 100), currentTrip.pricing.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Margin Override Box (Admin only) */}
              {role !== "agent" && (
                <div className="border border-[var(--line)] rounded-xl p-4 bg-[var(--card)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-sm text-[var(--ink)]">Admin Margin Override</span>
                    {isMarginOverridden && <span className="pill amber">OVERRIDE ACTIVE</span>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                        Margin Percentage (%):
                      </label>
                      <input
                        type="number"
                        value={marginOverridePercent}
                        onChange={(e) => {
                          setMarginOverridePercent(Number(e.target.value));
                          setIsMarginOverridden(true);
                        }}
                        className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-1.5 font-mono text-[var(--ink)]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                        Mandatory Reason for Override:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. VIP client loyalty discount"
                        value={marginReason}
                        onChange={(e) => setMarginReason(e.target.value)}
                        className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-1.5 font-sans text-[var(--ink)]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SERVICES (R-020) */}
          {activeTab === "services" && (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">Concierge & Ground Transfers</h3>
                  <p className="text-xs text-[var(--muted)]">VIP Limousines, helicopters, catering, and bespoke services. No cancellation insurance.</p>
                </div>
                <button
                  onClick={() => setIsAddServiceModalOpen(true)}
                  className="btn-primary text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Service</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-[var(--line)] rounded-lg p-4 bg-[var(--paper)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-sm text-[var(--ink)]">VIP Limousine Transfer</span>
                    <StatusPill label="REQUESTED" variant="amber" />
                  </div>
                  <p className="text-xs text-[var(--muted)]">Arrival transfer: London Stansted → Mayfair Hotel (Mercedes S-Class)</p>
                  <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-[var(--line)]">
                    <span>Client Price: €480.00</span>
                    {role !== "agent" && <span className="text-[var(--muted)]">Supplier Cost: €350.00</span>}
                  </div>
                </div>

                <div className="border border-[var(--line)] rounded-lg p-4 bg-[var(--paper)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-sm text-[var(--ink)]">Executive In-Flight Catering</span>
                    <StatusPill label="CONFIRMED" variant="green" />
                  </div>
                  <p className="text-xs text-[var(--muted)]">Premium Cold Platter, Fresh Fruit & Ruinart Champagne</p>
                  <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-[var(--line)]">
                    <span>Client Price: Included</span>
                    {role !== "agent" && <span className="text-[var(--muted)]">Supplier Cost: €180.00</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DOCUMENTS (R-021) */}
          {activeTab === "documents" && (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">Trip Documents Vault</h3>
                  <p className="text-xs text-[var(--muted)]">Generated quotations, contracts, briefs, and invoices across all iterations</p>
                </div>

                {!isBooked && (
                  <button
                    onClick={async () => {
                      await convertQuoteToBooked(currentTrip.id, currentTrip);
                    }}
                    className="btn-primary text-xs"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Signed Contract</span>
                  </button>
                )}
              </div>

              <div className="tablewrap">
                <table className="dense-table">
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Type</th>
                      <th>Version</th>
                      <th>Sent To</th>
                      <th>State</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-mono font-bold">{formatDocumentId("Q", rootId, versionNum)}</td>
                      <td>Quotation</td>
                      <td className="font-mono text-xs">{versionBadge}</td>
                      <td className="font-sans text-xs">{currentTrip.client.email}</td>
                      <td><StatusPill label="SENT" variant="blue" /></td>
                      <td>
                        <button
                          onClick={() => openDocument(currentTrip, "quotation")}
                          className="text-xs font-mono text-[var(--accent)] hover:underline"
                        >
                          View PDF →
                        </button>
                      </td>
                    </tr>
                    {isBooked && (
                      <>
                        <tr>
                          <td className="font-mono font-bold">{formatDocumentId("C", rootId, versionNum)}</td>
                          <td>Charter Agreement</td>
                          <td className="font-mono text-xs">{versionBadge}</td>
                          <td className="font-sans text-xs">{currentTrip.client.email}</td>
                          <td><StatusPill label="SIGNED" variant="green" /></td>
                          <td>
                            <button
                              onClick={() => openDocument(currentTrip, "charter_agreement")}
                              className="text-xs font-mono text-[var(--accent)] hover:underline"
                            >
                              View PDF →
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td className="font-mono font-bold">{formatDocumentId("INV", rootId, versionNum, 1)}</td>
                          <td>Invoice</td>
                          <td className="font-mono text-xs">{versionBadge}</td>
                          <td className="font-sans text-xs">{currentTrip.client.email}</td>
                          <td>
                            <StatusPill
                              label={(currentTrip.paymentStatus || "unpaid").toUpperCase()}
                              variant={currentTrip.paymentStatus === "fully_paid" ? "green" : "amber"}
                            />
                          </td>
                          <td>
                            <button
                              onClick={() => openDocument(currentTrip, "invoice")}
                              className="text-xs font-mono text-[var(--accent)] hover:underline"
                            >
                              View PDF →
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td className="font-mono font-bold">{formatDocumentId("FB", rootId, versionNum)}</td>
                          <td>Flight Brief</td>
                          <td className="font-mono text-xs">{versionBadge}</td>
                          <td className="font-sans text-xs">Operations & Dispatch</td>
                          <td><StatusPill label="BRIEFED" variant="green" /></td>
                          <td>
                            <button
                              onClick={() => openDocument(currentTrip, "flight_brief")}
                              className="text-xs font-mono text-[var(--accent)] hover:underline"
                            >
                              View PDF →
                            </button>
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: ACCOUNTING (R-022) */}
          {activeTab === "accounting" && (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">Trip Financial Ledger</h3>
                  <p className="text-xs text-[var(--muted)]">Balance strip, debit invoices, credit notes, and wire receipts</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCreditNoteModalOpen(true)}
                    className="btn-secondary text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Credit Note</span>
                  </button>
                </div>
              </div>

              {/* Balance Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-[var(--paper)] border border-[var(--line)] rounded-xl text-xs font-mono">
                <div>
                  <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Total Invoiced</span>
                  <span className="font-bold text-sm text-[var(--ink)]">
                    {formatCurrency(currentTrip.pricing.totalFlightPrice, currentTrip.pricing.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Credited / CN</span>
                  <span className="font-bold text-sm text-[var(--red)]">
                    {currentTrip.creditNotes && currentTrip.creditNotes.length > 0
                      ? `- ${formatCurrency(currentTrip.creditNotes.reduce((sum, c) => sum + (c.amount || 0), 0), currentTrip.pricing.currency)}`
                      : "€0.00"}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Net Due</span>
                  <span className="font-bold text-sm text-[var(--ink)]">
                    {formatCurrency(
                      currentTrip.pricing.totalFlightPrice - (currentTrip.creditNotes?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0),
                      currentTrip.pricing.currency
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Received</span>
                  <span className="font-bold text-sm text-[var(--green)]">
                    {isPaid ? formatCurrency(currentTrip.pricing.totalFlightPrice, currentTrip.pricing.currency) : "€0.00"}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Open Balance</span>
                  <span className="font-bold text-sm text-[var(--ink)]">
                    {isPaid ? "€0.00" : formatCurrency(currentTrip.pricing.totalFlightPrice, currentTrip.pricing.currency)}
                  </span>
                </div>
              </div>

              {/* Credit Notes Table */}
              {currentTrip.creditNotes && currentTrip.creditNotes.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="font-display font-bold text-sm text-[var(--ink)] m-0">Issued Credit Notes</h4>
                  <div className="tablewrap">
                    <table className="dense-table">
                      <thead>
                        <tr>
                          <th>Credit Note ID</th>
                          <th>Date</th>
                          <th>Internal Reason</th>
                          <th className="text-right">Amount Credited</th>
                          <th className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentTrip.creditNotes.map((cn, i) => (
                          <tr key={i}>
                            <td className="font-mono font-bold">{cn.creditNoteNumber || `CN-${rootId}-01`}</td>
                            <td className="font-mono text-xs">{cn.issueDate || cn.date || "15.11.2026"}</td>
                            <td className="text-xs">{cn.reason}</td>
                            <td className="font-mono font-bold text-right text-[var(--red)]">
                              - {formatCurrency(cn.amount || 0, currentTrip.pricing.currency)}
                            </td>
                            <td className="text-right">
                              <button
                                onClick={() => openDocument(currentTrip, "credit_note")}
                                className="text-xs font-mono text-[var(--accent)] hover:underline"
                              >
                                View PDF →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: REVISIONS (R-023) */}
          {activeTab === "revisions" && (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-5">
              <div>
                <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">Version Control Timeline</h3>
                <p className="text-xs text-[var(--muted)]">All historical iterations newest first. Older versions remain read-only.</p>
              </div>

              <div className="tablewrap">
                <table className="dense-table">
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Type</th>
                      <th>Changes & Remarks</th>
                      <th>Total Amount</th>
                      <th>State</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tripVersions.map((ver, idx) => (
                      <tr key={ver.id || idx}>
                        <td className="font-mono font-bold">{formatTripVersion(rootId, ver.quoteVersion || (idx + 1))}</td>
                        <td>{ver.isBooked ? "Booking" : "Quote"}</td>
                        <td className="text-xs">
                          {idx === tripVersions.length - 1 ? "Active latest version" : "Superseded route iteration"}
                        </td>
                        <td className="font-mono font-bold">
                          {formatCurrency(ver.pricing.totalFlightPrice, ver.pricing.currency)}
                        </td>
                        <td>
                          <StatusPill
                            label={idx === tripVersions.length - 1 ? "CURRENT" : "SUPERSEDED"}
                            variant={idx === tripVersions.length - 1 ? "green" : "grey"}
                          />
                        </td>
                        <td className="font-mono text-xs">{ver.contractDate || "01.10.2026"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Version Compare Diff Tool (R-023) */}
              <div className="border border-[var(--line)] rounded-xl p-4 bg-[var(--paper)] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-[var(--ink)] m-0">Version Compare Tool</h4>
                  <span className="text-[11px] font-mono text-[var(--muted)]">Side-by-side revision audit</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-[var(--card)] border border-[var(--line)] rounded-lg space-y-2">
                    <span className="font-mono font-bold text-xs text-[var(--muted)] block">VERSION 001 (Original)</span>
                    <p className="m-0 font-display font-bold text-[var(--ink)]">LSGG → EGSS</p>
                    <p className="m-0 font-mono text-[11px] text-[var(--muted)]">Aircraft: Citation XLS+ · 4 Pax</p>
                    <p className="m-0 font-mono font-bold text-sm text-[var(--ink)]">€14,800.00</p>
                  </div>

                  <div className="p-3 bg-[var(--card)] border border-[var(--accent)] rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[var(--accent)] block">VERSION 002 (Current)</span>
                      <span className="pill green">ACTIVE</span>
                    </div>
                    <p className="m-0 font-display font-bold text-[var(--ink)]">LSGG ⇄ EGSS (Round Trip)</p>
                    <p className="m-0 font-mono text-[11px] text-[var(--muted)]">Aircraft: Challenger 350 · 5 Pax</p>
                    <p className="m-0 font-mono font-bold text-sm text-[var(--ink)]">
                      {formatCurrency(currentTrip.pricing.totalFlightPrice, currentTrip.pricing.currency)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: NOTES (R-024) */}
          {activeTab === "notes" && (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-5">
              <div>
                <h3 className="text-lg font-bold font-display text-[var(--ink)] m-0">Internal Notes & Client CRM</h3>
                <p className="text-xs text-[var(--muted)]">Confidential internal notes (admin only) and client preferences.</p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg text-xs font-sans">
                  <span className="font-display font-bold uppercase text-[10px] text-[var(--muted)] block">Client Preferences:</span>
                  <p className="m-0 text-[var(--ink)]">Prefers forward-facing club seating and sparkling water at departure. Luggage assistance directly to chauffeur vehicle.</p>
                </div>

                <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg text-xs font-sans">
                  <span className="font-display font-bold uppercase text-[10px] text-[var(--muted)] block">Post-Flight Debrief:</span>
                  <p className="m-0 text-[var(--ink)]">Flight on-time. Handling at LSGG ExecuJet fast-tracked through customs in 4 minutes.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Info Rail (R-015) */}
        <div className="space-y-4 text-xs font-sans">
          {/* Account Box */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-4 space-y-2">
            <span className="font-display uppercase text-[10px] font-bold text-[var(--muted)] tracking-wider block">
              Client Account
            </span>
            <div className="font-bold text-sm text-[var(--ink)]">
              {currentTrip.client.fullName}
            </div>
            <p className="font-mono text-[11px] text-[var(--muted)] m-0">
              {currentTrip.accountNumber} • {currentTrip.client.companyName || "Private VIP"}
            </p>
            <div className="pt-2 border-t border-[var(--line)] space-y-1 font-mono text-[11px]">
              <div>Email: {currentTrip.client.email}</div>
              <div>Phone: {currentTrip.client.phone}</div>
            </div>
          </div>

          {/* Agent Box */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-4 space-y-2">
            <span className="font-display uppercase text-[10px] font-bold text-[var(--muted)] tracking-wider block">
              Charter Agent
            </span>
            <div className="font-bold text-sm text-[var(--ink)]">
              {currentTrip.agentName || "Marcus Vance (London Broker)"}
            </div>
            <p className="font-mono text-[11px] text-[var(--muted)] m-0">
              Commission: 5.0%
            </p>
          </div>

          {/* Operator Box (Admin Only!) */}
          {role !== "agent" && (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-4 space-y-2">
              <span className="font-display uppercase text-[10px] font-bold text-[var(--muted)] tracking-wider block">
                Operator Details (Internal Admin)
              </span>
              <div className="font-bold text-sm text-[var(--ink)]">
                {currentTrip.operator.companyName}
              </div>
              <p className="font-mono text-[11px] text-[var(--muted)] m-0">
                AOC: {currentTrip.operator.commercialRegistry}
              </p>
            </div>
          )}

          {/* Deadlines Box */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-4 space-y-2">
            <span className="font-display uppercase text-[10px] font-bold text-[var(--muted)] tracking-wider block">
              Critical Deadlines
            </span>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Quote Expiry:</span>
                <span className="font-bold text-[var(--ink)]">{currentTrip.quoteExpirationDate || "24 hours"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Payment Due:</span>
                <span className="font-bold text-[var(--ink)]">{currentTrip.paymentDueDate || "Upon Booking"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Passenger Modal (R-017) */}
      {isAddPaxModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-[var(--ink)] m-0">Add Passenger from Contacts</h3>
              <button onClick={() => setIsAddPaxModalOpen(false)} className="text-[var(--muted)] hover:text-[var(--ink)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPassengerSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                  Select Contact:
                </label>
                <select
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 text-xs text-[var(--ink)]"
                  required
                >
                  <option value="">-- Choose from Contacts directory --</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.country}) — {c.passportDetails?.passportNumber ? "Passport OK" : "No Passport"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="leadPaxCheckbox"
                  checked={isLeadPax}
                  onChange={(e) => setIsLeadPax(e.target.checked)}
                  className="rounded border-[var(--line)]"
                />
                <label htmlFor="leadPaxCheckbox" className="font-semibold text-[var(--ink)]">
                  Designate as Lead Charterer (★)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
                <button type="button" onClick={() => setIsAddPaxModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Passenger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Credit Note Modal (R-030 & R-022) */}
      {isCreditNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-[var(--ink)] m-0">Issue Credit Note</h3>
                <span className="font-mono text-[11px] text-[var(--muted)]">Trip Root: {rootId}</span>
              </div>
              <button onClick={() => setIsCreditNoteModalOpen(false)} className="text-[var(--muted)] hover:text-[var(--ink)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {creditError && (
              <div className="callout red text-xs">
                <p className="font-bold">▲ Validation Error</p>
                <p>{creditError}</p>
              </div>
            )}

            <form onSubmit={handleCreditNoteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                  Credit Amount (€):
                </label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(Number(e.target.value))}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 font-mono text-[var(--ink)]"
                  required
                />
                <span className="text-[11px] text-[var(--muted)] font-mono block mt-1">
                  Maximum allowable credit: {formatCurrency(currentTrip.pricing.totalFlightPrice, currentTrip.pricing.currency)}
                </span>
              </div>

              <div>
                <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                  Internal Reason (Omitted from Client PDF per R-030):
                </label>
                <textarea
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 text-xs font-sans text-[var(--ink)]"
                  rows={3}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
                <button type="button" onClick={() => setIsCreditNoteModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Generate Credit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Operator Offer Modal (R-018) */}
      {isLogOfferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-[var(--ink)] m-0">Log Operator Quote Offer</h3>
              <button onClick={() => setIsLogOfferModalOpen(false)} className="text-[var(--muted)] hover:text-[var(--ink)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogOfferSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                  Operator Legal Entity:
                </label>
                <input
                  type="text"
                  value={offerOperator}
                  onChange={(e) => setOfferOperator(e.target.value)}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 text-xs text-[var(--ink)]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                  Aircraft & Tail Registration:
                </label>
                <input
                  type="text"
                  value={offerAircraft}
                  onChange={(e) => setOfferAircraft(e.target.value)}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 text-xs text-[var(--ink)]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                    Year of Manufacture:
                  </label>
                  <input
                    type="number"
                    value={offerYom}
                    onChange={(e) => setOfferYom(Number(e.target.value))}
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 font-mono text-[var(--ink)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-display uppercase font-bold text-[var(--muted)] block mb-1">
                    Net Price Quote (€):
                  </label>
                  <input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(Number(e.target.value))}
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 font-mono text-[var(--ink)]"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
                <button type="button" onClick={() => setIsLogOfferModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Operator Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

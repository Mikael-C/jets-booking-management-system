"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { Booking, FlightLeg, TripType, Aircraft } from "@/types/aviation";
import { generateTripRootId, formatTripVersion } from "@/lib/idGenerator";
import { formatCurrency } from "@/lib/pricingCalculator";
import { fleetData } from "@/data/fleet";
import { airportsData, findAirportByCode } from "@/data/airports";
import AirportSearchSelect from "@/components/common/AirportSearchSelect";
import {
  Plane,
  Building2,
  Calendar,
  Clock,
  User,
  Shield,
  CreditCard,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Save,
  ArrowRight,
  Info,
  DollarSign
} from "lucide-react";

interface QuoteBuilderProps {
  reviseTripId?: string;
  fromRequestId?: string;
}

export default function QuoteBuilderView({ reviseTripId, fromRequestId }: QuoteBuilderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reqId = fromRequestId || searchParams.get("fromRequest");

  const {
    bookings,
    accounts,
    contacts,
    operators,
    agentRequests,
    settings,
    addBooking
  } = useAviation();

  // Find source if revising or creating from request
  const sourceTrip = useMemo(() => {
    if (!reviseTripId) return undefined;
    return bookings.find((b) => b.id === reviseTripId || b.tripNumber === reviseTripId);
  }, [bookings, reviseTripId]);

  const sourceRequest = useMemo(() => {
    if (!reqId) return undefined;
    return agentRequests.find((r) => r.id === reqId);
  }, [agentRequests, reqId]);

  // Root ID and next version
  const [rootId] = useState<string>(() => {
    if (sourceTrip) {
      return (sourceTrip.tripId || sourceTrip.tripNumber || "FE4578").split("-")[0];
    }
    return generateTripRootId();
  });

  const nextVersionNum = useMemo(() => {
    if (!sourceTrip) return 1;
    return (sourceTrip.quoteVersion || 1) + 1;
  }, [sourceTrip]);

  const versionLabel = formatTripVersion(rootId, nextVersionNum);

  // Form State
  // 1. Client
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    return sourceTrip?.accountNumber || accounts[0]?.accountNumber || "ACC-21737";
  });
  const [leadPaxName, setLeadPaxName] = useState<string>(() => {
    return sourceRequest?.clientName || sourceTrip?.client.fullName || "Edward Brinkmann";
  });

  // 2. Itinerary
  const [tripType, setTripType] = useState<TripType>(() => {
    return sourceTrip?.tripType || (sourceRequest?.tripType as TripType) || "round_trip";
  });
  const [originAirport, setOriginAirport] = useState<any>(() => {
    return sourceTrip?.legs[0]?.origin || findAirportByCode(sourceRequest?.originIcao || "LSGG") || airportsData[0];
  });
  const [destAirport, setDestAirport] = useState<any>(() => {
    return sourceTrip?.legs[0]?.destination || findAirportByCode(sourceRequest?.destIcao || "EGSS") || airportsData[1];
  });
  const [flightDate, setFlightDate] = useState<string>(() => {
    return sourceTrip?.legs[0]?.flightDate || sourceRequest?.flightDate || "2026-11-20";
  });
  const [departureTime, setDepartureTime] = useState<string>(() => {
    return sourceTrip?.legs[0]?.departureTimeLocal || sourceRequest?.departureTime || "10:00";
  });
  const [returnFlightDate, setReturnFlightDate] = useState<string>(() => {
    return sourceTrip?.legs[1]?.flightDate || sourceRequest?.returnFlightDate || "2026-11-23";
  });
  const [returnDepartureTime, setReturnDepartureTime] = useState<string>(() => {
    return sourceTrip?.legs[1]?.departureTimeLocal || "15:00";
  });

  // 3. Passengers & Cargo
  const [paxCount, setPaxCount] = useState<number>(() => {
    return sourceTrip?.legs[0]?.paxCount || sourceRequest?.paxCount || 4;
  });
  const [luggagePieces, setLuggagePieces] = useState<number>(4);
  const [hasPets, setHasPets] = useState<boolean>(false);

  // 4. Operator Offer
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>(() => {
    return operators[0]?.id || "op-1";
  });
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft>(() => {
    return sourceTrip?.aircraft || fleetData[0];
  });
  const [operatorFlightCost, setOperatorFlightCost] = useState<number>(() => {
    return sourceTrip?.pricing ? Math.round(sourceTrip.pricing.totalFlightPrice * 0.85) : 11200;
  });

  // Aircraft photos picker state (Step 04 Photos)
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([
    "Exterior · actual aircraft",
    "Cabin · actual aircraft"
  ]);
  const [saveToOperatorAircraft, setSaveToOperatorAircraft] = useState(true);

  // 5. Services
  const [addLimousine, setAddLimousine] = useState<boolean>(Boolean(sourceTrip?.services.limousineService));
  const [limousinePrice, setLimousinePrice] = useState<number>(480);
  const [addCatering, setAddCatering] = useState<boolean>(false);
  const [cateringPrice, setCateringPrice] = useState<number>(350);

  // 6. Margins & Payment
  const [agentCommissionPercent, setAgentCommissionPercent] = useState<number>(5.0);

  // Automated Company Margin Tier from Settings (R-019, R-039)
  const companyMarginPercent = useMemo(() => {
    const cost = operatorFlightCost;
    if (cost < 10000) return 15;
    if (cost <= 35000) return 10;
    return 8;
  }, [operatorFlightCost]);

  // Financial Calculations
  const companyMarginAmount = Math.round((operatorFlightCost * companyMarginPercent) / 100);
  const agentMarginAmount = Math.round((operatorFlightCost * agentCommissionPercent) / 100);
  const servicesTotal = (addLimousine ? limousinePrice : 0) + (addCatering ? cateringPrice : 0);
  const clientSubtotal = operatorFlightCost + companyMarginAmount + agentMarginAmount + servicesTotal;
  const clientTotal = clientSubtotal; // Zero rated VAT for international charter
  const cardAmount = Math.round(clientTotal * 1.035 * 100) / 100;

  // Selected Account details
  const activeAccount = useMemo(() => {
    return accounts.find((a) => a.accountNumber === selectedAccountId) || accounts[0];
  }, [accounts, selectedAccountId]);

  // Submission handler
  const handleCompleteQuotation = async () => {
    // Build legs
    const legs: FlightLeg[] = [
      {
        legNumber: 1,
        flightDate,
        origin: originAirport,
        destination: destAirport,
        departureTimeLocal: departureTime,
        arrivalTimeLocal: "11:45",
        flightTimeFormatted: "1h 45m",
        paxCount,
        flightNumber: `OB${Math.floor(100 + Math.random() * 900)}`,
        aircraftRegistration: "OE-FFB",
        crew: [],
        passengers: [
          {
            id: "pax-lead",
            fullName: leadPaxName,
            isLeadPassenger: true
          }
        ],
        departureHandling: {
          name: "TAG Aviation FBO",
          airportCode: originAirport.icao,
          phone: "+41 22 717 0111",
          email: "gva@tagaviation.com"
        },
        arrivalHandling: {
          name: "Harrods Aviation FBO",
          airportCode: destAirport.icao,
          phone: "+44 1279 680616",
          email: "fbo@harrodsaviation.com"
        }
      }
    ];

    if (tripType === "round_trip") {
      legs.push({
        legNumber: 2,
        flightDate: returnFlightDate,
        origin: destAirport, // Leg 2 origin is locked to Leg 1 arrival!
        destination: originAirport,
        departureTimeLocal: returnDepartureTime,
        arrivalTimeLocal: "16:45",
        flightTimeFormatted: "1h 45m",
        paxCount,
        flightNumber: `OB${Math.floor(100 + Math.random() * 900)}`,
        aircraftRegistration: "OE-FFB",
        crew: [],
        passengers: [
          {
            id: "pax-lead",
            fullName: leadPaxName,
            isLeadPassenger: true
          }
        ],
        departureHandling: {
          name: "Harrods Aviation FBO",
          airportCode: destAirport.icao,
          phone: "+44 1279 680616",
          email: "fbo@harrodsaviation.com"
        },
        arrivalHandling: {
          name: "TAG Aviation FBO",
          airportCode: originAirport.icao,
          phone: "+41 22 717 0111",
          email: "gva@tagaviation.com"
        }
      });
    }

    const newBooking: Booking = {
      id: `trip-${rootId.toLowerCase()}-v${nextVersionNum}`,
      tripId: rootId,
      tripNumber: versionLabel,
      quoteReference: versionLabel,
      invoiceNumber: `INV-${rootId}-01`,
      accountNumber: activeAccount?.accountNumber || "ACC-21737",
      contractDate: new Date().toLocaleDateString("de-DE"),
      quoteExpirationDate: "48 hours from issuance",
      paymentDueDate: "Upon contract execution",
      status: "quoted",
      quoteStatus: "sent",
      paymentStatus: "unpaid",
      tripType,
      aircraft: selectedAircraft,
      client: {
        fullName: leadPaxName,
        companyName: activeAccount?.name || "Private VIP",
        streetAddress: activeAccount?.billingAddress || "10 Mayfair Place",
        cityPostalCountry: `${activeAccount?.country || "United Kingdom"}`,
        phone: activeAccount?.phone || "+44 20 7946 0192",
        email: activeAccount?.email || "charter@bgcapital.com",
        accountNumber: activeAccount?.accountNumber || "ACC-21737"
      },
      operator: {
        companyName: "GlobeAir AG",
        legalEntity: "GlobeAir Aviation Operations Ltd",
        representativeName: "Charter Desk",
        supportEmail: "charter@globeair.com",
        supportPhone: "+43 7221 727400",
        vatNumber: "ATU 6335 7619",
        additionalVatNumbers: [],
        iban: "AT89 3740 0000 1122 3344",
        bic: "LOWWAT22",
        bankName: "Erste Bank Aviation",
        accountHolder: "GlobeAir AG",
        commercialRegistry: "AOC AT.AOC.0842",
        courtOfJurisdiction: "Linz Commercial Court"
      },
      legs,
      pricing: {
        flightPrice: operatorFlightCost,
        airportFees: 0,
        passengerFees: 0,
        dayOfWeekDiscount: 0,
        inboundPassengerTax: 0,
        outboundPassengerTax: 0,
        additionalServicesTotal: servicesTotal,
        subtotal: clientSubtotal,
        vatRate: 0,
        vatAmount: 0,
        totalFlightPrice: clientTotal,
        currency: "EUR"
      },
      services: {
        limousineService: addLimousine,
        luxuryCarRental: false,
        helicopterService: false,
        deicingInsurance: "none",
        deicingCostPerLeg: 0,
        carbonOffset: "none",
        carbonOffsetRatePerHour: 0
      },
      checklist: [],
      quoteVersion: nextVersionNum,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await addBooking(newBooking);
    router.push(`/trips/${rootId}/itinerary`);
  };

  const selectedOperator = operators.find((op) => op.id === selectedOperatorId) || operators[0];
  const operatorName = selectedOperator?.tradingName || "Sahel Executive";

  // ====================================================
  // VIEW: AIRCRAFT PHOTOS PICKER (SCREEN 3)
  // ====================================================
  if (isPhotoPickerOpen) {
    const tripDisplayId = rootId || "MX5521";

    const togglePhoto = (label: string) => {
      if (selectedPhotos.includes(label)) {
        setSelectedPhotos(selectedPhotos.filter((p) => p !== label));
      } else {
        if (selectedPhotos.length >= 4) {
          alert("Maximum 4 photos allowed on quote PDF.");
          return;
        }
        setSelectedPhotos([...selectedPhotos, label]);
      }
    };

    return (
      <div className="space-y-5 max-w-6xl mx-auto pb-12 font-sans">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <span>Quotes</span>
          <span>/</span>
          <span>New</span>
          <span>/</span>
          <span className="text-gray-800">Step 04 · Operator offer / Photos</span>
        </div>

        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            New quote · {tripDisplayId} · Aircraft photos
          </h1>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPhotoPickerOpen(false)}
              className="bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 text-xs font-medium px-4 py-1.5 rounded-lg shadow-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setIsPhotoPickerOpen(false)}
              className="bg-[#111827] text-white hover:bg-gray-800 text-xs font-semibold px-4 py-1.5 rounded-lg shadow-sm transition-all"
            >
              Use selected photos
            </button>
          </div>
        </div>

        {/* Informational Blue Banner */}
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] px-4 py-2.5 rounded-xl text-xs font-medium">
          Pick one exterior and one cabin for the quote PDF (up to 4 in total). Photos are saved with this quote version, so revising later never changes a quote that was already sent.
        </div>

        {/* 2-Column Photos Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: From the operator */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900">
                  From the operator · {operatorName} · this aircraft
                </h2>
                <button
                  type="button"
                  onClick={() => alert("Upload custom photos from operator spec sheet")}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-xs font-medium px-3 py-1 rounded-lg shadow-sm transition-all"
                >
                  + Paste or upload
                </button>
              </div>

              {/* Grid of 4 operator cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. Exterior · actual aircraft */}
                <div
                  className={`bg-[#F1F3F5] rounded-xl p-3 flex flex-col justify-between h-40 transition-all ${
                    selectedPhotos.includes("Exterior · actual aircraft")
                      ? "border-2 border-black"
                      : "border border-gray-200"
                  }`}
                >
                  <div>
                    {selectedPhotos.includes("Exterior · actual aircraft") && (
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-white text-emerald-700 shadow-sm">
                        On quote
                      </span>
                    )}
                  </div>
                  <div className="text-center text-xs text-gray-700 font-medium my-auto">
                    Exterior · actual aircraft
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-gray-500">Operator</span>
                    <button
                      type="button"
                      onClick={() => togglePhoto("Exterior · actual aircraft")}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {selectedPhotos.includes("Exterior · actual aircraft") ? "Remove" : "Use"}
                    </button>
                  </div>
                </div>

                {/* 2. Cabin · actual aircraft */}
                <div
                  className={`bg-[#F1F3F5] rounded-xl p-3 flex flex-col justify-between h-40 transition-all ${
                    selectedPhotos.includes("Cabin · actual aircraft")
                      ? "border-2 border-black"
                      : "border border-gray-200"
                  }`}
                >
                  <div>
                    {selectedPhotos.includes("Cabin · actual aircraft") && (
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-white text-emerald-700 shadow-sm">
                        On quote
                      </span>
                    )}
                  </div>
                  <div className="text-center text-xs text-gray-700 font-medium my-auto">
                    Cabin · actual aircraft
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-gray-500">Operator</span>
                    <button
                      type="button"
                      onClick={() => togglePhoto("Cabin · actual aircraft")}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {selectedPhotos.includes("Cabin · actual aircraft") ? "Remove" : "Use"}
                    </button>
                  </div>
                </div>

                {/* 3. Cabin · rear */}
                <div
                  className={`bg-[#F1F3F5] rounded-xl p-3 flex flex-col justify-between h-40 transition-all ${
                    selectedPhotos.includes("Cabin · rear")
                      ? "border-2 border-black"
                      : "border border-gray-200"
                  }`}
                >
                  <div>
                    {selectedPhotos.includes("Cabin · rear") && (
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-white text-emerald-700 shadow-sm">
                        On quote
                      </span>
                    )}
                  </div>
                  <div className="text-center text-xs text-gray-700 font-medium my-auto">
                    Cabin · rear
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-gray-500">Operator</span>
                    <button
                      type="button"
                      onClick={() => togglePhoto("Cabin · rear")}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {selectedPhotos.includes("Cabin · rear") ? "Remove" : "Use"}
                    </button>
                  </div>
                </div>

                {/* 4. Dropzone Card */}
                <div className="border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center h-40 transition-colors">
                  <div className="text-xs text-gray-500 font-medium leading-relaxed">
                    Paste (Ctrl/Cmd+V) or drop photos here
                  </div>
                </div>
              </div>

              {/* Checkbox */}
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="save-to-op"
                  checked={saveToOperatorAircraft}
                  onChange={(e) => setSaveToOperatorAircraft(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="save-to-op" className="text-xs text-gray-700 font-medium cursor-pointer">
                  Also save these to the operator&apos;s aircraft, for future quotes
                </label>
              </div>
            </div>

            {/* Card 2: Generic photos */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-900">
                Generic · {selectedAircraft.name} (from Aircraft types)
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Generic 1 */}
                <div className="bg-[#F1F3F5] rounded-xl p-3 flex flex-col justify-between h-36 border border-gray-200">
                  <div className="text-center text-xs text-gray-700 font-medium my-auto">
                    Exterior · default
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-gray-500">Generic</span>
                    <button
                      type="button"
                      onClick={() => togglePhoto("Exterior · default")}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {selectedPhotos.includes("Exterior · default") ? "Remove" : "Use"}
                    </button>
                  </div>
                </div>

                {/* Generic 2 */}
                <div className="bg-[#F1F3F5] rounded-xl p-3 flex flex-col justify-between h-36 border border-gray-200">
                  <div className="text-center text-xs text-gray-700 font-medium my-auto">
                    Cabin · default
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-gray-500">Generic</span>
                    <button
                      type="button"
                      onClick={() => togglePhoto("Cabin · default")}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {selectedPhotos.includes("Cabin · default") ? "Remove" : "Use"}
                    </button>
                  </div>
                </div>

                {/* Generic 3 */}
                <div className="bg-[#F1F3F5] rounded-xl p-3 flex flex-col justify-between h-36 border border-gray-200">
                  <div className="text-center text-xs text-gray-700 font-medium my-auto">
                    Cabin · night
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-gray-500">Generic</span>
                    <button
                      type="button"
                      onClick={() => togglePhoto("Cabin · night")}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {selectedPhotos.includes("Cabin · night") ? "Remove" : "Use"}
                    </button>
                  </div>
                </div>

                {/* Generic 4 */}
                <div className="bg-[#F1F3F5] rounded-xl p-3 flex flex-col justify-between h-36 border border-gray-200">
                  <div className="text-center text-xs text-gray-700 font-medium my-auto">
                    Galley
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-gray-500">Generic</span>
                    <button
                      type="button"
                      onClick={() => togglePhoto("Galley")}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {selectedPhotos.includes("Galley") ? "Remove" : "Use"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-gray-400 leading-relaxed">
                Generic photos print with the caption &ldquo;Representative of the aircraft type&rdquo;. Operator photos print without it.
              </div>
            </div>
          </div>

          {/* Right Column (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Card: On the quote PDF */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-900">On the quote PDF</h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F1F3F5] rounded-xl p-4 flex flex-col items-center justify-center text-center h-24 border border-gray-200">
                  <span className="text-xs text-gray-700 font-medium">Exterior · operator</span>
                </div>
                <div className="bg-[#F1F3F5] rounded-xl p-4 flex flex-col items-center justify-center text-center h-24 border border-gray-200">
                  <span className="text-xs text-gray-700 font-medium">Cabin · operator</span>
                </div>
              </div>

              <div className="text-[11px] text-gray-400">
                Order: exterior first, then cabin. Drag to swap.
              </div>
            </div>

            {/* Rules Text */}
            <div className="p-1 space-y-1.5 text-xs text-gray-600">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                RULES
              </div>
              <div>No photo chosen: the type&apos;s generic defaults are used</div>
              <div>
                Operator photos never show the operator&apos;s name or logo on the client PDF (crop or choose another)
              </div>
              <div>A sent quote keeps its photos; a revision can change them</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Banner if pre-filled from Agent Request */}
      {sourceRequest && (
        <div className="callout green text-xs flex items-center justify-between">
          <div>
            <span className="font-bold block">Pre-filled from Broker Request #{sourceRequest.id}</span>
            <span className="font-mono text-[11px] opacity-80">
              Agent: {sourceRequest.agentName} • Route: {sourceRequest.route} • Pax: {sourceRequest.paxCount}
            </span>
          </div>
          <span className="pill green font-bold">1 TOKEN DEDUCTED</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--muted)] mb-1">
            <Link href="/quotes" className="hover:underline">Quotes</Link>
            <span>/</span>
            <span>{reviseTripId ? "Revise Quote" : "New Quote Builder"}</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-[var(--ink)] m-0">
            {reviseTripId ? `Revise Quotation (${versionLabel})` : `New Charter Quotation (${versionLabel})`}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/quotes" className="btn-secondary text-xs">
            Cancel
          </Link>
          <button
            onClick={handleCompleteQuotation}
            className="btn-primary text-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Complete Quotation</span>
          </button>
        </div>
      </div>

      {/* 2-Column Builder Layout: 6 Sections Left, Live Price Panel Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Sections 1-6 in Order (R-014) */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 1: CLIENT */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                01
              </span>
              <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                Client & Account Selection
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div>
                <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">
                  Client Account
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink)]"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.accountNumber}>
                      {acc.name} ({acc.accountNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">
                  Lead Passenger / Signatory Name
                </label>
                <input
                  type="text"
                  value={leadPaxName}
                  onChange={(e) => setLeadPaxName(e.target.value)}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink)]"
                />
              </div>

              <div className="sm:col-span-2 bg-[var(--paper)] p-3 rounded-lg border border-[var(--line)] font-mono text-xs space-y-0.5 text-[var(--muted)]">
                <div>Billing Address: <strong className="text-[var(--ink)]">{activeAccount?.billingAddress || "10 Mayfair Place"}</strong></div>
                <div>Account Ref: <strong className="text-[var(--ink)]">{activeAccount?.accountNumber}</strong></div>
              </div>
            </div>
          </div>

          {/* SECTION 2: ITINERARY */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                  02
                </span>
                <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                  Routing & Schedule
                </h3>
              </div>

              {/* Trip Type Toggle */}
              <div className="flex items-center gap-1 bg-[var(--wf)] p-1 rounded-lg border border-[var(--line)]">
                {(["one_way", "round_trip", "multi_leg"] as TripType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTripType(t)}
                    className={`text-[11px] font-mono px-2.5 py-1 rounded transition-all ${
                      tripType === t
                        ? "bg-[var(--ink)] text-[var(--card)] font-bold shadow-sm"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {t.replace("_", " ").toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Leg 1 */}
            <div className="space-y-3 p-3.5 bg-[var(--paper)] rounded-lg border border-[var(--line)]">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-xs uppercase text-[var(--muted)]">
                  Leg 01 (Outbound)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[var(--muted)] mb-1">Origin Station</label>
                  <AirportSearchSelect
                    value={originAirport?.icao || "LSGG"}
                    onChange={(icao) => {
                      const apt = findAirportByCode(icao);
                      if (apt) setOriginAirport(apt);
                    }}
                    placeholder="Departure Airport"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[var(--muted)] mb-1">Destination Station</label>
                  <AirportSearchSelect
                    value={destAirport?.icao || "EGSS"}
                    onChange={(icao) => {
                      const apt = findAirportByCode(icao);
                      if (apt) setDestAirport(apt);
                    }}
                    placeholder="Arrival Airport"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[var(--muted)] mb-1">Flight Date</label>
                  <input
                    type="date"
                    value={flightDate}
                    onChange={(e) => setFlightDate(e.target.value)}
                    className="w-full bg-[var(--card)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[var(--muted)] mb-1">Departure Time (Local)</label>
                  <input
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full bg-[var(--card)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Leg 2 if Round Trip (R-014: Leg 2 origin locked to Leg 1 arrival) */}
            {tripType === "round_trip" && (
              <div className="space-y-3 p-3.5 bg-[var(--paper)] rounded-lg border border-[var(--line)]">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-xs uppercase text-[var(--muted)]">
                    Leg 02 (Return Flight — Departure Locked to Leg 1 Destination)
                  </span>
                  <span className="pill grey text-[10px]">LOCKED ORIGIN</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-[var(--muted)] mb-1">Origin (Locked)</label>
                    <div className="p-2 bg-[var(--wf)] rounded border border-[var(--line)] text-xs font-mono font-bold text-[var(--ink)]">
                      {destAirport?.name} ({destAirport?.icao})
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-[var(--muted)] mb-1">Destination (Return)</label>
                    <div className="p-2 bg-[var(--wf)] rounded border border-[var(--line)] text-xs font-mono font-bold text-[var(--ink)]">
                      {originAirport?.name} ({originAirport?.icao})
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-[var(--muted)] mb-1">Return Date</label>
                    <input
                      type="date"
                      value={returnFlightDate}
                      onChange={(e) => setReturnFlightDate(e.target.value)}
                      className="w-full bg-[var(--card)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-[var(--muted)] mb-1">Return Time (Local)</label>
                    <input
                      type="time"
                      value={returnDepartureTime}
                      onChange={(e) => setReturnDepartureTime(e.target.value)}
                      className="w-full bg-[var(--card)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: PASSENGERS, LUGGAGE & PETS */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                03
              </span>
              <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                Passengers, Luggage & Pets
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
              <div>
                <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">Passenger Count</label>
                <input
                  type="number"
                  min={1}
                  max={19}
                  value={paxCount}
                  onChange={(e) => setPaxCount(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[var(--ink)]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">Standard Luggage (Pieces)</label>
                <input
                  type="number"
                  min={0}
                  value={luggagePieces}
                  onChange={(e) => setLuggagePieces(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--ink)]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">Pets in Cabin</label>
                <button
                  type="button"
                  onClick={() => setHasPets(!hasPets)}
                  className={`w-full py-2 px-3 rounded-lg border text-xs font-mono font-bold transition-all ${
                    hasPets
                      ? "bg-[var(--amber-soft)] text-[var(--amber)] border-[var(--amber)]"
                      : "bg-[var(--paper)] text-[var(--muted)] border-[var(--line)]"
                  }`}
                >
                  {hasPets ? "✓ Pets Accompanied" : "No Pets"}
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 4: OPERATOR OFFER */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                04
              </span>
              <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                Operator Sourcing & Flight Rate
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div>
                <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">Air Carrier / Operator</label>
                <select
                  value={selectedOperatorId}
                  onChange={(e) => setSelectedOperatorId(e.target.value)}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink)]"
                >
                  {operators.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.tradingName} ({op.aocNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">Aircraft Model</label>
                <select
                  value={selectedAircraft.id}
                  onChange={(e) => {
                    const ac = fleetData.find((f) => f.id === e.target.value) || fleetData[0];
                    setSelectedAircraft(ac);
                  }}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink)]"
                >
                  {fleetData.map((ac) => (
                    <option key={ac.id} value={ac.id}>
                      {ac.name} ({ac.categoryLabel} • {ac.passengers} pax)
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">
                  Direct Flight Cost from Operator (EUR Net)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-sm text-[var(--muted)]">€</span>
                  <input
                    type="number"
                    value={operatorFlightCost}
                    onChange={(e) => setOperatorFlightCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg pl-8 pr-3 py-2 text-sm font-mono font-black text-[var(--ink)]"
                  />
                </div>
              </div>

              {/* Step 04 Photos Row */}
              <div className="sm:col-span-2 pt-3 border-t border-[var(--line)] flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-[var(--ink)] block">Aircraft Photos on Quote PDF</span>
                  <span className="text-[11px] text-[var(--muted)]">
                    {selectedPhotos.length} selected: {selectedPhotos.join(", ")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPhotoPickerOpen(true)}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all"
                >
                  Pick photos
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 5: SERVICES */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                05
              </span>
              <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                Concierge & Ground Services (No Cancellation Insurance per R-014)
              </h3>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-[var(--paper)] rounded-lg border border-[var(--line)] flex items-center justify-between">
                <div>
                  <span className="font-display font-bold text-xs text-[var(--ink)] block">VIP Limousine Transfer</span>
                  <span className="text-[11px] text-[var(--muted)] font-mono">Chauffeur service upon arrival</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={limousinePrice}
                    onChange={(e) => setLimousinePrice(parseFloat(e.target.value) || 0)}
                    className="w-20 text-right font-mono text-xs bg-[var(--card)] border border-[var(--line)] rounded p-1"
                  />
                  <input
                    type="checkbox"
                    checked={addLimousine}
                    onChange={(e) => setAddLimousine(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-[var(--paper)] rounded-lg border border-[var(--line)] flex items-center justify-between">
                <div>
                  <span className="font-display font-bold text-xs text-[var(--ink)] block">Executive In-Flight Catering</span>
                  <span className="text-[11px] text-[var(--muted)] font-mono">Champagne, caviar & custom menu</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={cateringPrice}
                    onChange={(e) => setCateringPrice(parseFloat(e.target.value) || 0)}
                    className="w-20 text-right font-mono text-xs bg-[var(--card)] border border-[var(--line)] rounded p-1"
                  />
                  <input
                    type="checkbox"
                    checked={addCatering}
                    onChange={(e) => setAddCatering(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6: MARGINS & COMMISSIONS */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                06
              </span>
              <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                Margins & Agent Commission
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-[var(--paper)] rounded-lg border border-[var(--line)]">
                <span className="text-[10px] text-[var(--muted)] uppercase block">Company Margin (Automated Tier)</span>
                <span className="font-bold text-base text-[var(--ink)] block mt-0.5">{companyMarginPercent}%</span>
                <span className="text-[11px] text-[var(--muted)] font-sans">
                  Tier applied based on €{operatorFlightCost.toLocaleString()} cost
                </span>
              </div>

              <div className="p-3 bg-[var(--paper)] rounded-lg border border-[var(--line)]">
                <span className="text-[10px] text-[var(--muted)] uppercase block">Agent Commission</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <input
                    type="number"
                    step={0.5}
                    value={agentCommissionPercent}
                    onChange={(e) => setAgentCommissionPercent(parseFloat(e.target.value) || 0)}
                    className="w-16 font-mono font-bold text-sm bg-[var(--card)] border border-[var(--line)] rounded p-1"
                  />
                  <span className="font-bold">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Price Panel (R-014) */}
        <div>
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4 sticky top-6 shadow-sm">
            <div className="border-b border-[var(--line)] pb-3">
              <span className="font-mono text-[10px] uppercase font-bold text-[var(--muted)]">
                Live Pricing Engine
              </span>
              <h3 className="font-display font-black text-2xl text-[var(--ink)] m-0">
                {formatCurrency(clientTotal, "EUR")}
              </h3>
              <p className="text-[11px] font-mono text-[var(--muted)] mt-0.5">
                Client wire settlement total
              </p>
            </div>

            {/* Itemized Calculation */}
            <div className="space-y-2 text-xs font-mono divide-y divide-[var(--line)]">
              <div className="flex justify-between pt-1">
                <span className="text-[var(--muted)]">Direct Flight Cost:</span>
                <span className="font-bold">€{operatorFlightCost.toLocaleString()}.00</span>
              </div>

              <div className="flex justify-between pt-1">
                <span className="text-[var(--muted)]">Company Margin ({companyMarginPercent}%):</span>
                <span className="font-bold text-[var(--accent)]">+ €{companyMarginAmount.toLocaleString()}.00</span>
              </div>

              <div className="flex justify-between pt-1">
                <span className="text-[var(--muted)]">Agent Commission ({agentCommissionPercent}%):</span>
                <span className="font-bold text-[var(--accent)]">+ €{agentMarginAmount.toLocaleString()}.00</span>
              </div>

              {servicesTotal > 0 && (
                <div className="flex justify-between pt-1">
                  <span className="text-[var(--muted)]">Services Total:</span>
                  <span className="font-bold text-[var(--accent)]">+ €{servicesTotal.toLocaleString()}.00</span>
                </div>
              )}

              <div className="flex justify-between pt-2 font-bold text-sm text-[var(--ink)]">
                <span>Client Total (Wire):</span>
                <span>{formatCurrency(clientTotal, "EUR")}</span>
              </div>

              <div className="flex justify-between pt-1 text-[11px] bg-[var(--paper)] p-2 rounded">
                <span className="text-[var(--muted)]">Credit Card (+3.5%):</span>
                <span className="font-bold text-[var(--ink)]">{formatCurrency(cardAmount, "EUR")}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-3 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={handleCompleteQuotation}
                className="w-full btn-primary text-xs justify-center py-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Complete Quotation ({versionLabel})</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/quotes")}
                className="w-full btn-secondary text-xs justify-center"
              >
                <span>Save Draft (No Version)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

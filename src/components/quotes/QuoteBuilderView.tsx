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
import AircraftSearchSelect from "@/components/common/AircraftSearchSelect";
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
  DollarSign,
  ChevronDown
} from "lucide-react";

export interface MultiLegItem {
  id: string;
  origin: any;
  destination: any;
  flightDate: string;
  departureTime: string;
  aircraft: Aircraft;
}

interface QuoteBuilderProps {
  reviseTripId?: string;
  fromRequestId?: string;
  mode?: "quote" | "booking";
}

export default function QuoteBuilderView({ reviseTripId, fromRequestId, mode }: QuoteBuilderProps) {
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
    const clean = reviseTripId.toLowerCase();
    return bookings.find(
      (b) =>
        b.id.toLowerCase() === clean ||
        b.tripNumber?.toLowerCase() === clean ||
        b.tripId?.toLowerCase() === clean ||
        b.id.toLowerCase().replace("booking-", "") === clean.replace("booking-", "") ||
        b.tripId?.toLowerCase() === clean.replace("booking-", "").split("-")[0]
    );
  }, [bookings, reviseTripId]);

  const isBookingRevision = useMemo(() => {
    if (mode === "booking") return true;
    if (!sourceTrip) return false;
    return Boolean(
      sourceTrip.isBooked ||
      ["booked", "confirmed", "paid", "flown", "dispatched"].includes(sourceTrip.status) ||
      sourceTrip.id.toLowerCase().startsWith("booking-")
    );
  }, [mode, sourceTrip]);

  const sourceRequest = useMemo(() => {
    if (!reqId) return undefined;
    return agentRequests.find((r) => r.id === reqId);
  }, [agentRequests, reqId]);

  // Root ID and next version
  const [rootId] = useState<string>(() => {
    if (sourceTrip) {
      const raw = sourceTrip.tripId || sourceTrip.tripNumber || sourceTrip.id;
      return raw.replace(/^booking-/i, "").replace(/^trip-/i, "").split("-")[0].toUpperCase();
    }
    return generateTripRootId();
  });

  const nextVersionNum = useMemo(() => {
    if (!sourceTrip) return 1;
    const existing = bookings.filter((b) => {
      const bRoot = (b.tripId || b.tripNumber || b.id)
        .replace(/^booking-/i, "")
        .replace(/^trip-/i, "")
        .split("-")[0]
        .toUpperCase();
      return bRoot === rootId;
    });
    const maxVer = existing.reduce(
      (max, b) => Math.max(max, b.quoteVersion || 1),
      sourceTrip.quoteVersion || 1
    );
    return maxVer + 1;
  }, [bookings, rootId, sourceTrip]);

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

  // Multi-Leg state with "Same aircraft on all legs"
  const [sameAircraftOnAllLegs, setSameAircraftOnAllLegs] = useState<boolean>(true);
  const [multiLegs, setMultiLegs] = useState<MultiLegItem[]>(() => {
    if (sourceTrip && sourceTrip.legs && sourceTrip.legs.length > 1) {
      return sourceTrip.legs.map((leg, idx) => ({
        id: `leg-${idx + 1}`,
        origin: leg.origin || airportsData[0],
        destination: leg.destination || airportsData[1],
        flightDate: leg.flightDate || "2026-11-20",
        departureTime: leg.departureTimeLocal || "10:00",
        aircraft: sourceTrip.aircraft || fleetData[0]
      }));
    }
    return [
      {
        id: "leg-1",
        origin: findAirportByCode(sourceRequest?.originIcao || "LSGG") || airportsData[0],
        destination: findAirportByCode(sourceRequest?.destIcao || "EGSS") || airportsData[1],
        flightDate: sourceRequest?.flightDate || "2026-11-20",
        departureTime: sourceRequest?.departureTime || "10:00",
        aircraft: fleetData[0]
      },
      {
        id: "leg-2",
        origin: findAirportByCode(sourceRequest?.destIcao || "EGSS") || airportsData[1],
        destination: airportsData[2] || airportsData[0],
        flightDate: "2026-11-22",
        departureTime: "14:00",
        aircraft: fleetData[0]
      }
    ];
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

  // 5. Services (Screen 2 design)
  const [serviceOptions, setServiceOptions] = useState({
    limousine: true,
    helicopter: false,
    catering: true,
    deicing: false,
    carbonOffset: false,
  });

  interface CustomService {
    id: string;
    name: string;
    details: string;
    price: number;
  }
  const [customServices, setCustomServices] = useState<CustomService[]>([]);
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customServiceName, setCustomServiceName] = useState("");
  const [customServiceDetails, setCustomServiceDetails] = useState("");
  const [customServicePrice, setCustomServicePrice] = useState<number>(150);

  // Standard prices per service
  const [limousinePrice, setLimousinePrice] = useState<number>(300);
  const [helicopterPrice, setHelicopterPrice] = useState<number>(850);
  const [cateringPrice, setCateringPrice] = useState<number>(0);
  const [deicingPrice, setDeicingPrice] = useState<number>(450);
  const [carbonOffsetPrice, setCarbonOffsetPrice] = useState<number>(65);

  // 6. Margins & Payment (Screen 2 design)
  const [companyMarginText, setCompanyMarginText] = useState("8 % · tier > € 35k");
  const [agentMarginText, setAgentMarginText] = useState("10 % · set by agent");
  const [currency, setCurrency] = useState<"EUR" | "USD" | "GBP" | "CHF">("EUR");
  const [validUntil, setValidUntil] = useState("16 Nov 18:00 LT");

  // Parse percentages safely
  const companyMarginPercent = useMemo(() => {
    const match = companyMarginText.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 8;
  }, [companyMarginText]);

  const agentCommissionPercent = useMemo(() => {
    const match = agentMarginText.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 10;
  }, [agentMarginText]);

  // Financial Calculations
  const customServicesTotal = customServices.reduce((sum, item) => sum + item.price, 0);
  const servicesTotal =
    (serviceOptions.limousine ? limousinePrice : 0) +
    (serviceOptions.helicopter ? helicopterPrice : 0) +
    (serviceOptions.catering ? cateringPrice : 0) +
    (serviceOptions.deicing ? deicingPrice : 0) +
    (serviceOptions.carbonOffset ? carbonOffsetPrice : 0) +
    customServicesTotal;

  const companyMarginAmount = Math.round((operatorFlightCost * companyMarginPercent) / 100);
  const agentMarginAmount = Math.round((operatorFlightCost * agentCommissionPercent) / 100);
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
    const legs: FlightLeg[] = [];

    if (tripType === "multi_leg") {
      multiLegs.forEach((mLeg, idx) => {
        legs.push({
          legNumber: idx + 1,
          flightDate: mLeg.flightDate,
          origin: mLeg.origin,
          destination: mLeg.destination,
          departureTimeLocal: mLeg.departureTime,
          arrivalTimeLocal: "12:30",
          flightTimeFormatted: "1h 30m",
          paxCount,
          flightNumber: `OB${Math.floor(100 + Math.random() * 900)}`,
          aircraftRegistration:
            (!sameAircraftOnAllLegs
              ? mLeg.aircraft?.registration
              : selectedAircraft.registration) || "OE-FFB",
          aircraftType: !sameAircraftOnAllLegs
            ? mLeg.aircraft?.name
            : selectedAircraft.name,
          crew: [],
          passengers: [
            {
              id: `pax-lead-${idx + 1}`,
              fullName: leadPaxName,
              isLeadPassenger: true
            }
          ],
          departureHandling: {
            name: `${mLeg.origin?.name || "VIP"} FBO`,
            airportCode: mLeg.origin?.icao || "LSGG",
            phone: "+41 22 717 0111",
            email: "ops@tagaviation.com"
          },
          arrivalHandling: {
            name: `${mLeg.destination?.name || "VIP"} FBO`,
            airportCode: mLeg.destination?.icao || "EGSS",
            phone: "+44 1279 680616",
            email: "fbo@harrodsaviation.com"
          }
        });
      });
    } else {
      legs.push({
        legNumber: 1,
        flightDate,
        origin: originAirport,
        destination: destAirport,
        departureTimeLocal: departureTime,
        arrivalTimeLocal: "11:45",
        flightTimeFormatted: "1h 45m",
        paxCount,
        flightNumber: `OB${Math.floor(100 + Math.random() * 900)}`,
        aircraftRegistration: selectedAircraft.registration || "OE-FFB",
        aircraftType: selectedAircraft.name,
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
      });

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
          aircraftRegistration: selectedAircraft.registration || "OE-FFB",
          aircraftType: selectedAircraft.name,
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
    }

    const newBooking: Booking = {
      id: isBookingRevision
        ? `booking-${rootId.toLowerCase()}-v${nextVersionNum}`
        : `trip-${rootId.toLowerCase()}-v${nextVersionNum}`,
      tripId: rootId,
      tripNumber: versionLabel,
      quoteReference: versionLabel,
      invoiceNumber: sourceTrip?.invoiceNumber || `INV-${rootId}-01`,
      accountNumber: activeAccount?.accountNumber || "ACC-21737",
      contractDate: sourceTrip?.contractDate || new Date().toLocaleDateString("de-DE"),
      quoteExpirationDate: validUntil || "48 hours from issuance",
      paymentDueDate: sourceTrip?.paymentDueDate || "Upon contract execution",
      status: isBookingRevision ? (sourceTrip?.status || "confirmed") : "quoted",
      isBooked: isBookingRevision ? true : false,
      quoteStatus: isBookingRevision ? "accepted" : "sent",
      paymentStatus: isBookingRevision
        ? sourceTrip?.paymentStatus || "fully_paid"
        : "unpaid",
      bookingRevisionId: isBookingRevision ? versionLabel : undefined,
      tripType,
      aircraft: selectedAircraft,
      client: {
        fullName: leadPaxName,
        companyName: activeAccount?.name || sourceTrip?.client.companyName || "Private VIP",
        streetAddress: activeAccount?.billingAddress || sourceTrip?.client.streetAddress || "10 Mayfair Place",
        cityPostalCountry: `${activeAccount?.country || sourceTrip?.client.cityPostalCountry || "United Kingdom"}`,
        phone: activeAccount?.phone || sourceTrip?.client.phone || "+44 20 7946 0192",
        email: activeAccount?.email || sourceTrip?.client.email || "charter@bgcapital.com",
        accountNumber: activeAccount?.accountNumber || "ACC-21737"
      },
      operator: {
        companyName: selectedOperator?.tradingName || sourceTrip?.operator.companyName || "GlobeAir AG",
        legalEntity: sourceTrip?.operator.legalEntity || "GlobeAir Aviation Operations Ltd",
        representativeName: "Charter Desk",
        supportEmail: selectedOperator?.opsEmail || sourceTrip?.operator.supportEmail || "charter@globeair.com",
        supportPhone: selectedOperator?.opsPhone || sourceTrip?.operator.supportPhone || "+43 7221 727400",
        vatNumber: sourceTrip?.operator.vatNumber || "ATU 6335 7619",
        additionalVatNumbers: [],
        iban: sourceTrip?.operator.iban || "AT89 3740 0000 1122 3344",
        bic: sourceTrip?.operator.bic || "LOWWAT22",
        bankName: sourceTrip?.operator.bankName || "Erste Bank Aviation",
        accountHolder: selectedOperator?.tradingName || sourceTrip?.operator.accountHolder || "GlobeAir AG",
        commercialRegistry: `AOC ${selectedOperator?.aocNumber || "AT.AOC.0842"}`,
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
        currency: currency
      },
      services: {
        limousineService: serviceOptions.limousine,
        luxuryCarRental: false,
        helicopterService: serviceOptions.helicopter,
        vipCateringDetails: serviceOptions.catering ? "VIP menu 1 · both legs · included" : undefined,
        deicingInsurance: serviceOptions.deicing ? "at_reservation" : "none",
        deicingCostPerLeg: serviceOptions.deicing ? deicingPrice : 0,
        carbonOffset: serviceOptions.carbonOffset ? "neutral" : "none",
        carbonOffsetRatePerHour: serviceOptions.carbonOffset ? carbonOffsetPrice : 0
      },
      checklist: sourceTrip?.checklist || [],
      quoteVersion: nextVersionNum,
      createdAt: sourceTrip?.createdAt || new Date().toISOString(),
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
            <Link
              href={isBookingRevision ? "/bookings" : "/quotes"}
              className="hover:text-[var(--ink)] transition-colors"
            >
              {isBookingRevision ? "Bookings" : "Quotes"}
            </Link>
            <span>/</span>
            <span>
              {reviseTripId
                ? isBookingRevision
                  ? "Revise Booking"
                  : "Revise Quote"
                : "New Quote Builder"}
            </span>
          </div>
          <h1 className="text-2xl font-bold font-display text-[var(--ink)] m-0">
            {reviseTripId
              ? isBookingRevision
                ? `Revise Booking (${versionLabel})`
                : `Revise Quotation (${versionLabel})`
              : `New Charter Quotation (${versionLabel})`}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={
              isBookingRevision
                ? reviseTripId
                  ? `/trips/${rootId}/itinerary`
                  : "/bookings"
                : "/quotes"
            }
            className="btn-secondary text-xs"
          >
            Cancel
          </Link>
          <button
            onClick={handleCompleteQuotation}
            className="btn-primary text-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isBookingRevision
                ? `Complete Booking Revision (${versionLabel})`
                : `Complete Quotation (${versionLabel})`}
            </span>
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

            {/* Multi-Leg Layout if Multi Leg */}
            {tripType === "multi_leg" ? (
              <div className="space-y-4">
                {/* Multi-Leg Top Bar with Same Aircraft toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-950">
                      MULTI-LEG ROUTING ({multiLegs.length} LEGS)
                    </span>
                    <span className="text-[11px] text-blue-800 font-sans hidden sm:inline">
                      • Add waypoints & chain stations
                    </span>
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-800 cursor-pointer select-none bg-white px-3 py-1.5 rounded-md border border-gray-300 shadow-2xs">
                    <input
                      type="checkbox"
                      checked={sameAircraftOnAllLegs}
                      onChange={(e) => {
                        setSameAircraftOnAllLegs(e.target.checked);
                        if (e.target.checked) {
                          setMultiLegs((prev) =>
                            prev.map((l) => ({ ...l, aircraft: selectedAircraft }))
                          );
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                    <span>Same aircraft on all legs</span>
                  </label>
                </div>

                {/* Legs List */}
                <div className="space-y-3">
                  {multiLegs.map((mLeg, idx) => (
                    <div
                      key={mLeg.id}
                      className="space-y-3 p-3.5 bg-[var(--paper)] rounded-lg border border-[var(--line)]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-xs uppercase text-[var(--ink)]">
                            Leg {String(idx + 1).padStart(2, "0")}{" "}
                            {idx === 0
                              ? "(Initial Departure)"
                              : idx === multiLegs.length - 1
                              ? "(Final Leg)"
                              : `(Waypoint Leg ${idx + 1})`}
                          </span>
                          {idx > 0 && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                              Chained from Leg {idx}
                            </span>
                          )}
                        </div>

                        {multiLegs.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              setMultiLegs(multiLegs.filter((_, i) => i !== idx));
                            }}
                            className="text-xs text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Leg</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono text-[var(--muted)] mb-1">
                            Origin Station
                          </label>
                          <AirportSearchSelect
                            value={mLeg.origin?.icao || "LSGG"}
                            onChange={(icao) => {
                              const apt = findAirportByCode(icao);
                              if (apt) {
                                const updated = [...multiLegs];
                                updated[idx].origin = apt;
                                setMultiLegs(updated);
                              }
                            }}
                            placeholder="Departure Airport"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-[var(--muted)] mb-1">
                            Destination Station
                          </label>
                          <AirportSearchSelect
                            value={mLeg.destination?.icao || "EGSS"}
                            onChange={(icao) => {
                              const apt = findAirportByCode(icao);
                              if (apt) {
                                const updated = [...multiLegs];
                                updated[idx].destination = apt;
                                if (idx + 1 < updated.length) {
                                  updated[idx + 1].origin = apt;
                                }
                                setMultiLegs(updated);
                              }
                            }}
                            placeholder="Arrival Airport"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-[var(--muted)] mb-1">
                            Flight Date
                          </label>
                          <input
                            type="date"
                            value={mLeg.flightDate}
                            onChange={(e) => {
                              const updated = [...multiLegs];
                              updated[idx].flightDate = e.target.value;
                              setMultiLegs(updated);
                            }}
                            className="w-full bg-[var(--card)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-[var(--muted)] mb-1">
                            Departure Time (Local)
                          </label>
                          <input
                            type="time"
                            value={mLeg.departureTime}
                            onChange={(e) => {
                              const updated = [...multiLegs];
                              updated[idx].departureTime = e.target.value;
                              setMultiLegs(updated);
                            }}
                            className="w-full bg-[var(--card)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono"
                          />
                        </div>

                        {/* Per-leg aircraft when Same aircraft on all legs is unchecked */}
                        {!sameAircraftOnAllLegs && (
                          <div className="sm:col-span-2 pt-2 border-t border-[var(--line)]">
                            <label className="block text-[11px] font-mono font-bold text-gray-700 mb-1">
                              Aircraft for Leg {idx + 1}
                            </label>
                            <AircraftSearchSelect
                              value={mLeg.aircraft?.id || selectedAircraft.id}
                              onChange={(ac) => {
                                const updated = [...multiLegs];
                                updated[idx].aircraft = ac;
                                setMultiLegs(updated);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Leg button */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const last = multiLegs[multiLegs.length - 1];
                      const nextDest =
                        airportsData.find((a) => a.icao !== last?.destination?.icao) ||
                        airportsData[2] ||
                        airportsData[0];
                      setMultiLegs([
                        ...multiLegs,
                        {
                          id: `leg-${Date.now()}`,
                          origin: last?.destination || airportsData[0],
                          destination: nextDest,
                          flightDate: last?.flightDate || flightDate,
                          departureTime: "14:00",
                          aircraft: sameAircraftOnAllLegs ? selectedAircraft : fleetData[0]
                        }
                      ]);
                    }}
                    className="btn-secondary text-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Leg</span>
                  </button>
                  <span className="text-[11px] text-[var(--muted)] font-sans">
                    Leg {multiLegs.length + 1} origin automatically connects to{" "}
                    {multiLegs[multiLegs.length - 1]?.destination?.icao || "previous arrival"}.
                  </span>
                </div>
              </div>
            ) : (
              <>
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
              </>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-mono font-bold text-[var(--muted)]">
                    Aircraft Model {tripType === "multi_leg" && sameAircraftOnAllLegs && "(All Legs)"}
                  </label>
                  {tripType === "multi_leg" && (
                    <span className="text-[10px] font-mono text-gray-500">
                      {sameAircraftOnAllLegs ? "Same on all legs" : "Per leg assigned"}
                    </span>
                  )}
                </div>
                <AircraftSearchSelect
                  value={selectedAircraft.id}
                  onChange={(ac) => {
                    setSelectedAircraft(ac);
                    if (tripType === "multi_leg" && sameAircraftOnAllLegs) {
                      setMultiLegs((prev) => prev.map((l) => ({ ...l, aircraft: ac })));
                    }
                  }}
                />
              </div>

              {tripType === "multi_leg" && !sameAircraftOnAllLegs && (
                <div className="sm:col-span-2 space-y-2 p-3 bg-[var(--paper)] rounded-lg border border-[var(--line)]">
                  <span className="text-xs font-mono font-bold text-gray-800 block">
                    Per-Leg Aircraft Assignment ({multiLegs.length} legs):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {multiLegs.map((mLeg, idx) => (
                      <div
                        key={mLeg.id}
                        className="p-2.5 bg-white rounded border border-gray-200 space-y-1"
                      >
                        <span className="text-[11px] font-mono font-bold text-gray-800 block">
                          Leg {idx + 1}: {mLeg.origin?.icao || "LSGG"} → {mLeg.destination?.icao || "EGSS"}
                        </span>
                        <AircraftSearchSelect
                          value={mLeg.aircraft?.id || selectedAircraft.id}
                          onChange={(ac) => {
                            const updated = [...multiLegs];
                            updated[idx].aircraft = ac;
                            setMultiLegs(updated);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

              {/* Step 04 Photos Row (Exact styling of Image 2) */}
              <div className="sm:col-span-2 pt-3 border-t border-[var(--line)] flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  {selectedPhotos.map((photo) => (
                    <span
                      key={photo}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                    >
                      {photo.includes("Cabin")
                        ? "Cabin · operator"
                        : photo.includes("Exterior")
                        ? "Exterior · operator"
                        : photo}
                    </span>
                  ))}
                  {selectedPhotos.length === 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Cabin · operator
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsPhotoPickerOpen(true)}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-xs font-semibold px-3 py-1.5 rounded-md shadow-2xs transition-all text-gray-800"
                >
                  Choose photos
                </button>
                <span className="text-xs text-gray-500 font-sans">
                  Generic type photos are used if none are chosen
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 5: SERVICES (Exact styling of Image 2) */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-3.5">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                05
              </span>
              <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                Services
              </h3>
            </div>

            {/* Checkboxes Row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 pt-1">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={serviceOptions.limousine}
                  onChange={(e) =>
                    setServiceOptions({ ...serviceOptions, limousine: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <span>VIP limousine</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={serviceOptions.helicopter}
                  onChange={(e) =>
                    setServiceOptions({ ...serviceOptions, helicopter: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <span>Helicopter</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={serviceOptions.catering}
                  onChange={(e) =>
                    setServiceOptions({ ...serviceOptions, catering: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <span>Catering</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={serviceOptions.deicing}
                  onChange={(e) =>
                    setServiceOptions({ ...serviceOptions, deicing: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <span>De-icing protection</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={serviceOptions.carbonOffset}
                  onChange={(e) =>
                    setServiceOptions({ ...serviceOptions, carbonOffset: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <span>Carbon offset</span>
              </label>

              {customServices.map((cs) => (
                <label
                  key={cs.id}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-800 cursor-pointer select-none bg-blue-50/70 px-2 py-0.5 rounded border border-blue-200"
                >
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={() => setCustomServices(customServices.filter((s) => s.id !== cs.id))}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 cursor-pointer accent-blue-600"
                  />
                  <span>{cs.name}</span>
                </label>
              ))}

              <button
                type="button"
                onClick={() => setIsCustomDialogOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 px-2 py-0.5 rounded shadow-2xs transition-all"
              >
                <span>+ Custom</span>
              </button>
            </div>

            {/* Custom service modal / inline panel */}
            {isCustomDialogOpen && (
              <div className="p-3 bg-white border border-blue-200 rounded-lg shadow-sm space-y-2.5 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">Add Custom Concierge / Service</span>
                  <button
                    type="button"
                    onClick={() => setIsCustomDialogOpen(false)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Service Name (e.g. Tarmac Escort)"
                    value={customServiceName}
                    onChange={(e) => setCustomServiceName(e.target.value)}
                    className="bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-800"
                  />
                  <input
                    type="text"
                    placeholder="Details (e.g. VIP ramp access · 4 pax)"
                    value={customServiceDetails}
                    onChange={(e) => setCustomServiceDetails(e.target.value)}
                    className="bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-800"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Price (€)"
                      value={customServicePrice}
                      onChange={(e) => setCustomServicePrice(parseFloat(e.target.value) || 0)}
                      className="w-24 bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-800"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customServiceName.trim()) {
                          setCustomServices([
                            ...customServices,
                            {
                              id: `cs-${Date.now()}`,
                              name: customServiceName.trim(),
                              details: customServiceDetails.trim() || "Custom service",
                              price: customServicePrice,
                            },
                          ]);
                          setCustomServiceName("");
                          setCustomServiceDetails("");
                          setCustomServicePrice(150);
                          setIsCustomDialogOpen(false);
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1 rounded"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Services Summary Box (Exact styling of Image 2) */}
            <div className="bg-[#f8f9fa] border border-[#e5e7eb] rounded-lg p-3 text-xs text-gray-700 space-y-1 font-sans">
              {serviceOptions.limousine && (
                <div>
                  Limousine · leg 1 on arrival DNAA - Maitama, Abuja · SUV · 5 pax · client price € {limousinePrice.toFixed(2)}
                </div>
              )}
              {serviceOptions.catering && (
                <div>
                  Catering · VIP menu 1 · both legs · {cateringPrice === 0 ? "included" : `client price € ${cateringPrice.toFixed(2)}`}
                </div>
              )}
              {serviceOptions.helicopter && (
                <div>
                  Helicopter · VIP charter connector · 5 pax · client price € {helicopterPrice.toFixed(2)}
                </div>
              )}
              {serviceOptions.deicing && (
                <div>
                  De-icing protection · holdover protection package · client price € {deicingPrice.toFixed(2)}
                </div>
              )}
              {serviceOptions.carbonOffset && (
                <div>
                  Carbon offset · Gold Standard certified climate credit · client price € {carbonOffsetPrice.toFixed(2)}
                </div>
              )}
              {customServices.map((cs) => (
                <div key={cs.id}>
                  {cs.name} · {cs.details} · client price € {cs.price.toFixed(2)}
                </div>
              ))}
              {!serviceOptions.limousine &&
                !serviceOptions.catering &&
                !serviceOptions.helicopter &&
                !serviceOptions.deicing &&
                !serviceOptions.carbonOffset &&
                customServices.length === 0 && (
                  <div className="text-gray-400 italic">No additional services selected</div>
                )}
            </div>
          </div>

          {/* SECTION 6: MARGINS & PAYMENT (Exact styling of Image 2) */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                06
              </span>
              <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                Margins & payment
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5">
                  COMPANY MARGIN
                </label>
                <input
                  type="text"
                  value={companyMarginText}
                  onChange={(e) => setCompanyMarginText(e.target.value)}
                  placeholder="8 % · tier > € 35k"
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-semibold text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5">
                  AGENT MARGIN
                </label>
                <input
                  type="text"
                  value={agentMarginText}
                  onChange={(e) => setAgentMarginText(e.target.value)}
                  placeholder="10 % · set by agent"
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-semibold text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5">
                  CURRENCY
                </label>
                <div className="relative">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-semibold text-gray-800 shadow-2xs appearance-none pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="CHF">CHF</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5">
                  VALID UNTIL
                </label>
                <input
                  type="text"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  placeholder="16 Nov 18:00 LT"
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-semibold text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
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
                {formatCurrency(clientTotal, currency)}
              </h3>
              <p className="text-[11px] font-mono text-[var(--muted)] mt-0.5">
                Client wire settlement total
              </p>
            </div>

            {/* Itemized Calculation */}
            <div className="space-y-2 text-xs font-mono divide-y divide-[var(--line)]">
              <div className="flex justify-between pt-1">
                <span className="text-[var(--muted)]">Direct Flight Cost:</span>
                <span className="font-bold">{currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "}{operatorFlightCost.toLocaleString()}.00</span>
              </div>

              <div className="flex justify-between pt-1">
                <span className="text-[var(--muted)]">Company Margin ({companyMarginPercent}%):</span>
                <span className="font-bold text-[var(--accent)]">+ {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "}{companyMarginAmount.toLocaleString()}.00</span>
              </div>

              <div className="flex justify-between pt-1">
                <span className="text-[var(--muted)]">Agent Commission ({agentCommissionPercent}%):</span>
                <span className="font-bold text-[var(--accent)]">+ {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "}{agentMarginAmount.toLocaleString()}.00</span>
              </div>

              {servicesTotal > 0 && (
                <div className="flex justify-between pt-1">
                  <span className="text-[var(--muted)]">Services Total:</span>
                  <span className="font-bold text-[var(--accent)]">+ {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "}{servicesTotal.toLocaleString()}.00</span>
                </div>
              )}

              <div className="flex justify-between pt-2 font-bold text-sm text-[var(--ink)]">
                <span>Client Total (Wire):</span>
                <span>{formatCurrency(clientTotal, currency)}</span>
              </div>

              <div className="flex justify-between pt-1 text-[11px] bg-[var(--paper)] p-2 rounded">
                <span className="text-[var(--muted)]">Credit Card (+3.5%):</span>
                <span className="font-bold text-[var(--ink)]">{formatCurrency(cardAmount, currency)}</span>
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
                <span>
                  {isBookingRevision
                    ? `Complete Booking Revision (${versionLabel})`
                    : `Complete Quotation (${versionLabel})`}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    isBookingRevision
                      ? reviseTripId
                        ? `/trips/${rootId}/itinerary`
                        : "/bookings"
                      : "/quotes"
                  )
                }
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

"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { Booking, FlightLeg, TripType, Aircraft, OperatorRecord } from "@/types/aviation";
import { generateTripRootId, formatTripVersion, extractFeToken, pad3, getLinkedIds } from "@/lib/idGenerator";
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
  ChevronDown,
  Search,
  Upload,
  Image as ImageIcon,
  UserCheck,
  X
} from "lucide-react";

export interface MultiLegItem {
  id: string;
  origin: any;
  destination: any;
  flightDate: string;
  departureTime: string;
  aircraft: Aircraft;
  operatorId?: string;
  buyingPrice?: number;
  exteriorPhoto?: string;
  cabinPhoto?: string;
  cabinPhoto2?: string;
  yearOfMake?: number | string;
  yearOfRefurbishment?: number | string;
  seats?: number;
  smokingCabin?: boolean;
  lavatoryOnBoard?: boolean;
  lavatoryType?: "Enclosed" | "Semi-private";
}

export interface PetItem {
  id: string;
  species: string;
  breed: string;
  weightKg: number;
  travels: string;
  documents: string;
  notes: string;
}

const parseDateToIso = (dateStr?: string, fallback = "2026-11-24"): string => {
  if (!dateStr) return fallback;
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(\d{1,2})\s+([A-Za-z]{3})(?:\s+(\d{4}))?/);
  if (match) {
    const day = match[1].padStart(2, "0");
    const months: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
    };
    const mon = months[match[2].toLowerCase()] || "11";
    const year = match[3] || "2026";
    return `${year}-${mon}-${day}`;
  }
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().split("T")[0];
  }
  return fallback;
};

const parseTimeToLocal = (timeStr?: string, fallback = "08:30"): string => {
  if (!timeStr) return fallback;
  const match = timeStr.match(/(\d{1,2}:\d{2})/);
  return match ? match[1] : fallback;
};

interface QuoteBuilderProps {
  reviseTripId?: string;
  fromRequestId?: string;
  mode?: "quote" | "booking";
}

export default function QuoteBuilderView({ reviseTripId, fromRequestId, mode }: QuoteBuilderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reqId = fromRequestId || searchParams.get("fromRequest") || searchParams.get("requestId");

  const effectiveReviseId =
    reviseTripId ||
    searchParams.get("reviseQuote") ||
    searchParams.get("reviseTrip") ||
    searchParams.get("reviseTripId") ||
    searchParams.get("revise") ||
    searchParams.get("tripId") ||
    undefined;

  const effectiveMode =
    mode ||
    (searchParams.get("mode") === "booking" || searchParams.get("reviseTrip") ? "booking" : undefined);

  const {
    bookings,
    accounts,
    contacts,
    operators,
    agentRequests,
    settings,
    addBooking,
    updateAgentRequestStatus,
    sendMessage,
    addOperator
  } = useAviation();

  // Find source if revising or creating from request
  const sourceTrip = useMemo(() => {
    if (!effectiveReviseId) return undefined;
    const clean = effectiveReviseId.trim().toLowerCase();
    const token = extractFeToken(effectiveReviseId);
    return bookings.find((b) => {
      const bId = (b.id || "").toLowerCase();
      const bTripNum = (b.tripNumber || "").toLowerCase();
      const bTripId = (b.tripId || "").toLowerCase();
      const bQuoteId = (b.quoteId || "").toLowerCase();
      const bQuoteRef = (b.quoteReference || "").toLowerCase();

      if (
        bId === clean ||
        bTripNum === clean ||
        bTripId === clean ||
        bQuoteId === clean ||
        bQuoteRef === clean
      ) {
        return true;
      }
      if (
        bId.replace(/^booking-/i, "").replace(/^trip-/i, "") ===
        clean.replace(/^booking-/i, "").replace(/^trip-/i, "")
      ) {
        return true;
      }
      if (token) {
        const bToken = extractFeToken(b.tripId || b.tripNumber || b.quoteId || b.quoteReference || b.id);
        if (bToken && bToken.toUpperCase() === token.toUpperCase()) {
          return true;
        }
      }
      return false;
    });
  }, [bookings, effectiveReviseId]);

  const isBookingRevision = useMemo(() => {
    if (effectiveMode === "booking") return true;
    if (!sourceTrip) return false;
    return Boolean(
      sourceTrip.isBooked ||
      ["booked", "confirmed", "paid", "flown", "dispatched"].includes(sourceTrip.status) ||
      sourceTrip.id.toLowerCase().startsWith("booking-")
    );
  }, [effectiveMode, sourceTrip]);

  const sourceRequest = useMemo(() => {
    if (!reqId) return undefined;
    const cleanReqId = reqId.trim().toLowerCase();
    return agentRequests.find(
      (r) =>
        r.id.toLowerCase() === cleanReqId ||
        (r as any)._id?.toString().toLowerCase() === cleanReqId ||
        (r as any).requestId?.toLowerCase() === cleanReqId
    );
  }, [agentRequests, reqId]);

  // Root ID and next version
  const [rootId] = useState<string>(() => {
    if (sourceTrip) {
      const token = extractFeToken(sourceTrip.tripId || sourceTrip.tripNumber || sourceTrip.quoteId || sourceTrip.quoteReference || sourceTrip.id);
      if (token) return token;
      const raw = sourceTrip.tripId || sourceTrip.tripNumber || sourceTrip.id;
      return raw.replace(/^booking-/i, "").replace(/^trip-/i, "").replace(/^quo-/i, "").split("-")[0].toUpperCase();
    }
    if (sourceRequest?.createdTripId) {
      const token = extractFeToken(sourceRequest.createdTripId);
      if (token) return token;
      return sourceRequest.createdTripId.replace(/^booking-/i, "").replace(/^trip-/i, "").replace(/^quo-/i, "").split("-")[0].toUpperCase();
    }
    return generateTripRootId();
  });

  const nextVersionNum = useMemo(() => {
    if (!sourceTrip) return 1;
    const existing = bookings.filter((b) => {
      const bToken = extractFeToken(b.tripId || b.tripNumber || b.quoteId || b.quoteReference || b.id);
      if (bToken && bToken.toUpperCase() === rootId.toUpperCase()) return true;
      const bRoot = (b.tripId || b.tripNumber || b.id)
        .replace(/^booking-/i, "")
        .replace(/^trip-/i, "")
        .replace(/^quo-/i, "")
        .split("-")[0]
        .toUpperCase();
      return bRoot === rootId.toUpperCase();
    });
    const maxVer = existing.reduce(
      (max, b) => Math.max(max, b.quoteVersion || 1),
      sourceTrip.quoteVersion || 1
    );
    return maxVer + 1;
  }, [bookings, rootId, sourceTrip]);

  const versionLabel = isBookingRevision
    ? formatTripVersion(rootId, nextVersionNum)
    : `QUO-${rootId}-${pad3(nextVersionNum)}`;

  // Form State
  // 1. Client
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    if (sourceTrip?.accountNumber) return sourceTrip.accountNumber;
    if (sourceRequest) {
      const match = accounts.find(
        (a) =>
          (sourceRequest.accountId && (a.accountNumber === sourceRequest.accountId || a.id === sourceRequest.accountId)) ||
          (sourceRequest.clientName && a.name.toLowerCase().includes(sourceRequest.clientName.toLowerCase())) ||
          (sourceRequest.companyName && a.name.toLowerCase().includes(sourceRequest.companyName.toLowerCase()))
      );
      if (match) return match.accountNumber || match.id;
      if (sourceRequest.accountId) return sourceRequest.accountId;
    }
    return accounts[0]?.accountNumber || "ACC-21737";
  });
  const [leadPaxName, setLeadPaxName] = useState<string>(() => {
    return sourceRequest?.clientName || sourceTrip?.client.fullName || "Edward Brinkmann";
  });

  // Searchable account dropdown state
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [accountSearchQuery, setAccountSearchQuery] = useState("");
  const accountDropdownRef = React.useRef<HTMLDivElement>(null);

  // PA / Representative handling state
  const [isHandledByPa, setIsHandledByPa] = useState<boolean>(() => {
    if (sourceTrip?.isHandledByPa || sourceTrip?.client?.isHandledByPa) return true;
    return false;
  });
  const [paName, setPaName] = useState<string>(() => {
    return sourceTrip?.paName || sourceTrip?.client?.paName || "";
  });
  const [paEmail, setPaEmail] = useState<string>(() => {
    return sourceTrip?.paEmail || sourceTrip?.client?.paEmail || "";
  });
  const [paPhone, setPaPhone] = useState<string>(() => {
    return sourceTrip?.paPhone || sourceTrip?.client?.paPhone || "";
  });

    // Click outside to close account dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resolveOwnerNameForAccount = (acc: any) => {
    if (!acc) return "Edward Brinkmann";
    const primaryPerson = acc.authorizedPersons?.find((p: any) => p.isPrimaryAccountName);
    if (primaryPerson?.fullName) return primaryPerson.fullName;
    if (acc.preferredContactName) return acc.preferredContactName;
    if (acc.authorizedPersons?.[0]?.fullName) return acc.authorizedPersons[0].fullName;
    if (acc.accountType === "individual") return acc.name;
    return acc.name || "Edward Brinkmann";
  };

  const handleSelectAccount = (acc: any) => {
    setSelectedAccountId(acc.accountNumber);
    setIsAccountDropdownOpen(false);
    setAccountSearchQuery("");
    const owner = resolveOwnerNameForAccount(acc);
    if (owner) {
      setLeadPaxName(owner);
    }
  };

  const filteredAccounts = useMemo(() => {
    const q = accountSearchQuery.toLowerCase().trim();
    if (!q) return accounts;
    return accounts.filter((a) => {
      const matchName = a.name?.toLowerCase().includes(q);
      const matchNum = a.accountNumber?.toLowerCase().includes(q);
      const matchContact = a.preferredContactName?.toLowerCase().includes(q) ||
        a.authorizedPersons?.some((p) => p.fullName.toLowerCase().includes(q));
      return matchName || matchNum || matchContact;
    });
  }, [accounts, accountSearchQuery]);

  // 2. Itinerary
  const [tripType, setTripType] = useState<TripType>(() => {
    if (sourceTrip?.tripType) return sourceTrip.tripType;
    if (sourceRequest?.tripType) return sourceRequest.tripType;
    if (sourceRequest?.route?.includes("⇄") || sourceRequest?.route?.toLowerCase().includes("round")) return "round_trip";
    return "round_trip";
  });
  const [originAirport, setOriginAirport] = useState<any>(() => {
    return sourceTrip?.legs[0]?.origin || findAirportByCode(sourceRequest?.originIcao || "LSGG") || airportsData[0];
  });
  const [destAirport, setDestAirport] = useState<any>(() => {
    return sourceTrip?.legs[0]?.destination || findAirportByCode(sourceRequest?.destIcao || "LFMN") || airportsData[1];
  });
  const [flightDate, setFlightDate] = useState<string>(() => {
    if (sourceTrip?.legs[0]?.flightDate) return sourceTrip.legs[0].flightDate;
    if (sourceRequest?.flightDate) return parseDateToIso(sourceRequest.flightDate, "2026-11-24");
    return "2026-11-24";
  });
  const [departureTime, setDepartureTime] = useState<string>(() => {
    if (sourceTrip?.legs[0]?.departureTimeLocal) return sourceTrip.legs[0].departureTimeLocal;
    if (sourceRequest?.departureTime) return parseTimeToLocal(sourceRequest.departureTime, "08:30");
    return "08:30";
  });
  const [returnFlightDate, setReturnFlightDate] = useState<string>(() => {
    if (sourceTrip?.legs[1]?.flightDate) return sourceTrip.legs[1].flightDate;
    if (sourceRequest?.returnFlightDate) return parseDateToIso(sourceRequest.returnFlightDate, "2026-11-30");
    return "2026-11-30";
  });
  const [returnDepartureTime, setReturnDepartureTime] = useState<string>(() => {
    if (sourceTrip?.legs[1]?.departureTimeLocal) return sourceTrip.legs[1].departureTimeLocal;
    return "16:00";
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
        destination: findAirportByCode(sourceRequest?.destIcao || "LFMN") || airportsData[1],
        flightDate: sourceRequest?.flightDate ? parseDateToIso(sourceRequest.flightDate, "2026-11-24") : "2026-11-24",
        departureTime: sourceRequest?.departureTime ? parseTimeToLocal(sourceRequest.departureTime, "08:30") : "08:30",
        aircraft: fleetData[0]
      },
      {
        id: "leg-2",
        origin: findAirportByCode(sourceRequest?.destIcao || "LFMN") || airportsData[1],
        destination: findAirportByCode(sourceRequest?.originIcao || "LSGG") || airportsData[0],
        flightDate: sourceRequest?.returnFlightDate ? parseDateToIso(sourceRequest.returnFlightDate, "2026-11-30") : "2026-11-30",
        departureTime: "16:00",
        aircraft: fleetData[0]
      }
    ];
  });

  // 1. Client, Authorised Owner & Assistant controls (Image 10)
  const [sendDocsTo, setSendDocsTo] = useState<"owner" | "assistant" | "both">("both");
  const [signsAgreement, setSignsAgreement] = useState<"owner" | "assistant">("owner");

  // 3. Passengers & Cargo
  const [paxCount, setPaxCount] = useState<number>(() => {
    return sourceTrip?.legs[0]?.paxCount || sourceRequest?.paxCount || 4;
  });
  const [luggagePieces, setLuggagePieces] = useState<number>(() => {
    if (sourceRequest?.luggageCount) return sourceRequest.luggageCount;
    if (sourceRequest?.luggageDetailsText) {
      const m = sourceRequest.luggageDetailsText.match(/(\d+)/);
      if (m) return parseInt(m[1], 10);
    }
    return 6;
  });
  const [oversizeItems, setOversizeItems] = useState<string>("Golf bag ×1");
  const [hasPets, setHasPets] = useState<boolean>(() => {
    if (sourceRequest?.hasPets !== undefined) return sourceRequest.hasPets;
    if (sourceRequest?.petDetailsText && !sourceRequest.petDetailsText.toLowerCase().includes("none")) return true;
    return true;
  });
  const [pets, setPets] = useState<PetItem[]>([
    {
      id: "pet-1",
      species: "Dog",
      breed: "French Bulldog",
      weightKg: 11,
      travels: "In cabin, in carrier",
      documents: "EU pet passport",
      notes: "Snub-nose"
    },
    {
      id: "pet-2",
      species: "Cat",
      breed: "British Shorthair",
      weightKg: 5,
      travels: "In cabin, in carrier",
      documents: "Health cert & rabies",
      notes: "Quiet"
    }
  ]);

  // Active Leg Photo Index for Multi-Leg Photo Picker
  const [activeLegForPhotoIndex, setActiveLegForPhotoIndex] = useState<number | null>(null);

  // 5. Services: Helicopter & Ground Transportation full state (Images 6 & 7)
  const [heliTransferType, setHeliTransferType] = useState<"arrival" | "departure" | "both">("arrival");
  const [heliPrefType, setHeliPrefType] = useState<string>("Twin Engine VIP (e.g. Agusta 109)");
  const [heliDepLocation, setHeliDepLocation] = useState<string>("Monaco Heliport (LNMC)");
  const [heliArrLocation, setHeliArrLocation] = useState<string>("Nice Côte d'Azur (LFMN)");
  const [heliLuggageNotes, setHeliLuggageNotes] = useState<string>("3 pax, 3 soft bags");

  // Dynamic Ground Transportation State (Image 7)
  const [hasGroundTransport, setHasGroundTransport] = useState<boolean>(true);
  const [groundLegsEnabled, setGroundLegsEnabled] = useState<Record<string, boolean>>({
    "leg-1": true,
    "leg-2": true,
    "leg-3": false,
  });
  const [groundCollapsed, setGroundCollapsed] = useState<Record<string, boolean>>({});
  const [groundTransfers, setGroundTransfers] = useState<Record<string, {
    arrivalRequired: boolean;
    arrivalDropoff: string;
    arrivalVehicle: "Sedan" | "SUV" | "Van" | "Luxury";
    arrivalPrice: number;
    departureRequired: boolean;
    departurePickup: string;
    departureVehicle: "Sedan" | "SUV" | "Van" | "Luxury";
    departurePrice: number;
    passengers: number;
    specialRequests: string;
  }>>({
    "leg-1": {
      arrivalRequired: true,
      arrivalDropoff: "The Savoy, Strand, London",
      arrivalVehicle: "Luxury",
      arrivalPrice: 650,
      departureRequired: true,
      departurePickup: "14 Bourdillon Road, Ikoyi, Lagos",
      departureVehicle: "SUV",
      departurePrice: 180,
      passengers: 5,
      specialRequests: "Meet at aircraft steps; child seat ×1"
    },
    "leg-2": {
      arrivalRequired: true,
      arrivalDropoff: "14 Bourdillon Road, Ikoyi, Lagos",
      arrivalVehicle: "SUV",
      arrivalPrice: 180,
      departureRequired: true,
      departurePickup: "The Savoy, Strand, London",
      departureVehicle: "Luxury",
      departurePrice: 650,
      passengers: 5,
      specialRequests: "Meet at aircraft steps; child seat ×1"
    }
  });

  // Dynamic Helicopter Transfer State (Image 6)
  const [hasHeliTransfer, setHasHeliTransfer] = useState<boolean>(false);
  const [heliLegsEnabled, setHeliLegsEnabled] = useState<Record<string, boolean>>({
    "leg-1": true,
    "leg-2": false,
    "leg-3": false,
  });
  const [heliTransfers, setHeliTransfers] = useState<Record<string, {
    transferType: "arrival" | "departure" | "both";
    passengers: number;
    prefType: string;
    depArrLocation: string;
    destination: string;
    clientPrice: number;
    luggageDetails: string;
    specialRequests: string;
  }>>({
    "leg-1": {
      transferType: "arrival",
      passengers: 4,
      prefType: "Twin-engine, e.g. AW109 or similar",
      depArrLocation: "EGLF Farnborough Airport",
      destination: "Battersea Heliport, London",
      clientPrice: 2400,
      luggageDetails: "4 cabin bags, 2 suitcases (soft)",
      specialRequests: "Landing permission at the hotel helipad to be confirmed"
    }
  });

  // 4. Operator Offer
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>(() => {
    return operators[0]?.id || "op-1";
  });
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft>(() => {
    if (sourceTrip?.aircraft) return sourceTrip.aircraft;
    if (sourceRequest?.aircraftPreference || sourceRequest?.categoryLabel) {
      const pref = `${sourceRequest.aircraftPreference || ""} ${sourceRequest.categoryLabel || ""}`.toLowerCase();
      const matched = fleetData.find(
        (a) =>
          a.name.toLowerCase().includes(pref) ||
          pref.includes(a.name.toLowerCase()) ||
          a.category.toLowerCase().includes(pref) ||
          pref.includes(a.category.toLowerCase()) ||
          (pref.includes("challenger") && a.name.toLowerCase().includes("challenger")) ||
          (pref.includes("latitude") && a.name.toLowerCase().includes("latitude")) ||
          (pref.includes("super mid") && (a.category.toLowerCase().includes("mid") || a.name.toLowerCase().includes("latitude") || a.name.toLowerCase().includes("challenger")))
      );
      if (matched) return matched;
    }
    return fleetData[0];
  });
  const [operatorFlightCost, setOperatorFlightCost] = useState<number>(() => {
    if (isBookingRevision) return 0;
    return sourceTrip?.pricing ? Math.round(sourceTrip.pricing.totalFlightPrice * 0.85) : 11200;
  });

  // Add Operator Modal / Inline flow state (NF-08 / Auto-save to database)
  const [isAddOperatorOpen, setIsAddOperatorOpen] = useState(false);
  const [newOpLegalName, setNewOpLegalName] = useState("");
  const [newOpTradingName, setNewOpTradingName] = useState("");
  const [newOpAoc, setNewOpAoc] = useState("");
  const [newOpCountry, setNewOpCountry] = useState("");
  const [newOpBaseIcao, setNewOpBaseIcao] = useState("");
  const [newOpEmail, setNewOpEmail] = useState("");
  const [newOpPhone, setNewOpPhone] = useState("");
  const [operatorFeedback, setOperatorFeedback] = useState<string | null>(null);

  const handleSaveNewOperator = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newOpLegalName.trim()) return;

    const opName = newOpLegalName.trim();
    const tradeName = newOpTradingName.trim() || opName;
    const aoc = newOpAoc.trim() || `AOC-${Math.floor(1000 + Math.random() * 9000)}`;
    const country = newOpCountry.trim() || "Austria";
    const baseIcao = newOpBaseIcao.trim().toUpperCase() || "LSGG";
    const email = newOpEmail.trim() || `ops@${opName.toLowerCase().replace(/[^a-z0-9]/g, "") || "carrier"}.com`;
    const phone = newOpPhone.trim() || "+43 1 234 5678";

    const newOp: OperatorRecord = {
      id: `op-${Date.now()}`,
      legalName: opName,
      tradingName: tradeName,
      aocNumber: aoc,
      aocAuthority: country,
      aocExpiry: "2028-12-31",
      baseIcao: baseIcao,
      salesContact: "Charter Desk",
      salesEmail: email,
      opsPhone: phone,
      opsEmail: email,
      status: "approved",
      qualificationChecklist: [
        { id: "doc-1", docType: "Air Operator Certificate (AOC)", status: "pass", expiryDate: "2028-12-31" },
        { id: "doc-2", docType: "Operating License (OL)", status: "pass", expiryDate: "2028-12-31" },
        { id: "doc-3", docType: "Fleet Insurance Policy", status: "pass", expiryDate: "2028-12-31" },
        { id: "doc-4", docType: "Air Operator Security Program (AOSP)", status: "pass", expiryDate: "2028-12-31" }
      ],
      createdAt: new Date().toISOString()
    };

    addOperator(newOp);
    setSelectedOperatorId(newOp.id);
    setIsAddOperatorOpen(false);
    setNewOpLegalName("");
    setNewOpTradingName("");
    setNewOpAoc("");
    setNewOpCountry("");
    setNewOpBaseIcao("");
    setNewOpEmail("");
    setNewOpPhone("");
    setOperatorFeedback(`Operator "${tradeName}" successfully saved to database and selected.`);
    setTimeout(() => setOperatorFeedback(null), 5000);
  };

  // Aircraft photos picker state (Step 04 Photos)
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([
    "Exterior · actual aircraft",
    "Cabin · actual aircraft"
  ]);
  const [saveToOperatorAircraft, setSaveToOperatorAircraft] = useState(true);

  const [customExteriorPhoto, setCustomExteriorPhoto] = useState<string>(() => {
    return sourceTrip?.aircraftCustomImages?.exterior || sourceTrip?.aircraft?.imageExterior || selectedAircraft.imageExterior || "";
  });
  const [customCabinPhoto, setCustomCabinPhoto] = useState<string>(() => {
    return sourceTrip?.aircraftCustomImages?.interior || sourceTrip?.aircraft?.imageInterior || selectedAircraft.imageInterior || "";
  });

  interface UploadedPhotoItem {
    id: string;
    url: string;
    name: string;
    tag?: "exterior" | "cabin";
    isOperator?: boolean;
    timestamp: number;
  }
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhotoItem[]>([]);

  const handleProcessImageFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    list.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (!result) return;
        const newPhoto: UploadedPhotoItem = {
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          url: result,
          name: file.name || "Uploaded photo",
          tag: !customExteriorPhoto ? "exterior" : "cabin",
          isOperator: true,
          timestamp: Date.now()
        };
        setUploadedPhotos((prev) => [newPhoto, ...prev]);

        setCustomExteriorPhoto((curr) => {
          if (!curr || curr === selectedAircraft.imageExterior) return result;
          return curr;
        });
        setCustomCabinPhoto((curr) => {
          if (!curr || curr === selectedAircraft.imageInterior) {
            return result;
          }
          return curr;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePastePhoto = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      handleProcessImageFiles(imageFiles);
    }
  };

  // 5. Services (Screen 2 design)
  const [serviceOptions, setServiceOptions] = useState(() => {
    if (sourceRequest) {
      const sText = (sourceRequest.servicesText || "").toLowerCase();
      const askText = (sourceRequest.askOperatorText || "").toLowerCase();
      return {
        limousine: Boolean(sourceRequest.limousineService || sText.includes("limousine")),
        helicopter: Boolean(sourceRequest.helicopterService || sText.includes("helicopter")),
        catering: Boolean(sText.includes("vip") || sText.includes("menu") || sText.includes("catering") || sourceRequest.specialRequests),
        deicing: Boolean(
          sourceRequest.deicingInsurance === "at_reservation" ||
          sourceRequest.deicingInsurance === "within_48h" ||
          askText.includes("de-icing") ||
          askText.includes("deicing")
        ),
        carbonOffset: Boolean(sourceRequest.carbonOffset && sourceRequest.carbonOffset !== "none"),
      };
    }
    return {
      limousine: true,
      helicopter: false,
      catering: true,
      deicing: false,
      carbonOffset: false,
    };
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
  const [agentMarginText, setAgentMarginText] = useState(() => {
    if (sourceRequest?.agentMarginPct) {
      return `${sourceRequest.agentMarginPct} % · set by agent`;
    }
    return "10 % · set by agent";
  });
  const [currency, setCurrency] = useState<"EUR" | "USD" | "GBP" | "CHF">("EUR");
  const [validUntil, setValidUntil] = useState("16 Nov 18:00 LT");

  // Keep in sync if sourceRequest loads later
  useEffect(() => {
    if (sourceRequest) {
      if (sourceRequest.clientName) setLeadPaxName(sourceRequest.clientName);
      if (sourceRequest.originIcao) {
        const apt = findAirportByCode(sourceRequest.originIcao);
        if (apt) setOriginAirport(apt);
      }
      if (sourceRequest.destIcao) {
        const apt = findAirportByCode(sourceRequest.destIcao);
        if (apt) setDestAirport(apt);
      }
      if (sourceRequest.flightDate) setFlightDate(parseDateToIso(sourceRequest.flightDate, "2026-11-24"));
      if (sourceRequest.departureTime) setDepartureTime(parseTimeToLocal(sourceRequest.departureTime, "08:30"));
      if (sourceRequest.returnFlightDate) setReturnFlightDate(parseDateToIso(sourceRequest.returnFlightDate, "2026-11-30"));
      if (sourceRequest.paxCount) setPaxCount(sourceRequest.paxCount);
      if (sourceRequest.tripType) setTripType(sourceRequest.tripType);
      if (sourceRequest.agentMarginPct) setAgentMarginText(`${sourceRequest.agentMarginPct} % · set by agent`);
      if (sourceRequest.aircraftPreference || sourceRequest.categoryLabel) {
        const pref = `${sourceRequest.aircraftPreference || ""} ${sourceRequest.categoryLabel || ""}`.toLowerCase();
        const matched = fleetData.find(
          (a) =>
            a.name.toLowerCase().includes(pref) ||
            pref.includes(a.name.toLowerCase()) ||
            a.category.toLowerCase().includes(pref) ||
            pref.includes(a.category.toLowerCase()) ||
            (pref.includes("challenger") && a.name.toLowerCase().includes("challenger")) ||
            (pref.includes("latitude") && a.name.toLowerCase().includes("latitude")) ||
            (pref.includes("super mid") && (a.category.toLowerCase().includes("mid") || a.name.toLowerCase().includes("latitude") || a.name.toLowerCase().includes("challenger")))
        );
        if (matched) setSelectedAircraft(matched);
      }
    }
  }, [sourceRequest]);

  // Parse percentages safely
  const companyMarginPercent = useMemo(() => {
    const match = companyMarginText.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 8;
  }, [companyMarginText]);

  const agentCommissionPercent = useMemo(() => {
    const match = agentMarginText.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 10;
  }, [agentMarginText]);

  // Helper for per-leg photo picker
  const openPhotoPickerForLeg = (legIndex: number) => {
    setActiveLegForPhotoIndex(legIndex);
    const leg = multiLegs[legIndex];
    if (leg) {
      if (leg.exteriorPhoto) setCustomExteriorPhoto(leg.exteriorPhoto);
      else if (leg.aircraft?.imageExterior) setCustomExteriorPhoto(leg.aircraft.imageExterior);
      if (leg.cabinPhoto) setCustomCabinPhoto(leg.cabinPhoto);
      else if (leg.aircraft?.imageInterior) setCustomCabinPhoto(leg.aircraft.imageInterior);
    }
    setIsPhotoPickerOpen(true);
  };

  const updateLegField = (index: number, field: string, value: any) => {
    setMultiLegs((prev) => {
      const next = [...prev];
      while (next.length <= index) {
        next.push({
          id: `leg-${next.length + 1}`,
          origin: destAirport,
          destination: originAirport,
          flightDate: returnFlightDate,
          departureTime: returnDepartureTime,
          aircraft: selectedAircraft,
          operatorId: selectedOperatorId,
          buyingPrice: Math.round(operatorFlightCost / 2),
        });
      }
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Effective operator cost across legs
  const effectiveOperatorFlightCost = useMemo(() => {
    if (tripType === "multi_leg" && !sameAircraftOnAllLegs) {
      const sum = multiLegs.reduce((acc, leg) => acc + (leg.buyingPrice || 0), 0);
      return sum > 0 ? sum : operatorFlightCost;
    }
    return operatorFlightCost;
  }, [tripType, sameAircraftOnAllLegs, multiLegs, operatorFlightCost]);

  // Dynamic Ground Transportation Total (Image 7)
  const groundServicesTotal = useMemo(() => {
    if (!hasGroundTransport) return 0;
    let sum = 0;
    Object.entries(groundLegsEnabled).forEach(([legKey, enabled]) => {
      if (enabled && groundTransfers[legKey]) {
        const item = groundTransfers[legKey];
        if (item.arrivalRequired) sum += item.arrivalPrice || 0;
        if (item.departureRequired) sum += item.departurePrice || 0;
      }
    });
    return sum;
  }, [hasGroundTransport, groundLegsEnabled, groundTransfers]);

  // Dynamic Helicopter Transfer Total (Image 6)
  const heliServicesTotal = useMemo(() => {
    if (!hasHeliTransfer) return 0;
    let sum = 0;
    Object.entries(heliLegsEnabled).forEach(([legKey, enabled]) => {
      if (enabled && heliTransfers[legKey]) {
        sum += heliTransfers[legKey].clientPrice || 0;
      }
    });
    return sum;
  }, [hasHeliTransfer, heliLegsEnabled, heliTransfers]);

  // Financial Calculations
  const customServicesTotal = customServices.reduce((sum, item) => sum + item.price, 0);
  const servicesTotal =
    (hasGroundTransport ? groundServicesTotal : (serviceOptions.limousine ? limousinePrice : 0)) +
    (hasHeliTransfer ? heliServicesTotal : (serviceOptions.helicopter ? helicopterPrice : 0)) +
    (serviceOptions.catering ? cateringPrice : 0) +
    (serviceOptions.deicing ? deicingPrice : 0) +
    (serviceOptions.carbonOffset ? carbonOffsetPrice : 0) +
    customServicesTotal;

  const companyMarginAmount = Math.round((effectiveOperatorFlightCost * companyMarginPercent) / 100);
  const agentMarginAmount = Math.round((effectiveOperatorFlightCost * agentCommissionPercent) / 100);
  const clientSubtotal = effectiveOperatorFlightCost + companyMarginAmount + agentMarginAmount + servicesTotal;
  const clientTotal = clientSubtotal; // Zero rated VAT for international charter
  const cardAmount = Math.round(clientTotal * 1.035 * 100) / 100;

  // Selected Account details
  const activeAccount = useMemo(() => {
    const found = accounts.find((a) => a.accountNumber === selectedAccountId || a.id === selectedAccountId);
    if (found) return found;
    if (sourceRequest) {
      return {
        id: sourceRequest.accountId || "ACC-61346745090425",
        name: sourceRequest.companyName || sourceRequest.clientName || "Ugochukwu Michael Chukwuekwe",
        accountNumber: sourceRequest.accountId || "ACC-61346745090425",
        billingAddress: sourceRequest.clientAddress || "14 Bourdillon Road, Ikoyi, Lagos, Nigeria",
        country: sourceRequest.clientCityCountry || "Nigeria",
        email: sourceRequest.clientEmail || "client@orbelo.com",
        phone: sourceRequest.clientPhone || "+234 803 123 4567",
        vatNumber: sourceRequest.clientVatNumber || "",
        agentName: sourceRequest.agentName || "Marcus Vance",
        isAgent: false
      };
    }
    return accounts[0];
  }, [accounts, selectedAccountId, sourceRequest]);

  const displayLegs = useMemo(() => {
    if (tripType === "multi_leg") {
      return multiLegs;
    } else if (tripType === "round_trip") {
      return [
        {
          id: "leg-1",
          origin: originAirport,
          destination: destAirport,
          flightDate: flightDate,
          departureTime: departureTime,
          aircraft: multiLegs[0]?.aircraft || selectedAircraft,
          operatorId: multiLegs[0]?.operatorId || selectedOperatorId,
          buyingPrice: multiLegs[0]?.buyingPrice || Math.round(operatorFlightCost / 2),
          exteriorPhoto: multiLegs[0]?.exteriorPhoto || customExteriorPhoto,
          cabinPhoto: multiLegs[0]?.cabinPhoto || customCabinPhoto,
          yearOfMake: multiLegs[0]?.yearOfMake || 2018,
          yearOfRefurbishment: multiLegs[0]?.yearOfRefurbishment || "2023",
          seats: multiLegs[0]?.seats || selectedAircraft.passengers || 9,
          smokingCabin: multiLegs[0]?.smokingCabin || false,
          lavatoryOnBoard: multiLegs[0]?.lavatoryOnBoard ?? true,
          lavatoryType: multiLegs[0]?.lavatoryType || "Enclosed"
        },
        {
          id: "leg-2",
          origin: destAirport,
          destination: originAirport,
          flightDate: returnFlightDate,
          departureTime: returnDepartureTime,
          aircraft: multiLegs[1]?.aircraft || selectedAircraft,
          operatorId: multiLegs[1]?.operatorId || selectedOperatorId,
          buyingPrice: multiLegs[1]?.buyingPrice || Math.round(operatorFlightCost / 2),
          exteriorPhoto: multiLegs[1]?.exteriorPhoto || customExteriorPhoto,
          cabinPhoto: multiLegs[1]?.cabinPhoto || customCabinPhoto,
          yearOfMake: multiLegs[1]?.yearOfMake || 2019,
          yearOfRefurbishment: multiLegs[1]?.yearOfRefurbishment || "—",
          seats: multiLegs[1]?.seats || selectedAircraft.passengers || 9,
          smokingCabin: multiLegs[1]?.smokingCabin || false,
          lavatoryOnBoard: multiLegs[1]?.lavatoryOnBoard ?? true,
          lavatoryType: multiLegs[1]?.lavatoryType || "Semi-private"
        }
      ];
    } else {
      return [
        {
          id: "leg-1",
          origin: originAirport,
          destination: destAirport,
          flightDate: flightDate,
          departureTime: departureTime,
          aircraft: selectedAircraft,
          operatorId: selectedOperatorId,
          buyingPrice: operatorFlightCost,
          exteriorPhoto: customExteriorPhoto,
          cabinPhoto: customCabinPhoto,
          yearOfMake: 2018,
          yearOfRefurbishment: "2023",
          seats: selectedAircraft.passengers || 8,
          smokingCabin: false,
          lavatoryOnBoard: true,
          lavatoryType: "Enclosed"
        }
      ];
    }
  }, [tripType, multiLegs, originAirport, destAirport, flightDate, departureTime, returnFlightDate, returnDepartureTime, selectedAircraft, selectedOperatorId, operatorFlightCost, customExteriorPhoto, customCabinPhoto]);

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

        // Build itemized active services list
    const activeServicesList: Array<{ id: string; name: string; details?: string; price: number }> = [];

    if (hasGroundTransport) {
      displayLegs.forEach((leg, lIdx) => {
        const legKey = `leg-${lIdx + 1}`;
        if (groundLegsEnabled[legKey] && groundTransfers[legKey]) {
          const g = groundTransfers[legKey];
          const origCode = leg.origin?.icao || "LSGG";
          const destCode = leg.destination?.icao || "LFMN";
          if (g.arrivalRequired) {
            activeServicesList.push({
              id: `ground-arr-${legKey}`,
              name: `Ground Transport (Arrival) · Leg ${lIdx + 1}`,
              details: `${destCode} → ${g.arrivalDropoff} (${g.arrivalVehicle}, ${g.passengers} pax)`,
              price: g.arrivalPrice || 0
            });
          }
          if (g.departureRequired) {
            activeServicesList.push({
              id: `ground-dep-${legKey}`,
              name: `Ground Transport (Departure) · Leg ${lIdx + 1}`,
              details: `${g.departurePickup} → ${origCode} (${g.departureVehicle}, ${g.passengers} pax)`,
              price: g.departurePrice || 0
            });
          }
        }
      });
    } else if (serviceOptions.limousine) {
      activeServicesList.push({
        id: "limo",
        name: "VIP limousine",
        details: `arrival ${destAirport.city || destAirport.name || destAirport.icao || "destination"} (SUV, ${paxCount} pax)`,
        price: limousinePrice
      });
    }

    if (hasHeliTransfer) {
      displayLegs.forEach((leg, lIdx) => {
        const legKey = `leg-${lIdx + 1}`;
        if (heliLegsEnabled[legKey] && heliTransfers[legKey]) {
          const h = heliTransfers[legKey];
          const origCode = leg.origin?.icao || "LSGG";
          activeServicesList.push({
            id: `heli-${legKey}`,
            name: `Helicopter Transfer (${h.transferType}) · Leg ${lIdx + 1}`,
            details: `${origCode} → ${h.destination} (${h.prefType}, ${h.passengers} pax)`,
            price: h.clientPrice || 0
          });
        }
      });
    }
    if (serviceOptions.catering) {
      activeServicesList.push({
        id: "catering",
        name: "Catering",
        details: cateringPrice === 0 ? "VIP menu 1 · both legs (included)" : "VIP menu 1 · both legs",
        price: cateringPrice
      });
    }
    if (serviceOptions.helicopter) {
      activeServicesList.push({
        id: "heli",
        name: "Helicopter transfer",
        details: `VIP charter connector (${paxCount} pax)`,
        price: helicopterPrice
      });
    }
    if (serviceOptions.deicing) {
      activeServicesList.push({
        id: "deicing",
        name: "De-icing protection",
        details: "Holdover protection package",
        price: deicingPrice
      });
    }
    if (serviceOptions.carbonOffset) {
      activeServicesList.push({
        id: "carbon",
        name: "Carbon offset",
        details: "Gold Standard certified climate credit",
        price: carbonOffsetPrice
      });
    }
    customServices.forEach((cs) => {
      activeServicesList.push({
        id: cs.id,
        name: cs.name,
        details: cs.details,
        price: cs.price
      });
    });

    const linked = getLinkedIds(rootId, nextVersionNum);
    const newBooking: Booking = {
      id: isBookingRevision
        ? `booking-${rootId.toLowerCase()}-v${nextVersionNum}`
        : `trip-${rootId.toLowerCase()}-v${nextVersionNum}`,
      tripId: `TRI-${rootId}`,
      tripNumber: formatTripVersion(rootId, nextVersionNum),
      quoteId: isBookingRevision ? (sourceTrip?.quoteId || linked.quoteId) : linked.quoteId,
      quoteReference: linked.quoteId,
      quoteGroupId: `quote-group-${rootId.toLowerCase()}`,
      invoiceNumber: sourceTrip?.invoiceNumber || linked.invoiceNumber,
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
      bookingRevisionId: isBookingRevision ? formatTripVersion(rootId, nextVersionNum) : undefined,
      tripType,
      aircraft: {
        ...selectedAircraft,
        imageExterior: customExteriorPhoto || selectedAircraft.imageExterior,
        imageInterior: customCabinPhoto || selectedAircraft.imageInterior,
      },
      aircraftCustomImages: {
        exterior: customExteriorPhoto || selectedAircraft.imageExterior,
        interior: customCabinPhoto || selectedAircraft.imageInterior,
        cabinViews: uploadedPhotos.map((p) => p.url)
      },
      isHandledByPa,
      paName: isHandledByPa ? paName : undefined,
      paEmail: isHandledByPa ? paEmail : undefined,
      paPhone: isHandledByPa ? paPhone : undefined,
      client: {
        fullName: leadPaxName,
        companyName: activeAccount?.name || sourceTrip?.client.companyName || "Private VIP",
        streetAddress: activeAccount?.billingAddress || sourceTrip?.client.streetAddress || "10 Mayfair Place",
        cityPostalCountry: `${activeAccount?.country || sourceTrip?.client.cityPostalCountry || "United Kingdom"}`,
        phone: activeAccount?.phone || sourceTrip?.client.phone || "+44 20 7946 0192",
        email: activeAccount?.email || sourceTrip?.client.email || "charter@bgcapital.com",
        accountNumber: activeAccount?.accountNumber || "ACC-21737",
        isHandledByPa,
        paName: isHandledByPa ? paName : undefined,
        paEmail: isHandledByPa ? paEmail : undefined,
        paPhone: isHandledByPa ? paPhone : undefined,
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
      agentName: sourceRequest?.agentName,
      agentEmail: sourceRequest?.agentEmail,
      commissionPercentage: agentCommissionPercent,
      adminMarginValue: companyMarginPercent,
      manualServices: activeServicesList,
      sourceAgentRequestId: sourceRequest?.id,
      createdAt: sourceTrip?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const persisted = await addBooking(newBooking);

      if (sourceRequest) {
        updateAgentRequestStatus(
          sourceRequest.id,
          "completed",
          persisted.id || newBooking.id,
          `Quoted → ${versionLabel}`
        );

        if (sendMessage) {
          sendMessage({
            channel: "broker_desk",
            recipientEmail: sourceRequest.agentEmail,
            recipientName: sourceRequest.agentName,
            recipientRole: "agent",
            content: `Official Quotation ${versionLabel} compiled and sent for ${leadPaxName} (${originAirport.icao} ⇄ ${destAirport.icao}). Total: €${clientTotal.toLocaleString("de-DE")}`,
            tripNumber: versionLabel,
            requestId: sourceRequest.id,
          });
        }
      }
    } catch (err: any) {
      console.warn("Complete quotation notice:", err);
    }

    if (typeof window !== "undefined") {
      sessionStorage.setItem("orbelo_selected_quote_id", newBooking.id);
    }

    if (isBookingRevision) {
      router.push(`/trips/${rootId}/revisions`);
    } else {
      router.push("/quotes");
    }
  };

  const selectedOperator = operators.find((op) => op.id === selectedOperatorId) || operators[0];
  const operatorName = selectedOperator?.tradingName || "Sahel Executive";

  // ====================================================
  // VIEW: AIRCRAFT PHOTOS PICKER (SCREEN 3)
  // ====================================================
  if (isPhotoPickerOpen) {
    const tripDisplayId = rootId || "MX5521";

    const isExteriorSelected = Boolean(customExteriorPhoto);
    const isCabinSelected = Boolean(customCabinPhoto);

    return (
      <div
        tabIndex={0}
        onPaste={handlePastePhoto}
        className="space-y-5 max-w-6xl mx-auto pb-12 font-sans focus:outline-none"
      >
        {/* Hidden file upload input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleProcessImageFiles(e.target.files);
            }
          }}
          className="hidden"
        />

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
              onClick={() => {
                if (activeLegForPhotoIndex !== null && multiLegs[activeLegForPhotoIndex]) {
                  const updated = [...multiLegs];
                  if (customExteriorPhoto) updated[activeLegForPhotoIndex].exteriorPhoto = customExteriorPhoto;
                  if (customCabinPhoto) updated[activeLegForPhotoIndex].cabinPhoto = customCabinPhoto;
                  setMultiLegs(updated);
                } else {
                  if (customExteriorPhoto) {
                    setSelectedAircraft((prev) => ({ ...prev, imageExterior: customExteriorPhoto }));
                  }
                  if (customCabinPhoto) {
                    setSelectedAircraft((prev) => ({ ...prev, imageInterior: customCabinPhoto }));
                  }
                }
                const chosen: string[] = [];
                if (customExteriorPhoto) chosen.push("Exterior · operator");
                if (customCabinPhoto) chosen.push("Cabin · operator");
                setSelectedPhotos(chosen.length > 0 ? chosen : ["Exterior · operator", "Cabin · operator"]);
                setIsPhotoPickerOpen(false);
                setActiveLegForPhotoIndex(null);
              }}
              className="bg-[#111827] text-white hover:bg-gray-800 text-xs font-semibold px-4 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Use selected photos</span>
            </button>
          </div>
        </div>

        {/* Informational Blue Banner */}
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between">
          <span>
            Pick one exterior and one cabin for the quote PDF (up to 4 in total). Photos are saved with this quote version, so revising later never changes a quote that was already sent.
          </span>
          <span className="text-[11px] font-mono font-bold bg-blue-100/80 px-2 py-0.5 rounded text-blue-900 ml-2 whitespace-nowrap">
            {uploadedPhotos.length > 0 ? `${uploadedPhotos.length} custom uploaded` : "Clipboard & file upload ready"}
          </span>
        </div>

        {/* 2-Column Photos Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Uploaded Photos Section if any */}
            {uploadedPhotos.length > 0 && (
              <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>Uploaded from your device / clipboard ({uploadedPhotos.length})</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    + Add more photos
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {uploadedPhotos.map((photo) => {
                    const isExt = customExteriorPhoto === photo.url;
                    const isCab = customCabinPhoto === photo.url;
                    return (
                      <div
                        key={photo.id}
                        className={`bg-white rounded-xl p-2.5 flex flex-col justify-between border transition-all ${
                          isExt || isCab ? "border-2 border-emerald-600 shadow-md ring-2 ring-emerald-100" : "border-gray-200"
                        }`}
                      >
                        <div className="h-24 w-full rounded-lg overflow-hidden bg-gray-100 relative mb-2">
                          <img
                            src={photo.url}
                            alt={photo.name}
                            className="w-full h-full object-cover"
                          />
                          {(isExt || isCab) && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white shadow">
                              {isExt ? "Exterior on PDF" : "Cabin on PDF"}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-semibold text-gray-800 truncate mb-1.5" title={photo.name}>
                          {photo.name}
                        </div>
                        <div className="flex items-center justify-between text-[11px] gap-1 pt-1 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => setCustomExteriorPhoto(isExt ? "" : photo.url)}
                            className={`font-semibold px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                              isExt
                                ? "bg-emerald-600 text-white"
                                : "text-blue-600 hover:bg-blue-50"
                            }`}
                          >
                            {isExt ? "Exterior ✓" : "Exterior"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomCabinPhoto(isCab ? "" : photo.url)}
                            className={`font-semibold px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                              isCab
                                ? "bg-blue-600 text-white"
                                : "text-blue-600 hover:bg-blue-50"
                            }`}
                          >
                            {isCab ? "Cabin ✓" : "Cabin"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setUploadedPhotos((prev) => prev.filter((p) => p.id !== photo.id))}
                            className="text-gray-400 hover:text-red-600 text-xs px-1"
                            title="Remove uploaded image"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Card 1: From the operator */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900">
                  From the operator · {operatorName} · this aircraft
                </h2>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-xs font-semibold px-3 py-1 rounded-lg shadow-sm transition-all flex items-center gap-1.5 text-gray-800 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-gray-600" />
                  <span>+ Paste or upload</span>
                </button>
              </div>

              {/* Grid of 4 operator cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. Exterior · actual aircraft */}
                <div
                  className={`bg-[#F1F3F5] rounded-xl p-3 flex flex-col justify-between h-44 transition-all ${
                    customExteriorPhoto === (selectedAircraft.imageExterior || "Exterior · actual aircraft")
                      ? "border-2 border-black"
                      : "border border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {customExteriorPhoto === (selectedAircraft.imageExterior || "Exterior · actual aircraft") && (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-white text-emerald-700 shadow-sm">
                        On quote
                      </span>
                    )}
                  </div>
                  {selectedAircraft.imageExterior ? (
                    <div className="h-20 w-full rounded overflow-hidden my-auto bg-gray-200">
                      <img
                        src={selectedAircraft.imageExterior}
                        alt="Exterior"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="text-center text-xs text-gray-700 font-medium my-auto">
                      Exterior · actual aircraft
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-200">
                    <span className="text-gray-500 text-[10px]">Operator</span>
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedAircraft.imageExterior || "Exterior · actual aircraft";
                        setCustomExteriorPhoto(customExteriorPhoto === target ? "" : target);
                      }}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {customExteriorPhoto === (selectedAircraft.imageExterior || "Exterior · actual aircraft") ? "Remove" : "Use Exterior"}
                    </button>
                  </div>
                </div>

                {/* 2. Cabin · actual aircraft */}
                <div
                  className={`bg-[#F1F3F5] rounded-xl p-3 flex flex-col justify-between h-44 transition-all ${
                    customCabinPhoto === (selectedAircraft.imageInterior || "Cabin · actual aircraft")
                      ? "border-2 border-black"
                      : "border border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {customCabinPhoto === (selectedAircraft.imageInterior || "Cabin · actual aircraft") && (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-white text-emerald-700 shadow-sm">
                        On quote
                      </span>
                    )}
                  </div>
                  {selectedAircraft.imageInterior ? (
                    <div className="h-20 w-full rounded overflow-hidden my-auto bg-gray-200">
                      <img
                        src={selectedAircraft.imageInterior}
                        alt="Cabin"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="text-center text-xs text-gray-700 font-medium my-auto">
                      Cabin · actual aircraft
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-200">
                    <span className="text-gray-500 text-[10px]">Operator</span>
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedAircraft.imageInterior || "Cabin · actual aircraft";
                        setCustomCabinPhoto(customCabinPhoto === target ? "" : target);
                      }}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {customCabinPhoto === (selectedAircraft.imageInterior || "Cabin · actual aircraft") ? "Remove" : "Use Cabin"}
                    </button>
                  </div>
                </div>

                {/* 3. Cabin · rear */}
                <div
                  className={`bg-[#F1F3F5] rounded-xl p-3 flex flex-col justify-between h-44 transition-all ${
                    customCabinPhoto === (selectedAircraft.images?.[1] || "Cabin · rear")
                      ? "border-2 border-black"
                      : "border border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {customCabinPhoto === (selectedAircraft.images?.[1] || "Cabin · rear") && (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-white text-emerald-700 shadow-sm">
                        On quote
                      </span>
                    )}
                  </div>
                  <div className="text-center text-xs text-gray-700 font-medium my-auto">
                    Cabin · rear
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-200">
                    <span className="text-gray-500 text-[10px]">Operator</span>
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedAircraft.images?.[1]?.url || selectedAircraft.imageInterior || "Cabin · rear";
                        setCustomCabinPhoto(customCabinPhoto === target ? "" : target);
                      }}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {customCabinPhoto === (selectedAircraft.images?.[1]?.url || selectedAircraft.imageInterior || "Cabin · rear") ? "Remove" : "Use Cabin"}
                    </button>
                  </div>
                </div>

                {/* 4. Dropzone Card with Drag & Drop and Click */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files) handleProcessImageFiles(e.dataTransfer.files);
                  }}
                  className="border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50/20 cursor-pointer rounded-xl p-3 flex flex-col items-center justify-center text-center h-44 transition-all group"
                >
                  <Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-600 mb-1.5 transition-colors" />
                  <div className="text-xs text-gray-700 font-medium leading-tight group-hover:text-blue-700">
                    Paste (Ctrl/Cmd+V) or drop photos here
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    or click to browse from device
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
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-200">
                    <span className="text-gray-500">Generic</span>
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedAircraft.imageExterior || "Exterior · default";
                        setCustomExteriorPhoto(customExteriorPhoto === target ? "" : target);
                      }}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {customExteriorPhoto === (selectedAircraft.imageExterior || "Exterior · default") ? "Remove" : "Use"}
                    </button>
                  </div>
                </div>

                {/* Generic 2 */}
                <div className="bg-[#F1F3F5] rounded-xl p-3 flex flex-col justify-between h-36 border border-gray-200">
                  <div className="text-center text-xs text-gray-700 font-medium my-auto">
                    Cabin · default
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-200">
                    <span className="text-gray-500">Generic</span>
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedAircraft.imageInterior || "Cabin · default";
                        setCustomCabinPhoto(customCabinPhoto === target ? "" : target);
                      }}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {customCabinPhoto === (selectedAircraft.imageInterior || "Cabin · default") ? "Remove" : "Use"}
                    </button>
                  </div>
                </div>

                {/* Generic 3 */}
                <div className="bg-[#F1F3F5] rounded-xl p-3 flex flex-col justify-between h-36 border border-gray-200">
                  <div className="text-center text-xs text-gray-700 font-medium my-auto">
                    Cabin · night
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-200">
                    <span className="text-gray-500">Generic</span>
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedAircraft.images?.[2]?.url || "Cabin · night";
                        setCustomCabinPhoto(customCabinPhoto === target ? "" : target);
                      }}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {customCabinPhoto === (selectedAircraft.images?.[2]?.url || "Cabin · night") ? "Remove" : "Use"}
                    </button>
                  </div>
                </div>

                {/* Generic 4 */}
                <div className="bg-[#F1F3F5] rounded-xl p-3 flex flex-col justify-between h-36 border border-gray-200">
                  <div className="text-center text-xs text-gray-700 font-medium my-auto">
                    Galley
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-200">
                    <span className="text-gray-500">Generic</span>
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedAircraft.images?.[3]?.url || "Galley";
                        setCustomCabinPhoto(customCabinPhoto === target ? "" : target);
                      }}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {customCabinPhoto === (selectedAircraft.images?.[3]?.url || "Galley") ? "Remove" : "Use"}
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
                {/* Exterior Slot */}
                {customExteriorPhoto ? (
                  <div className="rounded-xl overflow-hidden h-28 border-2 border-emerald-500 relative group bg-gray-100">
                    <img
                      src={customExteriorPhoto}
                      alt="Exterior chosen"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white backdrop-blur-xs">
                      Exterior · on quote
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomExteriorPhoto("")}
                      className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/90 text-white p-1 rounded-full text-[10px] leading-none"
                      title="Clear photo"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#F1F3F5] rounded-xl p-3 flex flex-col items-center justify-center text-center h-28 border border-gray-200">
                    <span className="text-xs text-gray-700 font-medium">Exterior · operator</span>
                    <span className="text-[10px] text-gray-400 mt-1">Default will be used</span>
                  </div>
                )}

                {/* Cabin Slot */}
                {customCabinPhoto ? (
                  <div className="rounded-xl overflow-hidden h-28 border-2 border-blue-500 relative group bg-gray-100">
                    <img
                      src={customCabinPhoto}
                      alt="Cabin chosen"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white backdrop-blur-xs">
                      Cabin · on quote
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomCabinPhoto("")}
                      className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/90 text-white p-1 rounded-full text-[10px] leading-none"
                      title="Clear photo"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#F1F3F5] rounded-xl p-3 flex flex-col items-center justify-center text-center h-28 border border-gray-200">
                    <span className="text-xs text-gray-700 font-medium">Cabin · operator</span>
                    <span className="text-[10px] text-gray-400 mt-1">Default will be used</span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-gray-400">
                Order: exterior first, then cabin. Saved automatically with quote version.
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
            {effectiveReviseId
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
                ? `/trips/${rootId}/revisions`
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
                : sourceRequest
                ? `Complete Quotation and Send to Agent (${versionLabel})`
                : `Complete Quotation (${versionLabel})`}
            </span>
          </button>
        </div>
      </div>

      {/* 2-Column Builder Layout: 6 Sections Left, Live Price Panel Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Sections 1-6 in Order (R-014) */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 1: CLIENT (Image 10) */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                01
              </span>
              <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                Client, Authorised Owner and assistant
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              {/* Searchable Client Account Dropdown */}
              <div className="relative" ref={accountDropdownRef}>
                <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1">
                  Client Account
                </label>
                <button
                  type="button"
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink)] flex items-center justify-between text-left hover:border-gray-400 focus:outline-none transition-all shadow-2xs"
                >
                  <span className="truncate font-medium">
                    {activeAccount?.name || "Select Account"}{" "}
                    <span className="text-[var(--muted)] font-mono">
                      ({activeAccount?.accountNumber || selectedAccountId})
                    </span>
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)] shrink-0 ml-1.5" />
                </button>

                {isAccountDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 w-full bg-[var(--card)] border border-[var(--line)] rounded-xl shadow-2xl p-2.5 z-40 space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        autoFocus
                        value={accountSearchQuery}
                        onChange={(e) => setAccountSearchQuery(e.target.value)}
                        placeholder="Search account name, ref, or contact..."
                        className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1 divide-y divide-[var(--line)]">
                      {filteredAccounts.map((acc) => {
                        const isSelected = acc.accountNumber === selectedAccountId;
                        const owner = resolveOwnerNameForAccount(acc);
                        return (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => handleSelectAccount(acc)}
                            className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex flex-col gap-0.5 ${
                              isSelected
                                ? "bg-[var(--wf)] text-[var(--ink)] font-semibold"
                                : "hover:bg-[var(--paper)] text-[var(--ink)]"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold truncate">{acc.name}</span>
                              <span className="font-mono text-[10px] text-[var(--muted)] shrink-0 ml-2">
                                {acc.accountNumber}
                              </span>
                            </div>
                            <div className="text-[11px] text-[var(--muted)] truncate flex items-center gap-1">
                              <span>Owner / Signatory:</span>
                              <strong className="text-[var(--ink)] font-normal">{owner}</strong>
                            </div>
                          </button>
                        );
                      })}
                      {filteredAccounts.length === 0 && (
                        <div className="py-4 text-center text-xs text-[var(--muted)] italic">
                          No matching client accounts found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Authorised Owner Field (Linked to Account) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono font-bold text-[var(--muted)]">
                    Authorised Owner
                  </label>
                  <span className="text-[10px] text-blue-600 font-mono font-medium">
                    Linked to account
                  </span>
                </div>
                <input
                  type="text"
                  value={leadPaxName}
                  onChange={(e) => setLeadPaxName(e.target.value)}
                  placeholder="Primary account owner / signatory"
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* PA / Representative Reservation Section */}
              <div className="sm:col-span-2 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[var(--ink)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isHandledByPa}
                    onChange={(e) => setIsHandledByPa(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
                  />
                  <span>
                    Request handled by Personal Assistant (PA) / Representative on behalf of Authorised Owner
                  </span>
                </label>

                {isHandledByPa && (
                  <div className="mt-2.5 p-3.5 bg-amber-50/70 border border-amber-200/90 rounded-xl space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                      <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                      <span>PA / Representative Reservation Details</span>
                      <span className="text-[10px] font-normal text-amber-800 ml-auto font-mono">
                        Authorised agent for {leadPaxName || "Owner"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-amber-900 mb-1">
                          PA / Representative Name
                        </label>
                        <input
                          type="text"
                          value={paName}
                          onChange={(e) => setPaName(e.target.value)}
                          placeholder="e.g. Sarah Jenkins (Executive PA)"
                          className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-amber-900 mb-1">
                          PA Email (for Operational Briefs)
                        </label>
                        <input
                          type="email"
                          value={paEmail}
                          onChange={(e) => setPaEmail(e.target.value)}
                          placeholder="pa@clientoffice.com"
                          className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-amber-900 mb-1">
                          PA Direct Mobile / Phone
                        </label>
                        <input
                          type="tel"
                          value={paPhone}
                          onChange={(e) => setPaPhone(e.target.value)}
                          placeholder="+44 7700 900077"
                          className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-amber-900/80 leading-relaxed">
                      Quotation and charter agreement remain issued to Authorised Owner (<strong>{leadPaxName || "Account Holder"}</strong>), while operations and flight communications will be coordinated with <strong>{paName || "PA / Representative"}</strong>.
                    </div>
                  </div>
                )}
              </div>

              {/* Image 10 Routing of Documents & Signatory Controls */}
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--line)]">
                <div>
                  <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1.5">
                    Send quotes, contracts and invoices to:
                  </label>
                  <div className="flex items-center gap-2">
                    {(["owner", "assistant", "both"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSendDocsTo(opt)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                          sendDocsTo === opt
                            ? "bg-[#0F1420] text-white border-[#0F1420] shadow-sm"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        {opt === "both" ? "Both" : opt === "owner" ? "Owner" : "Assistant"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1.5">
                    Signs the charter agreement:
                  </label>
                  <div className="flex items-center gap-2">
                    {(["owner", "assistant"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSignsAgreement(opt)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                          signsAgreement === opt
                            ? "bg-[#0F1420] text-white border-[#0F1420] shadow-sm"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        {opt === "owner" ? "Owner" : "Assistant"}
                      </button>
                    ))}
                  </div>
                </div>
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

          {/* SECTION 3: PASSENGERS, LUGGAGE & PETS (Image 5 & 10) */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                03
              </span>
              <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                Passengers, luggage and pets
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
              <div>
                <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1 uppercase tracking-wide">
                  PASSENGERS
                </label>
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
                <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1 uppercase tracking-wide">
                  STANDARD LUGGAGE (PIECES)
                </label>
                <input
                  type="number"
                  min={0}
                  value={luggagePieces}
                  onChange={(e) => setLuggagePieces(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--ink)]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[var(--muted)] mb-1 uppercase tracking-wide">
                  OVERSIZE ITEMS
                </label>
                <input
                  type="text"
                  value={oversizeItems}
                  onChange={(e) => setOversizeItems(e.target.value)}
                  placeholder="e.g. Golf bag ×1, Ski gear"
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--ink)]"
                />
              </div>
            </div>

            {/* Travelling with pets toggle */}
            <div className="pt-2">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[var(--ink)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasPets}
                  onChange={(e) => setHasPets(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <span className="font-semibold text-gray-900">Travelling with pets</span>
              </label>

              {hasPets && (
                <div className="mt-3 p-4 bg-[var(--paper)] border border-[var(--line)] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-gray-800 uppercase tracking-wide">
                      PETS · {pets.length}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      Operator crate rules and destination permits required
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 text-[10px] font-mono font-bold text-gray-500 uppercase">
                          <th className="pb-1.5 pr-2 w-6">#</th>
                          <th className="pb-1.5 px-2">SPECIES</th>
                          <th className="pb-1.5 px-2">BREED</th>
                          <th className="pb-1.5 px-2 w-24">WEIGHT (KG)</th>
                          <th className="pb-1.5 px-2">TRAVELS</th>
                          <th className="pb-1.5 px-2">DOCUMENTS</th>
                          <th className="pb-1.5 px-2">NOTES</th>
                          <th className="pb-1.5 pl-2 text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {pets.map((pet, idx) => (
                          <tr key={pet.id} className="align-middle">
                            <td className="py-2 pr-2 font-mono font-bold text-gray-600">{idx + 1}</td>
                            <td className="py-2 px-2">
                              <select
                                value={pet.species}
                                onChange={(e) => {
                                  const updated = [...pets];
                                  updated[idx].species = e.target.value;
                                  setPets(updated);
                                }}
                                className="bg-white border border-gray-200 rounded px-2 py-1 text-xs"
                              >
                                <option value="Dog">Dog</option>
                                <option value="Cat">Cat</option>
                                <option value="Bird">Bird</option>
                                <option value="Falcon">Falcon</option>
                                <option value="Other">Other</option>
                              </select>
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={pet.breed}
                                onChange={(e) => {
                                  const updated = [...pets];
                                  updated[idx].breed = e.target.value;
                                  setPets(updated);
                                }}
                                placeholder="Breed..."
                                className="bg-white border border-gray-200 rounded px-2 py-1 text-xs w-28"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                min={1}
                                value={pet.weightKg}
                                onChange={(e) => {
                                  const updated = [...pets];
                                  updated[idx].weightKg = parseFloat(e.target.value) || 1;
                                  setPets(updated);
                                }}
                                className="bg-white border border-gray-200 rounded px-2 py-1 text-xs w-16 font-mono"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <select
                                value={pet.travels}
                                onChange={(e) => {
                                  const updated = [...pets];
                                  updated[idx].travels = e.target.value;
                                  setPets(updated);
                                }}
                                className="bg-white border border-gray-200 rounded px-2 py-1 text-xs"
                              >
                                <option value="In cabin, in carrier">In cabin, in carrier</option>
                                <option value="In cabin, on leash">In cabin, on leash</option>
                                <option value="In hold">In hold (pressurized)</option>
                              </select>
                            </td>
                            <td className="py-2 px-2">
                              <select
                                value={pet.documents}
                                onChange={(e) => {
                                  const updated = [...pets];
                                  updated[idx].documents = e.target.value;
                                  setPets(updated);
                                }}
                                className="bg-white border border-gray-200 rounded px-2 py-1 text-xs"
                              >
                                <option value="EU pet passport">EU pet passport</option>
                                <option value="Health cert & rabies">Health cert & rabies</option>
                                <option value="Rabies titre test">Rabies titre test</option>
                                <option value="Import permit">Import permit</option>
                              </select>
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={pet.notes}
                                onChange={(e) => {
                                  const updated = [...pets];
                                  updated[idx].notes = e.target.value;
                                  setPets(updated);
                                }}
                                placeholder="e.g. Snub-nose"
                                className="bg-white border border-gray-200 rounded px-2 py-1 text-xs w-24"
                              />
                            </td>
                            <td className="py-2 pl-2 text-right">
                              <button
                                type="button"
                                onClick={() => setPets(pets.filter((p) => p.id !== pet.id))}
                                className="text-rose-600 hover:text-rose-800 text-xs font-semibold"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setPets([
                          ...pets,
                          {
                            id: `pet-${Date.now()}`,
                            species: "Dog",
                            breed: "",
                            weightKg: 8,
                            travels: "In cabin, in carrier",
                            documents: "EU pet passport",
                            notes: ""
                          }
                        ])
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add pet</span>
                    </button>
                    <p className="text-[11px] text-gray-500 font-sans italic">
                      Pets are sent to operator with sourcing request; entry rules checked in Passengers tab.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: LEGS, OPERATORS AND AIRCRAFT (Matching Image 8) */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                  04
                </span>
                <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                  Legs, operators and aircraft
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOperatorOpen((prev) => !prev)}
                className="btn-secondary text-xs flex items-center gap-1.5 py-1 px-2.5"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Add Operator</span>
              </button>
            </div>

            {operatorFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{operatorFeedback}</span>
              </div>
            )}

            {/* Inline Add Operator Form (Saves automatically to database) */}
            {isAddOperatorOpen && (
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-800" />
                    <h4 className="text-xs font-bold font-display text-amber-950 uppercase tracking-wider">
                      Quick Add Operator (Direct to Database)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddOperatorOpen(false)}
                    className="text-amber-800 hover:text-amber-950 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-amber-800">
                  Operator not in our database? Add their details below. They will be saved to the database immediately with status &ldquo;Documents Pending&rdquo;.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-amber-900 mb-1">
                      Operator Legal Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sahel Jet Services Ltd"
                      value={newOpLegalName}
                      onChange={(e) => setNewOpLegalName(e.target.value)}
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-3 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[var(--accent)]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-amber-900 mb-1">
                      Trading / Brand Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sahel Executive"
                      value={newOpTradingName}
                      onChange={(e) => setNewOpTradingName(e.target.value)}
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-3 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-amber-900 mb-1">
                      AOC Number *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NCAA AOC 0377"
                      value={newOpAoc}
                      onChange={(e) => setNewOpAoc(e.target.value)}
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-3 py-1.5 text-xs text-[#0F1420] uppercase focus:outline-none focus:border-[var(--accent)]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-amber-900 mb-1">
                      Country / Jurisdiction
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Nigeria / NCAA"
                      value={newOpCountry}
                      onChange={(e) => setNewOpCountry(e.target.value)}
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-3 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-amber-900 mb-1">
                      Base Airport (ICAO)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DNAA"
                      value={newOpBaseIcao}
                      onChange={(e) => setNewOpBaseIcao(e.target.value.toUpperCase())}
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-3 py-1.5 text-xs text-[#0F1420] uppercase focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-amber-900 mb-1">
                      Ops Contact Email
                    </label>
                    <input
                      type="email"
                      placeholder="ops@saheljets.com"
                      value={newOpEmail}
                      onChange={(e) => setNewOpEmail(e.target.value)}
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-3 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-amber-200">
                  <button
                    type="button"
                    onClick={() => setIsAddOperatorOpen(false)}
                    className="btn-secondary text-xs py-1 px-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveNewOperator()}
                    className="btn-primary text-xs py-1 px-3 bg-amber-700 hover:bg-amber-800 text-white flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save & Select Operator</span>
                  </button>
                </div>
              </div>
            )}

            {/* Toggle: Same aircraft and operator on all legs (Exact matching Image 8) */}
            <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-lg border border-[var(--line)]">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAircraftOnAllLegs}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setSameAircraftOnAllLegs(val);
                    if (val) {
                      setMultiLegs((prev) =>
                        prev.map((l) => ({
                          ...l,
                          aircraft: selectedAircraft,
                          operatorId: selectedOperatorId,
                          buyingPrice: Math.round(operatorFlightCost / (prev.length || 1))
                        }))
                      );
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent)]"></div>
              </label>
              <div>
                <span className="text-xs font-bold text-gray-900 block">
                  Same aircraft and operator on all legs
                </span>
                <span className="text-[11px] text-gray-500 font-sans">
                  {sameAircraftOnAllLegs
                    ? "On: leg 1 is copied to every leg."
                    : "Off: each leg has its own operator, aircraft and buying price. On: leg 1 is copied to every leg."}
                </span>
              </div>
            </div>

            {/* Render Legs Cards */}
            <div className="space-y-4">
              {displayLegs.map((legItem, idx) => {
                const legNum = idx + 1;
                const legOriginCode = legItem.origin?.icao || (typeof legItem.origin === "string" ? legItem.origin : "LSGG");
                const legOriginCity = legItem.origin?.city || legItem.origin?.name || "";
                const legDestCode = legItem.destination?.icao || (typeof legItem.destination === "string" ? legItem.destination : "LFMN");
                const legDestCity = legItem.destination?.city || legItem.destination?.name || "";

                const currentLegOp = operators.find((o) => o.id === legItem.operatorId) || selectedOperator || operators[0];
                const isQualified = currentLegOp?.status === "approved";
                const legAircraft = legItem.aircraft || selectedAircraft;
                const legBuyingPrice = legItem.buyingPrice ?? Math.round(operatorFlightCost / (displayLegs.length || 1));

                const legExterior = legItem.exteriorPhoto || (idx === 0 ? customExteriorPhoto : legAircraft.imageExterior);
                const legCabin = legItem.cabinPhoto || (idx === 0 ? customCabinPhoto : legAircraft.imageInterior);

                return (
                  <div key={legItem.id || `leg-${idx}`} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3.5 shadow-2xs">
                    {/* Leg Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-900 font-display">
                          Leg {legNum} · {legOriginCode} {legOriginCity} → {legDestCode} {legDestCity}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-gray-500">
                        {legItem.flightDate} · {legItem.departureTime} LT
                      </span>
                    </div>

                    {/* Row 1: Operator & Buying Price */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                          OPERATOR · INTERNAL, NEVER ON DOCUMENTS
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <select
                              value={legItem.operatorId || selectedOperatorId}
                              onChange={(e) => {
                                const newOpId = e.target.value;
                                if (sameAircraftOnAllLegs) {
                                  setSelectedOperatorId(newOpId);
                                  setMultiLegs((prev) => prev.map((l) => ({ ...l, operatorId: newOpId })));
                                } else {
                                  updateLegField(idx, "operatorId", newOpId);
                                }
                              }}
                              className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-2xs appearance-none pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            >
                              {operators.map((op) => (
                                <option key={op.id} value={op.id}>
                                  {op.tradingName || op.legalName} · AOC {op.aocNumber}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                          {isQualified ? (
                            <span className="inline-flex items-center px-2 py-1 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Qualified
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Documents pending
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                          BUYING PRICE · ALL-INCLUSIVE (EUR)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-gray-400">€</span>
                          <input
                            type="number"
                            min={0}
                            value={legBuyingPrice}
                            onChange={(e) => {
                              const price = parseFloat(e.target.value) || 0;
                              if (sameAircraftOnAllLegs) {
                                setOperatorFlightCost(price * displayLegs.length);
                                setMultiLegs((prev) => prev.map((l) => ({ ...l, buyingPrice: price })));
                              } else {
                                updateLegField(idx, "buyingPrice", price);
                              }
                            }}
                            className="w-full bg-white border border-gray-300 rounded-md pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-gray-900 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Aircraft Specs */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                          AIRCRAFT TYPE
                        </label>
                        <AircraftSearchSelect
                          value={legAircraft.id}
                          onChange={(ac) => {
                            if (sameAircraftOnAllLegs) {
                              setSelectedAircraft(ac);
                              setMultiLegs((prev) => prev.map((l) => ({ ...l, aircraft: ac })));
                            } else {
                              updateLegField(idx, "aircraft", ac);
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                          CATEGORY
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={legAircraft.category || "Super midsize"}
                          className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-700 shadow-2xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                          YEAR OF MAKE
                        </label>
                        <input
                          type="text"
                          value={legItem.yearOfMake || 2018}
                          onChange={(e) => updateLegField(idx, "yearOfMake", e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs font-mono text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                          REFURBISHMENT
                        </label>
                        <input
                          type="text"
                          value={legItem.yearOfRefurbishment || "2023"}
                          onChange={(e) => updateLegField(idx, "yearOfRefurbishment", e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs font-mono text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Row 3: Seats, Smoking, Lavatory */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                          SEATS
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={legItem.seats || legAircraft.passengers || 9}
                          onChange={(e) => updateLegField(idx, "seats", parseInt(e.target.value, 10) || 9)}
                          className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs font-mono font-bold text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                          SMOKING CABIN
                        </label>
                        <div className="inline-flex rounded-md shadow-2xs border border-gray-300 p-0.5 bg-gray-50">
                          <button
                            type="button"
                            onClick={() => updateLegField(idx, "smokingCabin", true)}
                            className={`px-3 py-1 text-xs font-semibold rounded ${legItem.smokingCabin ? "bg-gray-900 text-white" : "text-gray-700 hover:text-gray-900"}`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => updateLegField(idx, "smokingCabin", false)}
                            className={`px-3 py-1 text-xs font-semibold rounded ${!legItem.smokingCabin ? "bg-gray-900 text-white" : "text-gray-700 hover:text-gray-900"}`}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                          LAVATORY ON BOARD
                        </label>
                        <div className="inline-flex rounded-md shadow-2xs border border-gray-300 p-0.5 bg-gray-50">
                          <button
                            type="button"
                            onClick={() => updateLegField(idx, "lavatoryOnBoard", true)}
                            className={`px-3 py-1 text-xs font-semibold rounded ${legItem.lavatoryOnBoard !== false ? "bg-gray-900 text-white" : "text-gray-700 hover:text-gray-900"}`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => updateLegField(idx, "lavatoryOnBoard", false)}
                            className={`px-3 py-1 text-xs font-semibold rounded ${legItem.lavatoryOnBoard === false ? "bg-gray-900 text-white" : "text-gray-700 hover:text-gray-900"}`}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      {legItem.lavatoryOnBoard !== false && (
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                            IF YES
                          </label>
                          <div className="inline-flex rounded-md shadow-2xs border border-gray-300 p-0.5 bg-gray-50">
                            <button
                              type="button"
                              onClick={() => updateLegField(idx, "lavatoryType", "Enclosed")}
                              className={`px-3 py-1 text-xs font-semibold rounded ${(legItem.lavatoryType || "Enclosed") === "Enclosed" ? "bg-gray-900 text-white" : "text-gray-700 hover:text-gray-900"}`}
                            >
                              Enclosed
                            </button>
                            <button
                              type="button"
                              onClick={() => updateLegField(idx, "lavatoryType", "Semi-private")}
                              className={`px-3 py-1 text-xs font-semibold rounded ${legItem.lavatoryType === "Semi-private" ? "bg-gray-900 text-white" : "text-gray-700 hover:text-gray-900"}`}
                            >
                              Semi-private
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Row 4: Photos for this leg (Image 8 design) */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">
                          PHOTOS FOR THIS LEG (ON THE QUOTE PDF)
                        </label>
                        <button
                          type="button"
                          onClick={() => openPhotoPickerForLeg(idx)}
                          className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Change photos for Leg {legNum}</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {/* Exterior */}
                        <div
                          onClick={() => openPhotoPickerForLeg(idx)}
                          className="group relative cursor-pointer border border-dashed border-gray-300 hover:border-gray-900 rounded-lg p-2 flex flex-col items-center justify-center text-center bg-gray-50/50 hover:bg-gray-50 transition-all min-h-[84px] overflow-hidden"
                        >
                          {legExterior ? (
                            <div className="w-full h-full relative">
                              <img src={legExterior} alt="Exterior" className="w-full h-16 object-cover rounded" />
                              <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1 py-0.5 rounded font-mono">Exterior</span>
                            </div>
                          ) : (
                            <>
                              <ImageIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-700 mb-1" />
                              <span className="text-xs font-medium text-gray-700">Exterior</span>
                            </>
                          )}
                        </div>

                        {/* Cabin */}
                        <div
                          onClick={() => openPhotoPickerForLeg(idx)}
                          className="group relative cursor-pointer border border-dashed border-gray-300 hover:border-gray-900 rounded-lg p-2 flex flex-col items-center justify-center text-center bg-gray-50/50 hover:bg-gray-50 transition-all min-h-[84px] overflow-hidden"
                        >
                          {legCabin ? (
                            <div className="w-full h-full relative">
                              <img src={legCabin} alt="Cabin" className="w-full h-16 object-cover rounded" />
                              <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1 py-0.5 rounded font-mono">Cabin</span>
                            </div>
                          ) : (
                            <>
                              <ImageIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-700 mb-1" />
                              <span className="text-xs font-medium text-gray-700">Cabin</span>
                            </>
                          )}
                        </div>

                        {/* Cabin 2 */}
                        <div
                          onClick={() => openPhotoPickerForLeg(idx)}
                          className="group relative cursor-pointer border border-dashed border-gray-300 hover:border-gray-900 rounded-lg p-2 flex flex-col items-center justify-center text-center bg-gray-50/50 hover:bg-gray-50 transition-all min-h-[84px]"
                        >
                          <ImageIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-700 mb-1" />
                          <span className="text-xs font-medium text-gray-700">Cabin 2</span>
                        </div>

                        {/* + Add */}
                        <div
                          onClick={() => openPhotoPickerForLeg(idx)}
                          className="group relative cursor-pointer border border-dashed border-gray-300 hover:border-gray-900 rounded-lg p-2 flex flex-col items-center justify-center text-center bg-gray-50/50 hover:bg-gray-50 transition-all min-h-[84px]"
                        >
                          <Plus className="w-4 h-4 text-gray-400 group-hover:text-gray-700 mb-1" />
                          <span className="text-xs font-medium text-gray-700">+ Add</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-500 font-sans pt-1">
                        <span>Kept in the operator&apos;s file for reuse</span>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => openPhotoPickerForLeg(idx)} className="text-blue-600 hover:underline">
                            Pick from operator file
                          </button>
                          <span>·</span>
                          <button type="button" onClick={() => openPhotoPickerForLeg(idx)} className="text-blue-600 hover:underline">
                            Generic type photos
                          </button>
                        </div>
                      </div>
                    </div>

                    {!isQualified && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-0.5">
                        <div className="font-bold text-amber-900">
                          Operator not in database · saved as new with &ldquo;Documents pending&rdquo;
                        </div>
                        <div className="text-amber-800 text-[11px] leading-relaxed">
                          AOC, authority, base and ops contact are filled in on the new-operator panel (step 04a). The nine-point check shows on the quote, the trip and the Operators list until done.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-[11px] text-gray-500 italic pt-1">
              Passenger fees for this leg are added on the Price step (06).
            </div>
          </div>

          {/* SECTION 5: SERVICES · HELICOPTER TRANSFER (Image 6) */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                  05
                </span>
                <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                  Services · Helicopter transfer
                </h3>
              </div>
            </div>

            {/* Radio / Pill: Add a helicopter transfer? */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-gray-600 uppercase tracking-wider">
                ADD A HELICOPTER TRANSFER?
              </span>
              <div className="inline-flex rounded-md shadow-2xs border border-gray-300 p-0.5 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setHasHeliTransfer(true)}
                  className={`px-3 py-1 text-xs font-semibold rounded ${hasHeliTransfer ? "bg-gray-900 text-white" : "text-gray-700 hover:text-gray-900"}`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setHasHeliTransfer(false)}
                  className={`px-3 py-1 text-xs font-semibold rounded ${!hasHeliTransfer ? "bg-gray-900 text-white" : "text-gray-700 hover:text-gray-900"}`}
                >
                  No
                </button>
              </div>
            </div>

            {hasHeliTransfer && (
              <div className="space-y-4 pt-1">
                {/* Flight legs checkboxes */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider block">
                    FLIGHT LEGS
                  </span>
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    {displayLegs.map((leg, lIdx) => {
                      const legKey = `leg-${lIdx + 1}`;
                      const origCode = leg.origin?.icao || (typeof leg.origin === "string" ? leg.origin : "LSGG");
                      const destCode = leg.destination?.icao || (typeof leg.destination === "string" ? leg.destination : "LFMN");
                      return (
                        <label key={legKey} className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={Boolean(heliLegsEnabled[legKey])}
                            onChange={(e) =>
                              setHeliLegsEnabled((prev) => ({ ...prev, [legKey]: e.target.checked }))
                            }
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                          />
                          <span className="font-semibold text-gray-800">
                            Leg {lIdx + 1} · {origCode} → {destCode}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Leg Helicopter Transfer Cards */}
                {displayLegs.map((leg, lIdx) => {
                  const legKey = `leg-${lIdx + 1}`;
                  if (!heliLegsEnabled[legKey]) return null;

                  const origCode = leg.origin?.icao || (typeof leg.origin === "string" ? leg.origin : "LSGG");
                  const destCode = leg.destination?.icao || (typeof leg.destination === "string" ? leg.destination : "LFMN");
                  const curHeli = heliTransfers[legKey] || {
                    transferType: "arrival",
                    passengers: paxCount || 4,
                    prefType: "Twin-engine, e.g. AW109 or similar",
                    depArrLocation: `${destCode} Airport`,
                    destination: "Battersea Heliport, London",
                    clientPrice: 2400,
                    luggageDetails: "4 cabin bags, 2 suitcases (soft)",
                    specialRequests: "Landing permission at the hotel helipad to be confirmed"
                  };

                  const updateHeliField = (f: string, v: any) => {
                    setHeliTransfers((prev) => ({
                      ...prev,
                      [legKey]: { ...curHeli, [f]: v }
                    }));
                  };

                  return (
                    <div key={legKey} className="border border-gray-200 rounded-xl p-4 bg-white space-y-4 shadow-2xs">
                      <div className="font-bold text-xs text-gray-900 border-b border-gray-100 pb-2">
                        Leg {lIdx + 1} · {origCode} → {destCode}
                      </div>

                      {/* 1 · Transfer type */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-gray-700 block">
                          1 · Transfer type
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { id: "arrival", label: "On arrival (airport → helicopter destination)" },
                            { id: "departure", label: "On departure (helicopter destination → airport)" },
                            { id: "both", label: "Both" }
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => updateHeliField("transferType", t.id)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${curHeli.transferType === t.id ? "bg-gray-900 text-white border-gray-900 shadow-2xs" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 2 · Helicopter details */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-gray-700 block">
                          2 · Helicopter details
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                              PASSENGERS
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={curHeli.passengers}
                              onChange={(e) => updateHeliField("passengers", parseInt(e.target.value, 10) || 1)}
                              className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs font-mono font-bold text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                              PREFERRED HELICOPTER TYPE
                            </label>
                            <select
                              value={curHeli.prefType}
                              onChange={(e) => updateHeliField("prefType", e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            >
                              <option value="Twin-engine, e.g. AW109 or similar">Twin-engine, e.g. AW109 or similar</option>
                              <option value="Single-engine, e.g. Bell 407">Single-engine, e.g. Bell 407</option>
                              <option value="Heavy twin, e.g. Sikorsky S-76">Heavy twin, e.g. Sikorsky S-76</option>
                              <option value="Airbus H145 / EC145">Airbus H145 / EC145</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                              DEPARTURE / ARRIVAL LOCATION
                            </label>
                            <input
                              type="text"
                              value={curHeli.depArrLocation}
                              onChange={(e) => updateHeliField("depArrLocation", e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                              TRANSFER DESTINATION
                            </label>
                            <input
                              type="text"
                              value={curHeli.destination}
                              onChange={(e) => updateHeliField("destination", e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                              CLIENT PRICE
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-gray-400">€</span>
                              <input
                                type="number"
                                min={0}
                                value={curHeli.clientPrice}
                                onChange={(e) => updateHeliField("clientPrice", parseFloat(e.target.value) || 0)}
                                className="w-full bg-white border border-gray-300 rounded-md pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-gray-900 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3 · Additional requirements */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-gray-700 block">
                          3 · Additional requirements
                        </span>
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                            LUGGAGE DETAILS
                          </label>
                          <input
                            type="text"
                            value={curHeli.luggageDetails}
                            onChange={(e) => updateHeliField("luggageDetails", e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                            SPECIAL REQUESTS / INSTRUCTIONS
                          </label>
                          <input
                            type="text"
                            value={curHeli.specialRequests}
                            onChange={(e) => updateHeliField("specialRequests", e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Write-up on the quote preview card (Image 6) */}
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider block">
                    WRITE-UP ON THE QUOTE
                  </span>
                  <div className="text-xs font-mono text-gray-800">
                    {displayLegs.map((leg, lIdx) => {
                      const legKey = `leg-${lIdx + 1}`;
                      if (!heliLegsEnabled[legKey]) return null;
                      const origCode = leg.origin?.icao || "LSGG";
                      const destCode = leg.destination?.icao || "LFMN";
                      const h = heliTransfers[legKey] || {
                        transferType: "arrival",
                        destination: "Battersea Heliport",
                        prefType: "twin-engine (AW109 or similar)",
                        passengers: 4,
                        clientPrice: 2400
                      };
                      return (
                        <div key={legKey}>
                          Leg {lIdx + 1} · helicopter on {h.transferType} · {origCode} → {h.destination || destCode} · {h.prefType} · {h.passengers} pax · € {h.clientPrice.toLocaleString()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: SERVICES · GROUND TRANSPORTATION (Image 7) */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                  05
                </span>
                <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                  Services · Ground transportation
                </h3>
              </div>
            </div>

            {/* Radio / Pill: Add ground transportation? */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-gray-600 uppercase tracking-wider">
                ADD GROUND TRANSPORTATION?
              </span>
              <div className="inline-flex rounded-md shadow-2xs border border-gray-300 p-0.5 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setHasGroundTransport(true)}
                  className={`px-3 py-1 text-xs font-semibold rounded ${hasGroundTransport ? "bg-gray-900 text-white" : "text-gray-700 hover:text-gray-900"}`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setHasGroundTransport(false)}
                  className={`px-3 py-1 text-xs font-semibold rounded ${!hasGroundTransport ? "bg-gray-900 text-white" : "text-gray-700 hover:text-gray-900"}`}
                >
                  No
                </button>
              </div>
            </div>

            {hasGroundTransport && (
              <div className="space-y-4 pt-1">
                {/* Flight legs checkboxes */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider block">
                    FLIGHT LEGS
                  </span>
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    {displayLegs.map((leg, lIdx) => {
                      const legKey = `leg-${lIdx + 1}`;
                      const origCode = leg.origin?.icao || (typeof leg.origin === "string" ? leg.origin : "LSGG");
                      const destCode = leg.destination?.icao || (typeof leg.destination === "string" ? leg.destination : "LFMN");
                      return (
                        <label key={legKey} className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={Boolean(groundLegsEnabled[legKey])}
                            onChange={(e) =>
                              setGroundLegsEnabled((prev) => ({ ...prev, [legKey]: e.target.checked }))
                            }
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                          />
                          <span className="font-semibold text-gray-800">
                            Leg {lIdx + 1} · {origCode} → {destCode}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Ground Transfer Leg Cards */}
                {displayLegs.map((leg, lIdx) => {
                  const legKey = `leg-${lIdx + 1}`;
                  if (!groundLegsEnabled[legKey]) return null;

                  const origCode = leg.origin?.icao || (typeof leg.origin === "string" ? leg.origin : "LSGG");
                  const origCity = leg.origin?.city || leg.origin?.name || "";
                  const destCode = leg.destination?.icao || (typeof leg.destination === "string" ? leg.destination : "LFMN");
                  const destCity = leg.destination?.city || leg.destination?.name || "";

                  const curTransfer = groundTransfers[legKey] || {
                    arrivalRequired: true,
                    arrivalDropoff: lIdx === 0 ? "The Savoy, Strand, London" : "14 Bourdillon Road, Ikoyi, Lagos",
                    arrivalVehicle: lIdx === 0 ? "Luxury" : "SUV",
                    arrivalPrice: lIdx === 0 ? 650 : 180,
                    departureRequired: true,
                    departurePickup: lIdx === 0 ? "14 Bourdillon Road, Ikoyi, Lagos" : "The Savoy, Strand, London",
                    departureVehicle: lIdx === 0 ? "SUV" : "Luxury",
                    departurePrice: lIdx === 0 ? 180 : 650,
                    passengers: paxCount || 5,
                    specialRequests: "Meet at aircraft steps; child seat ×1"
                  };

                  const isCollapsed = Boolean(groundCollapsed[legKey]);
                  const toggleCollapse = () =>
                    setGroundCollapsed((prev) => ({ ...prev, [legKey]: !prev[legKey] }));

                  const updateGroundField = (f: string, v: any) => {
                    setGroundTransfers((prev) => ({
                      ...prev,
                      [legKey]: { ...curTransfer, [f]: v }
                    }));
                  };

                  return (
                    <div key={legKey} className="border border-gray-200 rounded-xl p-4 bg-white space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="font-bold text-xs text-gray-900 font-display">
                          Leg {lIdx + 1} · {origCode} {origCity} → {destCode} {destCity}
                        </span>
                        <button
                          type="button"
                          onClick={toggleCollapse}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          {isCollapsed ? "Expand" : "Collapse"}
                        </button>
                      </div>

                      {!isCollapsed && (
                        <div className="space-y-4">
                          {/* 1 · On arrival */}
                          <div className="space-y-2 border-b border-gray-100 pb-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-gray-800">
                                1 · On arrival at {destCode}
                              </span>
                              <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={curTransfer.arrivalRequired}
                                  onChange={(e) => updateGroundField("arrivalRequired", e.target.checked)}
                                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                                />
                                <span>Required</span>
                              </label>
                            </div>
                            {curTransfer.arrivalRequired && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    DROP-OFF LOCATION
                                  </label>
                                  <input
                                    type="text"
                                    value={curTransfer.arrivalDropoff}
                                    onChange={(e) => updateGroundField("arrivalDropoff", e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    VEHICLE
                                  </label>
                                  <div className="inline-flex rounded-md shadow-2xs border border-gray-300 p-0.5 bg-gray-50">
                                    {(["Sedan", "SUV", "Van", "Luxury"] as const).map((v) => (
                                      <button
                                        key={v}
                                        type="button"
                                        onClick={() => updateGroundField("arrivalVehicle", v)}
                                        className={`px-2.5 py-1 text-xs font-semibold rounded ${curTransfer.arrivalVehicle === v ? "bg-gray-900 text-white" : "text-gray-700 hover:text-gray-900"}`}
                                      >
                                        {v}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    CLIENT PRICE
                                  </label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-gray-400">€</span>
                                    <input
                                      type="number"
                                      min={0}
                                      value={curTransfer.arrivalPrice}
                                      onChange={(e) => updateGroundField("arrivalPrice", parseFloat(e.target.value) || 0)}
                                      className="w-full bg-white border border-gray-300 rounded-md pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-gray-900 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 2 · On departure */}
                          <div className="space-y-2 border-b border-gray-100 pb-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-gray-800">
                                2 · On departure from {origCode}
                              </span>
                              <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={curTransfer.departureRequired}
                                  onChange={(e) => updateGroundField("departureRequired", e.target.checked)}
                                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                                />
                                <span>Required</span>
                              </label>
                            </div>
                            {curTransfer.departureRequired && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    PICK-UP LOCATION
                                  </label>
                                  <input
                                    type="text"
                                    value={curTransfer.departurePickup}
                                    onChange={(e) => updateGroundField("departurePickup", e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    VEHICLE
                                  </label>
                                  <div className="inline-flex rounded-md shadow-2xs border border-gray-300 p-0.5 bg-gray-50">
                                    {(["Sedan", "SUV", "Van", "Luxury"] as const).map((v) => (
                                      <button
                                        key={v}
                                        type="button"
                                        onClick={() => updateGroundField("departureVehicle", v)}
                                        className={`px-2.5 py-1 text-xs font-semibold rounded ${curTransfer.departureVehicle === v ? "bg-gray-900 text-white" : "text-gray-700 hover:text-gray-900"}`}
                                      >
                                        {v}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    CLIENT PRICE
                                  </label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-gray-400">€</span>
                                    <input
                                      type="number"
                                      min={0}
                                      value={curTransfer.departurePrice}
                                      onChange={(e) => updateGroundField("departurePrice", parseFloat(e.target.value) || 0)}
                                      className="w-full bg-white border border-gray-300 rounded-md pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-gray-900 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 3 · Additional requirements */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                                PASSENGERS
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={curTransfer.passengers}
                                onChange={(e) => updateGroundField("passengers", parseInt(e.target.value, 10) || 1)}
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs font-mono font-bold text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                                SPECIAL REQUESTS / INSTRUCTIONS
                              </label>
                              <input
                                type="text"
                                value={curTransfer.specialRequests}
                                onChange={(e) => updateGroundField("specialRequests", e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Write-up on the quote preview card (Image 7) */}
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider block">
                    WRITE-UP ON THE QUOTE (GENERATED FROM THE FORM)
                  </span>
                  <div className="text-xs font-mono text-gray-800 space-y-0.5">
                    {displayLegs.map((leg, lIdx) => {
                      const legKey = `leg-${lIdx + 1}`;
                      if (!groundLegsEnabled[legKey]) return null;
                      const origCode = leg.origin?.icao || "LSGG";
                      const destCode = leg.destination?.icao || "LFMN";
                      const g = groundTransfers[legKey] || {
                        arrivalRequired: true,
                        arrivalDropoff: "The Savoy, London",
                        arrivalVehicle: "Luxury",
                        arrivalPrice: 650,
                        departureRequired: true,
                        departurePickup: "14 Bourdillon Road",
                        departureVehicle: "SUV",
                        departurePrice: 180,
                        passengers: 5
                      };
                      return (
                        <React.Fragment key={legKey}>
                          {g.arrivalRequired && (
                            <div>
                              Leg {lIdx + 1} · on arrival · {destCode} → {g.arrivalDropoff} · {g.arrivalVehicle} · {g.passengers} pax · € {g.arrivalPrice.toLocaleString()}
                            </div>
                          )}
                          {g.departureRequired && (
                            <div>
                              Leg {lIdx + 1} · on departure · {g.departurePickup} → {origCode} · {g.departureVehicle} · {g.passengers} pax · € {g.departurePrice.toLocaleString()}
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ADDITIONAL SERVICES & EXTRAS */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-3.5">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                +
              </span>
              <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                Additional Services · Catering, De-icing & Extras
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-1">
              {/* VIP Catering */}
              <div className={`flex items-center gap-2 p-1.5 px-2 rounded-lg border transition-all ${serviceOptions.catering ? "bg-blue-50/60 border-blue-200 shadow-2xs" : "bg-transparent border-transparent"}`}>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={serviceOptions.catering}
                    onChange={(e) =>
                      setServiceOptions({ ...serviceOptions, catering: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                  <span className={serviceOptions.catering ? "font-bold text-blue-950" : ""}>VIP catering</span>
                </label>
                {serviceOptions.catering && (
                  <div className="flex items-center gap-1 bg-white border border-blue-200 rounded px-1.5 py-0.5 ml-1 shadow-2xs">
                    <span className="text-[11px] font-mono font-bold text-gray-500">€</span>
                    <input
                      type="number"
                      min={0}
                      value={cateringPrice}
                      onChange={(e) => setCateringPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-16 text-xs font-mono font-bold text-gray-900 bg-transparent focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* De-icing */}
              <div className={`flex items-center gap-2 p-1.5 px-2 rounded-lg border transition-all ${serviceOptions.deicing ? "bg-blue-50/60 border-blue-200 shadow-2xs" : "bg-transparent border-transparent"}`}>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={serviceOptions.deicing}
                    onChange={(e) =>
                      setServiceOptions({ ...serviceOptions, deicing: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                  <span className={serviceOptions.deicing ? "font-bold text-blue-950" : ""}>De-icing protection</span>
                </label>
                {serviceOptions.deicing && (
                  <div className="flex items-center gap-1 bg-white border border-blue-200 rounded px-1.5 py-0.5 ml-1 shadow-2xs">
                    <span className="text-[11px] font-mono font-bold text-gray-500">€</span>
                    <input
                      type="number"
                      min={0}
                      value={deicingPrice}
                      onChange={(e) => setDeicingPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-16 text-xs font-mono font-bold text-gray-900 bg-transparent focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Carbon Offset */}
              <div className={`flex items-center gap-2 p-1.5 px-2 rounded-lg border transition-all ${serviceOptions.carbonOffset ? "bg-blue-50/60 border-blue-200 shadow-2xs" : "bg-transparent border-transparent"}`}>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={serviceOptions.carbonOffset}
                    onChange={(e) =>
                      setServiceOptions({ ...serviceOptions, carbonOffset: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                  <span className={serviceOptions.carbonOffset ? "font-bold text-blue-950" : ""}>Carbon offset</span>
                </label>
                {serviceOptions.carbonOffset && (
                  <div className="flex items-center gap-1 bg-white border border-blue-200 rounded px-1.5 py-0.5 ml-1 shadow-2xs">
                    <span className="text-[11px] font-mono font-bold text-gray-500">€</span>
                    <input
                      type="number"
                      min={0}
                      value={carbonOffsetPrice}
                      onChange={(e) => setCarbonOffsetPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-16 text-xs font-mono font-bold text-gray-900 bg-transparent focus:outline-none"
                    />
                  </div>
                )}
              </div>
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
                <span className="font-bold">{currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "}{effectiveOperatorFlightCost.toLocaleString()}.00</span>
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
                    : sourceRequest
                    ? `Complete Quotation and Send to Agent (${versionLabel})`
                    : `Complete Quotation (${versionLabel})`}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    isBookingRevision
                      ? `/trips/${rootId}/revisions`
                      : "/quotes"
                  )
                }
                className="w-full btn-secondary text-xs justify-center"
              >
                                <span>Save Draft (No Version)</span>
              </button>
            </div>

            {/* Reference Context Notes (Matching Images 6, 7, 8, 10) */}
            <div className="space-y-3 pt-3 text-[11px] font-sans border-t border-[var(--line)]">
              {/* Image 8 notes: PER LEG */}
              <div className="p-3 bg-gray-50/70 rounded-lg border border-[var(--line)] space-y-1.5">
                <span className="font-mono text-[10px] uppercase font-bold text-gray-500 block">
                  PER LEG
                </span>
                <p className="text-gray-600 m-0 leading-relaxed text-[11px]">
                  Operator (internal label only)<br />
                  Buying price, all-inclusive<br />
                  Aircraft type and category<br />
                  Year of make, year of refurbishment, seats<br />
                  Smoking cabin yes/no; lavatory yes/no<br />
                  Photos
                </p>
                <div className="pt-1.5 border-t border-gray-200 text-[10px] text-gray-500 space-y-1">
                  <div><strong className="text-gray-700">REGISTRATION & FLIGHT NUMBER:</strong> Added after booking on the trip&apos;s Itinerary tab, per leg; printed on the flight brief.</div>
                  <div><strong className="text-gray-700">STATUS:</strong> MOD-05, MOD-08, NF-08, NF-22</div>
                </div>
              </div>

              {/* Image 6 & 7 notes: SERVICES */}
              <div className="p-3 bg-gray-50/70 rounded-lg border border-[var(--line)] space-y-1.5">
                <span className="font-mono text-[10px] uppercase font-bold text-gray-500 block">
                  SERVICES SUMMARY
                </span>
                <p className="text-gray-600 m-0 leading-relaxed text-[11px]">
                  Each ground and helicopter line has its own client price. Supplier cost is entered on the Services tab after sourcing.
                </p>
                <div className="pt-1.5 border-t border-gray-200 text-[10px] text-gray-500 space-y-1">
                  <div><strong className="text-gray-700">STATUS:</strong> NF-07, NF-09, NF-10, NF-11</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

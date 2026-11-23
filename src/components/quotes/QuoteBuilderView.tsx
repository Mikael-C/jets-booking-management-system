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
  const [hasPets, setHasPets] = useState<boolean>(() => {
    if (sourceRequest?.hasPets !== undefined) return sourceRequest.hasPets;
    if (sourceRequest?.petDetailsText && !sourceRequest.petDetailsText.toLowerCase().includes("none")) return true;
    return false;
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
    if (serviceOptions.limousine) {
      activeServicesList.push({
        id: "limo",
        name: "VIP limousine",
        details: `arrival ${destAirport.city || destAirport.name || destAirport.icao || "destination"} (SUV, ${paxCount} pax)`,
        price: limousinePrice
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
                if (customExteriorPhoto) {
                  setSelectedAircraft((prev) => ({ ...prev, imageExterior: customExteriorPhoto }));
                }
                if (customCabinPhoto) {
                  setSelectedAircraft((prev) => ({ ...prev, imageInterior: customCabinPhoto }));
                }
                const chosen: string[] = [];
                if (customExteriorPhoto) chosen.push("Exterior · operator");
                if (customCabinPhoto) chosen.push("Cabin · operator");
                setSelectedPhotos(chosen.length > 0 ? chosen : ["Exterior · operator", "Cabin · operator"]);
                setIsPhotoPickerOpen(false);
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
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                  04
                </span>
                <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                  Operator Sourcing & Flight Rate
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
                    <span className="text-xs font-bold font-mono uppercase text-amber-950">
                      Add New Operator (Auto-saves to Database)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddOperatorOpen(false)}
                    className="p-1 text-gray-500 hover:text-gray-800 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-amber-900 mb-1">
                      Operator Legal Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VistaJet Limited"
                      value={newOpLegalName}
                      onChange={(e) => setNewOpLegalName(e.target.value)}
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-3 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-amber-900 mb-1">
                      Trading / Brand Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VistaJet"
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
                      placeholder="e.g. MT-03 / AOC-8921"
                      value={newOpAoc}
                      onChange={(e) => setNewOpAoc(e.target.value)}
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-3 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-amber-900 mb-1">
                      Country / Jurisdiction
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Malta / TM-CAD"
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
                      placeholder="e.g. LMML"
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
                      placeholder="ops@vistajet.com"
                      value={newOpEmail}
                      onChange={(e) => setNewOpEmail(e.target.value)}
                      className="w-full bg-white border border-[#E0DAD0] rounded-lg px-3 py-1.5 text-xs text-[#0F1420] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/70">
                  <button
                    type="button"
                    onClick={() => setIsAddOperatorOpen(false)}
                    className="px-3 py-1 text-xs text-gray-600 hover:text-black"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveNewOperator()}
                    disabled={!newOpLegalName.trim()}
                    className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save &amp; Select Operator</span>
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-mono font-bold text-[var(--muted)]">Air Carrier / Operator</label>
                  <button
                    type="button"
                    onClick={() => setIsAddOperatorOpen(true)}
                    className="text-[11px] font-mono text-[var(--accent)] hover:underline flex items-center gap-0.5"
                  >
                    + Add New
                  </button>
                </div>
                <select
                  value={selectedOperatorId}
                  onChange={(e) => {
                    if (e.target.value === "__add_new__") {
                      setIsAddOperatorOpen(true);
                    } else {
                      setSelectedOperatorId(e.target.value);
                    }
                  }}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--ink)]"
                >
                  {operators.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.tradingName || op.legalName} ({op.aocNumber})
                    </option>
                  ))}
                  <option value="__add_new__">+ Add New Operator...</option>
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
                  {isBookingRevision
                    ? "Additional Flight Cost from Operator (EUR Net) — enter €0 if flight schedule is unchanged"
                    : "Direct Flight Cost from Operator (EUR Net)"}
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
                {isBookingRevision && (
                  <p className="mt-1 text-[11px] text-gray-500 font-mono">
                    * Booking revision: previous booked amount is already contracted. Enter additional flight fees if applicable.
                  </p>
                )}
              </div>

              {/* Step 04 Photos Row */}
              <div className="sm:col-span-2 pt-3 border-t border-[var(--line)] flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  {customExteriorPhoto && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Exterior · custom photo
                    </span>
                  )}
                  {customCabinPhoto && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      Cabin · custom photo
                    </span>
                  )}
                  {!customExteriorPhoto && !customCabinPhoto && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                      Operator defaults
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsPhotoPickerOpen(true)}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-xs font-semibold px-3 py-1.5 rounded-md shadow-2xs transition-all text-gray-800 flex items-center gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-gray-600" />
                  <span>Choose photos</span>
                </button>
                <span className="text-xs text-gray-500 font-sans">
                  Upload custom exterior/cabin or use operator defaults
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 5: SERVICES */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-3.5">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                05
              </span>
              <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                Services
              </h3>
            </div>

            {/* Checkboxes Row with Editable Prices */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-1">
              {/* VIP Limousine */}
              <div className={`flex items-center gap-2 p-1.5 px-2 rounded-lg border transition-all ${serviceOptions.limousine ? "bg-blue-50/60 border-blue-200 shadow-2xs" : "bg-transparent border-transparent"}`}>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={serviceOptions.limousine}
                    onChange={(e) =>
                      setServiceOptions({ ...serviceOptions, limousine: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                  <span className={serviceOptions.limousine ? "font-bold text-blue-950" : ""}>VIP limousine</span>
                </label>
                {serviceOptions.limousine && (
                  <div className="flex items-center gap-1 bg-white border border-blue-200 rounded px-1.5 py-0.5 ml-1 shadow-2xs">
                    <span className="text-[11px] font-mono font-bold text-gray-500">€</span>
                    <input
                      type="number"
                      min={0}
                      value={limousinePrice}
                      onChange={(e) => setLimousinePrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-16 text-xs font-mono font-bold text-gray-900 bg-transparent focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Helicopter */}
              <div className={`flex items-center gap-2 p-1.5 px-2 rounded-lg border transition-all ${serviceOptions.helicopter ? "bg-blue-50/60 border-blue-200 shadow-2xs" : "bg-transparent border-transparent"}`}>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={serviceOptions.helicopter}
                    onChange={(e) =>
                      setServiceOptions({ ...serviceOptions, helicopter: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                  <span className={serviceOptions.helicopter ? "font-bold text-blue-950" : ""}>Helicopter</span>
                </label>
                {serviceOptions.helicopter && (
                  <div className="flex items-center gap-1 bg-white border border-blue-200 rounded px-1.5 py-0.5 ml-1 shadow-2xs">
                    <span className="text-[11px] font-mono font-bold text-gray-500">€</span>
                    <input
                      type="number"
                      min={0}
                      value={helicopterPrice}
                      onChange={(e) => setHelicopterPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-16 text-xs font-mono font-bold text-gray-900 bg-transparent focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Catering */}
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
                  <span className={serviceOptions.catering ? "font-bold text-blue-950" : ""}>Catering</span>
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
                      title="€0 = Included / Complimentary"
                    />
                    <span className="text-[10px] text-gray-400 font-mono">
                      {cateringPrice === 0 ? "(incl.)" : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* De-icing protection */}
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

              {/* Carbon offset */}
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

              {/* Custom services */}
              {customServices.map((cs) => (
                <div
                  key={cs.id}
                  className="flex items-center gap-2 p-1.5 px-2 rounded-lg border bg-blue-50/70 border-blue-200 shadow-2xs"
                >
                  <label className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => setCustomServices(customServices.filter((s) => s.id !== cs.id))}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 cursor-pointer accent-blue-600"
                    />
                    <span className="font-bold text-blue-950">{cs.name}</span>
                  </label>
                  <div className="flex items-center gap-1 bg-white border border-blue-200 rounded px-1.5 py-0.5 shadow-2xs">
                    <span className="text-[11px] font-mono font-bold text-gray-500">€</span>
                    <input
                      type="number"
                      min={0}
                      value={cs.price}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        setCustomServices(customServices.map((s) => s.id === cs.id ? { ...s, price: val } : s));
                      }}
                      className="w-16 text-xs font-mono font-bold text-gray-900 bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setIsCustomDialogOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 px-2.5 py-1 rounded-lg shadow-2xs transition-all"
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
          </div>
        </div>
      </div>
    </div>
  );
}

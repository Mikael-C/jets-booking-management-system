"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { estimateLegMinutes, fmtDuration, legTiming, quoteNo as docQuoteNo, agreementNo as docAgreementNo, serviceRows as docServiceRows } from "@/lib/documentData";
import { fbosFor } from "@/components/trip/tripTabUtils";
import { HeaderId } from "@/components/ui/DocId";
import { toast } from "@/components/ui/Toaster";
import { api } from "@/lib/api";
import QuotationDoc from "@/components/documents/QuotationDoc";
import CharterAgreementDoc from "@/components/documents/CharterAgreementDoc";
import { downloadDocumentAsPdf } from "@/lib/pdfExporter";
import { computeTaxes, summarizeTaxes, countryOf, type TaxRule, type TaxableLine } from "@/lib/taxes";
import { useRouter, useSearchParams } from "next/navigation";
import { useAviation } from "@/lib/aviationContext";
import { Booking, FlightLeg, TripType, Aircraft, OperatorRecord, TripServiceItem } from "@/types/aviation";
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
  name: string;
  species: string;
  breed: string;
  weightKg: number;
  travels: string;
  documents: string;
  documentNumber?: string;
  notes: string;
}

const newPetRow = (): PetItem => ({
  id: `pet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: "",
  species: "Dog",
  breed: "",
  weightKg: 8,
  travels: "In cabin, in carrier",
  documents: "EU pet passport",
  documentNumber: "",
  notes: ""
});

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

// ===== Shared bits for the step layout (designs: 01 Client, 04a Operator search, 06 Price) =====
const QB_STEP_LABELS: Record<string, string> = {
  "01": "01 Client",
  "02": "02 Itinerary",
  "03": "03 Passengers",
  "04": "04 Legs, operators and aircraft",
  "04a": "04a Operator search and new operator",
  "05": "05 Services",
  "06": "06 Price"
};

// The seven stages of the builder (design), and the steps each one holds
const QB_STAGES: { n: number; label: string }[] = [
  { n: 1, label: "Client" },
  { n: 2, label: "Legs and times" },
  { n: 3, label: "Aircraft and operators" },
  { n: 4, label: "Passengers and pets" },
  { n: 5, label: "Services" },
  { n: 6, label: "Price" },
  { n: 7, label: "Review and send" }
];

const NEW_OPERATOR_DRAFT_ID = "__new-operator-draft__";

const NEW_OPERATOR_DOCUMENTS = [
  "AOC",
  "Operations specs",
  "Aircraft on AOC",
  "Insurance ≥ €25m",
  "Airworthiness",
  "Crew licences",
  "Safety audit",
  "Sanctions check",
  "Framework agreement"
];

const AOC_AUTHORITIES: { label: string; code: string }[] = [
  { label: "UK CAA · United Kingdom", code: "GB" },
  { label: "NCAA · Nigeria", code: "NG" },
  { label: "Austro Control · Austria", code: "AT" },
  { label: "FOCA · Switzerland", code: "CH" },
  { label: "DGAC · France", code: "FR" },
  { label: "LBA · Germany", code: "DE" },
  { label: "ENAC · Italy", code: "IT" },
  { label: "AESA · Spain", code: "ES" },
  { label: "ANAC · Portugal", code: "PT" },
  { label: "TM-CAD · Malta", code: "MT" },
  { label: "IAA · Ireland", code: "IE" },
  { label: "ILT · Netherlands", code: "NL" },
  { label: "HCAA · Greece", code: "GR" },
  { label: "IoM CAA · Isle of Man", code: "IM" },
  { label: "GCAA · United Arab Emirates", code: "AE" },
  { label: "GACA · Saudi Arabia", code: "SA" },
  { label: "QCAA · Qatar", code: "QA" },
  { label: "GCAA · Ghana", code: "GH" },
  { label: "KCAA · Kenya", code: "KE" },
  { label: "SACAA · South Africa", code: "ZA" },
  { label: "FAA · United States", code: "US" },
  { label: "TCCA · Canada", code: "CA" },
  { label: "Other authority", code: "" }
];

// ICAO location prefix → ISO country code (for the country hint next to an operator)
const ICAO_PREFIX_COUNTRY: Record<string, string> = {
  DN: "NG", LO: "AT", EG: "GB", LS: "CH", LF: "FR", LM: "MT", LE: "ES", LI: "IT", ED: "DE", ET: "DE",
  OM: "AE", EH: "NL", EB: "BE", LP: "PT", LG: "GR", OE: "SA", OT: "QA", LN: "MC", FA: "ZA", HK: "KE",
  DG: "GH", OB: "BH", OK: "KW", EI: "IE", ES: "SE", EN: "NO", EK: "DK", EF: "FI", LK: "CZ", EP: "PL",
  LH: "HU", LT: "TR", LL: "IL", HE: "EG", GM: "MA", DA: "DZ", DT: "TN", EL: "LU", LJ: "SI", LD: "HR",
  LY: "RS", LR: "RO", LB: "BG", UU: "RU", WS: "SG", VH: "HK", RJ: "JP", CY: "CA", EY: "LT", EV: "LV", EE: "EE"
};

const AIRCRAFT_CATEGORY_SHORT: Record<string, string> = {
  turboprop: "Turboprop",
  piston: "Piston",
  "entry-level": "Very light",
  light: "Light jet",
  "super-light": "Super light jet",
  midsize: "Midsize jet",
  "super-midsize": "Super midsize",
  heavy: "Heavy jet",
  large: "Large jet",
  "ultra-long-range": "Ultra long range",
  "vip-airliner": "VIP airliner"
};

const getOperatorCountryCode = (op: OperatorRecord): string => {
  const authority = (op.aocAuthority || "").toLowerCase();
  const byAuthority = AOC_AUTHORITIES.find((a) => {
    if (!a.code) return false;
    const [abbr, country] = a.label.toLowerCase().split(" · ");
    return authority.includes(country) || (abbr.length > 2 && authority.includes(abbr));
  });
  if (byAuthority) return byAuthority.code;
  const icao = (op.baseIcao || "").toUpperCase();
  if (icao.startsWith("K")) return "US";
  return ICAO_PREFIX_COUNTRY[icao.slice(0, 2)] || "—";
};

// Ranks aircraft for a typed model: 0 exact, 1 starts-with, 2 contains, 3 similar name
const rankAircraftForQuery = (aircraft: Aircraft, rawQuery: string): number => {
  const q = rawQuery.trim().toLowerCase().replace(/\s+/g, " ");
  if (!q) return -1;
  const name = aircraft.name.toLowerCase();
  const model = aircraft.manufacturer && name.startsWith(aircraft.manufacturer.toLowerCase())
    ? name.slice(aircraft.manufacturer.length).trim()
    : name.split(" ").slice(1).join(" ");
  if (name === q || model === q) return 0;
  if (name.startsWith(q) || model.startsWith(q)) return 1;
  if (name.includes(q)) return 2;
  const words = q.split(" ").filter((w) => w.length >= 3 && /[a-z]/.test(w));
  if (words.some((w) => name.includes(w))) return 3;
  return -1;
};

function IdMark({ id, large = false }: { id?: string; large?: boolean }) {
  // Same style as every heading: small prefix and version, bold trip code
  return <HeaderId id={id} affix={large ? 0.52 : 0.72} />;
}

function StepNote({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50/80 border border-slate-100 rounded-xl px-4 py-3.5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1.5">{title}</div>
      <div className="text-[13px] text-slate-800 leading-relaxed space-y-1">{children}</div>
    </div>
  );
}

interface QuoteBuilderProps {
  reviseTripId?: string;
  fromRequestId?: string;
  mode?: "quote" | "booking";
}

// The aircraft a Curator asked for: by model name first, then by category
const REQUEST_CATEGORY_TO_FLEET: Record<string, string> = {
  light: "light",
  midsize: "midsize",
  "super-midsize": "super-midsize",
  super_midsize: "super-midsize",
  large: "heavy",
  heavy: "heavy",
  "ultra-long-range": "ultra-long-range",
  ultra_long_range: "ultra-long-range"
};
function matchRequestAircraft(model?: string, category?: string, categoryLabel?: string): Aircraft | undefined {
  const m = String(model || "").toLowerCase().trim();
  if (m) {
    const byName = fleetData.find((a) => a.name.toLowerCase() === m) ||
      fleetData.find((a) => a.name.toLowerCase().includes(m) || m.includes(a.name.toLowerCase()));
    if (byName) return byName;
  }
  const c = String(category || "").toLowerCase().replace(/\s+/g, "-");
  const fleetCat = REQUEST_CATEGORY_TO_FLEET[c] || (categoryLabel ? REQUEST_CATEGORY_TO_FLEET[String(categoryLabel).toLowerCase().replace(/\s+/g, "-")] : undefined) || c;
  const byCat = fleetData.find((a) => String(a.category).toLowerCase() === fleetCat);
  if (byCat && m) return { ...byCat, name: model as string };
  return byCat;
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
    addOperator,
    updateAccount,
    currentUser,
    isBookingsLoading
  } = useAviation();

  // Find source if revising or creating from request
  const sourceTrip = useMemo(() => {
    if (!effectiveReviseId) return undefined;
    const clean = effectiveReviseId.trim().toLowerCase();
    const token = extractFeToken(effectiveReviseId);
    // 1. The exact version asked for (its id or one of its numbers)
    const exact =
      bookings.find((b) => (b.id || "").toLowerCase() === clean) ||
      bookings.find((b) =>
        [b.tripNumber, b.quoteId, b.quoteReference, b.bookingRevisionId].some((x) => String(x || "").toLowerCase() === clean)
      ) ||
      bookings.find(
        (b) => (b.id || "").toLowerCase().replace(/^booking-/i, "").replace(/^trip-/i, "") === clean.replace(/^booking-/i, "").replace(/^trip-/i, "")
      );
    if (exact) return exact;
    // 2. Only the trip code is known: the latest live version of that trip
    if (!token) return undefined;
    const family = bookings.filter((b) => {
      const bToken = extractFeToken(b.tripId || b.tripNumber || b.quoteId || b.quoteReference || b.id);
      return Boolean(bToken) && bToken!.toUpperCase() === token.toUpperCase();
    });
    if (!family.length) return undefined;
    const ranked = [...family].sort(
      (a, b) =>
        Number(Boolean(a.isCancelled)) - Number(Boolean(b.isCancelled)) ||
        Number(Boolean((a as any).isDraft)) - Number(Boolean((b as any).isDraft)) ||
        (b.quoteVersion || 1) - (a.quoteVersion || 1) ||
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    return ranked[0];
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

  // Root ID and next version. Worked out from the trip being revised (or the request) whenever they
  // are known: the bookings list can load after the page, and a revision must keep its trip number.
  const [fallbackRootId] = useState<string>(() => generateTripRootId());
  const rootId = useMemo<string>(() => {
    if (sourceTrip) {
      const token = extractFeToken(sourceTrip.tripId || sourceTrip.tripNumber || sourceTrip.quoteId || sourceTrip.quoteReference || sourceTrip.id);
      if (token) return token;
      const raw = sourceTrip.tripId || sourceTrip.tripNumber || sourceTrip.id;
      return raw.replace(/^booking-/i, "").replace(/^trip-/i, "").replace(/^quo-/i, "").split("-")[0].toUpperCase();
    }
    if (effectiveReviseId) {
      const token = extractFeToken(effectiveReviseId);
      if (token) return token;
    }
    // A Curator request already carries its trip number (TRI-XX000): the quote uses the same code
    const reqTrip = String((sourceRequest as any)?.tripId || (sourceRequest as any)?.quoteGroupId || "");
    if (reqTrip) {
      const token = extractFeToken(reqTrip);
      if (token) return token;
    }
    if (sourceRequest?.createdTripId) {
      const token = extractFeToken(sourceRequest.createdTripId);
      if (token) return token;
      return sourceRequest.createdTripId.replace(/^booking-/i, "").replace(/^trip-/i, "").replace(/^quo-/i, "").split("-")[0].toUpperCase();
    }
    return fallbackRootId;
  }, [sourceTrip, effectiveReviseId, sourceRequest, fallbackRootId]);

  const nextVersionNum = useMemo(() => {
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
    // A new quote on a trip number that already has quotes (e.g. a second quote for the same request) takes the next version
    if (!sourceTrip && existing.length === 0) return 1;
    const maxVer = existing.reduce(
      (max, b) => Math.max(max, b.quoteVersion || 1),
      sourceTrip?.quoteVersion || 1
    );
    return maxVer + 1;
  }, [bookings, rootId, sourceTrip]);

  const versionLabel = isBookingRevision
    ? formatTripVersion(rootId, nextVersionNum)
    : `QUO-${rootId}-${pad3(nextVersionNum)}`;

  const formattedQuoteId = useMemo(() => {
    const qRef = ((sourceRequest as any)?.quoteReference || "").trim();
    if (qRef) {
      return qRef.toLowerCase().startsWith("quo-") ? `quo-${qRef.slice(4)}` : `quo-${qRef}`;
    }
    const clean = versionLabel.replace(/^QUO-/i, "quo-");
    return clean.toLowerCase().startsWith("quo-") ? `quo-${clean.slice(4)}` : clean;
  }, [versionLabel, sourceRequest]);

  // Form State
  // 1. Client
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    if (sourceTrip?.accountNumber) return sourceTrip.accountNumber;
    // Revising: never start on another account; the version's own client is used until it is matched
    if (effectiveReviseId) return "";
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
    if (sourceRequest) return "";
    return accounts[0]?.accountNumber || "";
  });
  const [leadPaxName, setLeadPaxName] = useState<string>(() => {
    return sourceRequest?.clientName || sourceTrip?.client.fullName || "";
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
    if (!acc) return "";
    const primaryPerson = acc.authorizedPersons?.find((p: any) => p.isPrimaryAccountName);
    if (primaryPerson?.fullName) return primaryPerson.fullName;
    if (acc.preferredContactName) return acc.preferredContactName;
    if (acc.authorizedPersons?.[0]?.fullName) return acc.authorizedPersons[0].fullName;
    if (acc.accountType === "individual") return acc.name;
    return acc.name || "";
  };

  const handleSelectAccount = (acc: any) => {
    setSelectedAccountId(acc.accountNumber);
    setIsAccountDropdownOpen(false);
    setAccountSearchQuery("");
    const owner = resolveOwnerNameForAccount(acc);
    if (owner) {
      setLeadPaxName(owner);
    }
    // New account: owner and assistant are picked again from that account's people
    setOwnerPersonId("");
    setPaContactId("");
    setPaName("");
    setPaEmail("");
    setPaPhone("");
    applyAccountDefaults(acc);
  };

  // Step 01 choices saved on the account last time are used as defaults
  const applyAccountDefaults = (acc: any) => {
    const d = acc?.quoteDefaults;
    if (!d) return;
    if (d.authorisedOwnerId) {
      const person = (acc.authorizedPersons || []).find((p: any) => p.id === d.authorisedOwnerId);
      if (person) {
        setOwnerPersonId(person.id);
        if (person.fullName) setLeadPaxName(person.fullName);
      }
    }
    setIsHandledByPa(Boolean(d.isHandledByPa));
    if (d.isHandledByPa && d.assistantContactId) setPaContactId(d.assistantContactId);
    if (d.sendDocsTo) setSendDocsTo(d.sendDocsTo);
    if (d.signsAgreement) setSignsAgreement(d.signsAgreement);
  };

  const filteredAccounts = useMemo(() => {
    const q = accountSearchQuery.toLowerCase().trim();
    if (!q) return accounts;
    return accounts.filter((a) => {
      const matchName = a.name?.toLowerCase().includes(q);
      const matchNum = a.accountNumber?.toLowerCase().includes(q);
      const matchContact = a.preferredContactName?.toLowerCase().includes(q) ||
        a.authorizedPersons?.some((p) => p.fullName.toLowerCase().includes(q));
      const matchPlace =
        a.billingAddress?.toLowerCase().includes(q) || a.country?.toLowerCase().includes(q);
      return matchName || matchNum || matchContact || matchPlace;
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
    if ((sourceRequest as any)?.returnDepartureTime) return parseTimeToLocal((sourceRequest as any).returnDepartureTime, "16:00");
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
  const [sendDocsTo, setSendDocsTo] = useState<"owner" | "assistant" | "both">(() => {
    const saved = (sourceTrip as any)?.sendDocsTo;
    return saved === "owner" || saved === "assistant" || saved === "both" ? saved : "both";
  });
  const [signsAgreement, setSignsAgreement] = useState<"owner" | "assistant">(() => {
    return (sourceTrip as any)?.signsAgreement === "assistant" ? "assistant" : "owner";
  });
  // Authorised Owner is always a person (Contact / authorised person) on the account, never the company
  const [ownerPersonId, setOwnerPersonId] = useState<string>(() => (sourceTrip as any)?.authorisedOwnerId || "");
  // Assistant / representative picked from the account's people ("__manual__" = typed in by hand)
  const [paContactId, setPaContactId] = useState<string>(() => (sourceTrip as any)?.assistantContactId || "");

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
    return sourceRequest ? 0 : 6;
  });
  const [oversizeItems, setOversizeItems] = useState<string>(() => String((sourceRequest as any)?.oversizeItems || (sourceRequest as any)?.luggage?.specialLuggageDescription || ""));
  // Pets come from the trip being revised, then the Curator's request; a new quote starts with none
  const initialPets = useMemo<PetItem[]>(() => {
    const fromTrip: any[] = (sourceTrip as any)?.pets || [];
    if (fromTrip.length > 0) {
      return fromTrip.map((p: any, i: number) => ({
        id: String(p.id || `pet-${i + 1}`),
        name: String(p.name || p.petName || ""),
        species: String(p.species || p.petType || "Dog"),
        breed: String(p.breed || ""),
        weightKg: Number(p.weightKg) || 0,
        travels: String(p.travels || "In cabin, in carrier"),
        documents: String(p.documents || "EU pet passport"),
        documentNumber: String(p.documentNumber || p.passportCertificateNumber || ""),
        notes: String(p.notes || "")
      }));
    }
    const reqPets: any[] = Array.isArray((sourceRequest as any)?.petList) ? (sourceRequest as any).petList : [];
    if (reqPets.length > 0) {
      return reqPets.map((p: any, i: number) => ({
        ...newPetRow(),
        id: `pet-${i + 1}`,
        name: String(p.name || p.petName || ""),
        species: String(p.species || p.petType || "Dog"),
        breed: String(p.breed || ""),
        weightKg: Number(p.weightKg) || 0
      }));
    }
    const summary: any = sourceRequest?.petDetails || sourceRequest?.pets || sourceTrip?.petDetails;
    if (summary?.hasPets || (summary?.petCount || 0) > 0) {
      const count = Math.max(1, Math.min(6, Number(summary.petCount) || 1));
      const each = summary.totalWeightKg ? Math.round((summary.totalWeightKg / count) * 10) / 10 : summary.petWeight || 0;
      return Array.from({ length: count }, (_, i) => ({
        ...newPetRow(),
        id: `pet-${i + 1}`,
        species: String(summary.petType || "Dog"),
        breed: String(summary.breed || ""),
        weightKg: Number(each) || 0,
        notes: i === 0 ? String(summary.notes || "") : ""
      }));
    }
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [hasPets, setHasPets] = useState<boolean>(() => {
    if ((sourceTrip as any)?.pets?.length) return true;
    if (sourceTrip?.petDetails?.hasPets !== undefined) return Boolean(sourceTrip.petDetails.hasPets);
    if (sourceRequest?.hasPets !== undefined) return sourceRequest.hasPets;
    if (sourceRequest?.petDetailsText && !sourceRequest.petDetailsText.toLowerCase().includes("none")) return true;
    return false;
  });
  const [pets, setPets] = useState<PetItem[]>(() => initialPets);
  const updatePet = (petId: string, patch: Partial<PetItem>) =>
    setPets((prev) => prev.map((p) => (p.id === petId ? { ...p, ...patch } : p)));

  // Active Leg Photo Index for Multi-Leg Photo Picker
  const [activeLegForPhotoIndex, setActiveLegForPhotoIndex] = useState<number | null>(null);

  // 5. Services: Helicopter & Ground Transportation full state (Images 6 & 7)
  const [heliTransferType, setHeliTransferType] = useState<"arrival" | "departure" | "both">("arrival");
  const [heliPrefType, setHeliPrefType] = useState<string>("");
  const [heliDepLocation, setHeliDepLocation] = useState<string>("");
  const [heliArrLocation, setHeliArrLocation] = useState<string>("");
  const [heliLuggageNotes, setHeliLuggageNotes] = useState<string>("");

  // Dynamic Ground Transportation State (Image 7)
  const [hasGroundTransport, setHasGroundTransport] = useState<boolean>(false);
  const [groundLegsEnabled, setGroundLegsEnabled] = useState<Record<string, boolean>>({});
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
  }>>({});

  // Dynamic Helicopter Transfer State (Image 6)
  const [hasHeliTransfer, setHasHeliTransfer] = useState<boolean>(false);
  const [heliLegsEnabled, setHeliLegsEnabled] = useState<Record<string, boolean>>({});
  const [heliTransfers, setHeliTransfers] = useState<Record<string, {
    transferType: "arrival" | "departure" | "both";
    passengers: number;
    prefType: string;
    depArrLocation: string;
    destination: string;
    clientPrice: number;
    departurePickup?: string;
    departureAirport?: string;
    departurePrice?: number;
    arrivalAirport?: string;
    arrivalDestination?: string;
    arrivalPrice?: number;
    luggageDetails: string;
    specialRequests: string;
  }>>({});

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

  // Step 04a · operator search and new operator
  const [opSearchQuery, setOpSearchQuery] = useState("");
  const [acSearchQuery, setAcSearchQuery] = useState("");
  const [opTargetLeg, setOpTargetLeg] = useState<number | "all">("all");
  const [newOpEnabled, setNewOpEnabled] = useState(false);
  const [newOpAuthority, setNewOpAuthority] = useState("");
  const [newOpError, setNewOpError] = useState("");

  // Breadcrumb follows the step in view
  const [activeStep, setActiveStep] = useState<string>("01");

  // ===== Seven stages (design): the existing steps grouped, one stage on screen at a time =====
  const [stage, setStage] = useState<number>(1);
  const [stagesSeen, setStagesSeen] = useState<number>(1);
  const stageCls = (n: number) => (stage === n ? "" : "hidden");
  const goToStage = (n: number) => {
    const next = Math.max(1, Math.min(7, n));
    setStage(next);
    setStagesSeen((prev) => Math.max(prev, next));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const [saving, setSaving] = useState(false);

  // Step 7 · what the documents print (saved on the quote, read by the quote and the agreement)
  const savedDocOptions: any = (sourceTrip as any)?.docOptions || {};
  const [docPricePerLeg, setDocPricePerLeg] = useState<boolean | null>(() =>
    typeof savedDocOptions.showPricePerLeg === "boolean" ? savedDocOptions.showPricePerLeg : null
  );
  const [docServicesOneLine, setDocServicesOneLine] = useState<boolean>(() =>
    typeof savedDocOptions.servicesOneLine === "boolean" ? savedDocOptions.servicesOneLine : true
  );
  const [docServicePrices, setDocServicePrices] = useState<boolean>(() =>
    typeof savedDocOptions.showServicePrices === "boolean" ? savedDocOptions.showServicePrices : true
  );
  // Step 7 · where the quote goes
  const [sendToClient, setSendToClient] = useState<boolean>(true);
  const [sendToCurator, setSendToCurator] = useState<boolean>(() => Boolean(reqId || (sourceTrip as any)?.agentEmail));
  const [sendWhatsApp, setSendWhatsApp] = useState<boolean>(false);
  const [previewDoc, setPreviewDoc] = useState<"quote" | "agreement">("quote");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Taxes (R-091): the adviser's table from Settings, per-line changes made on the price step, and their log
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [taxRulesState, setTaxRulesState] = useState<"loading" | "ready" | "error">("loading");
  const [taxOverrides, setTaxOverrides] = useState<Record<string, string[]>>(() => (sourceTrip as any)?.taxOverrides || {});
  const [taxChangeLog, setTaxChangeLog] = useState<{ at: string; by: string; line: string; from: string; to: string }[]>(
    () => (sourceTrip as any)?.taxChangeLog || []
  );
  const [taxChangeKey, setTaxChangeKey] = useState<string | null>(null);
  const loadTaxRules = React.useCallback(() => {
    setTaxRulesState("loading");
    api.taxRules
      .list()
      .then((res: any) => {
        setTaxRules(Array.isArray(res?.data) ? res.data : []);
        setTaxRulesState("ready");
      })
      .catch(() => setTaxRulesState("error"));
  }, []);
  useEffect(() => {
    loadTaxRules();
  }, [loadTaxRules]);
  // C1, C2, C3, C5 versions in force today, frozen on the quote so the agreement and signature record them
  const [legalVersions, setLegalVersions] = useState<Record<string, string>>({});
  useEffect(() => {
    api.library
      .documents()
      .then((res: any) => {
        const out: Record<string, string> = {};
        (res?.data || []).forEach((d: any) => {
          const m = String(d.code || "").match(/^POL-(C\d)$/);
          if (m) out[m[1]] = String(d.version || "");
        });
        setLegalVersions(out);
      })
      .catch(() => undefined);
  }, []);
  // Private key of the signing link of this quote version
  const [signToken] = useState<string>(() => {
    try {
      const a = new Uint8Array(12);
      crypto.getRandomValues(a);
      return Array.from(a, (x) => x.toString(16).padStart(2, "0")).join("");
    } catch {
      return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 14)}`;
    }
  });

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
        catering: Boolean((sourceRequest as any).cateringRequested || sText.includes("catering") || sText.includes("menu")),
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
      limousine: false,
      helicopter: false,
      catering: false,
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

  // 6. Margins, Passenger Fees & Payment (Step 06 - Screen 1 design)
  const [passengerFeesItemised, setPassengerFeesItemised] = useState<boolean>(true);
  // Zero-based indexes of the legs the passenger fee applies to. Follows the number of legs on the trip.
  const [passengerFeeLegs, setPassengerFeeLegs] = useState<number[]>([1]);
  const [passengerFeesDesc, setPassengerFeesDesc] = useState<string>("");
  const [passengerFeesAmount, setPassengerFeesAmount] = useState<number>(45);
  const [passengerFeesCharged, setPassengerFeesCharged] = useState<"pax" | "flat">("pax");
  const [passengerFeesPax, setPassengerFeesPax] = useState<number>(() => paxCount || 5);

  const [companyMarginTierPct, setCompanyMarginTierPct] = useState<number>(8);
  const [companyMarginOverride, setCompanyMarginOverride] = useState<boolean>(false);
  const [companyMarginOverrideAmount, setCompanyMarginOverrideAmount] = useState<number>(3500);

  const [agentMarginTierPct, setAgentMarginTierPct] = useState<number>(() => {
    if (sourceRequest) return Number(sourceRequest.agentMarginPct) || 0;
    return 10;
  });
  const [agentMarginOverride, setAgentMarginOverride] = useState<boolean>(false);
  const [agentMarginOverrideAmount, setAgentMarginOverrideAmount] = useState<number>(5000);

  const [companyMarginText, setCompanyMarginText] = useState("8 % · tier > € 35k");
  const [agentMarginText, setAgentMarginText] = useState(() => {
    if (sourceRequest) {
      return `${Number(sourceRequest.agentMarginPct) || 0} % · set by Curator`;
    }
    return "10 % · set by agent";
  });
  const [currency, setCurrency] = useState<"EUR" | "USD" | "GBP" | "CHF">("EUR");
  // Quotes are valid for 48 hours by default
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date(Date.now() + 48 * 3600 * 1000);
    return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} 18:00 LT`;
  });

  // Everything the Curator keyed into the request fills the builder once, as soon as the request is
  // available (it can load after the page). It is applied one time only, so the desk's own edits are
  // never overwritten by the background refresh of the requests list.
  const appliedRequestRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (!sourceRequest || sourceTrip) return;
    const key = String(sourceRequest.id || (sourceRequest as any).requestNumber || "");
    if (!key || appliedRequestRef.current === key) return;
    appliedRequestRef.current = key;
    const r: any = sourceRequest;
    const pax = Number(r.paxCount) || 1;

    // Client: the account whose email or name matches the Curator's client
    const email = String(r.clientEmail || "").toLowerCase();
    const names = [r.companyName, r.clientName].filter(Boolean).map((x: string) => x.toLowerCase());
    const acc = accounts.find((a: any) => {
      const mails = [a.email, a.preferredContactEmail, ...(a.authorizedPersons || []).map((p: any) => p.email)]
        .filter(Boolean)
        .map((x: string) => x.toLowerCase());
      if (email && mails.includes(email)) return true;
      const n = String(a.name || "").toLowerCase();
      return Boolean(n) && names.some((x) => x === n);
    });
    if (acc) {
      setSelectedAccountId((acc as any).accountNumber || acc.id);
      applyAccountDefaults(acc);
    }
    if (r.clientName) setLeadPaxName(r.clientName);
    if (r.assistantName && r.documentsTo && r.documentsTo !== "owner") {
      setIsHandledByPa(true);
      setPaName(r.assistantName);
      setPaEmail(r.assistantEmail || "");
    }
    if (r.documentsTo === "owner" || r.documentsTo === "assistant" || r.documentsTo === "both") setSendDocsTo(r.documentsTo);

    // Legs, dates, times and the aircraft asked for on each leg
    const reqLegs: any[] = Array.isArray(r.multiLegs) && r.multiLegs.length
      ? r.multiLegs
      : [
          { originIcao: r.originIcao, destIcao: r.destIcao, flightDate: r.flightDate, departureTime: r.departureTime },
          ...(r.returnFlightDate ? [{ originIcao: r.destIcao, destIcao: r.originIcao, flightDate: r.returnFlightDate, departureTime: r.returnDepartureTime }] : [])
        ];
    const legAc: any[] = Array.isArray(r.legAircraft) ? r.legAircraft : [];
    const acFor = (i: number): Aircraft => {
      const a = legAc[i] || legAc[0] || {};
      return matchRequestAircraft(a.model || r.preferredAircraft, a.category || r.aircraftCategory, a.categoryLabel || r.categoryLabel) || selectedAircraft;
    };
    const tt: TripType = r.tripType === "one_way" || r.tripType === "round_trip" || r.tripType === "multi_leg"
      ? r.tripType
      : reqLegs.length > 2 ? "multi_leg" : reqLegs.length === 2 ? "round_trip" : "one_way";
    setTripType(tt);
    const first = reqLegs[0] || {};
    const o = findAirportByCode(first.originIcao || r.originIcao || "");
    const d = findAirportByCode(first.destIcao || r.destIcao || "");
    if (o) setOriginAirport(o);
    if (d) setDestAirport(d);
    if (first.flightDate) setFlightDate(parseDateToIso(first.flightDate, first.flightDate));
    if (first.departureTime) setDepartureTime(parseTimeToLocal(first.departureTime, "08:30"));
    const second = reqLegs[1];
    if (second?.flightDate) setReturnFlightDate(parseDateToIso(second.flightDate, second.flightDate));
    if (second?.departureTime) setReturnDepartureTime(parseTimeToLocal(second.departureTime, "16:00"));
    setMultiLegs(
      reqLegs.map((l, i) => ({
        id: `leg-${i + 1}`,
        origin: findAirportByCode(l.originIcao || "") || (i === 0 ? o : undefined) || airportsData[0],
        destination: findAirportByCode(l.destIcao || "") || airportsData[1],
        flightDate: l.flightDate ? parseDateToIso(l.flightDate, l.flightDate) : "",
        departureTime: l.departureTime ? parseTimeToLocal(l.departureTime, "10:00") : "10:00",
        aircraft: acFor(i)
      }))
    );
    const perLeg = r.aircraftMode === "per_leg" && legAc.some((a, i) => i > 0 && (a.model !== legAc[0]?.model || a.category !== legAc[0]?.category));
    setSameAircraftOnAllLegs(!perLeg);
    setSelectedAircraft(acFor(0));

    // Passengers, luggage and pets
    setPaxCount(pax);
    setPassengerFeesPax(pax);
    setLuggagePieces(Number(r.luggageCount ?? r.luggage?.pieceCount) || 0);
    setOversizeItems(String(r.oversizeItems || r.luggage?.specialLuggageDescription || ""));
    const reqPets: any[] = Array.isArray(r.petList) && r.petList.length ? r.petList : Array.isArray(r.pets) ? r.pets : [];
    const withPets = Boolean(r.hasPets) && reqPets.length > 0;
    setHasPets(withPets);
    setPets(
      withPets
        ? reqPets.map((p, i) => ({
            ...newPetRow(),
            id: `pet-${i + 1}`,
            name: String(p.name || p.petName || ""),
            species: String(p.species || p.petType || "Dog"),
            breed: String(p.breed || ""),
            weightKg: Number(p.weightKg) || 0,
            ...(p.travels ? { travels: String(p.travels) } : {})
          }))
        : []
    );

    // Ground transport per leg, as the Curator described it (prices are set by the desk)
    const vehicle = (v: any): "Sedan" | "SUV" | "Van" | "Luxury" => {
      const x = String(v || "").toLowerCase();
      if (x.includes("suv")) return "SUV";
      if (x.includes("van") || x.includes("minibus") || x.includes("sprinter")) return "Van";
      if (x.includes("lux") || x.includes("limo") || x.includes("s-class") || x.includes("rolls")) return "Luxury";
      return "Sedan";
    };
    const gLegs: any[] = (r.groundTransportation?.perLeg || []).filter((g: any) => g && g.selected !== false);
    if (r.groundTransportation?.enabled && gLegs.length) {
      const enabled: Record<string, boolean> = {};
      const transfers: Record<string, any> = {};
      gLegs.forEach((g) => {
        const k = `leg-${Number(g.leg) || 1}`;
        enabled[k] = true;
        transfers[k] = {
          arrivalRequired: Boolean(g.arrival?.enabled),
          arrivalDropoff: String(g.arrival?.location || ""),
          arrivalVehicle: vehicle(g.arrival?.vehicle),
          arrivalPrice: 0,
          departureRequired: Boolean(g.departure?.enabled),
          departurePickup: String(g.departure?.location || ""),
          departureVehicle: vehicle(g.departure?.vehicle),
          departurePrice: 0,
          passengers: Number(g.passengers) || pax,
          specialRequests: String(g.special || "")
        };
      });
      setHasGroundTransport(true);
      setGroundLegsEnabled(enabled);
      setGroundTransfers(transfers);
    } else {
      setHasGroundTransport(false);
      setGroundLegsEnabled({});
      setGroundTransfers({});
    }

    // Helicopter transfers per leg
    const hLegs: any[] = (r.helicopterTransfer?.perLeg || []).filter((h: any) => h && h.selected !== false);
    if (r.helicopterTransfer?.enabled && hLegs.length) {
      const enabled: Record<string, boolean> = {};
      const transfers: Record<string, any> = {};
      hLegs.forEach((h) => {
        const n = Number(h.leg) || 1;
        const k = `leg-${n}`;
        const legDest = reqLegs[n - 1]?.destIcao || "";
        enabled[k] = true;
        transfers[k] = {
          transferType: "arrival",
          passengers: Number(h.passengers) || pax,
          prefType: String(h.type || ""),
          depArrLocation: String(h.from || legDest),
          destination: String(h.to || ""),
          arrivalAirport: String(h.from || legDest),
          arrivalDestination: String(h.to || ""),
          arrivalPrice: 0,
          clientPrice: 0,
          luggageDetails: String(h.luggage || ""),
          specialRequests: ""
        };
      });
      setHasHeliTransfer(true);
      setHeliLegsEnabled(enabled);
      setHeliTransfers(transfers);
    } else {
      setHasHeliTransfer(false);
      setHeliLegsEnabled({});
      setHeliTransfers({});
    }

    // Other services
    setServiceOptions((prev) => ({
      ...prev,
      limousine: Boolean(r.groundTransportation?.enabled && gLegs.length),
      helicopter: Boolean(r.helicopterTransfer?.enabled && hLegs.length),
      catering: Boolean(r.cateringRequested),
      deicing: r.deicingInsurance === "at_reservation" || r.deicingInsurance === "within_48h",
      carbonOffset: Boolean(r.carbonOffset && r.carbonOffset !== "none")
    }));
    if (r.meetAndAssist) {
      setCustomServices((prev) =>
        prev.some((c) => c.id === "svc-meet-assist")
          ? prev
          : [...prev, { id: "svc-meet-assist", name: "Meet & assist at terminal", details: "Requested by the Curator", price: 0 }]
      );
    }

    // Passenger fee line starts on the second leg's departure (or the only leg)
    const feeLeg = reqLegs[1] || reqLegs[0];
    const feeApt: any = feeLeg ? findAirportByCode(feeLeg.originIcao || "") : null;
    if (feeApt) setPassengerFeesDesc(`${feeApt.city || feeApt.name} (${feeApt.icao}) departure passenger charge`);
    setPassengerFeeLegs([reqLegs.length > 1 ? 1 : 0]);

    // The Curator's margin
    const m = Number(r.agentMarginPct) || 0;
    setAgentMarginTierPct(m);
    setAgentMarginText(`${m} % · set by Curator`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceRequest, sourceTrip, accounts]);

  // Revising: the builder opens with everything the version being revised already holds (client,
  // legs, aircraft, operators, buying prices, services and prices, fees, margins, currency, validity,
  // print and send choices, taxes). Nothing changes unless the desk changes it. Applied once per
  // version, also when the bookings list loads after the page.
  const appliedTripRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (!sourceTrip) return;
    const key = String(sourceTrip.id || "");
    if (!key || appliedTripRef.current === key) return;
    appliedTripRef.current = key;
    const t: any = sourceTrip;
    const s: any = t.builderState && typeof t.builderState === "object" ? t.builderState : null;
    const savedLegs: any[] = Array.isArray(t.legs) ? t.legs.filter((l: any) => l && !l.isCancelled) : [];
    const legPricing: any[] = Array.isArray(t.legPricing) ? t.legPricing : [];
    const legOps: any[] = Array.isArray(t.legOperators) ? t.legOperators : [];
    const has = (k: string) => s && Object.prototype.hasOwnProperty.call(s, k);
    // Photos are stored once on the version; the saved builder state only marks where they go
    const legPhoto = (i: number, which: "exteriorPhoto" | "cabinPhoto", v: any) =>
      v === "__saved__" ? savedLegs[i]?.aircraftSpec?.[which] || "" : v;

    // Client and people: the version's own account (matched by number, else by the client's email or name)
    {
      const cl = t.client || {};
      const mail = String(cl.email || "").toLowerCase();
      const names = [cl.companyName, cl.fullName].filter(Boolean).map((x: string) => String(x).toLowerCase());
      const match =
        accounts.find((a: any) => t.accountNumber && (a.accountNumber === t.accountNumber || a.id === t.accountNumber)) ||
        accounts.find((a: any) => {
          const mails = [a.email, a.preferredContactEmail, ...(a.authorizedPersons || []).map((p: any) => p.email)]
            .filter(Boolean)
            .map((x: string) => String(x).toLowerCase());
          return Boolean(mail) && mails.includes(mail);
        }) ||
        accounts.find((a: any) => names.includes(String(a.name || "").toLowerCase()));
      setSelectedAccountId(match ? (match as any).accountNumber || match.id : t.accountNumber || "");
    }
    const owner = has("leadPaxName") ? s.leadPaxName : t.authorisedOwnerName || t.client?.fullName;
    if (owner) setLeadPaxName(owner);
    const pa = Boolean(t.isHandledByPa || t.client?.isHandledByPa);
    setIsHandledByPa(pa);
    setPaName(t.paName || t.client?.paName || "");
    setPaEmail(t.paEmail || t.client?.paEmail || "");
    setPaPhone(t.paPhone || t.client?.paPhone || "");
    if (t.authorisedOwnerId) setOwnerPersonId(t.authorisedOwnerId);
    setPaContactId(pa ? t.assistantContactId || (has("paContactId") ? s.paContactId : "") || "" : "");
    if (t.sendDocsTo === "owner" || t.sendDocsTo === "assistant" || t.sendDocsTo === "both") setSendDocsTo(t.sendDocsTo);
    if (t.signsAgreement === "owner" || t.signsAgreement === "assistant") setSignsAgreement(t.signsAgreement);

    // Itinerary
    const tt: TripType =
      t.tripType === "one_way" || t.tripType === "round_trip" || t.tripType === "multi_leg"
        ? t.tripType
        : savedLegs.length > 2
          ? "multi_leg"
          : savedLegs.length === 2
            ? "round_trip"
            : "one_way";
    setTripType(tt);
    const l0 = savedLegs[0];
    const l1 = savedLegs[1];
    if (l0?.origin) setOriginAirport(l0.origin);
    if (l0?.destination) setDestAirport(l0.destination);
    if (l0?.flightDate) setFlightDate(l0.flightDate);
    if (l0?.departureTimeLocal) setDepartureTime(l0.departureTimeLocal);
    if (l1?.flightDate) setReturnFlightDate(l1.flightDate);
    if (l1?.departureTimeLocal) setReturnDepartureTime(l1.departureTimeLocal);

    // Aircraft, operator and buying price per leg
    const tripAircraft: Aircraft = (has("selectedAircraft") && s.selectedAircraft) || t.aircraft || selectedAircraft;
    const aircraftFor = (leg: any): Aircraft => {
      const name = String(leg?.aircraftSpec?.name || leg?.aircraftType || "").toLowerCase();
      if (!name || name === String(tripAircraft?.name || "").toLowerCase()) return tripAircraft;
      return fleetData.find((a) => a.name.toLowerCase() === name) || { ...tripAircraft, name: leg.aircraftSpec?.name || leg.aircraftType };
    };
    if (has("multiLegs") && Array.isArray(s.multiLegs) && s.multiLegs.length) {
      setMultiLegs(
        s.multiLegs.map((m: any, i: number) => ({
          ...m,
          exteriorPhoto: legPhoto(i, "exteriorPhoto", m.exteriorPhoto),
          cabinPhoto: legPhoto(i, "cabinPhoto", m.cabinPhoto)
        }))
      );
    } else if (savedLegs.length) {
      setMultiLegs(
        savedLegs.map((leg: any, i: number) => {
          const spec = leg.aircraftSpec || {};
          const buying = Number(leg.buyingPrice ?? legOps[i]?.buyingPrice ?? legPricing[i]?.buyingPrice) || undefined;
          return {
            id: `leg-${i + 1}`,
            origin: leg.origin || airportsData[0],
            destination: leg.destination || airportsData[1],
            flightDate: leg.flightDate || "",
            departureTime: leg.departureTimeLocal || "10:00",
            aircraft: aircraftFor(leg),
            operatorId: legOps[i]?.operatorId || undefined,
            buyingPrice: buying,
            exteriorPhoto: spec.exteriorPhoto || undefined,
            cabinPhoto: spec.cabinPhoto || undefined,
            ...(spec.yearOfMake !== undefined ? { yearOfMake: spec.yearOfMake } : {}),
            ...(spec.yearOfRefurbishment !== undefined ? { yearOfRefurbishment: spec.yearOfRefurbishment } : {}),
            ...(spec.seats !== undefined ? { seats: spec.seats } : {}),
            ...(spec.smokingCabin !== undefined ? { smokingCabin: spec.smokingCabin } : {}),
            ...(spec.lavatoryOnBoard !== undefined ? { lavatoryOnBoard: spec.lavatoryOnBoard } : {}),
            ...(spec.lavatoryType ? { lavatoryType: spec.lavatoryType } : {})
          } as MultiLegItem;
        })
      );
    }
    if (has("sameAircraftOnAllLegs")) setSameAircraftOnAllLegs(Boolean(s.sameAircraftOnAllLegs));
    else {
      const names = savedLegs.map((l: any) => String(l.aircraftSpec?.name || l.aircraftType || "").toLowerCase()).filter(Boolean);
      setSameAircraftOnAllLegs(names.length < 2 || names.every((n: string) => n === names[0]));
    }
    setSelectedAircraft(tripAircraft);
    const opId = (has("selectedOperatorId") && s.selectedOperatorId) || legOps[0]?.operatorId;
    if (opId && operators.some((o) => o.id === opId)) setSelectedOperatorId(opId);
    const cost = has("operatorFlightCost")
      ? Number(s.operatorFlightCost) || 0
      : Number(t.pricing?.operatorCost ?? t.pricing?.flightPrice) || 0;
    setOperatorFlightCost(cost);
    const ext = t.aircraftCustomImages?.exterior || t.aircraft?.imageExterior;
    const cab = t.aircraftCustomImages?.interior || t.aircraft?.imageInterior;
    if (ext) setCustomExteriorPhoto(ext);
    if (cab) setCustomCabinPhoto(cab);
    const views: string[] = Array.isArray(t.aircraftCustomImages?.cabinViews) ? t.aircraftCustomImages.cabinViews.filter(Boolean) : [];
    if (views.length) {
      setUploadedPhotos(
        views.map((url, i) => ({ id: `photo-saved-${i + 1}`, url, name: `Photo ${i + 1}`, isOperator: true, timestamp: Date.now() - i }))
      );
    }

    // Passengers, luggage and pets
    const pax = Number(l0?.paxCount) || Number(t.passengerCount) || 0;
    if (pax) setPaxCount(pax);
    if (has("luggagePieces")) setLuggagePieces(Number(s.luggagePieces) || 0);
    if (has("oversizeItems")) setOversizeItems(String(s.oversizeItems || ""));
    const savedPets: any[] = Array.isArray(t.pets) ? t.pets : [];
    setHasPets(savedPets.length > 0 || Boolean(t.petDetails?.hasPets));
    if (savedPets.length) {
      setPets(
        savedPets.map((p: any, i: number) => ({
          ...newPetRow(),
          id: String(p.id || `pet-${i + 1}`),
          name: String(p.name || ""),
          species: String(p.species || "Dog"),
          breed: String(p.breed || ""),
          weightKg: Number(p.weightKg) || 0,
          travels: String(p.travels || "In cabin, in carrier"),
          documents: String(p.documents || "EU pet passport"),
          documentNumber: String(p.documentNumber || ""),
          notes: String(p.notes || "")
        }))
      );
    }

    // Services and their prices
    if (s && has("serviceOptions")) {
      setServiceOptions({ ...s.serviceOptions });
      setHasGroundTransport(Boolean(s.hasGroundTransport));
      setGroundLegsEnabled({ ...(s.groundLegsEnabled || {}) });
      setGroundTransfers({ ...(s.groundTransfers || {}) });
      setHasHeliTransfer(Boolean(s.hasHeliTransfer));
      setHeliLegsEnabled({ ...(s.heliLegsEnabled || {}) });
      setHeliTransfers({ ...(s.heliTransfers || {}) });
      setCustomServices(Array.isArray(s.customServices) ? s.customServices : []);
      if (has("limousinePrice")) setLimousinePrice(Number(s.limousinePrice) || 0);
      if (has("helicopterPrice")) setHelicopterPrice(Number(s.helicopterPrice) || 0);
      if (has("cateringPrice")) setCateringPrice(Number(s.cateringPrice) || 0);
      if (has("deicingPrice")) setDeicingPrice(Number(s.deicingPrice) || 0);
      if (has("carbonOffsetPrice")) setCarbonOffsetPrice(Number(s.carbonOffsetPrice) || 0);
    } else {
      const quoted: any[] = (Array.isArray(t.tripServices) ? t.tripServices : []).filter((x: any) => x && x.source !== "added");
      const opts = { limousine: false, helicopter: false, catering: false, deicing: false, carbonOffset: false };
      const gEnabled: Record<string, boolean> = {};
      const gTransfers: Record<string, any> = {};
      const hEnabled: Record<string, boolean> = {};
      const hTransfers: Record<string, any> = {};
      const custom: CustomService[] = [];
      quoted.forEach((x: any) => {
        const id = String(x.id || "");
        const price = Number(x.clientPrice) || 0;
        const g = id.match(/^q-ground-(arr|dep)-(leg-\d+)$/);
        const h = id.match(/^q-heli-(leg-\d+)$/);
        if (g) {
          const k = g[2];
          gEnabled[k] = true;
          const cur = gTransfers[k] || {
            arrivalRequired: false,
            arrivalDropoff: "",
            arrivalVehicle: "Sedan",
            arrivalPrice: 0,
            departureRequired: false,
            departurePickup: "",
            departureVehicle: "Sedan",
            departurePrice: 0,
            passengers: Number(x.passengers) || pax || 1,
            specialRequests: String(x.instructions || "")
          };
          if (g[1] === "arr") Object.assign(cur, { arrivalRequired: true, arrivalDropoff: String(x.location || ""), arrivalVehicle: x.vehicle || "Sedan", arrivalPrice: price });
          else Object.assign(cur, { departureRequired: true, departurePickup: String(x.location || ""), departureVehicle: x.vehicle || "Sedan", departurePrice: price });
          gTransfers[k] = cur;
        } else if (h) {
          const k = h[1];
          const dep = x.timing === "departure";
          hEnabled[k] = true;
          hTransfers[k] = {
            transferType: x.timing === "departure" || x.timing === "both" ? x.timing : "arrival",
            passengers: Number(x.passengers) || pax || 1,
            prefType: String(x.helicopterType || ""),
            depArrLocation: dep ? "" : String(x.from || ""),
            destination: dep ? "" : String(x.to || ""),
            arrivalAirport: dep ? undefined : String(x.from || ""),
            arrivalDestination: dep ? undefined : String(x.to || ""),
            arrivalPrice: dep ? undefined : price,
            departurePickup: dep ? String(x.from || "") : undefined,
            departureAirport: dep ? String(x.to || "") : undefined,
            departurePrice: dep ? price : undefined,
            clientPrice: price,
            luggageDetails: String(x.luggage || ""),
            specialRequests: String(x.instructions || "")
          };
        } else if (id === "q-limo") {
          opts.limousine = true;
          setLimousinePrice(price);
        } else if (id === "q-heli") {
          opts.helicopter = true;
          setHelicopterPrice(price);
        } else if (id === "q-catering") {
          opts.catering = true;
          setCateringPrice(price);
        } else if (id === "q-deicing") {
          opts.deicing = true;
          setDeicingPrice(price);
        } else if (id === "q-carbon") {
          opts.carbonOffset = true;
          setCarbonOffsetPrice(price);
        } else if (id.startsWith("q-")) {
          custom.push({ id: id.slice(2), name: String(x.title || "Service"), details: String(x.instructions || ""), price });
        }
      });
      if (!quoted.length) {
        // Older versions without service cards: the switches saved on the version
        opts.limousine = Boolean(t.services?.limousineService);
        opts.helicopter = Boolean(t.services?.helicopterService);
        opts.catering = Boolean(t.services?.vipCateringDetails);
        opts.deicing = Boolean(t.services?.deicingInsurance && t.services.deicingInsurance !== "none");
        opts.carbonOffset = Boolean(t.services?.carbonOffset && t.services.carbonOffset !== "none");
        if (opts.deicing && t.services?.deicingCostPerLeg) setDeicingPrice(Number(t.services.deicingCostPerLeg) || 0);
        if (opts.carbonOffset && t.services?.carbonOffsetRatePerHour) setCarbonOffsetPrice(Number(t.services.carbonOffsetRatePerHour) || 0);
      }
      const anyGround = Object.keys(gEnabled).length > 0;
      const anyHeli = Object.keys(hEnabled).length > 0;
      setHasGroundTransport(anyGround);
      setGroundLegsEnabled(gEnabled);
      setGroundTransfers(gTransfers);
      setHasHeliTransfer(anyHeli);
      setHeliLegsEnabled(hEnabled);
      setHeliTransfers(hTransfers);
      setServiceOptions({ ...opts, limousine: opts.limousine || anyGround, helicopter: opts.helicopter || anyHeli });
      setCustomServices(custom);
    }

    // Passenger fees
    if (s && has("passengerFeesItemised")) {
      setPassengerFeesItemised(Boolean(s.passengerFeesItemised));
      setPassengerFeeLegs(Array.isArray(s.passengerFeeLegs) ? s.passengerFeeLegs : [0]);
      setPassengerFeesDesc(String(s.passengerFeesDesc || ""));
      setPassengerFeesAmount(Number(s.passengerFeesAmount) || 0);
      setPassengerFeesCharged(s.passengerFeesCharged === "flat" ? "flat" : "pax");
      setPassengerFeesPax(Number(s.passengerFeesPax) || pax || 1);
    } else {
      const fee: any = Array.isArray(t.passengerFeeItems) ? t.passengerFeeItems[0] : null;
      if (fee) {
        setPassengerFeesItemised(true);
        setPassengerFeesDesc(String(fee.description || ""));
        setPassengerFeesAmount(Number(fee.amount) || 0);
        setPassengerFeesCharged(fee.charged === "flat" ? "flat" : "pax");
        setPassengerFeesPax(Number(fee.pax) || pax || 1);
        const legsList = (Array.isArray(fee.legs) ? fee.legs : []).map((n: any) => Number(n) - 1).filter((n: number) => n >= 0);
        if (legsList.length) setPassengerFeeLegs(legsList);
      } else if (t.pricing && !Number(t.pricing.passengerFees)) {
        setPassengerFeesItemised(false);
      }
    }

    // Margins: the same amounts as the version being revised
    if (s && has("companyMarginTierPct")) {
      setCompanyMarginTierPct(Number(s.companyMarginTierPct) || 0);
      setCompanyMarginOverride(Boolean(s.companyMarginOverride));
      setCompanyMarginOverrideAmount(Number(s.companyMarginOverrideAmount) || 0);
      setCompanyMarginText(String(s.companyMarginText ?? ""));
      setAgentMarginTierPct(Number(s.agentMarginTierPct) || 0);
      setAgentMarginOverride(Boolean(s.agentMarginOverride));
      setAgentMarginOverrideAmount(Number(s.agentMarginOverrideAmount) || 0);
      setAgentMarginText(String(s.agentMarginText ?? ""));
    } else if (t.pricing) {
      const cm = Number(t.pricing.companyMargin) || 0;
      const am = Number(t.pricing.agentCommission) || 0;
      const cPct = Number(t.adminMarginValue) || 0;
      const aPct = Number(t.commissionPercentage) || 0;
      setCompanyMarginTierPct(cPct);
      setCompanyMarginText(`${cPct} %`);
      setCompanyMarginOverride(true);
      setCompanyMarginOverrideAmount(cm);
      setAgentMarginTierPct(aPct);
      setAgentMarginText(`${aPct} %`);
      setAgentMarginOverride(true);
      setAgentMarginOverrideAmount(am);
    }

    // Currency, validity, print and send choices, taxes
    const cur = t.pricing?.currency;
    if (cur === "EUR" || cur === "USD" || cur === "GBP" || cur === "CHF") setCurrency(cur);
    if (t.quoteExpirationDate) setValidUntil(String(t.quoteExpirationDate));
    const d = t.docOptions || {};
    if (typeof d.showPricePerLeg === "boolean") setDocPricePerLeg(d.showPricePerLeg);
    if (typeof d.servicesOneLine === "boolean") setDocServicesOneLine(d.servicesOneLine);
    if (typeof d.showServicePrices === "boolean") setDocServicePrices(d.showServicePrices);
    if (t.sendTo && typeof t.sendTo === "object") {
      setSendToClient(t.sendTo.client !== false);
      setSendToCurator(Boolean(t.sendTo.curator) || Boolean(t.agentEmail));
      setSendWhatsApp(Boolean(t.sendTo.whatsapp));
    } else if (t.agentEmail) {
      setSendToCurator(true);
    }
    if (t.taxOverrides && typeof t.taxOverrides === "object") setTaxOverrides(t.taxOverrides);
    if (Array.isArray(t.taxChangeLog)) setTaxChangeLog(t.taxChangeLog);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceTrip]);

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
          buyingPrice: multiLegs[0]?.buyingPrice ?? (operatorFlightCost > 0 ? Math.round(operatorFlightCost * 26400 / 49280) : 26400),
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
          operatorId: multiLegs[1]?.operatorId || "op-2",
          buyingPrice: multiLegs[1]?.buyingPrice ?? (operatorFlightCost > 0 ? Math.round(operatorFlightCost * 22880 / 49280) : 22880),
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
          buyingPrice: operatorFlightCost || 26400,
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

  // Same aircraft on every leg → printed once, and one charter line by default
  const allLegsSameAircraft = useMemo(() => {
    const names = displayLegs.map((l: any) => String(l.aircraft?.name || "").toLowerCase());
    return names.length < 2 || names.every((n) => n === names[0]);
  }, [displayLegs]);
  const docOptionsValue = {
    showPricePerLeg: docPricePerLeg === null ? !allLegsSameAircraft : docPricePerLeg,
    servicesOneLine: docServicesOneLine,
    showServicePrices: docServicePrices
  };

  // Effective operator cost across legs (from Step 04 buying prices)
  const effectiveOperatorFlightCost = useMemo(() => {
    if (displayLegs.length > 0) {
      const sum = displayLegs.reduce((acc, leg) => acc + (leg.buyingPrice || 0), 0);
      return sum > 0 ? sum : operatorFlightCost;
    }
    return operatorFlightCost;
  }, [displayLegs, operatorFlightCost]);

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

  // Passenger fees line at cost (Step 06 - Screen 1 design)
  // Keep the selected fee legs valid when legs are added or removed (one-way, round trip, multi-leg)
  useEffect(() => {
    const legCount = displayLegs.length;
    setPassengerFeeLegs((prev) => {
      const kept = prev.filter((i) => i >= 0 && i < legCount);
      if (kept.length > 0 && kept.length === prev.length) return prev;
      if (kept.length > 0) return kept;
      return [Math.max(0, legCount - 1)];
    });
  }, [displayLegs.length]);

  const passengerFeePerLeg = useMemo(() => {
    if (!passengerFeesItemised) return 0;
    return passengerFeesCharged === "pax"
      ? passengerFeesAmount * (passengerFeesPax || paxCount || 1)
      : passengerFeesAmount;
  }, [passengerFeesItemised, passengerFeesCharged, passengerFeesAmount, passengerFeesPax, paxCount]);

  const passengerFeeLegsSorted = useMemo(
    () => [...passengerFeeLegs].filter((i) => i < displayLegs.length).sort((a, b) => a - b),
    [passengerFeeLegs, displayLegs.length]
  );

  const passengerFeeAppliesToAll = displayLegs.length > 1 && passengerFeeLegsSorted.length === displayLegs.length;

  const passengerFeeLegsLabel = useMemo(() => {
    const sel = passengerFeeLegsSorted;
    if (sel.length === 0) return "no leg";
    if (displayLegs.length > 1 && sel.length === displayLegs.length) {
      return displayLegs.length === 2 ? "both legs" : "all legs";
    }
    if (sel.length === 1) return `leg ${sel[0] + 1}`;
    return `legs ${sel.slice(0, -1).map((i) => i + 1).join(", ")} & ${sel[sel.length - 1] + 1}`;
  }, [passengerFeeLegsSorted, displayLegs.length]);

  const handleTogglePassengerFeeLeg = (legIndex: number | "all") => {
    const legCount = displayLegs.length;
    if (legIndex === "all") {
      setPassengerFeeLegs(Array.from({ length: legCount }, (_, i) => i));
      return;
    }
    // One or two legs: behaves like a single choice (Leg 1 / Leg 2 / Both)
    if (legCount <= 2) {
      setPassengerFeeLegs([legIndex]);
      return;
    }
    // Multi-leg: pick one or more legs. Clicking a leg while "All legs" is on selects just that leg.
    setPassengerFeeLegs((prev) => {
      const current = prev.filter((i) => i < legCount);
      if (current.length === legCount) return [legIndex];
      if (current.includes(legIndex)) {
        const next = current.filter((i) => i !== legIndex);
        return next.length > 0 ? next : current;
      }
      return [...current, legIndex];
    });
  };

  const passengerFeesLineAtCost = useMemo(() => {
    if (!passengerFeesItemised) return 0;
    return passengerFeePerLeg * passengerFeeLegsSorted.length;
  }, [passengerFeesItemised, passengerFeePerLeg, passengerFeeLegsSorted.length]);

  // Total Cost Base: Direct Buying Prices + Passenger Fees at Cost
  const totalCostBase = effectiveOperatorFlightCost + passengerFeesLineAtCost;

  // Company Margin calculation: Handles override cleanly as normal currency figure!
  const companyMarginAmount = useMemo(() => {
    if (companyMarginOverride) {
      return Number(companyMarginOverrideAmount) || 0;
    }
    const text = companyMarginText.trim();
    if (text && !text.includes("%") && (/[€$£]/.test(text) || parseFloat(text.replace(/[^0-9.]/g, "")) >= 100)) {
      const parsed = parseFloat(text.replace(/[^0-9.]/g, ""));
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return Math.round((totalCostBase * companyMarginTierPct) / 100 * 100) / 100;
  }, [companyMarginOverride, companyMarginOverrideAmount, companyMarginText, totalCostBase, companyMarginTierPct]);

  // Curator / Agent Mark-up calculation: Handles override cleanly as normal currency figure!
  const agentMarginAmount = useMemo(() => {
    if (agentMarginOverride) {
      return Number(agentMarginOverrideAmount) || 0;
    }
    const text = agentMarginText.trim();
    if (text && !text.includes("%") && (/[€$£]/.test(text) || parseFloat(text.replace(/[^0-9.]/g, "")) >= 100)) {
      const parsed = parseFloat(text.replace(/[^0-9.]/g, ""));
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    // Screen 1: 10% on (costBase + companyMargin) -> (49505 + 3960.40) * 0.10 = 5346.54
    return Math.round(((totalCostBase + companyMarginAmount) * agentMarginTierPct) / 100 * 100) / 100;
  }, [agentMarginOverride, agentMarginOverrideAmount, agentMarginText, totalCostBase, companyMarginAmount, agentMarginTierPct]);

  // Effective percentages for display
  const effectiveCompanyMarginPct = useMemo(() => {
    if (totalCostBase > 0) {
      return Math.round((companyMarginAmount / totalCostBase) * 1000) / 10;
    }
    return companyMarginTierPct;
  }, [companyMarginAmount, totalCostBase, companyMarginTierPct]);

  const effectiveAgentMarginPct = useMemo(() => {
    const base = totalCostBase + companyMarginAmount;
    if (base > 0) {
      return Math.round((agentMarginAmount / base) * 1000) / 10;
    }
    return agentMarginTierPct;
  }, [agentMarginAmount, totalCostBase, companyMarginAmount, agentMarginTierPct]);

  // Backward-compatible percentage aliases
  const companyMarginPercent = effectiveCompanyMarginPct;
  const agentCommissionPercent = effectiveAgentMarginPct;

  const clientSubtotal = totalCostBase + companyMarginAmount + agentMarginAmount + servicesTotal;
  const clientTotal = Math.round(clientSubtotal * 100) / 100;
  const cardAmount = Math.round(clientTotal * 1.035 * 100) / 100;

  // Leg pricing breakdown for "What the documents show"
  const legPricingBreakdown = useMemo(() => {
    const totalMargin = companyMarginAmount + agentMarginAmount;
    const marginRatio = totalCostBase > 0 ? totalMargin / totalCostBase : 0;
    
    let allocatedTotal = 0;
    const legs = displayLegs.map((leg, idx) => {
      const legBuyingPrice = leg.buyingPrice || Math.round(effectiveOperatorFlightCost / (displayLegs.length || 1));
      
      const legPassengerFee =
        passengerFeesItemised && passengerFeeLegsSorted.includes(idx) ? passengerFeePerLeg : 0;
      
      const legBase = legBuyingPrice + legPassengerFee;
      const legMargin = Math.round(legBase * marginRatio * 100) / 100;
      const charterPrice = Math.round((legBuyingPrice + legMargin) * 100) / 100;
      allocatedTotal += charterPrice;
      
      return {
        legNumber: idx + 1,
        buyingPrice: legBuyingPrice,
        passengerFee: legPassengerFee,
        margin: legMargin,
        charterPrice
      };
    });
    
    // Balance any fractional cent so sum of documents matches clientTotal exactly
    const expectedCharterSum = Math.round((effectiveOperatorFlightCost + totalMargin) * 100) / 100;
    const diff = Math.round((expectedCharterSum - allocatedTotal) * 100) / 100;
    if (diff !== 0 && legs.length > 0) {
      legs[legs.length - 1].charterPrice = Math.round((legs[legs.length - 1].charterPrice + diff) * 100) / 100;
    }
    
    return legs;
  }, [displayLegs, effectiveOperatorFlightCost, passengerFeesItemised, passengerFeeLegsSorted, passengerFeePerLeg, totalCostBase, companyMarginAmount, agentMarginAmount]);

  const documentLinesSum = useMemo(() => {
    const charterTotal = legPricingBreakdown.reduce((s, l) => s + l.charterPrice, 0);
    const feeCost = passengerFeesItemised ? passengerFeesLineAtCost : 0;
    return Math.round((charterTotal + feeCost + servicesTotal) * 100) / 100;
  }, [legPricingBreakdown, passengerFeesItemised, passengerFeesLineAtCost, servicesTotal]);

  const documentsAddUp = Math.abs(documentLinesSum - clientTotal) < 0.05;

  // ===== Taxes (R-091): every document line carries a tax code =====
  const taxableLines = useMemo<TaxableLine[]>(() => {
    const out: TaxableLine[] = [];
    const legOf = (i: number) => displayLegs[i] as any;
    displayLegs.forEach((leg: any, i) => {
      out.push({
        key: `charter-${i + 1}`,
        label: `Charter price · leg ${i + 1} · ${leg.origin?.icao || ""} → ${leg.destination?.icao || ""}`,
        kind: "charter",
        legNumber: i + 1,
        from: countryOf(leg.origin),
        to: countryOf(leg.destination),
        amount: legPricingBreakdown[i]?.charterPrice || 0,
        pax: paxCount,
        date: leg.flightDate
      });
    });
    if (passengerFeesItemised && passengerFeePerLeg > 0) {
      passengerFeeLegsSorted.forEach((i) => {
        const leg = legOf(i);
        if (!leg) return;
        out.push({
          key: `paxfee-${i + 1}`,
          label: `Passenger fees · leg ${i + 1}`,
          kind: "passenger_fee",
          legNumber: i + 1,
          from: countryOf(leg.origin),
          to: countryOf(leg.destination),
          amount: passengerFeePerLeg,
          date: leg.flightDate
        });
      });
    }
    const first = legOf(0) || {};
    if (hasGroundTransport) {
      displayLegs.forEach((leg: any, i) => {
        const k = `leg-${i + 1}`;
        const g = groundTransfers[k];
        if (!groundLegsEnabled[k] || !g) return;
        if (g.arrivalRequired)
          out.push({ key: `ground-arr-${k}`, label: `Ground transfer · arrival · leg ${i + 1}`, kind: "ground", legNumber: i + 1, country: countryOf(leg.destination), amount: g.arrivalPrice || 0, date: leg.flightDate });
        if (g.departureRequired)
          out.push({ key: `ground-dep-${k}`, label: `Ground transfer · departure · leg ${i + 1}`, kind: "ground", legNumber: i + 1, country: countryOf(leg.origin), amount: g.departurePrice || 0, date: leg.flightDate });
      });
    } else if (serviceOptions.limousine) {
      out.push({ key: "limo", label: "VIP limousine", kind: "ground", legNumber: 1, country: countryOf(destAirport), amount: limousinePrice, date: first.flightDate });
    }
    if (hasHeliTransfer) {
      displayLegs.forEach((leg: any, i) => {
        const k = `leg-${i + 1}`;
        const h = heliTransfers[k];
        if (!heliLegsEnabled[k] || !h) return;
        const c = countryOf(leg.destination);
        out.push({ key: `heli-${k}`, label: `Helicopter transfer · leg ${i + 1}`, kind: "helicopter", legNumber: i + 1, from: c, to: c, amount: h.clientPrice || 0, pax: Number(h.passengers) || paxCount, date: leg.flightDate });
      });
    } else if (serviceOptions.helicopter) {
      const c = countryOf(destAirport);
      out.push({ key: "heli", label: "Helicopter transfer", kind: "helicopter", legNumber: 1, from: c, to: c, amount: helicopterPrice, pax: paxCount, date: first.flightDate });
    }
    const svc = (key: string, label: string, amount: number) =>
      out.push({ key, label, kind: "service", legNumber: 1, from: countryOf(first.origin), to: countryOf(first.destination), country: countryOf(first.origin), amount, date: first.flightDate });
    if (serviceOptions.catering) svc("catering", "Catering", cateringPrice);
    if (serviceOptions.deicing) svc("deicing", "De-icing protection", deicingPrice);
    if (serviceOptions.carbonOffset) svc("carbon", "Carbon offset", carbonOffsetPrice);
    customServices.forEach((c) => svc(`custom-${c.id}`, c.name, c.price));
    return out;
  }, [
    displayLegs, legPricingBreakdown, paxCount, passengerFeesItemised, passengerFeePerLeg, passengerFeeLegsSorted, hasGroundTransport, groundTransfers,
    groundLegsEnabled, serviceOptions, destAirport, limousinePrice, hasHeliTransfer, heliTransfers, heliLegsEnabled, helicopterPrice, cateringPrice,
    deicingPrice, carbonOffsetPrice, customServices
  ]);
  const taxLinesComputed = useMemo(() => computeTaxes(taxableLines, taxRules, taxOverrides), [taxableLines, taxRules, taxOverrides]);
  const taxSummaryComputed = useMemo(() => summarizeTaxes(taxLinesComputed, taxRules, taxableLines), [taxLinesComputed, taxRules, taxableLines]);
  const taxTotal = taxSummaryComputed.total;
  const grandTotal = Math.round((clientTotal + taxTotal) * 100) / 100;
  // Lines that need a row "to confirm": nothing is charged for them and the quote cannot be sent yet
  const taxPending = taxLinesComputed.filter((t) => t.pending.length > 0 && t.base > 0);

  const currencySymbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF";
  const money = (n: number) =>
    `${currencySymbol} ${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ===== Step 04a · operator search and new operator =====
  const draftOperator: OperatorRecord | null = useMemo(() => {
    if (!newOpEnabled) return null;
    const name = newOpLegalName.trim() || "New operator";
    return {
      id: NEW_OPERATOR_DRAFT_ID,
      legalName: name,
      tradingName: name,
      aocNumber: newOpAoc.trim(),
      aocAuthority: newOpAuthority,
      aocExpiry: "",
      baseIcao: newOpBaseIcao.trim().toUpperCase(),
      salesContact: "Operations",
      salesEmail: newOpEmail.trim(),
      opsPhone: newOpPhone.trim(),
      opsEmail: newOpEmail.trim(),
      status: "pending",
      qualificationChecklist: NEW_OPERATOR_DOCUMENTS.map((docType, i) => ({
        id: `doc-${i + 1}`,
        docType,
        status: "pending" as const
      })),
      createdAt: ""
    };
  }, [newOpEnabled, newOpLegalName, newOpAoc, newOpAuthority, newOpBaseIcao, newOpEmail, newOpPhone]);

  const allOperators: OperatorRecord[] = useMemo(
    () => (draftOperator ? [draftOperator, ...operators] : operators),
    [draftOperator, operators]
  );

  // Same aircraft on all legs (or a one-leg trip) means the search always fills every leg
  const effectiveOpTarget: number | "all" =
    sameAircraftOnAllLegs || displayLegs.length <= 1 || opTargetLeg === "all" || opTargetLeg >= displayLegs.length
      ? "all"
      : opTargetLeg;

  const targetLegIndexes = effectiveOpTarget === "all" ? displayLegs.map((_, i) => i) : [effectiveOpTarget];
  const targetLegOperatorIds = targetLegIndexes
    .map((i) => displayLegs[i]?.operatorId)
    .filter((x): x is string => Boolean(x));
  const targetLegAircraftIds = targetLegIndexes
    .map((i) => displayLegs[i]?.aircraft?.id)
    .filter((x): x is string => Boolean(x));

  const operatorSearchResults = useMemo(() => {
    const q = opSearchQuery.trim().toLowerCase();
    if (!q) return [] as OperatorRecord[];
    const scored = operators
      .map((op) => {
        const code = getOperatorCountryCode(op);
        const countryName = AOC_AUTHORITIES.find((a) => a.code === code)?.label.split(" · ")[1] || "";
        const fields = [op.tradingName, op.legalName, op.aocNumber, op.aocAuthority, op.baseIcao, code, countryName].map(
          (f) => (f || "").toLowerCase()
        );
        const starts = fields.slice(0, 3).some((f) => f.startsWith(q));
        const hit = fields.some((f) => f.includes(q));
        return { op, score: !hit ? -1 : starts ? 0 : 1 };
      })
      .filter((x) => x.score >= 0)
      .sort((a, b) => a.score - b.score || (a.op.tradingName || a.op.legalName).localeCompare(b.op.tradingName || b.op.legalName));
    return scored.slice(0, 6).map((x) => x.op);
  }, [opSearchQuery, operators]);

  const aircraftSearchResults = useMemo(() => {
    const q = acSearchQuery.trim();
    if (!q) return [] as { aircraft: Aircraft; rank: number }[];
    return fleetData
      .map((aircraft) => ({ aircraft, rank: rankAircraftForQuery(aircraft, q) }))
      .filter((r) => r.rank >= 0)
      .sort((a, b) => a.rank - b.rank || a.aircraft.name.length - b.aircraft.name.length || a.aircraft.name.localeCompare(b.aircraft.name))
      .slice(0, 6);
  }, [acSearchQuery]);

  const applyOperatorToTarget = (opId: string) => {
    if (effectiveOpTarget === "all") {
      setSelectedOperatorId(opId);
      displayLegs.forEach((_, i) => updateLegField(i, "operatorId", opId));
    } else {
      updateLegField(effectiveOpTarget, "operatorId", opId);
    }
  };

  const applyAircraftToTarget = (ac: Aircraft) => {
    if (effectiveOpTarget === "all") {
      setSelectedAircraft(ac);
      displayLegs.forEach((_, i) => updateLegField(i, "aircraft", ac));
    } else {
      updateLegField(effectiveOpTarget, "aircraft", ac);
    }
  };

  const handleToggleNewOperator = (checked: boolean) => {
    setNewOpEnabled(checked);
    setNewOpError("");
    if (checked) {
      applyOperatorToTarget(NEW_OPERATOR_DRAFT_ID);
      return;
    }
    const fallback = operators[0]?.id || "";
    if (selectedOperatorId === NEW_OPERATOR_DRAFT_ID) setSelectedOperatorId(fallback);
    setMultiLegs((prev) =>
      prev.map((l) => (l.operatorId === NEW_OPERATOR_DRAFT_ID ? { ...l, operatorId: fallback } : l))
    );
  };

  const openOperatorSearch = (target: number | "all") => {
    setOpTargetLeg(target);
    if (typeof document !== "undefined") {
      document.getElementById("qb-step-04a")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // ===== Leg strip shown above 04a and 06 =====
  const formatShortDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(`${iso}T00:00:00`);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };

  const renderLegStrip = (extra: string) => (
    <div className="bg-slate-50/80 border border-slate-100 rounded-xl px-4 py-3 flex flex-wrap items-baseline gap-x-6 gap-y-1.5 text-[15px] text-slate-800">
      {displayLegs.map((leg, i) => {
        const o = leg.origin?.icao || "";
        const d = leg.destination?.icao || "";
        const oCity = i === 0 ? leg.origin?.city || "" : "";
        const dCity = i === 0 ? leg.destination?.city || "" : "";
        return (
          <span key={leg.id || `strip-${i}`} className="whitespace-nowrap">
            <strong className="font-semibold">Leg</strong> <strong className="font-semibold ml-1">{i + 1}</strong>{" "}
            {o}
            {oCity ? ` ${oCity}` : ""} → {d}
            {dCity ? ` ${dCity}` : ""} · {formatShortDate(leg.flightDate)} {leg.departureTime} LT
          </span>
        );
      })}
      <span className="text-[13px] text-slate-500">{extra}</span>
    </div>
  );

  // ===== Compact live total for the steps between 02 and 05 =====
  const renderLiveTotalNote = () => (
    <StepNote title="Live total">
      <div className="flex justify-between gap-3">
        <span className="text-slate-500">Buying prices</span>
        <span className="font-mono">{money(effectiveOperatorFlightCost)}</span>
      </div>
      {passengerFeesLineAtCost > 0 && (
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Passenger fees</span>
          <span className="font-mono">{money(passengerFeesLineAtCost)}</span>
        </div>
      )}
      <div className="flex justify-between gap-3">
        <span className="text-slate-500">Margins</span>
        <span className="font-mono">{money(companyMarginAmount + agentMarginAmount)}</span>
      </div>
      <div className="flex justify-between gap-3">
        <span className="text-slate-500">Services</span>
        <span className="font-mono">{money(servicesTotal)}</span>
      </div>
      <div className="flex justify-between gap-3 border-t border-slate-200 pt-1.5 mt-1 font-semibold text-slate-900">
        <span>Client total</span>
        <span className="font-mono">{money(grandTotal)}</span>
      </div>
      <div className={`text-[12px] pt-1 ${documentsAddUp ? "text-emerald-700" : "text-amber-700"}`}>
        {documentsAddUp ? "✓ Document lines add up" : "▲ Document lines do not add up"}
      </div>
      <button
        type="button"
        onClick={() => goToStage(6)}
        className="text-[12px] text-blue-600 hover:underline pt-0.5"
      >
        Go to price (06)
      </button>
    </StepNote>
  );

  // Track the step in view for the breadcrumb
  useEffect(() => {
    if (typeof window === "undefined") return;
    let frame = 0;
    const compute = () => {
      frame = 0;
      const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-qb-step]"));
      if (nodes.length === 0) return;
      const line = window.innerHeight * 0.3;
      let current = nodes[0].dataset.qbStep || "01";
      for (const node of nodes) {
        if (node.getBoundingClientRect().top <= line) current = node.dataset.qbStep || current;
      }
      setActiveStep((prev) => (prev === current ? prev : current));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [isPhotoPickerOpen]);

  // Selected Account details
  const activeAccount = useMemo(() => {
    const found = accounts.find((a) => a.accountNumber === selectedAccountId || a.id === selectedAccountId);
    if (found) return found;
    // Revising a version whose client is not a saved account: keep that version's client as it is
    if (sourceTrip) {
      const cl: any = sourceTrip.client || {};
      return {
        id: sourceTrip.accountNumber || "",
        name: cl.companyName || cl.fullName || (sourceTrip as any).authorisedOwnerName || "",
        accountNumber: sourceTrip.accountNumber || "",
        billingAddress: cl.streetAddress || "",
        country: cl.cityPostalCountry || "",
        email: cl.email || "",
        phone: cl.phone || "",
        vatNumber: cl.vatNumber || "",
        agentName: sourceTrip.agentName || "",
        isAgent: false
      } as any;
    }
    if (sourceRequest) {
      return {
        id: sourceRequest.accountId || (sourceRequest as any).clientId || "",
        name: sourceRequest.companyName || sourceRequest.clientName || "",
        accountNumber: sourceRequest.accountId || (sourceRequest as any).clientId || "",
        billingAddress: sourceRequest.clientAddress || "",
        country: sourceRequest.clientCityCountry || "",
        email: sourceRequest.clientEmail || "",
        phone: sourceRequest.clientPhone || "",
        vatNumber: sourceRequest.clientVatNumber || "",
        agentName: sourceRequest.agentName || "",
        isAgent: false
      };
    }
    // A brand-new quote with nothing picked yet starts on the first account; a revision never does
    return effectiveReviseId ? undefined : accounts[0];
  }, [accounts, selectedAccountId, sourceRequest, sourceTrip, effectiveReviseId]);

  // ===== Step 01 · people on the selected account =====
  const accountPeople = useMemo(() => {
    const persons: any[] = (activeAccount as any)?.authorizedPersons || [];
    return persons.map((p: any) => {
      const role = String(p.roleTitle || p.title || "").replace(/\s*·\s*default\s*$/i, "").trim();
      const hasPassport = Boolean(p.hasPassport || p.passportDetails?.passportNumber);
      return {
        id: String(p.id || p.contactId || p.fullName),
        fullName: String(p.fullName || ""),
        role,
        email: String(p.email || ""),
        phone: String(p.phone || ""),
        isPrimary: Boolean(p.isPrimaryAccountName),
        hasPassport,
        label: [p.fullName, role, hasPassport ? "passport on file" : "no passport on file"].filter(Boolean).join(" · ")
      };
    });
  }, [activeAccount]);

  const selectedOwnerPerson = useMemo(() => {
    return (
      accountPeople.find((p) => p.id === ownerPersonId) ||
      accountPeople.find((p) => p.fullName.toLowerCase() === (leadPaxName || "").toLowerCase()) ||
      undefined
    );
  }, [accountPeople, ownerPersonId, leadPaxName]);

  // Assistants: other authorised persons + contacts linked to the account (never the owner)
  const assistantCandidates = useMemo(() => {
    const ownerName = (selectedOwnerPerson?.fullName || leadPaxName || "").toLowerCase();
    const list: { id: string; name: string; role: string; phone: string; email: string }[] = [];
    const seen = new Set<string>();
    accountPeople.forEach((p) => {
      const key = p.fullName.toLowerCase();
      if (!key || key === ownerName || seen.has(key)) return;
      seen.add(key);
      list.push({ id: `auth:${p.id}`, name: p.fullName, role: p.role || "Authorised person", phone: p.phone, email: p.email });
    });
    const acc: any = activeAccount;
    (contacts || []).forEach((c: any) => {
      const linked =
        (acc?.id && c.associatedAccountId === acc.id) ||
        (acc?.accountNumber && c.associatedAccountId === acc.accountNumber) ||
        (acc?.name && c.associatedAccountName === acc.name);
      if (!linked) return;
      const name = String(c.fullName || `${c.firstName || ""} ${c.lastName || ""}`).trim();
      const key = name.toLowerCase();
      if (!key || key === ownerName || seen.has(key)) return;
      seen.add(key);
      list.push({
        id: `contact:${c.id}`,
        name,
        role: String(c.title || c.roleTitle || "Contact").split("·")[0].trim(),
        phone: String(c.phone || ""),
        email: String(c.email || "")
      });
    });
    return list;
  }, [accountPeople, activeAccount, contacts, selectedOwnerPerson, leadPaxName]);

  // Default the Authorised Owner to the account's primary person when the account changes
  useEffect(() => {
    if (accountPeople.length === 0) return;
    const stillValid = accountPeople.some((p) => p.id === ownerPersonId);
    if (stillValid) return;
    const byName = accountPeople.find((p) => p.fullName.toLowerCase() === (leadPaxName || "").toLowerCase());
    const pick = byName || accountPeople.find((p) => p.isPrimary) || accountPeople[0];
    setOwnerPersonId(pick.id);
    if (!byName && pick.fullName) setLeadPaxName(pick.fullName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountPeople]);

  // Pick an assistant automatically when "Handled by an assistant" is switched on
  useEffect(() => {
    if (!isHandledByPa) return;
    if (paContactId === "__manual__") return;
    const current = paContactId ? assistantCandidates.find((a) => a.id === paContactId) : undefined;
    if (current) {
      if (!paName) {
        setPaName(current.name);
        setPaEmail(current.email);
        setPaPhone(current.phone);
      }
      return;
    }
    if (!paContactId && paName) {
      const match = assistantCandidates.find((a) => a.name.toLowerCase() === paName.toLowerCase());
      setPaContactId(match ? match.id : "__manual__");
      return;
    }
    const first = assistantCandidates[0];
    if (first) {
      setPaContactId(first.id);
      setPaName(first.name);
      setPaEmail(first.email);
      setPaPhone(first.phone);
    } else {
      setPaContactId("__manual__");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHandledByPa, assistantCandidates]);

  // Without an assistant, documents go to the owner and the owner signs
  useEffect(() => {
    if (isHandledByPa) return;
    setSendDocsTo("owner");
    setSignsAgreement("owner");
  }, [isHandledByPa]);

  // Defaults saved on the pre-selected account apply once for a new quote
  const appliedInitialDefaultsRef = React.useRef(false);
  useEffect(() => {
    if (appliedInitialDefaultsRef.current || sourceTrip) return;
    const acc = accounts.find((a) => a.id === activeAccount?.id);
    if (!acc) return;
    appliedInitialDefaultsRef.current = true;
    applyAccountDefaults(acc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccount]);

  const handleSelectOwnerPerson = (personId: string) => {
    setOwnerPersonId(personId);
    const person = accountPeople.find((p) => p.id === personId);
    if (person?.fullName) setLeadPaxName(person.fullName);
  };

  const handleSelectAssistant = (candidateId: string) => {
    setPaContactId(candidateId);
    if (candidateId === "__manual__") return;
    const cand = assistantCandidates.find((a) => a.id === candidateId);
    if (cand) {
      setPaName(cand.name);
      setPaEmail(cand.email);
      setPaPhone(cand.phone);
    }
  };

  const getAccountCity = (acc: any): string => {
    if (!acc) return "";
    const parts = String(acc.billingAddress || "").split(",").map((x: string) => x.trim()).filter(Boolean);
    const country = String(acc.country || "").trim().toLowerCase();
    const withoutCountry = parts.filter((x: string) => x.toLowerCase() !== country);
    return withoutCountry[withoutCountry.length - 1] || acc.country || "";
  };

  const getAccountTripCount = (acc: any): number => {
    if (!acc) return 0;
    const fromBookings = bookings.filter((b) => b.accountNumber && b.accountNumber === acc.accountNumber).length;
    return Math.max(fromBookings, Number(acc.lifetimeTrips || acc.totalBookings || 0));
  };

  const formatCuratorShort = (name?: string) => {
    if (!name) return "";
    const clean = name.replace(/\s*\(.*\)\s*$/, "").trim();
    const parts = clean.split(/\s+/);
    if (parts.length < 2) return clean;
    return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
  };

  const billingLine = useMemo(() => {
    const acc: any = activeAccount;
    if (!acc?.billingAddress) return "—";
    const country = String(acc.country || "").trim().toLowerCase();
    return String(acc.billingAddress)
      .split(",")
      .map((x: string) => x.trim())
      .filter((x: string) => x && x.toLowerCase() !== country)
      .join(", ");
  }, [activeAccount]);

  const curatorName = sourceRequest?.agentName || (sourceTrip as any)?.agentName || (activeAccount as any)?.agentName || "";

  // Submission handler
  // The quote exactly as it is saved (also used for the live document preview on step 7)
  const buildQuoteBooking = (savedNewOperator: OperatorRecord | null, mode: "send" | "draft" = "send"): Booking => {
    const resolveOperator = (op?: OperatorRecord) =>
      op && op.id === NEW_OPERATOR_DRAFT_ID && savedNewOperator ? savedNewOperator : op;
    const resolvedSelectedOperator = resolveOperator(selectedOperator);
    const legOperators = displayLegs.map((leg, i) => {
      const op = resolveOperator(allOperators.find((o) => o.id === leg.operatorId) || selectedOperator);
      return {
        legNumber: i + 1,
        operatorId: op?.id || "",
        operatorName: op?.tradingName || op?.legalName || "",
        operatorStatus: op?.status || "",
        aircraftName: leg.aircraft?.name || "",
        buyingPrice: leg.buyingPrice || 0
      };
    });

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
              : selectedAircraft.registration) || "",
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
            phone: "",
            email: ""
          },
          arrivalHandling: {
            name: `${mLeg.destination?.name || "VIP"} FBO`,
            airportCode: mLeg.destination?.icao || "EGSS",
            phone: "",
            email: ""
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
        aircraftRegistration: selectedAircraft.registration || "",
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
          name: "",
          airportCode: originAirport.icao,
          phone: "",
          email: ""
        },
        arrivalHandling: {
          name: "",
          airportCode: destAirport.icao,
          phone: "",
          email: ""
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
          aircraftRegistration: selectedAircraft.registration || "",
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
            name: "",
            airportCode: destAirport.icao,
            phone: "",
            email: ""
          },
          arrivalHandling: {
            name: "",
            airportCode: originAirport.icao,
            phone: "",
            email: ""
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
        details: displayLegs.length > 1 ? "all legs" : "",
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

    // Services as cards for the booking's Services tab (same lines and prices as the quote)
    const nowIso = new Date().toISOString();
    const svcBase = {
      supplierCost: 0,
      source: "quote" as const,
      billing: "in_quote" as const,
      addedAt: nowIso
    };
    const tripServices: TripServiceItem[] = [];
    if (hasGroundTransport) {
      displayLegs.forEach((leg, lIdx) => {
        const legKey = `leg-${lIdx + 1}`;
        const g = groundTransfers[legKey];
        if (!groundLegsEnabled[legKey] || !g) return;
        if (g.arrivalRequired) {
          tripServices.push({
            ...svcBase,
            id: `q-ground-arr-${legKey}`,
            type: "limousine",
            legNumber: lIdx + 1,
            timing: "arrival",
            airport: leg.destination?.icao,
            location: g.arrivalDropoff,
            vehicle: g.arrivalVehicle,
            passengers: g.passengers,
            instructions: g.specialRequests,
            clientPrice: g.arrivalPrice || 0,
            status: "requested"
          });
        }
        if (g.departureRequired) {
          tripServices.push({
            ...svcBase,
            id: `q-ground-dep-${legKey}`,
            type: "limousine",
            legNumber: lIdx + 1,
            timing: "departure",
            airport: leg.origin?.icao,
            location: g.departurePickup,
            vehicle: g.departureVehicle,
            passengers: g.passengers,
            instructions: g.specialRequests,
            clientPrice: g.departurePrice || 0,
            status: "requested"
          });
        }
      });
    } else if (serviceOptions.limousine) {
      tripServices.push({
        ...svcBase,
        id: "q-limo",
        type: "limousine",
        legNumber: 1,
        timing: "arrival",
        airport: destAirport?.icao,
        location: "",
        vehicle: "SUV",
        passengers: paxCount,
        clientPrice: limousinePrice,
        status: "requested"
      });
    }
    if (hasHeliTransfer) {
      displayLegs.forEach((leg, lIdx) => {
        const legKey = `leg-${lIdx + 1}`;
        const h = heliTransfers[legKey];
        if (!heliLegsEnabled[legKey] || !h) return;
        const isDeparture = h.transferType === "departure";
        tripServices.push({
          ...svcBase,
          id: `q-heli-${legKey}`,
          type: "helicopter",
          legNumber: lIdx + 1,
          timing: h.transferType,
          airport: isDeparture ? leg.origin?.icao : leg.destination?.icao,
          from: isDeparture ? h.departurePickup || "" : h.arrivalAirport || h.depArrLocation || leg.destination?.icao || "",
          to: isDeparture ? h.departureAirport || leg.origin?.icao || "" : h.arrivalDestination || h.destination || "",
          helicopterType: h.prefType,
          passengers: h.passengers,
          luggage: h.luggageDetails,
          instructions: h.specialRequests,
          clientPrice: h.clientPrice || 0,
          status: "requested"
        });
      });
    } else if (serviceOptions.helicopter) {
      tripServices.push({
        ...svcBase,
        id: "q-heli",
        type: "helicopter",
        legNumber: 1,
        timing: "arrival",
        airport: destAirport?.icao,
        from: destAirport?.icao || "",
        to: "",
        passengers: paxCount,
        clientPrice: helicopterPrice,
        status: "requested"
      });
    }
    if (serviceOptions.catering) {
      tripServices.push({
        ...svcBase,
        id: "q-catering",
        type: "catering",
        legNumber: displayLegs.length > 1 ? 0 : 1,
        menu: "",
        dietary: "",
        included: cateringPrice === 0,
        clientPrice: cateringPrice,
        status: "requested_operator"
      });
    }
    if (serviceOptions.deicing) {
      tripServices.push({ ...svcBase, id: "q-deicing", type: "custom", title: "De-icing protection", instructions: "Holdover protection package", clientPrice: deicingPrice, status: "requested" });
    }
    if (serviceOptions.carbonOffset) {
      tripServices.push({ ...svcBase, id: "q-carbon", type: "custom", title: "Carbon offset", instructions: "Gold Standard certified climate credit", clientPrice: carbonOffsetPrice, status: "requested" });
    }
    customServices.forEach((cs) => {
      tripServices.push({ ...svcBase, id: `q-${cs.id}`, type: "custom", title: cs.name, instructions: cs.details, clientPrice: cs.price, status: "requested" });
    });

    // A revision keeps the services added on the booking page after the quote (already billed separately)
    (sourceTrip?.tripServices || [])
      .filter((ts) => ts.source === "added")
      .forEach((ts) => {
        if (!tripServices.some((x) => x.id === ts.id)) tripServices.push(ts);
      });

    // Each saved leg carries what the documents print: its own aircraft, its charter price,
    // a real FBO from the directory (or none), no made-up flight number, and an estimated block time
    legs.forEach((leg, i) => {
      const dl: any = displayLegs[i] || {};
      const ac: any = dl.aircraft || selectedAircraft;
      const prev: any = (sourceTrip?.legs || []).find(
        (p: any) => p && p.origin?.icao === leg.origin?.icao && p.destination?.icao === leg.destination?.icao && (p.legNumber || 0) === leg.legNumber
      );
      (leg as any).aircraftSpec = {
        name: ac?.name || leg.aircraftType || "",
        category: ac?.category,
        categoryLabel: ac?.categoryLabel,
        yearOfMake: dl.yearOfMake ?? ac?.yearOfManufacture,
        yearOfRefurbishment: dl.yearOfRefurbishment ?? ac?.yearOfRefurbishment,
        seats: dl.seats ?? ac?.passengers,
        lavatoryOnBoard: dl.lavatoryOnBoard ?? ac?.toilette,
        lavatoryType: dl.lavatoryType,
        smokingCabin: dl.smokingCabin ?? ac?.smokingCabin,
        exteriorPhoto: dl.exteriorPhoto || ac?.imageExterior || "",
        cabinPhoto: dl.cabinPhoto || ac?.imageInterior || ""
      };
      leg.aircraftType = ac?.name || leg.aircraftType;
      (leg as any).charterPrice = legPricingBreakdown[i]?.charterPrice;
      (leg as any).buyingPrice = legPricingBreakdown[i]?.buyingPrice;
      if (prev) {
        // A revision keeps what the itinerary already holds for the same leg
        leg.departureHandling = prev.departureHandling || leg.departureHandling;
        leg.arrivalHandling = prev.arrivalHandling || leg.arrivalHandling;
        leg.departureFboChanged = prev.departureFboChanged;
        leg.arrivalFboChanged = prev.arrivalFboChanged;
        leg.crew = prev.crew || [];
        leg.aircraftRegistration = prev.aircraftRegistration || ac?.registration || "";
        leg.flightNumber = prev.flightNumber || "";
        leg.briefContact = prev.briefContact;
        if ((prev.passengers || []).length > (leg.passengers || []).length) leg.passengers = prev.passengers;
      } else {
        const fbo = (icao?: string) => {
          const f = fbosFor(icao)[0];
          return f
            ? { name: f.name, airportCode: icao || "", phone: f.phone || "", email: f.email || "", address: f.address || "" }
            : { name: "", airportCode: icao || "", phone: "", email: "" };
        };
        leg.departureHandling = fbo(leg.origin?.icao);
        leg.arrivalHandling = fbo(leg.destination?.icao);
        leg.aircraftRegistration = ac?.registration || "";
        leg.flightNumber = "";
      }
      const keepTimes = prev && prev.departureTimeLocal === leg.departureTimeLocal && (prev.arrivalEdited || prev.flightTimeMinutes);
      if (keepTimes) {
        leg.arrivalTimeLocal = prev.arrivalTimeLocal;
        leg.flightTimeFormatted = prev.flightTimeFormatted;
        leg.flightTimeMinutes = prev.flightTimeMinutes;
        leg.arrivalEdited = prev.arrivalEdited;
      } else {
        const minutes = estimateLegMinutes(leg.origin, leg.destination, ac);
        if (minutes) {
          leg.flightTimeMinutes = minutes;
          leg.flightTimeFormatted = fmtDuration(minutes);
          leg.arrivalTimeLocal = legTiming(leg, ac).arr;
        }
      }
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
      accountNumber: activeAccount?.accountNumber || "",
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
        companyName: activeAccount?.name || sourceTrip?.client.companyName || "",
        streetAddress: activeAccount?.billingAddress || sourceTrip?.client.streetAddress || "",
        cityPostalCountry: `${activeAccount?.country || sourceTrip?.client.cityPostalCountry || ""}`,
        phone: activeAccount?.phone || sourceTrip?.client.phone || "",
        email: activeAccount?.email || sourceTrip?.client.email || "",
        accountNumber: activeAccount?.accountNumber || "",
        isHandledByPa,
        paName: isHandledByPa ? paName : undefined,
        paEmail: isHandledByPa ? paEmail : undefined,
        paPhone: isHandledByPa ? paPhone : undefined,
      },
      operator: {
        companyName: resolvedSelectedOperator?.tradingName || sourceTrip?.operator.companyName || "",
        legalEntity: sourceTrip?.operator.legalEntity || resolvedSelectedOperator?.legalName || "",
        representativeName: resolvedSelectedOperator?.salesContact || "",
        supportEmail: resolvedSelectedOperator?.opsEmail || sourceTrip?.operator.supportEmail || "",
        supportPhone: resolvedSelectedOperator?.opsPhone || sourceTrip?.operator.supportPhone || "",
        vatNumber: sourceTrip?.operator.vatNumber || "",
        additionalVatNumbers: [],
        iban: sourceTrip?.operator.iban || "",
        bic: sourceTrip?.operator.bic || "",
        bankName: sourceTrip?.operator.bankName || "",
        accountHolder: resolvedSelectedOperator?.tradingName || sourceTrip?.operator.accountHolder || "",
        commercialRegistry: resolvedSelectedOperator?.aocNumber ? `AOC ${resolvedSelectedOperator.aocNumber}` : "",
        courtOfJurisdiction: sourceTrip?.operator.courtOfJurisdiction || ""
      },
      legs,
      pricing: {
        flightPrice: effectiveOperatorFlightCost,
        airportFees: 0,
        passengerFees: passengerFeesItemised ? passengerFeesLineAtCost : 0,
        dayOfWeekDiscount: 0,
        inboundPassengerTax: 0,
        outboundPassengerTax: 0,
        additionalServicesTotal: servicesTotal,
        subtotal: clientSubtotal,
        vatRate: 0,
        vatAmount: taxTotal,
        totalFlightPrice: grandTotal,
        currency: currency,
        companyMargin: companyMarginAmount,
        agentCommission: agentMarginAmount,
        operatorCost: effectiveOperatorFlightCost
      },
      services: {
        limousineService: serviceOptions.limousine,
        luxuryCarRental: false,
        helicopterService: serviceOptions.helicopter,
        vipCateringDetails: serviceOptions.catering ? (cateringPrice === 0 ? "Catering · included" : "Catering") : undefined,
        deicingInsurance: serviceOptions.deicing ? "at_reservation" : "none",
        deicingCostPerLeg: serviceOptions.deicing ? deicingPrice : 0,
        carbonOffset: serviceOptions.carbonOffset ? "neutral" : "none",
        carbonOffsetRatePerHour: serviceOptions.carbonOffset ? carbonOffsetPrice : 0
      },
      checklist: sourceTrip?.checklist || [],
      quoteVersion: nextVersionNum,
      // A revision stays with the Curator and the request it came from
      agentName: sourceRequest?.agentName || (sourceTrip as any)?.agentName,
      agentEmail: sourceRequest?.agentEmail || (sourceTrip as any)?.agentEmail,
      commissionPercentage: effectiveAgentMarginPct,
      adminMarginValue: effectiveCompanyMarginPct,
      manualServices: activeServicesList,
      sourceAgentRequestId: sourceRequest?.id || (sourceTrip as any)?.sourceAgentRequestId,
      authorisedOwnerId: selectedOwnerPerson?.id,
      authorisedOwnerName: leadPaxName,
      assistantContactId: isHandledByPa ? paContactId || undefined : undefined,
      sendDocsTo,
      signsAgreement,
      legOperators,
      operatorPendingApproval: legOperators.some(
        (lo) => lo.operatorStatus && lo.operatorStatus !== "approved" && lo.operatorStatus !== "approved_with_conditions"
      ),
      // 05: services move to the booking's Services tab
      tripServices,
      // Charter price per leg as shown in step 06 (the documents print exactly these)
      ...({ legPricing: legPricingBreakdown } as any),
      // 03: pets travel with the trip and show on the booking's Passengers tab
      pets: hasPets
        ? pets.map((p) => ({
            id: p.id,
            name: p.name.trim(),
            species: p.species,
            breed: p.breed.trim(),
            weightKg: p.weightKg,
            travels: p.travels,
            documents: p.documents,
            documentNumber: (p.documentNumber || "").trim(),
            notes: p.notes.trim()
          }))
        : [],
      petDetails: hasPets && pets.length > 0
        ? {
            hasPets: true,
            petCount: pets.length,
            totalWeightKg: Math.round(pets.reduce((sum, p) => sum + (Number(p.weightKg) || 0), 0) * 10) / 10,
            petType: Array.from(new Set(pets.map((p) => p.species))).join(", "),
            breed: pets.map((p) => p.breed).filter(Boolean).join(", "),
            notes: pets.map((p) => [p.name, p.travels].filter(Boolean).join(" · ")).join("; ")
          }
        : { hasPets: false, petCount: 0, totalWeightKg: 0 },
      passengerFeeItems:
        passengerFeesItemised && passengerFeesLineAtCost > 0
          ? [
              {
                description: passengerFeesDesc,
                amount: passengerFeesAmount,
                charged: passengerFeesCharged,
                pax: passengerFeesPax,
                legs: passengerFeeLegsSorted.map((i) => i + 1),
                lineAtCost: passengerFeesLineAtCost
              }
            ]
          : [],
      createdAt: sourceTrip?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    // Taxes as they were decided for this version (issued quotes keep their rates)
    (newBooking as any).taxLines = taxLinesComputed;
    (newBooking as any).taxSummary = taxSummaryComputed;
    (newBooking as any).taxOverrides = taxOverrides;
    (newBooking as any).taxChangeLog = taxChangeLog;
    // What the documents print, frozen with the version (wording, policy, bank, links, legal versions)
    const activeTerms = (settings.termsVersions || []).find((t: any) => t.isActive) || (settings.termsVersions || [])[0];
    (newBooking as any).documentSnapshot = {
      company: { ...settings.company },
      cancellationPolicy: settings.cancellationPolicy || [],
      termsVersions: activeTerms ? [activeTerms] : [],
      bankAccounts: settings.bankAccounts || [],
      documents: { ...((settings as any).documents || {}) },
      pricing: { ...(settings.pricing || {}) },
      links: {
        legalBase: (settings as any).documents?.legalBaseUrl || "orbaero.com",
        signHost: (settings as any).documents?.signHost || "sign.orbaero.com"
      },
      legalVersions: { ...legalVersions },
      at: new Date().toISOString()
    };
    (newBooking as any).signToken = (sourceTrip as any)?.signToken && isBookingRevision ? (sourceTrip as any).signToken : signToken;
    // Step 7 print choices and where the quote goes
    (newBooking as any).docOptions = { ...docOptionsValue };
    (newBooking as any).sendTo = { client: sendToClient, curator: sendToCurator, whatsapp: sendWhatsApp };
    (newBooking as any).isDraft = mode === "draft" && !isBookingRevision;
    // Every builder input, so the next revision opens exactly as this version was made.
    // Uploaded photos are already stored on the version; they are only marked here.
    const slimPhoto = (v: any) => (typeof v === "string" && v.startsWith("data:") ? "__saved__" : v);
    (newBooking as any).builderState = {
      v: 1,
      leadPaxName,
      paContactId,
      sameAircraftOnAllLegs,
      multiLegs: multiLegs.map((m) => ({ ...m, exteriorPhoto: slimPhoto(m.exteriorPhoto), cabinPhoto: slimPhoto(m.cabinPhoto), cabinPhoto2: slimPhoto(m.cabinPhoto2) })),
      selectedAircraft: {
        ...selectedAircraft,
        imageExterior: slimPhoto(selectedAircraft.imageExterior),
        imageInterior: slimPhoto(selectedAircraft.imageInterior)
      },
      selectedOperatorId: savedNewOperator && selectedOperatorId === NEW_OPERATOR_DRAFT_ID ? savedNewOperator.id : selectedOperatorId,
      operatorFlightCost,
      luggagePieces,
      oversizeItems,
      serviceOptions,
      hasGroundTransport,
      groundLegsEnabled,
      groundTransfers,
      hasHeliTransfer,
      heliLegsEnabled,
      heliTransfers,
      customServices,
      limousinePrice,
      helicopterPrice,
      cateringPrice,
      deicingPrice,
      carbonOffsetPrice,
      passengerFeesItemised,
      passengerFeeLegs,
      passengerFeesDesc,
      passengerFeesAmount,
      passengerFeesCharged,
      passengerFeesPax,
      companyMarginTierPct,
      companyMarginOverride,
      companyMarginOverrideAmount,
      companyMarginText,
      agentMarginTierPct,
      agentMarginOverride,
      agentMarginOverrideAmount,
      agentMarginText
    };
    if (savedNewOperator) {
      (newBooking as any).builderState.multiLegs = (newBooking as any).builderState.multiLegs.map((m: any) =>
        m.operatorId === NEW_OPERATOR_DRAFT_ID ? { ...m, operatorId: savedNewOperator.id } : m
      );
    }
    if (mode === "draft") {
      newBooking.status = isBookingRevision ? newBooking.status : ("draft" as any);
      newBooking.quoteStatus = isBookingRevision ? newBooking.quoteStatus : ("draft" as any);
    }
    return newBooking;
  };

  const handleCompleteQuotation = async (mode: "send" | "draft" = "send") => {
    if (saving) return;
    // 04a: a new operator needs at least a name before the quote is saved
    if (newOpEnabled && !newOpLegalName.trim()) {
      setNewOpError("Type the operator name, or untick “Operator not in database”.");
      goToStage(3);
      toast("Type the new operator's name, or untick “Operator not in database”.", "error");
      return;
    }
    // 06: "Complete" is blocked when the document lines do not add up
    if (mode === "send" && taxRulesState !== "ready") {
      goToStage(6);
      toast("The tax table could not be loaded, so the taxes cannot be worked out. Try again.", "error");
      return;
    }
    if (mode === "send" && taxPending.length > 0) {
      goToStage(6);
      toast("A tax row this quote needs is still to confirm by the adviser. Save a draft, or change the line's tax code.", "error");
      return;
    }
    if (mode === "send" && !documentsAddUp) {
      goToStage(6);
      toast("The document lines do not add up to the total. Check the price step.", "error");
      return;
    }

    // 04a: the new operator is saved to Operators with status "Documents pending" together with the quote
    let savedNewOperator: OperatorRecord | null = null;
    if (newOpEnabled && draftOperator) {
      savedNewOperator = {
        ...draftOperator,
        id: `op-${Date.now()}`,
        createdAt: new Date().toISOString(),
        notes: `Added from quote ${versionLabel} · documents pending`
      };
      addOperator(savedNewOperator);
    }
    const newBooking = buildQuoteBooking(savedNewOperator, mode);

    // 01: the choices are saved on the account as defaults for next time
    const accountForDefaults = accounts.find((a) => a.id === activeAccount?.id);
    if (accountForDefaults) {
      updateAccount(accountForDefaults.id, {
        quoteDefaults: {
          authorisedOwnerId: selectedOwnerPerson?.id,
          isHandledByPa,
          assistantContactId: isHandledByPa ? paContactId || undefined : undefined,
          sendDocsTo,
          signsAgreement
        }
      });
    }

    setSaving(true);
    let persisted: any;
    try {
      persisted = await addBooking(newBooking);
    } catch (err: any) {
      setSaving(false);
      toast(err?.message || "The quote could not be saved. Nothing was sent.", "error");
      return;
    }
    // addBooking keeps a local copy when the server refuses it: nothing is sent in that case
    if (!persisted || persisted === newBooking) {
      setSaving(false);
      toast("The server did not save the quote, so nothing was sent. Check the connection and try again.", "error");
      return;
    }
    const savedId = String(persisted?.id || newBooking.id);
    const label = isBookingRevision ? versionLabel : formattedQuoteId.toUpperCase();

    if (typeof window !== "undefined") {
      sessionStorage.setItem("orbelo_selected_quote_id", savedId);
    }

    if (mode === "draft") {
      setSaving(false);
      toast(`Draft ${label} saved. Nothing was sent.`);
      router.push(isBookingRevision ? `/trips/${rootId}/revisions` : "/quotes");
      return;
    }

    const sent: string[] = [];
    const failed: string[] = [];

    // To the Curator: the request is marked quoted and the message lands on their request page.
    // A revision goes to the thread of the request the trip came from.
    const linkedRequest: any =
      sourceRequest ||
      (() => {
        const rid = String((sourceTrip as any)?.sourceAgentRequestId || "").toLowerCase();
        if (!rid) return undefined;
        return agentRequests.find(
          (r: any) => [r.id, r._id, r.requestNumber].some((x) => x && String(x).toLowerCase() === rid)
        );
      })() ||
      ((sourceTrip as any)?.sourceAgentRequestId ? { id: (sourceTrip as any).sourceAgentRequestId, agentName: (sourceTrip as any).agentName } : undefined);
    if (sourceRequest) {
      try {
        await Promise.resolve(updateAgentRequestStatus(sourceRequest.id, "completed", savedId, `Quoted → ${versionLabel}`));
      } catch {
        /* the status follows on the next refresh */
      }
    }
    if (linkedRequest) {
      if (sendToCurator) {
        try {
          await api.curatorInbox.reply(
            linkedRequest.requestNumber || linkedRequest.id,
            `${sourceTrip ? (isBookingRevision ? "Revised booking" : "Revised quote") : "Quote"} ${label} is ready for ${activeAccount?.name || leadPaxName}: ${displayLegs
              .map((l) => `${l.origin?.icao} → ${l.destination?.icao}`)
              .join(", ")} · total ${money(grandTotal)}.`
          );
          sent.push(linkedRequest.agentName || curatorName || "the Curator");
        } catch {
          failed.push("the Curator");
        }
      }
    } else if (sendToCurator && curatorName && sendMessage) {
      try {
        await Promise.resolve(
          sendMessage({
            channel: "broker_desk",
            recipientEmail: (sourceTrip as any)?.agentEmail,
            recipientName: curatorName,
            recipientRole: "agent",
            content: `Quote ${label} is ready · total ${money(grandTotal)}.`,
            tripNumber: versionLabel
          } as any)
        );
        sent.push(curatorName);
      } catch {
        failed.push("the Curator");
      }
    }

    // To the client by email (the quote PDF goes with it)
    if (sendToClient && !isBookingRevision) {
      try {
        await api.quotes.send(savedId, "client");
        sent.push(newBooking.client?.email || "the client");
      } catch (err: any) {
        failed.push(`the client by email (${err?.message || "email not sent"})`);
      }
    }

    // WhatsApp notice: opens WhatsApp with the message ready to send
    if (sendWhatsApp && typeof window !== "undefined") {
      const phone = String(newBooking.client?.phone || "").replace(/[^0-9]/g, "");
      if (phone) {
        const text = `Your charter quote ${label} is ready · total ${money(grandTotal)}. It has been sent to your email.`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
        sent.push("WhatsApp");
      } else {
        failed.push("WhatsApp (no phone number on the client)");
      }
    }

    setSaving(false);
    if (isBookingRevision) {
      toast(`Booking revision ${versionLabel} saved.${sent.length ? ` Sent to ${sent.join(", ")}.` : ""}`);
    } else if (sent.length) {
      toast(`Quote ${label} sent to ${sent.join(", ")}.`);
    } else {
      toast(`Quote ${label} saved.`);
    }
    if (failed.length) toast(`Not sent to ${failed.join("; ")}.`, "error");

    router.push(isBookingRevision ? `/trips/${rootId}/revisions` : "/quotes");
  };

  const selectedOperator = allOperators.find((op) => op.id === selectedOperatorId) || allOperators[0];
  const operatorName = selectedOperator?.tradingName || selectedOperator?.legalName || "";

  // ====================================================
  // STAGED LAYOUT · step list, right panel, review
  // ====================================================
  const accountPicked = accounts.some((a: any) => a.accountNumber === selectedAccountId || a.id === selectedAccountId);
  const groundCount = hasGroundTransport
    ? displayLegs.reduce((n, _l, i) => {
        const k = `leg-${i + 1}`;
        const g = groundTransfers[k];
        if (!groundLegsEnabled[k] || !g) return n;
        return n + (g.arrivalRequired ? 1 : 0) + (g.departureRequired ? 1 : 0);
      }, 0)
    : 0;
  const heliCount = hasHeliTransfer ? displayLegs.filter((_l, i) => heliLegsEnabled[`leg-${i + 1}`] && heliTransfers[`leg-${i + 1}`]).length : 0;
  const servicesWords = [
    groundCount ? `${groundCount} ground transfer${groundCount === 1 ? "" : "s"}` : !hasGroundTransport && serviceOptions.limousine ? "limousine" : "",
    heliCount ? `${heliCount} helicopter` : !hasHeliTransfer && serviceOptions.helicopter ? "helicopter" : "",
    serviceOptions.catering ? "catering" : "",
    serviceOptions.deicing ? "de-icing" : "",
    serviceOptions.carbonOffset ? "carbon offset" : "",
    ...customServices.map((c) => c.name.toLowerCase())
  ].filter(Boolean);

  const legOperatorOf = (leg: any) => allOperators.find((o) => o.id === leg.operatorId) || selectedOperator;
  const routeWord = (() => {
    if (!displayLegs.length) return "";
    if (tripType === "round_trip") return `${displayLegs[0].origin?.icao || ""} ⇄ ${displayLegs[0].destination?.icao || ""}`;
    return [displayLegs[0].origin?.icao, ...displayLegs.map((l) => l.destination?.icao)].filter(Boolean).join(" → ");
  })();
  const datesWord = (() => {
    const ds = displayLegs.map((l) => formatShortDate(l.flightDate)).filter(Boolean);
    if (!ds.length) return "";
    return ds.length === 1 ? ds[0] : `${ds[0]} – ${ds[ds.length - 1]}`;
  })();

  const stageSummary = (n: number): string => {
    switch (n) {
      case 1:
        return [activeAccount?.name, leadPaxName && leadPaxName !== activeAccount?.name ? leadPaxName : ""].filter(Boolean).join(" · ") || "Pick the client";
      case 2:
        return [routeWord, datesWord].filter(Boolean).join(" · ");
      case 3: {
        const acs = Array.from(new Set(displayLegs.map((l: any) => l.aircraft?.name).filter(Boolean)));
        const ops = Array.from(new Set(displayLegs.map((l: any) => legOperatorOf(l)?.tradingName || legOperatorOf(l)?.legalName).filter(Boolean)));
        return [acs.join(", "), ops.join(", ")].filter(Boolean).join(" · ");
      }
      case 4:
        return [
          `${paxCount} pax`,
          luggagePieces ? `${luggagePieces} bag${luggagePieces === 1 ? "" : "s"}` : "",
          hasPets && pets.length ? `${pets.length} pet${pets.length === 1 ? "" : "s"}` : ""
        ]
          .filter(Boolean)
          .join(" · ");
      case 5:
        return servicesWords.length ? servicesWords.join(", ") : "No services";
      case 6:
        return `Total ${money(grandTotal)}`;
      default: {
        const to = [sendToClient ? "client" : "", sendToCurator && (sourceRequest || curatorName) ? "Curator" : ""].filter(Boolean);
        return to.length ? `Send to ${to.join(" and ")}` : "Choose where it goes";
      }
    }
  };

  // Checks shown in the right panel; each points to the stage that fixes it
  const quoteWarnings: { stage: number; text: string }[] = [];
  if (!accountPicked) quoteWarnings.push({ stage: 1, text: sourceRequest ? `No account matches ${sourceRequest.companyName || sourceRequest.clientName || "the client"} yet. Pick or create it.` : "Pick the client account." });
  if (!leadPaxName.trim()) quoteWarnings.push({ stage: 1, text: "The Authorised Owner is missing." });
  displayLegs.forEach((l: any, i) => {
    if (!l.flightDate) quoteWarnings.push({ stage: 2, text: `Leg ${i + 1} has no date.` });
    if (l.origin?.icao && l.origin?.icao === l.destination?.icao) quoteWarnings.push({ stage: 2, text: `Leg ${i + 1} departs and arrives at the same airport.` });
    const seats = Number(l.seats || l.aircraft?.passengers || 0);
    if (seats && paxCount > seats) quoteWarnings.push({ stage: 3, text: `Leg ${i + 1}: ${paxCount} pax, but the ${l.aircraft?.name || "aircraft"} has ${seats} seats.` });
    const op = legOperatorOf(l);
    if (op && op.status && op.status !== "approved" && op.status !== "approved_with_conditions")
      quoteWarnings.push({ stage: 3, text: `Leg ${i + 1}: ${op.tradingName || op.legalName} has documents pending.` });
  });
  if (!(effectiveOperatorFlightCost > 0)) quoteWarnings.push({ stage: 3, text: "No buying price entered yet." });
  if (paxCount < 1) quoteWarnings.push({ stage: 4, text: "Add the number of passengers." });
  if (hasPets && pets.some((p) => !(Number(p.weightKg) > 0))) quoteWarnings.push({ stage: 4, text: "A pet has no weight." });
  if (groundCount > 0 && groundServicesTotal === 0) quoteWarnings.push({ stage: 5, text: "Ground transfers have no price (they print as Included)." });
  if (!documentsAddUp) quoteWarnings.push({ stage: 6, text: "The document lines do not add up to the total." });
  if (taxRulesState === "error") quoteWarnings.push({ stage: 6, text: "The tax table could not be loaded." });
  Array.from(new Set(taxPending.flatMap((t) => t.pending))).forEach((code) =>
    quoteWarnings.push({ stage: 6, text: `Tax row ${code} is to confirm by the adviser; no tax is charged for it and the quote cannot be sent yet.` })
  );
  if (sendToClient && !isBookingRevision && !activeAccount?.email) quoteWarnings.push({ stage: 7, text: "The client has no email address." });

  // Price step · Taxes card: each line with the rule found, the tax and a Change link (every change is logged)
  const changeTaxCode = (key: string, label: string, codes: string[] | null) => {
    const before = taxLinesComputed.find((t) => t.key === key);
    setTaxOverrides((prev) => {
      const next = { ...prev };
      if (codes && codes.length) next[key] = codes;
      else delete next[key];
      return next;
    });
    setTaxChangeLog((prev) => [
      ...prev,
      {
        at: new Date().toISOString(),
        by: currentUser?.name || currentUser?.email || "desk",
        line: label,
        from: before ? before.codes.join(" + ") || "none" : "none",
        to: codes && codes.length ? codes.join(" + ") : "automatic rule"
      }
    ]);
    setTaxChangeKey(null);
    toast(`Tax code changed on “${label}”.`);
  };
  const renderTaxesCard = () => (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-sm font-semibold text-slate-500">6</span>
          <h3 className="text-lg font-bold text-slate-900 m-0">Taxes</h3>
        </div>
        <span className="text-[12.5px] text-slate-500">Decided leg by leg from the departure and arrival countries · Settings → Taxes</span>
      </div>
      {taxRulesState === "loading" && <div className="text-[13px] text-slate-500">Loading the tax table…</div>}
      {taxRulesState === "error" && (
        <div className="text-[13px] text-amber-800">
          The tax table could not be loaded.{" "}
          <button type="button" className="underline" onClick={loadTaxRules}>
            Try again
          </button>
        </div>
      )}
      {taxRulesState === "ready" && (
        <>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="text-left py-2 pr-3">Line</th>
                <th className="text-right py-2 pr-3">Amount</th>
                <th className="text-left py-2 pr-3">Rule found</th>
                <th className="text-right py-2 pr-3">Tax</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {taxLinesComputed.map((t) => (
                <React.Fragment key={t.key}>
                  <tr className="border-b border-slate-100 align-top">
                    <td className="py-2 pr-3">{t.label}</td>
                    <td className="py-2 pr-3 text-right font-mono whitespace-nowrap">{money(t.base)}</td>
                    <td className={`py-2 pr-3 ${t.pending.length && t.base > 0 ? "text-amber-800" : "text-slate-600"}`}>
                      {t.rule}
                      {t.pending.length > 0 && t.base > 0 ? " · to confirm, not charged" : ""}
                    </td>
                    <td className="py-2 pr-3 text-right font-mono whitespace-nowrap">{money(t.amount)}</td>
                    <td className="py-2 text-right">
                      <button type="button" className="text-blue-700 hover:underline text-[12.5px]" onClick={() => setTaxChangeKey(taxChangeKey === t.key ? null : t.key)}>
                        Change
                      </button>
                    </td>
                  </tr>
                  {taxChangeKey === t.key && (
                    <tr className="bg-slate-50/80">
                      <td colSpan={5} className="py-2.5 px-2">
                        <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
                          <span className="text-slate-600">Tax code for this line:</span>
                          <select
                            className="border border-slate-300 rounded-md px-2 py-1 bg-white"
                            defaultValue={taxOverrides[t.key]?.[0] || ""}
                            onChange={(e) => changeTaxCode(t.key, t.label, e.target.value ? [e.target.value] : null)}
                          >
                            <option value="">Automatic (rule from the countries)</option>
                            {taxRules.map((r) => (
                              <option key={r.code} value={r.code}>
                                {r.code} · {r.jurisdiction} · {r.type === "EXEMPT" ? "exempt" : r.type === "OUTSIDE_SCOPE" ? "outside scope" : r.rateType === "per_pax" ? `${r.rate} per pax` : `${r.rate} %`}
                                {r.status !== "confirmed" ? " (to confirm)" : ""}
                              </option>
                            ))}
                          </select>
                          <button type="button" className="text-slate-500" onClick={() => setTaxChangeKey(null)}>
                            Close
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <div className="mt-3 text-[13px] space-y-1">
            {taxSummaryComputed.lines.map((l) => (
              <div key={`${l.label}-${l.rateLabel}`} className="flex justify-between gap-3">
                <span className="text-slate-600">
                  On the documents: {l.label} · {l.rateLabel}
                </span>
                <span className="font-mono">{money(l.amount)}</span>
              </div>
            ))}
            {taxSummaryComputed.wordings.length > 0 && <div className="text-[12px] text-slate-500">Wording printed: {taxSummaryComputed.wordings.join(" ")}</div>}
            <div className="flex justify-between gap-3 font-semibold text-slate-900 border-t border-slate-200 pt-1.5">
              <span>Taxes total</span>
              <span className="font-mono">{money(taxTotal)}</span>
            </div>
          </div>
          {taxChangeLog.length > 0 && (
            <details className="mt-3 text-[12px] text-slate-500">
              <summary className="cursor-pointer">Changes ({taxChangeLog.length})</summary>
              {taxChangeLog
                .slice()
                .reverse()
                .map((c, i) => (
                  <div key={i}>
                    {new Date(c.at).toLocaleString("en-GB")} · {c.by} · {c.line}: {c.from} → {c.to}
                  </div>
                ))}
            </details>
          )}
        </>
      )}
    </div>
  );

  const renderStageList = () => (
    <nav className="xl:sticky xl:top-6 bg-white border border-slate-200 rounded-xl p-2 shadow-2xs">
      {QB_STAGES.map(({ n, label }) => {
        const active = n === stage;
        const issues = quoteWarnings.filter((w) => w.stage === n).length;
        const done = !active && n <= stagesSeen && issues === 0;
        return (
          <button
            key={n}
            type="button"
            onClick={() => goToStage(n)}
            className={`w-full text-left rounded-lg px-3 py-2.5 flex gap-3 items-start transition-colors ${active ? "bg-[#0B1320] text-white" : "hover:bg-slate-50 text-slate-900"}`}
          >
            <span
              className={`mt-[1px] w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[12px] font-bold ${
                active ? "bg-[#C9A24A] text-[#0B1320]" : done ? "bg-emerald-600 text-white" : issues && n <= stagesSeen ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
              }`}
            >
              {done ? "✓" : issues && n <= stagesSeen && !active ? "!" : n}
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-semibold leading-tight">{label}</span>
              <span className={`block text-[12px] leading-snug mt-0.5 truncate ${active ? "text-slate-300" : "text-slate-500"}`} title={stageSummary(n)}>
                {stageSummary(n)}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );

  const charterSum = legPricingBreakdown.reduce((sum, l) => sum + l.charterPrice, 0);
  const renderRightPanel = () => (
    <aside className="xl:sticky xl:top-6 space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1">{isBookingRevision ? "Booking revision" : "Quote"}</div>
        <div className="text-[17px]">
          <IdMark id={isBookingRevision ? versionLabel : formattedQuoteId} />
        </div>
        {!isBookingRevision && <div className="text-[12px] text-slate-500 mt-0.5">Valid until {validUntil}</div>}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs text-[13px] space-y-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1">Running total</div>
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Charter price</span>
          <span className="font-mono">{money(charterSum)}</span>
        </div>
        {passengerFeesItemised && passengerFeesLineAtCost > 0 && (
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Passenger fees</span>
            <span className="font-mono">{money(passengerFeesLineAtCost)}</span>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Services</span>
          <span className="font-mono">{money(servicesTotal)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Taxes</span>
          <span className="font-mono">{taxRulesState === "ready" ? money(taxTotal) : "—"}</span>
        </div>
        <div className="flex justify-between gap-3 border-t border-slate-200 pt-1.5 font-semibold text-slate-900">
          <span>Total</span>
          <span className="font-mono">{money(grandTotal)}</span>
        </div>
        <div className="border-t border-dashed border-slate-200 pt-1.5 space-y-1 text-[12px]">
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Buying prices</span>
            <span className="font-mono">{money(effectiveOperatorFlightCost)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Company margin</span>
            <span className="font-mono">{money(companyMarginAmount)}</span>
          </div>
          {agentMarginAmount > 0 && (
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Curator mark-up</span>
              <span className="font-mono">{money(agentMarginAmount)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs text-[13px]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1.5">Warnings</div>
        {quoteWarnings.length === 0 ? (
          <div className="text-emerald-700">✓ Nothing to fix</div>
        ) : (
          <ul className="m-0 p-0 list-none space-y-1.5">
            {quoteWarnings.map((w, i) => (
              <li key={`${w.stage}-${i}`}>
                <button type="button" onClick={() => goToStage(w.stage)} className="text-left text-amber-800 hover:underline">
                  ▲ {w.text} <span className="text-slate-400">({w.stage})</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[13px] space-y-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1">Always visible</div>
        <div className="font-semibold text-slate-900">{activeAccount?.name || "No client yet"}</div>
        {leadPaxName && leadPaxName !== activeAccount?.name && <div className="text-slate-600">Owner: {leadPaxName}</div>}
        {routeWord && (
          <div className="text-slate-600">
            {routeWord}
            {datesWord ? ` · ${datesWord}` : ""}
          </div>
        )}
        <div className="text-slate-600">
          {paxCount} pax{hasPets && pets.length ? ` · ${pets.length} pet${pets.length === 1 ? "" : "s"}` : ""}
        </div>
        {sourceRequest && (
          <div className="text-slate-600 pt-1">
            From <IdMark id={sourceRequest.id} />
            {sourceRequest.agentName ? ` · ${sourceRequest.agentName}` : ""}
          </div>
        )}
        {sourceRequest && ((sourceRequest as any).notes || sourceRequest.specialRequests) && (
          <div className="text-slate-600 text-[12px] italic">“{(sourceRequest as any).notes || sourceRequest.specialRequests}”</div>
        )}
      </div>
    </aside>
  );

  const Toggle = ({ on, onChange, label, help }: { on: boolean; onChange: (v: boolean) => void; label: string; help: string }) => (
    <label className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-b-0 cursor-pointer">
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-slate-900">{label}</span>
        <span className="block text-[12.5px] text-slate-500 mt-0.5">{help}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${on ? "bg-[#0B1320]" : "bg-slate-300"}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </label>
  );

  const handleDownloadPdf = async (booking: Booking) => {
    if (downloading) return;
    setDownloading(true);
    try {
      await new Promise((r) => setTimeout(r, 60));
      const name = previewDoc === "quote" ? docQuoteNo(booking) : docAgreementNo(booking);
      const ok = await downloadDocumentAsPdf("qb-pdf-export", { fileName: `${name}.pdf` });
      if (ok) toast(`${name}.pdf downloaded.`);
      else toast("The PDF could not be made. Try again.", "error");
    } catch {
      toast("The PDF could not be made. Try again.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const renderReviewStage = () => {
    const booking = buildQuoteBooking(null, "send");
    const svcRows = docServiceRows(booking);
    const servicePage = docOptionsValue.servicesOneLine && svcRows.length > 0;
    const pageCount = previewDoc === "quote" ? (servicePage ? 2 : 1) : servicePage ? 3 : 2;
    const doc = previewDoc === "quote" ? <QuotationDoc booking={booking} /> : <CharterAgreementDoc booking={booking} />;
    const SCALE = 0.26;
    const legNums = displayLegs.map((_l, i) => i + 1);
    const legsLabel = legNums.length === 2 ? "both legs" : "all legs";
    const curatorTarget = sourceRequest?.agentName || curatorName;
    const clientEmail = activeAccount?.email || "";
    const clientPhone = (activeAccount as any)?.phone || "";
    return (
      <div className="space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
          <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
            <div className="flex items-baseline gap-2.5">
              <span className="font-mono text-sm font-semibold text-slate-500">7</span>
              <h3 className="text-lg font-bold text-slate-900 m-0">Review and send</h3>
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-[13px]">
              {(["quote", "agreement"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setPreviewDoc(d)}
                  className={`px-3 py-1.5 rounded-md font-semibold ${previewDoc === d ? "bg-[#0B1320] text-white" : "text-slate-600 hover:text-slate-900"}`}
                >
                  {d === "quote" ? "Quote" : "Charter agreement"}
                </button>
              ))}
            </div>
          </div>

          {/* Page thumbnails of the document exactly as it prints */}
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            title="Open full size"
            className="block overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-3 hover:border-slate-400 transition-colors max-w-full"
          >
            <div style={{ width: (794 + 24) * pageCount * SCALE, height: 1123 * SCALE }} className="overflow-hidden pointer-events-none">
              <div
                style={{ transform: `scale(${SCALE})`, transformOrigin: "top left", width: (794 + 24) * pageCount }}
                className="[&>div]:flex [&>div]:gap-6 [&_.doc-page]:mb-0 [&_.doc-page]:shrink-0 [&_.doc-page]:w-[794px] [&_.doc-page]:max-h-[1123px] [&_.doc-page]:overflow-hidden"
              >
                {doc}
              </div>
            </div>
          </button>
          <div className="text-[12.5px] text-slate-500 mt-2">
            {pageCount} page{pageCount === 1 ? "" : "s"} · click to open full size.{" "}
            {displayLegs.length > 1 &&
              (allLegsSameAircraft
                ? `Same aircraft on ${legsLabel}: printed once as “Aircraft · legs 1–${displayLegs.length}”.`
                : "Different aircraft per leg: each leg prints its own aircraft.")}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-1">
            <Toggle
              on={docOptionsValue.showPricePerLeg}
              onChange={(v) => setDocPricePerLeg(v)}
              label="Show price per leg"
              help={`One charter line per leg instead of one line for the trip. ${allLegsSameAircraft ? "Off by default when every leg uses the same aircraft" : "On by default because the aircraft differ"}; applies to the quote and the agreement.`}
            />
            <Toggle
              on={docServicesOneLine}
              onChange={setDocServicesOneLine}
              label="Additional services as one line"
              help="Page 1 shows one line for all services; the details print on the service page."
            />
            <Toggle
              on={docServicePrices}
              onChange={setDocServicePrices}
              label="Show service prices on page 2"
              help="On by default. When off, page 2 lists the same services without prices or a subtotal; page 1 keeps the one-line services total. Saved with this version and used on the quote and the agreement."
            />
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => handleDownloadPdf(booking)}
              disabled={downloading}
              className="bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50"
            >
              {downloading ? "Making the PDF…" : `Download PDF · ${previewDoc === "quote" ? "quote" : "agreement"}`}
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
          <h4 className="text-[15px] font-bold text-slate-900 m-0 mb-3">Send</h4>
          <div className="space-y-2.5 text-[14px]">
            {!isBookingRevision && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 w-4 h-4 accent-[#0B1320]" checked={sendToClient} onChange={(e) => setSendToClient(e.target.checked)} />
                <span>
                  <span className="font-semibold">To client</span>
                  <span className="text-slate-500"> · email{clientEmail ? ` to ${clientEmail}` : " (no email on the account)"}, preferred channel</span>
                </span>
              </label>
            )}
            {(sourceRequest || curatorName) && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 w-4 h-4 accent-[#0B1320]" checked={sendToCurator} onChange={(e) => setSendToCurator(e.target.checked)} />
                <span>
                  <span className="font-semibold">To Curator</span>
                  <span className="text-slate-500">
                    {" "}
                    · {curatorTarget}
                    {sourceRequest ? ", on their request page" : ""}
                  </span>
                </span>
              </label>
            )}
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1 w-4 h-4 accent-[#0B1320]" checked={sendWhatsApp} onChange={(e) => setSendWhatsApp(e.target.checked)} />
              <span>
                <span className="font-semibold">WhatsApp notice</span>
                <span className="text-slate-500"> · {clientPhone ? `opens WhatsApp to ${clientPhone} with the message ready` : "no phone number on the account"}</span>
              </span>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => goToStage(6)}
              className="bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm"
            >
              Back
            </button>
            <div className="flex items-center gap-2.5">
              {!isBookingRevision && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleCompleteQuotation("draft")}
                  className="bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50"
                >
                  Save draft
                </button>
              )}
              <button
                type="button"
                disabled={saving || !documentsAddUp}
                title={documentsAddUp ? undefined : "The document lines do not add up to the total"}
                onClick={() => handleCompleteQuotation("send")}
                className="bg-[#0B1320] hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : isBookingRevision ? "Save booking revision" : "Send quote"}
              </button>
            </div>
          </div>
        </div>

        {/* Full-size copy used for the PDF (off screen) */}
        <div aria-hidden style={{ position: "fixed", left: -12000, top: 0, width: 820 }}>
          <div id="qb-pdf-export">{previewDoc === "quote" ? <QuotationDoc booking={booking} /> : <CharterAgreementDoc booking={booking} />}</div>
        </div>

        {previewOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto" onClick={() => setPreviewOpen(false)}>
            <div className="max-w-[860px] mx-auto my-8 px-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-end mb-2">
                <button type="button" onClick={() => setPreviewOpen(false)} className="bg-white rounded-lg px-3 py-1.5 text-sm font-semibold shadow">
                  Close
                </button>
              </div>
              {doc}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Revising: wait for the version being revised instead of showing a blank builder
  if (effectiveReviseId && !sourceTrip) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-600">
        {isBookingsLoading || bookings.length === 0 ? (
          "Loading the quote to revise…"
        ) : (
          <>
            The quote <span className="font-mono">{effectiveReviseId}</span> could not be found.{" "}
            <Link href="/quotes" className="text-blue-600 hover:underline">
              Back to quotes
            </Link>
          </>
        )}
      </div>
    );
  }

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
            New quote · <HeaderId id={tripDisplayId} affix={0.52} /> · Aircraft photos
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
      {/* Page header · breadcrumb, title and actions */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-slate-500 mb-2">
            <Link
              href={isBookingRevision ? "/bookings" : "/quotes"}
              className="hover:text-slate-800 transition-colors"
            >
              {isBookingRevision ? "Bookings" : "Quotes"}
            </Link>
            <span>/</span>
            <span className="inline-flex items-baseline gap-1">
              {reviseTripId || effectiveReviseId ? (
                isBookingRevision ? "Revise booking" : "Revise quote"
              ) : sourceRequest ? (
                <>
                  New quote from <IdMark id={sourceRequest.id} />
                </>
              ) : (
                "New quote"
              )}
            </span>
            <span>/</span>
            <span>{`${stage} ${QB_STAGES[stage - 1]?.label || ""}`}</span>
          </div>
          <h1 className="text-[28px] leading-tight font-bold text-slate-900 m-0 flex flex-wrap items-baseline gap-x-2">
            <span>
              {effectiveReviseId ? (isBookingRevision ? "Revise booking" : "Revise quote") : "New quote"}
            </span>
            <span className="text-slate-400">·</span>
            <IdMark id={isBookingRevision ? versionLabel : formattedQuoteId} large />
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Link
            href={isBookingRevision ? `/trips/${rootId}/revisions` : "/quotes"}
            className="bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            Cancel
          </Link>
          {!isBookingRevision && (
            <button
              type="button"
              disabled={saving}
              onClick={() => handleCompleteQuotation("draft")}
              className="bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              Save draft
            </button>
          )}
          <button
            type="button"
            onClick={() => goToStage(7)}
            className="bg-[#0B1320] hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            Review and send
          </button>
        </div>
      </div>

      {/* Built from the Curator's request */}
      {sourceRequest && (
        <div className="bg-[#EEF4FD] border border-[#C9DBF5] rounded-xl px-5 py-4 text-sm text-slate-800">
          <div className="font-bold text-slate-900 inline-flex items-baseline gap-1">
            Built from <IdMark id={sourceRequest.id} />
          </div>
          <p className="m-0 mt-1.5 leading-relaxed">
            Everything {sourceRequest.agentName || "the Curator"} keyed in (client, legs and times, aircraft per leg, passengers,
            luggage, pets, services and margin) is already filled in. Edit only what needs changing.
          </p>
          {((sourceRequest as any).notes || sourceRequest.specialRequests) && (
            <p className="m-0 mt-1.5 leading-relaxed">
              <span className="font-semibold">Curator notes:</span> {(sourceRequest as any).notes || sourceRequest.specialRequests}
            </p>
          )}
        </div>
      )}

      {/* Staged layout: steps on the left, the current stage, the running total on the right */}
      <div className="grid grid-cols-1 xl:grid-cols-[230px_minmax(0,1fr)_290px] gap-5 items-start">
        {renderStageList()}
        <div className="min-w-0 space-y-5">
      {/* Builder rows */}
      <div className="space-y-6">
        {/* ===== STEP 01 · CLIENT, AUTHORISED OWNER AND ASSISTANT ===== */}
        <div id="qb-step-01" data-qb-step="01" className={`grid grid-cols-1 gap-6 scroll-mt-6 ${stageCls(1)}`}>
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-2xs">
            <div className="flex items-baseline gap-2.5 mb-5">
              <span className="font-mono text-sm font-semibold text-slate-500">1</span>
              <h3 className="text-lg font-bold text-slate-900 m-0">Client, Authorised Owner and assistant</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
              {/* LEFT · Client account search (self-start: the grid cell must not stretch, or the list opens far below the field) */}
              <div className="relative self-start" ref={accountDropdownRef}>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1.5">
                  Client account
                </label>
                <input
                  type="text"
                  value={isAccountDropdownOpen ? accountSearchQuery : activeAccount?.name || ""}
                  onFocus={() => {
                    setAccountSearchQuery("");
                    setIsAccountDropdownOpen(true);
                  }}
                  onChange={(e) => {
                    setAccountSearchQuery(e.target.value);
                    if (!isAccountDropdownOpen) setIsAccountDropdownOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsAccountDropdownOpen(false);
                      (e.target as HTMLInputElement).blur();
                    }
                    if (e.key === "Enter" && filteredAccounts[0]) {
                      e.preventDefault();
                      handleSelectAccount(filteredAccounts[0]);
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  placeholder="Search by account name, number, city or person"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                />

                {isAccountDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-40 overflow-hidden">
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {filteredAccounts.map((acc) => {
                        const isSelected = acc.accountNumber === selectedAccountId;
                        const personCount = acc.authorizedPersons?.length || 0;
                        const trips = getAccountTripCount(acc);
                        const city = getAccountCity(acc);
                        const curator = formatCuratorShort(acc.agentName);
                        return (
                          <button
                            key={acc.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelectAccount(acc)}
                            className={`w-full text-left px-4 py-3 transition-colors ${
                              isSelected ? "bg-slate-50" : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-[17px] font-bold text-slate-900">{acc.name}</span>
                              <span className="font-mono text-[13px] text-slate-500">{acc.accountNumber}</span>
                            </div>
                            <div className="text-[13px] text-slate-500 mt-0.5">
                              {[
                                city,
                                `${personCount} authorised ${personCount === 1 ? "person" : "persons"}`,
                                `${trips} ${trips === 1 ? "trip" : "trips"}`,
                                curator ? `Curator ${curator}` : ""
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          </button>
                        );
                      })}
                      {filteredAccounts.length === 0 && (
                        <div className="px-4 py-4 text-sm text-slate-500">
                          No account matches &ldquo;{accountSearchQuery}&rdquo;.
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-3 border-t border-slate-100">
                      <Link
                        href="/accounts"
                        className="text-[15px] text-[#1F5FAE] underline underline-offset-2 hover:text-[#174A88]"
                      >
                        + New account
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT · Owner, assistant and document routing */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1.5">
                    Authorised Owner (person on the account)
                  </label>
                  <div className="relative">
                    <select
                      value={selectedOwnerPerson?.id || (accountPeople.length === 0 ? "__none__" : "__request__")}
                      onChange={(e) => handleSelectOwnerPerson(e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-300 rounded-lg pl-3.5 pr-9 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 cursor-pointer"
                    >
                      {accountPeople.length === 0 && (
                        <option value="__none__">No authorised persons on this account yet</option>
                      )}
                      {accountPeople.length > 0 && !selectedOwnerPerson && (
                        <option value="__request__" disabled>
                          {leadPaxName ? `${leadPaxName} · not listed on the account` : "Choose a person"}
                        </option>
                      )}
                      {accountPeople.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <p className="text-[13px] text-slate-500 mt-1.5 mb-0 leading-snug">
                    Only people listed as authorised persons on the account can be chosen.{" "}
                    <Link
                      href={activeAccount?.id ? `/accounts/${activeAccount.id}` : "/accounts"}
                      className="text-[#1F5FAE] underline underline-offset-2 hover:text-[#174A88]"
                    >
                      Add authorised person
                    </Link>
                  </p>
                </div>

                <label className="flex items-center gap-2.5 text-[15px] text-slate-900 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isHandledByPa}
                    onChange={(e) => {
                      setIsHandledByPa(e.target.checked);
                      if (e.target.checked) setSendDocsTo("both");
                    }}
                    className="w-4 h-4 rounded border-slate-300 accent-[#1F6FEB] cursor-pointer"
                  />
                  <span>Handled by an assistant or representative (PA)</span>
                </label>

                {isHandledByPa && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1.5">
                      Assistant / representative
                    </label>
                    <div className="relative">
                      <select
                        value={paContactId || "__manual__"}
                        onChange={(e) => handleSelectAssistant(e.target.value)}
                        className="w-full appearance-none bg-white border border-slate-300 rounded-lg pl-3.5 pr-9 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 cursor-pointer truncate"
                      >
                        {assistantCandidates.map((a) => (
                          <option key={a.id} value={a.id}>
                            {[a.name, a.role, a.phone, a.email].filter(Boolean).join(" · ")}
                          </option>
                        ))}
                        <option value="__manual__">Someone else · type the details</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {paContactId === "__manual__" && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                        <input
                          type="text"
                          value={paName}
                          onChange={(e) => setPaName(e.target.value)}
                          placeholder="Name"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
                        />
                        <input
                          type="tel"
                          value={paPhone}
                          onChange={(e) => setPaPhone(e.target.value)}
                          placeholder="Mobile"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
                        />
                        <input
                          type="email"
                          value={paEmail}
                          onChange={(e) => setPaEmail(e.target.value)}
                          placeholder="Email"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1.5">
                    Send quotes, contracts and invoices to
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {(["owner", "assistant", "both"] as const).map((opt) => {
                      const disabled = !isHandledByPa && opt !== "owner";
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSendDocsTo(opt)}
                          className={`px-4 py-2 rounded-full border text-[15px] transition-all ${
                            sendDocsTo === opt
                              ? "bg-[#0B1320] text-white border-[#0B1320]"
                              : "bg-white text-slate-800 border-slate-300 hover:border-slate-500"
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          {opt === "owner" ? "Owner" : opt === "assistant" ? "Assistant" : "Both"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1.5">
                    Signs the charter agreement
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {(["owner", "assistant"] as const).map((opt) => {
                      const disabled = !isHandledByPa && opt === "assistant";
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSignsAgreement(opt)}
                          className={`px-4 py-2 rounded-full border text-[15px] transition-all ${
                            signsAgreement === opt
                              ? "bg-[#0B1320] text-white border-[#0B1320]"
                              : "bg-white text-slate-800 border-slate-300 hover:border-slate-500"
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          {opt === "owner" ? "Owner" : "Assistant (with written authority)"}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[13px] text-slate-500 mt-2 mb-0 leading-snug">
                    Assistant signing needs an authority letter on file (upload on the Contact record).
                  </p>
                </div>
              </div>
            </div>

            {/* Billing · Curator · From request */}
            <div className="mt-5 bg-slate-50 rounded-lg px-5 py-3.5 flex flex-wrap gap-x-10 gap-y-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Billing</div>
                <div className="text-[15px] text-slate-900 mt-0.5">{billingLine}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Curator</div>
                <div className="text-[15px] text-slate-900 mt-0.5">
                  {curatorName ? curatorName.replace(/\s*\(.*\)\s*$/, "") : "No Curator · direct client"}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">From request</div>
                <div className="text-[15px] text-slate-900 mt-0.5">
                  {sourceRequest ? <IdMark id={sourceRequest.id} /> : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Notes column (shown in the right panel in the staged layout) */}
          <div className="hidden">
            <StepNote title="Rules">
              <p className="m-0">Search by account name, number, city or person.</p>
              <p className="m-0">Authorised Owner is always a person (Contact), never the company.</p>
              <p className="m-0">The assistant gets documents but signs only with written authority.</p>
              <p className="m-0">Choices are saved on the account as defaults for next time.</p>
            </StepNote>
            <StepNote title="Status">
              <p className="m-0">MOD-05</p>
            </StepNote>
          </div>
        </div>

        {/* ===== STAGES 2 (legs), 3 (aircraft) and 4 (passengers) ===== */}
        <div className={`grid grid-cols-1 gap-6 ${stage >= 2 && stage <= 4 ? "" : "hidden"}`}>
          <div className="space-y-6 min-w-0">
          {/* SECTION 2: ITINERARY */}
          <div id="qb-step-02" data-qb-step="02" className={`${stageCls(2)} scroll-mt-6 bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4`}>
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                  2
                </span>
                <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                  Legs and times
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
          <div id="qb-step-03" data-qb-step="03" className={`${stageCls(4)} scroll-mt-6 bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4`}>
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                4
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
                  onChange={(e) => {
                    setHasPets(e.target.checked);
                    if (e.target.checked && pets.length === 0) setPets([newPetRow()]);
                  }}
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
                          <th className="pb-1.5 px-2">NAME</th>
                          <th className="pb-1.5 px-2">SPECIES</th>
                          <th className="pb-1.5 px-2">BREED</th>
                          <th className="pb-1.5 px-2 w-24">WEIGHT (KG)</th>
                          <th className="pb-1.5 px-2">TRAVELS</th>
                          <th className="pb-1.5 px-2">DOCUMENTS</th>
                          <th className="pb-1.5 px-2">DOC NO.</th>
                          <th className="pb-1.5 px-2">NOTES</th>
                          <th className="pb-1.5 pl-2 text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {pets.map((pet, idx) => (
                          <tr key={pet.id} className="align-middle">
                            <td className="py-2 pr-2 font-mono font-bold text-gray-600">{idx + 1}</td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={pet.name || ""}
                                onChange={(e) => updatePet(pet.id, { name: e.target.value })}
                                placeholder="e.g. Toby"
                                className="bg-white border border-gray-200 rounded px-2 py-1 text-xs w-24"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <select
                                value={pet.species}
                                onChange={(e) => {
                                  updatePet(pet.id, { species: e.target.value });
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
                                  updatePet(pet.id, { breed: e.target.value });
                                }}
                                placeholder="Breed..."
                                className="bg-white border border-gray-200 rounded px-2 py-1 text-xs w-28"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                min={0}
                                step={0.1}
                                value={pet.weightKg}
                                onChange={(e) => {
                                  updatePet(pet.id, { weightKg: Math.max(0, parseFloat(e.target.value) || 0) });
                                }}
                                className="bg-white border border-gray-200 rounded px-2 py-1 text-xs w-16 font-mono"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <select
                                value={pet.travels}
                                onChange={(e) => {
                                  updatePet(pet.id, { travels: e.target.value });
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
                                  updatePet(pet.id, { documents: e.target.value });
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
                                value={pet.documentNumber || ""}
                                onChange={(e) => updatePet(pet.id, { documentNumber: e.target.value.toUpperCase() })}
                                placeholder="e.g. ES-0098812"
                                className="bg-white border border-gray-200 rounded px-2 py-1 text-xs w-28 font-mono"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={pet.notes}
                                onChange={(e) => {
                                  updatePet(pet.id, { notes: e.target.value });
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
                        setPets([...pets, newPetRow()])
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
          <div id="qb-step-04" data-qb-step="04" className={`${stageCls(3)} scroll-mt-6 bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4`}>
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                  3
                </span>
                <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                  Aircraft and operators
                </h3>
              </div>
              <button
                type="button"
                onClick={() => openOperatorSearch(sameAircraftOnAllLegs ? "all" : 0)}
                className="btn-secondary text-xs flex items-center gap-1.5 py-1 px-2.5"
              >
                <Search className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Search or add operator</span>
              </button>
            </div>

            {operatorFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{operatorFeedback}</span>
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

                const currentLegOp = allOperators.find((o) => o.id === legItem.operatorId) || selectedOperator || allOperators[0];
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
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">
                            OPERATOR · INTERNAL, NEVER ON DOCUMENTS
                          </label>
                          <button
                            type="button"
                            onClick={() => openOperatorSearch(sameAircraftOnAllLegs ? "all" : idx)}
                            className="text-[11px] text-blue-600 font-semibold hover:underline"
                          >
                            Search or add operator
                          </button>
                        </div>
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
                              {allOperators.map((op) => (
                                <option key={op.id} value={op.id}>
                                  {op.tradingName || op.legalName}
                                  {op.id === NEW_OPERATOR_DRAFT_ID ? " · new, documents pending" : ` · AOC ${op.aocNumber}`}
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
              Passenger fees for this leg are added on the Price step (6).
            </div>
          </div>

          </div>

        </div>

        {/* ===== STEP 04a · OPERATOR SEARCH AND NEW OPERATOR ===== */}
        <div id="qb-step-04a" data-qb-step="04a" className={`space-y-4 scroll-mt-6 ${stageCls(3)}`}>
          {renderLegStrip(`${paxCount} pax · ${(displayLegs[0]?.aircraft as any)?.categoryLabel || selectedAircraft.categoryLabel || "Aircraft TBC"}`)}

          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-2xs min-w-0">
              <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-sm font-semibold text-slate-500">3</span>
                  <h3 className="text-lg font-bold text-slate-900 m-0">Operator search and new operator</h3>
                </div>
                {displayLegs.length > 1 && !sameAircraftOnAllLegs && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-slate-500 mr-1">For</span>
                    {displayLegs.map((leg, legIdx) => (
                      <button
                        key={`op-target-${legIdx}`}
                        type="button"
                        onClick={() => setOpTargetLeg(legIdx)}
                        title={`${leg.origin?.icao || ""} → ${leg.destination?.icao || ""}`}
                        className={`px-2.5 py-1 rounded-full border font-semibold transition-all ${
                          opTargetLeg === legIdx
                            ? "bg-[#0B1320] text-white border-[#0B1320]"
                            : "bg-white text-slate-700 border-slate-300 hover:border-slate-500"
                        }`}
                      >
                        Leg {legIdx + 1}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setOpTargetLeg("all")}
                      className={`px-2.5 py-1 rounded-full border font-semibold transition-all ${
                        opTargetLeg === "all"
                          ? "bg-[#0B1320] text-white border-[#0B1320]"
                          : "bg-white text-slate-700 border-slate-300 hover:border-slate-500"
                      }`}
                    >
                      All legs
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* AIR CARRIER / OPERATOR */}
                <div className="min-w-0">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1.5">
                    Air carrier / operator
                  </label>
                  <input
                    type="text"
                    value={opSearchQuery}
                    onChange={(e) => setOpSearchQuery(e.target.value)}
                    placeholder="Name, AOC number or country"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  />
                  {opSearchQuery.trim().length > 0 && (
                    <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden bg-white">
                      {operatorSearchResults.map((op) => {
                        const qualified = op.status === "approved" || op.status === "approved_with_conditions";
                        const isChosen = targetLegOperatorIds.includes(op.id);
                        return (
                          <button
                            key={op.id}
                            type="button"
                            onClick={() => applyOperatorToTarget(op.id)}
                            className={`w-full text-left px-4 py-2.5 border-b border-slate-100 last:border-b-0 flex flex-wrap items-center gap-x-2 gap-y-1 transition-colors ${
                              isChosen ? "bg-slate-50" : "hover:bg-slate-50"
                            }`}
                          >
                            <span className="text-[17px] font-bold text-slate-900">{op.tradingName || op.legalName}</span>
                            <span className="font-mono text-[13px] text-slate-500">
                              {getOperatorCountryCode(op)} · {op.aocNumber ? `AOC ${op.aocNumber}` : "AOC —"}
                            </span>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                qualified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
                              }`}
                            >
                              {qualified ? "Qualified" : "Documents pending"}
                            </span>
                            {isChosen && <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-auto" />}
                          </button>
                        );
                      })}
                      <div className="px-4 py-3 bg-[#FFF8E8] text-[15px] text-slate-800 leading-snug">
                        {operatorSearchResults.length > 0 ? "No other match" : "No match"} for &ldquo;{opSearchQuery.trim()}…&rdquo;.{" "}
                        <strong>Operator not in database?</strong> Turn on the switch below.
                      </div>
                    </div>
                  )}
                </div>

                {/* AIRCRAFT MODEL */}
                <div className="min-w-0">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1.5">
                    Aircraft model
                  </label>
                  <input
                    type="text"
                    value={acSearchQuery}
                    onChange={(e) => setAcSearchQuery(e.target.value)}
                    placeholder="e.g. phenom 300"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  />
                  {acSearchQuery.trim().length > 0 && (
                    <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden bg-white">
                      <div className="px-4 py-2 text-[13px] text-slate-500 border-b border-slate-100">
                        &ldquo;{acSearchQuery.trim()}&rdquo; · exact and starts-with matches first
                      </div>
                      {aircraftSearchResults.map(({ aircraft, rank }) => {
                        const isChosen = targetLegAircraftIds.includes(aircraft.id);
                        return (
                          <button
                            key={aircraft.id}
                            type="button"
                            onClick={() => applyAircraftToTarget(aircraft)}
                            className={`w-full text-left px-4 py-2.5 border-b border-slate-100 last:border-b-0 flex flex-wrap items-baseline gap-x-2 transition-colors ${
                              isChosen ? "bg-slate-100" : "hover:bg-slate-50"
                            }`}
                          >
                            <span className="text-[17px] font-bold text-slate-900">{aircraft.name}</span>
                            <span className="text-[13px] text-slate-500">
                              {AIRCRAFT_CATEGORY_SHORT[aircraft.category] || aircraft.categoryLabel} ·{" "}
                              {rank >= 3 ? "similar name" : `${aircraft.passengers} pax`}
                            </span>
                          </button>
                        );
                      })}
                      {aircraftSearchResults.length === 0 && (
                        <div className="px-4 py-3 text-sm text-slate-500">No aircraft type matches. Check the spelling.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <label className="mt-5 flex items-center gap-2.5 text-[15px] text-slate-900 cursor-pointer select-none w-fit">
                <input
                  type="checkbox"
                  checked={newOpEnabled}
                  onChange={(e) => handleToggleNewOperator(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 accent-[#1F6FEB] cursor-pointer"
                />
                <span>Operator not in database</span>
              </label>

              {newOpEnabled && (
                <div className="mt-4 border border-[#F1E3C4] bg-[#FFFCF5] rounded-xl p-5 space-y-4">
                  <div className="text-[15px] font-bold text-slate-900">New operator · saved to Operators when the quote is saved</div>

                  <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,0.75fr)_minmax(0,1.1fr)] gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1.5">
                        Operator name
                      </label>
                      <input
                        type="text"
                        value={newOpLegalName}
                        onChange={(e) => {
                          setNewOpLegalName(e.target.value);
                          if (newOpError) setNewOpError("");
                        }}
                        placeholder="e.g. Skyline Executive Aviation"
                        className={`w-full bg-white border rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 ${
                          newOpError ? "border-red-400" : "border-slate-300"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1.5">
                        AOC number
                      </label>
                      <input
                        type="text"
                        value={newOpAoc}
                        onChange={(e) => setNewOpAoc(e.target.value.toUpperCase())}
                        placeholder="e.g. GB-2291"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1.5">
                        Issuing authority / country
                      </label>
                      <div className="relative">
                        <select
                          value={newOpAuthority}
                          onChange={(e) => setNewOpAuthority(e.target.value)}
                          className="w-full appearance-none bg-white border border-slate-300 rounded-lg pl-3.5 pr-9 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-500 cursor-pointer"
                        >
                          <option value="">Choose authority</option>
                          {AOC_AUTHORITIES.map((a) => (
                            <option key={a.label} value={a.label}>
                              {a.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="w-40">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1.5">
                      Base (ICAO)
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={newOpBaseIcao}
                      onChange={(e) => setNewOpBaseIcao(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                      placeholder="EGGW"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,0.85fr)_minmax(0,1fr)] gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1.5">
                        Ops contact email
                      </label>
                      <input
                        type="email"
                        value={newOpEmail}
                        onChange={(e) => setNewOpEmail(e.target.value)}
                        placeholder="ops@operator.example"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1.5">
                        24h phone
                      </label>
                      <input
                        type="tel"
                        value={newOpPhone}
                        onChange={(e) => setNewOpPhone(e.target.value)}
                        placeholder="+44 20 ..."
                        className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
                      />
                    </div>
                  </div>

                  {newOpError && <p className="text-sm text-red-600 m-0">{newOpError}</p>}

                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-2">
                      Documents (9-point check)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {NEW_OPERATOR_DOCUMENTS.map((doc) => (
                        <span
                          key={doc}
                          className="text-[13px] font-semibold text-amber-800 bg-[#FCEFD2] px-2.5 py-1 rounded-full"
                        >
                          {doc} · pending
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#FCEFD2] rounded-lg px-4 py-3 text-[15px] text-amber-900 leading-snug">
                    <strong>Documents pending.</strong> The quote can be sent as &ldquo;subject to operator approval&rdquo;. The
                    trip cannot be booked until the MD marks the operator qualified. [Rule to confirm]
                  </div>
                </div>
              )}

              <p className="text-[13px] text-slate-500 mt-5 mb-0">
                Opens from a leg&apos;s operator field (step 04). Aircraft, buying price and photos are entered on that leg.
              </p>
            </div>

            <div className="hidden">
              <StepNote title="Search">
                <p className="m-0">Operators: name, AOC number, country.</p>
                <p className="m-0">Aircraft: exact and starts-with matches first, then similar names; filter by category.</p>
              </StepNote>
              <StepNote title="New operator">
                <p className="m-0">Saved with status &lsquo;Documents pending&rsquo;.</p>
                <p className="m-0">Flag shows on the quote, the trip and the Operators list until all nine checks are done.</p>
              </StepNote>
              <StepNote title="Status">
                <p className="m-0">NF-08, MOD-05, MOD-08</p>
              </StepNote>
            </div>
          </div>
        </div>

        {/* ===== STAGE 5 · SERVICES ===== */}
        <div className={`grid grid-cols-1 gap-6 ${stageCls(5)}`}>
          <div className="space-y-6 min-w-0">
          {/* SECTION 5: SERVICES · HELICOPTER TRANSFER (Image 6) */}
          <div id="qb-step-05" data-qb-step="05" className={`scroll-mt-6 bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-4`}>
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                  5
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
                    destination: "",
                    clientPrice: 0,
                    luggageDetails: "",
                    specialRequests: ""
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

                      {/* 2 · Helicopter details - Dynamically adapts format based on transferType */}
                      {curHeli.transferType === "arrival" && (
                        <div className="space-y-3 bg-blue-50/40 p-3.5 rounded-lg border border-blue-100">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-800">
                              2 · Arrival helicopter details (Airport → Helicopter destination)
                            </span>
                            <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded">
                              On arrival
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                                DEPARTURE AIRPORT (FLIGHT ARRIVAL)
                              </label>
                              <input
                                type="text"
                                value={curHeli.depArrLocation || `${destCode} Airport`}
                                onChange={(e) => updateHeliField("depArrLocation", e.target.value)}
                                placeholder={`${destCode} Airport`}
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                                TRANSFER DESTINATION
                              </label>
                              <input
                                type="text"
                                value={curHeli.destination}
                                onChange={(e) => updateHeliField("destination", e.target.value)}
                                placeholder=""
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
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
                      )}

                      {curHeli.transferType === "departure" && (
                        <div className="space-y-3 bg-amber-50/40 p-3.5 rounded-lg border border-amber-100">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-800">
                              2 · Departure helicopter details (Helicopter destination → Airport)
                            </span>
                            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                              On departure
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                                HELICOPTER PICKUP LOCATION
                              </label>
                              <input
                                type="text"
                                value={curHeli.destination || ""}
                                onChange={(e) => updateHeliField("destination", e.target.value)}
                                placeholder=""
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                                DESTINATION AIRPORT (FLIGHT DEPARTURE)
                              </label>
                              <input
                                type="text"
                                value={curHeli.depArrLocation || `${origCode} Airport`}
                                onChange={(e) => updateHeliField("depArrLocation", e.target.value)}
                                placeholder={`${origCode} Airport`}
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                            <div>
                              <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                                PASSENGERS
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={curHeli.passengers}
                                onChange={(e) => updateHeliField("passengers", parseInt(e.target.value, 10) || 1)}
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs font-mono font-bold text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                                PREFERRED HELICOPTER TYPE
                              </label>
                              <select
                                value={curHeli.prefType}
                                onChange={(e) => updateHeliField("prefType", e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                              >
                                <option value="Twin-engine, e.g. AW109 or similar">Twin-engine, e.g. AW109 or similar</option>
                                <option value="Single-engine, e.g. Bell 407">Single-engine, e.g. Bell 407</option>
                                <option value="Heavy twin, e.g. Sikorsky S-76">Heavy twin, e.g. Sikorsky S-76</option>
                                <option value="Airbus H145 / EC145">Airbus H145 / EC145</option>
                              </select>
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
                                  className="w-full bg-white border border-gray-300 rounded-md pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-gray-900 shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {curHeli.transferType === "both" && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                            <span className="text-[11px] font-bold text-gray-800">
                              2 · Dual Helicopter Transfers (Both Departure & Arrival Legs)
                            </span>
                            <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              Both transfers configured
                            </span>
                          </div>

                          {/* Segment A: Departure transfer */}
                          <div className="bg-amber-50/30 border border-amber-200/70 rounded-lg p-3 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-800 text-[10px] font-mono flex items-center justify-center font-bold">A</span>
                                Departure Transfer: Helicopter Destination → Departure Airport
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                                  PICKUP LOCATION
                                </label>
                                <input
                                  type="text"
                                  value={curHeli.departurePickup || ""}
                                  onChange={(e) => updateHeliField("departurePickup", e.target.value)}
                                  placeholder=""
                                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                                  DESTINATION AIRPORT
                                </label>
                                <input
                                  type="text"
                                  value={curHeli.departureAirport || `${origCode} Airport`}
                                  onChange={(e) => updateHeliField("departureAirport", e.target.value)}
                                  placeholder={`${origCode} Airport`}
                                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                                  DEPARTURE HELI PRICE
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-gray-400">€</span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={curHeli.departurePrice ?? 1200}
                                    onChange={(e) => {
                                      const depP = parseFloat(e.target.value) || 0;
                                      const arrP = curHeli.arrivalPrice ?? 1200;
                                      setHeliTransfers((prev) => ({
                                        ...prev,
                                        [legKey]: { ...curHeli, departurePrice: depP, clientPrice: depP + arrP }
                                      }));
                                    }}
                                    className="w-full bg-white border border-gray-300 rounded-md pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-gray-900 shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Segment B: Arrival transfer */}
                          <div className="bg-blue-50/30 border border-blue-200/70 rounded-lg p-3 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 text-[10px] font-mono flex items-center justify-center font-bold">B</span>
                                Arrival Transfer: Arrival Airport → Helicopter Destination
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                                  DEPARTURE AIRPORT
                                </label>
                                <input
                                  type="text"
                                  value={curHeli.arrivalAirport || `${destCode} Airport`}
                                  onChange={(e) => updateHeliField("arrivalAirport", e.target.value)}
                                  placeholder={`${destCode} Airport`}
                                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                                  TRANSFER DESTINATION
                                </label>
                                <input
                                  type="text"
                                  value={curHeli.arrivalDestination || ""}
                                  onChange={(e) => updateHeliField("arrivalDestination", e.target.value)}
                                  placeholder=""
                                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                                  ARRIVAL HELI PRICE
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-gray-400">€</span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={curHeli.arrivalPrice ?? 1200}
                                    onChange={(e) => {
                                      const arrP = parseFloat(e.target.value) || 0;
                                      const depP = curHeli.departurePrice ?? 1200;
                                      setHeliTransfers((prev) => ({
                                        ...prev,
                                        [legKey]: { ...curHeli, arrivalPrice: arrP, clientPrice: depP + arrP }
                                      }));
                                    }}
                                    className="w-full bg-white border border-gray-300 rounded-md pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-gray-900 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Shared Specs & Combined Total */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
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
                                CLIENT PRICE (TOTAL FOR BOTH)
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
                      )}

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

                {/* Write-up on the quote preview card (Image 6 & Image 3) */}
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
                        destination: "",
                        prefType: "Twin-engine, e.g. AW109 or similar",
                        passengers: paxCount,
                        clientPrice: 0
                      };
                      if (h.transferType === "both") {
                        const depPick = h.departurePickup || "";
                        const depApt = h.departureAirport || `${origCode} Airport`;
                        const arrApt = h.arrivalAirport || `${destCode} Airport`;
                        const arrDest = h.arrivalDestination || h.destination || "";
                        return (
                          <div key={legKey}>
                            Leg {lIdx + 1} · helicopter on both · Departure: {depPick} → {depApt} & Arrival: {arrApt} → {arrDest} · {h.prefType} · {h.passengers} pax · € {h.clientPrice.toLocaleString()}
                          </div>
                        );
                      } else if (h.transferType === "departure") {
                        const depPick = h.destination || "";
                        const depApt = h.depArrLocation || `${origCode} Airport`;
                        return (
                          <div key={legKey}>
                            Leg {lIdx + 1} · helicopter on departure · {depPick} → {depApt} · {h.prefType} · {h.passengers} pax · € {h.clientPrice.toLocaleString()}
                          </div>
                        );
                      } else {
                        const arrApt = h.depArrLocation || `${destCode} Airport`;
                        const arrDest = h.destination || "";
                        return (
                          <div key={legKey}>
                            Leg {lIdx + 1} · helicopter on arrival · {arrApt} → {arrDest} · {h.prefType} · {h.passengers} pax · € {h.clientPrice.toLocaleString()}
                          </div>
                        );
                      }
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
                  5
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
                    arrivalDropoff: lIdx === 0 ? "" : "",
                    arrivalVehicle: "Sedan",
                    arrivalPrice: 0,
                    departureRequired: true,
                    departurePickup: lIdx === 0 ? "" : "",
                    departureVehicle: "Sedan",
                    departurePrice: 0,
                    passengers: paxCount || 5,
                    specialRequests: ""
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
                        arrivalDropoff: "",
                        arrivalVehicle: "Luxury",
                        arrivalPrice: 0,
                        departureRequired: false,
                        departurePickup: "",
                        departureVehicle: "Sedan",
                        departurePrice: 0,
                        passengers: paxCount
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

          </div>

        </div>

        {/* ===== STEP 06 · PRICE ===== */}
        <div id="qb-step-06" data-qb-step="06" className={`space-y-4 scroll-mt-6 ${stageCls(6)}`}>
          {renderLegStrip(`${paxCount} pax · ${tripType === "round_trip" ? "Round trip" : tripType === "multi_leg" ? "Multi-leg" : "One way"}`)}
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-6 min-w-0">
          {/* SECTION 6: BUYING PRICES, PASSENGER FEES & MARGINS (Image 1 Screen Design) */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-6">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--wf)] text-[var(--ink)]">
                6
              </span>
              <h3 className="text-base font-bold font-display text-[var(--ink)] m-0">
                Buying prices (from step 3)
              </h3>
            </div>

            {/* 1. Buying prices table per leg */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-2xs space-y-2.5 font-mono text-xs">
              {displayLegs.map((leg, lIdx) => {
                const op = allOperators.find((o) => o.id === leg.operatorId);
                const opName = op?.tradingName || op?.legalName || (lIdx === 0 ? "Alpine Executive" : "Sahel Jet Services");
                const acName = leg.aircraft?.name || (lIdx === 0 ? "Challenger 350" : "Citation Latitude");
                const price = leg.buyingPrice || Math.round(effectiveOperatorFlightCost / (displayLegs.length || 1));
                return (
                  <div key={leg.id || lIdx} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-b-0">
                    <span className="font-bold text-gray-900 w-16">Leg {lIdx + 1}</span>
                    <span className="text-gray-600 font-sans font-medium text-xs flex-1 text-center sm:text-left px-2">
                      {opName} · {acName}
                    </span>
                    <span className="font-bold text-gray-900 font-mono text-right">
                      {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 font-bold">
                <span className="text-gray-900 w-16">Trip</span>
                <span className="text-gray-500 font-sans font-normal text-xs flex-1 text-center sm:text-left px-2">
                  Sum of legs · sets the margin tier
                </span>
                <span className="text-gray-900 font-mono text-right">
                  {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} {effectiveOperatorFlightCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* 2. Passenger fees section */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-gray-900 font-display">
                    Passenger fees
                  </span>
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={passengerFeesItemised}
                      onChange={(e) => setPassengerFeesItemised(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-gray-900 relative"></div>
                    <span className="text-xs text-gray-500 font-sans font-medium">itemise</span>
                  </label>
                </div>
              </div>

              {passengerFeesItemised && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    {/* APPLIES TO · follows the number of legs on the trip */}
                    <div className={displayLegs.length > 3 ? "sm:col-span-12" : "sm:col-span-4"}>
                      <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                        APPLIES TO
                      </label>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {displayLegs.map((leg, legIdx) => {
                          const isOn = !passengerFeeAppliesToAll && passengerFeeLegsSorted.includes(legIdx);
                          const routeTitle = `${leg.origin?.icao || ""} → ${leg.destination?.icao || ""}`;
                          return (
                            <button
                              key={leg.id || `fee-leg-${legIdx}`}
                              type="button"
                              title={routeTitle}
                              onClick={() => handleTogglePassengerFeeLeg(legIdx)}
                              className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                                isOn
                                  ? "bg-gray-900 text-white border-gray-900 shadow-2xs"
                                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                              }`}
                            >
                              Leg {legIdx + 1}
                            </button>
                          );
                        })}
                        {displayLegs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleTogglePassengerFeeLeg("all")}
                            className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                              passengerFeeAppliesToAll
                                ? "bg-gray-900 text-white border-gray-900 shadow-2xs"
                                : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                            }`}
                          >
                            {displayLegs.length === 2 ? "Both" : "All legs"}
                          </button>
                        )}
                      </div>
                      {displayLegs.length > 2 && (
                        <p className="text-[10px] text-gray-500 font-sans mt-1 mb-0">
                          Pick one or more legs. The fee is charged once on each leg picked.
                        </p>
                      )}
                    </div>

                    {/* DESCRIPTION */}
                    <div className={displayLegs.length > 3 ? "sm:col-span-12" : "sm:col-span-8"}>
                      <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                        DESCRIPTION
                      </label>
                      <input
                        type="text"
                        value={passengerFeesDesc}
                        onChange={(e) => setPassengerFeesDesc(e.target.value)}
                        placeholder="Abuja (DNAA) departure passenger charge"
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                    {/* AMOUNT */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                        AMOUNT
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-gray-400">
                          {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "}
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={passengerFeesAmount}
                          onChange={(e) => setPassengerFeesAmount(parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-gray-300 rounded-md pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-gray-900 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* CHARGED */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                        CHARGED
                      </label>
                      <div className="inline-flex rounded-md shadow-2xs border border-gray-300 p-0.5 bg-gray-50 w-full">
                        <button
                          type="button"
                          onClick={() => setPassengerFeesCharged("pax")}
                          className={`flex-1 py-1 text-xs font-semibold rounded text-center transition-all ${passengerFeesCharged === "pax" ? "bg-gray-900 text-white shadow-2xs" : "text-gray-700 hover:text-gray-900"}`}
                        >
                          Per pax
                        </button>
                        <button
                          type="button"
                          onClick={() => setPassengerFeesCharged("flat")}
                          className={`flex-1 py-1 text-xs font-semibold rounded text-center transition-all ${passengerFeesCharged === "flat" ? "bg-gray-900 text-white shadow-2xs" : "text-gray-700 hover:text-gray-900"}`}
                        >
                          Flat
                        </button>
                      </div>
                    </div>

                    {/* PAX */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                        PAX
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={passengerFeesPax}
                        onChange={(e) => setPassengerFeesPax(parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs font-mono font-bold text-gray-900 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                      />
                    </div>

                    {/* LINE AT COST */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                        LINE AT COST
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-xs font-mono font-bold text-gray-900 shadow-2xs text-right">
                        {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} {passengerFeesLineAtCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-500 font-sans m-0 leading-relaxed pt-1">
                    Added on top of the buying price; margins apply to them internally; documents show each fee at cost, and its margin sits in that leg&apos;s charter price.
                  </p>
                </div>
              )}
            </div>

            {/* 3. Margins on the whole trip */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-2xs space-y-3.5">
              <span className="font-bold text-sm text-gray-900 font-display block border-b border-gray-100 pb-2">
                Margins on the whole trip
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* COMPANY MARGIN */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">
                    COMPANY MARGIN
                  </label>
                  <div className="text-xs font-semibold text-gray-800">
                    {companyMarginTierPct} % · trip above € 35k (tier from Settings) = {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} {Math.round(totalCostBase * companyMarginTierPct / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>

                  {/* Override toggle & currency amount input */}
                  <div className="pt-1.5 space-y-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={companyMarginOverride}
                        onChange={(e) => setCompanyMarginOverride(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-gray-900 relative"></div>
                      <span className="text-xs text-gray-700 font-sans font-semibold">Override</span>
                    </label>

                    {companyMarginOverride && (
                      <div className="relative animate-in fade-in duration-150">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-gray-400">
                          {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "}
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={50}
                          value={companyMarginOverrideAmount}
                          onChange={(e) => setCompanyMarginOverrideAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                          placeholder="Amount, e.g. € 3,500.00"
                          className="w-full bg-white border border-gray-300 rounded-md pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-gray-900 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}
                    <p className="text-[10px] text-gray-500 font-sans m-0">
                      Type an amount instead of the tier. No reason needed.
                    </p>
                  </div>
                </div>

                {/* CURATOR MARK-UP */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">
                    CURATOR MARK-UP
                  </label>
                  <div className="text-xs font-semibold text-gray-800">
                    {agentMarginTierPct} % · {activeAccount?.agentName || "M. Vance"} (range 5–12 %) = {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} {Math.round((totalCostBase + companyMarginAmount) * agentMarginTierPct / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>

                  {/* Override toggle & currency amount input */}
                  <div className="pt-1.5 space-y-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={agentMarginOverride}
                        onChange={(e) => setAgentMarginOverride(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-gray-900 relative"></div>
                      <span className="text-xs text-gray-700 font-sans font-semibold">Override</span>
                    </label>

                    {agentMarginOverride && (
                      <div className="relative animate-in fade-in duration-150">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-gray-400">
                          {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "}
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={50}
                          value={agentMarginOverrideAmount}
                          onChange={(e) => setAgentMarginOverrideAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                          placeholder="Amount, e.g. € 5,000.00"
                          className="w-full bg-white border border-gray-300 rounded-md pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-gray-900 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}
                    <p className="text-[10px] text-gray-500 font-sans m-0 leading-relaxed">
                      Both margins are spread over the legs at the same percentage, so each leg carries its share in proportion to its buying price.
                    </p>
                  </div>
                </div>
              </div>

              {/* Currency & Valid Until controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                    CURRENCY
                  </label>
                  <div className="relative">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as any)}
                      className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-2xs appearance-none pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CHF">CHF</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
                    VALID UNTIL
                  </label>
                  <input
                    type="text"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    placeholder="16 Nov 18:00 LT"
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 4. Services on the quote (client prices) */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-2xs space-y-2.5">
              <span className="font-bold text-sm text-gray-900 font-display block border-b border-gray-100 pb-2">
                Services on the quote (client prices)
              </span>

              <div className="space-y-2 text-xs font-sans">
                {/* Ground Transport / Limousine */}
                {(hasGroundTransport || serviceOptions.limousine) && (
                  <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-b-0">
                    <span className="text-gray-800">
                      VIP limousine · leg 1 on arrival {destAirport?.icao || "DNAA"} · SUV · {paxCount || 5} pax
                    </span>
                    <span className="font-mono font-bold text-gray-900">
                      {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} {(hasGroundTransport ? groundServicesTotal : limousinePrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {/* Catering */}
                {serviceOptions.catering && (
                  <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-b-0">
                    <span className="text-gray-800">
                      Catering · VIP menu 1 · both legs
                    </span>
                    <span className="font-sans font-semibold text-gray-600">
                      {cateringPrice > 0
                        ? `${currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} ${cateringPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "Included"}
                    </span>
                  </div>
                )}

                {/* Helicopter Transfer */}
                {(hasHeliTransfer || serviceOptions.helicopter) && (
                  <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-b-0">
                    <span className="text-gray-800">
                      Helicopter transfer · {hasHeliTransfer ? "configured per flight legs" : "VIP connector"}
                    </span>
                    <span className="font-mono font-bold text-gray-900">
                      {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} {(hasHeliTransfer ? heliServicesTotal : helicopterPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {/* De-icing */}
                {serviceOptions.deicing && (
                  <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-b-0">
                    <span className="text-gray-800">De-icing insurance (at reservation)</span>
                    <span className="font-mono font-bold text-gray-900">
                      {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} {deicingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {/* Carbon Offset */}
                {serviceOptions.carbonOffset && (
                  <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-b-0">
                    <span className="text-gray-800">Carbon offset (neutral)</span>
                    <span className="font-mono font-bold text-gray-900">
                      {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} {carbonOffsetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {/* Custom Services */}
                {customServices.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-b-0">
                    <span className="text-gray-800">{c.name} · {c.details}</span>
                    <span className="font-mono font-bold text-gray-900">
                      {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} {c.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}

                {!hasGroundTransport && !serviceOptions.limousine && !serviceOptions.catering && !hasHeliTransfer && !serviceOptions.helicopter && !serviceOptions.deicing && !serviceOptions.carbonOffset && customServices.length === 0 && (
                  <div className="text-gray-400 italic py-1">No optional services selected</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Internal Build & What the Documents Show (the staged layout shows these in the right panel) */}
        <div className="hidden">
          <div className="space-y-4 lg:sticky lg:top-6">
            {/* Card 1: Internal build (admin only) */}
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
                <h4 className="text-sm font-bold font-display text-[var(--ink)] m-0">
                  Internal build
                </h4>
                <span className="font-mono text-[10px] text-gray-500 font-semibold px-1.5 py-0.5 rounded bg-gray-100">
                  admin only
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {displayLegs.map((leg, lIdx) => {
                  const price = leg.buyingPrice || Math.round(effectiveOperatorFlightCost / (displayLegs.length || 1));
                  return (
                    <div key={`int-leg-${lIdx}`} className="flex justify-between">
                      <span className="text-[var(--muted)]">Leg {lIdx + 1} buying price</span>
                      <span className="font-medium text-[var(--ink)]">
                        {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}

                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Passenger fees at cost</span>
                  <span className="font-medium text-[var(--ink)]">
                    {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} {passengerFeesLineAtCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">
                    {companyMarginOverride ? "Company margin (Override)" : `Company margin ${companyMarginTierPct} %`}
                  </span>
                  <span className="font-medium text-[var(--ink)]">
                    {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} {companyMarginAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">
                    {agentMarginOverride ? "Curator mark-up (Override)" : `Curator mark-up ${agentMarginTierPct} %`}
                  </span>
                  <span className="font-medium text-[var(--ink)]">
                    {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} {agentMarginAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Services</span>
                  <span className="font-medium text-[var(--ink)]">
                    {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} {servicesTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="pt-2 border-t border-[var(--line)] flex justify-between font-bold text-sm text-[var(--ink)]">
                  <span>Client total</span>
                  <span>
                    {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} {clientTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: What the documents show */}
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5 space-y-3.5 shadow-sm">
              <div className="border-b border-[var(--line)] pb-2.5">
                <h4 className="text-sm font-bold font-display text-[var(--ink)] m-0">
                  What the documents show
                </h4>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {legPricingBreakdown.map((lb) => (
                  <div key={`doc-leg-${lb.legNumber}`} className="flex justify-between">
                    <span className="text-[var(--muted)]">Charter price · leg {lb.legNumber}</span>
                    <span className="font-medium text-[var(--ink)]">
                      {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} {lb.charterPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}

                {passengerFeesItemised && passengerFeesLineAtCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">
                      Passenger fees · {passengerFeeLegsLabel} · {passengerFeesCharged === "pax" ? `${passengerFeesPax} × ${currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF"} ${passengerFeesAmount.toFixed(2)}` : "flat"}{passengerFeeLegsSorted.length > 1 ? ` × ${passengerFeeLegsSorted.length} legs` : ""}
                    </span>
                    <span className="font-medium text-[var(--ink)]">
                      {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} {passengerFeesLineAtCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {(hasGroundTransport || serviceOptions.limousine) && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">VIP limousine · leg 1</span>
                    <span className="font-medium text-[var(--ink)]">
                      {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} {(hasGroundTransport ? groundServicesTotal : limousinePrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {hasHeliTransfer && heliServicesTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Helicopter transfer</span>
                    <span className="font-medium text-[var(--ink)]">
                      {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} {heliServicesTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">VAT (per tax advice)</span>
                  <span className="font-medium text-[var(--ink)]">
                    {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} 0.00
                  </span>
                </div>

                <div className="pt-2 border-t border-[var(--line)] flex justify-between font-bold text-sm text-[var(--ink)]">
                  <span>Total</span>
                  <span>
                    {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} {clientTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Lines Add Up Banner */}
                <div className="pt-2">
                  <div className={`p-2.5 rounded-lg border text-[11px] font-sans ${documentsAddUp ? "bg-emerald-50/70 border-emerald-200 text-emerald-900" : "bg-amber-50 border-amber-200 text-amber-900"}`}>
                    <div className="font-semibold flex items-center gap-1.5">
                      <span>✓ Lines add up to the total. Card +3.5 %: {currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "CHF "} {cardAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1 leading-normal">
                      Same lines on the quote and the agreement. If they do not add up, &quot;Complete&quot; is blocked.
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => handleCompleteQuotation("send")}
                  disabled={!documentsAddUp}
                  className="w-full btn-primary text-xs justify-center py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    {isBookingRevision
                      ? `Complete Booking Revision (${versionLabel})`
                      : sourceRequest
                      ? `Complete and send to Curator (${versionLabel})`
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
                  <span>Save draft (No Version)</span>
                </button>
              </div>
            </div>

            {/* Card 3: STATUS (Matching Image 1) */}
            <div className="p-3.5 bg-gray-50/70 rounded-xl border border-[var(--line)] space-y-1 font-mono text-[10px] text-gray-500">
              <span className="font-bold text-gray-600 uppercase tracking-wider block mb-1">
                STATUS
              </span>
              <div>MOD-05 margin override</div>
              <div>MOD-09 documents add up</div>
              <div>NF-21 passenger fees</div>
              <div>NF-22 price per leg</div>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>

          {stage === 6 && renderTaxesCard()}
          {stage === 7 && renderReviewStage()}

          {stage < 7 && (
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => goToStage(stage - 1)}
                disabled={stage === 1}
                className="bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm disabled:opacity-40"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => goToStage(stage + 1)}
                className="bg-[#0B1320] hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm"
              >
                Continue to {stage + 1} {QB_STAGES[stage]?.label}
              </button>
            </div>
          )}
        </div>
        {renderRightPanel()}
      </div>
    </div>
  );
}

/**
 * Everything the printed documents show, worked out from the saved booking and Settings.
 * Prices always add up: every line is rounded to the cent and the last charter line takes the
 * remaining cent, so the lines equal the total the client is charged.
 */
import type { Aircraft, AppSettings, Booking, FlightLeg } from "@/types/aviation";
import { getAirportTimezone } from "@/lib/aviationTimezones";
import { calculateDistanceNm } from "@/lib/pricingCalculator";

export const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
export const pad3 = (n?: number | string) => String(n || 1).padStart(3, "0");

const SYMBOL: Record<string, string> = { EUR: "€", USD: "$", GBP: "£", CHF: "CHF" };
/** "€ 31,363.20" · negatives "– € 250.00" */
export function docMoney(n: number, currency = "EUR"): string {
  const v = round2(n);
  const s = `${SYMBOL[currency] || currency} ${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return v < 0 ? `– ${s}` : s;
}

/** Accepts ISO dates, "dd.mm.yyyy" and Date. */
export function parseDocDate(v?: string | Date | null): Date | null {
  if (!v) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  const s = String(v).trim();
  const g = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ ,T]+(\d{1,2}):(\d{2}))?/);
  if (g) {
    const d = new Date(Number(g[3]), Number(g[2]) - 1, Number(g[1]), Number(g[4] || 12), Number(g[5] || 0));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T12:00:00` : s);
  return Number.isNaN(d.getTime()) ? null : d;
}
/** "14 Nov 2026" */
export const fmtDate = (v?: string | Date | null) => {
  const d = parseDocDate(v);
  return d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
};
/** "Tue 24 Nov" */
export const fmtDay = (v?: string | Date | null, withYear = false) => {
  const d = parseDocDate(v);
  if (!d) return "";
  return d
    .toLocaleDateString("en-GB", withYear ? { weekday: "short", day: "numeric", month: "short", year: "numeric" } : { weekday: "short", day: "2-digit", month: "short" })
    .replace(/,/g, "");
};
/** "03 Dec 2026, 16:00" */
export const fmtStamp = (v?: string | Date | null) => {
  const d = parseDocDate(v);
  if (!d) return "";
  return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
};

/* ───────────── document numbers ───────────── */

export function tripToken(b: Partial<Booking>): string {
  const raw = String(b.tripId || b.tripNumber || b.quoteId || (b as any).quoteReference || b.id || "");
  const m = raw.match(/([A-Z]{2}\d{3,6})/i);
  return m ? m[1].toUpperCase() : raw.replace(/^(booking|trip|tri|quo)-/i, "").split("-")[0].toUpperCase();
}
export const versionOf = (b: Partial<Booking>) => pad3(b.quoteVersion || 1);
export const quoteNo = (b: Partial<Booking>) => `QUO-${tripToken(b)}-${versionOf(b)}`;
export const agreementNo = (b: Partial<Booking>) => `CA-${tripToken(b)}-${versionOf(b)}`;
export const briefNo = (b: Partial<Booking>) => `FB-${tripToken(b)}-${versionOf(b)}`;
export const tripNo = (b: Partial<Booking>) => `TRI-${tripToken(b)}`;

/* ───────────── parties ───────────── */

export interface Party {
  name: string;
  attn: string;
  lines: string[];
  account: string;
  email: string;
  phone: string;
}

export function clientParty(b: Booking): Party {
  const c: any = b.client || {};
  const name = c.companyName || c.fullName || "";
  const person = b.authorisedOwnerName || (c.companyName ? c.fullName : "") || "";
  const title = c.title || c.position || "";
  return {
    name,
    attn: person ? `${person}${title ? `, ${title}` : ""}` : "",
    lines: [c.streetAddress, c.cityPostalCountry].filter((x: string) => x && String(x).trim()),
    account: b.accountNumber || c.accountNumber || "",
    email: c.email || "",
    phone: c.phone || ""
  };
}

/** The Curator who sent the request, or the company desk when there is none. */
export function representative(b: Booking, users: any[] = [], company?: AppSettings["company"]) {
  if (b.agentName || b.agentEmail) {
    const u = users.find((x) => x?.email && b.agentEmail && String(x.email).toLowerCase() === String(b.agentEmail).toLowerCase());
    return {
      name: (u && u.name) || String(b.agentName || "").replace(/\s*\(.*\)\s*$/, ""),
      email: b.agentEmail || (u && u.email) || "",
      phone: (u && u.phone) || (b as any).agentPhone || ""
    };
  }
  return { name: company?.representativeName || "", email: company?.email || "", phone: company?.phone || "" };
}

/* ───────────── legs ───────────── */

const liveLegs = (b: Booking) => (b.legs || []).filter((l) => !l.isCancelled);

const DEFAULT_KTAS: Record<string, number> = {
  turboprop: 280,
  piston: 180,
  "entry-level": 380,
  light: 400,
  "super-light": 420,
  midsize: 430,
  "super-midsize": 460,
  heavy: 470,
  large: 470,
  "ultra-long-range": 480,
  "vip-airliner": 450
};
const toMin = (t?: string) => {
  const m = String(t || "").match(/(\d{1,2})[:h.]?\s*(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
const hhmm = (mins: number) => {
  const m = ((Math.round(mins) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
const parseDur = (t?: string) => {
  const m = String(t || "").match(/(\d+)\s*h\s*(\d+)?/i);
  return m ? Number(m[1]) * 60 + Number(m[2] || 0) : null;
};
export const fmtDuration = (mins?: number | null) => (mins && mins > 0 ? `${Math.floor(mins / 60)} h ${String(Math.round(mins % 60)).padStart(2, "0")}` : "");

/** Block time estimate from the great-circle distance and the aircraft's cruise speed (+25 min taxi, climb, descent). */
export function estimateLegMinutes(origin: any, destination: any, aircraft?: Partial<Aircraft> | null): number | null {
  const o = origin?.coordinates;
  const d = destination?.coordinates;
  if (!o || !d || !Number.isFinite(o.lat) || !Number.isFinite(d.lat)) return null;
  const nm = calculateDistanceNm(o.lat, o.lng, d.lat, d.lng) * 1.05;
  const parsed = parseInt(String(aircraft?.cruiseSpeed || "").replace(/[^0-9]/g, ""), 10);
  const ktas = parsed > 100 && parsed < 700 ? parsed : DEFAULT_KTAS[String(aircraft?.category || "")] || 430;
  return Math.round((nm / ktas) * 60 + 25);
}

/** Legs saved by older quote screens carry these made-up times. */
const PLACEHOLDER_TIMES = new Set(["1h 45m", "1h 30m"]);

export interface LegTiming {
  dep: string;
  arr: string;
  minutes: number | null;
  dayOffset: number;
  arrivalDate: Date | null;
}

/** Departure, arrival (local) and block time of a leg; computed when the leg has no real arrival yet. */
export function legTiming(leg: FlightLeg, aircraft?: Partial<Aircraft> | null): LegTiming {
  const dep = (leg.departureTimeLocal || "").replace(/\s*h$/, "");
  const depMin = toMin(dep);
  const tzDiff = getAirportTimezone(leg.destination || null).utcOffsetHours - getAirportTimezone(leg.origin || null).utcOffsetHours;
  const trusted =
    (typeof leg.flightTimeMinutes === "number" && leg.flightTimeMinutes > 0) ||
    leg.arrivalEdited ||
    leg.isDurationOverridden ||
    (leg.flightTimeFormatted && !PLACEHOLDER_TIMES.has(leg.flightTimeFormatted));
  let minutes: number | null = null;
  if (trusted) {
    minutes =
      (typeof leg.flightTimeMinutes === "number" && leg.flightTimeMinutes > 0 ? leg.flightTimeMinutes : null) ??
      (leg.manualDurationMinutes || null) ??
      parseDur(leg.flightTimeFormatted);
  }
  if (!minutes) minutes = estimateLegMinutes(leg.origin, leg.destination, aircraft);
  let arr = "";
  let dayOffset = 0;
  if (depMin !== null && minutes) {
    const arrAbs = depMin + minutes + tzDiff * 60;
    dayOffset = Math.floor(arrAbs / 1440);
    arr = hhmm(arrAbs);
    if (trusted && leg.arrivalEdited && toMin(leg.arrivalTimeLocal) !== null) arr = hhmm(toMin(leg.arrivalTimeLocal)!);
  } else if (trusted && leg.arrivalTimeLocal) {
    arr = leg.arrivalTimeLocal.replace(/\s*h$/, "");
  }
  const dd = parseDocDate(leg.flightDate);
  const arrivalDate = dd ? new Date(dd.getTime() + dayOffset * 86400000) : null;
  return { dep: depMin !== null ? hhmm(depMin) : dep, arr, minutes, dayOffset, arrivalDate };
}

export interface AircraftView {
  name: string;
  category: string;
  built: string;
  refurbished: string;
  seats: string;
  lavatory: string;
  lavatoryShort: string;
  smoking: string;
  exterior: string;
  cabin: string;
  registration: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  turboprop: "Turboprop",
  piston: "Piston",
  "entry-level": "Very light jet",
  light: "Light jet",
  "super-light": "Super light jet",
  midsize: "Midsize",
  "super-midsize": "Super midsize",
  heavy: "Heavy",
  large: "Heavy",
  "ultra-long-range": "Ultra long range",
  "vip-airliner": "VIP airliner"
};

/** The aircraft flying a leg: the leg's own choice from the quote, else the trip aircraft. */
export function legAircraft(b: Booking, leg: FlightLeg, index: number): AircraftView {
  const spec: any = (leg as any).aircraftSpec || {};
  const base: any = b.aircraft || {};
  const op = (b.legOperators || []).find((o) => o.legNumber === (leg.legNumber || index + 1));
  const sameAsTrip = !spec.name && (!leg.aircraftType || leg.aircraftType === base.name) && (!op?.aircraftName || op.aircraftName === base.name);
  const name = spec.name || leg.aircraftType || op?.aircraftName || base.name || "";
  const src: any = sameAsTrip ? base : spec;
  const category = spec.categoryLabel || spec.category || (sameAsTrip ? base.categoryLabel || CATEGORY_LABEL[base.category] : "") || "";
  const lavOn = src.lavatoryOnBoard ?? src.toilette;
  const lavType = String(src.lavatoryType || (lavOn ? "Enclosed" : "")).toLowerCase();
  return {
    name,
    category: CATEGORY_LABEL[category] || category,
    built: String(src.yearOfMake || src.yearOfManufacture || ""),
    refurbished: String(src.yearOfRefurbishment || ""),
    seats: String(src.seats || src.passengers || ""),
    lavatory: lavOn === undefined ? "" : lavOn ? `Yes, ${lavType || "enclosed"}` : "No",
    lavatoryShort: lavOn === undefined ? "" : lavOn ? `lavatory ${lavType || "enclosed"}` : "no lavatory",
    smoking: src.smokingCabin === undefined ? "" : src.smokingCabin ? "Smoking permitted" : "Non-smoking",
    exterior: spec.exteriorPhoto || (index === 0 || sameAsTrip ? b.aircraftCustomImages?.exterior || base.imageExterior : "") || "",
    cabin: spec.cabinPhoto || (index === 0 || sameAsTrip ? b.aircraftCustomImages?.interior || base.imageInterior : "") || "",
    registration: leg.aircraftRegistration || (sameAsTrip ? base.registration : "") || ""
  };
}

export const cityOf = (a: any) => String((a && (a.city || a.name)) || "").split(/[\/,(]/)[0].trim();
export const placeOf = (a: any) => String((a && (a.name || a.city)) || "").replace(/\s+(International\s+)?Airport$/i, "").trim();

/* ───────────── prices ───────────── */

export interface PriceLine {
  label: string;
  amount: number;
  included?: boolean;
}
export interface DocPricing {
  currency: string;
  legs: { legNumber: number; index: number; leg: FlightLeg; price: number }[];
  charterTotal: number;
  passengerFees: PriceLine[];
  services: PriceLine[];
  vat: number;
  total: number;
  card: number;
  cardFeePercent: number;
}

/** Charter price per leg, passenger fees, services, VAT: lines that add up exactly to the total charged. */
export function documentPricing(b: Booking, cardFeePercent = 3.5): DocPricing {
  const p: any = b.pricing || {};
  const currency = p.currency || "EUR";
  const total = round2(p.totalFlightPrice);
  const vat = round2(p.vatAmount);
  const legs = liveLegs(b);

  const feeItems = (b.passengerFeeItems || []).filter((f) => f && Number(f.lineAtCost) > 0);
  const passengerFees: PriceLine[] = feeItems.map((f) => {
    const legNums = (f.legs || []).slice().sort((a, b) => a - b);
    const where =
      legNums.length === 1
        ? `leg ${legNums[0]} ${cityOf((b.legs || [])[legNums[0] - 1]?.origin)} departure`.trim()
        : legNums.length === legs.length && legs.length > 1
          ? legs.length === 2
            ? "both legs"
            : "all legs"
          : `legs ${legNums.join(", ")}`;
    const each = f.charged === "pax" ? ` · ${f.pax} × ${docMoney(f.amount, currency)}` : "";
    return { label: `Passenger fees · ${where}${each}`, amount: round2(f.lineAtCost) };
  });
  if (!feeItems.length && Number(p.passengerFees) > 0) passengerFees.push({ label: "Passenger fees", amount: round2(p.passengerFees) });

  let services: PriceLine[] = (b.manualServices || [])
    .filter((s: any) => s && s.name)
    .map((s: any) => {
      const amount = round2(s.price ?? s.amount ?? 0);
      const details = String(s.details || s.description || "").trim();
      const extra = details ? (details.includes("(") ? ` · ${details}` : ` (${details})`) : "";
      return { label: `${s.name}${extra}`, amount, included: amount === 0 };
    });
  if (!services.length) {
    services = (b.tripServices || [])
      .filter((s: any) => s && s.status !== "cancelled")
      .map((s: any) => {
        const base = s.title || { limousine: "VIP limousine", helicopter: "Helicopter transfer", catering: "Catering" }[s.type as string] || "Service";
        const leg = s.legNumber ? ` · leg ${s.legNumber}` : "";
        const when = s.timing ? ` ${s.timing}` : "";
        const amount = s.included ? 0 : round2(s.clientPrice);
        return { label: `${base}${leg}${when}${s.airport ? ` ${s.airport}` : ""}`, amount, included: amount === 0 };
      });
  }

  const feesSum = round2(passengerFees.reduce((s, l) => s + l.amount, 0));
  const servicesSum = round2(services.reduce((s, l) => s + l.amount, 0));
  const charterTotal = Math.max(0, round2(total - vat - feesSum - servicesSum));

  // Split the charter total over the legs (saved per-leg prices, else buying prices, else block time, else evenly)
  const weightsFrom = (fn: (leg: FlightLeg, i: number) => number) => legs.map(fn);
  const ok = (w: number[]) => w.length > 0 && w.every((x) => x > 0);
  let weights = weightsFrom((l) => Number((l as any).charterPrice) || 0);
  if (!ok(weights)) weights = weightsFrom((l) => Number(((b as any).legPricing || []).find((x: any) => x.legNumber === l.legNumber)?.charterPrice) || 0);
  if (!ok(weights)) weights = weightsFrom((l, i) => Number((b.legOperators || []).find((o) => o.legNumber === (l.legNumber || i + 1))?.buyingPrice) || Number((l as any).buyingPrice) || 0);
  if (!ok(weights)) weights = weightsFrom((l, i) => legTiming(l, legAircraft(b, l, i) as any).minutes || 0);
  if (!ok(weights)) weights = legs.map(() => 1);
  const wSum = weights.reduce((s, x) => s + x, 0) || 1;
  let allocated = 0;
  const legPrices = legs.map((leg, i) => {
    const price = i === legs.length - 1 ? round2(charterTotal - allocated) : round2((charterTotal * weights[i]) / wSum);
    allocated = round2(allocated + price);
    return { legNumber: leg.legNumber || i + 1, index: i, leg, price };
  });

  return {
    currency,
    legs: legPrices,
    charterTotal,
    passengerFees,
    services,
    vat,
    total,
    card: round2(total * (1 + cardFeePercent / 100)),
    cardFeePercent
  };
}

export const legsWord = (nums: number[]) => {
  const n = [...nums].sort((a, b) => a - b);
  if (n.length === 0) return "";
  if (n.length === 1) return `leg ${n[0]}`;
  if (n.length === 2) return `legs ${n[0]} and ${n[1]}`;
  return `legs ${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
};

import { Airport, Booking, FboOption, FlightLeg, ItineraryActivityEntry } from "@/types/aviation";
import { getAirportFbos, findAirportByCode, airportsData } from "@/data/airports";
import { getAirportTimezone } from "@/lib/aviationTimezones";
import { getRuntimeAirportDirectory, setRuntimeAirportDirectory } from "@/lib/airportDirectoryStore";

// ---------- time helpers ----------

/** Accepts "9:30", "0930", "09:30 h", "930" and returns "09:30" (or null if not a time). */
export function normalizeTime(raw?: string): string | null {
  if (!raw) return null;
  const clean = String(raw).trim().toLowerCase().replace(/\s*(h|lt|local)$/i, "").trim();
  let h: number;
  let m: number;
  const colon = clean.match(/^(\d{1,2})[:.h](\d{2})$/);
  const digits = clean.match(/^(\d{3,4})$/);
  if (colon) {
    h = parseInt(colon[1], 10);
    m = parseInt(colon[2], 10);
  } else if (digits) {
    const d = digits[1].padStart(4, "0");
    h = parseInt(d.slice(0, 2), 10);
    m = parseInt(d.slice(2), 10);
  } else {
    return null;
  }
  if (h > 23 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function toMinutes(time?: string): number | null {
  const t = normalizeTime(time);
  if (!t) return null;
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  const day = 24 * 60;
  const m = ((Math.round(total) % day) + day) % day;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** 65 → "1 h 05" */
export function formatDuration(minutes?: number | null): string {
  if (minutes === null || minutes === undefined || isNaN(minutes)) return "—";
  const m = Math.max(0, Math.round(minutes));
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
}

/** "1h 45m", "1 h 05", "01h 45m", "105" → minutes */
export function parseDuration(text?: string): number | null {
  if (!text) return null;
  const t = String(text).toLowerCase();
  const hm = t.match(/(\d+)\s*h\s*(\d+)?/);
  if (hm) return parseInt(hm[1], 10) * 60 + (hm[2] ? parseInt(hm[2], 10) : 0);
  const onlyMin = t.match(/^(\d+)\s*m/);
  if (onlyMin) return parseInt(onlyMin[1], 10);
  const n = parseInt(t, 10);
  return isNaN(n) ? null : n;
}

export function tzOffsetHours(airport?: Airport | null): number {
  return getAirportTimezone(airport || null).utcOffsetHours || 0;
}

/** Block time between local departure and local arrival, corrected for the time zones. */
export function computeFlightMinutes(leg: FlightLeg, dep?: string, arr?: string): number | null {
  const d = toMinutes(dep ?? leg.departureTimeLocal);
  const a = toMinutes(arr ?? leg.arrivalTimeLocal);
  if (d === null || a === null) return null;
  const delta = (tzOffsetHours(leg.destination) - tzOffsetHours(leg.origin)) * 60;
  let minutes = a - delta - d;
  while (minutes < 0) minutes += 24 * 60;
  while (minutes >= 24 * 60) minutes -= 24 * 60;
  return minutes;
}

/** Arrival local time for a departure + block time, corrected for the time zones. */
export function arrivalFor(leg: FlightLeg, dep: string, flightMinutes: number): string {
  const d = toMinutes(dep) ?? 0;
  const delta = (tzOffsetHours(leg.destination) - tzOffsetHours(leg.origin)) * 60;
  return fromMinutes(d + flightMinutes + delta);
}

export function legFlightMinutes(leg: FlightLeg): number | null {
  if (typeof leg.flightTimeMinutes === "number" && leg.flightTimeMinutes > 0) return leg.flightTimeMinutes;
  return computeFlightMinutes(leg) ?? parseDuration(leg.flightTimeFormatted);
}

export function formatLegDate(iso?: string, withWeekday = true): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", withWeekday ? { weekday: "short", day: "2-digit", month: "short" } : { day: "2-digit", month: "short" });
}

export function formatStamp(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

export function formatClock(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function formatDay(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function currencySymbol(currency?: string): string {
  return currency === "USD" ? "$" : currency === "GBP" ? "£" : currency === "CHF" ? "CHF" : "€";
}

export function formatMoney(amount: number, currency?: string): string {
  return `${currencySymbol(currency)} ${(Number(amount) || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function makeActivity(
  by: string,
  text: string,
  group: ItineraryActivityEntry["group"],
  summary?: string
): ItineraryActivityEntry {
  return {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    by,
    text,
    group,
    summary
  };
}

// ---------- airports and FBOs ----------

export function airportCity(airport?: Airport | null): string {
  if (!airport) return "";
  return airport.city || airport.name || airport.icao || "";
}

/** True for the generic record findAirportByCode makes up for a code it does not know. */
export function isPlaceholderAirport(a?: Airport | null): boolean {
  if (!a?.icao) return false;
  return a.id === `apt-${a.icao.toLowerCase()}` && /Executive Airfield$/.test(a.name || "");
}

export function fbosFor(icao?: string): FboOption[] {
  if (!icao) return [];
  try {
    // Unknown code: the directory returns a made-up FBO, so offer none
    if (isPlaceholderAirport(findAirportByCode(icao))) return [];
    return getAirportFbos(icao) || [];
  } catch {
    return [];
  }
}

export function findFbo(icao: string | undefined, name: string | undefined): FboOption | undefined {
  if (!name) return undefined;
  return fbosFor(icao).find((f) => f.name === name);
}

/** "Geneva · TAG Aviation" style label */
export function fboLabel(airport: Airport | undefined | null, fboName: string): string {
  const city = airportCity(airport);
  return city && !fboName.toLowerCase().startsWith(city.toLowerCase()) ? `${city} · ${fboName}` : fboName;
}

interface ParsedHours {
  h24: boolean;
  open?: number;
  close?: number;
  onRequest: boolean;
}

export function parseOperatingHours(text?: string): ParsedHours | null {
  if (!text) return null;
  const t = String(text);
  const range = t.match(/(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2}[:.]\d{2})/);
  const onRequest = /on[- ]?call|on request|ppr|extension/i.test(t);
  if (range) {
    const open = toMinutes(range[1].replace(".", ":"));
    const close = toMinutes(range[2].replace(".", ":"));
    if (open !== null && close !== null) {
      if (open === close) return { h24: true, onRequest };
      return { h24: false, open, close, onRequest };
    }
  }
  if (/h24|24\s*\/\s*7|24\s*h|24 hours|unrestricted/i.test(t)) return { h24: true, onRequest };
  return null;
}

function isOpenAt(hours: ParsedHours, minute: number): boolean {
  if (hours.h24 || hours.open === undefined || hours.close === undefined) return true;
  if (hours.open < hours.close) return minute >= hours.open && minute <= hours.close;
  // Overnight range e.g. 18:00 - 02:00
  return minute >= hours.open || minute <= hours.close;
}

export interface OpeningHoursResult {
  level: "ok" | "amber" | "red" | "unknown";
  /** Bold first sentence, e.g. "Arrival 22:10 is after Execujet FBO Abuja closes (21:00)." */
  headline?: string;
  /** Rest of the explanation */
  detail?: string;
  /** Places checked and open, for the green line */
  openPlaces: string[];
  /** The FBO or airport that is closed (for the directory update) */
  closedPlace?: { kind: "airport" | "fbo"; icao: string; name: string; time: string };
}

/**
 * Checks departure and arrival against airport and FBO opening hours.
 * Red: closed with no extension listed. Amber: closed, but an extension is listed. Unknown: no hours on file.
 */
export function checkLegOpeningHours(leg: FlightLeg): OpeningHoursResult {
  const openPlaces: string[] = [];
  const problems: OpeningHoursResult[] = [];
  let anyKnown = false;

  const checkSide = (side: "Departure" | "Arrival") => {
    const airport = side === "Departure" ? leg.origin : leg.destination;
    const handling = side === "Departure" ? leg.departureHandling : leg.arrivalHandling;
    const time = side === "Departure" ? leg.departureTimeLocal : leg.arrivalTimeLocal;
    const minute = toMinutes(time);
    if (!airport?.icao || minute === null) return;
    // findAirportByCode invents a generic record for unknown codes: don't judge hours from it
    if (isPlaceholderAirport(airport)) return;
    const found = findAirportByCode(airport.icao);
    const directoryAirport = isPlaceholderAirport(found) ? undefined : found;
    const airportHours = parseOperatingHours(directoryAirport?.operatingHours || airport.operatingHours);
    const fbo = findFbo(airport.icao, handling?.name);
    const fboHours = parseOperatingHours(fbo?.operatingHours);
    const extensionText = directoryAirport?.extensionPossibilities || airport.extensionPossibilities || "";
    const t = normalizeTime(time) || time;

    const airportOpen = airportHours ? isOpenAt(airportHours, minute) : true;
    const fboOpen = fboHours ? isOpenAt(fboHours, minute) : true;
    if (airportHours || fboHours) anyKnown = true;

    if (airportHours && airportOpen) openPlaces.push(airport.icao);
    if (fbo && fboHours && fboOpen) openPlaces.push(fbo.name);

    const airportSentence = airportHours?.h24
      ? `${airport.icao} airport is open 24 h.`
      : airportHours && airportOpen
      ? `${airport.icao} airport is open at this time.`
      : "";

    if (fboHours && !fboOpen && fbo) {
      const closes = fboHours.close !== undefined ? fromMinutes(fboHours.close) : "";
      const opens = fboHours.open !== undefined ? fromMinutes(fboHours.open) : "";
      const after = fboHours.close !== undefined && fboHours.open !== undefined && minute > fboHours.close && minute > fboHours.open;
      const headline = after
        ? `${side} ${t} is after ${fbo.name} closes (${closes}).`
        : `${side} ${t} is before ${fbo.name} opens (${opens}).`;
      const extension = fboHours.onRequest ? "FBO extension: on request." : "FBO extension: none listed.";
      problems.push({
        level: "red",
        headline,
        detail: [airportSentence, extension].filter(Boolean).join(" "),
        openPlaces: [],
        closedPlace: { kind: "fbo", icao: airport.icao, name: fbo.name, time: t }
      });
    }
    if (airportHours && !airportOpen) {
      const closes = airportHours.close !== undefined ? fromMinutes(airportHours.close) : "";
      const opens = airportHours.open !== undefined ? fromMinutes(airportHours.open) : "";
      const after = airportHours.close !== undefined && minute > (airportHours.close ?? 0);
      const headline = after
        ? `${side} ${t} is after ${airport.icao} airport closes (${closes}).`
        : `${side} ${t} is before ${airport.icao} airport opens (${opens}).`;
      const feeListed = /surcharge|fee|€|\$|£|possible/i.test(extensionText);
      problems.push({
        level: feeListed ? "amber" : "red",
        headline,
        detail: extensionText ? `Extension: ${extensionText}` : "No extension listed.",
        openPlaces: [],
        closedPlace: { kind: "airport", icao: airport.icao, name: airport.icao, time: t }
      });
    }
  };

  checkSide("Departure");
  checkSide("Arrival");

  const red = problems.find((p) => p.level === "red");
  if (red) return { ...red, openPlaces };
  const amber = problems.find((p) => p.level === "amber");
  if (amber) return { ...amber, openPlaces };
  if (!anyKnown) return { level: "unknown", openPlaces };
  return { level: "ok", openPlaces: Array.from(new Set(openPlaces)) };
}

/** Lists places as "LFMN, LSGG and TAG Aviation" */
export function joinPlaces(places: string[]): string {
  if (places.length <= 1) return places.join("");
  return `${places.slice(0, -1).join(", ")} and ${places[places.length - 1]}`;
}

/** Writes new opening hours for an FBO into the airport directory (used by "Also update FBO hours"). */
export function updateFboHoursInDirectory(icao: string, fboName: string, newHours: string): void {
  if (typeof window === "undefined") return;
  let base: Airport[] | null = getRuntimeAirportDirectory();
  if (!base) {
    try {
      const saved = window.localStorage.getItem("orbelo_airport_directory_v1");
      const parsed: unknown = saved ? JSON.parse(saved) : null;
      base = Array.isArray(parsed) ? (parsed as Airport[]) : null;
    } catch {
      base = null;
    }
  }
  const list = base || airportsData;
  const next = list.map((a) =>
    a.icao === icao
      ? { ...a, fbos: (a.fbos || []).map((f) => (f.name === fboName ? { ...f, operatingHours: newHours } : f)) }
      : a
  );
  setRuntimeAirportDirectory(next);
  try {
    window.localStorage.setItem("orbelo_airport_directory_v1", JSON.stringify(next));
  } catch {
    // storage full: the runtime directory still has the update for this session
  }
}

// ---------- trip helpers ----------

export function tripRouteLabel(trip: Booking): string {
  const legs = trip.legs || [];
  if (legs.length === 0) return "";
  const stops = [airportCity(legs[0].origin)];
  legs.forEach((l) => stops.push(airportCity(l.destination)));
  return stops.filter(Boolean).join(" → ");
}

export function legHasArrivalLimo(trip: Booking, legIdx: number): boolean {
  const legLabel = `leg ${legIdx + 1}`;
  const gt = trip.groundTransportation;
  if (gt?.transfers?.some((t) => t.leg?.toLowerCase() === legLabel && t.onArrival?.required)) return true;
  if ((gt?.enabled || gt?.required) && gt?.onArrival?.required) {
    const legs = (gt.flightLeg || []).map((x) => x.toLowerCase());
    if (legs.length === 0 || legs.includes(legLabel)) return true;
  }
  if (
    (trip.manualServices || []).some((s) => {
      const n = `${s.name || ""}`.toLowerCase();
      return n.includes("arrival") && (n.includes("ground") || n.includes("limousine")) && n.includes(legLabel);
    })
  ) {
    return true;
  }
  return Boolean(trip.services?.limousineService && legIdx === 0);
}

// ---------- passengers ----------

export interface ResolvedPassenger {
  id: string;
  contactId?: string;
  fullName: string;
  gender: string;
  weightKg?: number;
  documentType: string;
  documentNumber?: string;
  nationality?: string;
  expires?: string;
  isLead: boolean;
  complete: boolean;
}

export function contactFullName(c: any): string {
  return String(c?.fullName || `${c?.firstName || ""} ${c?.lastName || ""}`).replace(/\s+/g, " ").trim();
}

export function findContactForPassenger(pax: { contactId?: string; fullName?: string }, contacts: any[]): any | undefined {
  if (pax.contactId) {
    const byId = contacts.find((c) => c.id === pax.contactId);
    if (byId) return byId;
  }
  const name = (pax.fullName || "").replace(/\s*\(lead\)\s*$/i, "").trim().toLowerCase();
  if (!name) return undefined;
  return contacts.find((c) => contactFullName(c).toLowerCase() === name);
}

/** Documents follow the Contact into every trip: contact data first, the manifest snapshot as fallback. */
export function resolvePassenger(pax: any, contacts: any[], idx: number): ResolvedPassenger {
  const c = findContactForPassenger(pax, contacts);
  const pp = c?.passportDetails;
  const docNumber: string | undefined = pp?.passportNumber || c?.idDetails?.idNumber || pax.passportNumber || undefined;
  const gender = pax.gender || (c?.gender === "Male" ? "M" : c?.gender === "Female" ? "F" : c?.gender ? "X" : "");
  const weight = typeof pax.weightKg === "number" ? pax.weightKg : typeof c?.weightKg === "number" && c.weightKg > 0 ? c.weightKg : undefined;
  const expires: string | undefined = pp?.expirationDate || c?.idDetails?.expirationDate || pax.passportExpiry || undefined;
  const nationality: string | undefined = c?.nationality || pp?.issuingCountry || pax.nationality || undefined;
  const documentType = pp?.passportNumber || pax.passportNumber ? "Passport" : c?.idDetails?.idNumber ? "ID card" : "";
  return {
    id: String(pax.id || `pax-${idx}`),
    contactId: c?.id || pax.contactId,
    fullName: c ? contactFullName(c) : String(pax.fullName || "").replace(/\s*\(lead\)\s*$/i, ""),
    gender: gender || "—",
    weightKg: weight,
    documentType,
    documentNumber: docNumber && docNumber.length >= 5 ? docNumber : undefined,
    nationality,
    expires,
    isLead: Boolean(pax.isLeadPassenger) || idx === 0,
    complete: Boolean(docNumber && docNumber.length >= 5 && expires)
  };
}

/** "A10849201" → "A1•••9201" */
export function maskDocument(num?: string): string {
  if (!num) return "—";
  if (num.length <= 6) return `${num.slice(0, 1)}•••${num.slice(-2)}`;
  return `${num.slice(0, 2)}•••${num.slice(-4)}`;
}

export function countMissingPassports(trip: Booking, contacts: any[]): number {
  const firstLeg = (trip.legs || [])[0];
  if (!firstLeg) return 0;
  return (firstLeg.passengers || []).map((p, i) => resolvePassenger(p, contacts, i)).filter((p) => !p.documentNumber).length;
}

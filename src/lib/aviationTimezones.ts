import { Airport } from "@/types/aviation";

export interface AirportTimezoneInfo {
  tzName: string;
  utcOffsetHours: number;
  label: string;
}

export function getAirportTimezone(airport?: Airport | null): AirportTimezoneInfo {
  if (!airport) {
    return { tzName: "UTC", utcOffsetHours: 0, label: "UTC+0" };
  }

  const icao = (airport.icao || "").toUpperCase();
  const country = (airport.country || "").toLowerCase();
  const region = (airport.region || "").toLowerCase();

  // Region & Country based ICAO mappings
  if (icao.startsWith("EG") || country === "united kingdom" || country === "ireland" || country === "portugal") {
    return { tzName: "GMT/BST", utcOffsetHours: 1, label: "UTC+1" };
  }
  if (icao.startsWith("OM") || country === "united arab emirates" || country === "uae") {
    return { tzName: "GST", utcOffsetHours: 4, label: "UTC+4" };
  }
  if (icao.startsWith("OE") || country === "saudi arabia" || country === "qatar" || country === "bahrain" || country === "kuwait") {
    return { tzName: "AST", utcOffsetHours: 3, label: "UTC+3" };
  }
  if (icao.startsWith("K") || region === "north_america" || country === "united states" || country === "usa") {
    const lng = airport.coordinates?.lng || -74;
    if (lng > -80) return { tzName: "EDT", utcOffsetHours: -4, label: "UTC-4" }; // US East
    if (lng > -95) return { tzName: "CDT", utcOffsetHours: -5, label: "UTC-5" }; // Central
    if (lng > -110) return { tzName: "MDT", utcOffsetHours: -6, label: "UTC-6" }; // Mountain
    return { tzName: "PDT", utcOffsetHours: -7, label: "UTC-7" }; // Pacific
  }
  if (region === "caribbean" || country === "bahamas" || country === "saint barthélemy" || country === "saint barthelemy") {
    return { tzName: "AST", utcOffsetHours: -4, label: "UTC-4" };
  }
  if (region === "asia" || country === "singapore" || country === "hong kong" || country === "china") {
    return { tzName: "SGT", utcOffsetHours: 8, label: "UTC+8" };
  }
  if (country === "japan") {
    return { tzName: "JST", utcOffsetHours: 9, label: "UTC+9" };
  }
  if (country === "greece" || country === "cyprus" || country === "turkey" || country === "finland") {
    return { tzName: "EEST", utcOffsetHours: 3, label: "UTC+3" };
  }

  // Central/Western Europe default (Switzerland, France, Italy, Austria, Germany, Spain, Monaco, Netherlands, Belgium)
  return { tzName: "CEST", utcOffsetHours: 2, label: "UTC+2" };
}

export function calculateLegArrivalAndTz(
  originAirport: Airport | null,
  destAirport: Airport | null,
  departureTimeLocal: string,
  durationMinutes: number
) {
  const origTz = getAirportTimezone(originAirport);
  const destTz = getAirportTimezone(destAirport);
  const tzDiff = destTz.utcOffsetHours - origTz.utcOffsetHours;

  const [depH, depM] = (departureTimeLocal || "11:00").split(":").map((v) => parseInt(v, 10) || 0);
  const depMinutesFromMidnight = depH * 60 + depM;

  // Arrival local minutes = dep local + duration + timezone difference * 60
  let arrMinutesFromMidnight = depMinutesFromMidnight + durationMinutes + tzDiff * 60;
  while (arrMinutesFromMidnight < 0) arrMinutesFromMidnight += 1440;
  arrMinutesFromMidnight = arrMinutesFromMidnight % 1440;

  const arrH = Math.floor(arrMinutesFromMidnight / 60);
  const arrM = arrMinutesFromMidnight % 60;
  const arrivalTimeLocal = `${arrH.toString().padStart(2, "0")}:${arrM.toString().padStart(2, "0")}`;

  // UTC times
  let depUtcMinutes = depMinutesFromMidnight - origTz.utcOffsetHours * 60;
  while (depUtcMinutes < 0) depUtcMinutes += 1440;
  depUtcMinutes = depUtcMinutes % 1440;
  const depUtcH = Math.floor(depUtcMinutes / 60);
  const depUtcM = depUtcMinutes % 60;
  const departureTimeUtc = `${depUtcH.toString().padStart(2, "0")}:${depUtcM.toString().padStart(2, "0")}z`;

  let arrUtcMinutes = depUtcMinutes + durationMinutes;
  while (arrUtcMinutes < 0) arrUtcMinutes += 1440;
  arrUtcMinutes = arrUtcMinutes % 1440;
  const arrUtcH = Math.floor(arrUtcMinutes / 60);
  const arrUtcM = arrUtcMinutes % 60;
  const arrivalTimeUtc = `${arrUtcH.toString().padStart(2, "0")}:${arrUtcM.toString().padStart(2, "0")}z`;

  return {
    origTz,
    destTz,
    tzDiffHours: tzDiff,
    tzDiffLabel: tzDiff === 0 ? "Same Timezone" : tzDiff > 0 ? `+${tzDiff}h time diff` : `${tzDiff}h time diff`,
    arrivalTimeLocal,
    departureTimeUtc,
    arrivalTimeUtc
  };
}

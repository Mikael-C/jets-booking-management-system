import { Airport } from "@/types/aviation";

interface AirportSearchRecord {
  icao: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  fboDetails: string[];
}

const searchRecordCache = new WeakMap<Airport, AirportSearchRecord>();
const CODE_SCORES = [0, 10, 20, 40];
const NAME_SCORES = [1, 20, 25, 50];
const CITY_SCORES = [2, 30, 35, 60];
const COUNTRY_SCORES = [3, 65, 68, 70];
const FBO_SCORES = [4, 75, 78, 80];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function getSearchRecord(airport: Airport): AirportSearchRecord {
  const cached = searchRecordCache.get(airport);
  if (cached) return cached;

  const record: AirportSearchRecord = {
    icao: normalize(airport.icao || ""),
    iata: normalize(airport.iata || ""),
    name: normalize(airport.name || ""),
    city: normalize(airport.city || ""),
    country: normalize(airport.country || ""),
    fboDetails: (airport.fbos || []).flatMap((fbo) => [
      normalize(fbo.name || ""),
      normalize(fbo.phone || ""),
      normalize(fbo.email || ""),
      ...(fbo.languages || []).map(normalize),
    ]),
  };
  searchRecordCache.set(airport, record);
  return record;
}

function matchScore(value: string, query: string, scores: number[]): number | null {
  if (!value) return null;
  if (value === query) return scores[0];
  if (value.startsWith(query)) return scores[1];
  if (value.includes(` ${query}`)) return scores[2];
  if (value.includes(query)) return scores[3];
  return null;
}

function getBestFieldScore(
  record: AirportSearchRecord,
  query: string,
  includeFboDetails: boolean,
): number | null {
  let best: number | null = null;
  const icaoScore = matchScore(record.icao, query, CODE_SCORES);
  const iataScore = matchScore(record.iata, query, CODE_SCORES);
  const nameScore = matchScore(record.name, query, NAME_SCORES);
  const cityScore = matchScore(record.city, query, CITY_SCORES);
  const countryScore = matchScore(record.country, query, COUNTRY_SCORES);

  if (icaoScore !== null) best = icaoScore;
  if (iataScore !== null && (best === null || iataScore < best)) best = iataScore;
  if (nameScore !== null && (best === null || nameScore < best)) best = nameScore;
  if (cityScore !== null && (best === null || cityScore < best)) best = cityScore;
  if (countryScore !== null && (best === null || countryScore < best)) best = countryScore;
  if (includeFboDetails) {
    for (const value of record.fboDetails) {
      const score = matchScore(value, query, FBO_SCORES);
      if (score !== null && (best === null || score < best)) best = score;
    }
  }
  return best;
}

function scoreAirport(
  record: AirportSearchRecord,
  query: string,
  queryTokens: string[],
  includeFboDetails: boolean,
): number | null {
  const phraseScore = getBestFieldScore(record, query, includeFboDetails);
  if (phraseScore !== null) return phraseScore;

  let tokenScore = 90;
  for (const token of queryTokens) {
    const bestTokenScore = getBestFieldScore(record, token, includeFboDetails);
    if (bestTokenScore === null) return null;
    tokenScore += bestTokenScore;
  }
  return tokenScore;
}

export function rankAirports(
  airports: Airport[],
  searchQuery: string,
  includeFboDetails = false,
): Airport[] {
  const query = normalize(searchQuery);
  if (!query) return airports;

  const queryTokens = query.split(/\s+/);
  const matchesByScore = new Map<number, Airport[]>();

  for (const airport of airports) {
    const score = scoreAirport(getSearchRecord(airport), query, queryTokens, includeFboDetails);
    if (score === null) continue;

    const matches = matchesByScore.get(score);
    if (matches) {
      matches.push(airport);
    } else {
      matchesByScore.set(score, [airport]);
    }
  }

  return Array.from(matchesByScore.keys())
    .sort((a, b) => a - b)
    .flatMap((score) => matchesByScore.get(score) || []);
}

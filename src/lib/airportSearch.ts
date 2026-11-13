import { Airport } from "@/types/aviation";

interface AirportSearchRecord {
  icao: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  airportDetails: string;
  fboDetails: string[];
}

const searchRecordCache = new WeakMap<Airport, AirportSearchRecord>();
const preparedDirectories = new WeakSet<Airport[]>();
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

  const icao = normalize(airport.icao || "");
  const iata = normalize(airport.iata || "");
  const name = normalize(airport.name || "");
  const city = normalize(airport.city || "");
  const country = normalize(airport.country || "");
  const fboDetails = (airport.fbos || []).flatMap((fbo) => [
    normalize(fbo.name || ""),
    normalize(fbo.phone || ""),
    normalize(fbo.email || ""),
    ...(fbo.languages || []).map(normalize),
  ]);
  const record: AirportSearchRecord = {
    icao,
    iata,
    name,
    city,
    country,
    airportDetails: [icao, iata, name, city, country].join("\u0000"),
    fboDetails,
  };
  searchRecordCache.set(airport, record);
  return record;
}

export function prepareAirportSearch(airports: Airport[]): void {
  if (preparedDirectories.has(airports)) return;
  preparedDirectories.add(airports);

  let index = 0;
  const prepareChunk = () => {
    const end = Math.min(index + 1000, airports.length);
    for (; index < end; index += 1) getSearchRecord(airports[index]);
    if (index < airports.length) setTimeout(prepareChunk, 0);
  };
  setTimeout(prepareChunk, 0);
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

function mayMatch(
  record: AirportSearchRecord,
  query: string,
  queryTokens: string[],
  includeFboDetails: boolean,
): boolean {
  if (record.airportDetails.includes(query)) return true;
  if (includeFboDetails && record.fboDetails.some((value) => value.includes(query))) {
    return true;
  }

  return queryTokens.every(
    (token) =>
      record.airportDetails.includes(token) ||
      (includeFboDetails && record.fboDetails.some((value) => value.includes(token))),
  );
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
  const exactCodeLocations = new Set<string>();

  for (const airport of airports) {
    const record = getSearchRecord(airport);
    if (!mayMatch(record, query, queryTokens, includeFboDetails)) continue;
    const score = scoreAirport(record, query, queryTokens, includeFboDetails);
    if (score === null) continue;

    const matches = matchesByScore.get(score);
    if (matches) {
      matches.push(airport);
    } else {
      matchesByScore.set(score, [airport]);
    }

    if ((record.icao === query || record.iata === query) && record.city) {
      exactCodeLocations.add(`${record.city}\u0000${record.country}`);
    }
  }

  if (exactCodeLocations.size > 0) {
    const matchedAirports = new Set<Airport>();
    for (const matches of Array.from(matchesByScore.values())) {
      for (const airport of matches) matchedAirports.add(airport);
    }

    for (const airport of airports) {
      const record = getSearchRecord(airport);
      const location = `${record.city}\u0000${record.country}`;
      if (!matchedAirports.has(airport) && exactCodeLocations.has(location)) {
        const relatedMatches = matchesByScore.get(5);
        if (relatedMatches) {
          relatedMatches.push(airport);
        } else {
          matchesByScore.set(5, [airport]);
        }
      }
    }
  }

  const rankedAirports: Airport[] = [];
  const seenAirportCodes = new Set<string>();
  const scores = Array.from(matchesByScore.keys()).sort((a, b) => a - b);
  for (const score of scores) {
    for (const airport of matchesByScore.get(score) || []) {
      const code = normalize(airport.icao || "");
      const uniqueKey = code ? `icao:${code}` : `id:${airport.id}`;
      if (seenAirportCodes.has(uniqueKey)) continue;
      seenAirportCodes.add(uniqueKey);
      rankedAirports.push(airport);
    }
  }
  return rankedAirports;
}

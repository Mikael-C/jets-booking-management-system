"use client";

import { useCallback, useEffect, useState } from "react";
import { airportsData } from "@/data/airports";
import { Airport } from "@/types/aviation";
import { prepareAirportSearch } from "@/lib/airportSearch";
import { setRuntimeAirportDirectory } from "@/lib/airportDirectoryStore";

const STORAGE_KEY = "orbelo_airport_directory_v2";
const LEGACY_STORAGE_KEY = "orbelo_airport_directory_v1";
const CHANGE_EVENT = "orbelo:airport-directory-updated";

interface StoredAirportDirectory {
  version: 2;
  overrides: Airport[];
  customAirports: Airport[];
}

let baseAirportDirectory = airportsData;
let baseAirportDirectoryPromise: Promise<Airport[]> | null = null;

export function mergeAirportDirectory(
  importedAirports: Airport[],
  curatedAirports: Airport[] = airportsData,
): Airport[] {
  const result = [...curatedAirports];
  const curatedByCode = new Map<string, number>();

  result.forEach((airport, index) => {
    const code = airport.icao.trim().toUpperCase();
    if (code && !curatedByCode.has(code)) curatedByCode.set(code, index);
  });

  for (const importedAirport of importedAirports) {
    const code = importedAirport.icao.trim().toUpperCase();
    const curatedIndex = code ? curatedByCode.get(code) : undefined;
    if (curatedIndex !== undefined) {
      result[curatedIndex] = { ...importedAirport, ...result[curatedIndex] };
    } else {
      result.push(importedAirport);
    }
  }

  return result;
}

function mergeAirportUpdates(base: Airport[], updates: Airport[]): Airport[] {
  const result = [...base];
  const indexById = new Map(result.map((airport, index) => [airport.id, index]));
  const indexByCode = new Map<string, number>();
  result.forEach((airport, index) => {
    const code = airport.icao.trim().toUpperCase();
    if (code && !indexByCode.has(code)) indexByCode.set(code, index);
  });

  for (const update of updates) {
    const code = update.icao.trim().toUpperCase();
    const index = indexById.get(update.id) ?? (code ? indexByCode.get(code) : undefined);
    if (index === undefined) {
      indexById.set(update.id, result.length);
      if (code && !indexByCode.has(code)) indexByCode.set(code, result.length);
      result.push(update);
      continue;
    }

    result[index] = { ...result[index], ...update };
    indexById.set(result[index].id, index);
  }

  return result;
}

function loadBaseAirportDirectory(): Promise<Airport[]> {
  if (!baseAirportDirectoryPromise) {
    baseAirportDirectoryPromise = fetch("/data/ourAirports.json")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Airport data request failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then((data: unknown) => {
        if (
          !data ||
          typeof data !== "object" ||
          !("airports" in data) ||
          !Array.isArray(data.airports) ||
          data.airports.length < 1000
        ) {
          throw new Error("The imported OurAirports file is missing or invalid.");
        }
        baseAirportDirectory = mergeAirportDirectory(data.airports as Airport[]);
        prepareAirportSearch(baseAirportDirectory);
        return baseAirportDirectory;
      })
      .catch((error: unknown) => {
        baseAirportDirectoryPromise = null;
        throw error;
      });
  }
  return baseAirportDirectoryPromise;
}

function readStoredAirportUpdates(): Airport[] {
  try {
    const current = window.localStorage.getItem(STORAGE_KEY);
    if (current) {
      const parsed: unknown = JSON.parse(current);
      if (
        parsed &&
        typeof parsed === "object" &&
        "version" in parsed &&
        parsed.version === 2 &&
        "overrides" in parsed &&
        Array.isArray(parsed.overrides) &&
        "customAirports" in parsed &&
        Array.isArray(parsed.customAirports)
      ) {
        return [...parsed.overrides, ...parsed.customAirports] as Airport[];
      }
      console.warn("Saved airport changes have an unsupported format; ignoring them.");
      return [];
    }

    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy) return [];
    const parsed: unknown = JSON.parse(legacy);
    if (Array.isArray(parsed)) return parsed as Airport[];
    console.warn("Legacy airport directory data has an unsupported format; ignoring it.");
  } catch (error) {
    console.warn("Unable to read saved airport directory changes.", error);
  }
  return [];
}

async function getAirportDirectory(): Promise<Airport[]> {
  try {
    const base = await loadBaseAirportDirectory();
    return mergeAirportUpdates(base, readStoredAirportUpdates());
  } catch (error) {
    console.error("Unable to load OurAirports data; using the curated airport directory.", error);
    return mergeAirportUpdates(airportsData, readStoredAirportUpdates());
  }
}

export function updateAirportDirectory(airports: Airport[]): void {
  if (typeof window === "undefined") return;

  const baseById = new Map(baseAirportDirectory.map((airport) => [airport.id, airport]));
  const overrides: Airport[] = [];
  const customAirports: Airport[] = [];

  for (const airport of airports) {
    const baseAirport = baseById.get(airport.id);
    if (!baseAirport) {
      customAirports.push(airport);
    } else if (JSON.stringify(airport) !== JSON.stringify(baseAirport)) {
      overrides.push(airport);
    }
  }

  const savedDirectory: StoredAirportDirectory = {
    version: 2,
    overrides,
    customAirports,
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDirectory));
    setRuntimeAirportDirectory(airports);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: airports }));
  } catch (error) {
    console.error("Unable to save airport directory changes.", error);
    throw error;
  }
}

export function useAirportDirectory(): [Airport[], (airports: Airport[]) => void, boolean] {
  const [airports, setAirports] = useState<Airport[]>(airportsData);
  const [directoryLoaded, setDirectoryLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const sync = (event?: Event) => {
      const eventAirports = event instanceof CustomEvent && Array.isArray(event.detail)
        ? event.detail as Airport[]
        : null;
      if (eventAirports) {
        setRuntimeAirportDirectory(eventAirports);
        setAirports(eventAirports);
        return;
      }

      void getAirportDirectory().then((directory) => {
        if (!active) return;
        setRuntimeAirportDirectory(directory);
        setAirports(directory);
        setDirectoryLoaded(true);
      });
    };

    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    sync();
    return () => {
      active = false;
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const save = useCallback((nextAirports: Airport[]) => {
    updateAirportDirectory(nextAirports);
    setAirports(nextAirports);
  }, []);

  return [airports, save, directoryLoaded];
}

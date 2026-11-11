"use client";

import { useCallback, useEffect, useState } from "react";
import { airportsData } from "@/data/airports";
import { Airport } from "@/types/aviation";

const STORAGE_KEY = "orbelo_airport_directory_v1";
const CHANGE_EVENT = "orbelo:airport-directory-updated";

function readAirportDirectory(): Airport[] {
  if (typeof window === "undefined") return airportsData;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return airportsData;
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed as Airport[] : airportsData;
  } catch (error) {
    console.warn("Unable to read saved airport directory; using the default airport data.", error);
    return airportsData;
  }
}

export function updateAirportDirectory(airports: Airport[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(airports));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: airports }));
  } catch (error) {
    console.error("Unable to save airport directory changes.", error);
    throw error;
  }
}

export function useAirportDirectory(): [Airport[], (airports: Airport[]) => void] {
  const [airports, setAirports] = useState<Airport[]>(airportsData);

  useEffect(() => {
    const sync = (event?: Event) => {
      const eventAirports = event instanceof CustomEvent ? event.detail as Airport[] : null;
      setAirports(eventAirports || readAirportDirectory());
    };
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    sync();
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const save = useCallback((nextAirports: Airport[]) => {
    updateAirportDirectory(nextAirports);
    setAirports(nextAirports);
  }, []);

  return [airports, save];
}

import { Airport } from "@/types/aviation";

let runtimeAirportDirectory: Airport[] | null = null;

export function getRuntimeAirportDirectory(): Airport[] | null {
  return runtimeAirportDirectory;
}

export function setRuntimeAirportDirectory(airports: Airport[]): void {
  runtimeAirportDirectory = airports;
}

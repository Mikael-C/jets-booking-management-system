import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceUrl = "https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv";
const outputPath = fileURLToPath(new URL("../public/data/ourAirports.json", import.meta.url));
const supportedTypes = new Set([
  "large_airport",
  "medium_airport",
  "small_airport",
  "heliport",
  "seaplane_base",
  "balloonport",
]);
const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  const [header, ...records] = rows;
  if (!header?.length) throw new Error("The OurAirports CSV is empty.");
  return records.map((values) => Object.fromEntries(
    header.map((key, index) => [key, values[index] ?? ""]),
  ));
}

function toAirport(record) {
  const latitude = Number(record.latitude_deg);
  const longitude = Number(record.longitude_deg);
  const elevation = Number(record.elevation_ft);
  const hasCoordinates =
    record.latitude_deg.trim() !== "" &&
    record.longitude_deg.trim() !== "" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;
  const code = record.icao_code || record.gps_code || record.local_code || record.ident;
  const countryCode = record.iso_country;
  const country = countryCode ? countryNames.of(countryCode) : "";
  const typeLabels = {
    large_airport: "Large Airport",
    medium_airport: "Medium Airport",
    small_airport: "Small Airport",
    heliport: "Heliport",
    seaplane_base: "Seaplane Base",
    balloonport: "Balloonport",
  };
  const airportTypes = {
    large_airport: "airport",
    medium_airport: "airport",
    small_airport: "airstrip",
    heliport: "heliport",
    seaplane_base: "seaplane_base",
    balloonport: "balloonport",
  };
  const regions = {
    AF: "africa",
    AN: "antarctica",
    AS: "asia",
    EU: "europe",
    NA: "north_america",
    OC: "asia_pacific",
    SA: "americas",
  };

  if (!record.id || !code || !record.name || !supportedTypes.has(record.type)) return null;

  return {
    id: `ourairports-${record.id}`,
    name: record.name,
    city: record.municipality || country || "Unknown",
    country: country || countryCode || "Unknown",
    iata: (record.iata_code || "").toUpperCase(),
    icao: code.toUpperCase(),
    type: airportTypes[record.type],
    typeLabel: typeLabels[record.type],
    region: regions[record.continent] || "other",
    ...(hasCoordinates
      ? { coordinates: { lat: latitude, lng: longitude } }
      : {}),
    ...(record.elevation_ft.trim() !== "" && Number.isFinite(elevation)
      ? { elevation: `${Math.round(elevation)} ft` }
      : {}),
  };
}

async function main() {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`OurAirports download failed: ${response.status} ${response.statusText}`);
  }

  const records = parseCsv(await response.text());
  const airports = records.map(toAirport).filter(Boolean);
  if (airports.length < 1000) {
    throw new Error(`Import produced only ${airports.length} airports; refusing to replace the dataset.`);
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify({
    source: sourceUrl,
    importedAt: new Date().toISOString(),
    airports,
  })}\n`);
  console.log(`Imported ${airports.length} active aerodromes into ${outputPath}`);
}

main().catch((error) => {
  console.error("OurAirports import failed:", error);
  process.exitCode = 1;
});

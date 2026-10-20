import { Airport } from "@/types/aviation";

export const airportsData: Airport[] = [
  {
    id: "geneva",
    name: "Geneva Airport",
    city: "Geneva",
    country: "Switzerland",
    iata: "GVA",
    icao: "LSGG",
    type: "dedicated",
    typeLabel: "Executive Business Terminal",
    popular: true,
    region: "europe",
    coordinates: { lat: 46.2381, lng: 6.1089 }
  },
  {
    id: "genoa",
    name: "Genoa Cristoforo Colombo Airport",
    city: "Genoa",
    country: "Italy",
    iata: "GOA",
    icao: "LIMJ",
    type: "fbo",
    typeLabel: "Ags Ops Executive Handling",
    popular: true,
    region: "europe",
    coordinates: { lat: 44.4133, lng: 8.8375 }
  },
  {
    id: "nice",
    name: "Nice Côte d'Azur Airport",
    city: "Nice / Cannes / Monaco",
    country: "France",
    iata: "NCE",
    icao: "LFMN",
    type: "dedicated",
    typeLabel: "General Aviation Terminal",
    popular: true,
    region: "europe",
    coordinates: { lat: 43.6584, lng: 7.2159 }
  },
  {
    id: "altenrhein",
    name: "Altenrhein / St. Gallen Airport",
    city: "Altenrhein / St. Gallen",
    country: "Switzerland",
    iata: "ACH",
    icao: "LSZR",
    type: "fbo",
    typeLabel: "Peoples Business Aviation",
    popular: true,
    region: "europe",
    coordinates: { lat: 47.4850, lng: 9.5608 }
  },
  {
    id: "london-farnborough",
    name: "Farnborough Executive Airport",
    city: "London",
    country: "United Kingdom",
    iata: "FAB",
    icao: "EGLF",
    type: "dedicated",
    typeLabel: "Dedicated VIP Private Jet Airport",
    popular: true,
    region: "europe",
    coordinates: { lat: 51.2758, lng: -0.7763 }
  },
  {
    id: "london-biggin-hill",
    name: "London Biggin Hill Airport",
    city: "London",
    country: "United Kingdom",
    iata: "BQH",
    icao: "EGKB",
    type: "dedicated",
    typeLabel: "Dedicated Business Airport",
    popular: true,
    region: "europe",
    coordinates: { lat: 51.3308, lng: 0.0325 }
  },
  {
    id: "london-luton",
    name: "London Luton Airport (Signature / Harrods)",
    city: "London",
    country: "United Kingdom",
    iata: "LTN",
    icao: "EGGW",
    type: "fbo",
    typeLabel: "Executive FBO Hub",
    popular: true,
    region: "europe",
    coordinates: { lat: 51.8747, lng: -0.3683 }
  },
  {
    id: "paris-le-bourget",
    name: "Paris Le Bourget Airport",
    city: "Paris",
    country: "France",
    iata: "LBG",
    icao: "LFPB",
    type: "dedicated",
    typeLabel: "Europe's Leading Business Airport",
    popular: true,
    region: "europe",
    coordinates: { lat: 48.9694, lng: 2.4414 }
  },
  {
    id: "zurich",
    name: "Zurich International Airport (Cat A FBO)",
    city: "Zurich",
    country: "Switzerland",
    iata: "ZRH",
    icao: "LSZH",
    type: "fbo",
    typeLabel: "ExecuJet / Jet Aviation Hub",
    popular: true,
    region: "europe",
    coordinates: { lat: 47.4582, lng: 8.5555 }
  },
  {
    id: "milan-linate",
    name: "Milan Linate Prime",
    city: "Milan",
    country: "Italy",
    iata: "LIN",
    icao: "LIML",
    type: "dedicated",
    typeLabel: "Milano Prime Business Terminal",
    popular: true,
    region: "europe",
    coordinates: { lat: 45.4451, lng: 9.2767 }
  },
  {
    id: "cannes-mandelieu",
    name: "Cannes Mandelieu Airport",
    city: "Cannes",
    country: "France",
    iata: "CEQ",
    icao: "LFMD",
    type: "dedicated",
    typeLabel: "VIP Riviera Airport",
    popular: true,
    region: "europe",
    coordinates: { lat: 43.5422, lng: 6.9531 }
  },
  {
    id: "ibiza",
    name: "Ibiza Airport (Executive Aviation)",
    city: "Ibiza",
    country: "Spain",
    iata: "IBZ",
    icao: "LEIB",
    type: "fbo",
    typeLabel: "Ibiza VIP FBO Terminal",
    popular: true,
    region: "europe",
    coordinates: { lat: 38.8729, lng: 1.3731 }
  },
  {
    id: "palma",
    name: "Palma de Mallorca Son Sant Joan",
    city: "Mallorca",
    country: "Spain",
    iata: "PMI",
    icao: "LEPA",
    type: "fbo",
    typeLabel: "Mallorcan Executive FBO",
    popular: true,
    region: "europe",
    coordinates: { lat: 39.5517, lng: 2.7388 }
  },
  {
    id: "munich-obf",
    name: "Munich Oberpfaffenhofen Airport",
    city: "Munich",
    country: "Germany",
    iata: "OBF",
    icao: "EDMO",
    type: "dedicated",
    typeLabel: "Munich Business Aviation Hub",
    popular: true,
    region: "europe",
    coordinates: { lat: 48.0814, lng: 11.2831 }
  },
  {
    id: "vienna",
    name: "Vienna International VIP Terminal",
    city: "Vienna",
    country: "Austria",
    iata: "VIE",
    icao: "LOWW",
    type: "dedicated",
    typeLabel: "Vienna General Aviation Terminal",
    popular: true,
    region: "europe",
    coordinates: { lat: 48.1103, lng: 16.5697 }
  },
  {
    id: "new-york-teterboro",
    name: "Teterboro Airport",
    city: "New York",
    country: "United States",
    iata: "TEB",
    icao: "KTEB",
    type: "dedicated",
    typeLabel: "Premier Metro NY Private Airport",
    popular: true,
    region: "north-america",
    coordinates: { lat: 40.8501, lng: -74.0608 }
  },
  {
    id: "miami-opalocka",
    name: "Miami Opa-locka Executive Airport",
    city: "Miami",
    country: "United States",
    iata: "OPF",
    icao: "KOPF",
    type: "dedicated",
    typeLabel: "South Florida VIP Hub",
    popular: true,
    region: "north-america",
    coordinates: { lat: 25.9070, lng: -80.2784 }
  },
  {
    id: "dubai-al-maktoum",
    name: "Al Maktoum International VIP Hub",
    city: "Dubai",
    country: "United Arab Emirates",
    iata: "DWC",
    icao: "OMDW",
    type: "dedicated",
    typeLabel: "Dubai South VIP Aviation Terminal",
    popular: true,
    region: "middle-east",
    coordinates: { lat: 24.8960, lng: 55.1614 }
  }
];

export function findAirportByCode(code: string): Airport {
  const clean = code.trim().toUpperCase();
  const found = airportsData.find(
    (a) => a.icao.toUpperCase() === clean || a.iata.toUpperCase() === clean || a.name.toUpperCase().includes(clean)
  );
  if (found) return found;
  return {
    id: clean.toLowerCase(),
    name: `${clean} Airport`,
    city: clean,
    country: "International",
    iata: clean.length === 3 ? clean : clean.slice(0, 3),
    icao: clean.length === 4 ? clean : clean.padEnd(4, "X"),
    type: "fbo",
    typeLabel: "Executive Aviation Terminal",
    coordinates: { lat: 45.0, lng: 9.0 }
  };
}

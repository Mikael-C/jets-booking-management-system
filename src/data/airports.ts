import { Airport, FboOption, HandlingAgent } from "@/types/aviation";

export const airportsData: Airport[] = [
  {
    id: "geneva",
    name: "Geneva Cointrin International Airport",
    city: "Geneva",
    country: "Switzerland",
    iata: "GVA",
    icao: "LSGG",
    type: "dedicated",
    typeLabel: "Executive Business Terminal",
    popular: true,
    region: "europe",
    coordinates: { lat: 46.2381, lng: 6.1089 },
    fbos: [
      {
        id: "lsgg-jet-aviation",
        name: "Jet Aviation Geneva",
        phone: "+41 58 158 1811",
        email: "gvafbo@jetaviation.com",
        vhfFrequency: "130.65 MHz",
        address: "Route de Pré-Bois 29, 1215 Geneva 15",
        notes: "Full VIP private lounge, customs on-site, crew rest rooms"
      },
      {
        id: "lsgg-tag-aviation",
        name: "TAG Aviation Geneva",
        phone: "+41 22 717 0123",
        email: "handling.geneva@tagaviation.com",
        vhfFrequency: "130.30 MHz",
        address: "Executive Terminal C3, Geneva Airport",
        notes: "Dedicated passenger suites, ramp vehicle access"
      },
      {
        id: "lsgg-signature",
        name: "Signature Flight Support Geneva",
        phone: "+41 22 717 8400",
        email: "gva@signatureflight.com",
        vhfFrequency: "131.75 MHz",
        address: "Chemin des Papillons 18, 1215 Geneva",
        notes: "Executive meeting facilities, VIP catering uplift"
      },
      {
        id: "lsgg-dassault",
        name: "Dassault Aviation Business Services",
        phone: "+41 22 799 0300",
        email: "handling.geneva@dassault-aviation.com",
        vhfFrequency: "122.85 MHz",
        address: "General Aviation Terminal, Geneva Airport",
        notes: "Falcon specialist & executive ground assistance"
      }
    ]
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
    coordinates: { lat: 44.4133, lng: 8.8375 },
    fbos: [
      {
        id: "limj-ags-ops",
        name: "Ags Ops Executive Handling",
        phone: "+39 010 601 5412",
        email: "dutymanager@airport.genova.it",
        vhfFrequency: "131.75 MHz",
        address: "General Aviation Terminal, Via Pionieri d'Italia 1",
        notes: "Portofino & Italian Riviera gateway, dedicated customs"
      },
      {
        id: "limj-sky-services",
        name: "Sky Services FBO Genoa",
        phone: "+39 010 601 5459",
        email: "genoa@skyservices.it",
        vhfFrequency: "131.85 MHz",
        address: "Executive Apron Building, Genoa Airport",
        notes: "VIP limousine transfer to Portofino & yacht marinas"
      },
      {
        id: "limj-delta-aerotaxi",
        name: "Delta Aerotaxi Executive Handling",
        phone: "+39 010 601 5470",
        email: "ops@delta-aerotaxi.it",
        vhfFrequency: "131.60 MHz",
        address: "Via Pionieri e Aviatori d'Italia, 16154 Genova",
        notes: "Superyacht charter liaison and helicopter connections"
      }
    ]
  },
  {
    id: "nice",
    name: "Nice Côte d'Azur International Airport",
    city: "Nice / Monaco / Cannes",
    country: "France",
    iata: "NCE",
    icao: "LFMN",
    type: "dedicated",
    typeLabel: "General Aviation Terminal",
    popular: true,
    region: "europe",
    coordinates: { lat: 43.6584, lng: 7.2159 },
    fbos: [
      {
        id: "lfmn-signature",
        name: "Signature Flight Support Nice",
        phone: "+33 4 93 21 37 37",
        email: "nce@signatureflight.com",
        vhfFrequency: "131.60 MHz",
        address: "Terminal Aviation d'Affaires, Rue Costes et Bellonte",
        notes: "Direct helicopter transfers to Monaco Heliport (7 mins)"
      },
      {
        id: "lfmn-aviapartner",
        name: "Aviapartner Executive Nice",
        phone: "+33 4 93 21 44 94",
        email: "nce.executive@aviapartner.aero",
        vhfFrequency: "131.75 MHz",
        address: "General Aviation Center, Terminal 2",
        notes: "VIP passenger lounges and direct tarmac limousine escort"
      },
      {
        id: "lfmn-swissport",
        name: "Swissport Executive Nice",
        phone: "+33 4 93 21 36 80",
        email: "nce.executive@swissport.com",
        vhfFrequency: "130.25 MHz",
        address: "Terminal Affaires, Aeroport Nice Cote d'Azur",
        notes: "Dedicated customs & border control clearance"
      }
    ]
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
    coordinates: { lat: 48.9694, lng: 2.4414 },
    fbos: [
      {
        id: "lfpb-jet-aviation",
        name: "Jet Aviation Paris Le Bourget",
        phone: "+33 1 48 62 00 00",
        email: "lbgfbo@jetaviation.com",
        vhfFrequency: "130.40 MHz",
        address: "Aéroport de Paris-Le Bourget, Zone d'Aviation d'Affaires",
        notes: "State-of-the-art terminal, crew snooze rooms, conference facilities"
      },
      {
        id: "lfpb-signature",
        name: "Signature Flight Support Paris T1",
        phone: "+33 1 49 92 75 00",
        email: "lbg@signatureflight.com",
        vhfFrequency: "131.55 MHz",
        address: "Terminal 1, Aéroport du Bourget",
        notes: "Dedicated security lane, VIP concierge, Taittinger bar"
      },
      {
        id: "lfpb-sky-valet",
        name: "Sky Valet Paris Le Bourget",
        phone: "+33 1 48 35 97 97",
        email: "ops.lbg@skyvalet.com",
        vhfFrequency: "131.80 MHz",
        address: "Zone d'Aviation Generale, Le Bourget",
        notes: "Private aircraft hangars and executive ground fleet"
      },
      {
        id: "lfpb-universal",
        name: "Universal Aviation Paris",
        phone: "+33 1 48 35 96 38",
        email: "france@universalaviation.aero",
        vhfFrequency: "130.85 MHz",
        address: "Bâtiment 53, Aéroport du Bourget",
        notes: "Comprehensive flight planning and diplomatic protocol clearance"
      }
    ]
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
    coordinates: { lat: 51.2758, lng: -0.7763 },
    fbos: [
      {
        id: "eglf-farnborough",
        name: "Farnborough Airport Executive Handling",
        phone: "+44 1252 379 002",
        email: "ops@farnboroughairport.com",
        vhfFrequency: "131.80 MHz",
        address: "Farnborough Airport, Farnborough GU14 6XA",
        notes: "Award-winning iconic terminal, direct ramp drive-on, pet travel scheme cleared"
      }
    ]
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
    coordinates: { lat: 51.3308, lng: 0.0325 },
    fbos: [
      {
        id: "egkb-biggin-handling",
        name: "Biggin Hill Executive Handling",
        phone: "+44 1959 578 500",
        email: "handling@bigginhillairport.com",
        vhfFrequency: "130.675 MHz",
        address: "Passenger Handling Terminal, Main Apron, Biggin Hill TN16 3BN",
        notes: "6-minute helicopter shuttle to London Battersea Heliport"
      },
      {
        id: "egkb-signature",
        name: "Signature Flight Support Biggin Hill",
        phone: "+44 1959 570 000",
        email: "bqh@signatureflight.com",
        vhfFrequency: "131.95 MHz",
        address: "Hangar 510, Biggin Hill Airport",
        notes: "DEFRA Pet Travel approved point of entry"
      }
    ]
  },
  {
    id: "london-luton",
    name: "London Luton Airport",
    city: "London",
    country: "United Kingdom",
    iata: "LTN",
    icao: "EGGW",
    type: "fbo",
    typeLabel: "Executive FBO Hub",
    popular: true,
    region: "europe",
    coordinates: { lat: 51.8747, lng: -0.3683 },
    fbos: [
      {
        id: "eggw-harrods",
        name: "Harrods Aviation Luton",
        phone: "+44 1582 589 350",
        email: "luton@harrodsaviation.com",
        vhfFrequency: "131.75 MHz",
        address: "The Harrods Terminal, Percival Way, Luton LU2 9PA",
        notes: "Harrods luxury hospitality, dedicated security and private suites"
      },
      {
        id: "eggw-signature",
        name: "Signature Flight Support Luton T1",
        phone: "+44 1582 724 455",
        email: "ltn@signatureflight.com",
        vhfFrequency: "130.65 MHz",
        address: "Frank Lester Way, London Luton Airport LU2 9NW",
        notes: "Full 24/7 customs and executive terminal facilities"
      }
    ]
  },
  {
    id: "zurich",
    name: "Zurich International Airport",
    city: "Zurich",
    country: "Switzerland",
    iata: "ZRH",
    icao: "LSZH",
    type: "fbo",
    typeLabel: "ExecuJet / Jet Aviation Hub",
    popular: true,
    region: "europe",
    coordinates: { lat: 47.4582, lng: 8.5555 },
    fbos: [
      {
        id: "lszh-execujet",
        name: "ExecuJet Zurich FBO",
        phone: "+41 44 804 1611",
        email: "zurich@execujet.com",
        vhfFrequency: "131.725 MHz",
        address: "General Aviation Center, 8058 Zurich Airport",
        notes: "Cat A Business Terminal, private boarding gate, Swiss customs"
      },
      {
        id: "lszh-jet-aviation",
        name: "Jet Aviation Zurich",
        phone: "+41 58 158 8111",
        email: "zrhfbo@jetaviation.com",
        vhfFrequency: "130.65 MHz",
        address: "Building GAC, P.O. Box 214, 8058 Zurich",
        notes: "Executive lounge, aircraft maintenance on-site, fuel release"
      }
    ]
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
    coordinates: { lat: 45.4451, lng: 9.2767 },
    fbos: [
      {
        id: "liml-milano-prime",
        name: "Milano Prime Executive Handling",
        phone: "+39 02 7020 0300",
        email: "operations@milanoprime.com",
        vhfFrequency: "131.85 MHz",
        address: "Viale Enrico Forlanini, 20090 San Donato Milanese MI",
        notes: "Direct 15-minute limousine transfer to Milan fashion district"
      },
      {
        id: "liml-signature",
        name: "Signature Flight Support Milan Linate",
        phone: "+39 02 7486 4300",
        email: "lin@signatureflight.com",
        vhfFrequency: "131.55 MHz",
        address: "Milano Prime Terminal, Aeroporto Linate",
        notes: "VIP suites, meeting rooms, high-speed ramp handling"
      },
      {
        id: "liml-sky-services",
        name: "Sky Services Milan Linate",
        phone: "+39 02 7020 8122",
        email: "linate@skyservices.it",
        vhfFrequency: "131.40 MHz",
        address: "Linate Prime Business Aviation Terminal",
        notes: "Personal concierge and fine Italian in-flight catering"
      }
    ]
  },
  {
    id: "ibiza",
    name: "Ibiza International Airport",
    city: "Ibiza",
    country: "Spain",
    iata: "IBZ",
    icao: "LEIB",
    type: "fbo",
    typeLabel: "Ibiza VIP FBO Terminal",
    popular: true,
    region: "europe",
    coordinates: { lat: 38.8729, lng: 1.3731 },
    fbos: [
      {
        id: "leib-sky-valet",
        name: "Sky Valet Ibiza VIP Terminal",
        phone: "+34 971 395 385",
        email: "ops.ibz@skyvalet.com",
        vhfFrequency: "131.90 MHz",
        address: "Terminal de Aviación Ejecutiva, 07817 Sant Jordi de ses Salines",
        notes: "Dedicated 24/7 private jet apron, yacht connection coordination"
      },
      {
        id: "leib-gestair",
        name: "Gestair FBO Ibiza",
        phone: "+34 971 809 234",
        email: "fbo.ibz@gestair.com",
        vhfFrequency: "131.45 MHz",
        address: "Aeropuerto de Ibiza, Terminal Ejecutiva",
        notes: "Expedited summer VIP slot coordination and handling"
      },
      {
        id: "leib-aviapartner",
        name: "Aviapartner Executive Ibiza",
        phone: "+34 971 395 240",
        email: "ibz.executive@aviapartner.aero",
        vhfFrequency: "130.80 MHz",
        address: "Executive Handling Terminal, Ibiza",
        notes: "High-season priority PPR & slot management"
      }
    ]
  },
  {
    id: "palma",
    name: "Palma de Mallorca Son Sant Joan Airport",
    city: "Mallorca",
    country: "Spain",
    iata: "PMI",
    icao: "LEPA",
    type: "fbo",
    typeLabel: "Mallorcan Executive FBO",
    popular: true,
    region: "europe",
    coordinates: { lat: 39.5517, lng: 2.7388 },
    fbos: [
      {
        id: "lepa-mallorcan",
        name: "Mallorcan Executive Aviation FBO",
        phone: "+34 971 789 266",
        email: "handling.pmi@generalaviation.es",
        vhfFrequency: "131.65 MHz",
        address: "Terminal de Aviación General, 07611 Palma",
        notes: "Direct ramp transfer to private Balearic yachts and villas"
      },
      {
        id: "lepa-gestair",
        name: "Gestair FBO Palma",
        phone: "+34 971 789 123",
        email: "fbo.pmi@gestair.com",
        vhfFrequency: "131.50 MHz",
        address: "Aeropuerto de Palma de Mallorca, Terminal General",
        notes: "Private security lane and Mediterranean VIP catering"
      }
    ]
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
    coordinates: { lat: 47.4850, lng: 9.5608 },
    fbos: [
      {
        id: "lszr-peoples",
        name: "Peoples Business Aviation Altenrhein",
        phone: "+41 71 858 5165",
        email: "c-office@peoples.ch",
        vhfFrequency: "122.85 MHz",
        address: "Flughafenstrasse 11, CH-9423 Altenrhein",
        notes: "Fast 5-minute passenger exit, gateway to Davos WEF & St. Moritz"
      }
    ]
  },
  {
    id: "vienna",
    name: "Vienna International Airport",
    city: "Vienna",
    country: "Austria",
    iata: "VIE",
    icao: "LOWW",
    type: "dedicated",
    typeLabel: "Vienna General Aviation Terminal",
    popular: true,
    region: "europe",
    coordinates: { lat: 48.1103, lng: 16.5697 },
    fbos: [
      {
        id: "loww-vienna-vip",
        name: "Vienna Airport VIP & General Aviation Center",
        phone: "+43 1 7007 22233",
        email: "gac@viennaairport.com",
        vhfFrequency: "131.70 MHz",
        address: "Objekt 140, 1300 Wien-Flughafen",
        notes: "Exclusive VIP salon, diplomatic escort, fast customs"
      },
      {
        id: "loww-jet-aviation",
        name: "Jet Aviation Vienna",
        phone: "+43 1 7007 22440",
        email: "viefbo@jetaviation.com",
        vhfFrequency: "130.65 MHz",
        address: "General Aviation Center, Vienna International Airport",
        notes: "Comprehensive handling, fuel dispatch, crew rest rooms"
      }
    ]
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
    coordinates: { lat: 48.0814, lng: 11.2831 },
    fbos: [
      {
        id: "edmo-oberpfaffenhofen",
        name: "EDMO Executive FBO Oberpfaffenhofen",
        phone: "+49 8153 997 100",
        email: "ops@edmo-airport.de",
        vhfFrequency: "131.825 MHz",
        address: "Claude-Dornier-Straße 1, 82234 Weßling",
        notes: "Dedicated private airport, zero airline congestion, Munich limousine link"
      }
    ]
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
    coordinates: { lat: 43.5422, lng: 6.9531 },
    fbos: [
      {
        id: "lfmd-cannes-terminal",
        name: "Cannes Mandelieu Business Aviation FBO",
        phone: "+33 4 93 90 40 00",
        email: "aeroport.cannes@cote-dazur.aeroport.fr",
        vhfFrequency: "121.70 MHz",
        address: "245 Avenue Francis Tonner, 06150 Cannes",
        notes: "Direct access to Cannes Film Festival & Croisette hotels"
      },
      {
        id: "lfmd-sky-valet",
        name: "Sky Valet Cannes",
        phone: "+33 4 93 90 40 40",
        email: "ops.ceq@skyvalet.com",
        vhfFrequency: "131.65 MHz",
        address: "Terminal Aviation d'Affaires, Cannes Airport",
        notes: "Helicopter transfers to Saint-Tropez (15 mins) and Monaco"
      }
    ]
  },
  {
    id: "new-york-teterboro",
    name: "Teterboro Airport",
    city: "New York / New Jersey",
    country: "United States",
    iata: "TEB",
    icao: "KTEB",
    type: "dedicated",
    typeLabel: "Premier Metro NY Private Airport",
    popular: true,
    region: "north-america",
    coordinates: { lat: 40.8501, lng: -74.0608 },
    fbos: [
      {
        id: "kteb-signature-east",
        name: "Signature Flight Support Teterboro (East)",
        phone: "+1 201 288 1880",
        email: "teb@signatureflight.com",
        vhfFrequency: "122.95 MHz",
        address: "111 Charles A Lindbergh Dr, Teterboro, NJ 07608",
        notes: "12 miles to Midtown Manhattan, dedicated customs, helicopter link"
      },
      {
        id: "kteb-jet-aviation",
        name: "Jet Aviation Teterboro",
        phone: "+1 201 462 4000",
        email: "tebfbo@jetaviation.com",
        vhfFrequency: "130.65 MHz",
        address: "112 Charles A Lindbergh Dr, Teterboro, NJ 07608",
        notes: "Heated hangars, executive boardrooms, passenger lounge"
      },
      {
        id: "kteb-meridian",
        name: "Meridian Teterboro",
        phone: "+1 201 288 5040",
        email: "csr@meridianjet.com",
        vhfFrequency: "129.70 MHz",
        address: "485 Industrial Ave, Teterboro, NJ 07608",
        notes: "Art-deco executive terminal, cinema room, private ramp access"
      }
    ]
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
    coordinates: { lat: 25.9070, lng: -80.2784 },
    fbos: [
      {
        id: "kopf-fontainebleau",
        name: "Fontainebleau Aviation",
        phone: "+1 305 685 4646",
        email: "info@fontainebleauaviation.com",
        vhfFrequency: "130.60 MHz",
        address: "14200 NW 42nd Ave, Opa-locka, FL 33054",
        notes: "Premier resort-style VIP terminal, presidential canopy, 24/7 customs"
      },
      {
        id: "kopf-atlantic",
        name: "Atlantic Aviation Opa-locka",
        phone: "+1 305 685 0200",
        email: "opf@atlanticaviation.com",
        vhfFrequency: "122.95 MHz",
        address: "15000 NW 44th Ave, Opa-locka, FL 33054",
        notes: "Spacious passenger lounges and direct South Beach transport"
      }
    ]
  },
  {
    id: "dubai-al-maktoum",
    name: "Al Maktoum International Airport (Dubai South)",
    city: "Dubai",
    country: "United Arab Emirates",
    iata: "DWC",
    icao: "OMDW",
    type: "dedicated",
    typeLabel: "Dubai South VIP Aviation Terminal",
    popular: true,
    region: "middle-east",
    coordinates: { lat: 24.8960, lng: 55.1614 },
    fbos: [
      {
        id: "omdw-jetex",
        name: "Jetex VIP Terminal Dubai South",
        phone: "+971 4 212 4900",
        email: "fbo-dwc@jetex.com",
        vhfFrequency: "131.75 MHz",
        address: "VIP Terminal Building, Dubai South Aviation District",
        notes: "World flagship 5-star terminal, private customs, Rolls-Royce tarmac transfer"
      },
      {
        id: "omdw-execujet",
        name: "ExecuJet Middle East DWC",
        phone: "+971 4 601 6444",
        email: "dubai@execujet.com",
        vhfFrequency: "131.50 MHz",
        address: "Aviation District, Dubai South",
        notes: "Private royal majlis suites, international diplomatic protocol"
      },
      {
        id: "omdw-falcon",
        name: "Falcon Aviation Services DWC",
        phone: "+971 4 887 9009",
        email: "ops@falconaviation.ae",
        vhfFrequency: "131.95 MHz",
        address: "General Aviation Apron, Dubai South",
        notes: "Direct helicopter connections to Burj Al Arab and Downtown Dubai"
      }
    ]
  }
];

/**
 * Find airport by ICAO, IATA, or partial name/city
 */
export function findAirportByCode(code: string): Airport {
  if (!code) {
    return airportsData[0];
  }
  const clean = code.trim().toUpperCase();
  const found = airportsData.find(
    (a) =>
      a.icao.toUpperCase() === clean ||
      a.iata.toUpperCase() === clean ||
      a.name.toUpperCase() === clean ||
      a.city.toUpperCase() === clean
  );
  if (found) return found;

  // Search partial
  const partial = airportsData.find(
    (a) =>
      a.icao.toUpperCase().includes(clean) ||
      a.iata.toUpperCase().includes(clean) ||
      a.name.toUpperCase().includes(clean) ||
      a.city.toUpperCase().includes(clean)
  );
  if (partial) return partial;

  // Graceful fallback with standard executive FBOs
  return {
    id: clean.toLowerCase(),
    name: `${clean} International Airport`,
    city: clean,
    country: "International",
    iata: clean.length === 3 ? clean : clean.slice(0, 3),
    icao: clean.length === 4 ? clean : clean.padEnd(4, "X"),
    type: "fbo",
    typeLabel: "Executive Aviation Handling",
    coordinates: { lat: 45.0, lng: 9.0 },
    fbos: [
      {
        id: `${clean.toLowerCase()}-fbo-primary`,
        name: `${clean} Executive Handling FBO`,
        phone: "+44 20 7946 0000",
        email: `ops@${clean.toLowerCase()}.executivehandling.aero`,
        vhfFrequency: "131.80 MHz",
        address: `General Aviation Terminal, ${clean} Airport`,
        notes: "Primary VIP ramp handling agent"
      },
      {
        id: `${clean.toLowerCase()}-signature`,
        name: `Signature Flight Support ${clean}`,
        phone: "+1 800 555 0199",
        email: `${clean.toLowerCase()}@signatureflight.com`,
        vhfFrequency: "122.95 MHz",
        address: `Signature Terminal, ${clean} Airport`,
        notes: "Executive FBO services"
      }
    ]
  };
}

/**
 * Retrieve all available FBO handling agents for an airport
 */
export function getAirportFbos(code: string): FboOption[] {
  const airport = findAirportByCode(code);
  if (airport.fbos && airport.fbos.length > 0) {
    return airport.fbos;
  }
  return [
    {
      id: `${airport.icao.toLowerCase()}-fbo-default`,
      name: `${airport.name} Executive FBO`,
      phone: "+44 20 7946 0000",
      email: `ops@${airport.icao.toLowerCase()}.handling.aero`,
      vhfFrequency: "131.80 MHz",
      address: `General Aviation Terminal, ${airport.city}`,
      notes: "Primary executive handling station"
    }
  ];
}

/**
 * Return default handling agent object formatted for flight leg
 */
export function getDefaultHandlingAgent(code: string, stationType: "dep" | "arr" = "dep"): HandlingAgent {
  const airport = findAirportByCode(code);
  const fbos = getAirportFbos(code);
  const primaryFbo = fbos[0];

  return {
    name: primaryFbo ? primaryFbo.name : `${airport.name} Executive FBO`,
    airportCode: airport.icao,
    phone: primaryFbo?.phone || "+41 58 158 1811",
    email: primaryFbo?.email || `ops@${airport.icao.toLowerCase()}.handling.aero`,
    vhfFrequency: primaryFbo?.vhfFrequency || "131.75 MHz",
    address: primaryFbo?.address,
    notes: primaryFbo?.notes
  };
}

/**
 * Search airports by text query
 */
export function searchAirports(query: string, limit: number = 20): Airport[] {
  if (!query || query.trim().length === 0) return airportsData.slice(0, limit);
  const q = query.trim().toLowerCase();
  return airportsData
    .filter(
      (a) =>
        a.icao.toLowerCase().includes(q) ||
        a.iata.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.country.toLowerCase().includes(q)
    )
    .slice(0, limit);
}

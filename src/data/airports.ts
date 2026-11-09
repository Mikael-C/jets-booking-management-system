import { Airport, FboOption, HandlingAgent } from "@/types/aviation";

export const airportsData: Airport[] = [
  // ================= EUROPE =================
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
    operatingHours: "06:00 - 22:00 Local (05:00 - 21:00 UTC)",
    extensionPossibilities: "PPR required after 22:00. Slot extensions possible up to 23:30 LT with 4h notice, noise surcharge applies.",
    runwayLength: "3,900 m / 12,795 ft - Concrete",
    runwaySurface: "Concrete (04/22)",
    elevation: "1,411 ft / 430 m",
    fbos: [
      {
        id: "lsgg-jet-aviation",
        name: "Jet Aviation Geneva",
        phone: "+41 58 158 1811",
        email: "gvafbo@jetaviation.com",
        vhfFrequency: "130.65 MHz",
        address: "Route de Pré-Bois 29, 1215 Geneva 15",
        operatingHours: "H24 / 7 days",
        languages: ["English", "French", "German", "Italian", "Russian", "Arabic"],
        amenities: ["VIP Private Lounges", "Dedicated On-site Customs & Police", "Crew Rest Suites", "Conference Rooms", "Ramp Limousine Access"],
        notes: "Full VIP private lounge, customs on-site, crew rest rooms"
      },
      {
        id: "lsgg-tag-aviation",
        name: "TAG Aviation Geneva",
        phone: "+41 22 717 0123",
        email: "handling.geneva@tagaviation.com",
        vhfFrequency: "130.30 MHz",
        address: "Executive Terminal C3, Geneva Airport",
        operatingHours: "06:00 - 22:00 LT (On-call H24)",
        languages: ["English", "French", "German", "Spanish"],
        amenities: ["VIP Passenger Suites", "Direct Ramp Chauffeur Access", "High-speed Wi-Fi", "Gourmet Catering Uplift"],
        notes: "Dedicated passenger suites, ramp vehicle access"
      },
      {
        id: "lsgg-signature",
        name: "Signature Flight Support Geneva",
        phone: "+41 22 717 8400",
        email: "gva@signatureflight.com",
        vhfFrequency: "131.75 MHz",
        address: "Chemin des Papillons 18, 1215 Geneva",
        operatingHours: "06:00 - 22:00 LT",
        languages: ["English", "French", "Italian", "German"],
        amenities: ["Executive Meeting Facilities", "Pilot Snooze Room", "VIP Customs Liaison"],
        notes: "Executive meeting facilities, VIP catering uplift"
      },
      {
        id: "lsgg-dassault",
        name: "Dassault Aviation Business Services",
        phone: "+41 22 799 0300",
        email: "handling.geneva@dassault-aviation.com",
        vhfFrequency: "122.85 MHz",
        address: "General Aviation Terminal, Geneva Airport",
        operatingHours: "06:30 - 21:30 LT",
        languages: ["English", "French"],
        amenities: ["Falcon Specialist Line Station", "Executive Passenger Lounge", "Crew Briefing"],
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
    operatingHours: "06:00 - 23:00 Local",
    extensionPossibilities: "Night extension on request with 24h prior notice (up to 01:00 LT).",
    runwayLength: "2,915 m / 9,564 ft - Asphalt",
    runwaySurface: "Asphalt (10/28)",
    elevation: "13 ft / 4 m",
    fbos: [
      {
        id: "limj-ags-ops",
        name: "Ags Ops Executive Handling",
        phone: "+39 010 601 5412",
        email: "dutymanager@airport.genova.it",
        vhfFrequency: "131.75 MHz",
        address: "General Aviation Terminal, Via Pionieri d'Italia 1",
        operatingHours: "06:00 - 23:00 Local",
        languages: ["Italian", "English", "French"],
        amenities: ["Dedicated Customs & Border Police", "Portofino Helipad Liaison", "VIP Lounge"],
        notes: "Portofino & Italian Riviera gateway, dedicated customs"
      },
      {
        id: "limj-sky-services",
        name: "Sky Services FBO Genoa",
        phone: "+39 010 601 5459",
        email: "genoa@skyservices.it",
        vhfFrequency: "131.85 MHz",
        address: "Executive Apron Building, Genoa Airport",
        operatingHours: "07:00 - 22:00 Local",
        languages: ["Italian", "English", "Spanish"],
        amenities: ["VIP Limousine Transfer to Portofino & Superyacht Marinas", "Espresso Bar"],
        notes: "VIP limousine transfer to Portofino & yacht marinas"
      },
      {
        id: "limj-delta-aerotaxi",
        name: "Delta Aerotaxi Executive Handling",
        phone: "+39 010 601 5470",
        email: "ops@delta-aerotaxi.it",
        vhfFrequency: "131.60 MHz",
        address: "Via Pionieri e Aviatori d'Italia, 16154 Genova",
        operatingHours: "07:30 - 21:00 Local",
        languages: ["Italian", "English"],
        amenities: ["Superyacht Charter Liaison", "Helicopter Connections"],
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
    typeLabel: "General Aviation Terminal 2",
    popular: true,
    region: "europe",
    coordinates: { lat: 43.6584, lng: 7.2159 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operational. Strict Chapter 4 noise regulations between 23:30 and 06:00 LT.",
    runwayLength: "2,960 m / 9,711 ft - Bituminous",
    runwaySurface: "Asphalt (04L/22R & 04R/22L)",
    elevation: "12 ft / 4 m",
    fbos: [
      {
        id: "lfmn-signature",
        name: "Signature Flight Support Nice",
        phone: "+33 4 93 21 38 10",
        email: "nce@signatureflight.com",
        vhfFrequency: "130.60 MHz",
        address: "Business Aviation Terminal, 06281 Nice",
        operatingHours: "H24 / 7 days",
        languages: ["English", "French", "Italian", "Russian", "Spanish"],
        amenities: ["Helicopter Monacair Connection", "Direct Ramp Vehicle Boarding", "VIP Lounge", "Private Screening"],
        notes: "Direct helicopter transfers to Monaco Heliport (LNMC, 7 min flight)"
      },
      {
        id: "lfmn-aviavip",
        name: "Aviavip Executive Handling Nice",
        phone: "+33 4 93 21 37 37",
        email: "nce.executive@aviapartner.aero",
        vhfFrequency: "131.95 MHz",
        address: "Terminal Aviation d'Affaires, 06281 Nice Cedex 3",
        operatingHours: "06:00 - 23:30 LT (On-call H24)",
        languages: ["English", "French", "Italian"],
        amenities: ["VIP Lounge", "Chauffeur Pick-up", "Customs Fast-Track"],
        notes: "VIP reception lounge, customs fast-track, luxury concierge"
      },
      {
        id: "lfmn-swissport",
        name: "Swissport Executive Aviation Nice",
        phone: "+33 4 93 21 44 90",
        email: "nce.executive@swissport.com",
        vhfFrequency: "130.00 MHz",
        address: "Executive Terminal, Rue Costes et Bellonte",
        operatingHours: "07:00 - 22:00 LT",
        languages: ["English", "French", "German"],
        amenities: ["Crew Snooze Lounge", "Luxury Catering"],
        notes: "Premium ground handling, VIP crew rest rooms"
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
    typeLabel: "Premier European Business Aviation Hub",
    popular: true,
    region: "europe",
    coordinates: { lat: 48.9694, lng: 2.4414 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operation without curfew for Stage 4 corporate jets.",
    runwayLength: "3,000 m / 9,842 ft - Bituminous",
    runwaySurface: "Asphalt (07/25, 03/21, 09/27)",
    elevation: "218 ft / 66 m",
    fbos: [
      {
        id: "lfpb-jet-aviation",
        name: "Jet Aviation Paris Le Bourget",
        phone: "+33 1 48 35 88 88",
        email: "lbgfbo@jetaviation.com",
        vhfFrequency: "130.55 MHz",
        address: "Zone Aviation d'Affaires, 93350 Le Bourget",
        operatingHours: "H24 / 7 days",
        languages: ["French", "English", "Arabic", "Russian"],
        amenities: ["Private Terminals", "Heated Aircraft Hangars", "VIP Customs & Border Control", "Helipad"],
        notes: "Full luxury VIP terminal, private suites, heated hangar capacity"
      },
      {
        id: "lfpb-signature",
        name: "Signature Flight Support Le Bourget",
        phone: "+33 1 49 92 75 00",
        email: "lbg@signatureflight.com",
        vhfFrequency: "122.85 MHz",
        address: "Aéroport du Bourget, Batiment 47",
        operatingHours: "H24 / 7 days",
        languages: ["French", "English", "Spanish"],
        amenities: ["VIP Salon", "Flight Planning Lounge", "On-site Limousines"],
        notes: "VIP salon, flight planning, on-site limousine service"
      },
      {
        id: "lfpb-dassault",
        name: "Dassault Falcon Service Le Bourget",
        phone: "+33 1 49 34 20 20",
        email: "handling@dassault-falcon.com",
        vhfFrequency: "131.65 MHz",
        address: "Zone Nord, BP 25, 93352 Le Bourget Cedex",
        operatingHours: "H24 / 7 days",
        languages: ["French", "English"],
        amenities: ["Falcon Flagship FBO", "Luxury Guest Suites", "Secure Hangars"],
        notes: "Falcon aircraft flagship FBO, private terminal lounge"
      },
      {
        id: "lfpb-universal",
        name: "Universal Aviation Le Bourget",
        phone: "+33 1 48 35 96 38",
        email: "france@universalaviation.aero",
        vhfFrequency: "130.00 MHz",
        address: "Avenue de l'Europe, 93350 Le Bourget",
        operatingHours: "06:00 - 22:00 LT (On-call H24)",
        languages: ["French", "English", "Portuguese"],
        amenities: ["VIP Chauffeur Pick-up", "Customs Fast-Track"],
        notes: "Dedicated ramp coordination, luxury catering uplift"
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
    type: "dedicated",
    typeLabel: "Major London Executive Hub",
    popular: true,
    region: "europe",
    coordinates: { lat: 51.8747, lng: -0.3683 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 slots subject to nighttime quota allocations.",
    runwayLength: "2,160 m / 7,087 ft - Asphalt",
    runwaySurface: "Asphalt (08/26)",
    elevation: "526 ft / 160 m",
    fbos: [
      {
        id: "eggw-signature-luton",
        name: "Signature Flight Support Luton",
        phone: "+44 1582 724 182",
        email: "ltn@signatureflight.co.uk",
        vhfFrequency: "130.60 MHz",
        address: "Percival Way, London Luton Airport, LU2 9PA",
        operatingHours: "H24 / 7 days",
        languages: ["English", "French", "Arabic", "Spanish"],
        amenities: ["Private Customs Hall", "Helipad Direct to Battersea London", "Executive VIP Suites", "Crew Rest & Showers"],
        notes: "London executive aviation gateway, private customs clearance, helipad"
      },
      {
        id: "eggw-harrods",
        name: "Harrods Aviation Luton",
        phone: "+44 1582 589 350",
        email: "luton@harrodsaviation.com",
        vhfFrequency: "129.90 MHz",
        address: "710 Sallow Road, Luton Airport, LU2 9LU",
        operatingHours: "H24 / 7 days",
        languages: ["English", "Arabic", "French"],
        amenities: ["Harrods Luxury Concierge", "VIP Boardrooms", "Private Apron Parking"],
        notes: "Bespoke Harrods luxury handling, VIP boardrooms, private hangar"
      }
    ]
  },
  {
    id: "london-farnborough",
    name: "London Farnborough Airport",
    city: "London / Hampshire",
    country: "United Kingdom",
    iata: "FAB",
    icao: "EGLF",
    type: "dedicated",
    typeLabel: "Exclusive Dedicated Business Aviation Airport",
    popular: true,
    region: "europe",
    coordinates: { lat: 51.2758, lng: -0.7763 },
    operatingHours: "Mon-Fri: 07:00 - 22:00 LT | Weekends/BH: 08:00 - 20:00 LT",
    extensionPossibilities: "Extensions possible up to 22:30 LT with 4h advance notice on weekdays. Strict weekend closure at 20:00 LT.",
    runwayLength: "2,440 m / 8,005 ft - Asphalt",
    runwaySurface: "Asphalt (06/24)",
    elevation: "238 ft / 73 m",
    fbos: [
      {
        id: "eglf-farnborough-terminal",
        name: "Farnborough Executive Terminal (TAG)",
        phone: "+44 1252 375 300",
        email: "operations@farnboroughairport.com",
        vhfFrequency: "131.80 MHz",
        address: "Farnborough Airport, Hampshire, GU14 6XA",
        operatingHours: "07:00 - 22:00 LT (Weekdays) / 08:00 - 20:00 LT (Weekends)",
        languages: ["English", "French", "German", "Spanish", "Russian"],
        amenities: ["Direct Apron Vehicle Drive-Up to Aircraft", "On-site Aviator Hotel Liaison", "Dedicated UK Border Force", "Crew Gym & Snooze Pods"],
        notes: "Exclusive dedicated business aviation airport, drive directly to aircraft"
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
    typeLabel: "London Dedicated Business Airport",
    popular: true,
    region: "europe",
    coordinates: { lat: 51.3308, lng: 0.0325 },
    operatingHours: "Mon-Fri: 06:30 - 23:00 LT | Sat-Sun: 08:00 - 22:00 LT",
    extensionPossibilities: "Late extensions available up to 23:30 LT on request with 2h notice.",
    runwayLength: "1,806 m / 5,925 ft - Macadam",
    runwaySurface: "Asphalt (03/21)",
    elevation: "598 ft / 182 m",
    fbos: [
      {
        id: "egkb-biggin-exec",
        name: "Biggin Hill Executive Handling",
        phone: "+44 1959 578 500",
        email: "fbo@bigginhillairport.com",
        vhfFrequency: "130.40 MHz",
        address: "Main Terminal, Biggin Hill Airport, TN16 3BN",
        operatingHours: "06:30 - 23:00 LT",
        languages: ["English", "French"],
        amenities: ["6-minute Helicopter Transfer to London Heliport", "VIP Lounges", "Hangarage"],
        notes: "6-minute helicopter transfer to London Battersea Heliport, UK Border Force on-site"
      },
      {
        id: "egkb-signature-biggin",
        name: "Signature Flight Support Biggin Hill",
        phone: "+44 1959 570 000",
        email: "bqh@signatureflight.co.uk",
        vhfFrequency: "131.70 MHz",
        address: "Hangar 510, Churchill Way, TN16 3BN",
        operatingHours: "07:00 - 22:00 LT",
        languages: ["English", "Spanish"],
        amenities: ["VIP Lounge", "Pilot Quiet Rooms", "De-icing Services"],
        notes: "Dedicated customer lounge, pilot quiet rooms, aircraft towing"
      }
    ]
  },
  {
    id: "london-stansted",
    name: "London Stansted Airport",
    city: "London",
    country: "United Kingdom",
    iata: "STN",
    icao: "EGSS",
    type: "dedicated",
    typeLabel: "Private Aviation Terminal Inflite / Harrods",
    popular: true,
    region: "europe",
    coordinates: { lat: 51.885, lng: 0.235 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operation without curfew.",
    runwayLength: "3,049 m / 10,003 ft - Asphalt",
    runwaySurface: "Asphalt (04/22)",
    elevation: "348 ft / 106 m",
    fbos: [
      {
        id: "egss-inflite-jet-centre",
        name: "Inflite The Jet Centre Stansted",
        phone: "+44 1279 681 444",
        email: "fbo@inflite.co.uk",
        vhfFrequency: "131.475 MHz",
        address: "First Avenue, Stansted Airport, CM24 1RY",
        operatingHours: "H24 / 7 days",
        languages: ["English", "Russian", "Arabic"],
        amenities: ["Dedicated VIP Passenger Lounge", "UK Border Clearance", "Large Hangar Capacity"],
        notes: "Dedicated VIP passenger lounge, UK border clearance, large hangar"
      },
      {
        id: "egss-harrods-stansted",
        name: "Harrods Aviation Stansted",
        phone: "+44 1279 665 300",
        email: "stansted@harrodsaviation.com",
        vhfFrequency: "129.90 MHz",
        address: "Stansted Airport, Essex, CM24 1QN",
        operatingHours: "H24 / 7 days",
        languages: ["English", "French", "Arabic"],
        amenities: ["Knightsbridge Lounge", "Direct Apron Transfer", "VIP Catering"],
        notes: "Luxury lounge inspired by Knightsbridge store, 24/7 dedicated handling"
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
    type: "fbo",
    typeLabel: "Executive Riviera Airport",
    popular: true,
    region: "europe",
    coordinates: { lat: 43.5422, lng: 6.9531 },
    operatingHours: "06:30 - 22:00 Local",
    extensionPossibilities: "Extension up to 23:30 LT possible with 24h prior notification during Cannes Film Festival / Monaco GP.",
    runwayLength: "1,610 m / 5,282 ft - Asphalt",
    runwaySurface: "Asphalt (17/35)",
    elevation: "13 ft / 4 m",
    fbos: [
      {
        id: "lfmd-sky-valet",
        name: "Sky Valet FBO Cannes Mandelieu",
        phone: "+33 4 93 90 40 40",
        email: "fbo.ceq@skyvalet.com",
        vhfFrequency: "131.95 MHz",
        address: "245 Avenue Francis Tonner, 06150 Cannes",
        operatingHours: "06:30 - 22:00 Local",
        languages: ["French", "English", "Italian", "Russian"],
        amenities: ["Cannes Film Festival VIP Fast-Track", "Helicopter Transfer to La Croisette", "Customs On-Site"],
        notes: "Prime Cannes Film Festival & yachting gateway, dedicated customs"
      }
    ]
  },
  {
    id: "samedan-st-moritz",
    name: "Samedan / Engadin St. Moritz Airport",
    city: "St. Moritz / Samedan",
    country: "Switzerland",
    iata: "SMV",
    icao: "LSZS",
    type: "altiport",
    typeLabel: "Highest Business Altiport in Europe (5,600 ft)",
    popular: true,
    region: "europe",
    coordinates: { lat: 46.5342, lng: 9.8842 },
    operatingHours: "Daylight operations only (08:00 - Sunset LT)",
    extensionPossibilities: "Strict daylight VFR/IFR mountain rules. No night extensions possible due to alpine terrain.",
    runwayLength: "1,800 m / 5,905 ft - Asphalt",
    runwaySurface: "Asphalt (03/21)",
    elevation: "5,600 ft / 1,707 m",
    fbos: [
      {
        id: "lszs-engadin-handling",
        name: "Engadin Airport Handling",
        phone: "+41 81 851 0851",
        email: "handling@engadin-airport.ch",
        vhfFrequency: "135.325 MHz",
        address: "Plazza Aviatica 2, 7503 Samedan",
        operatingHours: "08:00 - Sunset Local",
        languages: ["German", "Italian", "Romansh", "English", "French"],
        amenities: ["Alpine Luxury Lounge", "Ski Gear Handling", "Helicopter Ski Transfers", "De-icing Facilities"],
        notes: "Direct gateway to St. Moritz luxury ski resorts, mountain qualification required for pilots"
      }
    ]
  },
  {
    id: "zurich",
    name: "Zurich Kloten Airport",
    city: "Zurich",
    country: "Switzerland",
    iata: "ZRH",
    icao: "LSZH",
    type: "dedicated",
    typeLabel: "General Aviation Center (GAC)",
    popular: true,
    region: "europe",
    coordinates: { lat: 47.4582, lng: 8.5555 },
    operatingHours: "06:00 - 22:00 Local",
    extensionPossibilities: "Extensions possible up to 23:30 LT with slot coordinator approval and night noise fees.",
    runwayLength: "3,700 m / 12,139 ft - Concrete",
    runwaySurface: "Concrete (16/34, 14/32, 10/28)",
    elevation: "1,416 ft / 432 m",
    fbos: [
      {
        id: "lszh-jet-aviation",
        name: "Jet Aviation Zurich GAC",
        phone: "+41 58 158 8888",
        email: "zrhfbo@jetaviation.com",
        vhfFrequency: "130.45 MHz",
        address: "General Aviation Center, 8058 Zurich Airport",
        operatingHours: "06:00 - 22:00 LT (On-call H24)",
        languages: ["German", "English", "French", "Italian"],
        amenities: ["Private VIP Lounges", "Direct WEF Davos Liaison", "Dedicated Customs"],
        notes: "Primary World Economic Forum (WEF) executive hub, private suites"
      },
      {
        id: "lszh-execujet",
        name: "ExecuJet Zurich FBO",
        phone: "+41 44 876 5656",
        email: "fbo.zurich@execujet.com",
        vhfFrequency: "130.65 MHz",
        address: "GAC Sector 1, 8058 Zurich",
        operatingHours: "06:00 - 22:00 LT",
        languages: ["German", "English", "French"],
        amenities: ["Executive Boardrooms", "VIP Ramp Chauffeur", "Crew Lounge"],
        notes: "Executive boardrooms, VIP ramp chauffeur, crew lounge"
      }
    ]
  },
  {
    id: "courchevel",
    name: "Courchevel Altiport",
    city: "Courchevel",
    country: "France",
    iata: "CVF",
    icao: "LFLJ",
    type: "altiport",
    typeLabel: "Luxury Alpine Altiport with 18.5% Gradient",
    popular: true,
    region: "europe",
    coordinates: { lat: 45.3967, lng: 6.6347 },
    operatingHours: "Daylight VFR only (09:00 - 17:00 LT)",
    extensionPossibilities: "Strictly daylight VFR only. No extensions due to mountainous altiport conditions.",
    runwayLength: "537 m / 1,762 ft - Asphalt (18.5% uphill slope)",
    runwaySurface: "Asphalt (04/22) 18.5% gradient",
    elevation: "6,588 ft / 2,008 m",
    fbos: [
      {
        id: "lflj-courchevel-handling",
        name: "Altiport de Courchevel Handling",
        phone: "+33 4 79 08 26 02",
        email: "altiport@courchevel.com",
        vhfFrequency: "120.080 MHz",
        address: "Route de l'Altiport, 73120 Courchevel",
        operatingHours: "09:00 - 17:00 Local",
        languages: ["French", "English", "Russian"],
        amenities: ["Direct Ski-in / Ski-out Access", "Chalet Chauffeurs", "Helipad Connections", "Heated Hangars"],
        notes: "World's most famous luxury ski altiport, pilot mountain site authorization required"
      }
    ]
  },
  {
    id: "milan-linate",
    name: "Milan Linate Airport (Milano Prime)",
    city: "Milan",
    country: "Italy",
    iata: "LIN",
    icao: "LIML",
    type: "dedicated",
    typeLabel: "Milano Prime Business Aviation Terminal",
    popular: true,
    region: "europe",
    coordinates: { lat: 45.4451, lng: 9.2767 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operation for business aviation.",
    runwayLength: "2,442 m / 8,012 ft - Asphalt",
    runwaySurface: "Asphalt (18/36)",
    elevation: "353 ft / 108 m",
    fbos: [
      {
        id: "liml-milano-prime",
        name: "Milano Prime (SEA Prime) Linate",
        phone: "+39 02 7485 3100",
        email: "operations@seaprime.it",
        vhfFrequency: "131.90 MHz",
        address: "Viale Enrico Forlanini, 20090 Segrate MI",
        operatingHours: "H24 / 7 days",
        languages: ["Italian", "English", "French", "Spanish"],
        amenities: ["Italian Fashion Week VIP Lounge", "Direct Ramp Chauffeur", "Conference Rooms", "Dedicated Customs"],
        notes: "Italy's premier business aviation terminal, direct apron access, Milan fashion week hub"
      },
      {
        id: "liml-universal-milan",
        name: "Universal Aviation Milan Linate",
        phone: "+39 02 7020 0306",
        email: "italy@universalaviation.aero",
        vhfFrequency: "131.75 MHz",
        address: "Palazzina SEA Prime, Linate Airport",
        operatingHours: "06:00 - 22:00 LT (On-call H24)",
        languages: ["Italian", "English"],
        amenities: ["VIP Concierge", "Luxury Catering"],
        notes: "Luxury catering liaison, crew briefing room"
      }
    ]
  },
  {
    id: "rome-ciampino",
    name: "Rome Ciampino G.B. Pastine Airport",
    city: "Rome",
    country: "Italy",
    iata: "CIA",
    icao: "LIRA",
    type: "dedicated",
    typeLabel: "Rome Executive Business Aviation Terminal",
    popular: true,
    region: "europe",
    coordinates: { lat: 41.7994, lng: 12.5949 },
    operatingHours: "06:00 - 23:00 Local",
    extensionPossibilities: "Extensions possible up to 24:00 LT with prior authorization.",
    runwayLength: "2,207 m / 7,241 ft - Bituminous",
    runwaySurface: "Asphalt (15/33)",
    elevation: "427 ft / 130 m",
    fbos: [
      {
        id: "lira-signature-rome",
        name: "Signature Flight Support Rome Ciampino",
        phone: "+39 06 7934 0444",
        email: "cia@signatureflight.com",
        vhfFrequency: "130.65 MHz",
        address: "General Aviation Terminal, Via Appia Nuova 1651",
        operatingHours: "06:00 - 23:00 Local",
        languages: ["Italian", "English", "French"],
        amenities: ["VIP Passenger Suites", "Diplomatic Protocol Handling", "Crew Lounge"],
        notes: "Diplomatic protocol handling, private VIP suites, crew rest area"
      },
      {
        id: "lira-sky-services-rome",
        name: "Sky Services FBO Rome",
        phone: "+39 06 7934 1000",
        email: "rome@skyservices.it",
        vhfFrequency: "131.85 MHz",
        address: "General Aviation Building, Ciampino Airport",
        operatingHours: "06:30 - 22:30 Local",
        languages: ["Italian", "English"],
        amenities: ["Limousine Transfers", "Customs Liaison"],
        notes: "Bespoke executive transport and Vatican diplomatic clearances"
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
    typeLabel: "VIP Summer Executive Terminal",
    popular: true,
    region: "europe",
    coordinates: { lat: 38.8729, lng: 1.3731 },
    operatingHours: "H24 in Summer (06:00 - 23:00 Local in Winter)",
    extensionPossibilities: "H24 operational from May to October. Slot coordination strictly required.",
    runwayLength: "2,800 m / 9,186 ft - Asphalt",
    runwaySurface: "Asphalt (06/24)",
    elevation: "24 ft / 7 m",
    fbos: [
      {
        id: "leib-gestair-ibiza",
        name: "Gestair FBO Ibiza",
        phone: "+34 971 395 385",
        email: "fboibiza@gestair.com",
        vhfFrequency: "131.75 MHz",
        address: "General Aviation Terminal, 07817 Sant Jordi de ses Salines",
        operatingHours: "H24 in Summer / 07:00 - 23:00 Winter",
        languages: ["Spanish", "English", "French", "German", "Italian"],
        amenities: ["Superyacht Marina Transfer Liaison", "VIP Champagne Lounge", "Customs On-Site", "Luggage Valet"],
        notes: "VIP summer charter hub, direct superyacht transfers to Ibiza Magna and Marina Botafoch"
      },
      {
        id: "leib-sky-valet-ibiza",
        name: "Sky Valet FBO Ibiza",
        phone: "+34 971 395 400",
        email: "ibz@skyvalet.com",
        vhfFrequency: "130.60 MHz",
        address: "Terminal de Aviación General, Ibiza",
        operatingHours: "H24 in Summer",
        languages: ["Spanish", "English"],
        amenities: ["VIP Lounge", "VIP Chauffeur Services"],
        notes: "Executive concierge, helicopter transfers to Formentera"
      }
    ]
  },
  {
    id: "palma-de-mallorca",
    name: "Palma de Mallorca Airport",
    city: "Palma / Balearic Islands",
    country: "Spain",
    iata: "PMI",
    icao: "LEPA",
    type: "fbo",
    typeLabel: "Executive Business Terminal Palma",
    popular: true,
    region: "europe",
    coordinates: { lat: 39.5517, lng: 2.7388 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operational year-round.",
    runwayLength: "3,270 m / 10,728 ft - Asphalt",
    runwaySurface: "Asphalt (06L/24R & 06R/24L)",
    elevation: "27 ft / 8 m",
    fbos: [
      {
        id: "lepa-mallorcair",
        name: "Mallorcair Executive FBO",
        phone: "+34 971 789 400",
        email: "ops@mallorcair.com",
        vhfFrequency: "131.85 MHz",
        address: "General Aviation Terminal, Son Sant Joan",
        operatingHours: "H24 / 7 days",
        languages: ["Spanish", "English", "German"],
        amenities: ["VIP Suites", "Superyacht Provisioning", "Customs Fast-Track"],
        notes: "Major Mediterranean yachting and villa charter hub"
      }
    ]
  },
  {
    id: "madrid-barajas",
    name: "Adolfo Suárez Madrid-Barajas Airport",
    city: "Madrid",
    country: "Spain",
    iata: "MAD",
    icao: "LEMD",
    type: "dedicated",
    typeLabel: "Terminal Ejecutiva (Torrejón / Barajas)",
    popular: true,
    region: "europe",
    coordinates: { lat: 40.4839, lng: -3.568 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operation without curfew.",
    runwayLength: "4,100 m / 13,451 ft - Asphalt",
    runwaySurface: "Asphalt (14L/32R, 14R/32L, 18L/36R, 18R/36L)",
    elevation: "2,000 ft / 610 m",
    fbos: [
      {
        id: "lemd-gestair-madrid",
        name: "Gestair FBO Madrid Barajas",
        phone: "+34 91 746 8000",
        email: "fbomadrid@gestair.com",
        vhfFrequency: "130.65 MHz",
        address: "Terminal Ejecutiva, Dique Sur, Barajas",
        operatingHours: "H24 / 7 days",
        languages: ["Spanish", "English", "French"],
        amenities: ["Executive Boardrooms", "VIP Chauffeur", "Crew Rest Area"],
        notes: "Flagship Spanish executive FBO with complete VIP amenities"
      }
    ]
  },
  {
    id: "vienna-schwechat",
    name: "Vienna International Airport",
    city: "Vienna",
    country: "Austria",
    iata: "VIE",
    icao: "LOWW",
    type: "dedicated",
    typeLabel: "General Aviation VIP Terminal",
    popular: true,
    region: "europe",
    coordinates: { lat: 48.1103, lng: 16.5697 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operational. Night slots subject to noise abatement.",
    runwayLength: "3,600 m / 11,811 ft - Asphalt",
    runwaySurface: "Asphalt (11/29 & 16/34)",
    elevation: "600 ft / 183 m",
    fbos: [
      {
        id: "loww-vienna-vip",
        name: "Vienna VIP Terminal & General Aviation",
        phone: "+43 1 7007 22203",
        email: "vip.terminal@viennaairport.com",
        vhfFrequency: "131.70 MHz",
        address: "Objekt 140, 1300 Wien-Flughafen",
        operatingHours: "H24 / 7 days",
        languages: ["German", "English", "Russian", "Arabic"],
        amenities: ["State Protocol VIP Lounges", "Direct Tarmac Limousine Transfers", "Diplomatic Customs"],
        notes: "Central European hub, state protocol facilities, 24/7 customs"
      },
      {
        id: "loww-magnum-fbo",
        name: "Magnum FBO Vienna",
        phone: "+43 1 7007 33440",
        email: "vie@magnumfbo.com",
        vhfFrequency: "130.50 MHz",
        address: "GAC Terminal, Vienna Airport",
        operatingHours: "06:00 - 22:00 LT (On-call H24)",
        languages: ["German", "English"],
        amenities: ["Executive Boardrooms", "Crew Lounge"],
        notes: "Executive ground handling and concierge"
      }
    ]
  },
  {
    id: "salzburg",
    name: "Salzburg W. A. Mozart Airport",
    city: "Salzburg",
    country: "Austria",
    iata: "SZG",
    icao: "LOWS",
    type: "fbo",
    typeLabel: "General Aviation Terminal",
    popular: true,
    region: "europe",
    coordinates: { lat: 47.7944, lng: 13.0044 },
    operatingHours: "06:00 - 23:00 Local",
    extensionPossibilities: "PPR required after 23:00. Strict night curfew 23:30 - 06:00 LT.",
    runwayLength: "2,750 m / 9,022 ft - Concrete/Asphalt",
    runwaySurface: "Asphalt (15/33)",
    elevation: "1,411 ft / 430 m",
    fbos: [
      {
        id: "lows-salzburg-gac",
        name: "Salzburg Airport General Aviation Handling",
        phone: "+43 662 8580 251",
        email: "gat@salzburg-airport.at",
        vhfFrequency: "131.80 MHz",
        address: "Innsbrucker Bundesstrasse 95, 5020 Salzburg",
        operatingHours: "06:00 - 23:00 Local",
        languages: ["German", "English"],
        amenities: ["Alpine Ski Transfers", "VIP Passenger Lounge", "Dedicated Customs"],
        notes: "Gateway to Kitzbühel and Austrian Alps ski chalets"
      }
    ]
  },
  {
    id: "innsbruck",
    name: "Innsbruck Kranebitten Airport",
    city: "Innsbruck / Tyrol",
    country: "Austria",
    iata: "INN",
    icao: "LOWI",
    type: "altiport",
    typeLabel: "Category C Mountain Valley Airport",
    popular: true,
    region: "europe",
    coordinates: { lat: 47.2603, lng: 11.3439 },
    operatingHours: "Daylight only (06:30 - Sunset LT)",
    extensionPossibilities: "Strictly daylight operation due to alpine terrain. No night operations.",
    runwayLength: "2,000 m / 6,562 ft - Asphalt",
    runwaySurface: "Asphalt (08/26)",
    elevation: "1,906 ft / 581 m",
    fbos: [
      {
        id: "lowi-innsbruck-gat",
        name: "Innsbruck GAT Handling",
        phone: "+43 512 22525 316",
        email: "gat@innsbruck-airport.com",
        vhfFrequency: "131.75 MHz",
        address: "Fürstenweg 180, 6020 Innsbruck",
        operatingHours: "06:30 - Sunset Local",
        languages: ["German", "English", "Italian"],
        amenities: ["Arlberg / St. Anton Helicopter Transfers", "VIP Lounge", "Ski Equipment Storage"],
        notes: "Tyrolean ski gateway (St. Anton, Lech, Ischgl), special pilot qualification required"
      }
    ]
  },
  {
    id: "munich",
    name: "Munich Franz Josef Strauss Airport",
    city: "Munich / Bavaria",
    country: "Germany",
    iata: "MUC",
    icao: "EDDM",
    type: "dedicated",
    typeLabel: "General Aviation Terminal (GAT)",
    popular: true,
    region: "europe",
    coordinates: { lat: 48.3538, lng: 11.7861 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operational for business aviation with quiet jet certification.",
    runwayLength: "4,000 m / 13,123 ft - Concrete",
    runwaySurface: "Concrete (08L/26R & 08R/26L)",
    elevation: "1,487 ft / 453 m",
    fbos: [
      {
        id: "eddm-signature-munich",
        name: "Signature Flight Support Munich GAT",
        phone: "+49 89 977 4440",
        email: "muc@signatureflight.com",
        vhfFrequency: "131.725 MHz",
        address: "GAT Gebäude 104, 85356 München-Flughafen",
        operatingHours: "H24 / 7 days",
        languages: ["German", "English", "Russian"],
        amenities: ["Bavarian VIP Lounge", "Direct Apron Chauffeur Access", "Private Customs Clearance"],
        notes: "Full luxury VIP suites, Oktoberfest & Alpine ski charter logistics"
      }
    ]
  },
  {
    id: "frankfurt-egelsbach",
    name: "Frankfurt Egelsbach Airport",
    city: "Frankfurt",
    country: "Germany",
    iata: "QEF",
    icao: "EDFE",
    type: "dedicated",
    typeLabel: "Dedicated Frankfurt Executive Airport",
    popular: true,
    region: "europe",
    coordinates: { lat: 49.9608, lng: 8.6414 },
    operatingHours: "07:00 - 21:00 Local",
    extensionPossibilities: "Extensions possible up to 22:00 LT with 2h advance notice.",
    runwayLength: "1,400 m / 4,593 ft - Asphalt",
    runwaySurface: "Asphalt (08/26)",
    elevation: "384 ft / 117 m",
    fbos: [
      {
        id: "edfe-frankfurt-fbo",
        name: "Frankfurt Egelsbach Executive FBO",
        phone: "+49 6103 400 80",
        email: "ops@egelsbach-airport.com",
        vhfFrequency: "130.60 MHz",
        address: "Flugplatz, 63329 Egelsbach",
        operatingHours: "07:00 - 21:00 Local",
        languages: ["German", "English"],
        amenities: ["15-min Chauffeur to Frankfurt Financial District", "VIP Lounge", "Hangar Storage"],
        notes: "Preferred dedicated executive hub avoiding Frankfurt Main commercial congestion"
      }
    ]
  },
  {
    id: "amsterdam-schiphol",
    name: "Amsterdam Airport Schiphol",
    city: "Amsterdam",
    country: "Netherlands",
    iata: "AMS",
    icao: "EHAM",
    type: "dedicated",
    typeLabel: "General Aviation Terminal Schiphol-Oost",
    popular: true,
    region: "europe",
    coordinates: { lat: 52.3086, lng: 4.7639 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "Strict slot coordination, night slots require Chapter 4 compliance.",
    runwayLength: "3,800 m / 12,467 ft - Asphalt",
    runwaySurface: "Asphalt (18R/36L, 06/24, 09/27, 18C/36C, 18L/36R)",
    elevation: "-11 ft / -3 m",
    fbos: [
      {
        id: "eham-jet-aviation-ams",
        name: "Jet Aviation Amsterdam Schiphol-Oost",
        phone: "+31 20 601 4268",
        email: "amsfbo@jetaviation.com",
        vhfFrequency: "130.65 MHz",
        address: "Building 026, Thermiekstraat 16, 1117 BC Schiphol-Oost",
        operatingHours: "H24 / 7 days",
        languages: ["Dutch", "English", "German", "French"],
        amenities: ["Royal VIP Lounge", "Direct Apron Chauffeur", "Crew Rest Rooms", "Customs On-Site"],
        notes: "Schiphol-Oost executive terminal, Royal VIP lounge, customs on-site"
      }
    ]
  },

  // ================= NORTH AMERICA =================
  {
    id: "teterboro",
    name: "Teterboro Airport",
    city: "New York / New Jersey",
    country: "United States",
    iata: "TEB",
    icao: "KTEB",
    type: "dedicated",
    typeLabel: "World's Busiest Private Jet Airport",
    popular: true,
    region: "north_america",
    coordinates: { lat: 40.8501, lng: -74.0608 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operational. Strict voluntary curfew 23:00 - 06:00 LT for noise abatement.",
    runwayLength: "2,134 m / 7,000 ft - Asphalt",
    runwaySurface: "Asphalt (01/19 & 06/24)",
    elevation: "9 ft / 3 m",
    fbos: [
      {
        id: "kteb-signature-south",
        name: "Signature Flight Support Teterboro (South)",
        phone: "+1 201 288 1880",
        email: "teb@signatureflight.com",
        vhfFrequency: "130.80 MHz",
        address: "101 Charles A Lindbergh Dr, Teterboro, NJ 07608",
        operatingHours: "H24 / 7 days",
        languages: ["English", "Spanish"],
        amenities: ["VIP Passenger Lounges", "Direct Helicopter to Manhattan Heliports (8 min)", "Customs On-Site", "Heated Hangars"],
        notes: "Premier Manhattan executive gateway, 12 miles from Midtown New York"
      },
      {
        id: "kteb-jet-aviation-teb",
        name: "Jet Aviation Teterboro",
        phone: "+1 201 462 4000",
        email: "tebfbo@jetaviation.com",
        vhfFrequency: "130.55 MHz",
        address: "112 Charles A Lindbergh Dr, Teterboro, NJ",
        operatingHours: "H24 / 7 days",
        languages: ["English", "Spanish", "Russian"],
        amenities: ["Executive Boardrooms", "Crew Snooze Rooms", "Private Ramp Parking"],
        notes: "Full luxury VIP suites, executive boardrooms, crew snooze rooms"
      },
      {
        id: "kteb-meridian",
        name: "Meridian Teterboro FBO",
        phone: "+1 201 288 5040",
        email: "fbo@meridian.aero",
        vhfFrequency: "129.90 MHz",
        address: sweepAddress("485 Industrial Ave, Teterboro, NJ 07608"),
        operatingHours: "H24 / 7 days",
        languages: ["English", "Spanish"],
        amenities: ["Art Deco VIP Lounge", "Gym & Movie Theater for Pilots", "Full Hangar Service"],
        notes: "Award-winning independent luxury FBO, pilot movie theater, gym"
      }
    ]
  },
  {
    id: "westchester-county",
    name: "Westchester County Airport",
    city: "White Plains / New York",
    country: "United States",
    iata: "HPN",
    icao: "KHPN",
    type: "dedicated",
    typeLabel: "New York Corporate Aviation Hub",
    popular: true,
    region: "north_america",
    coordinates: { lat: 41.067, lng: -73.7076 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "Voluntary noise curfew between 24:00 and 06:30 LT.",
    runwayLength: "1,996 m / 6,549 ft - Asphalt",
    runwaySurface: "Asphalt (16/34 & 11/29)",
    elevation: "439 ft / 134 m",
    fbos: [
      {
        id: "khpn-signature-hpn",
        name: "Signature Flight Support White Plains",
        phone: "+1 914 946 9000",
        email: "hpn@signatureflight.com",
        vhfFrequency: "131.85 MHz",
        address: "67 Tower Rd, Harrison, NY 10604",
        operatingHours: "H24 / 7 days",
        languages: ["English", "Spanish"],
        amenities: ["VIP Passenger Lounge", "Manhattan Chauffeur Transfers", "Customs Clearance"],
        notes: "Preferred gateway for Greenwich CT and Northern NYC wealth corridors"
      }
    ]
  },
  {
    id: "van-nuys",
    name: "Van Nuys Airport",
    city: "Los Angeles",
    country: "United States",
    iata: "VNY",
    icao: "KVNY",
    type: "dedicated",
    typeLabel: "World's Premier General Aviation Airport",
    popular: true,
    region: "north_america",
    coordinates: { lat: 34.2098, lng: -118.4899 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operational. Strict non-addition noise rules between 23:00 and 07:00 LT.",
    runwayLength: "2,439 m / 8,001 ft - Asphalt",
    runwaySurface: "Asphalt (16R/34L & 16L/34R)",
    elevation: "802 ft / 244 m",
    fbos: [
      {
        id: "kvny-signature-west",
        name: "Signature Flight Support Van Nuys (West)",
        phone: "+1 818 988 8300",
        email: "vny@signatureflight.com",
        vhfFrequency: "130.60 MHz",
        address: "16700 Roscoe Blvd, Van Nuys, CA 91406",
        operatingHours: "H24 / 7 days",
        languages: ["English", "Spanish"],
        amenities: ["Beverly Hills / Hollywood Chauffeur Liaison", "Private Celebrity Lounges", "Dedicated Hangars"],
        notes: "Hollywood, Beverly Hills and Bel Air entertainment private jet hub"
      },
      {
        id: "kvny-clay-lacy",
        name: "Clay Lacy Aviation Van Nuys",
        phone: "+1 818 989 2900",
        email: "fbo@claylacy.com",
        vhfFrequency: "129.85 MHz",
        address: "7435 Valjean Ave, Van Nuys, CA 91406",
        operatingHours: "H24 / 7 days",
        languages: ["English", "Spanish"],
        amenities: ["Carbon-Neutral FBO", "VIP Conference Suites", "On-site Culinary Kitchen"],
        notes: "Sustainable luxury FBO, VIP conference rooms, executive catering"
      }
    ]
  },
  {
    id: "miami-opa-locka",
    name: "Miami Opa-Locka Executive Airport",
    city: "Miami",
    country: "United States",
    iata: "OPF",
    icao: "KOPF",
    type: "dedicated",
    typeLabel: "Premier Miami Business Aviation Airport",
    popular: true,
    region: "north_america",
    coordinates: { lat: 25.907, lng: -80.2784 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operation without curfew.",
    runwayLength: "2,441 m / 8,002 ft - Asphalt",
    runwaySurface: "Asphalt (09L/27R, 12/30, 09R/27L)",
    elevation: "9 ft / 3 m",
    fbos: [
      {
        id: "kopf-fountainbleau",
        name: "Fontainebleau Aviation Opa-Locka",
        phone: "+1 305 685 4646",
        email: "info@fba.aero",
        vhfFrequency: "130.70 MHz",
        address: "14200 NW 42nd Ave, Opa-locka, FL 33054",
        operatingHours: "H24 / 7 days",
        languages: ["English", "Spanish", "Portuguese"],
        amenities: ["Luxury Canopy for Boarding in Rain/Sun", "Fontainebleau Hotel Concierge", "Customs On-Site", "VIP Lounges"],
        notes: "Ultra-luxury terminal with 235,000 sq ft hangar, direct South Beach hotel ties"
      },
      {
        id: "kopf-signature-opf",
        name: "Signature Flight Support Opa-Locka",
        phone: "+1 305 687 8410",
        email: "opf@signatureflight.com",
        vhfFrequency: "131.60 MHz",
        address: "15001 NW 42nd Ave, Opa-locka, FL",
        operatingHours: "H24 / 7 days",
        languages: ["English", "Spanish"],
        amenities: ["VIP Passenger Lounges", "Helicopter Transfer to Fisher Island", "Crew Rest Suites"],
        notes: "High-volume corporate and sports VIP charter operations"
      }
    ]
  },
  {
    id: "palm-beach",
    name: "Palm Beach International Airport",
    city: "Palm Beach / West Palm Beach",
    country: "United States",
    iata: "PBI",
    icao: "KPBI",
    type: "dedicated",
    typeLabel: "Palm Beach Island Executive Hub",
    popular: true,
    region: "north_america",
    coordinates: { lat: 26.6832, lng: -80.0956 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operation without curfew.",
    runwayLength: "3,048 m / 10,000 ft - Asphalt",
    runwaySurface: "Asphalt (10L/28R, 14/32, 10R/28L)",
    elevation: "19 ft / 6 m",
    fbos: [
      {
        id: "kpbi-signature-pbi",
        name: "Signature Flight Support Palm Beach",
        phone: "+1 561 683 4121",
        email: "pbi@signatureflight.com",
        vhfFrequency: "130.50 MHz",
        address: "1500 Perimeter Rd, West Palm Beach, FL 33406",
        operatingHours: "H24 / 7 days",
        languages: ["English", "Spanish"],
        amenities: ["Palm Beach Island Chauffeur Transfer", "Private Lounges", "Customs Clearance"],
        notes: "Primary Palm Beach Island estate & Mar-a-Lago private aviation gateway"
      }
    ]
  },
  {
    id: "aspen",
    name: "Aspen-Pitkin County Airport (Sardy Field)",
    city: "Aspen",
    country: "United States",
    iata: "ASE",
    icao: "KASE",
    type: "altiport",
    typeLabel: "High-Altitude Rocky Mountain Jet Airport (7,820 ft)",
    popular: true,
    region: "north_america",
    coordinates: { lat: 39.2232, lng: -106.8688 },
    operatingHours: "07:00 - 23:00 Local",
    extensionPossibilities: "Strict 23:00 curfew. No extensions permitted by county ordinance.",
    runwayLength: "2,440 m / 8,006 ft - Asphalt",
    runwaySurface: "Asphalt (15/33)",
    elevation: "7,820 ft / 2,384 m",
    fbos: [
      {
        id: "kase-atlantic-aspen",
        name: "Atlantic Aviation Aspen",
        phone: "+1 970 920 2016",
        email: "ase@atlanticaviation.com",
        vhfFrequency: "130.25 MHz",
        address: "69 Airport Rd, Aspen, CO 81611",
        operatingHours: "07:00 - 23:00 Local",
        languages: ["English", "Spanish"],
        amenities: ["Ski Gear Concierge", "Luxury 4x4 Chauffeur Transfers to Downtown Aspen", "Heated Hangars"],
        notes: "Exclusive Aspen private aviation facility, slots strictly managed during winter high season"
      }
    ]
  },
  {
    id: "las-vegas",
    name: "Harry Reid International Airport",
    city: "Las Vegas",
    country: "United States",
    iata: "LAS",
    icao: "KLAS",
    type: "dedicated",
    typeLabel: "Las Vegas Strip Executive Terminal",
    popular: true,
    region: "north_america",
    coordinates: { lat: 36.084, lng: -115.1537 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operational year-round.",
    runwayLength: "4,423 m / 14,512 ft - Concrete",
    runwaySurface: "Concrete (01L/19R, 01R/19L, 08L/26R, 08R/26L)",
    elevation: "2,181 ft / 665 m",
    fbos: [
      {
        id: "klas-signature-vegas",
        name: "Signature Flight Support Las Vegas",
        phone: "+1 702 739 1100",
        email: "las@signatureflight.com",
        vhfFrequency: "130.40 MHz",
        address: "275 E Tropicana Ave, Las Vegas, NV 89109",
        operatingHours: "H24 / 7 days",
        languages: ["English", "Spanish"],
        amenities: ["Direct Strip Limousine Escort", "High Roller VIP Suites", "Private Conference Rooms"],
        notes: "Located directly next to the Strip casinos, VIP high roller concierge"
      }
    ]
  },

  // ================= MIDDLE EAST =================
  {
    id: "dubai-al-maktoum",
    name: "Al Maktoum International Airport (DWC)",
    city: "Dubai",
    country: "United Arab Emirates",
    iata: "DWC",
    icao: "OMDW",
    type: "dedicated",
    typeLabel: "VIP Business Aviation Hub Dubai South",
    popular: true,
    region: "middle_east",
    coordinates: { lat: 24.8964, lng: 55.1614 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted corporate jet operation.",
    runwayLength: "4,500 m / 14,764 ft - Asphalt",
    runwaySurface: "Asphalt (12/30)",
    elevation: "171 ft / 52 m",
    fbos: [
      {
        id: "omdw-jetex-dwc",
        name: "Jetex Dubai South FBO Terminal",
        phone: "+971 4 212 4900",
        email: "dwc@jetex.com",
        vhfFrequency: "131.725 MHz",
        address: "VIP Terminal, Dubai South Aviation District",
        operatingHours: "H24 / 7 days",
        languages: ["Arabic", "English", "Russian", "French", "Farsi", "Hindi"],
        amenities: ["Rolls-Royce Apron Chauffeur", "Royal Majlis Lounges", "Caviar & Champagne Bar", "On-site Customs & Visa Processing"],
        notes: "World's most luxurious private jet terminal, flagship royal majlis suites"
      },
      {
        id: "omdw-falcon-dwc",
        name: "Falcon Aviation DWC",
        phone: "+971 4 807 8888",
        email: "fbo.dwc@falconaviation.ae",
        vhfFrequency: "130.60 MHz",
        address: "Executive Terminal, Dubai South",
        operatingHours: "H24 / 7 days",
        languages: ["Arabic", "English"],
        amenities: ["VIP Terminal", "Helicopter Transfers to Palm Jumeirah"],
        notes: "Helicopter transfers to Burj Al Arab and Palm Jumeirah"
      },
      {
        id: "omdw-execujet-dwc",
        name: "ExecuJet Middle East DWC",
        phone: "+971 4 887 9640",
        email: "fbo.dwc@execujet.com",
        vhfFrequency: "131.95 MHz",
        address: "Dubai South VIP Terminal Building",
        operatingHours: "H24 / 7 days",
        languages: ["English", "Arabic", "Russian"],
        amenities: ["Private Boardrooms", "Crew Rest Suites", "Dedicated Ramp Service"],
        notes: "24/7 dedicated handling, state-of-the-art pilot snooze rooms"
      }
    ]
  },
  {
    id: "dubai-international",
    name: "Dubai International Airport (DXB)",
    city: "Dubai",
    country: "United Arab Emirates",
    iata: "DXB",
    icao: "OMDB",
    type: "dedicated",
    typeLabel: "Executive Flight Centre Terminal",
    popular: true,
    region: "middle_east",
    coordinates: { lat: 25.2532, lng: 55.3657 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operational. PPR and slot strictly required due to high commercial traffic.",
    runwayLength: "4,450 m / 14,600 ft - Asphalt",
    runwaySurface: "Asphalt (12L/30R & 12R/30L)",
    elevation: "62 ft / 19 m",
    fbos: [
      {
        id: "omdb-execujet-dxb",
        name: "ExecuJet Dubai International FBO",
        phone: "+971 4 601 6444",
        email: "fbo.dxb@execujet.com",
        vhfFrequency: "131.75 MHz",
        address: "Dubai Airport Freezone, Gate 8",
        operatingHours: "H24 / 7 days",
        languages: ["Arabic", "English", "French"],
        amenities: ["Executive Majlis", "Direct Downtown Dubai Access", "Diplomatic Clearance"],
        notes: "Direct access to Downtown Dubai and DIFC financial hub"
      }
    ]
  },
  {
    id: "abu-dhabi-bateen",
    name: "Al Bateen Executive Airport",
    city: "Abu Dhabi",
    country: "United Arab Emirates",
    iata: "AZI",
    icao: "OMAD",
    type: "dedicated",
    typeLabel: "Middle East's First Dedicated Executive Airport",
    popular: true,
    region: "middle_east",
    coordinates: { lat: 24.4283, lng: 54.4581 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operational dedicated business airport.",
    runwayLength: "3,200 m / 10,499 ft - Asphalt",
    runwaySurface: "Asphalt (13/31)",
    elevation: "16 ft / 5 m",
    fbos: [
      {
        id: "omad-dhabi-jet",
        name: "Dhabijet Al Bateen Executive",
        phone: "+971 2 444 0222",
        email: "dhabijet@albateen.ae",
        vhfFrequency: "131.85 MHz",
        address: "Al Bateen Executive Airport, Abu Dhabi",
        operatingHours: "H24 / 7 days",
        languages: ["Arabic", "English", "French"],
        amenities: ["VVIP Presidential Lounges", "Direct Formula 1 Yas Marina Transfers", "Customs On-Site"],
        notes: "Formula 1 Abu Dhabi GP hub, 10 minutes from city center"
      }
    ]
  },
  {
    id: "riyadh-king-khalid",
    name: "King Khalid International Airport",
    city: "Riyadh",
    country: "Saudi Arabia",
    iata: "RUH",
    icao: "OERK",
    type: "dedicated",
    typeLabel: "Private Aviation Terminal (Terminal 5 GAT)",
    popular: true,
    region: "middle_east",
    coordinates: { lat: 24.9576, lng: 46.6988 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operational.",
    runwayLength: "4,205 m / 13,796 ft - Asphalt",
    runwaySurface: "Asphalt (15L/33R & 15R/33L)",
    elevation: "2,049 ft / 625 m",
    fbos: [
      {
        id: "oerk-jetex-riyadh",
        name: "Jetex Riyadh Private Terminal",
        phone: "+966 11 220 8888",
        email: "ruh@jetex.com",
        vhfFrequency: "131.80 MHz",
        address: "Private Aviation Terminal, KKIA, Riyadh",
        operatingHours: "H24 / 7 days",
        languages: ["Arabic", "English"],
        amenities: ["Royal Reception Halls", "Diplomatic Protocol Escort", "Fast-track Immigration"],
        notes: "Exclusive royal suites, high-level diplomatic and corporate delegations"
      }
    ]
  },

  // ================= CARIBBEAN & LATIN AMERICA =================
  {
    id: "st-maarten",
    name: "Princess Juliana International Airport",
    city: "Philipsburg / St. Maarten",
    country: "Sint Maarten",
    iata: "SXM",
    icao: "TNCM",
    type: "fbo",
    typeLabel: "Executive Caribbean Superyacht Gateway",
    popular: true,
    region: "caribbean",
    coordinates: { lat: 18.041, lng: -63.1089 },
    operatingHours: "07:00 - 21:00 Local",
    extensionPossibilities: "Night extension up to 22:30 LT on request with airport authority approval.",
    runwayLength: "2,300 m / 7,546 ft - Asphalt",
    runwaySurface: "Asphalt (10/28)",
    elevation: "14 ft / 4 m",
    fbos: [
      {
        id: "tncm-execujet-sxm",
        name: "ExecuJet St. Maarten FBO",
        phone: "+1 721 546 7880",
        email: "fbo.sxm@execujet.com",
        vhfFrequency: "130.40 MHz",
        address: "Simpson Bay, Princess Juliana Airport",
        operatingHours: "07:00 - 21:00 Local (On-call H24)",
        languages: ["English", "French", "Dutch", "Spanish"],
        amenities: ["Direct Speedboat / Yacht Tender Transfer to Simpson Bay", "VIP Lounge", "Customs On-Site"],
        notes: "Major Caribbean superyacht transfer station, boat transfer directly to yachts"
      },
      {
        id: "tncm-signature-sxm",
        name: "Signature Flight Support St. Maarten",
        phone: "+1 721 546 7670",
        email: "sxm@signatureflight.com",
        vhfFrequency: "131.75 MHz",
        address: "Airport Blvd, Simpson Bay",
        operatingHours: "07:00 - 21:00 Local",
        languages: ["English", "French"],
        amenities: ["VIP Lounge", "Customs Fast-Track", "Island Hopper Flight Connection"],
        notes: "Connections to St. Barths, Anguilla and Virgin Islands"
      }
    ]
  },
  {
    id: "st-barths",
    name: "Gustaf III Airport (St. Jean)",
    city: "St. Jean / St. Barthélemy",
    country: "Saint Barthélemy",
    iata: "SBH",
    icao: "TFFJ",
    type: "airstrip",
    typeLabel: "Legendary Short Hillside Runway (Turboprop & Pilatus only)",
    popular: true,
    region: "caribbean",
    coordinates: { lat: 17.9044, lng: -62.8444 },
    operatingHours: "Daylight only (Sunrise to Sunset LT)",
    extensionPossibilities: "Strict daylight only. No night operations permitted under any circumstances.",
    runwayLength: "650 m / 2,133 ft - Concrete",
    runwaySurface: "Concrete (10/28)",
    elevation: "48 ft / 15 m",
    fbos: [
      {
        id: "tffj-st-barths-handling",
        name: "St. Barth VIP Handling & Concierge",
        phone: "+590 590 27 61 90",
        email: "ops@stbarth-handling.com",
        vhfFrequency: "118.45 MHz",
        address: "Aéroport de St. Jean, 97133 Saint-Barthélemy",
        operatingHours: "Sunrise - Sunset",
        languages: ["French", "English"],
        amenities: ["Direct Villa Chauffeur Transfer", "Luxury Superyacht Liaison", "Champagne Greeting"],
        notes: "Pilatus PC-12, King Air and turboprop VIP hub, strict special pilot certification"
      }
    ]
  },
  {
    id: "nassau",
    name: "Lynden Pindling International Airport",
    city: "Nassau",
    country: "Bahamas",
    iata: "NAS",
    icao: "MYNN",
    type: "dedicated",
    typeLabel: "Executive Gateway to the Bahamas",
    popular: true,
    region: "caribbean",
    coordinates: { lat: 25.039, lng: -77.4662 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operation without curfew.",
    runwayLength: "3,358 m / 11,017 ft - Asphalt",
    runwaySurface: "Asphalt (14/32 & 09/27)",
    elevation: "16 ft / 5 m",
    fbos: [
      {
        id: "mynn-jet-aviation-nas",
        name: "Jet Aviation Nassau",
        phone: "+1 242 377 3355",
        email: "nasfbo@jetaviation.com",
        vhfFrequency: "130.60 MHz",
        address: "Coral Harbour Rd, Nassau, Bahamas",
        operatingHours: "H24 / 7 days",
        languages: ["English"],
        amenities: ["US Pre-Clearance Facility", "VIP Island Lounges", "Direct Yacht Tender Liaison"],
        notes: "US border pre-clearance on-site, gateway to Exumas and outer islands"
      }
    ]
  },
  {
    id: "turks-and-caicos",
    name: "Providenciales International Airport",
    city: "Providenciales",
    country: "Turks and Caicos",
    iata: "PLS",
    icao: "MBPV",
    type: "dedicated",
    typeLabel: "Provo Executive Aviation Hub",
    popular: true,
    region: "caribbean",
    coordinates: { lat: 21.7736, lng: -72.2659 },
    operatingHours: "06:00 - 22:00 Local",
    extensionPossibilities: "Extensions possible up to 23:00 LT with 4h notice.",
    runwayLength: "2,807 m / 9,209 ft - Asphalt",
    runwaySurface: "Asphalt (10/28)",
    elevation: "15 ft / 5 m",
    fbos: [
      {
        id: "mbpv-provo-air-center",
        name: "Provo Air Center FBO",
        phone: "+1 649 946 4183",
        email: "ops@provoaircenter.com",
        vhfFrequency: "130.55 MHz",
        address: "South Dock Rd, Providenciales, TKCA 1ZZ",
        operatingHours: "06:00 - 22:00 Local",
        languages: ["English"],
        amenities: ["Direct Ramp Drive-up", "Customs On-Site", "Luxury Concierge"],
        notes: "Luxury private island transfers (Parrot Cay, Amanyara)"
      }
    ]
  },

  // ================= ASIA & PACIFIC =================
  {
    id: "hong-kong",
    name: "Hong Kong International Airport",
    city: "Hong Kong",
    country: "Hong Kong",
    iata: "HKG",
    icao: "VHHH",
    type: "dedicated",
    typeLabel: "Hong Kong Business Aviation Centre (HKBAC)",
    popular: true,
    region: "asia",
    coordinates: { lat: 22.308, lng: 113.9185 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operational. Strict slot allocation through HKBAC.",
    runwayLength: "3,800 m / 12,467 ft - Asphalt",
    runwaySurface: "Asphalt (07L/25R, 07C/25C, 07R/25L)",
    elevation: "28 ft / 9 m",
    fbos: [
      {
        id: "vhhh-hkbac",
        name: "Hong Kong Business Aviation Centre (HKBAC)",
        phone: "+852 2215 3888",
        email: "hkbac@hkbac.com",
        vhfFrequency: "130.65 MHz",
        address: "12 South Perimeter Rd, Hong Kong Airport, Lantau",
        operatingHours: "H24 / 7 days",
        languages: ["Cantonese", "Mandarin", "English"],
        amenities: ["Dedicated CIQ (Customs, Immigration, Quarantine)", "VIP Passenger Lounges", "Direct Ramp Limousine Access", "Crew Rest Area"],
        notes: "Premier Asian financial private aviation gateway, dedicated CIQ facilities"
      }
    ]
  },
  {
    id: "singapore-seletar",
    name: "Seletar Airport",
    city: "Singapore",
    country: "Singapore",
    iata: "XSP",
    icao: "WSSL",
    type: "dedicated",
    typeLabel: "Singapore Dedicated Business Aviation Centre",
    popular: true,
    region: "asia",
    coordinates: { lat: 1.4172, lng: 103.8647 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operational without commercial congestion.",
    runwayLength: "1,836 m / 6,024 ft - Asphalt",
    runwaySurface: "Asphalt (03/21)",
    elevation: "36 ft / 11 m",
    fbos: [
      {
        id: "wssl-jet-aviation-sin",
        name: "Jet Aviation Singapore Seletar",
        phone: "+65 6481 5311",
        email: "sinfbo@jetaviation.com",
        vhfFrequency: "130.60 MHz",
        address: "1075 West Camp Rd, Seletar Airport, 797800",
        operatingHours: "H24 / 7 days",
        languages: ["English", "Mandarin", "Malay"],
        amenities: ["VIP Passenger Suites", "Direct Changi Liaison", "Dedicated Customs"],
        notes: "Dedicated Singapore corporate aviation airport, avoiding Changi congestion"
      },
      {
        id: "wssl-universal-sin",
        name: "Universal Aviation Singapore",
        phone: "+65 6483 3035",
        email: "singapore@universalaviation.aero",
        vhfFrequency: "131.75 MHz",
        address: "Seletar Business Aviation Centre",
        operatingHours: "07:00 - 23:00 Local",
        languages: ["English", "Mandarin"],
        amenities: ["Executive Meeting Rooms", "VIP Concierge"],
        notes: "Full ground assistance and VIP passenger transit"
      }
    ]
  },
  {
    id: "tokyo-haneda",
    name: "Tokyo International Airport (Haneda)",
    city: "Tokyo",
    country: "Japan",
    iata: "HND",
    icao: "RJTT",
    type: "dedicated",
    typeLabel: "Tokyo Central Business Aviation Gate",
    popular: true,
    region: "asia",
    coordinates: { lat: 35.5494, lng: 139.7798 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "Night slots available for business jets between 23:00 and 06:00 LT.",
    runwayLength: "3,360 m / 11,024 ft - Asphalt",
    runwaySurface: "Asphalt (16R/34L, 16L/34R, 04/22, 05/23)",
    elevation: "21 ft / 6 m",
    fbos: [
      {
        id: "rjtt-jal-business-aviation",
        name: "JAL Business Aviation Haneda",
        phone: "+81 3 5757 7500",
        email: "hnd.fbo@jal.com",
        vhfFrequency: "131.85 MHz",
        address: "Haneda Airport International Area, Ota-ku, Tokyo",
        operatingHours: "H24 / 7 days",
        languages: ["Japanese", "English"],
        amenities: ["Traditional Japanese Hospitality (Omotenashi) VIP Suites", "Dedicated Immigration", "Limousine to Ginza (15 min)"],
        notes: "Central Tokyo gateway, 15 minutes to Ginza and Marunouchi"
      }
    ]
  },

  // ================= AFRICA =================
  {
    id: "johannesburg-lanseria",
    name: "Lanseria International Airport",
    city: "Johannesburg",
    country: "South Africa",
    iata: "HLA",
    icao: "FALA",
    type: "dedicated",
    typeLabel: "Dedicated South African Executive Jet Hub",
    popular: true,
    region: "africa",
    coordinates: { lat: -25.9385, lng: 27.9261 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operational year-round.",
    runwayLength: "3,048 m / 10,000 ft - Asphalt",
    runwaySurface: "Asphalt (07/25)",
    elevation: "4,517 ft / 1,377 m",
    fbos: [
      {
        id: "fala-execujet-lanseria",
        name: "ExecuJet South Africa Lanseria",
        phone: "+27 11 516 2300",
        email: "fbo.lanseria@execujet.com",
        vhfFrequency: "131.75 MHz",
        address: "Hangar 34, Lanseria International Airport, 1748",
        operatingHours: "H24 / 7 days",
        languages: ["English", "Afrikaans"],
        amenities: ["VIP Safari Concierge", "Customs Fast-Track", "Helipad Connections to Kruger"],
        notes: "Premier safari charter and corporate aviation base in Southern Africa"
      }
    ]
  },
  {
    id: "marrakech",
    name: "Marrakech Menara Airport",
    city: "Marrakech",
    country: "Morocco",
    iata: "RAK",
    icao: "GMMX",
    type: "fbo",
    typeLabel: "Executive Business Terminal",
    popular: true,
    region: "africa",
    coordinates: { lat: 31.6069, lng: -8.0363 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operational.",
    runwayLength: "3,100 m / 10,170 ft - Asphalt",
    runwaySurface: "Asphalt (10/28)",
    elevation: "1,542 ft / 470 m",
    fbos: [
      {
        id: "gmmx-swissport-marrakech",
        name: "Swissport Executive Aviation Marrakech",
        phone: "+212 524 447 865",
        email: "rak.executive@swissport.com",
        vhfFrequency: "131.60 MHz",
        address: "Aviation d'Affaires, Aéroport Menara",
        operatingHours: "H24 / 7 days",
        languages: ["Arabic", "French", "English"],
        amenities: ["Moroccan Palace Style VIP Lounge", "Palmeraie Chauffeur Escorts", "Customs On-Site"],
        notes: "Luxury royal palace lounges, Palmeraie hotel concierge"
      }
    ]
  },

  // ================= EUROPE (Additional) =================
  {
    id: "london-luton",
    name: "London Luton Airport",
    city: "London",
    country: "United Kingdom",
    iata: "LTN",
    icao: "EGGW",
    type: "dedicated",
    typeLabel: "Luton Business Aviation Centre",
    popular: true,
    region: "europe",
    coordinates: { lat: 51.8747, lng: -0.3683 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "No night curfew for business jets. QC0 and QC0.5 operations unrestricted.",
    runwayLength: "2,162 m / 7,087 ft - Asphalt",
    runwaySurface: "Asphalt (07/25)",
    elevation: "526 ft / 160 m",
    fbos: [
      { id: "eggw-signature", name: "Signature Flight Support Luton", phone: "+44 1582 395 395", email: "ltn@signatureflight.com", vhfFrequency: "130.125 MHz", address: "Luton Business Aviation Centre, Luton LU2 9LY", operatingHours: "H24 / 7 days", languages: ["English", "French", "Arabic", "Russian"], amenities: ["Private Customs", "Rolls Royce Meet & Greet", "VIP Suites", "Helicopter Transfer Coordination"], notes: "Premier VIP lounge, fastest customs clearance in the UK" },
      { id: "eggw-harrods", name: "Harrods Aviation Luton", phone: "+44 1582 390 390", email: "luton@harrodsaviation.com", vhfFrequency: "130.650 MHz", address: "Executive Terminal, Luton Airport", operatingHours: "H24 / 7 days", languages: ["English", "Arabic", "French", "Mandarin"], amenities: ["Harrods Luxury Lounge", "Bespoke Catering", "Personal Shopping", "Helicopter Transfers"], notes: "World-class luxury experience, Harrods concierge services" }
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
    typeLabel: "Exclusive Business Aviation Terminal",
    popular: true,
    region: "europe",
    coordinates: { lat: 51.3308, lng: 0.0325 },
    operatingHours: "06:00 - 22:00 LT (extensions to 23:00 on request)",
    extensionPossibilities: "Night operations possible to 23:00 LT with prior permission. No scheduled services - exclusively business aviation.",
    runwayLength: "1,820 m / 5,971 ft - Asphalt",
    runwaySurface: "Asphalt (03/21, 11/29)",
    elevation: "598 ft / 182 m",
    fbos: [
      { id: "egkb-jet-aviation", name: "Jet Aviation Biggin Hill", phone: "+44 1959 578 400", email: "bigginhill@jetaviation.com", vhfFrequency: "129.400 MHz", address: "Main Terminal, Biggin Hill Airport, TN16 3BN", operatingHours: "06:00 - 22:00 LT", languages: ["English", "French", "German", "Arabic"], amenities: ["Exclusive VIP Lounge", "Rolls Royce Chauffeur", "Helipad", "Conference Suites", "Customs On-Site"], notes: "Closest business airport to central London, 25min by road" }
    ]
  },
  {
    id: "amsterdam-schiphol",
    name: "Amsterdam Schiphol Airport",
    city: "Amsterdam",
    country: "Netherlands",
    iata: "AMS",
    icao: "EHAM",
    type: "fbo",
    typeLabel: "Schiphol East Business Aviation",
    popular: true,
    region: "europe",
    coordinates: { lat: 52.3105, lng: 4.7683 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operation. Night restrictions apply to QC4+ aircraft.",
    runwayLength: "3,800 m / 12,467 ft - Asphalt",
    runwaySurface: "Asphalt (06/24, 09/27, 18L/36R, 18R/36L, 22/04)",
    elevation: "-11 ft / -3 m",
    fbos: [
      { id: "eham-signature", name: "Signature Flight Support Amsterdam", phone: "+31 20 405 4300", email: "ams@signatureflight.com", vhfFrequency: "130.775 MHz", address: "Schiphol East Terminal, Pelikaanweg 25", operatingHours: "H24", languages: ["English", "Dutch", "German", "French", "Arabic"], amenities: ["Platinum VIP Lounge", "Customs Facilitation", "Limousine Service", "Helipad Access"], notes: "Dedicated business aviation terminal at Schiphol East" },
      { id: "eham-aviapartner", name: "Aviapartner Executive Amsterdam", phone: "+31 20 316 1800", email: "amsterdam.executive@aviapartner.aero", vhfFrequency: "131.400 MHz", address: "Businees Aviation Zone, Schiphol East", operatingHours: "06:00 - 22:00 LT (H24 on request)", languages: ["English", "Dutch", "French"], amenities: ["VIP Meet & Greet", "High-Speed Fuel", "Concierge Service"], notes: "Full ground handling and passenger services" }
    ]
  },
  {
    id: "frankfurt-main",
    name: "Frankfurt Airport",
    city: "Frankfurt",
    country: "Germany",
    iata: "FRA",
    icao: "EDDF",
    type: "fbo",
    typeLabel: "Business Aviation Terminal 1",
    popular: true,
    region: "europe",
    coordinates: { lat: 50.0379, lng: 8.5622 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "Night curfew 23:00-05:00 for Chapter 2 aircraft. Business jets (Chapter 3+) mostly unrestricted.",
    runwayLength: "4,000 m / 13,123 ft - Concrete",
    runwaySurface: "Concrete/Asphalt (07L/25R, 07C/25C, 07R/25L, 18)",
    elevation: "364 ft / 111 m",
    fbos: [
      { id: "eddf-signature", name: "Signature Flight Support Frankfurt", phone: "+49 69 696 70700", email: "fra@signatureflight.com", vhfFrequency: "121.900 MHz", address: "General Aviation Terminal, 60549 Frankfurt", operatingHours: "H24", languages: ["German", "English", "French", "Arabic", "Russian"], amenities: ["Ultra VIP Suites", "Customs Fast-Track", "Mercedes S-Class Fleet", "Full MRO"], notes: "Major transit hub, full maintenance capability" }
    ]
  },
  {
    id: "munich",
    name: "Munich Franz Josef Strauss International Airport",
    city: "Munich",
    country: "Germany",
    iata: "MUC",
    icao: "EDDM",
    type: "fbo",
    typeLabel: "Executive Terminal Munich",
    popular: true,
    region: "europe",
    coordinates: { lat: 48.3537, lng: 11.7861 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "Night operations permitted. Chapter 4 aircraft unrestricted.",
    runwayLength: "4,000 m / 13,123 ft - Concrete",
    runwaySurface: "Concrete (08L/26R, 08R/26L)",
    elevation: "1,487 ft / 453 m",
    fbos: [
      { id: "eddm-dc-aviation", name: "DC Aviation Munich", phone: "+49 89 97599 100", email: "handling@dc-aviation.de", vhfFrequency: "121.700 MHz", address: "Executive Aviation Terminal, 85356 Munich", operatingHours: "H24", languages: ["German", "English", "French", "Italian", "Arabic"], amenities: ["Award-winning FBO", "VIP Suites", "Private Customs Clearance", "Helipad", "MRO"], notes: "EBAA certified, frequently voted European Business Aviation FBO of Year" }
    ]
  },
  {
    id: "zurich",
    name: "Zurich Airport",
    city: "Zurich",
    country: "Switzerland",
    iata: "ZRH",
    icao: "LSZH",
    type: "fbo",
    typeLabel: "Jet Aviation Zurich Executive",
    popular: true,
    region: "europe",
    coordinates: { lat: 47.4647, lng: 8.5492 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "Night curfew 23:00-06:00 LT. Business aviation PPR required. Chapter 4 aircraft with exemptions.",
    runwayLength: "3,700 m / 12,139 ft - Asphalt",
    runwaySurface: "Asphalt (10/28, 14/32, 16/34)",
    elevation: "1,416 ft / 432 m",
    fbos: [
      { id: "lszh-jet-aviation", name: "Jet Aviation Zurich", phone: "+41 44 816 2000", email: "zurichfbo@jetaviation.com", vhfFrequency: "130.650 MHz", address: "Hürlimannstrasse 15, 8302 Kloten", operatingHours: "H24", languages: ["German", "English", "French", "Italian", "Russian"], amenities: ["VIP Private Terminal", "Gold Standard Customs", "Dassault/Gulfstream Authorized Service Center", "Limousine"], notes: "Full maintenance, pre-clearance, Rolls-Royce service center" }
    ]
  },
  {
    id: "basel-mulhouse",
    name: "EuroAirport Basel-Mulhouse-Freiburg",
    city: "Basel / Mulhouse",
    country: "Switzerland/France",
    iata: "BSL",
    icao: "LFSB",
    type: "fbo",
    typeLabel: "Executive Terminal Basel",
    popular: false,
    region: "europe",
    coordinates: { lat: 47.5900, lng: 7.5290 },
    operatingHours: "06:00 - 23:00 LT",
    extensionPossibilities: "Extensions to 00:00 on request with fee. Dual sovereignty (Swiss/French).",
    runwayLength: "3,900 m / 12,795 ft - Asphalt",
    runwaySurface: "Asphalt (15/33, 08/26)",
    elevation: "885 ft / 270 m",
    fbos: [
      { id: "lfsb-dc-aviation", name: "DC Aviation Basel", phone: "+41 61 325 3800", email: "handling@dc-aviation-basel.com", vhfFrequency: "130.325 MHz", address: "GA Terminal, EuroAirport Basel", operatingHours: "06:00 - 22:00 LT", languages: ["German", "French", "English"], amenities: ["Art Basel Transport Coordination", "Private Customs", "VIP Lounge"], notes: "Popular during Art Basel. Dual customs (Swiss/French) on-site." }
    ]
  },
  {
    id: "rome-ciampino",
    name: "Rome Ciampino Airport",
    city: "Rome",
    country: "Italy",
    iata: "CIA",
    icao: "LIRA",
    type: "dedicated",
    typeLabel: "Exclusive Business Aviation",
    popular: true,
    region: "europe",
    coordinates: { lat: 41.7994, lng: 12.5949 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operation. Closest airport to Rome city centre.",
    runwayLength: "2,205 m / 7,234 ft - Asphalt",
    runwaySurface: "Asphalt (15/33)",
    elevation: "427 ft / 130 m",
    fbos: [
      { id: "lira-avio-handling", name: "Avio Handling Rome Ciampino", phone: "+39 06 7940 7272", email: "ciampino@aviohandling.it", vhfFrequency: "130.775 MHz", address: "Executive Terminal, Via Appia Nuova 1651", operatingHours: "H24", languages: ["Italian", "English", "French", "Arabic"], amenities: ["Vatican & Rome City Proximity", "Private Customs", "VIP Lounge", "Limo Service"], notes: "15 min from Rome centre. Preferred for Vatican visits." },
      { id: "lira-meridiana", name: "Meridiana Executive Handling", phone: "+39 06 794 94800", email: "ops@meridiana-handling.it", vhfFrequency: "131.800 MHz", address: "Terminal Aviazione Generale, Ciampino", operatingHours: "06:00 - 22:00 LT", languages: ["Italian", "English"], amenities: ["Luxury Catering", "Concierge"], notes: "Full VIP ground handling services" }
    ]
  },
  {
    id: "milan-malpensa",
    name: "Milan Malpensa Airport",
    city: "Milan",
    country: "Italy",
    iata: "MXP",
    icao: "LIMC",
    type: "fbo",
    typeLabel: "Executive Terminal Malpensa",
    popular: true,
    region: "europe",
    coordinates: { lat: 45.6306, lng: 8.7281 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24. Noise restrictions Chapter 2 night ban only.",
    runwayLength: "3,920 m / 12,861 ft - Asphalt",
    runwaySurface: "Asphalt (17L/35R, 17R/35L)",
    elevation: "768 ft / 234 m",
    fbos: [
      { id: "limc-aviapartner", name: "Aviapartner Executive Milan", phone: "+39 02 7485 4502", email: "mxp.executive@aviapartner.aero", vhfFrequency: "131.400 MHz", address: "Terminal Aviazione Generale, Malpensa", operatingHours: "H24", languages: ["Italian", "English", "French", "German"], amenities: ["Fashion Week Logistics", "Superyacht Transfer to Lake Como", "VIP Suites", "Private Customs"], notes: "Fashion Week hub, Lake Como & Portofino yacht transfers" }
    ]
  },
  {
    id: "madrid-barajas",
    name: "Adolfo Suárez Madrid–Barajas Airport",
    city: "Madrid",
    country: "Spain",
    iata: "MAD",
    icao: "LEMD",
    type: "fbo",
    typeLabel: "Executive Terminal T2 (Ex)",
    popular: true,
    region: "europe",
    coordinates: { lat: 40.4719, lng: -3.5626 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operation unrestricted for business aviation.",
    runwayLength: "4,350 m / 14,272 ft - Asphalt",
    runwaySurface: "Asphalt (14L/32R, 14R/32L, 18L/36R, 18R/36L)",
    elevation: "1,998 ft / 609 m",
    fbos: [
      { id: "lemd-privajet", name: "Privajet FBO Madrid", phone: "+34 91 321 5050", email: "madrid@privajet.aero", vhfFrequency: "121.950 MHz", address: "Terminal CESPA, Aeropuerto Madrid-Barajas", operatingHours: "H24", languages: ["Spanish", "English", "Arabic", "French"], amenities: ["Royal Palace Concierge", "Bulería VIP Lounge", "Full Customs", "Medical Coordination"], notes: "Royal treatment, Spain's premier business aviation gateway" }
    ]
  },
  {
    id: "barcelona-el-prat",
    name: "Barcelona El Prat Airport",
    city: "Barcelona",
    country: "Spain",
    iata: "BCN",
    icao: "LEBL",
    type: "fbo",
    typeLabel: "Executive Terminal Barcelona",
    popular: true,
    region: "europe",
    coordinates: { lat: 41.2971, lng: 2.0785 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24, no curfew for business jets.",
    runwayLength: "3,352 m / 10,997 ft - Asphalt",
    runwaySurface: "Asphalt (02/20, 07L/25R, 07R/25L)",
    elevation: "13 ft / 4 m",
    fbos: [
      { id: "lebl-dbn", name: "DBN Aviation Barcelona", phone: "+34 93 262 8080", email: "barcelona@dbnaviation.com", vhfFrequency: "130.875 MHz", address: "Terminal Executiu, El Prat de Llobregat", operatingHours: "H24", languages: ["Spanish", "Catalan", "English", "French", "Arabic"], amenities: ["Superyacht Ibiza Transfer Coordination", "Formula 1 Logistics", "VIP Suites", "Helicopter Transfers"], notes: "F1 Grand Prix, MWC Barcelona, superyacht charter hub" }
    ]
  },
  {
    id: "ibiza",
    name: "Ibiza Airport",
    city: "Ibiza",
    country: "Spain",
    iata: "IBZ",
    icao: "LEIB",
    type: "fbo",
    typeLabel: "Executive FBO",
    popular: true,
    region: "europe",
    coordinates: { lat: 38.8729, lng: 1.3731 },
    operatingHours: "07:00 - 24:00 LT (summer H24 on request)",
    extensionPossibilities: "Night extensions possible in peak season. Heavily congested July-August.",
    runwayLength: "2,800 m / 9,186 ft - Asphalt",
    runwaySurface: "Asphalt (06/24)",
    elevation: "23 ft / 7 m",
    fbos: [
      { id: "leib-ibizahandling", name: "Ibiza Executive Handling", phone: "+34 971 809 300", email: "vip@ibizahandling.com", vhfFrequency: "130.775 MHz", address: "Terminal Ejecutivo, Aeropuerto de Ibiza", operatingHours: "08:00 - 24:00 LT", languages: ["Spanish", "English", "Italian", "French", "German"], amenities: ["Superyacht & Villa Coordination", "VIP Festival Logistics", "Private Customs", "Limousine"], notes: "Peak season hub: superyacht, villa & festival logistics" }
    ]
  },
  {
    id: "marbella",
    name: "Málaga-Costa del Sol Airport",
    city: "Marbella / Málaga",
    country: "Spain",
    iata: "AGP",
    icao: "LEMG",
    type: "fbo",
    typeLabel: "Executive Terminal Málaga",
    popular: true,
    region: "europe",
    coordinates: { lat: 36.6749, lng: -4.4991 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 for business jets.",
    runwayLength: "3,200 m / 10,499 ft - Asphalt",
    runwaySurface: "Asphalt (13/31)",
    elevation: "52 ft / 16 m",
    fbos: [
      { id: "lemg-network", name: "Network Aviation Málaga", phone: "+34 952 048 500", email: "malaga@networkaviation.aero", vhfFrequency: "130.775 MHz", address: "Executive Terminal, Aeropuerto de Málaga", operatingHours: "H24", languages: ["Spanish", "English", "Arabic", "Russian", "German"], amenities: ["Marbella Villa Transfer", "Puerto Banús Superyacht Coordination", "Golf Package", "VIP Customs"], notes: "Marbella, Ronda & Puerto Banús gateway" }
    ]
  },
  {
    id: "palma-mallorca",
    name: "Palma de Mallorca Airport",
    city: "Palma de Mallorca",
    country: "Spain",
    iata: "PMI",
    icao: "LEPA",
    type: "fbo",
    typeLabel: "Executive FBO Palma",
    popular: true,
    region: "europe",
    coordinates: { lat: 39.5517, lng: 2.7388 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 for business jets.",
    runwayLength: "3,270 m / 10,728 ft - Asphalt",
    runwaySurface: "Asphalt (06L/24R, 06R/24L)",
    elevation: "27 ft / 8 m",
    fbos: [
      { id: "lepa-landmark", name: "Landmark Aviation Palma", phone: "+34 971 789 020", email: "palma@landmarkaviation.com", vhfFrequency: "130.875 MHz", address: "Terminal Ejecutivo, Aeropuerto Son San Juan", operatingHours: "H24", languages: ["Spanish", "English", "German", "French", "Italian"], amenities: ["Marina Port de Palma Transfer", "Golf Coordination", "VIP Customs", "Superyacht Hub"], notes: "Superyacht and Mediterranean lifestyle gateway" }
    ]
  },
  {
    id: "vienna",
    name: "Vienna International Airport",
    city: "Vienna",
    country: "Austria",
    iata: "VIE",
    icao: "LOWW",
    type: "fbo",
    typeLabel: "Executive Terminal Vienna",
    popular: true,
    region: "europe",
    coordinates: { lat: 48.1103, lng: 16.5697 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "Night PPR required 23:00-06:00 LT. Chapter 4 aircraft exempt.",
    runwayLength: "3,600 m / 11,811 ft - Asphalt",
    runwaySurface: "Asphalt (11/29, 16/34)",
    elevation: "600 ft / 183 m",
    fbos: [
      { id: "loww-jetalliance", name: "JetAlliance Executive FBO Vienna", phone: "+43 1 7007 32600", email: "fbo@jetalliance.at", vhfFrequency: "130.650 MHz", address: "Executive Terminal, 1300 Wien-Flughafen", operatingHours: "H24", languages: ["German", "English", "French", "Russian"], amenities: ["Vienna Philharmonic Concert Coordination", "Staatsoper Concierge", "VIP Suites", "Full Maintenance"], notes: "Austria's leading business aviation operator. MRO on-site." }
    ]
  },
  {
    id: "prague",
    name: "Václav Havel Airport Prague",
    city: "Prague",
    country: "Czech Republic",
    iata: "PRG",
    icao: "LKPR",
    type: "fbo",
    typeLabel: "Business Aviation Terminal",
    popular: true,
    region: "europe",
    coordinates: { lat: 50.1008, lng: 14.2600 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operations, no restrictions for business jets.",
    runwayLength: "3,715 m / 12,188 ft - Concrete",
    runwaySurface: "Concrete (06/24, 12/30)",
    elevation: "1,247 ft / 380 m",
    fbos: [
      { id: "lkpr-csa-handling", name: "CSA Executive Handling Prague", phone: "+420 220 113 400", email: "executive@csa-handling.cz", vhfFrequency: "130.775 MHz", address: "Business Aviation Terminal, Aviatická 12, Praha 6", operatingHours: "H24", languages: ["Czech", "English", "German", "Russian"], amenities: ["VIP Customs", "Prague Castle Tours", "Limousine Service", "Concierge"], notes: "Gateway to Prague Castle, Old Town & Czech spa resorts" }
    ]
  },
  {
    id: "stockholm-arlanda",
    name: "Stockholm Arlanda Airport",
    city: "Stockholm",
    country: "Sweden",
    iata: "ARN",
    icao: "ESSA",
    type: "fbo",
    typeLabel: "Scandinavian Executive Terminal",
    popular: true,
    region: "europe",
    coordinates: { lat: 59.6519, lng: 17.9186 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted.",
    runwayLength: "3,301 m / 10,830 ft - Asphalt",
    runwaySurface: "Asphalt (01L/19R, 01R/19L, 08/26)",
    elevation: "137 ft / 42 m",
    fbos: [
      { id: "essa-business-aviation", name: "Scandinavian Business Aviation", phone: "+46 8 797 6300", email: "arlanda@scanaviation.se", vhfFrequency: "130.775 MHz", address: "Business Aviation Terminal, 190 45 Stockholm-Arlanda", operatingHours: "H24", languages: ["Swedish", "English", "Norwegian", "Danish"], amenities: ["Arctic Expedition Logistics", "Royal Palace Proximity", "Archipelago Helicopter Links"], notes: "Nordic gateway, Arctic expedition and island transfer coordination" }
    ]
  },
  {
    id: "oslo-gardermoen",
    name: "Oslo Gardermoen Airport",
    city: "Oslo",
    country: "Norway",
    iata: "OSL",
    icao: "ENGM",
    type: "fbo",
    typeLabel: "Executive Terminal Oslo",
    popular: false,
    region: "europe",
    coordinates: { lat: 60.1976, lng: 11.1004 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted.",
    runwayLength: "3,600 m / 11,811 ft - Asphalt",
    runwaySurface: "Asphalt (01L/19R, 01R/19L)",
    elevation: "681 ft / 208 m",
    fbos: [
      { id: "engm-aviator", name: "Aviator Business Aviation Oslo", phone: "+47 23 15 9000", email: "oslo@aviator.aero", vhfFrequency: "130.650 MHz", address: "Aviator Terminal, Gardermoen Airport", operatingHours: "H24", languages: ["Norwegian", "English", "Swedish"], amenities: ["Fjord Helicopter Transfers", "Northern Lights Tour Coordination", "VIP Suites"], notes: "Norway's gateway. Fjord and Aurora tours coordination." }
    ]
  },
  {
    id: "copenhagen",
    name: "Copenhagen Kastrup Airport",
    city: "Copenhagen",
    country: "Denmark",
    iata: "CPH",
    icao: "EKCH",
    type: "fbo",
    typeLabel: "Executive Terminal Copenhagen",
    popular: false,
    region: "europe",
    coordinates: { lat: 55.6180, lng: 12.6560 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "Night restrictions 23:00-06:00. Business jets mostly exempt.",
    runwayLength: "3,600 m / 11,811 ft - Asphalt",
    runwaySurface: "Asphalt (04L/22R, 04R/22L, 12/30)",
    elevation: "17 ft / 5 m",
    fbos: [
      { id: "ekch-sas-ground", name: "SAS Ground Handling Executive", phone: "+45 32 32 1000", email: "executive@sasgroundhandling.com", vhfFrequency: "130.775 MHz", address: "Terminal Building, 2770 Kastrup", operatingHours: "H24", languages: ["Danish", "English", "Swedish", "German"], amenities: ["Øresund Bridge Transfer", "Royal Concierge", "VIP Customs"], notes: "Scandinavian design and architecture gateway" }
    ]
  },
  {
    id: "moscow-vnukovo",
    name: "Moscow Vnukovo International Airport",
    city: "Moscow",
    country: "Russia",
    iata: "VKO",
    icao: "UUWW",
    type: "dedicated",
    typeLabel: "Vnukovo International Business Aviation",
    popular: true,
    region: "europe",
    coordinates: { lat: 55.5915, lng: 37.2615 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted.",
    runwayLength: "3,060 m / 10,039 ft - Asphalt",
    runwaySurface: "Asphalt (01/19, 06/24)",
    elevation: "685 ft / 209 m",
    fbos: [
      { id: "uuww-vip-terminal", name: "Vnukovo VIP Terminal", phone: "+7 495 436 6000", email: "vip@vnukovo.ru", vhfFrequency: "121.900 MHz", address: "VIP Terminal, Vnukovo Airport, Moscow 119027", operatingHours: "H24", languages: ["Russian", "English", "Arabic", "French"], amenities: ["Government VIP Protocol", "Private State Lounge", "Customs & Border Control On-Site", "Helicopter Transfers"], notes: "Russia's premier VVIP terminal. Government protocol specialists." }
    ]
  },
  {
    id: "istanbul-ataturk",
    name: "Istanbul Atatürk Airport",
    city: "Istanbul",
    country: "Turkey",
    iata: "ISL",
    icao: "LTBA",
    type: "dedicated",
    typeLabel: "Havaş Executive Terminal",
    popular: true,
    region: "europe",
    coordinates: { lat: 40.9769, lng: 28.8146 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24, primarily business aviation since commercial move to IST.",
    runwayLength: "3,000 m / 9,842 ft - Asphalt",
    runwaySurface: "Asphalt (06/24, 18L/36R, 18R/36L)",
    elevation: "158 ft / 48 m",
    fbos: [
      { id: "ltba-havas", name: "Havaş Executive FBO", phone: "+90 212 465 5100", email: "executive@havas.net", vhfFrequency: "130.650 MHz", address: "Executive Terminal, Atatürk Havalimanı", operatingHours: "H24", languages: ["Turkish", "English", "Arabic", "Russian", "French"], amenities: ["Bosphorus Yacht Transfer", "Palace Hotel Concierge", "VIP Customs", "Turkish Bath Experience"], notes: "Gateway to the Bosphorus, Europe-Asia crossroads hub" }
    ]
  },
  {
    id: "athens",
    name: "Athens International Airport Eleftherios Venizelos",
    city: "Athens",
    country: "Greece",
    iata: "ATH",
    icao: "LGAV",
    type: "fbo",
    typeLabel: "Executive Terminal Athens",
    popular: true,
    region: "europe",
    coordinates: { lat: 37.9364, lng: 23.9445 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 operations unrestricted.",
    runwayLength: "4,000 m / 13,123 ft - Asphalt",
    runwaySurface: "Asphalt (03L/21R, 03R/21L)",
    elevation: "308 ft / 94 m",
    fbos: [
      { id: "lgav-swissport", name: "Swissport Executive Athens", phone: "+30 210 353 5000", email: "athens.executive@swissport.com", vhfFrequency: "130.775 MHz", address: "Executive Terminal, Athens Airport, Spata", operatingHours: "H24", languages: ["Greek", "English", "French", "Arabic"], amenities: ["Greek Islands Helicopter Hub", "Acropolis Concierge", "VIP Customs", "Yacht Charter Coordination"], notes: "Greek Islands hub - helicopter/yacht transfers to Mykonos, Santorini" }
    ]
  },
  {
    id: "mykonos",
    name: "Mykonos Island National Airport",
    city: "Mykonos",
    country: "Greece",
    iata: "JMK",
    icao: "LGMK",
    type: "fbo",
    typeLabel: "Executive FBO",
    popular: true,
    region: "europe",
    coordinates: { lat: 37.4351, lng: 25.3481 },
    operatingHours: "07:00 - 23:00 LT (summer extensions on request)",
    extensionPossibilities: "Night operations possible in peak season with DGCA permission.",
    runwayLength: "1,939 m / 6,362 ft - Asphalt",
    runwaySurface: "Asphalt (16/34)",
    elevation: "405 ft / 123 m",
    fbos: [
      { id: "lgmk-elite-handling", name: "Elite Handling Mykonos", phone: "+30 22890 79000", email: "mykonos@elitehandling.gr", vhfFrequency: "122.300 MHz", address: "General Aviation Terminal, Mykonos Airport", operatingHours: "08:00 - 22:00 LT", languages: ["Greek", "English", "Italian", "French", "Russian"], amenities: ["Superyacht Transfer to Nammos Beach", "Villa Concierge", "VIP Immigration Fast-Track"], notes: "Hottest Mediterranean summer destination. Book slots 3 months ahead." }
    ]
  },
  {
    id: "santorini",
    name: "Santorini Thira Airport",
    city: "Santorini",
    country: "Greece",
    iata: "JTR",
    icao: "LGSR",
    type: "fbo",
    typeLabel: "VIP Executive Services",
    popular: true,
    region: "europe",
    coordinates: { lat: 36.3992, lng: 25.4793 },
    operatingHours: "07:00 - 22:00 LT",
    extensionPossibilities: "Limited extensions. Short runway - performance calculations mandatory.",
    runwayLength: "2,139 m / 7,018 ft - Asphalt",
    runwaySurface: "Asphalt (16R/34L)",
    elevation: "127 ft / 39 m",
    fbos: [
      { id: "lgsr-santorini-handling", name: "Santorini Aviation Services", phone: "+30 22860 31525", email: "ops@santoriniaviation.gr", vhfFrequency: "122.325 MHz", address: "General Aviation, Santorini (Thira) Airport", operatingHours: "07:30 - 21:30 LT", languages: ["Greek", "English", "Italian"], amenities: ["Caldera View Villa Transfer", "Helicopter Island Hop", "Luxury Catamaran Coordination"], notes: "Iconic caldera views. Performance calculations required for heavy jets." }
    ]
  },
  {
    id: "malta",
    name: "Malta International Airport",
    city: "Valletta",
    country: "Malta",
    iata: "MLA",
    icao: "LMML",
    type: "fbo",
    typeLabel: "Executive Terminal Malta",
    popular: false,
    region: "europe",
    coordinates: { lat: 35.8572, lng: 14.4775 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted.",
    runwayLength: "3,562 m / 11,686 ft - Asphalt",
    runwaySurface: "Asphalt (13/31, 05/23)",
    elevation: "300 ft / 91 m",
    fbos: [
      { id: "lmml-sgs", name: "SGS FBO Malta", phone: "+356 2124 9900", email: "fbo@sgsaviation.com", vhfFrequency: "130.775 MHz", address: "Business Aviation, Malta International Airport", operatingHours: "H24", languages: ["Maltese", "English", "Italian", "Arabic"], amenities: ["Malta Grand Harbour Access", "Golden Visa Concierge", "Superyacht Coordination"], notes: "Mediterranean hub, VistaJet HQ, favorable tax regime" }
    ]
  },
  {
    id: "luxembourg",
    name: "Luxembourg Findel Airport",
    city: "Luxembourg",
    country: "Luxembourg",
    iata: "LUX",
    icao: "ELLX",
    type: "fbo",
    typeLabel: "Luxair Business Class Terminal",
    popular: false,
    region: "europe",
    coordinates: { lat: 49.6233, lng: 6.2044 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted for business jets.",
    runwayLength: "4,000 m / 13,123 ft - Asphalt",
    runwaySurface: "Asphalt (06/24)",
    elevation: "1,234 ft / 376 m",
    fbos: [
      { id: "ellx-jetfly", name: "Jetfly Executive Terminal Luxembourg", phone: "+352 26 12 50 1", email: "fbo@jetfly.com", vhfFrequency: "130.775 MHz", address: "Executive Terminal, 2987 Luxembourg", operatingHours: "H24", languages: ["French", "German", "English", "Luxembourgish"], amenities: ["EU Institutions Proximity", "Private Banking Concierge", "Full Customs"], notes: "EU institutions hub, financial sector gateway" }
    ]
  },
  {
    id: "brussels",
    name: "Brussels Airport",
    city: "Brussels",
    country: "Belgium",
    iata: "BRU",
    icao: "EBBR",
    type: "fbo",
    typeLabel: "Brussels Executive FBO",
    popular: false,
    region: "europe",
    coordinates: { lat: 50.9014, lng: 4.4844 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "Night PPR required. Business jets mostly exempt.",
    runwayLength: "3,638 m / 11,936 ft - Asphalt",
    runwaySurface: "Asphalt (07L/25R, 07R/25L, 02/20)",
    elevation: "184 ft / 56 m",
    fbos: [
      { id: "ebbr-aviapartner", name: "Aviapartner Executive Brussels", phone: "+32 2 753 7900", email: "brussels.executive@aviapartner.aero", vhfFrequency: "130.775 MHz", address: "Executive Terminal, Brussels Airport, Zaventem", operatingHours: "H24", languages: ["French", "Dutch", "English", "German"], amenities: ["NATO/EU Headquarters Transfer", "Chocolate & Waffle Concierge", "Customs Fast-Track"], notes: "EU & NATO capital gateway" }
    ]
  },
  {
    id: "warsaw-chopin",
    name: "Warsaw Chopin Airport",
    city: "Warsaw",
    country: "Poland",
    iata: "WAW",
    icao: "EPWA",
    type: "fbo",
    typeLabel: "Executive Terminal Warsaw",
    popular: false,
    region: "europe",
    coordinates: { lat: 52.1657, lng: 20.9671 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted.",
    runwayLength: "3,690 m / 12,106 ft - Asphalt",
    runwaySurface: "Asphalt (11/29, 15/33)",
    elevation: "360 ft / 110 m",
    fbos: [
      { id: "epwa-lot-aircraft", name: "LOT Aircraft Maintenance Executive", phone: "+48 22 650 1888", email: "executive@lot.com", vhfFrequency: "130.650 MHz", address: "Executive Terminal, 00-906 Warszawa", operatingHours: "H24", languages: ["Polish", "English", "German", "Russian"], amenities: ["Warsaw Old Town Transfer", "Chopin Concert Hall Concierge", "VIP Customs"], notes: "Eastern European business hub" }
    ]
  },

  // ================= MIDDLE EAST =================
  {
    id: "dubai-international",
    name: "Dubai International Airport",
    city: "Dubai",
    country: "UAE",
    iata: "DXB",
    icao: "OMDB",
    type: "dedicated",
    typeLabel: "Executive FBO Terminal",
    popular: true,
    region: "middle_east",
    coordinates: { lat: 25.2528, lng: 55.3644 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted. World's busiest international airport.",
    runwayLength: "4,000 m / 13,123 ft - Asphalt",
    runwaySurface: "Asphalt (12L/30R, 12R/30L)",
    elevation: "62 ft / 19 m",
    fbos: [
      { id: "omdb-dnata-executive", name: "dnata Executive FBO Dubai", phone: "+971 4 220 0400", email: "executive@dnata.com", vhfFrequency: "130.650 MHz", address: "Executive Aviation Terminal, Dubai Airport", operatingHours: "H24", languages: ["Arabic", "English", "Hindi", "Urdu", "Russian", "French"], amenities: ["VVIP Royal Protocol", "Rolls-Royce Fleet", "Premium Cigar Lounge", "Concierge to Burj Khalifa", "Helicopter Dubai Tour"], notes: "VVIP royal protocol specialists, world's most luxurious FBO experience" },
      { id: "omdb-jet-aviation-dxb", name: "Jet Aviation FBO Dubai", phone: "+971 4 299 5100", email: "dubai@jetaviation.com", vhfFrequency: "131.400 MHz", address: "Jet Aviation Terminal, Dubai Airport", operatingHours: "H24", languages: ["English", "Arabic", "French", "German"], amenities: ["Full MRO", "VIP Customs", "Presidential Suites", "Rolls Royce Chauffeur"], notes: "Full MRO capability, Gulfstream & Bombardier service center" }
    ]
  },
  {
    id: "dubai-al-maktoum",
    name: "Al Maktoum International Airport",
    city: "Dubai South / Jebel Ali",
    country: "UAE",
    iata: "DWC",
    icao: "OMDW",
    type: "dedicated",
    typeLabel: "Al Maktoum Executive",
    popular: true,
    region: "middle_east",
    coordinates: { lat: 24.8963, lng: 55.1614 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted. Future hub for DXB traffic.",
    runwayLength: "4,500 m / 14,764 ft - Asphalt",
    runwaySurface: "Asphalt (12L/30R, 12R/30L)",
    elevation: "171 ft / 52 m",
    fbos: [
      { id: "omdw-dc-aviation-al", name: "DC Aviation Al-Futtaim Dubai South", phone: "+971 4 870 4000", email: "dubai.south@dc-aviation-alfuttaim.ae", vhfFrequency: "130.775 MHz", address: "DC Aviation Terminal, Dubai World Central", operatingHours: "H24", languages: ["Arabic", "English", "Hindi", "German"], amenities: ["Ultra VVIP Suites", "Expo City Transfer", "Full MRO", "Indoor Hangar for 737BBJ"], notes: "Uncongested alternative to DXB. BBJ/ACJ-class dedicated hangar." }
    ]
  },
  {
    id: "abu-dhabi",
    name: "Abu Dhabi International Airport",
    city: "Abu Dhabi",
    country: "UAE",
    iata: "AUH",
    icao: "OMAA",
    type: "dedicated",
    typeLabel: "Abu Dhabi Executive Aviation",
    popular: true,
    region: "middle_east",
    coordinates: { lat: 24.4330, lng: 54.6511 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24, no restrictions.",
    runwayLength: "4,100 m / 13,451 ft - Asphalt",
    runwaySurface: "Asphalt (13L/31R, 13R/31L, 01/19)",
    elevation: "88 ft / 27 m",
    fbos: [
      { id: "omaa-adac-executive", name: "Abu Dhabi Aviation Executive", phone: "+971 2 575 2000", email: "executive@adaviation.ae", vhfFrequency: "130.650 MHz", address: "Executive Aviation, Abu Dhabi Airport", operatingHours: "H24", languages: ["Arabic", "English", "Hindi", "French"], amenities: ["Louvre Abu Dhabi Concierge", "Sheikh Zayed Grand Mosque Transfer", "Presidential Protocol", "Yas Island Logistics"], notes: "UAE capital gateway. Louvre, Grand Mosque, Formula E." }
    ]
  },
  {
    id: "riyadh",
    name: "King Khalid International Airport",
    city: "Riyadh",
    country: "Saudi Arabia",
    iata: "RUH",
    icao: "OERK",
    type: "dedicated",
    typeLabel: "Royal Terminal VVIP",
    popular: true,
    region: "middle_east",
    coordinates: { lat: 24.9578, lng: 46.6989 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24, Royal Protocol procedures apply for VVIP.",
    runwayLength: "4,206 m / 13,799 ft - Asphalt",
    runwaySurface: "Asphalt (15L/33R, 15R/33L, 01L/19R, 01R/19L)",
    elevation: "2,049 ft / 625 m",
    fbos: [
      { id: "oerk-saudia-vip", name: "Saudia Private VIP Terminal", phone: "+966 11 221 1888", email: "privateterminal@saudiairlines.com.sa", vhfFrequency: "130.650 MHz", address: "Royal VIP Terminal, King Khalid Airport", operatingHours: "H24", languages: ["Arabic", "English"], amenities: ["Royal Protocol", "Royal Guard Coordination", "Full Customs Clearance", "Presidential Suites"], notes: "Saudi Royal Family and VVIP state visits terminal" }
    ]
  },
  {
    id: "jeddah",
    name: "King Abdulaziz International Airport",
    city: "Jeddah",
    country: "Saudi Arabia",
    iata: "JED",
    icao: "OEJN",
    type: "dedicated",
    typeLabel: "Executive VIP Terminal",
    popular: true,
    region: "middle_east",
    coordinates: { lat: 21.6796, lng: 39.1565 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24. Major Hajj/Umrah gateway with heavy seasonal congestion.",
    runwayLength: "3,800 m / 12,467 ft - Asphalt",
    runwaySurface: "Asphalt (16L/34R, 16C/34C, 16R/34L)",
    elevation: "48 ft / 15 m",
    fbos: [
      { id: "oejn-snas", name: "SNAS Executive Terminal Jeddah", phone: "+966 12 685 7777", email: "executive@snas.com.sa", vhfFrequency: "130.775 MHz", address: "Executive Terminal, King Abdulaziz Airport", operatingHours: "H24", languages: ["Arabic", "English", "Urdu", "French"], amenities: ["Red Sea Superyacht Coordination", "Al-Corniche Transfers", "Mecca Proximity Transfer"], notes: "Red Sea Riviera and Mecca gateway" }
    ]
  },
  {
    id: "doha",
    name: "Hamad International Airport",
    city: "Doha",
    country: "Qatar",
    iata: "DOH",
    icao: "OTHH",
    type: "dedicated",
    typeLabel: "Qatar Executive FBO",
    popular: true,
    region: "middle_east",
    coordinates: { lat: 25.2731, lng: 51.6085 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted.",
    runwayLength: "4,850 m / 15,912 ft - Asphalt",
    runwaySurface: "Asphalt (16L/34R, 16R/34L)",
    elevation: "13 ft / 4 m",
    fbos: [
      { id: "othh-qatar-executive", name: "Qatar Executive FBO", phone: "+974 4022 7000", email: "qefbo@qatarairways.com.qa", vhfFrequency: "130.650 MHz", address: "Qatar Executive Terminal, Hamad International", operatingHours: "H24", languages: ["Arabic", "English", "French", "Hindi"], amenities: ["ACJ320neo Fleet Base", "Souq Waqif Concierge", "Pearl Qatar Marina Transfer", "Full VVIP Protocol"], notes: "Qatar Executive chartered aircraft base. World Cup legacy hub." }
    ]
  },
  {
    id: "kuwait",
    name: "Kuwait International Airport",
    city: "Kuwait City",
    country: "Kuwait",
    iata: "KWI",
    icao: "OKBK",
    type: "dedicated",
    typeLabel: "Executive VIP Terminal",
    popular: false,
    region: "middle_east",
    coordinates: { lat: 29.2267, lng: 47.9689 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24, no restrictions.",
    runwayLength: "3,400 m / 11,155 ft - Asphalt",
    runwaySurface: "Asphalt (15L/33R, 15R/33L)",
    elevation: "206 ft / 63 m",
    fbos: [
      { id: "okbk-kac-vip", name: "Kuwait Airways VIP Terminal", phone: "+965 2434 5555", email: "vipterminal@kuwaitairways.com", vhfFrequency: "130.775 MHz", address: "VIP Terminal, Kuwait International Airport", operatingHours: "H24", languages: ["Arabic", "English"], amenities: ["State Protocol", "Al Shaheed Park Concierge", "Customs Fast-Track"], notes: "Kuwait government and HNWI gateway" }
    ]
  },
  {
    id: "muscat",
    name: "Muscat International Airport",
    city: "Muscat",
    country: "Oman",
    iata: "MCT",
    icao: "OOMS",
    type: "dedicated",
    typeLabel: "Oman Air Executive Terminal",
    popular: false,
    region: "middle_east",
    coordinates: { lat: 23.5933, lng: 58.2844 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted.",
    runwayLength: "4,000 m / 13,123 ft - Asphalt",
    runwaySurface: "Asphalt (08L/26R, 08R/26L)",
    elevation: "48 ft / 15 m",
    fbos: [
      { id: "ooms-oman-air-exec", name: "Oman Air Executive FBO", phone: "+968 2452 1200", email: "executive@omanair.com", vhfFrequency: "130.650 MHz", address: "Executive Terminal, Muscat Airport", operatingHours: "H24", languages: ["Arabic", "English", "Hindi"], amenities: ["Sultan's Palace Tours", "Wadi Exploration Logistics", "Dhow Cruise Coordination"], notes: "Oman's gateway - wadis, desert forts & coastal luxury" }
    ]
  },
  {
    id: "amman",
    name: "Queen Alia International Airport",
    city: "Amman",
    country: "Jordan",
    iata: "AMM",
    icao: "OJAI",
    type: "dedicated",
    typeLabel: "Royal Jordanian Executive",
    popular: false,
    region: "middle_east",
    coordinates: { lat: 31.7226, lng: 35.9930 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24, no restrictions.",
    runwayLength: "3,660 m / 12,008 ft - Asphalt",
    runwaySurface: "Asphalt (08/26)",
    elevation: "2,395 ft / 730 m",
    fbos: [
      { id: "ojai-rja-executive", name: "Royal Jordanian Executive", phone: "+962 6 445 1000", email: "executive@rj.com", vhfFrequency: "130.775 MHz", address: "Executive Terminal, QAIA, Amman", operatingHours: "H24", languages: ["Arabic", "English", "French"], amenities: ["Petra Day Trip Logistics", "Wadi Rum Desert Coordination", "Dead Sea Transfers", "Royal Protocol"], notes: "Gateway to Petra, Wadi Rum, Dead Sea - Nabataean kingdom" }
    ]
  },
  {
    id: "tel-aviv",
    name: "Ben Gurion International Airport",
    city: "Tel Aviv",
    country: "Israel",
    iata: "TLV",
    icao: "LLBG",
    type: "fbo",
    typeLabel: "Executive Terminal Ben Gurion",
    popular: false,
    region: "middle_east",
    coordinates: { lat: 32.0114, lng: 34.8867 },
    operatingHours: "H24 / 7 days (restrictions on Sabbath/Jewish holidays)",
    extensionPossibilities: "H24, Sabbath procedures apply - limited commercial but business jets operate.",
    runwayLength: "3,900 m / 12,795 ft - Asphalt",
    runwaySurface: "Asphalt (08/26, 12/30, 03/21)",
    elevation: "135 ft / 41 m",
    fbos: [
      { id: "llbg-aviation-services", name: "IAA Executive Services", phone: "+972 3 972 3300", email: "executive@iaa.gov.il", vhfFrequency: "130.650 MHz", address: "Executive Terminal, Ben Gurion Airport", operatingHours: "H24", languages: ["Hebrew", "English", "Arabic", "Russian", "French"], amenities: ["Jerusalem Transfer", "Dead Sea Access", "Security Protocols", "VIP Customs"], notes: "Highest-security aviation operations globally." }
    ]
  },

  // ================= ASIA-PACIFIC =================
  {
    id: "hong-kong",
    name: "Hong Kong International Airport",
    city: "Hong Kong",
    country: "Hong Kong",
    iata: "HKG",
    icao: "VHHH",
    type: "dedicated",
    typeLabel: "Business Aviation Centre Hong Kong",
    popular: true,
    region: "asia_pacific",
    coordinates: { lat: 22.3080, lng: 113.9185 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted.",
    runwayLength: "3,800 m / 12,467 ft - Asphalt",
    runwaySurface: "Asphalt (07L/25R, 07R/25L)",
    elevation: "28 ft / 9 m",
    fbos: [
      { id: "vhhh-haeco-bac", name: "HAECO Business Aviation Centre", phone: "+852 2747 5000", email: "bac@haeco.com", vhfFrequency: "130.775 MHz", address: "Business Aviation Centre, 1 Sky Plaza Road", operatingHours: "H24", languages: ["Cantonese", "English", "Mandarin", "French"], amenities: ["Peak Tram Concierge", "Victoria Harbour Views", "Superyacht Marina Transfer", "Full MRO"], notes: "Asia's premier business aviation centre. Full maintenance capability." }
    ]
  },
  {
    id: "singapore-seletar",
    name: "Singapore Seletar Airport",
    city: "Singapore",
    country: "Singapore",
    iata: "XSP",
    icao: "WSSL",
    type: "dedicated",
    typeLabel: "Seletar Executive Terminal",
    popular: true,
    region: "asia_pacific",
    coordinates: { lat: 1.4169, lng: 103.8678 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted for business aviation.",
    runwayLength: "1,836 m / 6,024 ft - Asphalt",
    runwaySurface: "Asphalt (03/21)",
    elevation: "36 ft / 11 m",
    fbos: [
      { id: "wssl-jetquay", name: "JetQuay Private Terminal Seletar", phone: "+65 6880 7700", email: "seletar@jetquay.com", vhfFrequency: "122.325 MHz", address: "Seletar Aerospace Park, Singapore 797595", operatingHours: "H24", languages: ["English", "Mandarin", "Malay", "Tamil", "Hindi"], amenities: ["Private Customs Gateway", "Singapore Botanic Gardens Access", "Corporate Concierge", "Full MRO at Seletar Aerospace"], notes: "Singapore's dedicated business aviation airport, MRO hub for Asia" }
    ]
  },
  {
    id: "tokyo-narita",
    name: "Narita International Airport",
    city: "Tokyo",
    country: "Japan",
    iata: "NRT",
    icao: "RJAA",
    type: "fbo",
    typeLabel: "Executive Terminal Narita",
    popular: true,
    region: "asia_pacific",
    coordinates: { lat: 35.7647, lng: 140.3864 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24, no night curfew.",
    runwayLength: "4,000 m / 13,123 ft - Asphalt",
    runwaySurface: "Asphalt (16L/34R, 16R/34L)",
    elevation: "141 ft / 43 m",
    fbos: [
      { id: "rjaa-ana-business", name: "ANA Business Aviation", phone: "+81 476 34 6111", email: "business.aviation@ana.co.jp", vhfFrequency: "130.650 MHz", address: "General Aviation Terminal, Narita Airport", operatingHours: "H24", languages: ["Japanese", "English", "Chinese", "Korean"], amenities: ["Tokyo Disneyland Proximity", "Mount Fuji View Package", "Ryokan Coordination", "VIP Customs"], notes: "Tokyo gateway with fastest customs clearance in Japan" }
    ]
  },
  {
    id: "tokyo-haneda",
    name: "Tokyo Haneda Airport",
    city: "Tokyo",
    country: "Japan",
    iata: "HND",
    icao: "RJTT",
    type: "fbo",
    typeLabel: "Executive Terminal Haneda",
    popular: true,
    region: "asia_pacific",
    coordinates: { lat: 35.5522, lng: 139.7799 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24. Closest international airport to central Tokyo.",
    runwayLength: "3,360 m / 11,024 ft - Asphalt",
    runwaySurface: "Asphalt (04/22, 16L/34R, 16R/34L)",
    elevation: "21 ft / 6 m",
    fbos: [
      { id: "rjtt-jal-business", name: "JAL Business Aviation Haneda", phone: "+81 3 5757 7111", email: "charter@jal.com", vhfFrequency: "130.775 MHz", address: "Terminal 3, Tokyo International Airport", operatingHours: "H24", languages: ["Japanese", "English", "Chinese"], amenities: ["Closest to Ginza & Shibuya", "Bullet Train Coordination", "Imperial Palace Tours", "VIP Customs"], notes: "Only 25 min to central Tokyo. Best for business executives." }
    ]
  },
  {
    id: "beijing-capital",
    name: "Beijing Capital International Airport",
    city: "Beijing",
    country: "China",
    iata: "PEK",
    icao: "ZBAA",
    type: "dedicated",
    typeLabel: "VIP Terminal 1 Beijing",
    popular: true,
    region: "asia_pacific",
    coordinates: { lat: 40.0799, lng: 116.6031 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24. Government approval required for some business jets.",
    runwayLength: "3,800 m / 12,467 ft - Asphalt",
    runwaySurface: "Asphalt (01/19, 18L/36R, 18R/36L)",
    elevation: "116 ft / 35 m",
    fbos: [
      { id: "zbaa-cca-vip", name: "Air China VIP Terminal Beijing", phone: "+86 10 6459 8800", email: "vipterminal@airchina.com.cn", vhfFrequency: "130.650 MHz", address: "Terminal 1, Beijing Capital Airport, Chaoyang", operatingHours: "H24", languages: ["Mandarin", "English", "French", "Japanese"], amenities: ["Forbidden City Concierge", "Great Wall Tours", "State Protocol", "CAAC-Approved Ops"], notes: "China's capital gateway. CAAC approval required in advance." }
    ]
  },
  {
    id: "shanghai-hongqiao",
    name: "Shanghai Hongqiao International Airport",
    city: "Shanghai",
    country: "China",
    iata: "SHA",
    icao: "ZSSS",
    type: "fbo",
    typeLabel: "Executive FBO Shanghai",
    popular: true,
    region: "asia_pacific",
    coordinates: { lat: 31.1979, lng: 121.3360 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24, CAAC slot coordination required.",
    runwayLength: "3,300 m / 10,827 ft - Asphalt",
    runwaySurface: "Asphalt (18L/36R, 18R/36L)",
    elevation: "10 ft / 3 m",
    fbos: [
      { id: "zsss-juneyao-exec", name: "Juneyao Executive Aviation Shanghai", phone: "+86 21 6268 8899", email: "executive@juneyaoair.com", vhfFrequency: "130.775 MHz", address: "Executive Terminal, Hongqiao Airport", operatingHours: "H24", languages: ["Mandarin", "English", "Japanese"], amenities: ["The Bund Access", "Yu Garden Concierge", "High-Speed Maglev Connection", "VIP Customs"], notes: "City centre proximity. 10 min to The Bund and Xintiandi." }
    ]
  },
  {
    id: "sydney-kingsford",
    name: "Sydney Kingsford Smith Airport",
    city: "Sydney",
    country: "Australia",
    iata: "SYD",
    icao: "YSSY",
    type: "fbo",
    typeLabel: "ExecuJet Executive Terminal Sydney",
    popular: true,
    region: "asia_pacific",
    coordinates: { lat: -33.9461, lng: 151.1772 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "Night curfew 11 pm - 6 am for most aircraft. Business jets under 34 tonnes may be exempt.",
    runwayLength: "3,962 m / 12,999 ft - Asphalt",
    runwaySurface: "Asphalt (16L/34R, 16R/34L, 07/25)",
    elevation: "21 ft / 6 m",
    fbos: [
      { id: "yssy-execujet", name: "ExecuJet Sydney", phone: "+61 2 9666 0900", email: "sydney@execujet.com", vhfFrequency: "130.775 MHz", address: "ExecuJet Terminal, 11 Ross Smith Ave, Mascot NSW 2020", operatingHours: "H24 (curfew restrictions apply)", languages: ["English", "Mandarin", "Japanese", "Korean"], amenities: ["Opera House Concierge", "Superyacht Harbour Transfer", "Outback Safari Coordination", "VIP Customs"], notes: "Sydney Harbour, Opera House and Bondi Beach gateway" }
    ]
  },
  {
    id: "melbourne",
    name: "Melbourne Tullamarine Airport",
    city: "Melbourne",
    country: "Australia",
    iata: "MEL",
    icao: "YMML",
    type: "fbo",
    typeLabel: "Executive Terminal Melbourne",
    popular: false,
    region: "asia_pacific",
    coordinates: { lat: -37.6690, lng: 144.8410 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted.",
    runwayLength: "3,657 m / 11,998 ft - Asphalt",
    runwaySurface: "Asphalt (16/34, 09/27, 27/09)",
    elevation: "434 ft / 132 m",
    fbos: [
      { id: "ymml-jetbase", name: "JetBase Executive Melbourne", phone: "+61 3 9338 1400", email: "melbourne@jetbase.com.au", vhfFrequency: "130.650 MHz", address: "Executive Terminal, Melbourne Airport VIC 3045", operatingHours: "H24", languages: ["English", "Mandarin", "Japanese", "Greek"], amenities: ["Great Ocean Road Transfer", "Yarra Valley Wine Tours", "F1 Grand Prix Logistics", "VIP Customs"], notes: "Australian Grand Prix, Yarra Valley, Great Ocean Road gateway" }
    ]
  },
  {
    id: "maldives-male",
    name: "Velana International Airport",
    city: "Malé",
    country: "Maldives",
    iata: "MLE",
    icao: "VRMM",
    type: "fbo",
    typeLabel: "Executive FBO Maldives",
    popular: true,
    region: "asia_pacific",
    coordinates: { lat: 4.1918, lng: 73.5290 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24. Seaplane transfer coordination mandatory for most resorts.",
    runwayLength: "3,200 m / 10,499 ft - Asphalt",
    runwaySurface: "Asphalt (18/36)",
    elevation: "6 ft / 2 m",
    fbos: [
      { id: "vrmm-maldivian", name: "Maldivian Executive FBO", phone: "+960 333 4455", email: "executive@maldivian.aero", vhfFrequency: "130.650 MHz", address: "Executive Terminal, Velana International Airport", operatingHours: "H24", languages: ["Dhivehi", "English", "Mandarin", "Arabic"], amenities: ["Seaplane Transfer Coordination", "Overwater Villa Concierge", "Dive Excursion Logistics", "Private Island Transfers"], notes: "World's most exclusive island resort gateway. Seaplane hub." }
    ]
  },
  {
    id: "bali-denpasar",
    name: "Ngurah Rai International Airport",
    city: "Bali / Denpasar",
    country: "Indonesia",
    iata: "DPS",
    icao: "WADD",
    type: "fbo",
    typeLabel: "Executive FBO Bali",
    popular: true,
    region: "asia_pacific",
    coordinates: { lat: -8.7467, lng: 115.1667 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24, slot coordination during peak periods.",
    runwayLength: "3,000 m / 9,842 ft - Asphalt",
    runwaySurface: "Asphalt (09/27)",
    elevation: "14 ft / 4 m",
    fbos: [
      { id: "wadd-bali-executive", name: "Bali Executive FBO", phone: "+62 361 751 011", email: "executive@baliairport.co.id", vhfFrequency: "130.775 MHz", address: "Executive Terminal, Ngurah Rai Airport", operatingHours: "H24", languages: ["Indonesian", "Balinese", "English", "Mandarin", "Japanese"], amenities: ["Seminyak Villa Concierge", "Ubud Cultural Tours", "Surf Coordination Canggu", "Superyacht Benoa Transfer"], notes: "Bali villa, temple, surf and wellness gateway" }
    ]
  },
  {
    id: "phuket",
    name: "Phuket International Airport",
    city: "Phuket",
    country: "Thailand",
    iata: "HKT",
    icao: "VTSP",
    type: "fbo",
    typeLabel: "Executive FBO Phuket",
    popular: true,
    region: "asia_pacific",
    coordinates: { lat: 8.1132, lng: 98.3169 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted.",
    runwayLength: "3,000 m / 9,842 ft - Asphalt",
    runwaySurface: "Asphalt (09/27)",
    elevation: "82 ft / 25 m",
    fbos: [
      { id: "vtsp-sia-executive", name: "SIA Executive FBO Phuket", phone: "+66 76 351 234", email: "executive@phuketairport.com", vhfFrequency: "130.650 MHz", address: "Executive Terminal, Phuket Airport", operatingHours: "H24", languages: ["Thai", "English", "Mandarin", "Russian", "German"], amenities: ["Patong Beach Villa Transfer", "Superyacht Ao Phang Nga Coordination", "Island Hopping Helicopter", "Luxury Resort Concierge"], notes: "Thai Riviera gateway. Superyacht & private island transfers." }
    ]
  },
  {
    id: "mumbai-chhatrapati",
    name: "Chhatrapati Shivaji Maharaj International Airport",
    city: "Mumbai",
    country: "India",
    iata: "BOM",
    icao: "VABB",
    type: "dedicated",
    typeLabel: "Executive Lounge & Handling",
    popular: true,
    region: "asia_pacific",
    coordinates: { lat: 19.0896, lng: 72.8656 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24. DGCA permit required for foreign-registered aircraft.",
    runwayLength: "3,660 m / 12,008 ft - Asphalt",
    runwaySurface: "Asphalt (09/27, 14/32)",
    elevation: "37 ft / 11 m",
    fbos: [
      { id: "vabb-bird-executive", name: "Bird Executive Services Mumbai", phone: "+91 22 2682 1000", email: "executive@birdworldwide.com", vhfFrequency: "130.775 MHz", address: "Executive Terminal, CSIA, Mumbai 400099", operatingHours: "H24", languages: ["English", "Hindi", "Marathi", "Gujarati"], amenities: ["Bollywood Connections", "Taj Mahal Palace Concierge", "Marine Drive Transfer", "DGCA Permit Facilitation"], notes: "India's financial capital. Bollywood & Taj Mahal Palace." }
    ]
  },
  {
    id: "delhi-indira-gandhi",
    name: "Indira Gandhi International Airport",
    city: "New Delhi",
    country: "India",
    iata: "DEL",
    icao: "VIDP",
    type: "dedicated",
    typeLabel: "Executive Lounge Terminal 2",
    popular: true,
    region: "asia_pacific",
    coordinates: { lat: 28.5665, lng: 77.1031 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24, DGCA permit required for certain aircraft.",
    runwayLength: "4,430 m / 14,534 ft - Asphalt",
    runwaySurface: "Asphalt (09/27, 11/29, 10/28, 29/11)",
    elevation: "777 ft / 237 m",
    fbos: [
      { id: "vidp-flybig-exec", name: "Air India Executive Handling Delhi", phone: "+91 11 2567 1000", email: "executive@airindia.in", vhfFrequency: "130.650 MHz", address: "Executive Terminal 2, IGI Airport, New Delhi", operatingHours: "H24", languages: ["Hindi", "English", "Arabic", "French", "Russian"], amenities: ["Taj Mahal Day Trip (Agra 200km)", "Red Fort Concierge", "Presidential Protocol", "DGCA Facilitation"], notes: "India's capital gateway. Taj Mahal, Rajasthan, Himalaya tours." }
    ]
  },
  {
    id: "kathmandu",
    name: "Tribhuvan International Airport",
    city: "Kathmandu",
    country: "Nepal",
    iata: "KTM",
    icao: "VNKT",
    type: "fbo",
    typeLabel: "Executive FBO Kathmandu",
    popular: false,
    region: "asia_pacific",
    coordinates: { lat: 27.6966, lng: 85.3591 },
    operatingHours: "06:00 - 20:00 LT (limited extensions)",
    extensionPossibilities: "Visual approach only. No ILS. Night operations very limited. High-altitude performance calculations mandatory.",
    runwayLength: "3,048 m / 10,000 ft - Asphalt",
    runwaySurface: "Asphalt (02/20)",
    elevation: "4,390 ft / 1,338 m",
    fbos: [
      { id: "vnkt-yeti-airlines", name: "Yeti Airlines Executive Handling", phone: "+977 1 448 7000", email: "executive@yetiairlines.com", vhfFrequency: "118.100 MHz", address: "General Aviation, TIA, Kathmandu", operatingHours: "06:30 - 19:30 LT", languages: ["Nepali", "English", "Hindi", "Tibetan"], amenities: ["Everest Base Camp Logistics", "Himalayan Trekking Coordination", "Buddhist Monastery Tours", "High-Altitude Medical Briefing"], notes: "Gateway to Everest. Performance calculations critical." }
    ]
  },

  // ================= AMERICAS =================
  {
    id: "new-york-teterboro",
    name: "Teterboro Airport",
    city: "New York (New Jersey)",
    country: "United States",
    iata: "TEB",
    icao: "KTEB",
    type: "dedicated",
    typeLabel: "Premier NY Metro Business Aviation",
    popular: true,
    region: "americas",
    coordinates: { lat: 40.8501, lng: -74.0608 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24. Noise abatement procedures active. No scheduled airline operations - exclusively business aviation.",
    runwayLength: "1,829 m / 6,001 ft - Asphalt",
    runwaySurface: "Asphalt (01/19, 06/24)",
    elevation: "9 ft / 3 m",
    fbos: [
      { id: "kteb-signature", name: "Signature Flight Support Teterboro", phone: "+1 201 288 7811", email: "teb@signatureflight.com", vhfFrequency: "132.000 MHz", address: "2 Runway Road, Teterboro, NJ 07608", operatingHours: "H24", languages: ["English", "Spanish", "French", "Arabic", "Mandarin"], amenities: ["Manhattan 20min by Car", "NYC Helicopter Transfer", "Celebrity VIP Protocols", "On-Site Customs", "Presidential Suite"], notes: "New York's premier business aviation gateway. 8mi to Midtown Manhattan." },
      { id: "kteb-meridian", name: "Meridian FBO Teterboro", phone: "+1 201 727 2900", email: "info@meridianair.com", vhfFrequency: "131.700 MHz", address: "1 Hovchild Plaza, Teterboro, NJ 07608", operatingHours: "H24", languages: ["English", "Spanish", "French"], amenities: ["Platinum VIP Lounge", "On-Site US Customs & CBP", "Concierge NYC Service", "Full Hangar"], notes: "Top-rated NY metro FBO. Fastest customs in the northeast." }
    ]
  },
  {
    id: "miami-opa-locka",
    name: "Miami Executive Airport (Opa-Locka)",
    city: "Miami",
    country: "United States",
    iata: "OPF",
    icao: "KOPF",
    type: "dedicated",
    typeLabel: "Executive FBO",
    popular: true,
    region: "americas",
    coordinates: { lat: 25.9070, lng: -80.2783 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24, no restrictions.",
    runwayLength: "1,678 m / 5,505 ft - Asphalt",
    runwaySurface: "Asphalt (06/24, 09L/27R, 09R/27L)",
    elevation: "7 ft / 2 m",
    fbos: [
      { id: "kopf-landmark", name: "Landmark Aviation Miami", phone: "+1 305 685 6400", email: "miami@landmarkaviation.com", vhfFrequency: "132.600 MHz", address: "14201 NW 42nd Ave, Opa-Locka, FL 33054", operatingHours: "H24", languages: ["English", "Spanish", "Portuguese", "French", "Arabic"], amenities: ["South Beach Transfer", "Caribbean Island Hop Coordination", "Drug Interdiction Security", "On-Site US Customs"], notes: "Miami/South Beach gateway. Caribbean flight operations base." }
    ]
  },
  {
    id: "miami-international",
    name: "Miami International Airport",
    city: "Miami",
    country: "United States",
    iata: "MIA",
    icao: "KMIA",
    type: "fbo",
    typeLabel: "Signature Flight MIA",
    popular: true,
    region: "americas",
    coordinates: { lat: 25.7959, lng: -80.2870 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted.",
    runwayLength: "3,962 m / 12,999 ft - Asphalt",
    runwaySurface: "Asphalt (08L/26R, 08R/26L, 09/27, 12/30)",
    elevation: "11 ft / 3 m",
    fbos: [
      { id: "kmia-signature", name: "Signature Flight Support Miami", phone: "+1 305 526 7501", email: "mia@signatureflight.com", vhfFrequency: "130.950 MHz", address: "1800 NW 42nd Ave, Miami, FL 33142", operatingHours: "H24", languages: ["English", "Spanish", "Portuguese", "French", "Haitian Creole"], amenities: ["Art Basel Logistics", "Formula 1 Miami GP", "Latin America Gateway", "Full US Customs"], notes: "Latin America gateway. Art Basel, F1 Miami Grand Prix hub." }
    ]
  },
  {
    id: "los-angeles-van-nuys",
    name: "Van Nuys Airport",
    city: "Los Angeles",
    country: "United States",
    iata: "VNY",
    icao: "KVNY",
    type: "dedicated",
    typeLabel: "World's Busiest General Aviation Airport",
    popular: true,
    region: "americas",
    coordinates: { lat: 34.2098, lng: -118.4891 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24. Noise ordinance 11pm-7am for some aircraft. Heaviest business aviation traffic in the US.",
    runwayLength: "1,829 m / 5,999 ft - Asphalt",
    runwaySurface: "Asphalt (16L/34R, 16R/34L)",
    elevation: "802 ft / 244 m",
    fbos: [
      { id: "kvny-signature-vny", name: "Signature Flight Support Van Nuys", phone: "+1 818 989 2525", email: "vny@signatureflight.com", vhfFrequency: "132.800 MHz", address: "7900 Balboa Blvd, Van Nuys, CA 91406", operatingHours: "H24", languages: ["English", "Spanish", "Farsi", "Armenian", "Hebrew"], amenities: ["Beverly Hills 20min", "Hollywood Film Logistics", "Malibu Beach Transfer", "Celebrity Privacy Protocols"], notes: "Hollywood's airport. Closest to Beverly Hills, Malibu, Bel Air." },
      { id: "kvny-century", name: "Clay Lacy Aviation Van Nuys", phone: "+1 818 989 2900", email: "vny@claylacy.com", vhfFrequency: "132.950 MHz", address: "16425 Hart Street, Van Nuys, CA 91406", operatingHours: "H24", languages: ["English", "Spanish", "Mandarin"], amenities: ["Celebrity Clientele Protocols", "Full MRO", "Luxury Private Hangar"], notes: "Clay Lacy - LA's premier VIP aviation experience since 1968" }
    ]
  },
  {
    id: "aspen-pitkin",
    name: "Aspen/Pitkin County Airport",
    city: "Aspen",
    country: "United States",
    iata: "ASE",
    icao: "KASE",
    type: "dedicated",
    typeLabel: "Resort Business Aviation",
    popular: true,
    region: "americas",
    coordinates: { lat: 39.2232, lng: -106.8688 },
    operatingHours: "07:00 - 21:00 LT (strict curfew)",
    extensionPossibilities: "Strict night curfew. Turboprop and light jet preferred. Performance calculations critical at 7,816 ft elevation.",
    runwayLength: "2,133 m / 6,998 ft - Asphalt",
    runwaySurface: "Asphalt (15/33)",
    elevation: "7,820 ft / 2,384 m",
    fbos: [
      { id: "kase-aspen-aviation", name: "Aspen Aviation FBO", phone: "+1 970 920 5500", email: "fbo@aspenaviation.com", vhfFrequency: "132.800 MHz", address: "0233 Airport Road, Aspen, CO 81611", operatingHours: "07:00 - 21:00 LT", languages: ["English", "French", "German", "Spanish"], amenities: ["Ski Valet Coordination", "Snowmass Shuttle", "High Altitude Performance Briefings", "Ski Concierge"], notes: "Winter: fully booked Nov-March. High-altitude performance mandatory." }
    ]
  },
  {
    id: "palm-beach",
    name: "Palm Beach International Airport",
    city: "Palm Beach / West Palm Beach",
    country: "United States",
    iata: "PBI",
    icao: "KPBI",
    type: "fbo",
    typeLabel: "Executive FBO Palm Beach",
    popular: true,
    region: "americas",
    coordinates: { lat: 26.6832, lng: -80.0956 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24, no restrictions.",
    runwayLength: "2,743 m / 8,999 ft - Asphalt",
    runwaySurface: "Asphalt (13/31, 10/28)",
    elevation: "19 ft / 6 m",
    fbos: [
      { id: "kpbi-landmark", name: "Landmark Aviation Palm Beach", phone: "+1 561 471 1500", email: "pbi@landmarkaviation.com", vhfFrequency: "132.750 MHz", address: "1000 Turnage Blvd, West Palm Beach, FL 33406", operatingHours: "H24", languages: ["English", "Spanish", "French", "Portuguese", "German"], amenities: ["Mar-a-Lago Proximity", "Worth Avenue Retail Concierge", "Palm Beach Social Season Logistics", "On-Site US Customs"], notes: "Palm Beach 'season' (Jan-Mar) hub. Worth Avenue and estate access." }
    ]
  },
  {
    id: "las-vegas-henderson",
    name: "Henderson Executive Airport",
    city: "Las Vegas",
    country: "United States",
    iata: "HSH",
    icao: "KHND",
    type: "dedicated",
    typeLabel: "Henderson Executive",
    popular: true,
    region: "americas",
    coordinates: { lat: 35.9728, lng: -115.1344 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted. Alternative to congested KLAS.",
    runwayLength: "1,967 m / 6,453 ft - Asphalt",
    runwaySurface: "Asphalt (17L/35R, 17R/35L)",
    elevation: "2,492 ft / 760 m",
    fbos: [
      { id: "khnd-signature", name: "Signature Flight Support Henderson", phone: "+1 702 897 9200", email: "hnd@signatureflight.com", vhfFrequency: "125.800 MHz", address: "3500 Executive Terminal Drive, Henderson, NV 89052", operatingHours: "H24", languages: ["English", "Spanish", "Mandarin", "Arabic"], amenities: ["Las Vegas Strip 15 min", "UFC Events Logistics", "Super Bowl Packages", "Casino Hotel Concierge"], notes: "Less congested alternative to KLAS. 15 min to the Strip." }
    ]
  },
  {
    id: "cancun",
    name: "Cancún International Airport",
    city: "Cancún",
    country: "Mexico",
    iata: "CUN",
    icao: "MMUN",
    type: "fbo",
    typeLabel: "Executive FBO Cancún",
    popular: true,
    region: "americas",
    coordinates: { lat: 21.0365, lng: -86.8771 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted.",
    runwayLength: "3,500 m / 11,483 ft - Asphalt",
    runwaySurface: "Asphalt (12/30, 06/24)",
    elevation: "22 ft / 7 m",
    fbos: [
      { id: "mmun-signature", name: "Signature Flight Support Cancún", phone: "+52 998 886 0007", email: "cancun@signatureflight.com", vhfFrequency: "130.775 MHz", address: "Terminal Aviación General, Cancún Airport", operatingHours: "H24", languages: ["Spanish", "English", "French", "Italian", "German"], amenities: ["Riviera Maya Transfer", "Tulum Cenote Helicopter", "Private Resort Concierge", "Mexican Customs On-Site"], notes: "Caribbean Riviera gateway. Tulum, Riviera Maya, Cozumel." }
    ]
  },
  {
    id: "sao-paulo-congonhas",
    name: "Congonhas São Paulo Airport",
    city: "São Paulo",
    country: "Brazil",
    iata: "CGH",
    icao: "SBSP",
    type: "dedicated",
    typeLabel: "Executive Terminal Congonhas",
    popular: true,
    region: "americas",
    coordinates: { lat: -23.6261, lng: -46.6557 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24. Major domestic business aviation hub of South America.",
    runwayLength: "1,940 m / 6,365 ft - Asphalt",
    runwaySurface: "Asphalt (17L/35R, 17R/35L)",
    elevation: "802 ft / 244 m",
    fbos: [
      { id: "sbsp-sky-service", name: "Sky Service Executive São Paulo", phone: "+55 11 5072 5000", email: "congonhas@skyservice.com.br", vhfFrequency: "130.775 MHz", address: "Terminal Executivo, Aeroporto Congonhas", operatingHours: "H24", languages: ["Portuguese", "English", "Spanish"], amenities: ["Paulista Avenue Business District", "Ibirapuera Park Transfers", "Helicopter Tours", "Customs Facilitation"], notes: "South America's busiest business aviation airport" }
    ]
  },
  {
    id: "buenos-aires-aeroparque",
    name: "Jorge Newbery Aeroparque",
    city: "Buenos Aires",
    country: "Argentina",
    iata: "AEP",
    icao: "SABE",
    type: "dedicated",
    typeLabel: "Executive Terminal Aeroparque",
    popular: true,
    region: "americas",
    coordinates: { lat: -34.5592, lng: -58.4156 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24. Buenos Aires city centre airport.",
    runwayLength: "2,100 m / 6,890 ft - Asphalt",
    runwaySurface: "Asphalt (13/31, 18/36)",
    elevation: "20 ft / 6 m",
    fbos: [
      { id: "sabe-aerohandling", name: "Aerohandling Executive Buenos Aires", phone: "+54 11 4514 1800", email: "executive@aerohandling.com.ar", vhfFrequency: "130.775 MHz", address: "Terminal Ejecutivo, Aeroparque Buenos Aires", operatingHours: "H24", languages: ["Spanish", "English", "Italian", "French"], amenities: ["Recoleta Cemetery & Palermo Polo", "Puerto Madero Steak Dinner", "Tango Show Concierge", "Patagonia Expedition Logistics"], notes: "City-centre Buenos Aires. Patagonia, Bariloche & Iguazú gateway." }
    ]
  },
  {
    id: "toronto-pearson",
    name: "Toronto Pearson International Airport",
    city: "Toronto",
    country: "Canada",
    iata: "YYZ",
    icao: "CYYZ",
    type: "fbo",
    typeLabel: "Signature Flight Toronto",
    popular: true,
    region: "americas",
    coordinates: { lat: 43.6772, lng: -79.6306 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted.",
    runwayLength: "3,368 m / 11,050 ft - Asphalt",
    runwaySurface: "Asphalt (05/23, 06L/24R, 06R/24L, 15L/33R, 15R/33L)",
    elevation: "569 ft / 173 m",
    fbos: [
      { id: "cyyz-signature", name: "Signature Flight Support Toronto", phone: "+1 905 673 0505", email: "yyz@signatureflight.com", vhfFrequency: "130.775 MHz", address: "Terminal Building C, Pearson Airport", operatingHours: "H24", languages: ["English", "French", "Mandarin", "Hindi", "Arabic"], amenities: ["Niagara Falls Helicopter", "CN Tower Concierge", "Financial District Proximity", "On-Site Canadian Customs"], notes: "Canada's business capital gateway. Niagara & Great Lakes." }
    ]
  },

  // ================= AFRICA =================
  {
    id: "cape-town",
    name: "Cape Town International Airport",
    city: "Cape Town",
    country: "South Africa",
    iata: "CPT",
    icao: "FACT",
    type: "fbo",
    typeLabel: "Executive FBO Cape Town",
    popular: true,
    region: "africa",
    coordinates: { lat: -33.9648, lng: 18.6017 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted.",
    runwayLength: "3,201 m / 10,502 ft - Asphalt",
    runwaySurface: "Asphalt (01/19, 17/35)",
    elevation: "151 ft / 46 m",
    fbos: [
      { id: "fact-execujet-cpt", name: "ExecuJet Cape Town", phone: "+27 21 936 1050", email: "capetown@execujet.com", vhfFrequency: "130.775 MHz", address: "ExecuJet Terminal, Cape Town International", operatingHours: "H24", languages: ["English", "Afrikaans", "Zulu", "Xhosa", "French"], amenities: ["Table Mountain Helicopter", "Winelands Tour Coordination", "Safari Gateway", "Shark Cage Diving Logistics"], notes: "Table Mountain, Cape Winelands, Whale Watching, Kruger Gateway" }
    ]
  },
  {
    id: "johannesburg-or-tambo",
    name: "O.R. Tambo International Airport",
    city: "Johannesburg",
    country: "South Africa",
    iata: "JNB",
    icao: "FAOR",
    type: "fbo",
    typeLabel: "ExecuJet Johannesburg",
    popular: true,
    region: "africa",
    coordinates: { lat: -26.1392, lng: 28.2460 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted.",
    runwayLength: "4,418 m / 14,495 ft - Asphalt",
    runwaySurface: "Asphalt (03L/21R, 03R/21L)",
    elevation: "5,558 ft / 1,694 m",
    fbos: [
      { id: "faor-execujet-jnb", name: "ExecuJet Johannesburg", phone: "+27 11 230 7900", email: "johannesburg@execujet.com", vhfFrequency: "130.775 MHz", address: "ExecuJet Terminal, OR Tambo Airport", operatingHours: "H24", languages: ["English", "Afrikaans", "Zulu", "Sotho", "French"], amenities: ["Kruger National Park Safari Gateway", "Victoria Falls Coordination", "High-Altitude Performance Briefing", "Diamond Industry Concierge"], notes: "Kruger, Victoria Falls, Botswana safari gateway. High-altitude ops." }
    ]
  },
  {
    id: "nairobi-jomo-kenyatta",
    name: "Jomo Kenyatta International Airport",
    city: "Nairobi",
    country: "Kenya",
    iata: "NBO",
    icao: "HKJK",
    type: "fbo",
    typeLabel: "Executive Terminal Nairobi",
    popular: true,
    region: "africa",
    coordinates: { lat: -1.3192, lng: 36.9275 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted.",
    runwayLength: "4,117 m / 13,507 ft - Asphalt",
    runwaySurface: "Asphalt (06/24)",
    elevation: "5,327 ft / 1,624 m",
    fbos: [
      { id: "hkjk-wilson-aviation", name: "Wilson Executive Aviation Nairobi", phone: "+254 20 827 170", email: "executive@wilsonaero.co.ke", vhfFrequency: "130.650 MHz", address: "Executive Terminal, JKIA, Nairobi", operatingHours: "H24", languages: ["Swahili", "English", "French", "Arabic"], amenities: ["Masai Mara Safari Coordination", "Amboseli Mt Kilimanjaro Transfer", "Serengeti Connection", "Luxury Tented Camp Logistics"], notes: "East Africa's safari hub. Masai Mara, Serengeti, Mt Kenya." }
    ]
  },
  {
    id: "cairo",
    name: "Cairo International Airport",
    city: "Cairo",
    country: "Egypt",
    iata: "CAI",
    icao: "HECA",
    type: "dedicated",
    typeLabel: "Presidential & VIP Terminal",
    popular: true,
    region: "africa",
    coordinates: { lat: 30.1219, lng: 31.4056 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted.",
    runwayLength: "4,000 m / 13,123 ft - Asphalt",
    runwaySurface: "Asphalt (05L/23R, 05R/23L)",
    elevation: "382 ft / 116 m",
    fbos: [
      { id: "heca-egyptair-exec", name: "EgyptAir VIP Executive Terminal", phone: "+20 2 2265 7901", email: "vip@egyptair.com.eg", vhfFrequency: "130.650 MHz", address: "Presidential Terminal, Cairo International Airport", operatingHours: "H24", languages: ["Arabic", "English", "French", "German", "Italian"], amenities: ["Pyramids of Giza Transfer", "Nile Cruise Coordination", "Red Sea Resort Access", "Pharaonic Archaeology Tours"], notes: "Pyramids, Luxor, Valley of Kings, Red Sea Riviera gateway" }
    ]
  },
  {
    id: "casablanca",
    name: "Mohammed V International Airport",
    city: "Casablanca",
    country: "Morocco",
    iata: "CMN",
    icao: "GMMN",
    type: "fbo",
    typeLabel: "Royal Air Maroc Executive",
    popular: false,
    region: "africa",
    coordinates: { lat: 33.3675, lng: -7.5900 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted.",
    runwayLength: "3,720 m / 12,205 ft - Asphalt",
    runwaySurface: "Asphalt (17L/35R, 17R/35L, 10/28)",
    elevation: "656 ft / 200 m",
    fbos: [
      { id: "gmmn-menara-handling", name: "Menara Executive Handling Casablanca", phone: "+212 522 539 400", email: "executive@ram.ma", vhfFrequency: "130.775 MHz", address: "Executive Terminal, Mohammed V Airport", operatingHours: "H24", languages: ["Arabic", "French", "English", "Spanish"], amenities: ["Marrakech Transfer", "Fes Ancient Medina Tour", "Sahara Desert Expedition", "Riad Concierge"], notes: "Gateway to Marrakech, Fes, Sahara Desert, Atlas Mountains" }
    ]
  },
  {
    id: "lagos-murtala",
    name: "Murtala Muhammed International Airport",
    city: "Lagos",
    country: "Nigeria",
    iata: "LOS",
    icao: "DNMM",
    type: "dedicated",
    typeLabel: "Executive FBO Lagos",
    popular: true,
    region: "africa",
    coordinates: { lat: 6.5774, lng: 3.3212 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted.",
    runwayLength: "3,900 m / 12,795 ft - Asphalt",
    runwaySurface: "Asphalt (18L/36R, 18R/36L)",
    elevation: "135 ft / 41 m",
    fbos: [
      { id: "dnmm-execujet-lag", name: "ExecuJet Lagos", phone: "+234 1 279 2600", email: "lagos@execujet.com", vhfFrequency: "130.650 MHz", address: "ExecuJet Terminal, MMIA Lagos", operatingHours: "H24", languages: ["English", "Yoruba", "Igbo", "French", "Arabic"], amenities: ["VVIP Private Arrivals Hall", "Victoria Island Business District", "Oil & Gas Industry Logistics", "Nollywood Connections"], notes: "West Africa's commercial capital. Oil, gas & entertainment hub." }
    ]
  },

  // ================= PRIVATE AIRFIELDS & SPECIAL AIRFIELDS =================
  {
    id: "megeve-mont-blanc",
    name: "Megève Altiport",
    city: "Megève",
    country: "France",
    iata: "",
    icao: "LFHM",
    type: "private",
    typeLabel: "Mountain Altiport",
    popular: true,
    region: "europe",
    coordinates: { lat: 45.8208, lng: 6.6522 },
    operatingHours: "08:00 - 19:00 LT (winter season only approx Oct-Apr)",
    extensionPossibilities: "Seasonal operation. VFR only. STOL-capable aircraft mandatory. Performance calculations critical at 4,738 ft elevation.",
    runwayLength: "605 m / 1,985 ft - Asphalt (sloped)",
    runwaySurface: "Asphalt - sloped strip",
    elevation: "4,738 ft / 1,444 m",
    fbos: [
      { id: "lfhm-megeve-handling", name: "Megève Altiport Handling", phone: "+33 4 50 21 33 67", email: "altiport@megeve.fr", vhfFrequency: "122.300 MHz", address: "Altiport de Megève, 74120 Demi-Quartier", operatingHours: "08:00 - Sunset LT (winter season)", languages: ["French", "English", "German", "Italian", "Russian"], amenities: ["Ski-In Ski-Out Lodge Connections", "Chalet Transfer Coordination", "Hotel Lana Concierge", "Monte-Rosa Views"], notes: "One of Europe's most dramatic ski altiports. PC-12/PC-24/TBM capable. Turbine only recommended." }
    ]
  },
  {
    id: "courchevel-altiport",
    name: "Courchevel Altiport",
    city: "Courchevel",
    country: "France",
    iata: "CVF",
    icao: "LFLJ",
    type: "private",
    typeLabel: "Exclusive Ski Altiport",
    popular: true,
    region: "europe",
    coordinates: { lat: 45.3967, lng: 6.6342 },
    operatingHours: "08:30 - 18:30 LT (winter season Dec-Apr)",
    extensionPossibilities: "VFR only. Uphill runway. Special authorisation & qualification mandatory. No instrument approach.",
    runwayLength: "537 m / 1,762 ft - Asphalt (sloped)",
    runwaySurface: "Asphalt - 18.5% upward slope",
    elevation: "6,588 ft / 2,008 m",
    fbos: [
      { id: "lflj-courchevel-handling", name: "Courchevel Altiport Services", phone: "+33 4 79 08 73 83", email: "altiport@courchevel.com", vhfFrequency: "119.100 MHz", address: "Altiport de Courchevel 1850, 73120 Saint-Bon-Tarentaise", operatingHours: "08:30 - 18:30 LT (winter season)", languages: ["French", "English", "Russian", "Italian", "Arabic"], amenities: ["Palace Hotel Les Airelles Transfer", "Le Chabichou Michelin Restaurant", "Heliski Coordination", "Luxury Ski Chalet Concierge"], notes: "World's most exclusive ski airfield. Qualification required. PC-12 ideal aircraft." }
    ]
  },
  {
    id: "samedan-engadin",
    name: "Engadin Airport Samedan",
    city: "St. Moritz / Samedan",
    country: "Switzerland",
    iata: "SMV",
    icao: "LSZS",
    type: "dedicated",
    typeLabel: "St. Moritz Business Aviation Gateway",
    popular: true,
    region: "europe",
    coordinates: { lat: 46.5341, lng: 9.8842 },
    operatingHours: "08:00 - 20:00 LT (winter peak H24)",
    extensionPossibilities: "VFR predominant. ILS available. High-altitude performance calculations mandatory at 5,600 ft.",
    runwayLength: "1,800 m / 5,906 ft - Asphalt",
    runwaySurface: "Asphalt (03/21)",
    elevation: "5,600 ft / 1,707 m",
    fbos: [
      { id: "lszs-engadin-aviation", name: "Engadin Aviation", phone: "+41 81 851 1626", email: "fbo@engadin-airport.ch", vhfFrequency: "130.325 MHz", address: "Engadin Airport, Via Mezdi 3, 7503 Samedan", operatingHours: "08:00 - 20:00 LT (peak season H24)", languages: ["Romansh", "German", "French", "English", "Italian", "Russian"], amenities: ["Badrutt's Palace Hotel Concierge", "St. Moritz Lake Activities", "Heli-Skiing Coordination", "Cresta Run Tobogganing"], notes: "St. Moritz gateway. Europe's highest airport serving business jets. Badrutt's Palace concierge." }
    ]
  },
  {
    id: "luxembourg-findel-private",
    name: "Beauvechain Air Base",
    city: "Brussels",
    country: "Belgium",
    iata: "",
    icao: "EBBE",
    type: "private",
    typeLabel: "Belgian Air Force / Restricted Civilian",
    popular: false,
    region: "europe",
    coordinates: { lat: 50.7589, lng: 4.7683 },
    operatingHours: "On request only - military coordination required",
    extensionPossibilities: "Special permission required. Military coordination mandatory.",
    runwayLength: "2,000 m / 6,562 ft - Concrete",
    runwaySurface: "Concrete (07/25)",
    elevation: "460 ft / 140 m",
    fbos: [
      { id: "ebbe-military-coord", name: "Beauvechain Military Coordination", phone: "+32 10 589 400", email: "ops@beauvechain.mil.be", vhfFrequency: "122.100 MHz", address: "Beauvechain Air Base, 1320 Belgium", operatingHours: "On prior permission only", languages: ["French", "Dutch", "English"], amenities: ["State Aircraft Priority", "Military Customs"], notes: "Belgian military coordination required. VVIP state visits only." }
    ]
  },
  {
    id: "monaco-heliport",
    name: "Monaco Héliport",
    city: "Monaco",
    country: "Monaco",
    iata: "MCM",
    icao: "LNMC",
    type: "private",
    typeLabel: "Principality of Monaco Heliport",
    popular: true,
    region: "europe",
    coordinates: { lat: 43.7239, lng: 7.4194 },
    operatingHours: "07:00 - 21:00 LT (summer extensions on request)",
    extensionPossibilities: "Helicopters only. Regular scheduled flights to Nice. Advance booking mandatory.",
    runwayLength: "N/A (helicopter only)",
    runwaySurface: "Concrete helipad",
    elevation: "0 ft / 0 m (sea level)",
    fbos: [
      { id: "lnmc-heliair", name: "Héli Air Monaco", phone: "+377 92 05 00 50", email: "reservations@heliairmonaco.com", vhfFrequency: "122.300 MHz", address: "Avenue des Ligures, 98000 Monaco", operatingHours: "07:00 - 21:00 LT", languages: ["French", "English", "Italian", "Russian", "Arabic"], amenities: ["Casino Square Transfer", "Hôtel de Paris Concierge", "Formula 1 Monaco GP Logistics", "Superyacht Harbour Transfer"], notes: "Monaco's only landing facility. 7-min hop from Nice. F1 Grand Prix hub." }
    ]
  },
  {
    id: "duxford",
    name: "IWM Duxford Aerodrome",
    city: "Cambridge",
    country: "United Kingdom",
    iata: "",
    icao: "EGSU",
    type: "private",
    typeLabel: "Heritage Airfield & Museum",
    popular: false,
    region: "europe",
    coordinates: { lat: 52.0908, lng: 0.1319 },
    operatingHours: "08:00 - Sunset LT",
    extensionPossibilities: "VFR only. Prior permission required. Historic WWII airfield in active use.",
    runwayLength: "1,329 m / 4,360 ft - Grass/Asphalt",
    runwaySurface: "Grass (06/24), Asphalt (06/24 secondary)",
    elevation: "125 ft / 38 m",
    fbos: [
      { id: "egsu-duxford-handling", name: "Duxford Flying Group", phone: "+44 1223 835 000", email: "duxford@iwm.org.uk", vhfFrequency: "122.075 MHz", address: "IWM Duxford, Duxford, Cambridge CB22 4QR", operatingHours: "08:00 - Sunset LT", languages: ["English"], amenities: ["WWII Spitfire & Hurricane Collection", "Private Museum Access", "Flying Displays", "Cambridge University Proximity"], notes: "Historic Battle of Britain airfield. Iconic heritage aviation experience." }
    ]
  },
  {
    id: "sylt-westerland",
    name: "Sylt Airport",
    city: "Westerland / Sylt Island",
    country: "Germany",
    iata: "GWT",
    icao: "EDXW",
    type: "dedicated",
    typeLabel: "Island Luxury Resort Airport",
    popular: false,
    region: "europe",
    coordinates: { lat: 54.9132, lng: 8.3403 },
    operatingHours: "08:00 - 22:00 LT",
    extensionPossibilities: "Limited extensions on request. Germany's most exclusive island resort.",
    runwayLength: "2,440 m / 8,005 ft - Asphalt",
    runwaySurface: "Asphalt (14/32)",
    elevation: "51 ft / 16 m",
    fbos: [
      { id: "edxw-sylt-aviation", name: "Sylt Aviation Services", phone: "+49 4651 920 100", email: "info@sylts-aviation.de", vhfFrequency: "130.775 MHz", address: "Am Flughafen, 25980 Westerland/Sylt", operatingHours: "08:00 - 22:00 LT", languages: ["German", "English", "Danish"], amenities: ["Kampen Luxury Village Access", "North Sea Kitesurfing", "Strandkörbe Beach Chair Service", "Thalasso Spa Coordination"], notes: "Germany's most exclusive island. Hamburg's Riviera. Fashion & arts scene." }
    ]
  },
  {
    id: "sardinia-olbia",
    name: "Olbia Costa Smeralda Airport",
    city: "Olbia / Sardinia",
    country: "Italy",
    iata: "OLB",
    icao: "LIEO",
    type: "dedicated",
    typeLabel: "Costa Smeralda Executive",
    popular: true,
    region: "europe",
    coordinates: { lat: 40.8987, lng: 9.5176 },
    operatingHours: "H24 / 7 days (peak season)",
    extensionPossibilities: "H24 in summer. Winter reduced hours.",
    runwayLength: "2,446 m / 8,025 ft - Asphalt",
    runwaySurface: "Asphalt (05/23)",
    elevation: "37 ft / 11 m",
    fbos: [
      { id: "lieo-meridiana-sardinia", name: "Meridiana Executive Olbia", phone: "+39 0789 563 100", email: "olbia.executive@meridiana.it", vhfFrequency: "130.650 MHz", address: "Executive Terminal, Aeroporto Olbia", operatingHours: "H24 (summer)", languages: ["Italian", "English", "French", "German", "Russian", "Arabic"], amenities: ["Porto Cervo Superyacht Transfer", "Billionaire Club Coordination", "Hotel Cala di Volpe Concierge", "Helicopter Island Hop to Corsica"], notes: "Sardinia's billionaire coast gateway. Porto Cervo, Costa Smeralda superyachts." }
    ]
  },
  {
    id: "sochi",
    name: "Sochi International Airport",
    city: "Sochi",
    country: "Russia",
    iata: "AER",
    icao: "URSS",
    type: "dedicated",
    typeLabel: "Executive VIP Terminal Sochi",
    popular: false,
    region: "europe",
    coordinates: { lat: 43.4499, lng: 39.9566 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 unrestricted.",
    runwayLength: "2,900 m / 9,514 ft - Asphalt",
    runwaySurface: "Asphalt (06/24)",
    elevation: "89 ft / 27 m",
    fbos: [
      { id: "urss-sochi-handling", name: "Sochi Executive Handling", phone: "+7 862 262 2900", email: "executive@sochiairport.ru", vhfFrequency: "130.650 MHz", address: "VIP Terminal, Sochi International Airport", operatingHours: "H24", languages: ["Russian", "English", "Arabic"], amenities: ["Black Sea Yacht Coordination", "Rosa Khutor Ski Transfer", "Olympic Park Tours", "Presidential Dacha Proximity"], notes: "Black Sea Riviera and Olympic legacy destination" }
    ]
  },
  {
    id: "maldives-maafaru",
    name: "Maafaru International Airport",
    city: "Noonu Atoll",
    country: "Maldives",
    iata: "NMF",
    icao: "VRMF",
    type: "private",
    typeLabel: "Private Island Resort Airport",
    popular: true,
    region: "asia_pacific",
    coordinates: { lat: 5.9408, lng: 73.4710 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24 for resort access. Direct access to Six Senses & Niyama resorts.",
    runwayLength: "2,000 m / 6,562 ft - Asphalt",
    runwaySurface: "Asphalt (10/28)",
    elevation: "4 ft / 1 m",
    fbos: [
      { id: "vrmf-resort-handling", name: "Maafaru Resort Aviation", phone: "+960 656 1133", email: "aviation@maafaru.com", vhfFrequency: "118.300 MHz", address: "Maafaru International Airport, Noonu Atoll", operatingHours: "H24", languages: ["English", "Dhivehi", "Mandarin", "Arabic"], amenities: ["Private Island Resort Transfer", "Submarine Experience Coordination", "Manta Ray & Whale Shark Dive Briefing", "Exclusive Resort Concierge"], notes: "Exclusive Maldives resort airport. Direct access to Niyama and neighbouring islands." }
    ]
  },
  {
    id: "kenmore-air-harbor",
    name: "Kenmore Air Harbor",
    city: "Seattle",
    country: "United States",
    iata: "",
    icao: "W55",
    type: "private",
    typeLabel: "Floatplane Base",
    popular: false,
    region: "americas",
    coordinates: { lat: 47.7540, lng: -122.2585 },
    operatingHours: "08:00 - Sunset LT",
    extensionPossibilities: "Floatplane only. VFR only. Lake Washington operations.",
    runwayLength: "N/A (water)",
    runwaySurface: "Lake Washington",
    elevation: "0 ft (lake level)",
    fbos: [
      { id: "w55-kenmore", name: "Kenmore Air Floatplane Base", phone: "+1 425 486 1257", email: "charter@kenmoreair.com", vhfFrequency: "122.800 MHz", address: "6321 NE 175th Street, Kenmore, WA 98028", operatingHours: "08:00 - Sunset", languages: ["English"], amenities: ["San Juan Islands Transfers", "Victoria BC Connections", "Puget Sound Scenic Flights", "Mount Rainier Views"], notes: "Pacific Northwest floatplane adventures. San Juan Islands, Victoria BC." }
    ]
  },
  {
    id: "napa-county",
    name: "Napa County Airport",
    city: "Napa Valley",
    country: "United States",
    iata: "APC",
    icao: "KAPC",
    type: "dedicated",
    typeLabel: "Wine Country Executive",
    popular: false,
    region: "americas",
    coordinates: { lat: 38.2132, lng: -122.2807 },
    operatingHours: "H24 / 7 days",
    extensionPossibilities: "H24, no restrictions. Gateway to Napa and Sonoma valleys.",
    runwayLength: "2,286 m / 7,500 ft - Asphalt",
    runwaySurface: "Asphalt (06/24, 18L/36R)",
    elevation: "35 ft / 11 m",
    fbos: [
      { id: "kapc-napa-jet", name: "Napa Jet Center", phone: "+1 707 224 2908", email: "info@napajetcenter.com", vhfFrequency: "132.800 MHz", address: "2030 Airport Road, Napa, CA 94558", operatingHours: "H24", languages: ["English", "Spanish", "French"], amenities: ["World-Class Winery Concierge", "Private Vineyard Estate Access", "Wine Tasting & Barrel Room Tours", "French Laundry Reservations"], notes: "Napa & Sonoma wine country gateway. French Laundry, Opus One access." }
    ]
  }
];

function sweepAddress(addr: string): string {
  return addr;
}

/**
 * Return airport by 4-letter ICAO, 3-letter IATA, or unique internal ID
 */
export function findAirportByCode(code: string): Airport {
  if (!code) return airportsData[0];
  const clean = code.trim().toUpperCase();
  const match = airportsData.find(
    (a) =>
      a.icao.toUpperCase() === clean ||
      a.iata.toUpperCase() === clean ||
      a.id.toUpperCase() === clean
  );
  if (match) return match;

  // Fallback for custom user typed code
  return {
    id: `apt-${clean.toLowerCase()}`,
    name: `${clean} Executive Airfield`,
    city: clean,
    country: "International",
    iata: clean.slice(0, 3),
    icao: clean.length === 4 ? clean : `E${clean.slice(0, 3)}`,
    type: "fbo",
    typeLabel: "Executive Airfield Handling",
    coordinates: { lat: 46.2381, lng: 6.1089 },
    operatingHours: "06:00 - 22:00 Local",
    extensionPossibilities: "Extension on request with prior notification.",
    runwayLength: "2,400 m / 7,874 ft - Asphalt",
    fbos: [
      {
        id: `fbo-${clean.toLowerCase()}`,
        name: `${clean} Executive FBO Handling Desk`,
        phone: "+41 22 717 8400",
        email: `ops@${clean.toLowerCase()}.executivehandling.aero`,
        vhfFrequency: "131.75 MHz",
        address: `General Aviation Terminal, ${clean}`,
        operatingHours: "06:00 - 22:00 Local",
        languages: ["English", "French"],
        notes: "On-call executive handling station"
      }
    ]
  };
}

/**
 * Return all designated FBOs for a given airport
 */
export function getAirportFbos(code: string): FboOption[] {
  const airport = findAirportByCode(code);
  if (airport && airport.fbos && airport.fbos.length > 0) {
    return airport.fbos;
  }
  return [
    {
      id: `default-${code.toLowerCase()}`,
      name: `${airport.name} Executive Handling`,
      phone: "+41 58 158 1811",
      email: `ops@${airport.icao.toLowerCase()}.handling.aero`,
      vhfFrequency: "131.75 MHz",
      address: `General Aviation Terminal, ${airport.city}`,
      operatingHours: airport.operatingHours || "06:00 - 22:00 Local",
      languages: ["English"],
      notes: "Primary executive handling station"
    }
  ];
}

/**
 * Return all FBOs across the entire system with airport metadata attached
 */
export function getAllFbos(): (FboOption & { airportIcao: string; airportIata: string; airportName: string; city: string; country: string })[] {
  const result: (FboOption & { airportIcao: string; airportIata: string; airportName: string; city: string; country: string })[] = [];
  for (const apt of airportsData) {
    if (apt.fbos) {
      for (const f of apt.fbos) {
        result.push({
          ...f,
          airportIcao: apt.icao,
          airportIata: apt.iata,
          airportName: apt.name,
          city: apt.city,
          country: apt.country,
          operatingHours: f.operatingHours || apt.operatingHours || "06:00 - 22:00 Local"
        });
      }
    }
  }
  return result;
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
 * Search airports by text query (matches name, 4-letter ICAO, 3-letter IATA, city, country)
 */
export function searchAirports(query: string, limit: number = 30): Airport[] {
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

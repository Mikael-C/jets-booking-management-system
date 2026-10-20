import { Booking, OperatorDetails } from "@/types/aviation";
import { findAirportByCode } from "./airports";
import { getAircraftById } from "./fleet";

export const defaultOperator: OperatorDetails = {
  companyName: "Orbelo GmbH",
  legalEntity: "Orbelo Private Aviation & Charter Services GmbH",
  representativeName: "Ezeokeke, Obiefuna",
  supportEmail: "customercare@orbelo.com",
  supportPhone: "+43 7221 727 400",
  vatNumber: "ATU 6335 7619",
  additionalVatNumbers: [
    "IT00268829991",
    "DE286551690",
    "GB303612155",
    "FR66830821799",
    "NL823480926B01",
    "NO382321H"
  ],
  bankName: "Raiffeisenlandesbank Oberösterreich AG",
  iban: "AT32 3400 0000 0266 7483",
  bic: "RZOOAT2LXXX",
  accountHolder: "Orbelo GmbH",
  commercialRegistry: "Handelsgericht Linz • FN293097a",
  courtOfJurisdiction: "Austrian law & Linz court applicable"
};

export const initialBookings: Booking[] = [
  {
    id: "booking-peu842",
    tripNumber: "PEU842-001",
    invoiceNumber: "00106020",
    accountNumber: "2{21737}",
    contractDate: "01.10.2026",
    quoteExpirationDate: "02.10.2026, 19:53z",
    paymentDueDate: "03.10.2026",
    status: "confirmed",
    tripType: "round_trip",
    aircraft: {
      ...getAircraftById("cessna-citation-mustang"),
      registration: "OE-FFB",
      yearOfManufacture: "2008 - 2010"
    },
    client: {
      fullName: "Edward Brinkmann",
      companyName: "Brinkmann Global Capital",
      streetAddress: "3606 Enterprise Ave",
      cityPostalCountry: "FL-34104 Naples, United States",
      phone: "+1 239 555 0192",
      email: "ebrinkmann@bgcapital.com",
      vatNumber: "US-8492041"
    },
    operator: defaultOperator,
    legs: [
      {
        legNumber: 1,
        flightDate: "2026-10-03",
        origin: findAirportByCode("LSGG"),
        destination: findAirportByCode("LIMJ"),
        departureTimeLocal: "11:20 h",
        arrivalTimeLocal: "12:02 h",
        flightTimeFormatted: "0h 42m",
        paxCount: 2,
        flightNumber: "GAC842U",
        aircraftRegistration: "OE-FFB",
        distanceNm: 155,
        crew: [
          { role: "CMDR", name: "Audrain, Emmanuel", phone: "+43 664 8489 904" },
          { role: "F/O", name: "El Hassani Amrani, Hajar", phone: "+43 664 8489 928" }
        ],
        passengers: [
          { id: "p1", fullName: "Edward Brinkmann", isLeadPassenger: true, passportNumber: "P99201482", nationality: "USA" },
          { id: "p2", fullName: "Aysel Nail Qizi Aliyeva", passportNumber: "AZ8819201", nationality: "AZE" }
        ],
        departureHandling: {
          name: "Jet Aviation",
          airportCode: "LSGG",
          phone: "+41 58 158 1811",
          email: "gvafbo@jetaviation.com"
        },
        arrivalHandling: {
          name: "Ags Ops",
          airportCode: "LIMJ",
          phone: "+39 010 601 5412",
          email: "dutymanager@airport.genova.it"
        }
      },
      {
        legNumber: 2,
        flightDate: "2026-10-06",
        origin: findAirportByCode("LIMJ"),
        destination: findAirportByCode("LSGG"),
        departureTimeLocal: "15:00 h",
        arrivalTimeLocal: "15:51 h",
        flightTimeFormatted: "0h 51m",
        paxCount: 2,
        flightNumber: "GAC842V",
        aircraftRegistration: "OE-FDT",
        distanceNm: 155,
        crew: [
          { role: "CMDR", name: "Buchegger, Walter", phone: "+43 664 887 14 555" },
          { role: "F/O", name: "Franklin BONNIVEAU", phone: "+43 664 772 10 991" }
        ],
        passengers: [
          { id: "p1", fullName: "Edward Brinkmann", isLeadPassenger: true, passportNumber: "P99201482", nationality: "USA" },
          { id: "p2", fullName: "Aysel Nail Qizi Aliyeva", passportNumber: "AZ8819201", nationality: "AZE" }
        ],
        departureHandling: {
          name: "Ags Ops",
          airportCode: "LIMJ",
          phone: "+39 010 601 5412",
          email: "dutymanager@airport.genova.it"
        },
        arrivalHandling: {
          name: "Jet Aviation",
          airportCode: "LSGG",
          phone: "+41 58 158 1811",
          email: "gvafbo@jetaviation.com"
        }
      }
    ],
    pricing: {
      flightPrice: 11500,
      airportFees: 1140,
      passengerFees: 80,
      dayOfWeekDiscount: -250,
      inboundPassengerTax: 200,
      outboundPassengerTax: 200,
      additionalServicesTotal: 0,
      subtotal: 12870,
      vatRate: 0,
      vatAmount: 0,
      totalFlightPrice: 12870,
      currency: "EUR"
    },
    services: {
      limousineService: false,
      luxuryCarRental: false,
      helicopterService: false,
      vipCateringDetails: "Taittinger Champagne and premium artisan canapés requested",
      deicingInsurance: "none",
      deicingCostPerLeg: 0,
      carbonOffset: "neutral",
      carbonOffsetRatePerHour: 33,
      customRequests: "High-speed Wi-Fi active throughout"
    },
    checklist: [
      { id: "c1", label: "Aircraft Maintenance Release & Airworthiness Signoff", category: "aircraft", isCompleted: true, completedAt: "02.10.2026 09:30", completedBy: "Chief Inspector", requiredForDispatch: true },
      { id: "c2", label: "Overflight & Landing Slots / PPR Confirmed", category: "permits", isCompleted: true, completedAt: "02.10.2026 11:15", completedBy: "Eurocontrol Dispatch", requiredForDispatch: true },
      { id: "c3", label: "Crew Assignment & FTL Legality Confirmed", category: "crew", isCompleted: true, completedAt: "02.10.2026 12:00", completedBy: "Crew Ops", requiredForDispatch: true },
      { id: "c4", label: "Departure FBO Handling Confirmed (Jet Aviation LSGG)", category: "ground", isCompleted: true, completedAt: "02.10.2026 13:40", completedBy: "Ground Ops", requiredForDispatch: true },
      { id: "c5", label: "Arrival FBO Handling Confirmed (Ags Ops LIMJ)", category: "ground", isCompleted: true, completedAt: "02.10.2026 13:42", completedBy: "Ground Ops", requiredForDispatch: true },
      { id: "c6", label: "Passenger Passport & APIS Data Validated", category: "passengers", isCompleted: true, completedAt: "02.10.2026 14:10", completedBy: "Security Officer", requiredForDispatch: true },
      { id: "c7", label: "VIP Catering Ordered & Confirmed", category: "ground", isCompleted: true, completedAt: "02.10.2026 15:00", completedBy: "Concierge", requiredForDispatch: false },
      { id: "c8", label: "De-icing Status Evaluated (Clear VFR/IFR)", category: "safety", isCompleted: true, completedAt: "02.10.2026 16:30", completedBy: "CMDR Audrain", requiredForDispatch: true },
      { id: "c9", label: "Flight Brief Issued & Sent to Crew", category: "crew", isCompleted: true, completedAt: "02.10.2026 17:00", completedBy: "Dispatch", requiredForDispatch: true },
      { id: "c10", label: "Escrow Payment Received / Invoice Cleared", category: "finance", isCompleted: true, completedAt: "02.10.2026 17:45", completedBy: "Finance Dept", requiredForDispatch: true }
    ],
    agentName: "Ezeokeke, Obiefuna",
    agentEmail: "customercare@orbelo.com",
    commissionPercentage: 8,
    createdAt: "2026-10-01T10:00:00Z",
    updatedAt: "2026-10-02T18:00:00Z"
  },
  {
    id: "booking-zfl433",
    tripNumber: "ZFL433",
    invoiceNumber: "00105892",
    accountNumber: "284169",
    contractDate: "30.06.2026",
    quoteExpirationDate: "01.07.2026, 18:00z",
    paymentDueDate: "02.07.2026",
    status: "dispatched",
    tripType: "round_trip",
    aircraft: {
      ...getAircraftById("embraer-phenom-100"),
      registration: "F-HSBL",
      yearOfManufacture: 2015
    },
    client: {
      fullName: "Luca Cesare Armando Ceretti",
      companyName: "Somaco SAM",
      streetAddress: "5, av. Princesse Grace",
      cityPostalCountry: "MC-98000 Monaco, Monaco",
      phone: "+377 93 25 10 20",
      email: "ceretti@somaco-mc.com",
      vatNumber: "FR 48 300 291 002"
    },
    operator: defaultOperator,
    legs: [
      {
        legNumber: 1,
        flightDate: "2026-07-03",
        origin: findAirportByCode("LFMN"),
        destination: findAirportByCode("LSZR"),
        departureTimeLocal: "08:00",
        arrivalTimeLocal: "09:15",
        flightTimeFormatted: "1h 15m",
        paxCount: 2,
        flightNumber: "PEA501",
        aircraftRegistration: "F-HSBL",
        distanceNm: 275,
        crew: [
          { role: "CMDR", name: "Steffen AZAM", phone: "+33 6 61 39 47 63" },
          { role: "F/O", name: "Franklin BONNIVEAU", phone: "+33 6 92 14 00 22" }
        ],
        passengers: [
          { id: "p1", fullName: "Luca Cesare Armando Ceretti", isLeadPassenger: true, passportNumber: "IT-992140A", nationality: "ITA" },
          { id: "p2", fullName: "Marc Edouard Dwek", passportNumber: "FR-4821033", nationality: "FRA" }
        ],
        departureHandling: {
          name: "Aviavip LFMN",
          airportCode: "LFMN",
          phone: "+33 493 213737",
          email: "nce.executive@aviapartner.aero"
        },
        arrivalHandling: {
          name: "Airport Altenrhein LSZR",
          airportCode: "LSZR",
          phone: "+41 71 858 5165",
          email: "c-office@peoples.ch"
        }
      },
      {
        legNumber: 2,
        flightDate: "2026-07-03",
        origin: findAirportByCode("LSZR"),
        destination: findAirportByCode("LFMN"),
        departureTimeLocal: "16:00",
        arrivalTimeLocal: "17:15",
        flightTimeFormatted: "1h 15m",
        paxCount: 2,
        flightNumber: "PEA501",
        aircraftRegistration: "F-HSBL",
        distanceNm: 275,
        crew: [
          { role: "CMDR", name: "Steffen AZAM", phone: "+33 6 61 39 47 63" },
          { role: "F/O", name: "Franklin BONNIVEAU", phone: "+33 6 92 14 00 22" }
        ],
        passengers: [
          { id: "p1", fullName: "Luca Cesare Armando Ceretti", isLeadPassenger: true, passportNumber: "IT-992140A", nationality: "ITA" },
          { id: "p2", fullName: "Marc Edouard Dwek", passportNumber: "FR-4821033", nationality: "FRA" }
        ],
        departureHandling: {
          name: "Airport Altenrhein LSZR",
          airportCode: "LSZR",
          phone: "+41 71 858 5165",
          email: "c-office@peoples.ch"
        },
        arrivalHandling: {
          name: "Aviavip LFMN",
          airportCode: "LFMN",
          phone: "+33 493 213737",
          email: "nce.executive@aviapartner.aero"
        }
      }
    ],
    pricing: {
      flightPrice: 8900,
      airportFees: 950,
      passengerFees: 60,
      dayOfWeekDiscount: 0,
      inboundPassengerTax: 120,
      outboundPassengerTax: 120,
      additionalServicesTotal: 0,
      subtotal: 10150,
      vatRate: 0,
      vatAmount: 0,
      totalFlightPrice: 10150,
      currency: "EUR"
    },
    services: {
      limousineService: true,
      luxuryCarRental: false,
      helicopterService: false,
      vipCateringDetails: "Chilled Bollinger & French patisserie selection on departure",
      deicingInsurance: "none",
      deicingCostPerLeg: 0,
      carbonOffset: "positive",
      carbonOffsetRatePerHour: 50,
      customRequests: "Ramp-side VIP Mercedes Maybach transfer at Nice Côte d'Azur"
    },
    checklist: [
      { id: "c1", label: "Aircraft Maintenance Release & Airworthiness Signoff", category: "aircraft", isCompleted: true, completedAt: "01.07.2026 08:30", completedBy: "GlobeAir Tech", requiredForDispatch: true },
      { id: "c2", label: "Overflight & Landing Slots / PPR Confirmed", category: "permits", isCompleted: true, completedAt: "01.07.2026 10:15", completedBy: "Flight Dispatch", requiredForDispatch: true },
      { id: "c3", label: "Crew Assignment & FTL Legality Confirmed", category: "crew", isCompleted: true, completedAt: "01.07.2026 11:00", completedBy: "Crew Ops", requiredForDispatch: true },
      { id: "c4", label: "Departure FBO Handling Confirmed (Aviavip)", category: "ground", isCompleted: true, completedAt: "01.07.2026 11:30", completedBy: "Ground Ops", requiredForDispatch: true },
      { id: "c5", label: "Arrival FBO Handling Confirmed (Altenrhein)", category: "ground", isCompleted: true, completedAt: "01.07.2026 11:35", completedBy: "Ground Ops", requiredForDispatch: true },
      { id: "c6", label: "Passenger Passport & APIS Data Validated", category: "passengers", isCompleted: true, completedAt: "01.07.2026 14:00", completedBy: "Customs Ops", requiredForDispatch: true },
      { id: "c7", label: "VIP Catering Ordered & Confirmed", category: "ground", isCompleted: true, completedAt: "01.07.2026 15:20", completedBy: "VIP Service", requiredForDispatch: false },
      { id: "c8", label: "De-icing Status Evaluated (Clear VFR/IFR)", category: "safety", isCompleted: true, completedAt: "01.07.2026 16:00", completedBy: "CMDR Azam", requiredForDispatch: true },
      { id: "c9", label: "Flight Brief Issued & Sent to Crew", category: "crew", isCompleted: true, completedAt: "01.07.2026 17:15", completedBy: "Flight Dispatch", requiredForDispatch: true },
      { id: "c10", label: "Escrow Payment Received / Invoice Cleared", category: "finance", isCompleted: true, completedAt: "01.07.2026 18:00", completedBy: "Finance", requiredForDispatch: true }
    ],
    agentName: "Ezeokeke, Obiefuna",
    agentEmail: "customercare@orbelo.com",
    commissionPercentage: 10,
    createdAt: "2026-06-30T11:00:00Z",
    updatedAt: "2026-07-01T18:00:00Z"
  },
  {
    id: "booking-orb914",
    tripNumber: "ORB-914",
    invoiceNumber: "00106045",
    accountNumber: "492019",
    contractDate: "10.10.2026",
    quoteExpirationDate: "12.10.2026, 12:00z",
    paymentDueDate: "14.10.2026",
    status: "confirmed",
    tripType: "one_way",
    aircraft: {
      ...getAircraftById("citation-cj3-plus"),
      registration: "G-ORBL",
      yearOfManufacture: 2021
    },
    client: {
      fullName: "Sir Richard H. Kensington",
      companyName: "Kensington Maritime Holdings",
      streetAddress: "14 Berkeley Square, Mayfair",
      cityPostalCountry: "W1J 6BQ London, United Kingdom",
      phone: "+44 20 7946 0912",
      email: "r.kensington@kensingtonholdings.co.uk",
      vatNumber: "GB 928 4102 33"
    },
    operator: defaultOperator,
    legs: [
      {
        legNumber: 1,
        flightDate: "2026-10-22",
        origin: findAirportByCode("EGLF"),
        destination: findAirportByCode("LFPB"),
        departureTimeLocal: "10:30 h",
        arrivalTimeLocal: "12:45 h",
        flightTimeFormatted: "1h 15m",
        paxCount: 4,
        flightNumber: "ORB914A",
        aircraftRegistration: "G-ORBL",
        distanceNm: 215,
        crew: [
          { role: "CMDR", name: "Capt. Alistair Vance", phone: "+44 7700 900481" },
          { role: "F/O", name: "David Sterling", phone: "+44 7700 900512" }
        ],
        passengers: [
          { id: "p1", fullName: "Sir Richard H. Kensington", isLeadPassenger: true, passportNumber: "UK-55829102", nationality: "GBR" },
          { id: "p2", fullName: "Lady Catherine Kensington", passportNumber: "UK-55829103", nationality: "GBR" },
          { id: "p3", fullName: "Julian Vance-Moreau", passportNumber: "UK-10924018", nationality: "GBR" },
          { id: "p4", fullName: "Eleanor Vance-Moreau", passportNumber: "UK-10924019", nationality: "GBR" }
        ],
        departureHandling: {
          name: "TAG Farnborough Aviation FBO",
          airportCode: "EGLF",
          phone: "+44 1252 379000",
          email: "fbo@tagfarnborough.com"
        },
        arrivalHandling: {
          name: "Signature Flight Support LFPB",
          airportCode: "LFPB",
          phone: "+33 1 49 92 75 00",
          email: "lbg@signatureflight.fr"
        }
      }
    ],
    pricing: {
      flightPrice: 9500,
      airportFees: 1250,
      passengerFees: 160,
      dayOfWeekDiscount: 0,
      inboundPassengerTax: 240,
      outboundPassengerTax: 240,
      additionalServicesTotal: 800,
      subtotal: 12190,
      vatRate: 0,
      vatAmount: 0,
      totalFlightPrice: 12190,
      currency: "EUR"
    },
    services: {
      limousineService: true,
      luxuryCarRental: false,
      helicopterService: false,
      vipCateringDetails: "Beluga caviar service with blinis and Krug Champagne",
      deicingInsurance: "at_reservation",
      deicingCostPerLeg: 400,
      carbonOffset: "double_neutral",
      carbonOffsetRatePerHour: 66,
      customRequests: "Chauffeur S-Class waiting at aircraft steps in Paris Le Bourget"
    },
    checklist: [
      { id: "c1", label: "Aircraft Maintenance Release & Airworthiness Signoff", category: "aircraft", isCompleted: true, completedAt: "11.10.2026 10:00", completedBy: "TAG Maintenance", requiredForDispatch: true },
      { id: "c2", label: "Overflight & Landing Slots / PPR Confirmed", category: "permits", isCompleted: true, completedAt: "11.10.2026 12:00", completedBy: "Dispatch", requiredForDispatch: true },
      { id: "c3", label: "Crew Assignment & FTL Legality Confirmed", category: "crew", isCompleted: true, completedAt: "11.10.2026 14:00", completedBy: "Crew Rostering", requiredForDispatch: true },
      { id: "c4", label: "Departure FBO Handling Confirmed (TAG Farnborough)", category: "ground", isCompleted: true, completedAt: "11.10.2026 14:30", completedBy: "Ops", requiredForDispatch: true },
      { id: "c5", label: "Arrival FBO Handling Confirmed (Signature LBG)", category: "ground", isCompleted: true, completedAt: "11.10.2026 14:35", completedBy: "Ops", requiredForDispatch: true },
      { id: "c6", label: "Passenger Passport & APIS Data Validated", category: "passengers", isCompleted: true, completedAt: "11.10.2026 16:00", completedBy: "Border Force Ops", requiredForDispatch: true },
      { id: "c7", label: "VIP Catering Ordered & Confirmed", category: "ground", isCompleted: true, completedAt: "11.10.2026 16:45", completedBy: "VIP Catering", requiredForDispatch: false },
      { id: "c8", label: "De-icing Status Evaluated (Clear VFR/IFR)", category: "safety", isCompleted: false, notes: "Awaiting morning METAR/TAF on 22nd", requiredForDispatch: true },
      { id: "c9", label: "Flight Brief Issued & Sent to Crew", category: "crew", isCompleted: false, requiredForDispatch: true },
      { id: "c10", label: "Escrow Payment Received / Invoice Cleared", category: "finance", isCompleted: true, completedAt: "12.10.2026 09:30", completedBy: "Finance", requiredForDispatch: true }
    ],
    agentName: "Sarah Jenkins",
    agentEmail: "s.jenkins@orbelo.com",
    commissionPercentage: 7.5,
    createdAt: "2026-10-10T09:00:00Z",
    updatedAt: "2026-10-12T09:30:00Z"
  },
  {
    id: "booking-orb582",
    tripNumber: "ORB-582",
    invoiceNumber: "00106098",
    accountNumber: "882014",
    contractDate: "16.10.2026",
    quoteExpirationDate: "19.10.2026, 17:00z",
    paymentDueDate: "20.10.2026",
    status: "client_review",
    tripType: "one_way",
    aircraft: {
      ...getAircraftById("challenger-350"),
      registration: "9H-VJB",
      yearOfManufacture: 2020
    },
    client: {
      fullName: "Matteo Rossi",
      companyName: "Milano Finanza Partners",
      streetAddress: "Via Montenapoleone 18",
      cityPostalCountry: "20121 Milano, Italy",
      phone: "+39 02 8920 1928",
      email: "m.rossi@milanofinanza.it",
      vatNumber: "IT 084920199"
    },
    operator: defaultOperator,
    legs: [
      {
        legNumber: 1,
        flightDate: "2026-10-25",
        origin: findAirportByCode("LEIB"),
        destination: findAirportByCode("LIML"),
        departureTimeLocal: "18:00 h",
        arrivalTimeLocal: "19:40 h",
        flightTimeFormatted: "1h 40m",
        paxCount: 6,
        flightNumber: "ORB582C",
        aircraftRegistration: "9H-VJB",
        distanceNm: 520,
        crew: [
          { role: "CMDR", name: "Capt. Marco Bellini", phone: "+39 348 991 2004" },
          { role: "F/O", name: "Giulia Rossi", phone: "+39 348 991 2005" }
        ],
        passengers: [
          { id: "p1", fullName: "Matteo Rossi", isLeadPassenger: true, passportNumber: "YA882910", nationality: "ITA" },
          { id: "p2", fullName: "Francesca Moretti", passportNumber: "YA882911", nationality: "ITA" }
        ],
        departureHandling: {
          name: "Ibiza Executive FBO",
          airportCode: "LEIB",
          phone: "+34 971 809 100",
          email: "ibiza@executivefbo.es"
        },
        arrivalHandling: {
          name: "Milano Prime FBO",
          airportCode: "LIML",
          phone: "+39 02 7486 2100",
          email: "ops@milanoprime.it"
        }
      }
    ],
    pricing: {
      flightPrice: 17200,
      airportFees: 1800,
      passengerFees: 240,
      dayOfWeekDiscount: -500,
      inboundPassengerTax: 300,
      outboundPassengerTax: 300,
      additionalServicesTotal: 0,
      subtotal: 19340,
      vatRate: 0,
      vatAmount: 0,
      totalFlightPrice: 19340,
      currency: "EUR"
    },
    services: {
      limousineService: false,
      luxuryCarRental: false,
      helicopterService: false,
      vipCateringDetails: "Italian antipasti, vintage Chianti Classico, and organic fruit platter",
      deicingInsurance: "none",
      deicingCostPerLeg: 0,
      carbonOffset: "neutral",
      carbonOffsetRatePerHour: 33,
      customRequests: "Direct tarmac luggage transfer"
    },
    checklist: [
      { id: "c1", label: "Aircraft Maintenance Release & Airworthiness Signoff", category: "aircraft", isCompleted: true, completedAt: "16.10.2026 14:00", completedBy: "Ops", requiredForDispatch: true },
      { id: "c2", label: "Overflight & Landing Slots / PPR Confirmed", category: "permits", isCompleted: false, notes: "Requested slot at Milan Linate", requiredForDispatch: true },
      { id: "c3", label: "Crew Assignment & FTL Legality Confirmed", category: "crew", isCompleted: true, completedAt: "16.10.2026 15:30", completedBy: "Roster", requiredForDispatch: true },
      { id: "c4", label: "Departure FBO Handling Confirmed (Ibiza)", category: "ground", isCompleted: false, requiredForDispatch: true },
      { id: "c5", label: "Arrival FBO Handling Confirmed (Milano Prime)", category: "ground", isCompleted: false, requiredForDispatch: true },
      { id: "c6", label: "Passenger Passport & APIS Data Validated", category: "passengers", isCompleted: false, requiredForDispatch: true },
      { id: "c7", label: "VIP Catering Ordered & Confirmed", category: "ground", isCompleted: false, requiredForDispatch: false },
      { id: "c8", label: "De-icing Status Evaluated", category: "safety", isCompleted: false, requiredForDispatch: true },
      { id: "c9", label: "Flight Brief Issued & Sent to Crew", category: "crew", isCompleted: false, requiredForDispatch: true },
      { id: "c10", label: "Escrow Payment Received / Invoice Cleared", category: "finance", isCompleted: false, notes: "Awaiting client contract signature", requiredForDispatch: true }
    ],
    agentName: "Ezeokeke, Obiefuna",
    agentEmail: "customercare@orbelo.com",
    commissionPercentage: 10,
    createdAt: "2026-10-16T12:00:00Z",
    updatedAt: "2026-10-16T16:00:00Z"
  },
  {
    id: "booking-orb309",
    tripNumber: "ORB-309",
    invoiceNumber: "00106110",
    accountNumber: "310492",
    contractDate: "17.10.2026",
    quoteExpirationDate: "19.10.2026, 20:00z",
    paymentDueDate: "21.10.2026",
    status: "quote_sent",
    tripType: "one_way",
    aircraft: {
      ...getAircraftById("embraer-phenom-100"),
      registration: "OE-FDT",
      yearOfManufacture: 2019
    },
    client: {
      fullName: "Hélène de Beaumarchais",
      companyName: "Fondation L'Art Vivant",
      streetAddress: "Bahnhofstrasse 45",
      cityPostalCountry: "8001 Zurich, Switzerland",
      phone: "+41 44 210 9988",
      email: "h.beaumarchais@fondationart.ch",
      vatNumber: "CHE-109.482.910"
    },
    operator: defaultOperator,
    legs: [
      {
        legNumber: 1,
        flightDate: "2026-10-28",
        origin: findAirportByCode("LSZH"),
        destination: findAirportByCode("LFMD"),
        departureTimeLocal: "14:00 h",
        arrivalTimeLocal: "15:10 h",
        flightTimeFormatted: "1h 10m",
        paxCount: 3,
        flightNumber: "ORB309Z",
        aircraftRegistration: "OE-FDT",
        distanceNm: 240,
        crew: [
          { role: "CMDR", name: "Capt. Philippe Laurent", phone: "+33 6 44 19 88 02" },
          { role: "F/O", name: "Claire Dupont", phone: "+33 6 44 19 88 03" }
        ],
        passengers: [
          { id: "p1", fullName: "Hélène de Beaumarchais", isLeadPassenger: true, passportNumber: "CH-882190", nationality: "CHE" }
        ],
        departureHandling: {
          name: "ExecuJet Zurich FBO",
          airportCode: "LSZH",
          phone: "+41 44 876 5656",
          email: "handling.zurich@execujet.com"
        },
        arrivalHandling: {
          name: "Cannes Mandelieu FBO",
          airportCode: "LFMD",
          phone: "+33 4 93 90 40 40",
          email: "aeroport.cannes@cote-azur.aeroport.fr"
        }
      }
    ],
    pricing: {
      flightPrice: 7200,
      airportFees: 850,
      passengerFees: 60,
      dayOfWeekDiscount: 0,
      inboundPassengerTax: 100,
      outboundPassengerTax: 100,
      additionalServicesTotal: 0,
      subtotal: 8310,
      vatRate: 0,
      vatAmount: 0,
      totalFlightPrice: 8310,
      currency: "EUR"
    },
    services: {
      limousineService: false,
      luxuryCarRental: false,
      helicopterService: false,
      vipCateringDetails: "Swiss organic chocolate selection, sparkling San Pellegrino",
      deicingInsurance: "none",
      deicingCostPerLeg: 0,
      carbonOffset: "neutral",
      carbonOffsetRatePerHour: 33
    },
    checklist: [
      { id: "c1", label: "Aircraft Maintenance Release & Airworthiness Signoff", category: "aircraft", isCompleted: true, completedAt: "17.10.2026 10:00", completedBy: "ExecuJet Tech", requiredForDispatch: true },
      { id: "c2", label: "Overflight & Landing Slots / PPR Confirmed", category: "permits", isCompleted: false, requiredForDispatch: true },
      { id: "c3", label: "Crew Assignment & FTL Legality Confirmed", category: "crew", isCompleted: true, completedAt: "17.10.2026 11:30", completedBy: "Crew Ops", requiredForDispatch: true },
      { id: "c4", label: "Departure FBO Handling Confirmed (ExecuJet)", category: "ground", isCompleted: false, requiredForDispatch: true },
      { id: "c5", label: "Arrival FBO Handling Confirmed (Cannes)", category: "ground", isCompleted: false, requiredForDispatch: true },
      { id: "c6", label: "Passenger Passport & APIS Data Validated", category: "passengers", isCompleted: false, requiredForDispatch: true },
      { id: "c7", label: "VIP Catering Ordered & Confirmed", category: "ground", isCompleted: false, requiredForDispatch: false },
      { id: "c8", label: "De-icing Status Evaluated", category: "safety", isCompleted: false, requiredForDispatch: true },
      { id: "c9", label: "Flight Brief Issued & Sent to Crew", category: "crew", isCompleted: false, requiredForDispatch: true },
      { id: "c10", label: "Escrow Payment Received / Invoice Cleared", category: "finance", isCompleted: false, requiredForDispatch: true }
    ],
    agentName: "Ezeokeke, Obiefuna",
    agentEmail: "customercare@orbelo.com",
    commissionPercentage: 10,
    createdAt: "2026-10-17T09:30:00Z",
    updatedAt: "2026-10-17T11:00:00Z"
  }
];

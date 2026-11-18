import { AccountRecord } from "@/types/aviation";

export const initialAccounts: AccountRecord[] = [
  {
    id: "acc-adeyemi",
    accountNumber: "ACC-30412",
    accountType: "entity",
    name: "Adeyemi Holdings Ltd",
    legalName: "Adeyemi Holdings Ltd",
    country: "Nigeria",
    agentName: "M. Vance",
    email: "office@adeyemi-holdings.ng",
    phone: "+234 1 270 0000",
    billingAddress: "14 Bourdillon Road, Ikoyi, Lagos, Nigeria",
    sendDocumentsTo: "office@adeyemi-holdings.ng (secretary)",
    vatTaxNumber: "",
    isAgent: false,
    preferredContactName: "Tunde Adeyemi",
    preferredContactEmail: "t.adeyemi@adeyemi-holdings.ng",
    preferredContactPhone: "+234 802 111 2222",
    autoCommunicationsEnabled: true,
    totalBookings: 6,
    totalSpend: 150250,
    invoicedAmount: 150250,
    receivedAmount: 8000,
    openBalance: 142250,
    preferencesList: [
      "Morning departures",
      "Travels with dog (Toby)",
      "No alcohol on board"
    ],
    lifetimeTrips: 6,
    lifetimeSince: "Mar 2026",
    conversionRate: 60,
    vipTier: "Ultra HNWI",
    notes: "Key corporate executive account. Regularly charters Lagos - London and Mediterranean routes.",
    authorizedPersons: [
      {
        id: "auth-adeyemi-1",
        fullName: "Tunde Adeyemi",
        roleTitle: "Chairman · default",
        isPrimaryAccountName: true,
        email: "t.adeyemi@adeyemi-holdings.ng",
        phone: "+234 802 111 2222",
        idDocumentType: "passport",
        contactId: "cnt-tunde-adeyemi",
        hasPassport: true,
        passportDetails: {
          passportNumber: "A10849201",
          issuingCountry: "Nigeria",
          placeOfBirth: "Lagos, Nigeria",
          dateOfBirth: "1972-05-14",
          expirationDate: "2031-06-20",
          issueDate: "2021-06-21"
        }
      },
      {
        id: "auth-adeyemi-2",
        fullName: "Ngozi Eze",
        roleTitle: "Office manager",
        isPrimaryAccountName: false,
        email: "office@adeyemi-holdings.ng",
        phone: "+234 803 000 0000",
        idDocumentType: "passport",
        contactId: "cnt-ngozi-eze",
        hasPassport: false
      }
    ],
    recentTrips: [
      {
        tripId: "WS0193-001",
        flightDate: "19 Dec",
        route: "EGLF → DNMM",
        stage: "Booked",
        value: 142000
      },
      {
        tripId: "FE4578-005",
        flightDate: "20 Nov",
        route: "LEIB → LSGG",
        stage: "Paid",
        value: 8250
      }
    ],
    createdAt: "2026-03-01"
  },
  {
    id: "acc-bello",
    accountNumber: "ACC-30877",
    accountType: "entity",
    name: "Bello Group Ltd",
    legalName: "Bello Group Ltd",
    country: "Nigeria",
    agentName: "Camille Laurent",
    email: "i.bello@bellogroup.com",
    phone: "+234 802 333 4444",
    billingAddress: "Victoria Island, Lagos, Nigeria",
    sendDocumentsTo: "i.bello@bellogroup.com",
    vatTaxNumber: "NG 3087 7210",
    isAgent: false,
    preferredContactName: "Ifeoma Bello",
    preferredContactEmail: "i.bello@bellogroup.com",
    preferredContactPhone: "+234 802 333 4444",
    autoCommunicationsEnabled: true,
    totalBookings: 3,
    totalSpend: 88500,
    invoicedAmount: 88500,
    receivedAmount: 88500,
    openBalance: 0,
    preferencesList: [
      "Stand-up cabin preferred",
      "VIP menu 1",
      "Flexible schedule"
    ],
    lifetimeTrips: 3,
    lifetimeSince: "Jan 2026",
    conversionRate: 75,
    vipTier: "Corporate Executive",
    notes: "Fast-growing industrial conglomerate. Frequent flights between Paris Le Bourget and Abuja Nnamdi Azikiwe.",
    authorizedPersons: [
      {
        id: "auth-bello-1",
        fullName: "Ifeoma Bello",
        roleTitle: "Managing Director · authorised",
        isPrimaryAccountName: true,
        email: "i.bello@bellogroup.com",
        phone: "+234 802 333 4444",
        idDocumentType: "passport",
        contactId: "cnt-ifeoma-bello",
        hasPassport: true,
        passportDetails: {
          passportNumber: "A20948102",
          issuingCountry: "Nigeria",
          placeOfBirth: "Abuja, Nigeria",
          dateOfBirth: "1980-08-19",
          expirationDate: "2032-11-15",
          issueDate: "2022-11-16"
        }
      }
    ],
    recentTrips: [
      {
        tripId: "MX5521",
        flightDate: "24 Nov",
        route: "LFPB ⇄ DNAA",
        stage: "Sourcing",
        value: 36000
      }
    ],
    createdAt: "2026-01-15"
  },
  {
    id: "acc-1",
    accountNumber: "ACC-21737",
    accountType: "entity",
    name: "Brinkmann Global Capital SAM",
    legalName: "Brinkmann Global Capital SAM",
    country: "Monaco",
    agentName: "M. Vance",
    email: "ebrinkmann@bgcapital.com",
    phone: "+377 97 97 12 00",
    billingAddress: "7 Boulevard Albert 1er, MC-98000 Monaco",
    sendDocumentsTo: "ebrinkmann@bgcapital.com",
    vatTaxNumber: "FR 48 392 849 102",
    isAgent: false,
    preferredContactName: "Edward Brinkmann",
    preferredContactEmail: "ebrinkmann@bgcapital.com",
    preferredContactPhone: "+377 97 97 12 00",
    autoCommunicationsEnabled: true,
    totalBookings: 6,
    totalSpend: 184500,
    invoicedAmount: 184500,
    receivedAmount: 184500,
    openBalance: 0,
    preferencesList: [
      "Chilled vintage Dom Pérignon",
      "Immediate ramp-side Mercedes S-Class transfer",
      "Quiet cabin during cruise"
    ],
    lifetimeTrips: 6,
    lifetimeSince: "Mar 2024",
    conversionRate: 85,
    vipTier: "Ultra HNWI",
    notes: "Requires chilled vintage Dom Pérignon and immediate ramp-side Mercedes S-Class transfer.",
    authorizedPersons: [
      {
        id: "auth-1",
        fullName: "Edward Brinkmann",
        roleTitle: "Managing Principal & Shareholder",
        isPrimaryAccountName: true,
        email: "ebrinkmann@bgcapital.com",
        phone: "+377 97 97 12 00",
        idDocumentType: "passport",
        contactId: "cnt-1",
        hasPassport: true,
        passportDetails: {
          passportNumber: "P-84920194A",
          issuingCountry: "Germany",
          placeOfBirth: "Munich, Germany",
          dateOfBirth: "1978-04-12",
          expirationDate: "2031-08-20",
          issueDate: "2021-08-21"
        }
      },
      {
        id: "auth-2",
        fullName: "Klara Van Der Beek",
        roleTitle: "Chief Operations Officer",
        isPrimaryAccountName: false,
        email: "k.vanderbeek@bgcapital.com",
        phone: "+377 97 97 12 05",
        idDocumentType: "id",
        hasPassport: false,
        idDetails: {
          idNumber: "ID-NL-83920104",
          issuingState: "Netherlands",
          dateOfBirth: "1984-11-03",
          expirationDate: "2029-05-15"
        }
      }
    ],
    recentTrips: [
      {
        tripId: "BG-2026-001",
        flightDate: "15 Oct",
        route: "LSGG → LFMN",
        stage: "Paid",
        value: 32000
      },
      {
        tripId: "BG-2026-002",
        flightDate: "02 Sep",
        route: "LFMN → LIML",
        stage: "Paid",
        value: 18500
      }
    ],
    createdAt: "2024-03-12"
  },
  {
    id: "acc-2",
    accountNumber: "ACC-99482",
    accountType: "individual",
    name: "Countess Sophie von Habsburg",
    legalName: "Countess Sophie von Habsburg",
    country: "Austria",
    agentName: "Sophia Laurent",
    email: "sophie.habsburg@heritage.at",
    phone: "+43 1 512 8901",
    billingAddress: "Herrengasse 14, A-1010 Vienna, Austria",
    sendDocumentsTo: "sophie.habsburg@heritage.at",
    vatTaxNumber: "ATU 9948 2104",
    isAgent: false,
    preferredContactName: "Countess Sophie von Habsburg",
    preferredContactEmail: "sophie.habsburg@heritage.at",
    preferredContactPhone: "+43 1 512 8901",
    autoCommunicationsEnabled: true,
    totalBookings: 4,
    totalSpend: 92400,
    invoicedAmount: 92400,
    receivedAmount: 92400,
    openBalance: 0,
    preferencesList: [
      "Pet-friendly cabin (Miniature dachshund)",
      "Organic catering only",
      "Vienna Schwechat VIP GAC"
    ],
    lifetimeTrips: 4,
    lifetimeSince: "May 2024",
    conversionRate: 80,
    vipTier: "Family Office",
    notes: "Prefers pet-friendly cabins. Travels with miniature dachshund (valid EU pet passport).",
    authorizedPersons: [
      {
        id: "auth-3",
        fullName: "Countess Sophie von Habsburg",
        roleTitle: "Account Holder & Principal",
        isPrimaryAccountName: true,
        email: "sophie.habsburg@heritage.at",
        phone: "+43 1 512 8901",
        idDocumentType: "passport",
        contactId: "cnt-8",
        hasPassport: true,
        passportDetails: {
          passportNumber: "AT-9948201",
          issuingCountry: "Austria",
          placeOfBirth: "Vienna, Austria",
          dateOfBirth: "1982-06-25",
          expirationDate: "2032-10-10",
          issueDate: "2022-10-11"
        }
      }
    ],
    recentTrips: [
      {
        tripId: "HB-2026-004",
        flightDate: "26 Oct",
        route: "LOWW → LSZH",
        stage: "Paid",
        value: 16400
      }
    ],
    createdAt: "2024-05-18"
  },
  {
    id: "acc-3",
    accountNumber: "ACC-84920",
    accountType: "entity",
    name: "Vance Luxury Aviation & Brokerage Ltd",
    legalName: "Vance Luxury Aviation & Brokerage Ltd",
    country: "United Kingdom",
    agentName: "Internal",
    email: "marcus@vanceaviation.co.uk",
    phone: "+44 20 7946 0912",
    billingAddress: "Berkeley Square House, Mayfair, London W1J 6BD",
    sendDocumentsTo: "marcus@vanceaviation.co.uk",
    vatTaxNumber: "GB 942 0419 22",
    isAgent: true,
    preferredContactName: "Marcus Vance",
    preferredContactEmail: "agent@orbelo.com",
    preferredContactPhone: "+44 20 7946 0912",
    autoCommunicationsEnabled: true,
    totalBookings: 14,
    totalSpend: 428000,
    invoicedAmount: 428000,
    receivedAmount: 395000,
    openBalance: 33000,
    preferencesList: [
      "8% broker commission ledger",
      "Instant quotation approval",
      "London Luton Signature FBO"
    ],
    lifetimeTrips: 14,
    lifetimeSince: "Jan 2024",
    conversionRate: 92,
    vipTier: "Corporate Executive",
    notes: "Primary accredited charter broker. Receives 8% commission on net charter value.",
    authorizedPersons: [
      {
        id: "auth-4",
        fullName: "Marcus Vance",
        roleTitle: "Senior Executive Charter Broker",
        isPrimaryAccountName: true,
        email: "agent@orbelo.com",
        phone: "+44 20 7946 0912",
        idDocumentType: "passport",
        contactId: "cnt-7",
        hasPassport: true,
        passportDetails: {
          passportNumber: "GB-554920194",
          issuingCountry: "United Kingdom",
          placeOfBirth: "London, UK",
          dateOfBirth: "1980-09-14",
          expirationDate: "2030-04-18",
          issueDate: "2020-04-19"
        }
      }
    ],
    recentTrips: [
      {
        tripId: "VA-2026-012",
        flightDate: "19 Nov",
        route: "LFPB → LIML",
        stage: "Booked",
        value: 14200
      }
    ],
    createdAt: "2024-01-10"
  },
  {
    id: "acc-4",
    accountNumber: "ACC-10029",
    accountType: "entity",
    name: "Rostova Prime Family Office",
    legalName: "Rostova Prime Family Office",
    country: "United Arab Emirates",
    agentName: "Elena Rostova",
    email: "e.rostova@rostovaprime.ae",
    phone: "+971 4 312 8840",
    billingAddress: "DIFC Gate Precinct 4, Level 5, Dubai",
    sendDocumentsTo: "e.rostova@rostovaprime.ae",
    vatTaxNumber: "AE 1002 9481 00003",
    isAgent: false,
    preferredContactName: "Elena Rostova",
    preferredContactEmail: "e.rostova@rostovaprime.ae",
    preferredContactPhone: "+971 4 312 8840",
    autoCommunicationsEnabled: true,
    totalBookings: 5,
    totalSpend: 312000,
    invoicedAmount: 312000,
    receivedAmount: 312000,
    openBalance: 0,
    preferencesList: [
      "Organic kosher/halal certified catering",
      "Dedicated falcon perch hood",
      "Quiet cabin mode"
    ],
    lifetimeTrips: 5,
    lifetimeSince: "Jan 2024",
    conversionRate: 70,
    vipTier: "Ultra HNWI",
    notes: "Organic kosher/halal certified catering only. Lead passenger requires quiet cabin mode.",
    authorizedPersons: [
      {
        id: "auth-5",
        fullName: "Elena Rostova",
        roleTitle: "Managing Trustee",
        isPrimaryAccountName: true,
        email: "e.rostova@rostovaprime.ae",
        phone: "+971 4 312 8840",
        idDocumentType: "passport",
        contactId: "cnt-5",
        hasPassport: true,
        passportDetails: {
          passportNumber: "P-77291048",
          issuingCountry: "United Arab Emirates",
          placeOfBirth: "Dubai, UAE",
          dateOfBirth: "1985-02-18",
          expirationDate: "2031-12-01",
          issueDate: "2021-12-02"
        }
      }
    ],
    recentTrips: [
      {
        tripId: "RP-2026-005",
        flightDate: "05 Nov",
        route: "OMDB → LFPB",
        stage: "Paid",
        value: 64000
      }
    ],
    createdAt: "2024-01-15"
  },
  {
    id: "acc-5",
    accountNumber: "ACC-33829",
    accountType: "entity",
    name: "Monaco Luxury Jet Brokers SARL",
    legalName: "Monaco Luxury Jet Brokers SARL",
    country: "Monaco",
    agentName: "Camille Laurent",
    email: "c.laurent@monacojets.mc",
    phone: "+377 98 06 20 00",
    billingAddress: "Quai Antoine 1er, MC-98000 Monaco",
    sendDocumentsTo: "c.laurent@monacojets.mc",
    vatTaxNumber: "FR-09418290",
    isAgent: true,
    preferredContactName: "Camille Laurent",
    preferredContactEmail: "c.laurent@monacojets.mc",
    preferredContactPhone: "+377 98 06 20 00",
    autoCommunicationsEnabled: true,
    totalBookings: 8,
    totalSpend: 295000,
    invoicedAmount: 295000,
    receivedAmount: 260000,
    openBalance: 35000,
    preferencesList: [
      "Riviera & Alpine luxury charter specialist",
      "10% standard brokerage margin",
      "Nice Côte d'Azur VIP handling"
    ],
    lifetimeTrips: 8,
    lifetimeSince: "Mar 2024",
    conversionRate: 88,
    vipTier: "Corporate Executive",
    notes: "Riviera & Alpine luxury charter specialist broker. 10% standard brokerage margin.",
    authorizedPersons: [
      {
        id: "auth-6",
        fullName: "Camille Laurent",
        roleTitle: "Broker Director",
        isPrimaryAccountName: true,
        email: "c.laurent@monacojets.mc",
        phone: "+377 98 06 20 00",
        idDocumentType: "passport",
        contactId: "cnt-4",
        hasPassport: true,
        passportDetails: {
          passportNumber: "FR-48392019",
          issuingCountry: "France",
          placeOfBirth: "Nice, France",
          dateOfBirth: "1983-07-22",
          expirationDate: "2032-05-10"
        }
      }
    ],
    recentTrips: [
      {
        tripId: "ML-2026-008",
        flightDate: "24 Nov",
        route: "LFPB ⇄ DNAA",
        stage: "Booked",
        value: 36000
      }
    ],
    createdAt: "2024-03-15"
  }
];

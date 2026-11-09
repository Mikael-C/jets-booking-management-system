import { ContactRecord } from "@/types/aviation";

export const initialContacts: ContactRecord[] = [
  {
    id: "cnt-1",
    firstName: "Edward",
    middleName: "Alexander",
    lastName: "Brinkmann",
    email: "ebrinkmann@bgcapital.com",
    phone: "+377 97 97 12 00",
    country: "Monaco",
    gender: "Male",
    weightKg: 84,
    associatedAccountId: "acc-1",
    associatedAccountName: "Brinkmann Global Capital SAM",
    isAgent: false,
    bioIdType: "passport",
    passportDetails: {
      passportNumber: "P-84920194A",
      issuingCountry: "Germany",
      placeOfBirth: "Munich, Germany",
      dateOfBirth: "1978-04-12",
      expirationDate: "2031-08-20"
    },
    pets: [],
    notes: "Lead passenger. Always requests ramp transfer.",
    createdAt: "2024-03-12"
  },
  {
    id: "cnt-2",
    firstName: "Luca",
    middleName: "Cesare",
    lastName: "Ceretti",
    email: "luca.ceretti@milanofinance.it",
    phone: "+39 02 7485 3000",
    country: "Italy",
    gender: "Male",
    weightKg: 79,
    associatedAccountId: "acc-1",
    associatedAccountName: "Brinkmann Global Capital SAM",
    isAgent: false,
    bioIdType: "id",
    idDetails: {
      idNumber: "CA-9948210IT",
      issuingState: "Italy",
      dateOfBirth: "1981-11-19",
      expirationDate: "2030-11-20"
    },
    pets: [],
    notes: "Frequent passenger on Milan/Nice routes.",
    createdAt: "2024-04-05"
  },
  {
    id: "cnt-3",
    firstName: "Marc",
    middleName: "Edouard",
    lastName: "Dwek",
    email: "m.dwek@genevainvest.ch",
    phone: "+41 22 717 0900",
    country: "Switzerland",
    gender: "Male",
    weightKg: 82,
    associatedAccountId: "acc-1",
    associatedAccountName: "Brinkmann Global Capital SAM",
    isAgent: false,
    bioIdType: "passport",
    passportDetails: {
      passportNumber: "CH-33829104",
      issuingCountry: "Switzerland",
      placeOfBirth: "Geneva, Switzerland",
      dateOfBirth: "1975-09-08",
      expirationDate: "2029-12-15"
    },
    pets: [],
    notes: "VIP guest on corporate charters.",
    createdAt: "2024-04-10"
  },
  {
    id: "cnt-4",
    firstName: "Camille",
    middleName: "Marie",
    lastName: "Laurent",
    email: "c.laurent@monacojets.mc",
    phone: "+377 98 06 20 00",
    country: "Monaco",
    gender: "Female",
    weightKg: 62,
    associatedAccountId: "acc-5",
    associatedAccountName: "Monaco Luxury Jet Brokers SARL",
    isAgent: true, // Marked as Agent representative!
    bioIdType: "passport",
    passportDetails: {
      passportNumber: "FR-48392019",
      issuingCountry: "France",
      placeOfBirth: "Nice, France",
      dateOfBirth: "1983-07-22",
      expirationDate: "2032-05-10"
    },
    pets: [],
    notes: "Accredited broker representative in Monaco & Cote d'Azur.",
    createdAt: "2024-03-15"
  },
  {
    id: "cnt-5",
    firstName: "Elena",
    middleName: "Sergeyevna",
    lastName: "Rostova",
    email: "e.rostova@rostovaprime.ae",
    phone: "+971 4 312 8840",
    country: "United Arab Emirates",
    gender: "Female",
    weightKg: 58,
    associatedAccountId: "acc-4",
    associatedAccountName: "Rostova Prime Family Office",
    isAgent: false,
    bioIdType: "passport",
    passportDetails: {
      passportNumber: "P-77291048",
      issuingCountry: "United Arab Emirates",
      placeOfBirth: "Dubai, UAE",
      dateOfBirth: "1985-02-18",
      expirationDate: "2031-12-01"
    },
    pets: [
      {
        id: "pet-1",
        petType: "Falcon",
        petName: "Shahine",
        breed: "Peregrine Hunting Falcon",
        weightKg: 1.1,
        microchipNumber: "985141002948123",
        passportCertificateNumber: "UAE-FAL-84920",
        vaccinationExpiry: "2027-01-15",
        specialCareNotes: "Travels in cabin on dedicated perch hood. Health export certificate verified."
      }
    ],
    notes: "Requires halal catering and cabin quiet mode.",
    createdAt: "2024-01-15"
  },
  {
    id: "cnt-6",
    firstName: "Julian",
    middleName: "Arthur",
    lastName: "Sterling",
    email: "j.sterling@sterlingequities.co.uk",
    phone: "+44 20 7946 0883",
    country: "United Kingdom",
    gender: "Male",
    weightKg: 85,
    associatedAccountId: undefined,
    associatedAccountName: "Sterling Equities Partners",
    isAgent: false,
    bioIdType: "passport",
    passportDetails: {
      passportNumber: "GB-882109433",
      issuingCountry: "United Kingdom",
      placeOfBirth: "London, UK",
      dateOfBirth: "1972-03-30",
      expirationDate: "2030-09-14"
    },
    pets: [],
    notes: "Prefers London Luton Signature FBO departures.",
    createdAt: "2024-09-01"
  },
  {
    id: "cnt-7",
    firstName: "Marcus",
    middleName: "Edward",
    lastName: "Vance",
    email: "agent@orbelo.com",
    phone: "+44 20 7946 0912",
    country: "United Kingdom",
    gender: "Male",
    weightKg: 80,
    associatedAccountId: "acc-3",
    associatedAccountName: "Vance Luxury Aviation & Brokerage Ltd",
    isAgent: true, // Agent broker
    bioIdType: "passport",
    passportDetails: {
      passportNumber: "GB-554920194",
      issuingCountry: "United Kingdom",
      placeOfBirth: "London, UK",
      dateOfBirth: "1980-09-14",
      expirationDate: "2030-04-18"
    },
    pets: [],
    notes: "Lead broker with active token subscription.",
    createdAt: "2024-01-10"
  },
  {
    id: "cnt-8",
    firstName: "Sophie",
    middleName: "Marie-Therese",
    lastName: "von Habsburg",
    email: "sophie.habsburg@heritage.at",
    phone: "+43 1 512 8901",
    country: "Austria",
    gender: "Female",
    weightKg: 55,
    associatedAccountId: "acc-2",
    associatedAccountName: "Countess Sophie von Habsburg",
    isAgent: false,
    bioIdType: "passport",
    passportDetails: {
      passportNumber: "AT-9948201",
      issuingCountry: "Austria",
      placeOfBirth: "Vienna, Austria",
      dateOfBirth: "1982-06-25",
      expirationDate: "2032-10-10"
    },
    pets: [
      {
        id: "pet-2",
        petType: "Dog",
        petName: "Baron",
        breed: "Miniature Dachshund (Teckel)",
        weightKg: 4.5,
        microchipNumber: "956000008492019",
        passportCertificateNumber: "AT-02-849201",
        vaccinationExpiry: "2027-04-20",
        specialCareNotes: "Valid EU Pet Passport. Needs organic chicken breast snacks."
      }
    ],
    notes: "Always travels with miniature dachshund in cabin.",
    createdAt: "2024-05-18"
  }
];

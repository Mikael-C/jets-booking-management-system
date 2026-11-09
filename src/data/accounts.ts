import { AccountRecord } from "@/types/aviation";

export const initialAccounts: AccountRecord[] = [
  {
    id: "acc-1",
    accountNumber: "ACC-21737",
    accountType: "entity",
    name: "Brinkmann Global Capital SAM",
    country: "Monaco",
    email: "ebrinkmann@bgcapital.com",
    phone: "+377 97 97 12 00",
    billingAddress: "7 Boulevard Albert 1er, MC-98000 Monaco",
    vatTaxNumber: "FR 48 392 849 102",
    isAgent: false,
    preferredContactName: "Edward Brinkmann",
    preferredContactEmail: "ebrinkmann@bgcapital.com",
    preferredContactPhone: "+377 97 97 12 00",
    autoCommunicationsEnabled: true,
    totalBookings: 6,
    totalSpend: 184500,
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
        idDetails: {
          idNumber: "ID-NL-83920104",
          issuingState: "Netherlands",
          dateOfBirth: "1984-11-03",
          expirationDate: "2029-05-15"
        }
      }
    ],
    createdAt: "2024-03-12"
  },
  {
    id: "acc-2",
    accountNumber: "ACC-99482",
    accountType: "individual",
    name: "Countess Sophie von Habsburg",
    country: "Austria",
    email: "sophie.habsburg@heritage.at",
    phone: "+43 1 512 8901",
    billingAddress: "Herrengasse 14, A-1010 Vienna, Austria",
    vatTaxNumber: "ATU 9948 2104",
    isAgent: false,
    preferredContactName: "Countess Sophie von Habsburg",
    preferredContactEmail: "sophie.habsburg@heritage.at",
    preferredContactPhone: "+43 1 512 8901",
    autoCommunicationsEnabled: true,
    totalBookings: 4,
    totalSpend: 92400,
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
    createdAt: "2024-05-18"
  },
  {
    id: "acc-3",
    accountNumber: "ACC-84920",
    accountType: "entity",
    name: "Vance Luxury Aviation & Brokerage Ltd",
    country: "United Kingdom",
    email: "marcus@vanceaviation.co.uk",
    phone: "+44 20 7946 0912",
    billingAddress: "Berkeley Square House, Mayfair, London W1J 6BD",
    vatTaxNumber: "GB 942 0419 22",
    isAgent: true, // Marked as Agent account -> goes to Agents directory!
    preferredContactName: "Marcus Vance",
    preferredContactEmail: "agent@orbelo.com",
    preferredContactPhone: "+44 20 7946 0912",
    autoCommunicationsEnabled: true,
    totalBookings: 14,
    totalSpend: 428000,
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
    createdAt: "2024-01-10"
  },
  {
    id: "acc-4",
    accountNumber: "ACC-10029",
    accountType: "entity",
    name: "Rostova Prime Family Office",
    country: "United Arab Emirates",
    email: "e.rostova@rostovaprime.ae",
    phone: "+971 4 312 8840",
    billingAddress: "DIFC Gate Precinct 4, Level 5, Dubai",
    vatTaxNumber: "AE 1002 9481 00003",
    isAgent: false,
    preferredContactName: "Elena Rostova",
    preferredContactEmail: "e.rostova@rostovaprime.ae",
    preferredContactPhone: "+971 4 312 8840",
    autoCommunicationsEnabled: true,
    totalBookings: 5,
    totalSpend: 312000,
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
    createdAt: "2024-01-15"
  },
  {
    id: "acc-5",
    accountNumber: "ACC-33829",
    accountType: "entity",
    name: "Monaco Luxury Jet Brokers SARL",
    country: "Monaco",
    email: "c.laurent@monacojets.mc",
    phone: "+377 98 06 20 00",
    billingAddress: "Quai Antoine 1er, MC-98000 Monaco",
    vatTaxNumber: "FR-09418290",
    isAgent: true, // Agent account
    preferredContactName: "Camille Laurent",
    preferredContactEmail: "c.laurent@monacojets.mc",
    preferredContactPhone: "+377 98 06 20 00",
    autoCommunicationsEnabled: true,
    totalBookings: 8,
    totalSpend: 295000,
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
        passportDetails: {
          passportNumber: "FR-48392019",
          issuingCountry: "France",
          placeOfBirth: "Nice, France",
          dateOfBirth: "1983-07-22",
          expirationDate: "2032-05-10"
        }
      }
    ],
    createdAt: "2024-03-15"
  }
];

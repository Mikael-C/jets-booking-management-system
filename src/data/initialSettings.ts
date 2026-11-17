import { AppSettings } from "@/types/aviation";

export const initialSettings: AppSettings = {
  company: {
    name: "Orbelo Jet Management",
    legalEntity: "Orbelo Private Aviation & Executive Charter Ltd",
    representativeName: "Charter Flight Operations Desk",
    address: "Terminal 1 Executive Apron, London Stansted Airport, CM24 1QW, United Kingdom",
    phone: "+44 20 7946 0920",
    phone24_7: "+44 20 7946 0999 (24/7 Operations)",
    email: "charter@orbelo.com",
    vatNumber: "GB 303 612 155",
    additionalVatNumbers: [
      "CHE-492.810.334 MWST",
      "FR 66 830 821 799",
      "DE 286 551 690",
      "IT 00268829991"
    ],
    courtOfJurisdiction: "Commercial Court of London",
    commercialRegistry: "UK CAA AOC No. GB-8422 • EASA TCO Certified",
    registrationNumber: "OC-1049281-UK",
    vatExemptionClause: "Zero-rated VAT for international passenger charter flights under VAT Act 1994, Schedule 8, Group 8.",
    vatWording: "Zero-rated VAT for international air passenger transport pursuant to standard international charter rules."
  },
  pricing: {
    cardFeePercent: 3.5,
    defaultCurrency: "EUR"
  },
  marginTiers: [
    {
      id: "tier-1",
      label: "Under €10,000 (Tier 1)",
      minCost: 0,
      maxCost: 10000,
      marginPercent: 15
    },
    {
      id: "tier-2",
      label: "€10,000 – €35,000 (Tier 2)",
      minCost: 10000,
      maxCost: 35000,
      marginPercent: 10
    },
    {
      id: "tier-3",
      label: "Above €35,000 (Tier 3)",
      minCost: 35000,
      maxCost: null,
      marginPercent: 8
    }
  ],
  bankAccounts: [
    {
      id: "bank-eur",
      currency: "EUR",
      bankName: "Barclays Private Aviation Banking (Geneva)",
      accountHolder: "Orbelo Jet Management Ltd",
      iban: "CH93 0024 0240 5000 1234 5",
      bic: "BUKBCHGG",
      address: "10 Rue du Rhône, 1204 Genève, Switzerland",
      isDefault: true
    },
    {
      id: "bank-usd",
      currency: "USD",
      bankName: "Barclays Private Banking (London)",
      accountHolder: "Orbelo Jet Management Ltd",
      iban: "GB29 BUKB 2020 1555 9210 44",
      bic: "BUKBGB22",
      routingNumber: "026002574",
      address: "1 Churchill Place, Canary Wharf, London, E14 5HP, UK",
      isDefault: true
    }
  ],
  termsVersions: [
    {
      id: "terms-v2-4",
      version: "v2.4",
      effectiveDate: "01.10.2026",
      title: "Standard Executive Charter Agreement Terms v2.4",
      summary: "Updated cancellation schedules, war risk clauses, de-icing policies, and passenger luggage liabilities.",
      fullText: "1. Scope of Agreement: Orbelo acts as charter broker on behalf of the Charterer. All flights are operated by fully licensed and AOC-holding air carriers.\n2. Payment Terms: 100% full payment is due immediately upon contract execution prior to flight dispatch.\n3. Cancellation Schedule: As outlined in Section 5.\n4. De-icing & Weather: De-icing procedures are billed at actual cost unless a pre-paid waiver option was selected.\n5. Governing Law: This contract shall be governed by and construed in accordance with the laws specified in the company profile.",
      isActive: true
    },
    {
      id: "terms-v2-3",
      version: "v2.3",
      effectiveDate: "01.01.2026",
      title: "Executive Charter Agreement Terms v2.3 (Superseded)",
      summary: "Archived prior terms version.",
      fullText: "Archived terms v2.3 content.",
      isActive: false
    }
  ],
  cancellationPolicy: [
    {
      id: "cancel-step-1",
      daysPriorMin: 14,
      daysPriorMax: null,
      feePercentage: 10,
      description: "More than 14 days prior to departure: 10% fee (90% refundable)"
    },
    {
      id: "cancel-step-2",
      daysPriorMin: 7,
      daysPriorMax: 14,
      feePercentage: 25,
      description: "Between 7 and 14 days prior to departure: 25% fee (75% refundable)"
    },
    {
      id: "cancel-step-3",
      daysPriorMin: 2,
      daysPriorMax: 7,
      feePercentage: 50,
      description: "Between 48 hours and 7 days prior to departure: 50% fee (50% refundable)"
    },
    {
      id: "cancel-step-4",
      daysPriorMin: 0,
      daysPriorMax: 2,
      feePercentage: 100,
      description: "Less than 48 hours prior to departure: 100% non-refundable"
    }
  ],
  tokens: {
    freeTokensOnSignup: 3,
    bundles: [
      { id: "bundle-starter", tokens: 5, price: 250, currency: "EUR" },
      { id: "bundle-pro", tokens: 15, price: 600, currency: "EUR", popular: true },
      { id: "bundle-enterprise", tokens: 30, price: 1000, currency: "EUR" }
    ]
  },
  requestOverdueMinutes: 30,
  notifications: {
    emailAlerts: true,
    urgentTripHours: 72
  }
};

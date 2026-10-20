export type UserRole = "admin" | "agent";

export type BookingStatus = 
  | "draft"
  | "quote_sent"
  | "client_review"
  | "confirmed"
  | "dispatched"
  | "in_flight"
  | "completed"
  | "cancelled";

export type TripType = "one_way" | "round_trip" | "multi_leg";

export interface Airport {
  id: string;
  name: string;
  city: string;
  country: string;
  iata: string;
  icao: string;
  type?: "fbo" | "dedicated" | "airstrip" | "altiport" | "international";
  typeLabel?: string;
  popular?: boolean;
  region?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Aircraft {
  id: string;
  name: string;
  manufacturer: string;
  category: "light" | "midsize" | "super-midsize" | "large" | "ultra-long-range";
  categoryLabel: string;
  registration?: string; // Tail e.g. OE-FFB, F-HSBL
  tagline?: string;
  description?: string;
  passengers: number;
  passengersLabel?: string;
  range: number; // nm
  rangeLabel?: string;
  cabinHeight?: string;
  cabinWidth?: string;
  baggageVolume?: string;
  cruiseSpeed?: string;
  yearOfManufacture: number | string;
  yearOfRefurbishment?: number | string;
  pricePerHour: number;
  toilette: boolean;
  smokingCabin: boolean;
  imageExterior: string;
  imageInterior: string;
}

export interface CrewMember {
  role: "CMDR" | "F/O" | "Cabin Attendant";
  name: string;
  phone: string;
  email?: string;
}

export interface HandlingAgent {
  name: string;
  airportCode: string;
  phone: string;
  email: string;
}

export interface PassengerManifestItem {
  id: string;
  fullName: string;
  passportNumber?: string;
  nationality?: string;
  dateOfBirth?: string;
  passportExpiry?: string;
  isLeadPassenger?: boolean;
  specialRequests?: string;
  hasPet?: boolean;
}

export interface FlightLeg {
  legNumber: number;
  flightDate: string; // YYYY-MM-DD
  origin: Airport;
  destination: Airport;
  departureTimeLocal: string; // e.g. "08:00" or "11:00 h"
  arrivalTimeLocal: string; // e.g. "09:15" or "11:55 h"
  flightTimeFormatted: string; // e.g. "1h 15m"
  paxCount: number;
  flightNumber: string; // Callsign e.g. "PEA501", "GAC842U"
  aircraftRegistration: string; // Tail e.g. "OE-FFB"
  crew: CrewMember[];
  passengers: PassengerManifestItem[];
  departureHandling: HandlingAgent;
  arrivalHandling: HandlingAgent;
  distanceNm?: number;
}

export interface PricingBreakdown {
  flightPrice: number; // Base flight charter rate
  airportFees: number; // Landing, parking, navigation
  passengerFees: number; // APD / passenger terminal charges
  dayOfWeekDiscount: number; // Positive or negative
  inboundPassengerTax: number;
  outboundPassengerTax: number;
  additionalServicesTotal: number;
  subtotal: number;
  vatRate: number; // e.g. 0% for international flights §6 Abs. 1 Zif. 3
  vatAmount: number;
  totalFlightPrice: number;
  currency: "EUR" | "USD" | "GBP" | "CHF";
}

export interface AdditionalServices {
  limousineService: boolean;
  luxuryCarRental: boolean;
  helicopterService: boolean;
  vipCateringDetails?: string;
  deicingInsurance: "none" | "at_reservation" | "within_48h"; // none, €400/leg, €800/leg
  deicingCostPerLeg: number;
  carbonOffset: "none" | "neutral" | "positive" | "double_neutral"; // €33/hr, €50/hr, €66/hr
  carbonOffsetRatePerHour: number;
  cancellationInsurance?: boolean; // Last-minute trip cancellation insurance €1,000/leg
  customRequests?: string;
}

export interface DispatchChecklistStep {
  id: string;
  label: string;
  category: "aircraft" | "permits" | "crew" | "ground" | "passengers" | "safety" | "finance";
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  requiredForDispatch: boolean;
}

export interface ClientDetails {
  fullName: string;
  companyName?: string;
  streetAddress: string;
  cityPostalCountry: string; // e.g. "FL-34104 Naples, United States" or "MC-98000 Monaco"
  phone: string;
  email: string;
  vatNumber?: string;
}

export interface OperatorDetails {
  companyName: string; // e.g. "Orbelo GmbH"
  legalEntity: string;
  representativeName: string; // e.g. "Ezeokeke, Obiefuna"
  supportEmail: string;
  supportPhone: string;
  vatNumber: string; // e.g. "ATU 6335 7619"
  additionalVatNumbers: string[];
  iban: string;
  bic: string;
  bankName: string;
  accountHolder: string;
  commercialRegistry: string;
  courtOfJurisdiction: string;
}

export interface Booking {
  id: string;
  tripNumber: string; // e.g. "PEU842-001" or "ZFL433"
  invoiceNumber: string; // e.g. "00106020"
  accountNumber: string; // e.g. "2{21737}" or "284169"
  contractDate: string; // DD.MM.YYYY
  quoteExpirationDate: string; // DD.MM.YYYY, HH:mmz
  paymentDueDate: string; // DD.MM.YYYY
  status: BookingStatus;
  tripType: TripType;
  aircraft: Aircraft;
  client: ClientDetails;
  operator: OperatorDetails;
  legs: FlightLeg[];
  pricing: PricingBreakdown;
  services: AdditionalServices;
  checklist: DispatchChecklistStep[];
  agentName?: string;
  agentEmail?: string;
  commissionPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

export type RequestType = "quote" | "flight_brief" | "invoice";
export type RequestStatus = "pending" | "processing" | "completed" | "declined";

export interface AgentRequest {
  id: string;
  type: RequestType;
  title: string;
  agentName: string;
  agentEmail: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  companyName?: string;
  clientAddress?: string;
  clientCityCountry?: string;
  clientVatNumber?: string;
  route: string;
  originIcao?: string;
  destIcao?: string;
  flightDate: string;
  returnFlightDate?: string;
  departureTime?: string;
  tripType?: TripType;
  paxCount: number;
  aircraftPreference?: string;
  budgetNotes?: string;
  specialRequests?: string;
  passengerNames?: string;
  limousineService?: boolean;
  luxuryCarRental?: boolean;
  helicopterService?: boolean;
  deicingInsurance?: "none" | "at_reservation" | "within_48h";
  carbonOffset?: "none" | "neutral" | "positive" | "double_neutral";
  cancellationInsurance?: boolean;
  bookingId?: string;
  invoiceDueDate?: string;
  createdAt: string;
  status: RequestStatus;
  generatedDocumentType?: "quotation" | "flight_brief" | "invoice";
  generatedBookingId?: string;
  adminNotes?: string;
}

export interface ClientRecord {
  id: string;
  fullName: string;
  companyName?: string;
  streetAddress: string;
  cityPostalCountry: string;
  phone: string;
  email: string;
  vatNumber?: string;
  totalBookings: number;
  totalSpend: number;
  vipTier: "Ultra HNWI" | "Corporate Executive" | "Family Office" | "Private VIP";
  preferredJetCategory: string;
  notes?: string;
  createdAt: string;
}


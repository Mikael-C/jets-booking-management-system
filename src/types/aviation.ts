export type UserRole = "super_admin" | "admin" | "finance" | "operations" | "agent";

export interface TokenTransaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  action: string;
  description?: string;
  currency?: "GBP" | "USD" | string;
  pricePaid?: number;
  createdAt: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  phone?: string;
  title?: string;
  company?: string;
  location?: string;
  bio?: string;
  tokens?: number;
  tokenTier?: "free" | "standard" | "pro" | "enterprise";
  subscriptionStatus?: "none" | "active" | "expired";
  subscriptionExpiresAt?: string;
  notificationPreferences?: {
    emailAlerts?: boolean;
    flightUpdates?: boolean;
    tokenAlerts?: boolean;
    marketing?: boolean;
  };
  tokenTransactions?: TokenTransaction[];
  lastLogin?: string;
  createdAt?: string;
}

export type BookingStatus = 
  | "submitted"
  | "in_sourcing"
  | "quoted"
  | "accepted"
  | "paid"
  | "confirmed"
  | "flown"
  | "cancelled"
  | "expired"
  | "draft"
  | "quote_sent"
  | "client_review"
  | "contract_sent"
  | "dispatched"
  | "in_flight"
  | "completed";

export type TripType = "one_way" | "round_trip" | "multi_leg";

export interface FboOption {
  id: string;
  name: string;
  phone: string;
  email: string;
  vhfFrequency?: string;
  address?: string;
  notes?: string;
}

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
  fbos?: FboOption[];
}

export interface Aircraft {
  id: string;
  name: string;
  manufacturer: string;
  category:
    | "turboprop"
    | "piston"
    | "entry-level"
    | "light"
    | "super-light"
    | "midsize"
    | "super-midsize"
    | "heavy"
    | "large"
    | "ultra-long-range"
    | "vip-airliner";
  categoryLabel: string;
  registration?: string;
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
  images?: Array<{
    url: string;
    thumb?: string;
    alt?: string;
    type: string;
    source?: string;
    credit?: string;
    creditUrl?: string;
  }>;
  additionalImages?: string[];
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
  vhfFrequency?: string;
  address?: string;
  notes?: string;
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

export interface PetDetails {
  hasPets: boolean;
  petCount: number;
  totalWeightKg: number;
  petType?: string;
  notes?: string;
}

export interface LuggageDetails {
  pieceCount: number;
  totalWeightKg: number;
  standardSuitcases: number;
  dimensionsDescription?: string;
  specialLuggageDescription?: string;
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
  pets?: PetDetails;
  luggage?: LuggageDetails;
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
  accountNumber?: string;
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

export interface SourcingOption {
  id: string;
  operatorName: string;
  aircraftType: string;
  aircraftRegistration?: string;
  baseAirport: string;
  price: number;
  currency: "EUR" | "USD" | "GBP" | "CHF";
  taxesIncluded: boolean;
  validUntil: string;
  notes?: string;
  avInodeTripId?: string;
  createdAt: string;
}

export interface RequestMessage {
  id: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
  isFromAdmin: boolean;
}

export interface OperatorQualDoc {
  id: string;
  docType: string;
  status: "pass" | "fail" | "pending";
  expiryDate?: string;
  notes?: string;
}

export interface OperatorRecord {
  id: string;
  legalName: string;
  tradingName: string;
  aocNumber: string;
  aocAuthority: string;
  aocExpiry: string;
  baseIcao: string;
  salesContact: string;
  salesEmail: string;
  opsPhone: string;
  opsEmail: string;
  status: "pending" | "approved" | "approved_with_conditions" | "suspended" | "rejected";
  insuranceExpiry?: string;
  safetyRating?: string;
  safetyRatingProvider?: string;
  notes?: string;
  qualificationChecklist: OperatorQualDoc[];
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userEmail: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string | any;
}

export interface Notification {
  id: string;
  type: "info" | "warning" | "success" | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  entityId?: string;
  entityType?: string;
}

export interface MarginRule {
  id: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  appliesTo: "default" | "client" | "agent" | "route_type" | "aircraft_category";
  targetId?: string;
}

export interface Booking {
  id: string;
  tripNumber: string; // e.g. "PEU842-001" or "ZFL433" (Assigned when booked as a flight)
  invoiceNumber: string; // e.g. "00106020"
  accountNumber: string; // Linked to client account e.g. "ACC-21737"
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
  quoteVersion?: number;
  quoteStatus?: "draft" | "sent" | "pending" | "undecided" | "accepted" | "declined" | "expired";
  quoteReference?: string;
  paymentStatus?: "unpaid" | "deposit_paid" | "fully_paid" | "overdue" | "refunded";
  paymentReason?: string;
  paymentMethodChoice?: "wire" | "card" | "escrow";
  cardFeePercentage?: number; // 3.5%
  cardFeeAmount?: number;
  totalWithCardFee?: number;
  adminMarginType?: "percentage" | "fixed";
  adminMarginValue?: number;
  agentMarginType?: "percentage" | "fixed";
  agentMarginValue?: number;
  manualServices?: { id: string; name: string; price: number }[];
  avInodeTripId?: string;
  sourcingOptions?: SourcingOption[];
  createdAt: string;
  updatedAt: string;
}

export type RequestType = "quote" | "flight_brief" | "invoice";
export type RequestStatus = "pending" | "in_sourcing" | "processing" | "completed" | "declined";

export interface RequestLegItem {
  originIcao: string;
  destIcao: string;
  flightDate: string;
  departureTime?: string;
}

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

  // Expanded fields
  luggageCount?: number;
  hasPets?: boolean;
  specialNeeds?: string;
  isFlexibleTime?: boolean;
  quoteVersion?: number;
  avInodeId?: string;
  sourcingOptions?: SourcingOption[];
  messages?: RequestMessage[];
  priority?: "normal" | "urgent" | "vip";
  assignedTo?: string;
  slaDeadline?: string;
  multiLegs?: RequestLegItem[];

  // Agent margin and pet/luggage details
  agentMarginPct?: number;
  agentMarginFixed?: number;
  pets?: PetDetails;
  luggage?: LuggageDetails;
}

export interface ClientRecord {
  id: string;
  accountNumber: string;
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

export interface MessageAttachment {
  name: string;
  url?: string;
  type?: "quotation" | "flight_brief" | "invoice" | "charter_agreement" | "passenger_manifest" | "credit_note" | "document" | "image";
  tripNumber?: string;
  docType?: string;
  fileSize?: string;
}

export interface AppMessage {
  id: string;
  channel: string; // 'operations', 'broker_desk', 'finance', 'client_services', or 'direct'
  senderId?: string;
  senderName: string;
  senderEmail: string;
  senderRole: "super_admin" | "admin" | "finance" | "operations" | "agent" | "client" | "system";
  recipientEmail?: string;
  recipientName?: string;
  recipientRole?: string;
  content: string;
  tripNumber?: string;
  requestId?: string;
  attachments?: MessageAttachment[];
  timestamp: string;
  read?: boolean;
}


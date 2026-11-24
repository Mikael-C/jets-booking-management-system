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
  operatingHours?: string;
  languages?: string[];
  amenities?: string[];
  airportIcao?: string;
  airportName?: string;
  notes?: string;
}

export interface Airport {
  id: string;
  name: string;
  city: string;
  country: string;
  iata: string;
  icao: string;
  type?: "fbo" | "dedicated" | "airstrip" | "altiport" | "international" | "private" | "airport" | "heliport" | "seaplane_base" | "balloonport";
  typeLabel?: string;
  popular?: boolean;
  region?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  operatingHours?: string;
  extensionPossibilities?: string;
  runwayLength?: string;
  runwaySurface?: string;
  longestRunwayMeters?: number;
  slotsRequired?: boolean;
  customsHours?: string;
  elevation?: string;
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
  // Trip page · Passengers tab (manifest picked from Contacts)
  contactId?: string;
  gender?: "M" | "F" | "X" | string;
  weightKg?: number;
  documentType?: string;
  roleNote?: string; // e.g. "Authorised person", "security"
}

export interface PetDetails {
  hasPets: boolean;
  petCount: number;
  totalWeightKg: number;
  petWeight?: number;
  breed?: string;
  petType?: string;
  notes?: string;
}

export type GroundVehiclePreference = "Sedan" | "SUV" | "Van" | "Luxury";

export interface GroundTransferItem {
  id?: string;
  leg: string; // "Leg 1", "Leg 2", "Leg 3", "Other: ..."
  otherLegText?: string;
  onArrival: {
    required: boolean;
    dropoffLocation: string;
    vehiclePreference: GroundVehiclePreference;
  };
  onDeparture: {
    required: boolean;
    pickupLocation: string;
    vehiclePreference: GroundVehiclePreference;
  };
  passengerCount: number;
  specialRequests?: string;
}

export interface GroundTransportationRequirements {
  required?: boolean;
  enabled?: boolean;
  flightLeg?: string[];
  flightLegOther?: string;
  onArrival?: {
    required?: boolean;
    dropOffLocation?: string;
    dropoffLocation?: string;
    vehiclePreference?: GroundVehiclePreference | string;
  };
  onDeparture?: {
    required?: boolean;
    pickUpLocation?: string;
    pickupLocation?: string;
    vehiclePreference?: GroundVehiclePreference | string;
  };
  additionalRequirements?: {
    passengers?: number;
    specialInstructions?: string;
  };
  transfers?: GroundTransferItem[];
  extraTransfers?: Array<{ route: string; notes: string }>;
}

export interface HeliTransferItem {
  id?: string;
  leg: string;
  otherLegText?: string;
  onArrival: {
    required: boolean;
    dropoffLocation: string;
  };
  onDeparture: {
    required: boolean;
    pickupLocation: string;
  };
  passengerCount: number;
  specialRequests?: string;
}

export interface HelicopterTransferRequirements {
  required?: boolean;
  enabled?: boolean;
  flightLeg?: string[];
  flightLegOther?: string;
  onArrival?: {
    required?: boolean;
    dropOffLocation?: string;
    dropoffLocation?: string;
    vehiclePreference?: string;
  };
  onDeparture?: {
    required?: boolean;
    pickUpLocation?: string;
    pickupLocation?: string;
    vehiclePreference?: string;
  };
  additionalRequirements?: {
    passengers?: number;
    specialInstructions?: string;
  };
  transfers?: HeliTransferItem[];
  extraTransfers?: Array<{ route: string; notes: string }>;
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
  flightTimeMinutes?: number;
  manualDurationMinutes?: number;
  isDurationOverridden?: boolean;
  departureTimeUtc?: string;
  arrivalTimeUtc?: string;
  originTz?: string;
  destTz?: string;
  tzDiffHours?: number;
  originTimezone?: string;
  destinationTimezone?: string;
  timezoneDifferenceHours?: number;
  paxCount: number;
  flightNumber: string; // Callsign e.g. "PEA501", "GAC842U"
  aircraftRegistration: string; // Tail e.g. "OE-FFB"
  aircraftType?: string;
  crew: CrewMember[];
  passengers: PassengerManifestItem[];
  departureHandling: HandlingAgent;
  arrivalHandling: HandlingAgent;
  distanceNm?: number;
  pets?: PetDetails;
  luggage?: LuggageDetails;
  isCancelled?: boolean;
  cancellationReason?: string;
  cancelledAt?: string;
  // Trip page · Itinerary tab (times, FBO, registration, crew and brief contact per leg)
  originalDepartureTimeLocal?: string;
  originalArrivalTimeLocal?: string;
  originalFlightTimeFormatted?: string;
  arrivalEdited?: boolean;
  departureEdited?: boolean;
  arrivalFboChanged?: boolean;
  departureFboChanged?: boolean;
  limoPickupFbo?: string; // FBO the arrival limousine pickup was last confirmed for
  briefContact?: "crew_mobile" | "desk_24_7" | "none";
  sameCrewAsPreviousLeg?: boolean;
  openingHoursOverride?: OpeningHoursOverride;
  weapons?: WeaponOnBoardRecord;
}

export interface OpeningHoursOverride {
  confirmedBy: "airport" | "fbo" | "operator";
  reference: string;
  extensionCost: number;
  addCostToTrip: boolean;
  updateDirectory: boolean;
  attachmentName?: string;
  overriddenAt: string;
  overriddenBy?: string;
}

export interface WeaponClearanceLine {
  id: string;
  label: string; // e.g. "Departure · Spain (LEIB)"
  authority: string;
  status: "cleared" | "pending" | "refused";
  reference?: string;
  documentName?: string;
}

export interface WeaponOnBoardRecord {
  onBoard: boolean;
  carriedByPassengerId?: string;
  carriedByName?: string;
  type?: string;
  serialOrPermit?: string;
  ammunition?: string;
  clearances: WeaponClearanceLine[];
}

export interface TripPet {
  id: string;
  name: string;
  species: string; // Dog, Cat, Bird, Falcon, Other
  breed: string;
  weightKg: number;
  travels: string; // "In cabin, in carrier" | "In cabin, on leash" | "In hold"
  documents: string; // e.g. "EU pet passport"
  documentNumber?: string;
  notes?: string;
}

export type TripServiceType = "limousine" | "helicopter" | "catering" | "custom";

/** A service on the trip (booking page · Services tab), from the quote or added afterwards. */
export interface TripServiceItem {
  id: string;
  type: TripServiceType;
  title?: string; // custom services, de-icing, carbon offset…
  legNumber?: number; // 0 or undefined = all legs
  timing?: "arrival" | "departure" | "both";
  airport?: string; // ICAO the timing refers to
  location?: string; // drop-off / pick-up address
  from?: string; // helicopter
  to?: string; // helicopter
  vehicle?: string; // limousine
  helicopterType?: string;
  menu?: string; // catering
  dietary?: string; // catering
  passengers?: number;
  luggage?: string;
  instructions?: string;
  clientPrice: number;
  supplierCost: number;
  included?: boolean; // e.g. catering included in the charter price
  status: "requested" | "requested_operator" | "confirmed" | "cancelled";
  source: "quote" | "added";
  billing: "in_quote" | "not_billed" | "credit_note";
  creditNoteNumber?: string;
  cancelCreditNoteNumber?: string;
  addedAt: string;
  addedBy?: string;
}

export interface ItineraryActivityEntry {
  id: string;
  at: string; // ISO timestamp
  by: string;
  text: string;
  summary?: string; // short label used in "N changes since the last brief: …"
  group?: "time_fbo" | "override" | "brief" | "manifest" | "sourcing" | "other";
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
  operatorCost?: number;
  companyMargin?: number;
  agentCommission?: number;
  agentCommissionRate?: number;
  agentMargin?: number;
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
  isHandledByPa?: boolean;
  paName?: string;
  paEmail?: string;
  paPhone?: string;
}

export interface OperatorDetails {
  companyName: string; // e.g. "Orbelo GmbH"
  legalEntity: string;
  name?: string;
  country?: string;
  documentsPending?: boolean;
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
  // Trip page · Sourcing tab
  operatorId?: string;
  aircraftYear?: number | string;
  refurbYear?: number | string;
  availability?: "rechecked" | "available" | "not_checked" | "declined";
  availabilityCheckedAt?: string;
  safetyRating?: string;
  photosCount?: number;
  photoUrls?: string[];
  receivedAt?: string;
  isPreferred?: boolean;
  selected?: boolean;
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
  tripId?: string; // Global consistent trip ID e.g. "TRIP-2026-842"
  quoteId?: string; // e.g. "QUO-842-01"
  quoteGroupId?: string;
  bookingRevisionId?: string; // e.g. "BK-842-01"
  revisionAdjustments?: Array<{
    id: string;
    label: string;
    amount: number;
  }>;
  isSupplementalRevision?: boolean;
  isCancelled?: boolean;
  cancellationReason?: string;
  isBooked?: boolean;
  supersededBy?: string;
  tripNumber: string; // e.g. "TRI-FE4455-001" (Assigned when booked as a flight)
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
  curatorName?: string;
  operatorName?: string;
  paContact?: {
    name: string;
    email?: string;
    phone?: string;
  };
  sourceAgentRequestId?: string;
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
  autoPaymentRemindersEnabled?: boolean;
  lastPaymentReminderSentAt?: string;
  groundTransportation?: GroundTransportationRequirements;
  helicopterTransfer?: HelicopterTransferRequirements;
  petDetails?: PetDetails;
  specialRequests?: string;
  manualServices?: Array<{ id: string; name: string; price: number; details?: string; description?: string }>;
  isHandledByPa?: boolean;
  paName?: string;
  paEmail?: string;
  paPhone?: string;
  avInodeTripId?: string;
  sourcingOptions?: SourcingOption[];
  isSuperAdminConfirmed?: boolean;
  agentConfirmedPendingSuperAdmin?: boolean;
  isContractSigned?: boolean;
  contractSignedDate?: string;
  contractSignedBy?: string;
  aircraftCustomImages?: {
    exterior?: string;
    interior?: string;
    cabinViews?: string[];
  };
  routeRevisions?: Array<{
    id: string;
    date: string;
    author: string;
    reason: string;
    supersededLegs: FlightLeg[];
    newLegs: FlightLeg[];
    previousPrice: number;
    newPrice: number;
    docRef?: string;
  }>;
  tripActionAudit?: Array<{
    id: string;
    action: string;
    details: string;
    timestamp: string;
    author: string;
    performedBy?: string;
    docType?: string;
  }>;
  creditNotes?: Array<{
    id: string;
    number: string;
    creditNoteNumber?: string;
    date: string;
    issueDate?: string;
    amount: number;
    originalTotal?: number;
    newTotal?: number;
    reason: string;
    clientOwes: number;
    weOweClient: number;
    netBalance: number;
    cancellationFee?: number;
    complementaryDeductions?: number;
    complementaryDeduction?: number;
  }>;
  consolidatedInvoice?: {
    tripId: string;
    currency: "EUR" | "USD" | "GBP" | "CHF";
    finalBalance: number;
    latestBookingRevisionId: string;
    invoiceCount: number;
    ledger: Array<{
      type: "invoice" | "credit_note";
      invoiceNumber?: string;
      creditNoteNumber?: string;
      bookingRevisionId?: string;
      amount: number;
      reason?: string;
    }>;
  };
  // Quote builder · 01 client roles, 04a operators, 06 passenger fees
  authorisedOwnerId?: string;
  authorisedOwnerName?: string;
  assistantContactId?: string;
  sendDocsTo?: "owner" | "assistant" | "both";
  signsAgreement?: "owner" | "assistant";
  legOperators?: Array<{
    legNumber: number;
    operatorId: string;
    operatorName: string;
    operatorStatus?: string;
    aircraftName?: string;
    buyingPrice?: number;
  }>;
  operatorPendingApproval?: boolean;
  passengerFeeItems?: Array<{
    description: string;
    amount: number;
    charged: "pax" | "flat";
    pax: number;
    legs: number[]; // 1-based leg numbers
    lineAtCost: number;
  }>;
  // Quote builder step 03 · each pet on the trip (shown on the Passengers tab)
  pets?: TripPet[];
  // Services tab · every service on the trip (from the quote or added later)
  tripServices?: TripServiceItem[];
  // Trip page · itinerary activity, briefs and manifest settings
  itineraryActivity?: ItineraryActivityEntry[];
  lastBriefIssuedAt?: string;
  lastBriefLegs?: number[];
  sameManifestAllLegs?: boolean;
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
  requestNumber?: string;
  tripId?: string;
  quoteGroupId?: string;
  accountId?: string;
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
  petDetails?: PetDetails;
  groundTransportation?: GroundTransportationRequirements;
  helicopterTransfer?: HelicopterTransferRequirements;
  luggage?: LuggageDetails;

  // New design fields
  receivedAgo?: string;
  routeDisplay?: string;
  flightDateFormatted?: string;
  categoryLabel?: string;
  tokensUsed?: number;
  statusLabel?: string;
  agentCompany?: string;
  agentConversionRate?: string;
  agentTokensRemaining?: number;
  accountEarlierTrips?: number;
  lavatoryPreference?: string;
  luggageDetailsText?: string;
  petDetailsText?: string;
  servicesText?: string;
  askOperatorText?: string;
  paymentMethodText?: string;
  offersLoggedText?: string;
  createdTripId?: string;
  leg1Text?: string;
  leg2Text?: string;
  isOverdue?: boolean;
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

export type BioIdType = "passport" | "id" | "visa";

export interface AuthorizedPerson {
  id: string;
  fullName: string;
  roleTitle?: string;
  isPrimaryAccountName?: boolean;
  email: string;
  phone: string;
  idDocumentType: BioIdType;
  contactId?: string;
  hasPassport?: boolean;
  passportDetails?: {
    passportNumber: string;
    issuingCountry: string;
    placeOfBirth: string;
    dateOfBirth: string;
    expirationDate: string;
    issueDate?: string;
  };
  idDetails?: {
    idNumber: string;
    issuingState: string;
    dateOfBirth: string;
    expirationDate: string;
  };
  visaDetails?: {
    visaNumber: string;
    visaCategory: string;
    issuingCountry: string;
    validFrom: string;
    validUntil: string;
    entryType: "single" | "multiple";
  };
}

export interface AccountRecord {
  id: string;
  accountNumber: string;
  accountType: "entity" | "individual";
  name: string;
  country: string;
  email: string;
  phone: string;
  billingAddress: string;
  vatTaxNumber?: string;
  isAgent: boolean;
  preferredContactName?: string;
  preferredContactEmail?: string;
  preferredContactPhone?: string;
  autoCommunicationsEnabled?: boolean;
  authorizedPersons: AuthorizedPerson[];
  totalBookings?: number;
  totalSpend?: number;
  vipTier?: "Ultra HNWI" | "Corporate Executive" | "Family Office" | "Private VIP";
  notes?: string;
  createdAt: string;

  // New design fields
  legalName?: string;
  sendDocumentsTo?: string;
  agentName?: string;
  invoicedAmount?: number;
  receivedAmount?: number;
  openBalance?: number;
  preferencesList?: string[];
  lifetimeTrips?: number;
  lifetimeSince?: string;
  conversionRate?: number;
  recentTrips?: Array<{
    tripId: string;
    flightDate: string;
    route: string;
    stage: string;
    value: number;
  }>;
  // Quote builder step 01 choices, saved as defaults for the next quote
  quoteDefaults?: {
    authorisedOwnerId?: string;
    isHandledByPa?: boolean;
    assistantContactId?: string;
    sendDocsTo?: "owner" | "assistant" | "both";
    signsAgreement?: "owner" | "assistant";
  };
}

export interface PetRecord {
  id: string;
  petType: string; // "Dog" | "Cat" | "Falcon" | "Other"
  petName: string;
  breed: string;
  weightKg: number;
  microchipNumber?: string;
  passportCertificateNumber?: string;
  vaccinationExpiry?: string;
  specialCareNotes?: string;
}

export interface ContactRecord {
  id: string;
  fullName?: string;
  prefix?: string; // e.g. "Mr.", "Mrs.", "Dr.", "Capt.", "H.E.", "Sheikh"
  firstName: string;
  middleName1?: string;
  middleName2?: string;
  middleName?: string; // fallback / combined
  lastName1?: string;
  lastName2?: string;
  lastName: string; // primary / combined surname
  suffix?: string; // e.g. "Jr.", "Sr.", "II", "III", "Esq."
  title?: string; // e.g. "Family Office Principal", "Lead Charterer", "Signatory"
  tripsFlown?: string[]; // IDs of trips / bookings this contact has flown on
  roleTitle?: string;
  hasPassport?: boolean;
  nationality?: string;
  upcomingTrips?: string[];
  email: string;
  phone: string;
  country: string;
  gender: "Male" | "Female" | "Other";
  weightKg: number;
  associatedAccountId?: string;
  associatedAccountName?: string;
  isAgent: boolean;
  bioIdType: BioIdType;
  passportDetails?: {
    passportNumber: string;
    issuingCountry: string;
    placeOfBirth: string;
    dateOfBirth: string;
    expirationDate: string;
    issueDate?: string;
  };
  idDetails?: {
    idNumber: string;
    issuingState: string;
    dateOfBirth: string;
    expirationDate: string;
  };
  visaDetails?: {
    visaNumber: string;
    visaCategory: string;
    issuingCountry: string;
    validFrom: string;
    validUntil: string;
    entryType: "single" | "multiple";
  };
  pets?: PetRecord[];
  notes?: string;
  createdAt: string;
}

export interface MarginTier {
  id: string;
  label: string;
  minCost: number;
  maxCost: number | null; // null = infinity
  marginPercent: number; // e.g. 15, 10, 8
}

export interface BankAccountSetting {
  id: string;
  currency: "EUR" | "USD" | "GBP" | "CHF";
  bankName: string;
  accountHolder: string;
  iban: string;
  bic: string;
  accountNumber?: string;
  routingNumber?: string;
  address?: string;
  isDefault?: boolean;
}

export interface TermsVersion {
  id: string;
  version: string; // e.g. "v2.4"
  effectiveDate: string; // e.g. "01.10.2026"
  title: string;
  summary: string;
  fullText: string;
  isActive: boolean;
}

export interface CancellationFeeStep {
  id: string;
  daysPriorMin: number;
  daysPriorMax: number | null; // null = or more
  feePercentage: number;
  description: string;
}

export interface TokenBundleConfig {
  id: string;
  tokens: number;
  price: number;
  currency: "EUR" | "USD" | "GBP";
  popular?: boolean;
}

export interface AppSettings {
  company: {
    name: string;
    legalEntity: string;
    representativeName: string;
    address: string;
    phone: string;
    phone24_7?: string;
    email: string;
    vatNumber: string;
    additionalVatNumbers: string[];
    courtOfJurisdiction: string;
    commercialRegistry: string;
    registrationNumber?: string;
    vatExemptionClause: string;
    vatWording?: string;
    signatoryTitle?: string;
  };
  pricing?: {
    cardFeePercent: number;
    defaultCurrency?: "EUR" | "USD" | "GBP" | "CHF";
  };
  marginTiers: MarginTier[];
  bankAccounts: BankAccountSetting[];
  termsVersions: TermsVersion[];
  cancellationPolicy: CancellationFeeStep[];
  tokens: {
    freeTokensOnSignup: number;
    bundles: TokenBundleConfig[];
  };
  requestOverdueMinutes: number; // e.g. 30
  notifications: {
    emailAlerts: boolean;
    urgentTripHours: number; // e.g. 72 (3 days)
  };
}


// ─── Flight Watch Types ────────────────────────────────────────────────────────
export interface FlightWatchAlert {
  time: string;
  message: string;
  tag: string;
  severity: "info" | "warning" | "critical";
  dutyOfficerNotified: boolean;
  createdAt?: string;
}

export interface FlightWatchItem {
  id?: string;
  _id?: string;
  tripNumber: string;
  bookingId?: string;
  aircraft: {
    registration: string;
    type: string;
    operator: string;
  };
  route: {
    fromIcao: string;
    fromCity: string;
    toIcao: string;
    toCity: string;
    waypoints?: Array<{ lat: number; lng: number; name: string }>;
  };
  schedule: {
    scheduledOffUtc: string;
    scheduledOnUtc: string;
    actualOffUtc?: string;
    actualOnUtc?: string;
    estimatedOnUtc?: string;
  };
  telemetry: {
    altitude: string;
    speedKts: number;
    heading: number;
    currentLat: number;
    currentLng: number;
    distanceRemainingKm: number;
    squawk: string;
    progressPct: number;
  };
  status: "airborne_on_time" | "airborne_delayed" | "boarding" | "delayed" | "scheduled" | "landed";
  statusLabel: string;
  nowDescription: string;
  delayMinutes: number;
  delayReason?: string;
  messagesSummary: string;
  alerts: FlightWatchAlert[];
  liveLinkToken?: string;
  liveLinkExpiresAt?: string;
  isWatched?: boolean;
}

export interface FlightWatchSummary {
  airborneCount: number;
  airborneActiveTrip: string;
  departingNext6hCount: number;
  delayedCount: number;
  delayedActiveTrip: string;
  openAlertsCount: number;
  openAlertsNote: string;
}

export interface FlightWatchAlertRules {
  departureDelayMinutes: number;
  departureTemplateCode: string;
  squawkAlertNotification: string;
  noPositionCallMinutes: number;
}

// ─── Library & Policy Document Types ──────────────────────────────────────────
export interface AccessMatrixPermissions {
  md: string;
  dutyOfficer: string;
  finance: string;
  salesDesk: string;
  curatorFounding: string;
  curatorStandard: string;
  operatorExternal: string;
}

export interface PolicyDocumentItem {
  id?: string;
  _id?: string;
  code: string;
  title: string;
  type: "Manual" | "Contract template" | "Policy" | "Procedure" | "Guide" | "Checklist";
  version: string;
  updatedDate: string;
  ownerApprover: string;
  whoCanOpen: string;
  status: "Approved" | "Lawyer review" | "Awaiting policy" | "Adviser review" | "Draft";
  downloadFormats?: {
    pdf: boolean;
    docx: boolean;
  };
  description?: string;
  nextReviewDate?: string;
  accessMatrix?: AccessMatrixPermissions;
}

export interface PersonExceptionItem {
  id: string;
  _id?: string;
  personName: string;
  personRole: string;
  exception: string;
  grantedBy: string;
  until: string;
  createdAt?: string;
}

export interface LibraryAccessData {
  matrix: Array<{
    code: string;
    title: string;
    md: string;
    dutyOfficer: string;
    finance: string;
    salesDesk: string;
    curatorFounding: string;
    curatorStandard: string;
    operatorExternal: string;
  }>;
  exceptions: PersonExceptionItem[];
}

// ─── Messages & Automations Types ─────────────────────────────────────────────
export interface MessageAutomationItem {
  id?: string;
  _id?: string;
  code: string;
  title: string;
  group: "Request & quote" | "Booking & payment" | "Operations" | "Flight watch" | "Finance & other" | "Curator";
  triggerDescription: string;
  whenSchedule: string;
  scheduleDetail?: string;
  stopCondition?: string;
  quietHours?: string;
  approval?: string;
  appliesTo?: string;
  toRecipient: string;
  copyRecipient?: string;
  fallback?: string;
  language?: string;
  channel: string;
  status: boolean;
  textWhatsApp?: string;
  textEmailSubject?: string;
  textEmailBody?: string;
  textCuratorCopy?: string;
  metaStatus?: string;
  statsSent30d?: number;
  statsDelivered30d?: number;
  statsRead30d?: number;
  statsConversionRatePct?: number;
}

export interface MessageQueueItem {
  id?: string;
  _id?: string;
  automationCode: string;
  tripNumber: string;
  recipientName: string;
  recipientContact: string;
  channel: string;
  status: "due_now" | "scheduled" | "sent" | "failed";
  failureReason?: string;
  sentAt?: string;
  content: string;
  createdAt?: string;
}

export interface MessagesSummaryStats {
  dueNowCount: number;
  dueNowLabel: string;
  scheduled24hCount: number;
  scheduled24hLabel: string;
  sent7dCount: number;
  sent7dLabel: string;
  deliveryFailedCount: number;
  deliveryFailedLabel: string;
}

// ─── Curator Tiers & Token Types ──────────────────────────────────────────────
export interface CuratorTierRow {
  tier: string;
  handlesTrips: string;
  requestsRoutedTo: string;
  monthlyTokens: number;
  startupTokens: number;
  expiry: string;
  markupRange: string;
  handlingShare: string;
}

export interface CuratorTokenRules {
  pricePerToken: number;
  perRequest: string;
  afterSignature: string;
  earnedTokens: string;
  paidExpiry: string;
  bundles: string;
  freeRevisions: string;
  returnedConditions: string;
  orderOfUse: string;
  assignedLeads: string;
}

export interface CuratorDirectRouteConfig {
  bookingDeposit: number;
  depositTerms: string;
  assignmentRule: string;
  standardMarkupPct: number;
}

export interface CuratorTopUpEntry {
  curatorId: string;
  curatorName: string;
  tokensAdded: number;
  grantedBy: string;
  date: string;
}

export interface CuratorTierConfigData {
  tiers: CuratorTierRow[];
  tokenRules: CuratorTokenRules;
  directRoute: CuratorDirectRouteConfig;
  topUpHistory: CuratorTopUpEntry[];
}

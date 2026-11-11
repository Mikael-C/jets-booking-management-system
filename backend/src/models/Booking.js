const mongoose = require('mongoose');

const flightLegSchema = new mongoose.Schema({
  legNumber: { type: Number, default: 1 },
  from: { type: String, default: '' },
  fromIcao: { type: String, default: '', uppercase: true },
  fromCoords: {
    lat: Number,
    lng: Number,
  },
  to: { type: String, default: '' },
  toIcao: { type: String, default: '', uppercase: true },
  toCoords: {
    lat: Number,
    lng: Number,
  },
  origin: { type: mongoose.Schema.Types.Mixed, default: null },
  destination: { type: mongoose.Schema.Types.Mixed, default: null },
  departureDate: { type: String, default: '' },
  flightDate: { type: String, default: '' },
  departureTime: { type: String, default: '' },
  departureTimeLocal: { type: String, default: '' },
  arrivalTimeLocal: { type: String, default: '' },
  flightTimeFormatted: { type: String, default: '' },
  manualDurationMinutes: { type: Number, default: null },
  isDurationOverridden: { type: Boolean, default: false },
  departureTimeUtc: { type: String, default: '' },
  arrivalTimeUtc: { type: String, default: '' },
  originTz: { type: String, default: '' },
  destTz: { type: String, default: '' },
  tzDiffHours: { type: Number, default: null },
  flightNumber: { type: String, default: '' },
  aircraftRegistration: { type: String, default: '' },
  crew: { type: [mongoose.Schema.Types.Mixed], default: [] },
  passengers: { type: [mongoose.Schema.Types.Mixed], default: [] },
  departureHandling: { type: mongoose.Schema.Types.Mixed, default: null },
  arrivalHandling: { type: mongoose.Schema.Types.Mixed, default: null },
  paxCount: { type: Number, default: 2 },
  flightTimeMinutes: { type: Number, default: 0 },
  distanceNm: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  pets: { type: mongoose.Schema.Types.Mixed, default: null },
  luggage: { type: mongoose.Schema.Types.Mixed, default: null },
}, { _id: true, strict: false });

const clientDetailsSchema = new mongoose.Schema({
  fullName: { type: String, default: 'Private Client' },
  companyName: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  streetAddress: { type: String, default: '' },
  cityPostalCountry: { type: String, default: '' },
  vatNumber: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
}, { _id: false, strict: false });

const operatorDetailsSchema = new mongoose.Schema({
  companyName: { type: String, default: '' },
  legalEntity: { type: String, default: '' },
  legalName: { type: String, default: '' },
  tradingName: { type: String, default: '' },
  representativeName: { type: String, default: '' },
  aocNumber: { type: String, default: '' },
  salesEmail: { type: String, default: '' },
  supportEmail: { type: String, default: '' },
  opsPhone: { type: String, default: '' },
  supportPhone: { type: String, default: '' },
  baseIcao: { type: String, default: '' },
  vatNumber: { type: String, default: '' },
  iban: { type: String, default: '' },
  bic: { type: String, default: '' },
  bankName: { type: String, default: '' },
}, { _id: false, strict: false });

const pricingBreakdownSchema = new mongoose.Schema({
  currency: { type: String, default: 'EUR' },
  baseCharterCost: { type: Number, default: 0 },
  flightPrice: { type: Number, default: 0 },
  fuelSurcharge: { type: Number, default: 0 },
  landingFees: { type: Number, default: 0 },
  airportFees: { type: Number, default: 0 },
  handlingFees: { type: Number, default: 0 },
  cateringCost: { type: Number, default: 0 },
  crewCost: { type: Number, default: 0 },
  repositioningFee: { type: Number, default: 0 },
  passengerFees: { type: Number, default: 0 },
  dayOfWeekDiscount: { type: Number, default: 0 },
  inboundPassengerTax: { type: Number, default: 0 },
  outboundPassengerTax: { type: Number, default: 0 },
  additionalServicesCost: { type: Number, default: 0 },
  additionalServicesTotal: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  adminMargin: { type: Number, default: 0 },
  adminMarginPercentage: { type: Number, default: 0 },
  agentMargin: { type: Number, default: 0 },
  agentMarginPercentage: { type: Number, default: 0 },
  totalBeforeTax: { type: Number, default: 0 },
  vatRate: { type: Number, default: 0 },
  vatAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  totalFlightPrice: { type: Number, default: 0 },
  cardFee: { type: Number, default: 0 },
  cardFeePercentage: { type: Number, default: 0 },
  cardFeeAmount: { type: Number, default: 0 },
  totalWithCardFee: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
}, { _id: false, strict: false });

const additionalServicesSchema = new mongoose.Schema({
  catering: { type: Boolean, default: false },
  cateringDetails: { type: String, default: '' },
  vipCateringDetails: { type: String, default: '' },
  groundTransport: { type: Boolean, default: false },
  groundTransportDetails: { type: String, default: '' },
  limousineService: { type: Boolean, default: false },
  luxuryCarRental: { type: Boolean, default: false },
  helicopterService: { type: Boolean, default: false },
  flightAttendant: { type: Boolean, default: false },
  wifiOnboard: { type: Boolean, default: false },
  customSecurity: { type: Boolean, default: false },
  flowerArrangement: { type: Boolean, default: false },
  concierge: { type: Boolean, default: false },
  deicingInsurance: { type: String, default: 'none' },
  deicingCostPerLeg: { type: Number, default: 0 },
  carbonOffset: { type: String, default: 'neutral' },
  carbonOffsetRatePerHour: { type: Number, default: 33 },
  cancellationInsurance: { type: Boolean, default: false },
  customRequests: { type: String, default: '' },
  otherServices: { type: String, default: '' },
}, { _id: false, strict: false });

const checklistStepSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  completed: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: mongoose.Schema.Types.Mixed, default: null },
  completedBy: { type: String, default: '' },
  notes: { type: String, default: '' },
  requiredForDispatch: { type: Boolean, default: true },
  category: {
    type: String,
    default: 'pre_flight',
  },
}, { _id: false, strict: false });

const sourcingOptionSchema = new mongoose.Schema({
  id: { type: String },
  aircraftType: { type: String },
  registration: { type: String },
  aircraftRegistration: { type: String },
  operatorName: { type: String },
  operatorEmail: { type: String },
  baseAirport: { type: String, default: '' },
  priceQuoted: { type: Number },
  price: { type: Number },
  currency: { type: String, default: 'EUR' },
  flightTime: { type: String },
  taxesIncluded: { type: Boolean, default: true },
  validUntil: { type: String, default: '' },
  notes: { type: String, default: '' },
  source: { type: String, default: 'manual' },
  avinodeId: { type: String, default: '' },
  avInodeTripId: { type: String, default: '' },
  selected: { type: Boolean, default: false },
}, { _id: true, strict: false });

const manualServiceSchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String },
  description: { type: String },
  price: { type: Number },
  amount: { type: Number },
  currency: { type: String, default: 'EUR' },
}, { _id: true, strict: false });

const bookingSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    tripId: { type: String, default: '', index: true },
    quoteId: { type: String, default: '', index: true },
    bookingRevisionId: { type: String, default: '', index: true },
    isCancelled: { type: Boolean, default: false, index: true },
    cancellationReason: { type: String, default: '' },
    isBooked: { type: Boolean, default: false, index: true },
    supersededBy: { type: String, default: '' },
    tripNumber: { type: String, default: '', index: true },
    invoiceNumber: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    quoteReference: { type: String, default: '' },
    contractDate: { type: String, default: '' },
    quoteExpirationDate: { type: String, default: '' },
    paymentDueDate: { type: String, default: '' },
    status: {
      type: String,
      default: 'draft',
      index: true,
    },
    tripType: {
      type: String,
      default: 'one_way',
    },
    aircraft: { type: mongoose.Schema.Types.Mixed, default: {} },
    client: { type: clientDetailsSchema, default: {} },
    operator: { type: operatorDetailsSchema, default: {} },
    legs: { type: [flightLegSchema], default: [] },
    pricing: { type: pricingBreakdownSchema, default: {} },
    services: { type: additionalServicesSchema, default: {} },
    checklist: { type: [checklistStepSchema], default: [] },
    agentName: { type: String, default: '' },
    agentEmail: { type: String, default: '', index: true },
    commissionPercentage: { type: Number, default: 0 },
    quoteVersion: { type: Number, default: 1 },
    quoteStatus: {
      type: String,
      default: 'draft',
    },
    paymentStatus: {
      type: String,
      default: 'unpaid',
    },
    revisionAdjustments: { type: [mongoose.Schema.Types.Mixed], default: [] },
    creditNotes: { type: [mongoose.Schema.Types.Mixed], default: [] },
    paymentReason: { type: String, default: '' },
    paymentMethodChoice: {
      type: String,
      default: 'wire',
    },
    cardFeePercentage: { type: Number, default: 3.5 },
    cardFeeAmount: { type: Number, default: 0 },
    totalWithCardFee: { type: Number, default: 0 },
    adminMarginType: { type: String, default: 'percentage' },
    adminMarginValue: { type: Number, default: 0 },
    agentMarginType: { type: String, default: 'percentage' },
    agentMarginValue: { type: Number, default: 0 },
    manualServices: { type: [manualServiceSchema], default: [] },
    sourcingOptions: { type: [sourcingOptionSchema], default: [] },
    avInodeTripId: { type: String, default: '' },
    notes: { type: String, default: '' },
    internalNotes: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: String, default: null },
    pdfUrls: {
      quotation: { type: String, default: '' },
      invoice: { type: String, default: '' },
      flightBrief: { type: String, default: '' },
      charterAgreement: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    strict: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

bookingSchema.index({ status: 1, isDeleted: 1 });
bookingSchema.index({ agentEmail: 1, isDeleted: 1 });
bookingSchema.index({ 'client.email': 1 });
bookingSchema.index({ createdAt: -1 });

// Virtual: total pax across all legs
bookingSchema.virtual('totalPax').get(function () {
  if (!this.legs || this.legs.length === 0) return 0;
  return Math.max(...this.legs.map((l) => l.paxCount || 1));
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;

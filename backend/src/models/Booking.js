const mongoose = require('mongoose');

const flightLegSchema = new mongoose.Schema({
  from: { type: String, required: true },
  fromIcao: { type: String, required: true, uppercase: true },
  fromCoords: {
    lat: Number,
    lng: Number,
  },
  to: { type: String, required: true },
  toIcao: { type: String, required: true, uppercase: true },
  toCoords: {
    lat: Number,
    lng: Number,
  },
  departureDate: { type: String, required: true },
  departureTime: { type: String, default: '' },
  paxCount: { type: Number, required: true, min: 1 },
  flightTimeMinutes: { type: Number, default: 0 },
  distanceNm: { type: Number, default: 0 },
  notes: { type: String, default: '' },
}, { _id: true });

const clientDetailsSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  companyName: { type: String, default: '' },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  vatNumber: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
}, { _id: false });

const operatorDetailsSchema = new mongoose.Schema({
  legalName: { type: String, default: '' },
  tradingName: { type: String, default: '' },
  aocNumber: { type: String, default: '' },
  salesEmail: { type: String, default: '' },
  opsPhone: { type: String, default: '' },
  baseIcao: { type: String, default: '' },
}, { _id: false });

const pricingBreakdownSchema = new mongoose.Schema({
  currency: { type: String, default: 'USD' },
  baseCharterCost: { type: Number, default: 0 },
  fuelSurcharge: { type: Number, default: 0 },
  landingFees: { type: Number, default: 0 },
  handlingFees: { type: Number, default: 0 },
  cateringCost: { type: Number, default: 0 },
  crewCost: { type: Number, default: 0 },
  repositioningFee: { type: Number, default: 0 },
  additionalServicesCost: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  adminMargin: { type: Number, default: 0 },
  adminMarginPercentage: { type: Number, default: 0 },
  agentMargin: { type: Number, default: 0 },
  agentMarginPercentage: { type: Number, default: 0 },
  totalBeforeTax: { type: Number, default: 0 },
  vatRate: { type: Number, default: 0 },
  vatAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  cardFee: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
}, { _id: false });

const additionalServicesSchema = new mongoose.Schema({
  catering: { type: Boolean, default: false },
  cateringDetails: { type: String, default: '' },
  groundTransport: { type: Boolean, default: false },
  groundTransportDetails: { type: String, default: '' },
  flightAttendant: { type: Boolean, default: false },
  wifiOnboard: { type: Boolean, default: false },
  customSecurity: { type: Boolean, default: false },
  flowerArrangement: { type: Boolean, default: false },
  concierge: { type: Boolean, default: false },
  otherServices: { type: String, default: '' },
}, { _id: false });

const checklistStepSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  completedBy: { type: String, default: '' },
  category: {
    type: String,
    enum: ['pre_flight', 'documentation', 'passenger', 'crew', 'payment', 'post_flight'],
    default: 'pre_flight',
  },
}, { _id: false });

const sourcingOptionSchema = new mongoose.Schema({
  id: { type: String },
  aircraftType: { type: String },
  registration: { type: String },
  operatorName: { type: String },
  operatorEmail: { type: String },
  priceQuoted: { type: Number },
  currency: { type: String, default: 'USD' },
  flightTime: { type: String },
  notes: { type: String, default: '' },
  source: { type: String, enum: ['avinode', 'manual', 'direct'], default: 'manual' },
  avinodeId: { type: String, default: '' },
  selected: { type: Boolean, default: false },
}, { _id: true });

const manualServiceSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
}, { _id: true });

const bookingSchema = new mongoose.Schema(
  {
    tripNumber: { type: String, required: true, unique: true, index: true },
    invoiceNumber: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    contractDate: { type: String, default: '' },
    quoteExpirationDate: { type: String, default: '' },
    paymentDueDate: { type: String, default: '' },
    status: {
      type: String,
      enum: [
        'draft', 'submitted', 'in_sourcing', 'quoted', 'quote_sent', 'client_review',
        'accepted', 'paid', 'confirmed', 'dispatched', 'in_flight', 'flown',
        'completed', 'cancelled', 'expired',
      ],
      default: 'draft',
      index: true,
    },
    tripType: {
      type: String,
      enum: ['one_way', 'round_trip', 'multi_leg'],
      required: true,
    },
    aircraft: {
      id: String,
      name: String,
      manufacturer: String,
      category: { type: String, enum: ['light', 'midsize', 'super-midsize', 'large', 'ultra-long-range'] },
      registration: String,
      passengers: Number,
      range: Number,
      pricePerHour: Number,
      cruiseSpeedKtas: Number,
      imageExterior: String,
      imageInterior: String,
    },
    client: { type: clientDetailsSchema, required: true },
    operator: { type: operatorDetailsSchema, default: {} },
    legs: { type: [flightLegSchema], required: true, validate: v => v.length > 0 },
    pricing: { type: pricingBreakdownSchema, default: {} },
    services: { type: additionalServicesSchema, default: {} },
    checklist: { type: [checklistStepSchema], default: [] },
    agentName: { type: String, default: '' },
    agentEmail: { type: String, default: '', index: true },
    commissionPercentage: { type: Number, default: 0 },
    quoteVersion: { type: Number, default: 1 },
    quoteStatus: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'declined', 'expired'],
      default: 'draft',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid', 'refunded', 'credited'],
      default: 'unpaid',
    },
    paymentMethodChoice: {
      type: String,
      enum: ['bank_transfer', 'credit_card', 'crypto', 'other'],
      default: 'bank_transfer',
    },
    adminMarginType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    adminMarginValue: { type: Number, default: 0 },
    agentMarginType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

bookingSchema.index({ status: 1, isDeleted: 1 });
bookingSchema.index({ agentEmail: 1, isDeleted: 1 });
bookingSchema.index({ 'client.email': 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ 'legs.departureDate': 1 });

// Virtual: total pax across all legs
bookingSchema.virtual('totalPax').get(function () {
  if (!this.legs || this.legs.length === 0) return 0;
  return Math.max(...this.legs.map((l) => l.paxCount));
});

// Auto-generate trip number before validation
bookingSchema.pre('validate', async function (next) {
  if (this.isNew && !this.tripNumber) {
    const { generateTripNumber } = require('../utils/generateId');
    this.tripNumber = await generateTripNumber();
  }
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;

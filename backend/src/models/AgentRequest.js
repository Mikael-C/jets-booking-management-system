const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const requestMessageSchema = new mongoose.Schema({
  id: { type: String },
  sender: { type: String, required: true },
  senderRole: {
    type: String,
    enum: ['super_admin', 'admin', 'finance', 'operations', 'agent', 'system'],
    default: 'agent',
  },
  senderEmail: { type: String },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  attachments: [{ name: String, url: String, type: String }],
}, { _id: true });

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

const agentRequestSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    requestNumber: { type: String, unique: true, index: true },
    tripId: { type: String, default: '', index: true },
    quoteGroupId: { type: String, default: '', index: true },
    type: {
      type: String,
      enum: ['quote', 'flight_brief', 'invoice'],
      required: true,
    },
    title: { type: String, required: true },
    agentName: { type: String, required: true },
    agentEmail: { type: String, required: true, index: true },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientPhone: { type: String, default: '' },
    companyName: { type: String, default: '' },
    clientAddress: { type: String, default: '' },
    clientCityCountry: { type: String, default: '' },
    clientVatNumber: { type: String, default: '' },
    route: { type: String, required: true },
    originIcao: { type: String, uppercase: true, required: true },
    destIcao: { type: String, uppercase: true, required: true },
    flightDate: { type: String, required: true },
    returnDate: { type: String, default: '' },
    departureTime: { type: String, default: '' },
    paxCount: { type: Number, required: true, min: 1 },
    tripType: {
      type: String,
      enum: ['one_way', 'round_trip', 'multi_leg'],
      default: 'one_way',
    },
    aircraftCategory: {
      type: String,
      enum: ['light', 'midsize', 'super-midsize', 'large', 'ultra-long-range', 'any'],
      default: 'any',
    },
    preferredAircraft: { type: String, default: '' },
    budgetNotes: { type: String, default: '' },
    budget: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ['pending', 'in_sourcing', 'processing', 'completed', 'declined'],
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['normal', 'urgent', 'vip'],
      default: 'normal',
      index: true,
    },
    sourcingOptions: { type: [sourcingOptionSchema], default: [] },
    messages: { type: [requestMessageSchema], default: [] },
    assignedTo: { type: String, default: '' },
    assignedToEmail: { type: String, default: '' },
    avInodeTripId: { type: String, default: '' },
    notes: { type: String, default: '' },
    luggageCount: { type: Number, default: 0 },
    hasPets: { type: Boolean, default: false },
    specialNeeds: { type: String, default: '' },
    isFlexibleTime: { type: Boolean, default: false },
    limousineService: { type: Boolean, default: false },
    luxuryCarRental: { type: Boolean, default: false },
    helicopterService: { type: Boolean, default: false },
    deicingInsurance: { type: String, default: 'none' },
    carbonOffset: { type: String, default: 'none' },
    cancellationInsurance: { type: Boolean, default: false },
    internalNotes: { type: String, default: '' },
    fulfilledBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    additionalLegs: [
      {
        originIcao: String,
        destIcao: String,
        flightDate: String,
        departureTime: String,
        paxCount: Number,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

agentRequestSchema.index({ status: 1, priority: 1 });
agentRequestSchema.index({ agentEmail: 1, status: 1 });
agentRequestSchema.index({ createdAt: -1 });

agentRequestSchema.pre('validate', async function (next) {
  if (this.isNew && !this.id) this.id = `request-${randomUUID()}`;
  if (this.isNew && !this.requestNumber) {
    const { generateRequestNumber } = require('../utils/generateId');
    this.requestNumber = await generateRequestNumber();
  }
  next();
});

const AgentRequest = mongoose.model('AgentRequest', agentRequestSchema);
module.exports = AgentRequest;

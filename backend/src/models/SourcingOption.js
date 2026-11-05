const mongoose = require('mongoose');

const sourcingOptionSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AgentRequest',
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      index: true,
    },
    aircraftType: { type: String, required: true },
    registration: { type: String, default: '' },
    manufacturer: { type: String, default: '' },
    category: {
      type: String,
      enum: ['light', 'midsize', 'super-midsize', 'large', 'ultra-long-range'],
      default: 'midsize',
    },
    operatorName: { type: String, required: true },
    operatorEmail: { type: String, default: '' },
    operatorAoc: { type: String, default: '' },
    priceQuoted: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    flightTime: { type: String, default: '' },
    flightTimeMinutes: { type: Number, default: 0 },
    passengers: { type: Number, default: 0 },
    source: {
      type: String,
      enum: ['avinode', 'manual', 'direct'],
      default: 'manual',
    },
    avinodeId: { type: String, default: '' },
    selected: { type: Boolean, default: false, index: true },
    notes: { type: String, default: '' },
    includedServices: [String],
    excludedServices: [String],
    validUntil: { type: Date, default: null },
    respondedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const SourcingOption = mongoose.model('SourcingOption', sourcingOptionSchema);
module.exports = SourcingOption;

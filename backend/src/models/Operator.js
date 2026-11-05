const mongoose = require('mongoose');

const qualDocSchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String, default: '' },
  docType: { type: String, default: '' },
  status: {
    type: String,
    default: 'pending',
  },
  expiryDate: { type: String, default: '' },
  documentUrl: { type: String, default: '' },
  notes: { type: String, default: '' },
  verifiedAt: { type: Date, default: null },
  verifiedBy: { type: String, default: '' },
}, { _id: true });

const operatorSchema = new mongoose.Schema(
  {
    legalName: { type: String, required: true, trim: true },
    tradingName: { type: String, default: '', trim: true },
    aocNumber: { type: String, default: '', index: true },
    aocAuthority: { type: String, default: '' },
    aocExpiry: { type: String, default: '' },
    baseIcao: { type: String, default: '', uppercase: true },
    salesContact: { type: String, default: '' },
    salesEmail: { type: String, default: '', lowercase: true },
    opsPhone: { type: String, default: '' },
    opsEmail: { type: String, default: '', lowercase: true },
    website: { type: String, default: '' },
    country: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'approved_with_conditions', 'suspended', 'rejected'],
      default: 'pending',
      index: true,
    },
    insuranceExpiry: { type: String, default: '' },
    insuranceCoverage: { type: Number, default: 0 },
    safetyRating: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },
    safetyRatingProvider: { type: String, default: '' },
    isArgusRated: { type: Boolean, default: false },
    isWyvernRated: { type: Boolean, default: false },
    isIsBaoRegistered: { type: Boolean, default: false },
    qualificationChecklist: { type: [qualDocSchema], default: [] },
    notes: { type: String, default: '' },
    internalNotes: { type: String, default: '' },
    tags: [String],
    avinodeId: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

operatorSchema.index({ legalName: 'text', tradingName: 'text', aocNumber: 'text' });
operatorSchema.index({ aocExpiry: 1 });
operatorSchema.index({ insuranceExpiry: 1 });

const Operator = mongoose.model('Operator', operatorSchema);
module.exports = Operator;

const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    accountNumber: {
      type: String,
      unique: true,
      index: true,
    },
    fullName: { type: String, required: true, trim: true },
    companyName: { type: String, default: '', trim: true },
    streetAddress: { type: String, default: '' },
    cityPostalCountry: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    vatNumber: { type: String, default: '' },
    totalBookings: { type: Number, default: 0 },
    totalSpend: { type: Number, default: 0 },
    vipTier: {
      type: String,
      enum: ['Ultra HNWI', 'Corporate Executive', 'Family Office', 'Private VIP', 'Standard'],
      default: 'Standard',
    },
    preferredJetCategory: {
      type: String,
      enum: ['light', 'midsize', 'super-midsize', 'large', 'ultra-long-range', 'any'],
      default: 'any',
    },
    notes: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    tags: [String],
    lastBookingDate: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

clientSchema.index({ fullName: 'text', companyName: 'text', email: 'text' });
clientSchema.index({ vipTier: 1 });

clientSchema.pre('validate', async function (next) {
  if (this.isNew && !this.accountNumber) {
    const { generateAccountNumber } = require('../utils/generateId');
    this.accountNumber = await generateAccountNumber();
  }
  next();
});

const Client = mongoose.model('Client', clientSchema);
module.exports = Client;

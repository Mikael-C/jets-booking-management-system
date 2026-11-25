const mongoose = require('mongoose');

/**
 * Settings · Taxes (R-091). One row per rule, kept by the tax adviser.
 *
 *  jurisdiction  country name ("France", "United States") or "International"
 *  type          VAT | US_FET | EXEMPT | OUTSIDE_SCOPE
 *  appliesTo     domestic (departure and arrival in this country)
 *                international (any leg between two countries)
 *                segment (per passenger per domestic leg, e.g. US segment fee)
 *  rateType      percent | per_pax
 *  rate          percent (10 = 10 %) or an amount per passenger
 *  status        confirmed | to_confirm  — a row "to confirm" is never used on a live document
 *  A rate change is a new row with a later effectiveFrom; issued quotes keep their own rates.
 */
const changeSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    by: { type: String, default: '' },
    what: { type: String, default: '' },
  },
  { _id: false }
);

const taxRuleSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    jurisdiction: { type: String, required: true, trim: true },
    type: { type: String, enum: ['VAT', 'US_FET', 'EXEMPT', 'OUTSIDE_SCOPE'], default: 'VAT' },
    appliesTo: { type: String, enum: ['domestic', 'international', 'segment', 'any'], default: 'domestic' },
    rateType: { type: String, enum: ['percent', 'per_pax'], default: 'percent' },
    rate: { type: Number, default: 0 },
    currency: { type: String, default: '' },
    effectiveFrom: { type: String, default: '' },
    effectiveTo: { type: String, default: '' },
    wording: { type: String, default: '' },
    status: { type: String, enum: ['confirmed', 'to_confirm'], default: 'to_confirm' },
    source: { type: String, default: '' },
    notes: { type: String, default: '' },
    history: { type: [changeSchema], default: [] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TaxRule', taxRuleSchema);

const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    prefix: { type: String, default: '' },
    firstName: { type: String, default: '' },
    middleName1: { type: String, default: '' },
    middleName2: { type: String, default: '' },
    lastName1: { type: String, default: '' },
    lastName2: { type: String, default: '' },
    suffix: { type: String, default: '' },
    title: { type: String, default: '' },
    fullName: { type: String, default: '' },
    email: { type: String, default: '', lowercase: true, trim: true },
    phone: { type: String, default: '' },
    country: { type: String, default: '' },
    gender: { type: String, default: 'Other' },
    weightKg: { type: Number, default: 0 },
    associatedAccountId: { type: String, default: '' },
    associatedAccountName: { type: String, default: '' },
    isAgent: { type: Boolean, default: false },
    bioIdType: { type: String, default: 'passport' },
    passportDetails: { type: mongoose.Schema.Types.Mixed, default: null },
    idDetails: { type: mongoose.Schema.Types.Mixed, default: null },
    visaDetails: { type: mongoose.Schema.Types.Mixed, default: null },
    pets: { type: [mongoose.Schema.Types.Mixed], default: [] },
    tripsFlown: { type: [String], default: [] },
    notes: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true, strict: false, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

contactSchema.index({ email: 1 });
contactSchema.index({ 'passportDetails.passportNumber': 1 }, { sparse: true });
contactSchema.index({ firstName: 1, lastName1: 1, lastName2: 1 });

module.exports = mongoose.model('Contact', contactSchema);

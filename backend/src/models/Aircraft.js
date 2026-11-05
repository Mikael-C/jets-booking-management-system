const mongoose = require('mongoose');

const aircraftSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    manufacturer: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['light', 'midsize', 'super-midsize', 'large', 'ultra-long-range'],
      required: true,
      index: true,
    },
    registration: { type: String, default: '', uppercase: true, index: true },
    model: { type: String, default: '' },
    yearManufactured: { type: Number, default: null },
    passengers: { type: Number, required: true, min: 1 },
    range: { type: Number, required: true }, // nautical miles
    cruiseSpeedKtas: { type: Number, default: 450 }, // knots true airspeed
    maxAltitudeFt: { type: Number, default: 51000 },
    engineType: { type: String, default: '' },
    engineCount: { type: Number, default: 2 },
    pricePerHour: { type: Number, required: true, min: 0 },
    toilette: { type: Boolean, default: true },
    smokingCabin: { type: Boolean, default: false },
    wifiOnboard: { type: Boolean, default: false },
    microwave: { type: Boolean, default: false },
    satPhone: { type: Boolean, default: false },
    entertainmentSystem: { type: Boolean, default: false },
    baggageCapacityCuFt: { type: Number, default: 0 },
    imageExterior: { type: String, default: '' },
    imageInterior: { type: String, default: '' },
    additionalImages: [String],
    cloudinaryPublicIds: [String],
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Operator',
      default: null,
    },
    avinodeAircraftId: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true, index: true },
    homeBase: { type: String, default: '' },
    homeBaseIcao: { type: String, default: '', uppercase: true },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

aircraftSchema.index({ category: 1, isAvailable: 1 });
aircraftSchema.index({ name: 'text', manufacturer: 'text', registration: 'text' });

const Aircraft = mongoose.model('Aircraft', aircraftSchema);
module.exports = Aircraft;

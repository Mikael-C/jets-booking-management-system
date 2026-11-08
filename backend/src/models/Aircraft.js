const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  thumb: { type: String, default: '' },
  alt: { type: String, default: '' },
  type: {
    type: String,
    enum: ['exterior', 'interior', 'cabin', 'cockpit', 'bathroom', 'galley', 'detail', 'other'],
    default: 'exterior',
  },
  source: { type: String, default: '' },   // 'unsplash', 'pexels', 'cloudinary', 'custom'
  credit: { type: String, default: '' },   // photographer name
  creditUrl: { type: String, default: '' },
}, { _id: false });

const aircraftSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    manufacturer: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'turboprop',
        'piston',
        'entry-level',
        'light',
        'super-light',
        'midsize',
        'super-midsize',
        'heavy',
        'ultra-long-range',
        'vip-airliner',
      ],
      required: true,
      index: true,
    },
    categoryLabel: { type: String, default: '' },
    tagline: { type: String, default: '' },
    description: { type: String, default: '' },
    registration: { type: String, default: '', uppercase: true, index: true },
    model: { type: String, default: '' },
    yearManufactured: { type: Number, default: null },
    yearRefurbished: { type: Number, default: null },
    passengers: { type: Number, required: true, min: 1 },
    passengersLabel: { type: String, default: '' },
    range: { type: Number, required: true }, // nautical miles
    rangeLabel: { type: String, default: '' },
    cruiseSpeedKtas: { type: Number, default: 450 },
    cruiseSpeedLabel: { type: String, default: '' },
    maxAltitudeFt: { type: Number, default: 51000 },
    cabinHeightM: { type: String, default: '' },
    cabinWidthM: { type: String, default: '' },
    cabinLengthM: { type: String, default: '' },
    baggageVolumeCuFt: { type: Number, default: 0 },
    engineType: { type: String, default: '' },
    engineCount: { type: Number, default: 2 },
    pricePerHour: { type: Number, required: true, min: 0 },
    priceLabel: { type: String, default: '' },
    // Amenities
    toilette: { type: Boolean, default: false },
    fullStandupCabin: { type: Boolean, default: false },
    privateBedroom: { type: Boolean, default: false },
    showerOnboard: { type: Boolean, default: false },
    smokingCabin: { type: Boolean, default: false },
    wifiOnboard: { type: Boolean, default: false },
    microwave: { type: Boolean, default: false },
    fullGalley: { type: Boolean, default: false },
    satPhone: { type: Boolean, default: false },
    entertainmentSystem: { type: Boolean, default: false },
    sleepingBeds: { type: Number, default: 0 },
    // Images
    imageExterior: { type: String, default: '' },
    imageInterior: { type: String, default: '' },
    images: { type: [imageSchema], default: [] },
    additionalImages: [String],
    cloudinaryPublicIds: [String],
    // Relations
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

aircraftSchema.virtual('primaryExterior').get(function () {
  const img = this.images.find(i => i.type === 'exterior');
  return img ? img.url : this.imageExterior;
});

aircraftSchema.virtual('primaryInterior').get(function () {
  const img = this.images.find(i => i.type === 'interior' || i.type === 'cabin');
  return img ? img.url : this.imageInterior;
});

aircraftSchema.virtual('cabinHeight').get(function () {
  return this.cabinHeightM || '';
});

aircraftSchema.virtual('cabinWidth').get(function () {
  return this.cabinWidthM || '';
});

aircraftSchema.virtual('baggageVolume').get(function () {
  return this.baggageVolumeCuFt ? `${this.baggageVolumeCuFt} cu ft` : '';
});

aircraftSchema.virtual('cruiseSpeed').get(function () {
  return this.cruiseSpeedKtas ? `${this.cruiseSpeedKtas} ktas` : '';
});

aircraftSchema.virtual('yearOfManufacture').get(function () {
  return this.yearManufactured || '';
});

aircraftSchema.virtual('yearOfRefurbishment').get(function () {
  return this.yearRefurbished || '';
});

aircraftSchema.index({ category: 1, isAvailable: 1 });
aircraftSchema.index({ name: 'text', manufacturer: 'text', registration: 'text' });

const Aircraft = mongoose.model('Aircraft', aircraftSchema);
module.exports = Aircraft;

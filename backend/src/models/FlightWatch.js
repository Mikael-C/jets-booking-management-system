const mongoose = require('mongoose');

const flightWatchSchema = new mongoose.Schema({
  tripNumber: { type: String, required: true, index: true }, // e.g. FE4578-005
  bookingId: { type: String, default: '' },
  aircraft: {
    registration: { type: String, default: 'D-IOBA' },
    type: { type: String, default: 'Phenom 300E' },
    operator: { type: String, default: 'Air Alsie' },
  },
  route: {
    fromIcao: { type: String, default: 'LEIB' },
    fromCity: { type: String, default: 'Ibiza' },
    toIcao: { type: String, default: 'LSGG' },
    toCity: { type: String, default: 'Geneva' },
    waypoints: [{ lat: Number, lng: Number, name: String }],
  },
  schedule: {
    scheduledOffUtc: { type: String, default: '08:30' },
    scheduledOnUtc: { type: String, default: '10:05' },
    actualOffUtc: { type: String, default: '' },
    actualOnUtc: { type: String, default: '' },
    estimatedOnUtc: { type: String, default: '' },
  },
  telemetry: {
    altitude: { type: String, default: 'FL410' },
    speedKts: { type: Number, default: 420 },
    heading: { type: Number, default: 45 },
    currentLat: { type: Number, default: 42.1 },
    currentLng: { type: Number, default: 4.8 },
    distanceRemainingKm: { type: Number, default: 210 },
    squawk: { type: String, default: '4521' },
    progressPct: { type: Number, default: 65 },
  },
  status: {
    type: String,
    enum: ['airborne_on_time', 'airborne_delayed', 'boarding', 'delayed', 'scheduled', 'landed'],
    default: 'scheduled',
  },
  statusLabel: { type: String, default: 'Scheduled' }, // e.g. 'Airborne · on time'
  nowDescription: { type: String, default: 'FL410 · 210 km to go' },
  delayMinutes: { type: Number, default: 0 },
  delayReason: { type: String, default: '' },
  messagesSummary: { type: String, default: '—' },
  alerts: [{
    time: { type: String, default: '08:52' },
    message: { type: String, default: '' },
    tag: { type: String, default: '' },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' },
    dutyOfficerNotified: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  }],
  liveLinkToken: { type: String, default: '' },
  liveLinkExpiresAt: { type: Date, default: null },
  isWatched: { type: Boolean, default: true },
  lastAdsBUpdate: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

module.exports = mongoose.model('FlightWatch', flightWatchSchema);

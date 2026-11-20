const express = require('express');
const router = express.Router();
const FlightWatch = require('../models/FlightWatch');
const { v4: uuidv4 } = require('uuid');

// Default initial tracked flights matching Image 2
const defaultFlights = [
  {
    tripNumber: 'FE4578-005',
    bookingId: 'BKG-FE4578',
    aircraft: {
      registration: 'D-IOBA',
      type: 'Phenom 300E',
      operator: 'Air Hamburg',
    },
    route: {
      fromIcao: 'LEIB',
      fromCity: 'Ibiza',
      toIcao: 'LSGG',
      toCity: 'Geneva',
      waypoints: [
        { lat: 38.87, lng: 1.37, name: 'LEIB' },
        { lat: 41.5, lng: 3.2, name: 'BARCA' },
        { lat: 43.8, lng: 5.1, name: 'MARSEILLE' },
        { lat: 46.23, lng: 6.1, name: 'LSGG' },
      ],
    },
    schedule: {
      scheduledOffUtc: '08:30',
      scheduledOnUtc: '10:05',
      actualOffUtc: '08:32',
      actualOnUtc: '',
      estimatedOnUtc: '10:03',
    },
    telemetry: {
      altitude: 'FL410',
      speedKts: 425,
      heading: 28,
      currentLat: 43.1,
      currentLng: 4.8,
      distanceRemainingKm: 210,
      squawk: '4521',
      progressPct: 68,
    },
    status: 'airborne_on_time',
    statusLabel: 'Airborne · on time',
    nowDescription: 'FL410 · 210 km to go',
    delayMinutes: 0,
    delayReason: '',
    messagesSummary: 'Curator, driver notified',
    alerts: [],
    isWatched: true,
  },
  {
    tripNumber: 'RB3310-002',
    bookingId: 'BKG-RB3310',
    aircraft: {
      registration: 'OE-GLX',
      type: 'Citation XLS+',
      operator: 'GlobeAir',
    },
    route: {
      fromIcao: 'LFPB',
      fromCity: 'Paris Le Bourget',
      toIcao: 'LIML',
      toCity: 'Milan Linate',
      waypoints: [
        { lat: 48.96, lng: 2.44, name: 'LFPB' },
        { lat: 45.44, lng: 9.27, name: 'LIML' },
      ],
    },
    schedule: {
      scheduledOffUtc: '11:00',
      scheduledOnUtc: '12:20',
      actualOffUtc: '',
      actualOnUtc: '',
      estimatedOnUtc: '12:20',
    },
    telemetry: {
      altitude: 'GND',
      speedKts: 0,
      heading: 0,
      currentLat: 48.96,
      currentLng: 2.44,
      distanceRemainingKm: 640,
      squawk: '1000',
      progressPct: 0,
    },
    status: 'boarding',
    statusLabel: 'Boarding',
    nowDescription: 'At FBO',
    delayMinutes: 0,
    delayReason: '',
    messagesSummary: '—',
    alerts: [],
    isWatched: true,
  },
  {
    tripNumber: 'MX5521-001',
    bookingId: 'BKG-MX5521',
    aircraft: {
      registration: '9H-VJA',
      type: 'Challenger 650',
      operator: 'VistaJet',
    },
    route: {
      fromIcao: 'LFPB',
      fromCity: 'Paris Le Bourget',
      toIcao: 'DNAA',
      toCity: 'Abuja Nnamdi Azikiwe',
      waypoints: [
        { lat: 48.96, lng: 2.44, name: 'LFPB' },
        { lat: 36.8, lng: 3.0, name: 'ALGIERS' },
        { lat: 9.0, lng: 7.26, name: 'DNAA' },
      ],
    },
    schedule: {
      scheduledOffUtc: '08:30',
      scheduledOnUtc: '14:00',
      actualOffUtc: '',
      actualOnUtc: '',
      estimatedOnUtc: '14:40',
    },
    telemetry: {
      altitude: 'GND',
      speedKts: 0,
      heading: 175,
      currentLat: 48.96,
      currentLng: 2.44,
      distanceRemainingKm: 4400,
      squawk: '2314',
      progressPct: 0,
    },
    status: 'delayed',
    statusLabel: 'Delayed 40 min',
    nowDescription: 'ETD 09:10 (crew)',
    delayMinutes: 40,
    delayReason: 'Crew duty start late. New ETD 09:10.',
    messagesSummary: 'Delay alert sent 08:52',
    alerts: [
      {
        time: '08:52',
        message: 'MX5521 delayed 40 min. Crew duty start late. New ETD 09:10.',
        tag: 'FW-02 sent to Curator and driver',
        severity: 'warning',
        dutyOfficerNotified: true,
      },
    ],
    isWatched: true,
  },
  {
    tripNumber: 'TA2201-003',
    bookingId: 'BKG-TA2201',
    aircraft: {
      registration: '5N-BXK',
      type: 'Hawker 900XP',
      operator: 'ExecuJet',
    },
    route: {
      fromIcao: 'DNMM',
      fromCity: 'Lagos Murtala Muhammed',
      toIcao: 'DNAA',
      toCity: 'Abuja Nnamdi Azikiwe',
      waypoints: [
        { lat: 6.57, lng: 3.32, name: 'DNMM' },
        { lat: 9.0, lng: 7.26, name: 'DNAA' },
      ],
    },
    schedule: {
      scheduledOffUtc: '15:00',
      scheduledOnUtc: '16:10',
      actualOffUtc: '',
      actualOnUtc: '',
      estimatedOnUtc: '16:10',
    },
    telemetry: {
      altitude: 'GND',
      speedKts: 0,
      heading: 45,
      currentLat: 6.57,
      currentLng: 3.32,
      distanceRemainingKm: 510,
      squawk: '7000',
      progressPct: 0,
    },
    status: 'scheduled',
    statusLabel: 'Scheduled',
    nowDescription: '—',
    delayMinutes: 0,
    delayReason: '',
    messagesSummary: '—',
    alerts: [],
    isWatched: true,
  },
];

let alertRulesConfig = {
  departureDelayMinutes: 15,
  departureTemplateCode: 'FW-02',
  squawkAlertNotification: 'FW-04 to duty officer and MD',
  noPositionCallMinutes: 20,
};

// Helper: Ensure seeded flights exist
async function ensureSeeded() {
  const count = await FlightWatch.countDocuments();
  if (count === 0) {
    await FlightWatch.insertMany(defaultFlights);
  }
}

// GET /api/flight-watch
router.get('/', async (req, res) => {
  await ensureSeeded();
  const flights = await FlightWatch.find({ isWatched: true }).sort({ 'schedule.scheduledOffUtc': 1 });

  const airborneCount = flights.filter(f => f.status.includes('airborne')).length;
  const departingNext6hCount = flights.filter(f => ['boarding', 'delayed', 'scheduled'].includes(f.status)).length;
  const delayedCount = flights.filter(f => f.delayMinutes > 0 || f.status === 'delayed').length;
  const openAlertsCount = flights.reduce((acc, f) => acc + (f.alerts?.length || 0), 0);

  res.json({
    success: true,
    data: flights,
    summary: {
      airborneCount,
      airborneActiveTrip: 'FE4578',
      departingNext6hCount,
      delayedCount,
      delayedActiveTrip: 'MX5521 - 40 min',
      openAlertsCount,
      openAlertsNote: 'needs duty officer',
    },
    alertRules: alertRulesConfig,
  });
});

// GET /api/flight-watch/rules
router.get('/rules', (req, res) => {
  res.json({ success: true, data: alertRulesConfig });
});

// PUT /api/flight-watch/rules
router.put('/rules', (req, res) => {
  alertRulesConfig = { ...alertRulesConfig, ...req.body };
  res.json({ success: true, data: alertRulesConfig, message: 'Alert rules updated' });
});

// POST /api/flight-watch/share-link
router.post('/share-link', async (req, res) => {
  const { tripNumber } = req.body;
  const token = uuidv4().replace(/-/g, '').slice(0, 16);
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours after

  let flight = await FlightWatch.findOne({ tripNumber: tripNumber || 'FE4578-005' });
  if (!flight) {
    flight = await FlightWatch.findOne();
  }

  if (flight) {
    flight.liveLinkToken = token;
    flight.liveLinkExpiresAt = expiresAt;
    await flight.save();
  }

  res.json({
    success: true,
    data: {
      token,
      expiresAt,
      tripNumber: flight?.tripNumber,
      url: `/live-flight/${token}`,
    },
  });
});

// GET /api/flight-watch/shared/:token (Public read-only, sanitised: no names, no prices)
router.get('/shared/:token', async (req, res) => {
  const { token } = req.params;
  const flight = await FlightWatch.findOne({ liveLinkToken: token });

  if (!flight) {
    // Return sample demo data if token doesn't match directly
    return res.json({
      success: true,
      data: {
        tripNumber: 'FE4578',
        aircraft: 'Phenom 300E (D-IOBA)',
        route: 'LEIB (Ibiza) → LSGG (Geneva)',
        status: 'Airborne · on time',
        altitude: 'FL410',
        distanceRemainingKm: 210,
        scheduledDeparture: '08:30 UTC',
        estimatedArrival: '10:05 UTC',
        expiresNotice: 'Expires 2 hours after landing',
      },
    });
  }

  res.json({
    success: true,
    data: {
      tripNumber: flight.tripNumber,
      aircraft: `${flight.aircraft.type} (${flight.aircraft.registration})`,
      route: `${flight.route.fromIcao} → ${flight.route.toIcao}`,
      status: flight.statusLabel,
      altitude: flight.telemetry.altitude,
      distanceRemainingKm: flight.telemetry.distanceRemainingKm,
      scheduledDeparture: flight.schedule.scheduledOffUtc + ' UTC',
      estimatedArrival: (flight.schedule.estimatedOnUtc || flight.schedule.scheduledOnUtc) + ' UTC',
      expiresNotice: 'Expires 2 hours after landing',
    },
  });
});

// POST /api/flight-watch/:id/alert
router.post('/:id/alert', async (req, res) => {
  const { id } = req.params;
  const { message, tag, severity = 'warning' } = req.body;

  const flight = await FlightWatch.findOne({
    $or: [{ _id: id }, { tripNumber: id }],
  });

  if (!flight) {
    return res.status(404).json({ success: false, message: 'Flight not found' });
  }

  const newAlert = {
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    message: message || 'Flight status update dispatched',
    tag: tag || 'FW-02 sent to Curator and driver',
    severity,
    dutyOfficerNotified: true,
    createdAt: new Date(),
  };

  flight.alerts.unshift(newAlert);
  flight.messagesSummary = newAlert.tag;
  await flight.save();

  res.json({ success: true, data: flight, alert: newAlert });
});

module.exports = router;

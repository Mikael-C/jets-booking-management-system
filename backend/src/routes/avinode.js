const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const avInodeService = require('../services/avInodeService');
const { createAuditEntry } = require('../services/auditService');
const AgentRequest = require('../models/AgentRequest');
const Booking = require('../models/Booking');

// POST /api/avinode/search-trips — search available charter options
router.post('/search-trips', authorize('super_admin', 'admin', 'operations', 'agent'), async (req, res) => {
  const { originIcao, destinationIcao, departureDate, paxCount, aircraftCategory, currency = 'EUR' } = req.body;
  if (!originIcao || !destinationIcao || !departureDate) {
    return res.status(400).json({ message: 'originIcao, destinationIcao, and departureDate are required' });
  }
  const results = await avInodeService.searchTrips({ originIcao, destinationIcao, departureDate, paxCount, aircraftCategory, currency });
  res.json(results);
});

// GET /api/avinode/trip/:tripId — get Avinode trip details
router.get('/trip/:tripId', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const trip = await avInodeService.getTripDetails(req.params.tripId);
  res.json(trip);
});

// POST /api/avinode/create-trip — create a trip in Avinode
router.post('/create-trip', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const result = await avInodeService.createTrip(req.body);
  await createAuditEntry({ user: req.user,
    action: 'AVINODE_TRIP_CREATED', entityType: 'AvinodeTrip', entityId: result.tripId || 'N/A',
    details: `Created Avinode trip for ${req.body.originIcao} → ${req.body.destinationIcao}`
  });
  res.status(201).json(result);
});

// POST /api/avinode/rfq — send RFQ to operators through Avinode
router.post('/rfq', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const { agentRequestId, originIcao, destinationIcao, departureDate, paxCount, notes, operatorIds } = req.body;
  if (!originIcao || !destinationIcao || !departureDate) {
    return res.status(400).json({ message: 'originIcao, destinationIcao, departureDate required' });
  }

  const result = await avInodeService.sendRfq({ originIcao, destinationIcao, departureDate, paxCount, notes, operatorIds });

  if (agentRequestId) {
    await AgentRequest.findByIdAndUpdate(agentRequestId, {
      avInodeId: result.rfqId,
      status: 'in_sourcing'
    });
  }

  await createAuditEntry({ user: req.user,
    action: 'AVINODE_RFQ_SENT', entityType: 'AvinodeRFQ', entityId: result.rfqId || 'N/A',
    details: `Sent RFQ via Avinode for ${originIcao} → ${destinationIcao} on ${departureDate}`
  });

  res.status(201).json(result);
});

// GET /api/avinode/rfq/:rfqId — get RFQ responses from operators
router.get('/rfq/:rfqId', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const result = await avInodeService.getRfqResponses(req.params.rfqId);
  res.json(result);
});

// POST /api/avinode/book-trip — confirm/book a trip via Avinode
router.post('/book-trip', authorize('super_admin', 'admin'), async (req, res) => {
  const { tripId, bookingId, paymentMethod } = req.body;
  if (!tripId) return res.status(400).json({ message: 'tripId is required' });

  const result = await avInodeService.bookTrip({ tripId, paymentMethod });

  if (bookingId) {
    await Booking.findByIdAndUpdate(bookingId, { avInodeTripId: tripId, status: 'confirmed' });
  }

  await createAuditEntry({ user: req.user,
    action: 'AVINODE_TRIP_BOOKED', entityType: 'AvinodeTrip', entityId: tripId,
    details: `Booked Avinode trip ${tripId}`
  });

  res.json(result);
});

// GET /api/avinode/operators — search Avinode operator directory
router.get('/operators', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const { search, baseIcao, aircraftType } = req.query;
  const result = await avInodeService.searchOperators({ search, baseIcao, aircraftType });
  res.json(result);
});

// GET /api/avinode/aircraft — search Avinode aircraft database
router.get('/aircraft', authorize('super_admin', 'admin', 'operations', 'agent'), async (req, res) => {
  const { category, paxMin, rangeMin, search } = req.query;
  const result = await avInodeService.searchAircraft({ category, paxMin, rangeMin, search });
  res.json(result);
});

// GET /api/avinode/airports — search airports
router.get('/airports', async (req, res) => {
  const { q } = req.query;
  const result = await avInodeService.searchAirports(q);
  res.json(result);
});

// GET /api/avinode/quotes — get quotes from Avinode marketplace
router.get('/quotes', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const { originIcao, destinationIcao, date, paxCount } = req.query;
  const result = await avInodeService.getMarketplaceQuotes({ originIcao, destinationIcao, date, paxCount });
  res.json(result);
});

// POST /api/avinode/messaging — send message to operator via Avinode
router.post('/messaging', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const { tripId, operatorId, message } = req.body;
  if (!tripId || !message) return res.status(400).json({ message: 'tripId and message are required' });
  const result = await avInodeService.sendMessage({ tripId, operatorId, message });
  res.json(result);
});

// GET /api/avinode/messaging/:tripId — get message thread for a trip
router.get('/messaging/:tripId', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const result = await avInodeService.getMessages(req.params.tripId);
  res.json(result);
});

// GET /api/avinode/fleet-availability — check fleet availability for a date range
router.get('/fleet-availability', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const { dateFrom, dateTo, baseIcao, aircraftType } = req.query;
  const result = await avInodeService.checkFleetAvailability({ dateFrom, dateTo, baseIcao, aircraftType });
  res.json(result);
});

// POST /api/avinode/calculate-quote — automated quote calculation
router.post('/calculate-quote', authorize('super_admin', 'admin', 'operations', 'agent'), async (req, res) => {
  const { originIcao, destinationIcao, departureDate, returnDate, paxCount, aircraftType } = req.body;
  if (!originIcao || !destinationIcao || !departureDate) {
    return res.status(400).json({ message: 'originIcao, destinationIcao, departureDate required' });
  }
  const result = await avInodeService.calculateQuote({ originIcao, destinationIcao, departureDate, returnDate, paxCount, aircraftType });
  res.json(result);
});

module.exports = router;

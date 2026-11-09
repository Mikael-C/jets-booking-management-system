const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const AgentRequest = require('../models/AgentRequest');
const Aircraft = require('../models/Aircraft');
const { authorize } = require('../middleware/auth');
const { createAuditEntry } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');
const { sendQuoteEmail } = require('../services/emailService');
const { generateQuotePdf } = require('../services/pdfService');
const { calculatePricing } = require('../services/pricingService');
const { findAirportByCode } = require('../utils/airportData');

// Safe query helpers supporting ObjectId and custom ID strings
const findAgentRequest = async (id) => {
  if (!id) return null;
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
  if (isObjectId) {
    try {
      const doc = await AgentRequest.findById(id);
      if (doc) return doc;
    } catch {}
  }
  return await AgentRequest.findOne({
    $or: [{ id: id }, { requestNumber: id }],
    isDeleted: false,
  });
};

const findAircraft = async (id) => {
  if (!id) return null;
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
  if (isObjectId) {
    try {
      const doc = await Aircraft.findById(id);
      if (doc) return doc;
    } catch {}
  }
  return await Aircraft.findOne({
    $or: [{ id: id }, { registration: id }, { name: id }],
    isDeleted: false,
  });
};

const findBooking = async (id) => {
  if (!id) return null;
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
  if (isObjectId) {
    try {
      const doc = await Booking.findById(id);
      if (doc) return doc;
    } catch {}
  }
  return await Booking.findOne({
    $or: [{ id: id }, { tripNumber: id }, { quoteReference: id }, { invoiceNumber: id }],
    isDeleted: false,
  });
};

// POST /api/quotes/generate — generate a quote from an agent request
router.post('/generate', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const {
    agentRequestId, aircraftId, adminMarginType, adminMarginValue,
    agentMarginType, agentMarginValue, currency = 'EUR',
    quoteExpirationDate, paymentDueDate, manualServices = []
  } = req.body;

  if (!agentRequestId || !aircraftId) {
    return res.status(400).json({ message: 'agentRequestId and aircraftId are required' });
  }

  const agentRequest = await findAgentRequest(agentRequestId);
  if (!agentRequest) return res.status(404).json({ message: 'Agent request not found' });

  const aircraft = await findAircraft(aircraftId);
  if (!aircraft) return res.status(404).json({ message: 'Aircraft not found' });

  const originAirport = findAirportByCode(agentRequest.originIcao);
  const destAirport = findAirportByCode(agentRequest.destIcao);

  // Build a minimal leg for pricing calculation
  const legs = [{
    legNumber: 1,
    flightDate: agentRequest.flightDate,
    origin: originAirport,
    destination: destAirport,
    paxCount: agentRequest.paxCount,
    distanceNm: (() => {
      const oLat = originAirport?.lat ?? originAirport?.coordinates?.lat;
      const oLng = originAirport?.lng ?? originAirport?.coordinates?.lng;
      const dLat = destAirport?.lat ?? destAirport?.coordinates?.lat;
      const dLng = destAirport?.lng ?? destAirport?.coordinates?.lng;
      if (oLat != null && oLng != null && dLat != null && dLng != null) {
        return require('../services/pricingService').calculateDistanceNm(oLat, oLng, dLat, dLng);
      }
      return 500;
    })()
  }];

  if (agentRequest.tripType === 'round_trip' && agentRequest.returnFlightDate) {
    legs.push({
      legNumber: 2,
      flightDate: agentRequest.returnFlightDate,
      origin: destAirport,
      destination: originAirport,
      paxCount: agentRequest.paxCount,
      distanceNm: legs[0].distanceNm
    });
  }

  // Calculate pricing
  const pricing = calculatePricing({
    legs,
    aircraft: aircraft.toObject(),
    currency,
    adminMargin: { type: adminMarginType, value: adminMarginValue },
    agentMargin: { type: agentMarginType, value: agentMarginValue },
    manualServices
  });

  // Trip number
  const count = await Booking.countDocuments();
  const year = new Date().getFullYear();
  const tripNumber = `ORB-${year}-${String(count + 1).padStart(3, '0')}`;

  const booking = new Booking({
    tripNumber,
    quoteReference: tripNumber,
    contractDate: new Date().toISOString().split('T')[0],
    quoteExpirationDate: quoteExpirationDate || new Date(Date.now() + 48 * 3600 * 1000).toISOString().split('T')[0],
    paymentDueDate: paymentDueDate || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: 'quoted',
    quoteStatus: 'draft',
    tripType: agentRequest.tripType || 'one_way',
    client: {
      fullName: agentRequest.clientName,
      email: agentRequest.clientEmail,
      phone: agentRequest.clientPhone,
      companyName: agentRequest.companyName
    },
    aircraft: aircraft.toObject(),
    legs,
    pricing,
    notes: agentRequest.specialRequests,
    source: 'agent_request',
    sourceAgentRequestId: agentRequest._id
  });

  await booking.save();

  // Update agent request status
  agentRequest.status = 'quote_ready';
  agentRequest.fulfilledBookingId = booking._id;
  await agentRequest.save();

  await createAuditEntry({ user: req.user,
    action: 'QUOTE_GENERATED', entityType: 'Quote', entityId: booking.tripNumber,
    details: `Generated quote ${booking.tripNumber} for agent request ${agentRequest.requestNumber}`
  });

  res.status(201).json(booking);
});

// GET /api/quotes — list all quotes
router.get('/', authorize('super_admin', 'admin', 'finance', 'operations', 'agent'), async (req, res) => {
  const { quoteStatus, agentEmail, clientEmail, page = 1, limit = 20 } = req.query;
  const filter = { isDeleted: false, quoteStatus: { $exists: true } };

  if (quoteStatus) filter.quoteStatus = quoteStatus;
  if (clientEmail) filter['client.email'] = clientEmail;

  if (req.userRole === 'agent') {
    filter.agentEmail = req.user.email;
  } else if (agentEmail) {
    filter.agentEmail = agentEmail;
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));

  const [quotes, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Booking.countDocuments(filter)
  ]);

  res.json({ quotes, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

// GET /api/quotes/:id
router.get('/:id', authorize('super_admin', 'admin', 'finance', 'operations', 'agent'), async (req, res) => {
  const booking = await findBooking(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Quote not found' });
  res.json(booking);
});

// POST /api/quotes/:id/send — email quote to client
router.post('/:id/send', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const booking = await findBooking(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Quote/Booking not found' });

  const pdfBuffer = await generateQuotePdf(booking.toObject());
  await sendQuoteEmail(booking.client.email, booking.toObject(), pdfBuffer);

  booking.quoteStatus = 'sent';
  booking.status = 'quote_sent';
  await booking.save();

  await createAuditEntry({ user: req.user,
    action: 'QUOTE_SENT', entityType: 'Quote', entityId: booking.tripNumber,
    details: `Quote ${booking.tripNumber} sent to ${booking.client.email}`
  });

  await createNotification({
    type: 'info',
    title: 'Quote Sent',
    message: `Quote ${booking.tripNumber} has been sent to ${booking.client.fullName} (${booking.client.email})`
  });

  res.json({ message: 'Quote sent successfully', quoteStatus: 'sent' });
});

// PATCH /api/quotes/:id/status
router.patch('/:id/status', authorize('super_admin', 'admin', 'finance', 'operations'), async (req, res) => {
  const { quoteStatus } = req.body;
  const validStatuses = ['draft', 'sent', 'pending', 'undecided', 'accepted', 'declined', 'expired'];
  if (!validStatuses.includes(quoteStatus)) return res.status(400).json({ message: 'Invalid quote status' });

  const booking = await findBooking(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Quote not found' });

  booking.quoteStatus = quoteStatus;
  if (quoteStatus === 'accepted') {
    booking.status = 'accepted';
  } else if (quoteStatus === 'declined' || quoteStatus === 'expired') {
    booking.status = quoteStatus === 'expired' ? 'expired' : 'cancelled';
  }
  await booking.save();

  await createAuditEntry({ user: req.user,
    action: 'QUOTE_STATUS_UPDATE', entityType: 'Quote', entityId: booking.tripNumber,
    details: `Quote ${booking.tripNumber} status updated to '${quoteStatus}'`
  });

  res.json(booking);
});

// POST /api/quotes/:id/version — create a new quote version
router.post('/:id/version', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const original = await findBooking(req.params.id);
  if (!original) return res.status(404).json({ message: 'Quote not found' });

  const newVersion = original.toObject();
  delete newVersion._id;
  newVersion.quoteVersion = (original.quoteVersion || 1) + 1;
  newVersion.quoteStatus = 'draft';
  newVersion.status = 'quoted';
  newVersion.tripNumber = `${original.tripNumber.split('-v')[0]}-v${newVersion.quoteVersion}`;
  newVersion.createdAt = new Date();
  newVersion.updatedAt = new Date();

  // Apply any overrides from body
  Object.assign(newVersion, req.body);

  if (req.body.aircraftId) {
    const newAircraft = await findAircraft(req.body.aircraftId);
    if (newAircraft) newVersion.aircraft = newAircraft.toObject();
  }

  const booking = new Booking(newVersion);
  await booking.save();

  await createAuditEntry({ user: req.user,
    action: 'QUOTE_NEW_VERSION', entityType: 'Quote', entityId: booking.tripNumber,
    details: `Created quote version ${newVersion.quoteVersion} for trip ${original.tripNumber}`
  });

  res.status(201).json(booking);
});

module.exports = router;

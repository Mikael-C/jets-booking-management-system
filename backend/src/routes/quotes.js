const express = require('express');
const router = express.Router();
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

  const agentRequest = await AgentRequest.findById(agentRequestId);
  if (!agentRequest) return res.status(404).json({ message: 'Agent request not found' });

  const aircraft = await Aircraft.findById(aircraftId);
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

  const services = {
    limousineService: agentRequest.limousineService || false,
    luxuryCarRental: agentRequest.luxuryCarRental || false,
    helicopterService: agentRequest.helicopterService || false,
    deicingInsurance: agentRequest.deicingInsurance || 'none',
    deicingCostPerLeg: 0,
    carbonOffset: agentRequest.carbonOffset || 'none',
    carbonOffsetRatePerHour: 0,
    cancellationInsurance: agentRequest.cancellationInsurance || false
  };

  let pricing = calculatePricing(aircraft, legs, services, currency);

  // Apply margins
  if (adminMarginType && adminMarginValue) {
    const { applyMargin } = require('../services/pricingService');
    pricing.totalFlightPrice = applyMargin(pricing.totalFlightPrice, adminMarginType, adminMarginValue);
    pricing.subtotal = pricing.totalFlightPrice;
  }

  const tripNum = `QTE-${Date.now().toString().slice(-6)}`;
  const invoiceNum = `${Date.now().toString().slice(-8)}`;

  const bookingData = {
    tripNumber: tripNum,
    invoiceNumber: invoiceNum,
    accountNumber: `ACC-${Math.floor(10000 + Math.random() * 90000)}`,
    contractDate: new Date().toLocaleDateString('de-DE'),
    quoteExpirationDate: quoteExpirationDate || new Date(Date.now() + 48 * 3600000).toISOString(),
    paymentDueDate: paymentDueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
    status: 'quoted',
    quoteStatus: 'draft',
    quoteVersion: 1,
    quoteReference: tripNum,
    tripType: agentRequest.tripType || 'one_way',
    aircraft: aircraft.toObject(),
    client: {
      fullName: agentRequest.clientName,
      companyName: agentRequest.companyName || '',
      streetAddress: agentRequest.clientAddress || '',
      cityPostalCountry: agentRequest.clientCityCountry || '',
      phone: agentRequest.clientPhone,
      email: agentRequest.clientEmail,
      vatNumber: agentRequest.clientVatNumber || ''
    },
    operator: {
      companyName: 'Orbelo GmbH',
      legalEntity: 'Orbelo Private Aviation & Charter Services GmbH',
      representativeName: req.user.name,
      supportEmail: 'customercare@orbelo.com',
      supportPhone: '+43 7221 727 400',
      vatNumber: 'ATU 6335 7619',
      additionalVatNumbers: [],
      iban: 'AT32 3400 0000 0266 7483',
      bic: 'RZOOAT2LXXX',
      bankName: 'Raiffeisenlandesbank Oberösterreich AG',
      accountHolder: 'Orbelo GmbH',
      commercialRegistry: 'Handelsgericht Linz • FN293097a',
      courtOfJurisdiction: 'Austrian law & Linz court applicable'
    },
    legs,
    pricing,
    services,
    manualServices,
    checklist: [],
    agentName: agentRequest.agentName,
    agentEmail: agentRequest.agentEmail,
    adminMarginType, adminMarginValue,
    agentMarginType, agentMarginValue
  };

  const booking = new Booking(bookingData);
  await booking.save();

  // Link agent request to booking
  agentRequest.generatedBookingId = booking._id.toString();
  agentRequest.status = 'processing';
  await agentRequest.save();

  await createAuditEntry({ user: req.user,
    action: 'QUOTE_GENERATED', entityType: 'Quote', entityId: booking.tripNumber,
    details: `Generated quote ${tripNum} for ${agentRequest.clientName} — ${agentRequest.route}`
  });

  res.status(201).json(booking);
});

// POST /api/quotes/:id/send — email quote to client
router.post('/:id/send', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const booking = await Booking.findById(req.params.id);
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

  const booking = await Booking.findById(req.params.id);
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
  const original = await Booking.findById(req.params.id);
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
    const newAircraft = await Aircraft.findById(req.body.aircraftId);
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

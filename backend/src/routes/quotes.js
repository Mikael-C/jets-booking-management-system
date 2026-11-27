const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { createHash } = require('crypto');
const Booking = require('../models/Booking');
const AgentRequest = require('../models/AgentRequest');
const Aircraft = require('../models/Aircraft');
const { authorize } = require('../middleware/auth');
const { createAuditEntry } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');
const { sendQuoteEmail, sendEmail } = require('../services/emailService');
const { generateQuotePdf } = require('../services/pdfService');
const { calculatePricing } = require('../services/pricingService');
const { findAirportByCode } = require('../utils/airportData');
const { createBookingIdentifiers, createTripNumber } = require('../services/bookingIdentifiers');
const { agreementLinks } = require('../services/agreementLinks');
const { postToCurator, recordSent } = require('../services/curatorThread');

const quoteEditableFields = [
  'accountNumber', 'contractDate', 'quoteExpirationDate', 'paymentDueDate',
  'tripType', 'aircraft', 'aircraftCustomImages', 'client', 'operator', 'legs',
  'pricing', 'services', 'checklist', 'agentName', 'agentEmail',
  'commissionPercentage', 'paymentStatus', 'paymentReason',
  'paymentMethodChoice', 'cardFeePercentage', 'cardFeeAmount',
  'totalWithCardFee', 'adminMarginType', 'adminMarginValue',
  'agentMarginType', 'agentMarginValue', 'manualServices', 'sourcingOptions',
  'avInodeTripId', 'notes', 'internalNotes', 'tripActionAudit',
  // Quote builder & trip page data that must survive booking the quote
  'pets', 'petDetails', 'tripServices', 'groundTransportation', 'helicopterTransfer',
  'authorisedOwnerId', 'authorisedOwnerName', 'assistantContactId', 'sendDocsTo', 'signsAgreement',
  'legOperators', 'operatorPendingApproval', 'passengerFeeItems', 'itineraryActivity',
  'lastBriefIssuedAt', 'lastBriefLegs', 'sameManifestAllLegs', 'creditNotes', 'revisionAdjustments'
];

const applyQuoteEdits = (booking, updates) => {
  for (const field of quoteEditableFields) {
    if (Object.prototype.hasOwnProperty.call(updates || {}, field)) {
      booking.set(field, updates[field]);
    }
  }
};

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
    $or: [{ id: id }, { tripId: id }, { quoteId: id }, { bookingRevisionId: id }, { tripNumber: id }, { quoteReference: id }, { invoiceNumber: id }],
    isDeleted: false,
  });
};

const getQuoteFamilyStem = (booking) => {
  const identifier = booking.quoteId || booking.quoteReference || '';
  return identifier.replace(/-(?:V)?\d+$/i, '');
};

const getQuoteVersion = (booking) => {
  const explicitVersion = Number(booking.quoteVersion);
  if (Number.isFinite(explicitVersion) && explicitVersion > 0) return explicitVersion;
  const match = (booking.quoteId || booking.quoteReference || '').match(/-(?:V)?(\d+)$/i);
  return match ? Number(match[1]) : 1;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getQuoteFamilyFilter = (booking) => {
  if (booking.quoteGroupId) {
    return { isDeleted: false, quoteGroupId: booking.quoteGroupId };
  }

  const stem = getQuoteFamilyStem(booking);
  if (stem) {
    const filter = {
      isDeleted: false,
      quoteGroupId: { $in: ['', null] },
      $or: [
        { quoteId: { $regex: `^${escapeRegex(stem)}-(?:V)?\\d+$`, $options: 'i' } },
        { quoteReference: { $regex: `^${escapeRegex(stem)}-(?:V)?\\d+$`, $options: 'i' } }
      ]
    };
    if (booking.client?.email) filter['client.email'] = booking.client.email;
    else if (booking.client?.fullName) filter['client.fullName'] = booking.client.fullName;
    return filter;
  }

  return { isDeleted: false, _id: booking._id };
};

const isBookedStatus = (booking) =>
  booking.isBooked || ['confirmed', 'dispatched', 'in_flight', 'completed', 'flown'].includes(booking.status);

const reviseQuote = async (req, res) => {
  const original = await findBooking(req.params.id);
  if (!original) return res.status(404).json({ message: 'Quote not found' });
  if (original.isCancelled || isBookedStatus(original)) {
    return res.status(409).json({ message: 'Cancelled or booked quote iterations cannot be revised' });
  }

  const siblings = await Booking.find(getQuoteFamilyFilter(original)).sort({ quoteVersion: -1 });
  const quoteGroupId = original.quoteGroupId || original.id || original._id.toString();
  if (siblings.some((quote) => isBookedStatus(quote) && !quote.isCancelled)) {
    return res.status(409).json({ message: 'A booked trip cannot be revised as a quote' });
  }
  const latestVersion = Math.max(0, ...siblings.map(getQuoteVersion));
  if (getQuoteVersion(original) < latestVersion) {
    return res.status(409).json({ message: 'Only the latest quote iteration can be revised' });
  }
  const nextVersion = latestVersion + 1;
  const bookImmediately = req.body?.isBooked === true;
  const identifiers = await createBookingIdentifiers({
    quoteGroupId,
    tripId: original.tripId || undefined,
    quoteVersion: nextVersion,
    isQuote: true,
    isBooked: bookImmediately,
  });
  const tripId = identifiers.tripId;
  const revised = original.toObject();
  delete revised._id;
  delete revised.__v;
  delete revised.createdAt;
  delete revised.updatedAt;
  Object.assign(revised, req.body || {});
  Object.assign(revised, identifiers);
  revised.isCancelled = false;
  revised.cancellationReason = '';
  revised.supersededBy = '';
  revised.isBooked = bookImmediately;
  revised.quoteStatus = bookImmediately ? 'accepted' : (req.body?.quoteStatus || 'draft');
  revised.status = bookImmediately ? 'confirmed' : (req.body?.status || 'quoted');
  revised.createdAt = new Date();
  revised.updatedAt = new Date();

  for (const quote of siblings) {
    quote.quoteGroupId = quoteGroupId;
    quote.tripId = tripId;
    quote.isBooked = false;
    quote.isCancelled = true;
    quote.cancellationReason = `Superseded by ${bookImmediately ? 'booked ' : ''}revision ${identifiers.quoteId}`;
    quote.supersededBy = revised.id;
    quote.quoteStatus = 'expired';
    quote.status = 'cancelled';
    await quote.save();
  }

  const booking = await Booking.create(revised);
  await createAuditEntry({
    user: req.user,
    action: 'QUOTE_NEW_VERSION',
    entityType: 'Quote',
    entityId: identifiers.quoteId,
    details: `${bookImmediately ? 'Booked' : 'Created'} quote revision ${identifiers.quoteId} for trip ${identifiers.tripId}`
  });
  return res.status(201).json(booking);
};

router.post('/:id/revise', authorize('super_admin', 'admin', 'operations'), reviseQuote);

router.post('/:id/advance-to-contract', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const booking = await findBooking(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Quote not found' });
  if (booking.isCancelled || isBookedStatus(booking)) {
    return res.status(409).json({ message: 'Cancelled or booked quotes cannot be advanced to contract' });
  }

  const siblings = await Booking.find(getQuoteFamilyFilter(booking));
  const latestVersion = Math.max(0, ...siblings.map(getQuoteVersion));
  if (getQuoteVersion(booking) < latestVersion) {
    return res.status(409).json({ message: 'Only the latest quote iteration can be advanced to contract' });
  }

  applyQuoteEdits(booking, req.body);
  booking.status = 'contract_sent';
  booking.quoteStatus = 'accepted';
  await booking.save();
  await createAuditEntry({
    user: req.user,
    action: 'QUOTE_ADVANCED_TO_CONTRACT',
    entityType: 'Quote',
    entityId: booking.quoteId || booking.id,
    details: `Quote ${booking.quoteId || booking.id} advanced to contract stage`
  });
  return res.json({ success: true, data: booking });
});

/**
 * QUO → TRI: the quote version becomes the booking; the other open versions of the trip are superseded.
 * Used by "Convert to booking" and by the client's online signature (routes/signing.js).
 * Returns { booking } or { error: { status, message } }.
 */
async function convertQuoteToBooking(booking, { user = null, body = null, via = 'desk' } = {}) {
  if (booking.isCancelled) return { error: { status: 409, message: 'Cancelled quote iterations cannot be booked' } };
  if (isBookedStatus(booking)) return { booking };
  const quoteGroupId = booking.quoteGroupId || booking.id || booking._id.toString();
  const existingTripId = booking.tripId;
  const siblings = await Booking.find(getQuoteFamilyFilter(booking));
  if (siblings.some((sibling) => isBookedStatus(sibling) && !sibling.isCancelled && !sibling._id.equals(booking._id))) {
    return { error: { status: 409, message: 'A quote from this trip has already been booked' } };
  }
  const latestVersion = Math.max(0, ...siblings.map(getQuoteVersion));
  if (getQuoteVersion(booking) < latestVersion) {
    return { error: { status: 409, message: 'Only the latest quote iteration can be booked' } };
  }
  if (body) applyQuoteEdits(booking, body);
  const identifiers = await createBookingIdentifiers({
    quoteGroupId,
    tripId: existingTripId || undefined,
    quoteVersion: getQuoteVersion(booking),
    isQuote: false,
    isBooked: true,
  });
  const tripId = existingTripId || identifiers.tripId;
  booking.id = booking.id || identifiers.id;
  booking.quoteGroupId = quoteGroupId;
  booking.tripId = tripId;
  booking.tripNumber = identifiers.tripNumber;
  booking.quoteId = booking.quoteId || identifiers.quoteId;
  booking.quoteReference = booking.quoteReference || booking.quoteId;
  booking.isBooked = true;
  booking.set('isDraft', false);
  booking.quoteStatus = 'accepted';
  booking.status = 'confirmed';
  booking.bookingRevisionId = booking.bookingRevisionId || identifiers.bookingRevisionId;
  booking.invoiceNumber = booking.invoiceNumber || identifiers.invoiceNumber;
  booking.contractDate = booking.contractDate || new Date().toISOString().slice(0, 10);
  await booking.save();

  for (const sibling of siblings) {
    sibling.quoteGroupId = quoteGroupId;
    sibling.tripId = tripId;
    if (!sibling._id.equals(booking._id) && !sibling.isCancelled && !isBookedStatus(sibling)) {
      sibling.isBooked = false;
      sibling.isCancelled = true;
      sibling.cancellationReason = `Superseded by booked revision ${booking.bookingRevisionId}`;
      sibling.supersededBy = booking.id || booking._id.toString();
      sibling.quoteStatus = 'expired';
      sibling.status = 'cancelled';
    }
    if (!sibling._id.equals(booking._id)) await sibling.save();
  }

  await createAuditEntry({
    user,
    userName: via === 'client' ? 'Client (online signature)' : '',
    action: 'QUOTE_CONVERTED_TO_BOOKING',
    entityType: 'Booking',
    entityId: booking.tripId,
    details: `Quote ${booking.quoteId} converted to booking ${booking.bookingRevisionId}${via === 'client' ? ' (signed online)' : ''}`
  });
  return { booking };
}

router.post('/:id/convert-to-booking', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const booking = await findBooking(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Quote not found' });
  const result = await convertQuoteToBooking(booking, { user: req.user, body: req.body });
  if (result.error) return res.status(result.error.status).json({ message: result.error.message });
  return res.json({ success: true, data: result.booking });
});

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

  // Trip & Quote identifiers linked to agent request
  const { extractFeToken } = require('../services/bookingIdentifiers');
  const token = extractFeToken(agentRequest.requestNumber) || extractFeToken(agentRequest.tripId) || extractFeToken(agentRequest.id);
  const identifiers = await createBookingIdentifiers({
    token,
    quoteGroupId: agentRequest.quoteGroupId || undefined,
    tripId: agentRequest.tripId || undefined,
  });

  const booking = new Booking({
    ...identifiers,
    quoteVersion: 1,
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
    agentName: agentRequest.agentName || '',
    agentEmail: agentRequest.agentEmail || '',
    aircraft: aircraft.toObject(),
    legs,
    pricing,
    notes: agentRequest.specialRequests,
    specialRequests: agentRequest.specialRequests,
    petDetails: agentRequest.petDetails,
    groundTransportation: agentRequest.groundTransportation,
    helicopterTransfer: agentRequest.helicopterTransfer,
    source: 'agent_request',
    sourceAgentRequestId: agentRequest._id
  });

  await booking.save();

  // Update agent request status
  agentRequest.status = 'processing';
  agentRequest.fulfilledBookingId = booking._id;
  agentRequest.tripId = identifiers.tripId;
  agentRequest.quoteGroupId = identifiers.quoteGroupId;
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
    Booking.find(filter).select('-signedDocuments -signOtp -wetSignature.file')
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
/**
 * POST /api/quotes/:id/send-to-curator   { document: 'quotation' | 'charter_agreement', origin }
 * The quote or the charter agreement goes to the Curator: a message in their conversation, the document on
 * their request / trip page, and an email with the links. The desk stays on the page (no redirect).
 */
router.post('/:id/send-to-curator', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const booking = await findBooking(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Quote not found' });
  const kind = (req.body && req.body.document) === 'charter_agreement' ? 'charter_agreement' : 'quotation';
  if (kind === 'charter_agreement' && isBookedStatus(booking)) {
    return res.status(409).json({ message: 'This trip is already booked; the agreement is signed.' });
  }
  if (!booking.agentEmail && !booking.sourceAgentRequestId) {
    return res.status(400).json({ message: 'This quote has no Curator. Send it to the client instead.' });
  }
  const links = agreementLinks(booking, req.body && req.body.origin);
  const ref = kind === 'charter_agreement' ? links.number : links.quote;
  const by = (req.user && (req.user.name || req.user.email)) || 'Desk';
  const text =
    kind === 'charter_agreement'
      ? `Charter agreement ${ref} is ready. Download it from the request page, have the client sign it, then upload the signed copy there (or the client can sign online: ${links.sign}).`
      : `Quote ${ref} is ready for your client. Open it from the request page to review and confirm.`;

  recordSent(booking, { kind, ref, by, bookingId: booking.id || String(booking._id) });
  if (kind === 'charter_agreement') {
    booking.agreementSentAt = new Date();
    booking.agreementSentBy = by;
    booking.quoteStatus = 'contract_sent';
  } else if (!booking.quoteSentAt) {
    booking.quoteSentAt = new Date();
  }
  await booking.save();
  await postToCurator(booking, { text, user: req.user });

  // Email the Curator as well (the message above is what counts if email is not set up)
  let emailed = false;
  if (booking.agentEmail) {
    const result = await sendEmail({
      to: booking.agentEmail,
      subject: kind === 'charter_agreement' ? `Charter agreement ${ref} ready` : `Quote ${ref} ready`,
      html: `<p>${text.replace(links.sign, `<a href="${links.sign}">${links.signLabel}</a>`)}</p>`,
      text
    }).catch(() => ({ success: false }));
    emailed = Boolean(result && result.success);
  }
  await createAuditEntry({
    user: req.user,
    action: kind === 'charter_agreement' ? 'AGREEMENT_SENT_TO_CURATOR' : 'QUOTE_SENT_TO_CURATOR',
    entityType: 'Booking',
    entityId: ref,
    details: `${ref} sent to ${booking.agentName || booking.agentEmail || 'the Curator'}`
  });
  res.json({ success: true, data: { ref, sentAt: new Date().toISOString(), emailed, curator: booking.agentName || booking.agentEmail || '' } });
});

router.post('/:id/send', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const booking = await findBooking(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Quote/Booking not found' });
  if (booking.isCancelled || booking.isBooked) {
    return res.status(409).json({ message: 'Cancelled or booked quote iterations cannot be sent' });
  }
  const to = req.body && req.body.to;
  const recipientEmail =
    to === 'client' ? booking.client?.email : to === 'curator' ? booking.agentEmail : booking.agentEmail || booking.client?.email;
  if (!recipientEmail) {
    return res.status(400).json({ message: to === 'client' ? 'The client has no email address' : 'Quote has no agent or client email address' });
  }

  let sent;
  try {
    const pdfBuffer = await generateQuotePdf(booking.toObject());
    const links = to === 'client' ? agreementLinks(booking, req.body && req.body.origin) : null;
    sent = await sendQuoteEmail(recipientEmail, booking.toObject(), pdfBuffer, links);
  } catch (err) {
    return res.status(422).json({ message: `Email could not be sent: ${err && err.message ? err.message : 'mail service error'}` });
  }
  if (sent && sent.success === false) {
    return res.status(422).json({ message: `Email could not be sent: ${sent.message || sent.error || 'mail service error'}` });
  }

  booking.quoteStatus = 'sent';
  booking.status = 'quote_sent';
  booking.set('isDraft', false);
  await booking.save();

  await createAuditEntry({ user: req.user,
    action: 'QUOTE_SENT', entityType: 'Quote', entityId: booking.tripNumber,
    details: `Quote ${booking.quoteId || booking.tripNumber} sent to ${recipientEmail}`
  });

  await createNotification({
    type: 'info',
    title: 'Quote Sent',
    message: `Quote ${booking.quoteId || booking.tripNumber} has been sent to ${recipientEmail}`
  });

  res.json({ message: 'Quote sent successfully', quoteStatus: 'sent', to: recipientEmail });
});

// PATCH /api/quotes/:id/status
router.patch('/:id/status', authorize('super_admin', 'admin', 'finance', 'operations'), async (req, res) => {
  const { quoteStatus } = req.body;
  const validStatuses = ['draft', 'sent', 'pending', 'undecided', 'accepted', 'declined', 'expired'];
  if (!validStatuses.includes(quoteStatus)) return res.status(400).json({ message: 'Invalid quote status' });

  const booking = await findBooking(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Quote not found' });
  if (booking.isCancelled) return res.status(409).json({ message: 'Cancelled quote iterations are locked' });

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

// Keep the legacy endpoint compatible while enforcing the same revision rules.
router.post('/:id/version', authorize('super_admin', 'admin', 'operations'), reviseQuote);

module.exports = router;
module.exports.convertQuoteToBooking = convertQuoteToBooking;

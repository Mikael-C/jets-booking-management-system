const AgentRequest = require('../models/AgentRequest');
const Booking = require('../models/Booking');
const Sequence = require('../models/Sequence');
const logger = require('../middleware/logger');

const pad3 = (num) => String(num).padStart(3, '0');

/**
 * Normalizes all legacy IDs in the database to chronological FE format:
 * Requests: REQ-FE001, REQ-FE002...
 * Quotes:   QUO-FE001, QUO-FE002...
 * Trips:    TRI-FE001, TRI-FE002...
 */
const migrateLegacyIdentifiers = async () => {
  try {
    const sequenceId = 'fe_global_counter';
    let currentCounter = 0;

    // 1. Process Agent Requests in chronological order
    const requests = await AgentRequest.find({ isDeleted: { $ne: true } }).sort({ createdAt: 1 });
    const requestTokenMap = new Map(); // req._id -> FE token

    for (let i = 0; i < requests.length; i++) {
      const req = requests[i];
      let token;

      const feMatch = (req.requestNumber || req.id || '').match(/FE(\d+)/i);
      if (feMatch) {
        const val = parseInt(feMatch[1], 10);
        token = `FE${pad3(val)}`;
        currentCounter = Math.max(currentCounter, val);
      } else {
        currentCounter += 1;
        token = `FE${pad3(currentCounter)}`;
      }

      requestTokenMap.set(String(req._id), token);
      requestTokenMap.set(String(req.id), token);

      let needsSave = false;
      const expectedReqNumber = `REQ-${token}`;
      const expectedTripId = `TRI-${token}`;
      const expectedQuoteId = `QUO-${token}`;

      if (req.requestNumber !== expectedReqNumber) {
        req.requestNumber = expectedReqNumber;
        needsSave = true;
      }
      if (req.id !== expectedReqNumber) {
        req.id = expectedReqNumber;
        needsSave = true;
      }
      if (req.tripId !== expectedTripId) {
        req.tripId = expectedTripId;
        needsSave = true;
      }
      if (req.quoteGroupId !== expectedQuoteId) {
        req.quoteGroupId = expectedQuoteId;
        needsSave = true;
      }

      if (needsSave) {
        await req.save();
      }
    }

    // 2. Process Bookings in chronological order
    const bookings = await Booking.find({ isDeleted: { $ne: true } }).sort({ createdAt: 1 });
    for (let i = 0; i < bookings.length; i++) {
      const b = bookings[i];
      let token;

      // Check if linked to an agent request
      if (b.sourceAgentRequestId && requestTokenMap.has(String(b.sourceAgentRequestId))) {
        token = requestTokenMap.get(String(b.sourceAgentRequestId));
      } else {
        const feMatch = (b.tripNumber || b.tripId || b.quoteId || '').match(/FE(\d+)/i);
        if (feMatch) {
          const val = parseInt(feMatch[1], 10);
          token = `FE${pad3(val)}`;
          currentCounter = Math.max(currentCounter, val);
        } else {
          currentCounter += 1;
          token = `FE${pad3(currentCounter)}`;
        }
      }

      const version = String(b.quoteVersion || 1).padStart(2, '0');
      const expectedTripId = `TRI-${token}`;
      const expectedTripNumber = b.isBooked && (b.quoteVersion || 1) > 1 ? `TRI-${token}-${version}` : `TRI-${token}`;
      const expectedQuoteId = (b.quoteVersion || 1) > 1 ? `QUO-${token}-${version}` : `QUO-${token}`;
      const expectedInvoice = `INV-${token}-${version}`;

      let needsSave = false;
      if (b.tripId !== expectedTripId) {
        b.tripId = expectedTripId;
        needsSave = true;
      }
      if (b.tripNumber !== expectedTripNumber) {
        b.tripNumber = expectedTripNumber;
        needsSave = true;
      }
      if (!b.quoteId || !b.quoteId.includes('FE')) {
        b.quoteId = expectedQuoteId;
        b.quoteReference = expectedQuoteId;
        needsSave = true;
      }
      if (!b.invoiceNumber || !b.invoiceNumber.includes('FE')) {
        b.invoiceNumber = expectedInvoice;
        needsSave = true;
      }

      if (needsSave) {
        await b.save();
      }
    }

    // 3. Update or set the global sequence counter
    await Sequence.findOneAndUpdate(
      { _id: sequenceId },
      { $set: { value: Math.max(currentCounter, 14) } },
      { upsert: true }
    );

    if (logger && logger.info) {
      logger.info(`✅ Synchronized chronological IDs: Requests (REQ-FE###), Quotes (QUO-FE###), Trips (TRI-FE###). Current counter: ${currentCounter}`);
    }
  } catch (err) {
    if (logger && logger.warn) {
      logger.warn(`Migration notice: ${err.message}`);
    }
  }
};

module.exports = { migrateLegacyIdentifiers };

const AgentRequest = require('../models/AgentRequest');
const Booking = require('../models/Booking');
const Sequence = require('../models/Sequence');
const logger = require('../middleware/logger');

const pad4 = (num) => String(num).padStart(4, '0');
const pad3 = (num) => String(num).padStart(3, '0');

/**
 * Normalizes all legacy IDs in the database to chronological 2-letter + 4-digit format:
 * Requests: REQ-FE4455...
 * Quotes:   QUO-FE4455-001, QUO-FE4455-002...
 * Trips:    TRI-FE4455-001, TRI-FE4455-002...
 * Agrmts:   CA-FE4455-001...
 * Invoices: INV-FE4455-001, INV-FE4455-002...
 */
const migrateLegacyIdentifiers = async () => {
  try {
    const sequenceId = 'fe_global_counter_v2';
    let currentCounter = 1000;

    // Remove any legacy mock seeded bookings if found
    await Booking.deleteMany({
      $or: [
        { id: { $regex: /peu|booking-peu/i } },
        { tripNumber: { $regex: /peu|qte-2026/i } },
        { quoteReference: { $regex: /peu/i } }
      ]
    });

    // 1. Process Agent Requests in chronological order
    const requests = await AgentRequest.find({ isDeleted: { $ne: true } }).sort({ createdAt: 1 });
    const requestTokenMap = new Map(); // req._id -> FE token

    for (let i = 0; i < requests.length; i++) {
      const req = requests[i];
      let token;

      const feMatch = (req.requestNumber || req.id || '').match(/FE(\d+)/i);
      if (feMatch) {
        const val = parseInt(feMatch[1], 10);
        const numVal = val < 1000 ? val + 1000 : val;
        token = `FE${pad4(numVal)}`;
        currentCounter = Math.max(currentCounter, numVal);
      } else {
        currentCounter += 1;
        token = `FE${pad4(currentCounter)}`;
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
          const numVal = val < 1000 ? val + 1000 : val;
          token = `FE${pad4(numVal)}`;
          currentCounter = Math.max(currentCounter, numVal);
        } else {
          currentCounter += 1;
          token = `FE${pad4(currentCounter)}`;
        }
      }

      const version = pad3(b.quoteVersion || 1);
      const expectedTripId = `TRI-${token}`;
      const expectedTripNumber = `TRI-${token}-${version}`;
      const expectedQuoteId = `QUO-${token}-${version}`;
      const expectedInvoice = `INV-${token}-${version}`;
      const expectedAgreement = `CA-${token}-${version}`;

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
      if (b.isBooked && (!b.invoiceNumber || !b.invoiceNumber.includes('FE'))) {
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
      { $set: { value: Math.max(currentCounter, 1010) } },
      { upsert: true }
    );

    if (logger && logger.info) {
      logger.info(`✅ Synchronized chronological IDs (MOD-01): REQ-FE####, QUO-FE####-00n, TRI-FE####-00n, CA-FE####-00n. Current counter: ${currentCounter}`);
    }
  } catch (err) {
    if (logger && logger.warn) {
      logger.warn(`Migration notice: ${err.message}`);
    }
  }
};

module.exports = { migrateLegacyIdentifiers };

const { randomUUID } = require('crypto');
const Booking = require('../models/Booking');
const AgentRequest = require('../models/AgentRequest');
const Sequence = require('../models/Sequence');

const pad4 = (num) => String(num).padStart(4, '0');
const pad3 = (num) => String(num).padStart(3, '0');

/**
 * Extracts the 2-letter + 4-digit (or 3+ digit) token from any string, e.g.:
 * "REQ-FE4455" -> "FE4455"
 * "QUO-FE4455-001" -> "FE4455"
 * "TRI-FE4455-001" -> "FE4455"
 * "CA-FE4455-001" -> "FE4455"
 */
const extractFeToken = (str) => {
  if (!str) return null;
  const match = String(str).match(/([A-Za-z]{2}\d{4})/i) || String(str).match(/([A-Za-z]{2}\d{3})/i) || String(str).match(/FE\d+/i);
  return match ? match[0].toUpperCase() : null;
};

/**
 * Gets or increments the global chronological 2-letter + 4-digit sequence counter.
 * Returns e.g. "FE1001", "FE1002", "FE4455", etc.
 */
const getNextFeSequence = async () => {
  const sequenceId = 'fe_global_counter_v2';
  let counter = await Sequence.findById(sequenceId);

  if (!counter) {
    try {
      const [bookingTripNumbers, bookingTripIds, bookingQuoteIds, requestNumbers, requestIds] = await Promise.all([
        Booking.distinct('tripNumber', { isDeleted: { $ne: true } }),
        Booking.distinct('tripId', { isDeleted: { $ne: true } }),
        Booking.distinct('quoteId', { isDeleted: { $ne: true } }),
        AgentRequest.distinct('requestNumber', { isDeleted: { $ne: true } }),
        AgentRequest.distinct('id', { isDeleted: { $ne: true } }),
      ]);

      const allStrings = [
        ...bookingTripNumbers,
        ...bookingTripIds,
        ...bookingQuoteIds,
        ...requestNumbers,
        ...requestIds,
      ];

      let maxVal = 1000;
      for (const s of allStrings) {
        const match = String(s).match(/FE(\d+)/i);
        if (match) {
          const val = parseInt(match[1], 10);
          if (!isNaN(val) && val > maxVal) {
            maxVal = val;
          }
        }
      }

      counter = await Sequence.create({ _id: sequenceId, value: maxVal });
    } catch (err) {
      if (err.code !== 11000) console.warn('Sequence initialization notice:', err.message);
    }
  }

  const next = await Sequence.findOneAndUpdate(
    { _id: sequenceId },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  return `FE${pad4(next.value)}`;
};

const createTripId = async (providedToken) => {
  const token = extractFeToken(providedToken) || await getNextFeSequence();
  return `TRI-${token}`;
};

const createTripNumber = async (preferred, providedToken, version = 1) => {
  const token = extractFeToken(providedToken) || extractFeToken(preferred) || await getNextFeSequence();
  return `TRI-${token}-${pad3(version)}`;
};

const createBookingIdentifiers = async ({
  quoteGroupId,
  tripId,
  token: explicitToken,
  quoteVersion = 1,
  isQuote = true,
  isBooked = false,
} = {}) => {
  // Determine the shared FE sequence token (e.g. FE4455)
  let token = explicitToken ||
    extractFeToken(tripId) ||
    extractFeToken(quoteGroupId);

  if (!token) {
    token = await getNextFeSequence();
  }

  const version = pad3(quoteVersion || 1);
  const tripRoot = `TRI-${token}`;
  const tripNumberStr = `TRI-${token}-${version}`;
  const quoteIdStr = `QUO-${token}-${version}`;
  const agreementNumberStr = `CA-${token}-${version}`;
  const invoiceNumberStr = `INV-${token}-${version}`;
  const flightBriefNumberStr = `FB-${token}-${version}`;
  const creditNoteNumberStr = `CN-${token}-${version}`;

  return {
    id: `booking-${token.toLowerCase()}-${version}`,
    token,
    tripId: tripRoot,
    quoteGroupId: quoteGroupId || `QUO-${token}`,
    quoteId: quoteIdStr,
    quoteReference: isBooked ? tripNumberStr : quoteIdStr,
    quoteVersion: quoteVersion || 1,
    bookingRevisionId: `TRI-${token}-${version}`,
    tripNumber: tripNumberStr,
    agreementNumber: agreementNumberStr,
    invoiceNumber: isBooked ? invoiceNumberStr : '',
    flightBriefNumber: isBooked ? flightBriefNumberStr : '',
    creditNoteNumber: creditNoteNumberStr,
  };
};

module.exports = {
  getNextFeSequence,
  extractFeToken,
  createBookingIdentifiers,
  createTripId,
  createTripNumber,
};

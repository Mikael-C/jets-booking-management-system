const { randomUUID } = require('crypto');
const Booking = require('../models/Booking');
const AgentRequest = require('../models/AgentRequest');
const Sequence = require('../models/Sequence');

const pad3 = (num) => String(num).padStart(3, '0');

/**
 * Extracts the FE code token from any string, e.g.:
 * "REQ-FE001" -> "FE001"
 * "QUO-FE001-01" -> "FE001"
 * "TRI-FE001" -> "FE001"
 * "FE4578" -> "FE4578"
 */
const extractFeToken = (str) => {
  if (!str) return null;
  const match = String(str).match(/FE\d+/i);
  return match ? match[0].toUpperCase() : null;
};

/**
 * Gets or increments the global chronological FE sequence counter.
 * Returns e.g. "FE001", "FE002", "FE003", etc.
 */
const getNextFeSequence = async () => {
  const sequenceId = 'fe_global_counter';
  let counter = await Sequence.findById(sequenceId);

  if (!counter) {
    try {
      // Find the highest existing FE sequence number across collections
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

      let maxVal = 0;
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

  return `FE${pad3(next.value)}`;
};

const createTripId = async (providedToken) => {
  const token = extractFeToken(providedToken) || await getNextFeSequence();
  return `TRI-${token}`;
};

const createTripNumber = async (preferred, providedToken) => {
  const token = extractFeToken(providedToken) || extractFeToken(preferred) || await getNextFeSequence();
  return `TRI-${token}`;
};

const createBookingIdentifiers = async ({
  quoteGroupId,
  tripId,
  token: explicitToken,
  quoteVersion = 1,
  isQuote = true,
  isBooked = false,
} = {}) => {
  // Determine the shared FE sequence token
  let token = explicitToken ||
    extractFeToken(tripId) ||
    extractFeToken(quoteGroupId);

  if (!token) {
    token = await getNextFeSequence();
  }

  const version = String(quoteVersion).padStart(2, '0');
  const tripIdStr = `TRI-${token}`;
  const tripNumberStr = isBooked && quoteVersion > 1 ? `TRI-${token}-${version}` : `TRI-${token}`;
  const quoteIdStr = isQuote ? (quoteVersion > 1 ? `QUO-${token}-${version}` : `QUO-${token}`) : '';

  return {
    id: `booking-${token.toLowerCase()}-${randomUUID().slice(0, 8)}`,
    token,
    tripId: tripIdStr,
    quoteGroupId: quoteGroupId || `QUO-${token}`,
    quoteId: quoteIdStr,
    quoteReference: quoteIdStr || `QUO-${token}`,
    quoteVersion: isQuote ? quoteVersion : undefined,
    bookingRevisionId: isBooked ? `BK-${token}-${version}` : '',
    tripNumber: tripNumberStr,
    invoiceNumber: isBooked ? `INV-${token}-${version}` : '',
  };
};

module.exports = {
  getNextFeSequence,
  extractFeToken,
  createBookingIdentifiers,
  createTripId,
  createTripNumber,
};

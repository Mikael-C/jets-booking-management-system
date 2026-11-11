const { createHash, randomUUID } = require('crypto');
const Booking = require('../models/Booking');
const AgentRequest = require('../models/AgentRequest');
const Sequence = require('../models/Sequence');

const createTripId = async () => {
  const year = new Date().getFullYear();
  const sequenceId = `trip:${year}`;
  let counter = await Sequence.findById(sequenceId);

  if (!counter) {
    const pattern = new RegExp(`^TRIP-${year}-(\\d+)$`);
    const [bookingIds, requestIds] = await Promise.all([
      Booking.distinct('tripId', { tripId: pattern, isDeleted: { $ne: true } }),
      AgentRequest.distinct('tripId', { tripId: pattern, isDeleted: { $ne: true } }),
    ]);
    const currentValue = [...bookingIds, ...requestIds].reduce((max, tripId) => {
      const match = String(tripId).match(pattern);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);

    try {
      await Sequence.create({ _id: sequenceId, value: currentValue });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }

  const next = await Sequence.findOneAndUpdate(
    { _id: sequenceId },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  return `TRIP-${year}-${String(next.value).padStart(3, '0')}`;
};

const createTripNumber = async (preferred) => {
  if (preferred && !(await Booking.exists({ tripNumber: preferred }))) return preferred;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `QTE-${new Date().getFullYear()}-${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;
    if (!(await Booking.exists({ tripNumber: candidate }))) return candidate;
  }
  throw new Error('Unable to allocate a unique trip number');
};

const createBookingIdentifiers = async ({
  quoteGroupId = randomUUID(),
  tripId,
  quoteVersion = 1,
  isQuote = true,
  isBooked = false,
} = {}) => {
  const token = createHash('sha256').update(quoteGroupId).digest('hex').slice(0, 10).toUpperCase();
  const version = String(quoteVersion).padStart(2, '0');
  const quoteId = isQuote ? `QUO-${token}-${version}` : '';
  if (quoteId && await Booking.exists({ quoteId })) {
    throw new Error(`Quote ID ${quoteId} already exists`);
  }

  return {
    id: `booking-${randomUUID()}`,
    tripId: tripId || await createTripId(),
    quoteGroupId: isQuote ? quoteGroupId : '',
    quoteId,
    quoteReference: quoteId,
    quoteVersion: isQuote ? quoteVersion : undefined,
    bookingRevisionId: isBooked ? `BK-${token}-${version}` : '',
    tripNumber: await createTripNumber(isBooked ? `PEU${token}-001` : undefined),
    invoiceNumber: isBooked ? `INV-${token}-Q${version}` : '',
  };
};

module.exports = { createBookingIdentifiers, createTripId, createTripNumber };

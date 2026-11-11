const { createHash, randomUUID } = require('crypto');
const Booking = require('../models/Booking');

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
  quoteVersion = 1,
  isQuote = true,
  isBooked = false,
} = {}) => {
  const year = new Date().getFullYear();
  const token = createHash('sha256').update(quoteGroupId).digest('hex').slice(0, 10).toUpperCase();
  const version = String(quoteVersion).padStart(2, '0');
  const quoteId = isQuote ? `QUO-${token}-${version}` : '';
  if (quoteId && await Booking.exists({ quoteId })) {
    throw new Error(`Quote ID ${quoteId} already exists`);
  }

  return {
    id: `booking-${randomUUID()}`,
    tripId: `TRIP-${year}-${token}`,
    quoteGroupId: isQuote ? quoteGroupId : '',
    quoteId,
    quoteReference: quoteId,
    quoteVersion: isQuote ? quoteVersion : undefined,
    bookingRevisionId: isBooked ? `BK-${token}-${version}` : '',
    tripNumber: await createTripNumber(isBooked ? `PEU${token}-001` : undefined),
    invoiceNumber: isBooked ? `INV-${token}-Q${version}` : '',
  };
};

module.exports = { createBookingIdentifiers, createTripNumber };

const { v4: uuidv4 } = require('uuid');
const Client = require('../models/Client');
const { getNextFeSequence, extractFeToken } = require('../services/bookingIdentifiers');

const pad = (n, len = 4) => String(n).padStart(len, '0');

const generateTripNumber = async (token) => {
  const feToken = extractFeToken(token) || await getNextFeSequence();
  return `TRI-${feToken}`;
};

const generateRequestNumber = async (token) => {
  const feToken = extractFeToken(token) || await getNextFeSequence();
  return `REQ-${feToken}`;
};

const generateAccountNumber = async () => {
  const count = await Client.countDocuments();
  return `ACC-${pad(count + 1, 5)}`;
};

const generateInvoiceNumber = (tripNumber, version = 1) => {
  const feToken = extractFeToken(tripNumber) || 'FE001';
  return `INV-${feToken}-${String(version).padStart(2, '0')}`;
};

const generateQuoteNumber = (tripNumber, version = 1) => {
  const feToken = extractFeToken(tripNumber) || 'FE001';
  return `QUO-${feToken}${version > 1 ? `-${String(version).padStart(2, '0')}` : ''}`;
};

const generateShortId = () => uuidv4().split('-')[0].toUpperCase();

const generateDocumentId = () => uuidv4().replace(/-/g, '').slice(0, 16).toUpperCase();

module.exports = {
  generateTripNumber,
  generateRequestNumber,
  generateAccountNumber,
  generateInvoiceNumber,
  generateQuoteNumber,
  generateShortId,
  generateDocumentId,
};

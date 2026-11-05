const { v4: uuidv4 } = require('uuid');
const Booking = require('../models/Booking');
const AgentRequest = require('../models/AgentRequest');
const Client = require('../models/Client');

const pad = (n, len = 4) => String(n).padStart(len, '0');

const generateTripNumber = async () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const count = await Booking.countDocuments();
  return `ORB-${year}-${pad(count + 1)}`;
};

const generateRequestNumber = async () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const count = await AgentRequest.countDocuments();
  return `REQ-${year}-${pad(count + 1)}`;
};

const generateAccountNumber = async () => {
  const count = await Client.countDocuments();
  return `ACC-${pad(count + 1, 5)}`;
};

const generateInvoiceNumber = (tripNumber) => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `INV-${datePart}-${tripNumber.replace('ORB-', '')}`;
};

const generateQuoteNumber = (tripNumber, version = 1) => {
  return `QTE-${tripNumber.replace('ORB-', '')}-V${version}`;
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

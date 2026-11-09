const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const { authorize } = require('../middleware/auth');
const { createAuditEntry } = require('../services/auditService');
const pdfService = require('../services/pdfService');

const docTypes = ['quotation', 'invoice', 'flight-brief', 'charter-agreement', 'passenger-manifest', 'credit-note'];

// Helper: safely get booking from DB (by ObjectId, custom id, tripNumber, quoteReference, invoiceNumber) or request body
async function getBookingOr404(id, res, req) {
  let booking = null;

  const isObjectId = mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
  if (isObjectId) {
    try {
      booking = await Booking.findById(id);
    } catch {
      booking = null;
    }
  }

  if (!booking) {
    try {
      booking = await Booking.findOne({
        $or: [
          { id: id },
          { tripNumber: id },
          { quoteReference: id },
          { invoiceNumber: id },
        ],
        isDeleted: false,
      });
    } catch {
      booking = null;
    }
  }

  // Fallback: If booking is not in DB yet (e.g. client-generated state), use booking passed in request body
  if (!booking && req && req.body && req.body.booking) {
    booking = req.body.booking;
  }

  if (!booking) {
    res.status(404).json({ success: false, message: `Booking not found: ${id}` });
    return null;
  }

  return booking;
}

// Helper: extract raw plain object from Mongoose document or plain JS object
function extractBookingData(booking) {
  if (!booking) return {};
  if (typeof booking.toObject === 'function') {
    return booking.toObject();
  }
  return booking;
}

// Helper: stream PDF response
function sendPdf(res, buffer, filename) {
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': buffer.length,
  });
  res.send(buffer);
}

// POST /api/documents/quotation/:bookingId
router.post('/quotation/:bookingId', authorize('super_admin', 'admin', 'finance', 'operations', 'agent'), async (req, res, next) => {
  try {
    const booking = await getBookingOr404(req.params.bookingId, res, req);
    if (!booking) return;
    const bookingData = extractBookingData(booking);
    const pdf = await pdfService.generateQuotePdf(bookingData);
    const tripNum = bookingData.tripNumber || req.params.bookingId;
    await createAuditEntry({
      user: req.user,
      action: 'DOCUMENT_GENERATED',
      entityType: 'Document',
      entityId: tripNum,
      details: `Generated Quotation PDF for ${tripNum}`,
    }).catch(() => {});
    sendPdf(res, pdf, `Quotation-${tripNum}.pdf`);
  } catch (err) {
    next(err);
  }
});

// POST /api/documents/invoice/:bookingId
router.post('/invoice/:bookingId', authorize('super_admin', 'admin', 'finance', 'agent'), async (req, res, next) => {
  try {
    const booking = await getBookingOr404(req.params.bookingId, res, req);
    if (!booking) return;
    const bookingData = extractBookingData(booking);
    const pdf = await pdfService.generateInvoicePdf(bookingData);
    const invNum = bookingData.invoiceNumber || bookingData.tripNumber || req.params.bookingId;
    await createAuditEntry({
      user: req.user,
      action: 'DOCUMENT_GENERATED',
      entityType: 'Document',
      entityId: invNum,
      details: `Generated Invoice PDF #${invNum}`,
    }).catch(() => {});
    sendPdf(res, pdf, `Invoice-${invNum}.pdf`);
  } catch (err) {
    next(err);
  }
});

// POST /api/documents/flight-brief/:bookingId
router.post('/flight-brief/:bookingId', authorize('super_admin', 'admin', 'operations', 'agent'), async (req, res, next) => {
  try {
    const booking = await getBookingOr404(req.params.bookingId, res, req);
    if (!booking) return;
    const bookingData = extractBookingData(booking);
    const pdf = await pdfService.generateFlightBriefPdf(bookingData);
    const tripNum = bookingData.tripNumber || req.params.bookingId;
    await createAuditEntry({
      user: req.user,
      action: 'DOCUMENT_GENERATED',
      entityType: 'Document',
      entityId: tripNum,
      details: `Generated Flight Brief PDF for ${tripNum}`,
    }).catch(() => {});
    sendPdf(res, pdf, `FlightBrief-${tripNum}.pdf`);
  } catch (err) {
    next(err);
  }
});

// POST /api/documents/charter-agreement/:bookingId
router.post('/charter-agreement/:bookingId', authorize('super_admin', 'admin', 'operations', 'agent'), async (req, res, next) => {
  try {
    const booking = await getBookingOr404(req.params.bookingId, res, req);
    if (!booking) return;
    const bookingData = extractBookingData(booking);
    const pdf = await pdfService.generateCharterAgreementPdf(bookingData);
    const tripNum = bookingData.tripNumber || req.params.bookingId;
    await createAuditEntry({
      user: req.user,
      action: 'DOCUMENT_GENERATED',
      entityType: 'Document',
      entityId: tripNum,
      details: `Generated Charter Agreement PDF for ${tripNum}`,
    }).catch(() => {});
    sendPdf(res, pdf, `CharterAgreement-${tripNum}.pdf`);
  } catch (err) {
    next(err);
  }
});

// POST /api/documents/passenger-manifest/:bookingId
router.post('/passenger-manifest/:bookingId', authorize('super_admin', 'admin', 'operations'), async (req, res, next) => {
  try {
    const booking = await getBookingOr404(req.params.bookingId, res, req);
    if (!booking) return;
    const bookingData = extractBookingData(booking);
    const pdf = await pdfService.generatePassengerManifestPdf(bookingData);
    const tripNum = bookingData.tripNumber || req.params.bookingId;
    await createAuditEntry({
      user: req.user,
      action: 'DOCUMENT_GENERATED',
      entityType: 'Document',
      entityId: tripNum,
      details: `Generated Passenger Manifest PDF for ${tripNum}`,
    }).catch(() => {});
    sendPdf(res, pdf, `PassengerManifest-${tripNum}.pdf`);
  } catch (err) {
    next(err);
  }
});

// POST /api/documents/credit-note/:bookingId
router.post('/credit-note/:bookingId', authorize('super_admin', 'admin', 'finance'), async (req, res, next) => {
  try {
    const booking = await getBookingOr404(req.params.bookingId, res, req);
    if (!booking) return;
    const { reason, creditAmount } = req.body;
    const bookingData = extractBookingData(booking);
    const pdf = await pdfService.generateCreditNotePdf(bookingData, { reason, creditAmount });
    const invNum = bookingData.invoiceNumber || bookingData.tripNumber || req.params.bookingId;
    await createAuditEntry({
      user: req.user,
      action: 'DOCUMENT_GENERATED',
      entityType: 'Document',
      entityId: invNum,
      details: `Generated Credit Note PDF for invoice ${invNum}`,
    }).catch(() => {});
    sendPdf(res, pdf, `CreditNote-${invNum}.pdf`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

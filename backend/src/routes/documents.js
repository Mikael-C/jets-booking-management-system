const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { authorize } = require('../middleware/auth');
const { createAuditEntry } = require('../services/auditService');
const pdfService = require('../services/pdfService');

const docTypes = ['quotation', 'invoice', 'flight-brief', 'charter-agreement', 'passenger-manifest', 'credit-note'];

// Helper: get booking and send 404 if missing
async function getBookingOr404(id, res) {
  const booking = await Booking.findById(id);
  if (!booking) { res.status(404).json({ message: 'Booking not found' }); return null; }
  return booking;
}

// Helper: stream PDF response
function sendPdf(res, buffer, filename) {
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': buffer.length
  });
  res.send(buffer);
}

// POST /api/documents/quotation/:bookingId
router.post('/quotation/:bookingId', authorize('super_admin', 'admin', 'finance', 'operations'), async (req, res) => {
  const booking = await getBookingOr404(req.params.bookingId, res);
  if (!booking) return;
  const pdf = await pdfService.generateQuotePdf(booking.toObject());
  await createAuditEntry({ user: req.user,
    action: 'DOCUMENT_GENERATED', entityType: 'Document', entityId: booking.tripNumber,
    details: `Generated Quotation PDF for ${booking.tripNumber}`
  });
  sendPdf(res, pdf, `Quotation-${booking.tripNumber}.pdf`);
});

// POST /api/documents/invoice/:bookingId
router.post('/invoice/:bookingId', authorize('super_admin', 'admin', 'finance'), async (req, res) => {
  const booking = await getBookingOr404(req.params.bookingId, res);
  if (!booking) return;
  const pdf = await pdfService.generateInvoicePdf(booking.toObject());
  await createAuditEntry({ user: req.user,
    action: 'DOCUMENT_GENERATED', entityType: 'Document', entityId: booking.invoiceNumber,
    details: `Generated Invoice PDF #${booking.invoiceNumber} for ${booking.client.fullName}`
  });
  sendPdf(res, pdf, `Invoice-${booking.invoiceNumber}.pdf`);
});

// POST /api/documents/flight-brief/:bookingId
router.post('/flight-brief/:bookingId', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const booking = await getBookingOr404(req.params.bookingId, res);
  if (!booking) return;
  const pdf = await pdfService.generateFlightBriefPdf(booking.toObject());
  await createAuditEntry({ user: req.user,
    action: 'DOCUMENT_GENERATED', entityType: 'Document', entityId: booking.tripNumber,
    details: `Generated Flight Brief PDF for ${booking.tripNumber}`
  });
  sendPdf(res, pdf, `FlightBrief-${booking.tripNumber}.pdf`);
});

// POST /api/documents/charter-agreement/:bookingId
router.post('/charter-agreement/:bookingId', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const booking = await getBookingOr404(req.params.bookingId, res);
  if (!booking) return;
  const pdf = await pdfService.generateCharterAgreementPdf(booking.toObject());
  await createAuditEntry({ user: req.user,
    action: 'DOCUMENT_GENERATED', entityType: 'Document', entityId: booking.tripNumber,
    details: `Generated Charter Agreement PDF for ${booking.tripNumber}`
  });
  sendPdf(res, pdf, `CharterAgreement-${booking.tripNumber}.pdf`);
});

// POST /api/documents/passenger-manifest/:bookingId
router.post('/passenger-manifest/:bookingId', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const booking = await getBookingOr404(req.params.bookingId, res);
  if (!booking) return;
  const pdf = await pdfService.generatePassengerManifestPdf(booking.toObject());
  await createAuditEntry({ user: req.user,
    action: 'DOCUMENT_GENERATED', entityType: 'Document', entityId: booking.tripNumber,
    details: `Generated Passenger Manifest PDF for ${booking.tripNumber}`
  });
  sendPdf(res, pdf, `PassengerManifest-${booking.tripNumber}.pdf`);
});

// POST /api/documents/credit-note/:bookingId
router.post('/credit-note/:bookingId', authorize('super_admin', 'admin', 'finance'), async (req, res) => {
  const booking = await getBookingOr404(req.params.bookingId, res);
  if (!booking) return;
  const { reason, creditAmount } = req.body;
  const pdf = await pdfService.generateCreditNotePdf(booking.toObject(), { reason, creditAmount });
  await createAuditEntry({ user: req.user,
    action: 'DOCUMENT_GENERATED', entityType: 'Document', entityId: booking.invoiceNumber,
    details: `Generated Credit Note PDF for invoice ${booking.invoiceNumber}`
  });
  sendPdf(res, pdf, `CreditNote-${booking.invoiceNumber}.pdf`);
});

module.exports = router;

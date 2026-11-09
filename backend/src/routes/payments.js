const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const { authorize } = require('../middleware/auth');
const { createAuditEntry } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');
const { sendPaymentReceivedEmail } = require('../services/emailService');

// Safe Booking finder supporting ObjectId and custom ID strings
const findBooking = async (id, select = '') => {
  if (!id) return null;
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
  if (isObjectId) {
    try {
      const q = Booking.findById(id);
      if (select) q.select(select);
      const doc = await q;
      if (doc) return doc;
    } catch {}
  }
  const q = Booking.findOne({
    $or: [{ id: id }, { tripNumber: id }, { quoteReference: id }, { invoiceNumber: id }],
    isDeleted: false,
  });
  if (select) q.select(select);
  return await q;
};

// GET /api/payments — list all payment-related bookings
router.get('/', authorize('super_admin', 'admin', 'finance'), async (req, res) => {
  const { paymentStatus, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
  const filter = { isDeleted: { $ne: true } };
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [bookings, total] = await Promise.all([
    Booking.find(filter).select('tripNumber invoiceNumber client pricing paymentStatus paymentMethodChoice createdAt').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Booking.countDocuments(filter)
  ]);
  res.json({ payments: bookings, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

// GET /api/payments/booking/:bookingId
router.get('/booking/:bookingId', authorize('super_admin', 'admin', 'finance', 'operations'), async (req, res) => {
  const booking = await findBooking(
    req.params.bookingId,
    'tripNumber invoiceNumber client pricing paymentStatus paymentMethodChoice paymentReason cardFeePercentage cardFeeAmount totalWithCardFee createdAt updatedAt'
  );
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  res.json(booking);
});

// POST /api/payments/record — record a payment against a booking
router.post('/record', authorize('super_admin', 'admin', 'finance'), async (req, res) => {
  const { bookingId, paymentStatus, paymentMethodChoice, paymentReason, referenceNumber } = req.body;

  if (!bookingId || !paymentStatus) return res.status(400).json({ message: 'bookingId and paymentStatus are required' });
  const validStatuses = ['unpaid', 'deposit_paid', 'fully_paid', 'overdue', 'refunded'];
  if (!validStatuses.includes(paymentStatus)) return res.status(400).json({ message: 'Invalid paymentStatus' });

  const booking = await findBooking(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  const prevStatus = booking.paymentStatus;
  booking.paymentStatus = paymentStatus;
  if (paymentMethodChoice) booking.paymentMethodChoice = paymentMethodChoice;
  if (paymentReason) booking.paymentReason = paymentReason;
  if (paymentStatus === 'fully_paid' || paymentStatus === 'deposit_paid') {
    if (booking.status === 'accepted' || booking.status === 'quoted') {
      booking.status = 'paid';
    }
  }
  await booking.save();

  await createAuditEntry({ user: req.user,
    action: 'PAYMENT_RECORDED', entityType: 'Payment', entityId: booking.invoiceNumber,
    details: `Recorded payment for booking ${booking.tripNumber}: status changed from '${prevStatus}' to '${paymentStatus}'${referenceNumber ? ` (Ref: ${referenceNumber})` : ''}`
  });

  await createNotification({
    type: 'success',
    title: 'Payment Recorded',
    message: `Payment recorded for ${booking.tripNumber} — ${booking.client.fullName}. Status: ${paymentStatus}.`,
    entityId: booking._id.toString(),
    entityType: 'payment'
  });

  if (paymentStatus === 'fully_paid') {
    try {
      await sendPaymentReceivedEmail(booking.client.email, booking.toObject());
    } catch (emailErr) {
      console.error('Payment email failed:', emailErr.message);
    }
  }

  res.json(booking);
});

// POST /api/payments/calculate-card-fee
router.post('/calculate-card-fee', authorize('super_admin', 'admin', 'finance', 'operations', 'agent'), async (req, res) => {
  const { amount, feePercentage = 3.5 } = req.body;
  if (!amount || typeof amount !== 'number') return res.status(400).json({ message: 'Amount is required and must be a number' });
  const { calculateCardFee } = require('../services/pricingService');
  const result = calculateCardFee(amount, feePercentage);
  res.json({ amount, feePercentage, ...result });
});

module.exports = router;

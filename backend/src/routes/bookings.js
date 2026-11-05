const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Booking = require('../models/Booking');
const { authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { calculatePricing } = require('../services/pricingService');
const { generateInvoiceNumber } = require('../utils/generateId');
const { logBookingAction, logStatusChange } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');
const { sendStatusUpdateEmail } = require('../services/emailService');

// Valid booking status transitions
const VALID_TRANSITIONS = {
  draft: ['submitted', 'cancelled'],
  submitted: ['in_sourcing', 'cancelled', 'draft'],
  in_sourcing: ['quoted', 'cancelled'],
  quoted: ['quote_sent', 'cancelled', 'in_sourcing'],
  quote_sent: ['client_review', 'cancelled', 'expired'],
  client_review: ['accepted', 'cancelled', 'quoted'],
  accepted: ['paid', 'cancelled'],
  paid: ['confirmed', 'cancelled'],
  confirmed: ['dispatched', 'cancelled'],
  dispatched: ['in_flight', 'cancelled'],
  in_flight: ['flown'],
  flown: ['completed'],
  completed: [],
  cancelled: [],
  expired: [],
};

const DEFAULT_CHECKLIST = [
  { id: 'cl-1', label: 'Client passport / ID verified', category: 'passenger', completed: false },
  { id: 'cl-2', label: 'Passenger manifest submitted', category: 'passenger', completed: false },
  { id: 'cl-3', label: 'Flight plan filed with ATC', category: 'pre_flight', completed: false },
  { id: 'cl-4', label: 'Handling agents confirmed at origin', category: 'pre_flight', completed: false },
  { id: 'cl-5', label: 'Handling agents confirmed at destination', category: 'pre_flight', completed: false },
  { id: 'cl-6', label: 'Catering confirmed', category: 'pre_flight', completed: false },
  { id: 'cl-7', label: 'Ground transport arranged', category: 'pre_flight', completed: false },
  { id: 'cl-8', label: 'Charter agreement signed', category: 'documentation', completed: false },
  { id: 'cl-9', label: 'Invoice sent to client', category: 'documentation', completed: false },
  { id: 'cl-10', label: 'Payment received in full', category: 'payment', completed: false },
  { id: 'cl-11', label: 'Crew briefing completed', category: 'crew', completed: false },
  { id: 'cl-12', label: 'Aircraft airworthiness verified', category: 'crew', completed: false },
  { id: 'cl-13', label: 'Operator AOC checked and valid', category: 'documentation', completed: false },
  { id: 'cl-14', label: 'Insurance certificates on file', category: 'documentation', completed: false },
  { id: 'cl-15', label: 'Post-flight feedback collected', category: 'post_flight', completed: false },
];

// GET /api/bookings
router.get('/', async (req, res) => {
  const {
    page = 1, limit = 20, status, tripType, agentEmail, search,
    dateFrom, dateTo, sort = 'createdAt', order = 'desc',
  } = req.query;

  const filter = { isDeleted: false };

  // Agents can only see their own bookings
  if (req.userRole === 'agent') {
    filter.agentEmail = req.user.email;
  } else if (agentEmail) {
    filter.agentEmail = agentEmail;
  }

  if (status) filter.status = status;
  if (tripType) filter.tripType = tripType;
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  if (search) {
    filter.$or = [
      { tripNumber: new RegExp(search, 'i') },
      { 'client.fullName': new RegExp(search, 'i') },
      { 'client.email': new RegExp(search, 'i') },
      { 'client.companyName': new RegExp(search, 'i') },
      { agentName: new RegExp(search, 'i') },
    ];
  }

  const sortObj = { [sort]: order === 'asc' ? 1 : -1 };
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

  const [bookings, total] = await Promise.all([
    Booking.find(filter).sort(sortObj).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    Booking.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: bookings,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

// GET /api/bookings/:id
router.get('/:id', async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false });
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  // Agent can only see own bookings
  if (req.userRole === 'agent' && booking.agentEmail !== req.user.email) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  res.json({ success: true, data: booking });
});

// POST /api/bookings
router.post('/', async (req, res) => {
  const bookingData = {
    ...req.body,
    checklist: req.body.checklist?.length ? req.body.checklist : [...DEFAULT_CHECKLIST],
  };

  // Auto-generate invoice number if not provided
  if (!bookingData.invoiceNumber && bookingData.status !== 'draft') {
    // We'll set it after save when we have the tripNumber
  }

  const booking = await Booking.create(bookingData);

  if (!booking.invoiceNumber) {
    booking.invoiceNumber = generateInvoiceNumber(booking.tripNumber);
    await booking.save();
  }

  await logBookingAction(req.user, 'booking_created', booking, req);

  res.status(201).json({ success: true, data: booking });
});

// PUT /api/bookings/:id
router.put('/:id', async (req, res) => {
  if (['finance'].includes(req.userRole)) {
    return res.status(403).json({ success: false, message: 'Finance role cannot update bookings' });
  }

  const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false });
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  if (req.userRole === 'agent' && booking.agentEmail !== req.user.email) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  // Don't allow changing certain fields via PUT
  const { status, tripNumber, isDeleted, ...updateData } = req.body;

  const before = booking.toObject();
  Object.assign(booking, updateData);
  await booking.save();

  await logBookingAction(req.user, 'booking_updated', booking, req);

  res.json({ success: true, data: booking });
});

// DELETE /api/bookings/:id (soft delete, super_admin only)
router.delete('/:id', authorize('super_admin'), async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false });
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  booking.isDeleted = true;
  booking.deletedAt = new Date();
  booking.deletedBy = req.user.email;
  await booking.save();

  await logBookingAction(req.user, 'booking_deleted', booking, req);

  res.json({ success: true, message: 'Booking deleted successfully' });
});

// PATCH /api/bookings/:id/status
router.patch('/:id/status', async (req, res) => {
  if (req.userRole === 'agent') {
    return res.status(403).json({ success: false, message: 'Agents cannot change booking status' });
  }

  const { status } = req.body;
  if (!status) return res.status(400).json({ success: false, message: 'status is required' });

  const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false });
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  const allowedTransitions = VALID_TRANSITIONS[booking.status] || [];
  if (!allowedTransitions.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot transition from '${booking.status}' to '${status}'. Valid transitions: ${allowedTransitions.join(', ')}`,
    });
  }

  const oldStatus = booking.status;
  booking.status = status;
  await booking.save();

  await logStatusChange(req.user, 'booking', booking._id, oldStatus, status, req);

  // Send email notification for key transitions
  if (['confirmed', 'cancelled', 'quoted', 'paid'].includes(status) && booking.client?.email) {
    sendStatusUpdateEmail(booking.client.email, booking, oldStatus, status).catch(() => {});
  }

  res.json({ success: true, data: booking, message: `Status updated to ${status}` });
});

// PATCH /api/bookings/:id/payment-status
router.patch('/:id/payment-status', authorize('super_admin', 'admin', 'finance'), async (req, res) => {
  const { paymentStatus, paymentMethodChoice } = req.body;
  if (!paymentStatus) return res.status(400).json({ success: false, message: 'paymentStatus is required' });

  const validPaymentStatuses = ['unpaid', 'partial', 'paid', 'refunded', 'credited'];
  if (!validPaymentStatuses.includes(paymentStatus)) {
    return res.status(400).json({ success: false, message: `Invalid paymentStatus. Valid: ${validPaymentStatuses.join(', ')}` });
  }

  const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false });
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  booking.paymentStatus = paymentStatus;
  if (paymentMethodChoice) booking.paymentMethodChoice = paymentMethodChoice;

  // Auto-advance status to 'paid' if payment is complete
  if (paymentStatus === 'paid' && booking.status === 'accepted') {
    booking.status = 'paid';
  }

  await booking.save();
  await logBookingAction(req.user, 'payment_status_updated', booking, req);

  res.json({ success: true, data: booking });
});

// POST /api/bookings/:id/convert-to-confirmed
router.post('/:id/convert-to-confirmed', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false });
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  if (!['accepted', 'paid'].includes(booking.status)) {
    return res.status(400).json({
      success: false,
      message: 'Booking must be in accepted or paid status to confirm',
    });
  }

  booking.status = 'confirmed';
  if (!booking.invoiceNumber) {
    booking.invoiceNumber = generateInvoiceNumber(booking.tripNumber);
  }
  await booking.save();

  await logBookingAction(req.user, 'booking_confirmed', booking, req);

  res.json({ success: true, data: booking, message: 'Booking confirmed successfully' });
});

// GET /api/bookings/:id/checklist
router.get('/:id/checklist', async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false }).select('checklist tripNumber');
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  const completed = booking.checklist.filter((s) => s.completed).length;
  const total = booking.checklist.length;

  res.json({
    success: true,
    data: {
      checklist: booking.checklist,
      progress: { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 },
    },
  });
});

// PATCH /api/bookings/:id/checklist/:stepId
router.patch('/:id/checklist/:stepId', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const { completed } = req.body;
  if (completed === undefined) return res.status(400).json({ success: false, message: 'completed field is required' });

  const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false });
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  const step = booking.checklist.find((s) => s.id === req.params.stepId);
  if (!step) return res.status(404).json({ success: false, message: 'Checklist step not found' });

  step.completed = Boolean(completed);
  step.completedAt = completed ? new Date() : null;
  step.completedBy = completed ? req.user.name : '';
  await booking.save();

  res.json({ success: true, data: step });
});

// POST /api/bookings/calculate-pricing
router.post('/calculate-pricing', async (req, res) => {
  const { aircraft, legs, services, options } = req.body;
  if (!aircraft || !legs) {
    return res.status(400).json({ success: false, message: 'aircraft and legs are required' });
  }

  const pricing = calculatePricing(aircraft, legs, services || {}, options || {});
  res.json({ success: true, data: pricing });
});

module.exports = router;

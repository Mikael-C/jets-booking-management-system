const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const { createAuditEntry } = require('../services/auditService');

// Safe Booking finder supporting ObjectId and custom ID strings
const findBooking = async (id) => {
  if (!id) return null;
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
  if (isObjectId) {
    try {
      const doc = await Booking.findById(id);
      if (doc) return doc;
    } catch {}
  }
  return await Booking.findOne({
    $or: [{ id: id }, { invoiceNumber: id }, { tripNumber: id }, { quoteReference: id }],
    isDeleted: false,
  });
};

// GET /api/invoices — list all commercial invoices
router.get('/', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    const filter = {
      isDeleted: false,
      $or: [
        { invoiceNumber: { $exists: true, $ne: '' } },
        { status: { $in: ['confirmed', 'paid', 'completed'] } },
      ],
    };

    // Filter by payment status
    if (status && status !== 'all') {
      if (status === 'paid') filter.paymentStatus = 'fully_paid';
      else if (status === 'unpaid') filter.paymentStatus = 'unpaid';
      else if (status === 'overdue') filter.paymentStatus = 'overdue';
      else if (status === 'deposit') filter.paymentStatus = 'deposit_paid';
      else filter.paymentStatus = status;
    }

    // Agents can only see their assigned bookings
    if (req.userRole === 'agent') {
      filter.agentEmail = req.user.email;
    }

    // Search query
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$and = [
        {
          $or: [
            { invoiceNumber: regex },
            { tripNumber: regex },
            { 'client.fullName': regex },
            { 'client.email': regex },
            { 'client.companyName': regex },
            { accountNumber: regex },
          ],
        },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [invoices, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: invoices,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve invoices',
    });
  }
});

// GET /api/invoices/:id — get single invoice by ID or invoiceNumber or tripNumber
router.get('/:id', async (req, res) => {
  try {
    const booking = await findBooking(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching invoice' });
  }
});

// POST /api/invoices — upsert commercial tax invoice
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};

    const bookingId = body.id || `booking-inv-${Date.now()}`;
    const invoiceNumber = body.invoiceNumber || `0010${Math.floor(6020 + Math.random() * 3970)}`;
    const tripNumber = body.tripNumber || `ORB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 899)}`;

    // Try finding existing booking by ID, tripNumber, or invoiceNumber
    let booking = await findBooking(body.id || body.tripNumber || body.invoiceNumber);

    if (booking) {
      // Update existing record
      booking.invoiceNumber = invoiceNumber;
      if (body.accountNumber) booking.accountNumber = body.accountNumber;
      if (body.contractDate) booking.contractDate = body.contractDate;
      if (body.paymentDueDate) booking.paymentDueDate = body.paymentDueDate;
      if (body.status) booking.status = body.status;
      if (body.paymentStatus) booking.paymentStatus = body.paymentStatus;
      if (body.client) booking.client = { ...booking.client, ...body.client };
      if (body.operator) booking.operator = { ...booking.operator, ...body.operator };
      if (body.aircraft) booking.aircraft = { ...booking.aircraft, ...body.aircraft };
      if (body.pricing) booking.pricing = { ...booking.pricing, ...body.pricing };
      if (body.legs && body.legs.length > 0) booking.legs = body.legs;
      if (body.services) booking.services = { ...booking.services, ...body.services };
      if (body.tripActionAudit) {
        booking.tripActionAudit = [
          ...(body.tripActionAudit || []),
          ...(booking.tripActionAudit || []),
        ];
      }
      booking.updatedAt = new Date();
      await booking.save();
    } else {
      // Create new booking document with invoice details
      booking = new Booking({
        ...body,
        id: bookingId,
        invoiceNumber,
        tripNumber,
        accountNumber: body.accountNumber || 'ACC-21737',
        contractDate: body.contractDate || new Date().toLocaleDateString('de-DE'),
        quoteExpirationDate: body.quoteExpirationDate || '05.10.2026, 18:00z',
        paymentDueDate: body.paymentDueDate || new Date(Date.now() + 86400000 * 3).toLocaleDateString('de-DE'),
        status: body.status || 'confirmed',
        quoteStatus: body.quoteStatus || 'accepted',
        paymentStatus: body.paymentStatus || 'unpaid',
        tripType: body.tripType || 'round_trip',
        isDeleted: false,
      });
      await booking.save();
    }

    await createAuditEntry({
      user: req.user,
      action: 'INVOICE_GENERATED',
      entityType: 'Invoice',
      entityId: invoiceNumber,
      details: `Generated commercial tax invoice #${invoiceNumber} for trip ${tripNumber} (${booking.client?.fullName || 'Client'})`,
      req,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: `Commercial Invoice #${invoiceNumber} successfully compiled and recorded.`,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process commercial invoice',
    });
  }
});

// PATCH /api/invoices/:id/payment-status
router.patch('/:id/payment-status', async (req, res) => {
  try {
    const { paymentStatus, paymentMethodChoice } = req.body;
    const booking = await findBooking(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (paymentStatus) booking.paymentStatus = paymentStatus;
    if (paymentMethodChoice) booking.paymentMethodChoice = paymentMethodChoice;
    if (paymentStatus === 'fully_paid') {
      booking.status = 'confirmed';
    }
    booking.updatedAt = new Date();
    await booking.save();

    await createAuditEntry({
      user: req.user,
      action: 'INVOICE_PAYMENT_STATUS_UPDATED',
      entityType: 'Invoice',
      entityId: booking.invoiceNumber || booking.tripNumber,
      details: `Invoice payment status updated to ${paymentStatus}`,
      req,
    }).catch(() => {});

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update invoice status' });
  }
});

module.exports = router;

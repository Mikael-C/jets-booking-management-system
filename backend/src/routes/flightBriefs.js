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
    $or: [{ id: id }, { tripNumber: id }, { invoiceNumber: id }, { quoteReference: id }],
    isDeleted: false,
  });
};

// GET /api/flight-briefs — list all flight operations briefs
router.get('/', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    const filter = {
      isDeleted: false,
      tripNumber: { $exists: true, $ne: '' },
      'legs.0': { $exists: true },
    };

    if (status && status !== 'all') {
      if (status === 'confirmed') filter.status = 'confirmed';
      else if (status === 'dispatched') filter.status = { $in: ['dispatched', 'in_flight'] };
      else if (status === 'completed') filter.status = { $in: ['completed', 'flown'] };
      else filter.status = status;
    }

    if (req.userRole === 'agent') {
      filter.agentEmail = req.user.email;
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$and = [
        {
          $or: [
            { tripNumber: regex },
            { 'client.fullName': regex },
            { 'client.email': regex },
            { 'aircraft.name': regex },
            { 'aircraft.registration': regex },
            { 'legs.origin.icao': regex },
            { 'legs.destination.icao': regex },
            { 'legs.origin.city': regex },
            { 'legs.destination.city': regex },
          ],
        },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [briefs, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: briefs,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve flight briefs',
    });
  }
});

// GET /api/flight-briefs/:id — single flight brief
router.get('/:id', async (req, res) => {
  try {
    const booking = await findBooking(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Flight brief not found' });
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching flight brief' });
  }
});

// POST /api/flight-briefs — upsert flight operations brief
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};

    const bookingId = body.id || `booking-brief-${Date.now()}`;
    const tripNumber = body.tripNumber || `ORB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 899)}`;

    let booking = await findBooking(body.id || body.tripNumber);

    if (booking) {
      if (body.legs && body.legs.length > 0) booking.legs = body.legs;
      if (body.aircraft) booking.aircraft = { ...booking.aircraft, ...body.aircraft };
      if (body.operator) booking.operator = { ...booking.operator, ...body.operator };
      if (body.client) booking.client = { ...booking.client, ...body.client };
      if (body.status) booking.status = body.status;
      if (body.checklist) booking.checklist = body.checklist;
      if (body.tripActionAudit) {
        booking.tripActionAudit = [
          ...(body.tripActionAudit || []),
          ...(booking.tripActionAudit || []),
        ];
      }
      booking.updatedAt = new Date();
      await booking.save();
    } else {
      booking = new Booking({
        ...body,
        id: bookingId,
        tripNumber,
        status: body.status || 'confirmed',
        quoteStatus: body.quoteStatus || 'accepted',
        isDeleted: false,
      });
      await booking.save();
    }

    await createAuditEntry({
      user: req.user,
      action: 'FLIGHT_BRIEF_GENERATED',
      entityType: 'FlightBrief',
      entityId: tripNumber,
      details: `Generated flight operations brief for trip ${tripNumber} (${booking.legs?.length || 1} legs, crew assigned)`,
      req,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: `Flight Brief for Trip #${tripNumber} successfully prepared for operational dispatch.`,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process flight brief',
    });
  }
});

// PATCH /api/flight-briefs/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await findBooking(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Flight brief not found' });
    }

    if (status) booking.status = status;
    booking.updatedAt = new Date();
    await booking.save();

    await createAuditEntry({
      user: req.user,
      action: 'FLIGHT_STATUS_UPDATED',
      entityType: 'FlightBrief',
      entityId: booking.tripNumber,
      details: `Flight operational status updated to ${status}`,
      req,
    }).catch(() => {});

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update flight status' });
  }
});

module.exports = router;

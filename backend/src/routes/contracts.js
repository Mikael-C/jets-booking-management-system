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
    $or: [{ id: id }, { tripNumber: id }, { quoteReference: id }, { invoiceNumber: id }],
    isDeleted: false,
  });
};

// GET /api/contracts — list charter agreements
router.get('/', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    const filter = {
      isDeleted: false,
      $or: [
        { tripNumber: { $exists: true, $ne: '' } },
        { isContractSigned: { $exists: true } },
      ],
    };

    if (status && status !== 'all') {
      if (status === 'signed') filter.isContractSigned = true;
      else if (status === 'pending') filter.isContractSigned = { $ne: true };
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
            { accountNumber: regex },
            { quoteReference: regex },
          ],
        },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [contracts, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: contracts,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve contracts',
    });
  }
});

// GET /api/contracts/:id — single contract
router.get('/:id', async (req, res) => {
  try {
    const booking = await findBooking(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching contract' });
  }
});

// POST /api/contracts — upsert charter agreement
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};

    const bookingId = body.id || `booking-ca-${Date.now()}`;
    const tripNumber = body.tripNumber || `ORB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 899)}`;

    let booking = await findBooking(body.id || body.tripNumber);

    if (booking) {
      if (body.contractDate) booking.contractDate = body.contractDate;
      if (body.quoteExpirationDate) booking.quoteExpirationDate = body.quoteExpirationDate;
      if (body.paymentDueDate) booking.paymentDueDate = body.paymentDueDate;
      if (body.aircraft) booking.aircraft = { ...booking.aircraft, ...body.aircraft };
      if (body.client) booking.client = { ...booking.client, ...body.client };
      if (body.operator) booking.operator = { ...booking.operator, ...body.operator };
      if (body.legs && body.legs.length > 0) booking.legs = body.legs;
      if (body.pricing) booking.pricing = { ...booking.pricing, ...body.pricing };
      if (body.services) booking.services = { ...booking.services, ...body.services };
      if (typeof body.isContractSigned === 'boolean') {
        booking.isContractSigned = body.isContractSigned;
        if (body.contractSignedDate) booking.contractSignedDate = body.contractSignedDate;
        if (body.contractSignedBy) booking.contractSignedBy = body.contractSignedBy;
      }
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
        quoteReference: body.quoteReference || `QTE-${tripNumber}`,
        contractDate: body.contractDate || new Date().toLocaleDateString('de-DE'),
        status: body.status || 'confirmed',
        quoteStatus: 'accepted',
        isDeleted: false,
      });
      await booking.save();
    }

    await createAuditEntry({
      user: req.user,
      action: 'CONTRACT_GENERATED',
      entityType: 'Contract',
      entityId: tripNumber,
      details: `Generated charter agreement for trip ${tripNumber} (${booking.client?.fullName || 'Client'})`,
      req,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: `Master Charter Agreement for Trip #${tripNumber} successfully prepared and recorded.`,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process contract',
    });
  }
});

// POST /api/contracts/:id/sign — execute & sign charter contract
router.post('/:id/sign', async (req, res) => {
  try {
    const { signatoryName } = req.body || {};
    const booking = await findBooking(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }

    const signatory = signatoryName || booking.client?.fullName || 'Authorized Signatory';
    const signDate = new Date().toLocaleDateString('de-DE');

    booking.isContractSigned = true;
    booking.contractSignedDate = signDate;
    booking.contractSignedBy = signatory;
    booking.status = 'confirmed';
    booking.quoteStatus = 'accepted';

    const auditEntry = {
      id: `act-${Date.now()}`,
      action: 'CONTRACT_SIGNED',
      details: `Master Charter Agreement officially signed and executed by ${signatory}. Booking confirmed for active operations.`,
      timestamp: new Date().toLocaleString(),
      author: signatory,
      docType: 'charter_agreement',
    };

    booking.tripActionAudit = [auditEntry, ...(booking.tripActionAudit || [])];
    booking.updatedAt = new Date();
    await booking.save();

    await createAuditEntry({
      user: req.user,
      action: 'CONTRACT_SIGNED',
      entityType: 'Contract',
      entityId: booking.tripNumber,
      details: `Charter contract signed by ${signatory} for trip ${booking.tripNumber}`,
      req,
    }).catch(() => {});

    res.json({
      success: true,
      message: `Master Charter Agreement for Trip #${booking.tripNumber} successfully signed by ${signatory}.`,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sign contract',
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const AgentRequest = require('../models/AgentRequest');
const Booking = require('../models/Booking');
const { authorize } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const { createAuditEntry } = require('../services/auditService');
const { sendAgentNotificationEmail } = require('../services/emailService');
const { randomUUID } = require('crypto');
const { createBookingIdentifiers, createTripId } = require('../services/bookingIdentifiers');

// Helper to look up agent requests by Mongo _id, custom id, or requestNumber
const getAgentRequestFilter = (id) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
  if (isObjectId) {
    return {
      $or: [{ _id: id }, { id: id }, { requestNumber: id }, { avInodeTripId: id }],
      isDeleted: false,
    };
  }
  return {
    $or: [{ id: id }, { requestNumber: id }, { avInodeTripId: id }],
    isDeleted: false,
  };
};

// GET /api/agent-requests
router.get('/', async (req, res) => {
  const {
    page = 1, limit = 20, status, priority, type, agentEmail,
    search, sort = 'createdAt', order = 'desc',
  } = req.query;

  const filter = { isDeleted: false };

  if (req.userRole === 'agent') {
    filter.agentEmail = req.user.email;
  } else if (agentEmail) {
    filter.agentEmail = agentEmail;
  }

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (type) filter.type = type;

  if (search) {
    filter.$or = [
      { requestNumber: new RegExp(search, 'i') },
      { title: new RegExp(search, 'i') },
      { clientName: new RegExp(search, 'i') },
      { agentName: new RegExp(search, 'i') },
      { route: new RegExp(search, 'i') },
    ];
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

  const [requests, total] = await Promise.all([
    AgentRequest.find(filter).sort(sortObj).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    AgentRequest.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: requests,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

// GET /api/agent-requests/:id
router.get('/:id', async (req, res) => {
  const request = await AgentRequest.findOne(getAgentRequestFilter(req.params.id));
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

  if (req.userRole === 'agent' && request.agentEmail !== req.user.email) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  res.json({ success: true, data: request });
});

// POST /api/agent-requests
router.post('/', async (req, res) => {
  const { id, requestNumber, status, isDeleted, tripId, quoteGroupId, ...submittedData } = req.body;
  const requestData = {
    ...submittedData,
    tripId: submittedData.type === 'quote' ? await createTripId() : '',
    quoteGroupId: submittedData.type === 'quote' ? randomUUID() : '',
    agentName: req.user.name,
    agentEmail: req.user.email,
    status: 'pending',
  };

  const request = await AgentRequest.create(requestData);

  await createAuditEntry({
    user: req.user,
    action: 'agent_request_created',
    entityType: 'agent_request',
    entityId: request._id,
    details: { requestNumber: request.requestNumber, type: request.type },
    req,
  });

  res.status(201).json({ success: true, data: request });
});

// PUT /api/agent-requests/:id
router.put('/:id', async (req, res) => {
  const request = await AgentRequest.findOne(getAgentRequestFilter(req.params.id));
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

  if (req.userRole === 'agent' && request.agentEmail !== req.user.email) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const { status, requestNumber, isDeleted, tripId, quoteGroupId, ...updateData } = req.body;
  Object.assign(request, updateData);
  await request.save();

  res.json({ success: true, data: request });
});

// PATCH /api/agent-requests/:id/status
router.patch('/:id/status', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const { status, assignedTo, assignedToEmail } = req.body;
  if (!status) return res.status(400).json({ success: false, message: 'status is required' });

  const request = await AgentRequest.findOne(getAgentRequestFilter(req.params.id));
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

  request.status = status;
  if (assignedTo) request.assignedTo = assignedTo;
  if (assignedToEmail) request.assignedToEmail = assignedToEmail;
  await request.save();

  // Notify agent
  if (request.agentEmail) {
    sendAgentNotificationEmail(request.agentEmail, request).catch(() => {});
  }

  await createAuditEntry({
    user: req.user,
    action: 'agent_request_status_changed',
    entityType: 'agent_request',
    entityId: request._id,
    details: { requestNumber: request.requestNumber, newStatus: status },
    req,
  });

  res.json({ success: true, data: request });
});

// POST /api/agent-requests/:id/messages
router.post('/:id/messages', async (req, res) => {
  const { message, attachments } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'message is required' });

  const request = await AgentRequest.findOne(getAgentRequestFilter(req.params.id));
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

  if (req.userRole === 'agent' && request.agentEmail !== req.user.email) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const newMessage = {
    id: uuidv4(),
    sender: req.user.name,
    senderRole: req.user.role,
    senderEmail: req.user.email,
    message,
    timestamp: new Date(),
    attachments: attachments || [],
  };

  request.messages.push(newMessage);
  await request.save();

  res.status(201).json({ success: true, data: newMessage });
});

// GET /api/agent-requests/:id/messages
router.get('/:id/messages', async (req, res) => {
  const request = await AgentRequest.findOne(getAgentRequestFilter(req.params.id)).select('messages agentEmail');
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

  if (req.userRole === 'agent' && request.agentEmail !== req.user.email) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  res.json({ success: true, data: request.messages });
});

// POST /api/agent-requests/:id/sourcing-options
router.post('/:id/sourcing-options', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const request = await AgentRequest.findOne(getAgentRequestFilter(req.params.id));
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

  const option = { id: uuidv4(), ...req.body };
  request.sourcingOptions.push(option);
  await request.save();

  res.status(201).json({ success: true, data: option });
});

// DELETE /api/agent-requests/:id/sourcing-options/:optionId
router.delete('/:id/sourcing-options/:optionId', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const request = await AgentRequest.findOne(getAgentRequestFilter(req.params.id));
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

  request.sourcingOptions = request.sourcingOptions.filter((o) => o.id !== req.params.optionId);
  await request.save();

  res.json({ success: true, message: 'Sourcing option removed' });
});

// PATCH /api/agent-requests/:id/avinode-id
router.patch('/:id/avinode-id', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const { avInodeTripId } = req.body;
  if (!avInodeTripId) return res.status(400).json({ success: false, message: 'avInodeTripId is required' });

  const request = await AgentRequest.findOneAndUpdate(
    getAgentRequestFilter(req.params.id),
    { avInodeTripId },
    { new: true }
  );

  if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
  res.json({ success: true, data: request });
});

// POST /api/agent-requests/:id/fulfill — fulfill request → creates booking
router.post('/:id/fulfill', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const request = await AgentRequest.findOne(getAgentRequestFilter(req.params.id));
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

  if (request.fulfilledBookingId) {
    const existingBooking = await Booking.findById(request.fulfilledBookingId);
    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: 'Request already fulfilled',
        data: { bookingId: existingBooking._id, tripNumber: existingBooking.tripNumber },
      });
    }
  }

  const isQuote = request.type === 'quote';
  const quoteGroupId = request.quoteGroupId || undefined;
  const identifiers = await createBookingIdentifiers({
    quoteGroupId,
    tripId: request.tripId || undefined,
    isQuote,
    isBooked: Boolean(req.body.isBooked),
  });
  if (isQuote) {
    request.tripId = identifiers.tripId;
    request.quoteGroupId = identifiers.quoteGroupId;
  }
  const bookingData = {
    ...req.body,
    ...identifiers,
    source: 'agent_request',
    sourceAgentRequestId: request._id,
    status: 'quoted',
    tripType: req.body.tripType || request.tripType || 'one_way',
    aircraft: req.body.aircraft || {},
    client: req.body.client || {
      fullName: request.clientName,
      email: request.clientEmail,
      phone: request.clientPhone || '',
    },
    operator: req.body.operator || {},
    legs: req.body.legs || [{
      from: request.originIcao,
      fromIcao: request.originIcao,
      to: request.destIcao,
      toIcao: request.destIcao,
      departureDate: request.flightDate,
      paxCount: request.paxCount,
    }],
    pricing: req.body.pricing || {},
    services: req.body.services || {},
    agentName: request.agentName,
    agentEmail: request.agentEmail,
    sourcingOptions: request.sourcingOptions,
    avInodeTripId: request.avInodeTripId,
    notes: req.body.notes || request.notes,
    agentName: request.agentName,
    agentEmail: request.agentEmail,
    quoteStatus: isQuote ? (req.body.quoteStatus || 'draft') : undefined,
  };

  const booking = await Booking.create(bookingData);

  request.status = 'completed';
  request.fulfilledBookingId = booking._id;
  await request.save();

  await createAuditEntry({
    user: req.user,
    action: 'agent_request_fulfilled',
    entityType: 'agent_request',
    entityId: request._id,
    details: { requestNumber: request.requestNumber, bookingId: booking._id, tripNumber: booking.tripNumber },
    req,
  });

  res.status(201).json({
    success: true,
    data: { booking, request },
    message: `Booking ${booking.tripNumber} created from request ${request.requestNumber}`,
  });
});

// DELETE /api/agent-requests/:id
router.delete('/:id', authorize('super_admin', 'admin'), async (req, res) => {
  const request = await AgentRequest.findOne(getAgentRequestFilter(req.params.id));
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

  request.isDeleted = true;
  request.deletedAt = new Date();
  await request.save();

  res.json({ success: true, message: 'Request deleted' });
});

module.exports = router;

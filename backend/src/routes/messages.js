const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Message = require('../models/Message');
const AgentRequest = require('../models/AgentRequest');
const { createAuditEntry } = require('../services/auditService');

// Helper to look up message by Mongo _id or custom id
const getMessageFilter = (id) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
  if (isObjectId) {
    return { $or: [{ _id: id }, { id: id }], isDeleted: false };
  }
  return { id: id, isDeleted: false };
};

// GET /api/messages
router.get('/', async (req, res) => {
  const { channel, recipientEmail, tripNumber, requestId, limit = 100 } = req.query;
  const userEmail = (req.user?.email || '').trim().toLowerCase();
  const userRole = req.userRole;

  const query = { isDeleted: false };

  if (channel && channel !== 'direct' && channel !== 'all') {
    query.channel = channel;
  } else if (recipientEmail) {
    const recLower = recipientEmail.trim().toLowerCase();
    query.$or = [
      { senderEmail: userEmail, recipientEmail: recLower },
      { senderEmail: recLower, recipientEmail: userEmail },
    ];
  } else if (tripNumber) {
    query.tripNumber = tripNumber;
  } else if (requestId) {
    query.requestId = requestId;
  } else {
    // When no specific filter is given (general list):
    // Super admins and admins see all messages.
    // Other roles see all public channels + direct messages where they are sender or recipient.
    if (userRole !== 'super_admin' && userRole !== 'admin') {
      query.$or = [
        { channel: { $in: ['broker_desk', 'operations', 'finance', 'client_services', 'general'] } },
        { senderEmail: userEmail },
        { recipientEmail: userEmail },
      ];
    }
  }

  const messages = await Message.find(query)
    .sort({ createdAt: 1 })
    .limit(Math.min(250, parseInt(limit)))
    .lean();

  res.json({
    success: true,
    data: messages.map((m) => ({
      ...m,
      id: m.id || m._id.toString(),
    })),
  });
});

// GET /api/messages/unread-count
router.get('/unread-count', async (req, res) => {
  const userEmail = (req.user?.email || '').trim().toLowerCase();
  const count = await Message.countDocuments({
    isDeleted: false,
    senderEmail: { $ne: userEmail },
    $or: [
      { recipientEmail: userEmail },
      { channel: { $in: ['broker_desk', 'operations', 'finance', 'client_services', 'general'] } }
    ],
    'readBy.userEmail': { $ne: userEmail },
  });

  res.json({ success: true, count });
});

// POST /api/messages
router.post('/', async (req, res) => {
  const { channel = 'operations', recipientEmail, recipientName, recipientRole, content, tripNumber, requestId, attachments } = req.body;

  if (!content && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ success: false, message: 'Message content or attachment is required' });
  }

  const userEmail = (req.user?.email || '').trim().toLowerCase();
  const recEmail = recipientEmail ? recipientEmail.trim().toLowerCase() : '';

  // Preserve public channel name if provided (e.g. broker_desk), only default to direct if no channel provided
  const finalChannel = channel && channel !== 'direct' ? channel : (recEmail ? 'direct' : 'operations');

  const messageDoc = {
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    channel: finalChannel,
    senderId: req.user?._id ? req.user._id.toString() : '',
    senderName: req.user?.name || 'Staff Member',
    senderEmail: userEmail,
    senderRole: req.user?.role || req.userRole || 'operations',
    recipientEmail: recEmail,
    recipientName: recipientName || '',
    recipientRole: recipientRole || '',
    content: content || 'Shared a document',
    tripNumber: tripNumber || '',
    requestId: requestId || '',
    attachments: attachments || [],
    readBy: [{ userEmail, readAt: new Date() }],
  };

  const newMessage = await Message.create(messageDoc);

  // If this message belongs to an AgentRequest, also push to the AgentRequest messages array for audit consistency
  if (requestId) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(requestId) && String(new mongoose.Types.ObjectId(requestId)) === String(requestId);
      const reqFilter = isObjectId
        ? { $or: [{ _id: requestId }, { id: requestId }, { requestNumber: requestId }], isDeleted: false }
        : { $or: [{ id: requestId }, { requestNumber: requestId }], isDeleted: false };

      const agentReq = await AgentRequest.findOne(reqFilter);
      if (agentReq) {
        agentReq.messages.push({
          id: newMessage.id,
          sender: newMessage.senderName,
          senderRole: newMessage.senderRole,
          senderEmail: newMessage.senderEmail,
          message: newMessage.content,
          timestamp: new Date(),
          attachments: attachments || [],
        });
        await agentReq.save();
      }
    } catch (e) {
      // Non-fatal sync note
    }
  }

  await createAuditEntry({
    user: req.user,
    action: 'MESSAGE_SENT',
    entityType: 'Message',
    entityId: newMessage.id,
    details: `Message sent by ${newMessage.senderName} (${newMessage.senderRole}) in ${newMessage.channel}`,
    req,
  }).catch(() => {});

  res.status(201).json({ success: true, data: newMessage });
});

// PATCH /api/messages/:id/read
router.patch('/:id/read', async (req, res) => {
  const userEmail = (req.user?.email || '').trim().toLowerCase();
  const message = await Message.findOne(getMessageFilter(req.params.id));
  if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

  const alreadyRead = message.readBy.some((r) => (r.userEmail || '').toLowerCase() === userEmail);
  if (!alreadyRead) {
    message.readBy.push({ userEmail, readAt: new Date() });
    await message.save();
  }

  res.json({ success: true, message: 'Marked as read' });
});

module.exports = router;

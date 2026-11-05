const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Client = require('../models/Client');
const Booking = require('../models/Booking');
const { authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createAuditEntry } = require('../services/auditService');

const clientSchema = Joi.object({
  accountNumber: Joi.string().optional(),
  fullName: Joi.string().required(),
  companyName: Joi.string().optional().allow(''),
  streetAddress: Joi.string().required(),
  cityPostalCountry: Joi.string().required(),
  phone: Joi.string().required(),
  email: Joi.string().email().required(),
  vatNumber: Joi.string().optional().allow(''),
  vipTier: Joi.string().valid('Ultra HNWI', 'Corporate Executive', 'Family Office', 'Private VIP').default('Private VIP'),
  preferredJetCategory: Joi.string().optional().allow(''),
  notes: Joi.string().optional().allow('')
});

// GET /api/clients
router.get('/', authorize('super_admin', 'admin', 'finance', 'operations', 'agent'), async (req, res) => {
  const { search, vipTier, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { companyName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { accountNumber: { $regex: search, $options: 'i' } }
    ];
  }
  if (vipTier) filter.vipTier = vipTier;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [clients, total] = await Promise.all([
    Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Client.countDocuments(filter)
  ]);
  res.json({ clients, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

// GET /api/clients/:id
router.get('/:id', authorize('super_admin', 'admin', 'finance', 'operations', 'agent'), async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ message: 'Client not found' });
  res.json(client);
});

// GET /api/clients/:id/bookings
router.get('/:id/bookings', authorize('super_admin', 'admin', 'finance', 'operations'), async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ message: 'Client not found' });
  const bookings = await Booking.find({
    'client.accountNumber': client.accountNumber,
    isDeleted: { $ne: true }
  }).sort({ createdAt: -1 });
  res.json(bookings);
});

// POST /api/clients
router.post('/', authorize('super_admin', 'admin', 'operations'), validate(clientSchema), async (req, res) => {
  const existing = await Client.findOne({ email: req.body.email });
  if (existing) return res.status(409).json({ message: 'Client with this email already exists' });

  const accNum = req.body.accountNumber || `ACC-${Math.floor(10000 + Math.random() * 90000)}`;
  const client = new Client({ ...req.body, accountNumber: accNum });
  await client.save();

  await createAuditEntry({ user: req.user,
    action: 'CLIENT_CREATED', entityType: 'Client', entityId: client._id.toString(),
    details: `Created client record for ${client.fullName}`
  });
  res.status(201).json(client);
});

// PUT /api/clients/:id
router.put('/:id', authorize('super_admin', 'admin', 'operations'), validate(clientSchema), async (req, res) => {
  const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!client) return res.status(404).json({ message: 'Client not found' });

  await createAuditEntry({ user: req.user,
    action: 'CLIENT_UPDATED', entityType: 'Client', entityId: client._id.toString(),
    details: `Updated client record for ${client.fullName}`
  });
  res.json(client);
});

// DELETE /api/clients/:id
router.delete('/:id', authorize('super_admin'), async (req, res) => {
  const client = await Client.findByIdAndDelete(req.params.id);
  if (!client) return res.status(404).json({ message: 'Client not found' });

  await createAuditEntry({ user: req.user,
    action: 'CLIENT_DELETED', entityType: 'Client', entityId: req.params.id,
    details: `Deleted client record for ${client.fullName}`
  });
  res.json({ message: 'Client deleted' });
});

module.exports = router;

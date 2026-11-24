const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Operator = require('../models/Operator');
const { authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createAuditEntry } = require('../services/auditService');
const dayjs = require('dayjs');
const mongoose = require('mongoose');

// Operators are addressed by Mongo _id or by the app's own id (e.g. "op-1732…")
const operatorFilter = (id) =>
  mongoose.Types.ObjectId.isValid(id) ? { $or: [{ _id: id }, { id }] } : { id };

const qualDocSchema = Joi.object({
  id: Joi.string().optional(),
  docType: Joi.string().required(),
  status: Joi.string().valid('pass', 'fail', 'pending').required(),
  expiryDate: Joi.string().optional().allow(''),
  notes: Joi.string().optional().allow('')
});

// Only the legal name is required: operators added from the quote builder (step 04a) are saved with
// whatever the broker knows so far and status "pending" (Documents pending) until the nine checks are done.
const operatorSchema = Joi.object({
  id: Joi.string().allow('').optional(),
  legalName: Joi.string().trim().required(),
  tradingName: Joi.string().allow('').optional(),
  aocNumber: Joi.string().allow('').optional(),
  aocAuthority: Joi.string().allow('').optional(),
  aocExpiry: Joi.string().allow('').optional(),
  baseIcao: Joi.string().allow('').max(4).optional(),
  country: Joi.string().allow('').optional(),
  salesContact: Joi.string().allow('').optional(),
  salesEmail: Joi.string().email().allow('').optional(),
  opsPhone: Joi.string().allow('').optional(),
  opsEmail: Joi.string().email().allow('').optional(),
  status: Joi.string().valid('pending', 'approved', 'approved_with_conditions', 'suspended', 'rejected').default('pending'),
  insuranceExpiry: Joi.string().optional().allow(''),
  safetyRating: Joi.string().optional().allow(''),
  safetyRatingProvider: Joi.string().optional().allow(''),
  notes: Joi.string().optional().allow(''),
  addedFromQuote: Joi.string().optional().allow(''),
  qualificationChecklist: Joi.array().items(qualDocSchema).optional()
});

// GET /api/operators
router.get('/', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const { status, search, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    // Operators are searched by name, AOC number and country / issuing authority
    const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { legalName: { $regex: safe, $options: 'i' } },
      { tradingName: { $regex: safe, $options: 'i' } },
      { aocNumber: { $regex: safe, $options: 'i' } },
      { aocAuthority: { $regex: safe, $options: 'i' } },
      { country: { $regex: safe, $options: 'i' } },
      { baseIcao: { $regex: safe, $options: 'i' } }
    ];
  }
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [operators, total] = await Promise.all([
    Operator.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Operator.countDocuments(filter)
  ]);
  res.json({ operators, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

// GET /api/operators/expiry-alerts
router.get('/expiry-alerts', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const thirtyDaysFromNow = dayjs().add(30, 'day').toISOString();
  const today = dayjs().toISOString();
  const operators = await Operator.find({ status: { $ne: 'rejected' } });

  const alerts = [];
  operators.forEach(op => {
    if (op.aocExpiry && op.aocExpiry <= thirtyDaysFromNow) {
      alerts.push({ operatorId: op._id, operatorName: op.tradingName, type: 'AOC', expiryDate: op.aocExpiry, daysLeft: dayjs(op.aocExpiry).diff(dayjs(), 'day') });
    }
    if (op.insuranceExpiry && op.insuranceExpiry <= thirtyDaysFromNow) {
      alerts.push({ operatorId: op._id, operatorName: op.tradingName, type: 'Insurance', expiryDate: op.insuranceExpiry, daysLeft: dayjs(op.insuranceExpiry).diff(dayjs(), 'day') });
    }
    op.qualificationChecklist?.forEach(doc => {
      if (doc.expiryDate && doc.expiryDate <= thirtyDaysFromNow) {
        alerts.push({ operatorId: op._id, operatorName: op.tradingName, type: doc.docType, expiryDate: doc.expiryDate, daysLeft: dayjs(doc.expiryDate).diff(dayjs(), 'day') });
      }
    });
  });
  alerts.sort((a, b) => a.daysLeft - b.daysLeft);
  res.json(alerts);
});

// GET /api/operators/:id
router.get('/:id', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const op = await Operator.findOne(operatorFilter(req.params.id));
  if (!op) return res.status(404).json({ message: 'Operator not found' });
  res.json(op);
});

// POST /api/operators
router.post('/', authorize('super_admin', 'admin'), validate(operatorSchema), async (req, res) => {
  const defaultChecklist = [
    'Air Operator Certificate (AOC)', 'Aircraft registered on AOC',
    'Certificate of Airworthiness (ARC)', 'Third Party & Passenger Liability Insurance',
    'Independent Safety Audit Rating', 'Crew Licensing, Medicals & Recurrent Training',
    '24/7 Operations Control Center (OCC)', 'No Sub-Charter without Prior Consent Clause',
    'Master Charter Broker Agreement Signed'
  ].map((docType, i) => ({ id: `doc-${i + 1}`, docType, status: 'pending' }));

  // Same AOC already on file: return the existing record instead of creating a duplicate
  if (req.body.aocNumber) {
    const existing = await Operator.findOne({ aocNumber: req.body.aocNumber, isActive: { $ne: false } });
    if (existing) return res.status(200).json(existing);
  }

  const op = new Operator({
    ...req.body,
    tradingName: req.body.tradingName || req.body.legalName,
    qualificationChecklist: req.body.qualificationChecklist?.length ? req.body.qualificationChecklist : defaultChecklist
  });
  await op.save();

  await createAuditEntry({ user: req.user,
    action: 'OPERATOR_CREATED', entityType: 'Operator', entityId: op._id.toString(),
    details: `Created operator record for ${op.tradingName} (${op.aocNumber})`
  });
  res.status(201).json(op);
});

// PUT /api/operators/:id
router.put('/:id', authorize('super_admin', 'admin'), validate(operatorSchema), async (req, res) => {
  const op = await Operator.findOneAndUpdate(operatorFilter(req.params.id), req.body, { new: true, runValidators: true });
  if (!op) return res.status(404).json({ message: 'Operator not found' });

  await createAuditEntry({ user: req.user,
    action: 'OPERATOR_UPDATED', entityType: 'Operator', entityId: op._id.toString(),
    details: `Updated operator record for ${op.tradingName}`
  });
  res.json(op);
});

// PATCH /api/operators/:id/status
router.patch('/:id/status', authorize('super_admin', 'admin'), async (req, res) => {
  const { status, notes } = req.body;
  const validStatuses = ['pending', 'approved', 'approved_with_conditions', 'suspended', 'rejected'];
  if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });

  const op = await Operator.findOneAndUpdate(operatorFilter(req.params.id), { status, ...(notes && { notes }) }, { new: true });
  if (!op) return res.status(404).json({ message: 'Operator not found' });

  await createAuditEntry({ user: req.user,
    action: 'OPERATOR_STATUS_CHANGE', entityType: 'Operator', entityId: op._id.toString(),
    details: `Changed operator ${op.tradingName} status to '${status}'${notes ? ` — ${notes}` : ''}`
  });
  res.json(op);
});

// PATCH /api/operators/:id/checklist/:docId
router.patch('/:id/checklist/:docId', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const { status, notes, expiryDate } = req.body;
  const op = await Operator.findOne(operatorFilter(req.params.id));
  if (!op) return res.status(404).json({ message: 'Operator not found' });

  const docIndex = op.qualificationChecklist.findIndex(d => d.id === req.params.docId);
  if (docIndex === -1) return res.status(404).json({ message: 'Document not found in checklist' });

  op.qualificationChecklist[docIndex] = {
    ...op.qualificationChecklist[docIndex],
    status: status || op.qualificationChecklist[docIndex].status,
    ...(notes && { notes }),
    ...(expiryDate && { expiryDate })
  };
  await op.save();

  await createAuditEntry({ user: req.user,
    action: 'OPERATOR_CHECKLIST_UPDATE', entityType: 'Operator', entityId: op._id.toString(),
    details: `Updated qualification doc '${op.qualificationChecklist[docIndex].docType}' to status '${status}' for ${op.tradingName}`
  });
  res.json(op);
});

module.exports = router;

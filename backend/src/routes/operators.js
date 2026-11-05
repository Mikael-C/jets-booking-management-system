const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Operator = require('../models/Operator');
const { authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createAuditEntry } = require('../services/auditService');
const dayjs = require('dayjs');

const qualDocSchema = Joi.object({
  docType: Joi.string().required(),
  status: Joi.string().valid('pass', 'fail', 'pending').required(),
  expiryDate: Joi.string().optional().allow(''),
  notes: Joi.string().optional().allow('')
});

const operatorSchema = Joi.object({
  legalName: Joi.string().required(),
  tradingName: Joi.string().required(),
  aocNumber: Joi.string().required(),
  aocAuthority: Joi.string().required(),
  aocExpiry: Joi.string().required(),
  baseIcao: Joi.string().required(),
  salesContact: Joi.string().required(),
  salesEmail: Joi.string().email().required(),
  opsPhone: Joi.string().required(),
  opsEmail: Joi.string().email().required(),
  status: Joi.string().valid('pending', 'approved', 'approved_with_conditions', 'suspended', 'rejected').default('pending'),
  insuranceExpiry: Joi.string().optional().allow(''),
  safetyRating: Joi.string().optional().allow(''),
  safetyRatingProvider: Joi.string().optional().allow(''),
  notes: Joi.string().optional().allow(''),
  qualificationChecklist: Joi.array().items(qualDocSchema).optional()
});

// GET /api/operators
router.get('/', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const { status, search, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { legalName: { $regex: search, $options: 'i' } },
      { tradingName: { $regex: search, $options: 'i' } },
      { aocNumber: { $regex: search, $options: 'i' } }
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
  const op = await Operator.findById(req.params.id);
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

  const op = new Operator({
    ...req.body,
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
  const op = await Operator.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
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

  const op = await Operator.findByIdAndUpdate(req.params.id, { status, ...(notes && { notes }) }, { new: true });
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
  const op = await Operator.findById(req.params.id);
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

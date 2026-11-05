const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { authorize } = require('../middleware/auth');

// GET /api/audit-log
router.get('/', authorize('super_admin', 'admin', 'operations', 'finance'), async (req, res) => {
  const { entityType, action, userEmail, dateFrom, dateTo, search, page = 1, limit = 100 } = req.query;
  const filter = {};

  if (entityType && entityType !== 'all') {
    filter.entityType = { $regex: new RegExp(`^${entityType}$`, 'i') };
  }
  if (action && action !== 'all') {
    filter.action = { $regex: action, $options: 'i' };
  }
  if (userEmail) {
    filter.userEmail = { $regex: userEmail, $options: 'i' };
  }
  if (search) {
    filter.$or = [
      { userName: { $regex: search, $options: 'i' } },
      { userEmail: { $regex: search, $options: 'i' } },
      { action: { $regex: search, $options: 'i' } },
      { entityId: { $regex: search, $options: 'i' } },
      { details: { $regex: search, $options: 'i' } },
    ];
  }
  if (dateFrom || dateTo) {
    filter.timestamp = {};
    if (dateFrom) filter.timestamp.$gte = new Date(dateFrom);
    if (dateTo) filter.timestamp.$lte = new Date(dateTo);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [entries, total] = await Promise.all([
    AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(parseInt(limit)),
    AuditLog.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: entries,
    entries,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

// POST /api/audit-log (record an activity event)
router.post('/', async (req, res) => {
  const { userEmail, userName, action, entityType, entityId, details } = req.body;

  const entry = new AuditLog({
    userEmail: userEmail || req.user?.email || 'system',
    userName: userName || req.user?.name || 'User',
    action: action || 'ACTIVITY',
    entityType: entityType || 'General',
    entityId: entityId || `ACT-${Date.now()}`,
    details: details || 'Activity recorded',
    ipAddress: req.ip,
    timestamp: new Date(),
  });

  await entry.save();
  res.status(201).json({ success: true, data: entry });
});

module.exports = router;

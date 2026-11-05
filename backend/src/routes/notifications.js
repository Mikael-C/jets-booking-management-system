const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authorize } = require('../middleware/auth');

// GET /api/notifications
router.get('/', authorize('super_admin', 'admin', 'finance', 'operations', 'agent'), async (req, res) => {
  const { read, limit = 50 } = req.query;
  const filter = {};
  if (read === 'false') filter.read = false;
  if (read === 'true') filter.read = true;
  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));
  const unreadCount = await Notification.countDocuments({ read: false });
  res.json({ notifications, unreadCount });
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authorize('super_admin', 'admin', 'finance', 'operations', 'agent'), async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  res.json(notification);
});

// PATCH /api/notifications/mark-all-read
router.patch('/mark-all-read', authorize('super_admin', 'admin', 'finance', 'operations', 'agent'), async (req, res) => {
  await Notification.updateMany({ read: false }, { $set: { read: true } });
  res.json({ message: 'All notifications marked as read' });
});

// DELETE /api/notifications/:id
router.delete('/:id', authorize('super_admin', 'admin'), async (req, res) => {
  const notification = await Notification.findByIdAndDelete(req.params.id);
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  res.json({ message: 'Notification deleted' });
});

module.exports = router;

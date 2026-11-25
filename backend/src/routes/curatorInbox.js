/**
 * Desk inbox for Curator messages (mounted at /api/curator-inbox, desk roles only).
 * Every message a Curator sends from a request ("Message desk", change requests, proofs…)
 * is kept on that request; this lists them with the Curator's name and the request ID.
 *
 *   GET  /                       threads, newest activity first (+ unread count)
 *   POST /:requestId/read        mark a thread read
 *   POST /:requestId/reply       answer the Curator (shows on their request page)
 */
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const AgentRequest = require('../models/AgentRequest');

const DESK = new Set(['super_admin', 'admin', 'finance', 'operations', 'system']);

function findRequest(id) {
  const s = String(id || '');
  const or = [{ id: s }, { requestNumber: s }];
  if (/^[a-f0-9]{24}$/i.test(s)) or.push({ _id: s });
  return AgentRequest.findOne({ $or: or, isDeleted: { $ne: true } });
}

router.get('/', async (req, res) => {
  const requests = await AgentRequest.find({ isDeleted: { $ne: true }, 'messages.0': { $exists: true } })
    .select('id requestNumber agentName agentEmail clientName companyName route flightDate status messages updatedAt')
    .lean();
  const threads = requests
    .map((r) => {
      const msgs = (r.messages || [])
        .map((m) => ({
          id: m.id || String(m._id),
          from: m.sender,
          role: m.senderRole,
          fromCurator: !DESK.has(m.senderRole),
          text: m.message,
          at: m.timestamp,
          read: DESK.has(m.senderRole) ? true : Boolean(m.readByDeskAt)
        }))
        .sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0));
      const curatorMsgs = msgs.filter((m) => m.fromCurator);
      if (!curatorMsgs.length) return null;
      const last = msgs[msgs.length - 1];
      return {
        requestId: r.requestNumber || r.id,
        curator: r.agentName || curatorMsgs[0].from,
        curatorEmail: r.agentEmail || '',
        client: r.companyName || r.clientName || '',
        route: r.route || '',
        flightDate: r.flightDate || '',
        status: r.status,
        unread: curatorMsgs.filter((m) => !m.read).length,
        lastAt: last.at,
        lastText: last.text,
        lastFromCurator: last.fromCurator,
        messages: msgs
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.lastAt || 0) - new Date(a.lastAt || 0));
  res.json({ success: true, data: { threads, unread: threads.reduce((n, t) => n + t.unread, 0) } });
});

router.post('/:requestId/read', async (req, res) => {
  const r = await findRequest(req.params.requestId);
  if (!r) return res.status(404).json({ success: false, message: 'Request not found' });
  let changed = false;
  (r.messages || []).forEach((m) => {
    if (!DESK.has(m.senderRole) && !m.readByDeskAt) {
      m.readByDeskAt = new Date();
      changed = true;
    }
  });
  if (changed) await r.save();
  res.json({ success: true });
});

router.post('/:requestId/reply', async (req, res) => {
  const text = String((req.body && req.body.message) || '').trim();
  if (!text) return res.status(400).json({ success: false, message: 'Write a reply first.' });
  const r = await findRequest(req.params.requestId);
  if (!r) return res.status(404).json({ success: false, message: 'Request not found' });
  (r.messages || []).forEach((m) => {
    if (!DESK.has(m.senderRole) && !m.readByDeskAt) m.readByDeskAt = new Date();
  });
  r.messages.push({
    id: crypto.randomUUID(),
    sender: (req.user && (req.user.name || req.user.email)) || 'Desk',
    senderRole: DESK.has(req.user && req.user.role) ? req.user.role : 'admin',
    senderEmail: (req.user && req.user.email) || '',
    message: text.slice(0, 4000),
    timestamp: new Date()
  });
  await r.save();
  res.status(201).json({ success: true });
});

module.exports = router;

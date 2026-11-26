/**
 * Desk inbox for Curator messages (mounted at /api/curator-inbox, desk roles only).
 * Every message a Curator sends from a request ("Message desk", change requests, proofs…)
 * is kept on that request; this lists them with the Curator's name and the request ID.
 *
 *   GET  /                       threads, newest activity first (+ unread count)
 *   POST /:requestId/read        mark a thread read
 *   POST /:requestId/reply       answer the Curator (shows on their request page)
 *
 * A thread key is a request number (REQ-…) or, for a trip made without a request, its trip
 * number (TRI-…); those conversations are kept on the trip (curatorMessages).
 */
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const AgentRequest = require('../models/AgentRequest');
const Booking = require('../models/Booking');

const DESK = new Set(['super_admin', 'admin', 'finance', 'operations', 'system']);

function findRequest(id) {
  const s = String(id || '');
  const or = [{ id: s }, { requestNumber: s }];
  if (/^[a-f0-9]{24}$/i.test(s)) or.push({ _id: s });
  return AgentRequest.findOne({ $or: or, isDeleted: { $ne: true } });
}

/** A trip made without a request keeps its Curator conversation on the trip (key "TRI-XX0000"). */
async function findTrip(id) {
  const m = String(id || '').match(/^TRI-([A-Z]{2}\d{3,6})$/i);
  if (!m) return null;
  const versions = await Booking.find({ tripId: `TRI-${m[1].toUpperCase()}`, isDeleted: { $ne: true }, isDraft: { $ne: true } });
  if (!versions.length) return null;
  // The version that holds the conversation, else the booked one, else the latest
  return (
    versions.find((v) => Array.isArray(v.curatorMessages) && v.curatorMessages.length) ||
    versions.find((v) => v.isBooked && !v.isCancelled) ||
    versions.sort((a, b) => (Number(b.quoteVersion) || 1) - (Number(a.quoteVersion) || 1))[0]
  );
}

/** The request or trip and its message list. */
async function findThread(id) {
  const r = await findRequest(id);
  if (r) return { doc: r, list: r.messages, save: () => r.save() };
  const b = await findTrip(id);
  if (!b) return null;
  if (!Array.isArray(b.curatorMessages)) b.curatorMessages = [];
  return {
    doc: b,
    list: b.curatorMessages,
    save: () => {
      b.markModified('curatorMessages');
      return b.save();
    }
  };
}

const toThread = ({ key, curator, curatorEmail, client, route, flightDate, status, kind, raw }) => {
  const msgs = (raw || [])
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
  if (!msgs.length) return null;
  const last = msgs[msgs.length - 1];
  const curatorMsgs = msgs.filter((m) => m.fromCurator);
  return {
    requestId: key,
    kind,
    curator: curator || (curatorMsgs[0] && curatorMsgs[0].from) || 'Curator',
    curatorEmail: curatorEmail || '',
    client: client || '',
    route: route || '',
    flightDate: flightDate || '',
    status,
    unread: curatorMsgs.filter((m) => !m.read).length,
    lastAt: last.at,
    lastText: last.text,
    lastFromCurator: last.fromCurator,
    messages: msgs
  };
};

router.get('/', async (req, res) => {
  const [requests, trips] = await Promise.all([
    AgentRequest.find({ isDeleted: { $ne: true }, 'messages.0': { $exists: true } })
      .select('id requestNumber agentName agentEmail clientName companyName route flightDate status messages updatedAt')
      .lean(),
    Booking.find({ isDeleted: { $ne: true }, 'curatorMessages.0': { $exists: true } })
      .select('tripId agentName agentEmail client legs status curatorMessages')
      .lean()
  ]);
  const threads = [
    ...requests.map((r) =>
      toThread({
        key: r.requestNumber || r.id,
        kind: 'request',
        curator: r.agentName,
        curatorEmail: r.agentEmail,
        client: r.companyName || r.clientName,
        route: r.route,
        flightDate: r.flightDate,
        status: r.status,
        raw: r.messages
      })
    ),
    ...trips.map((b) => {
      const legs = (b.legs || []).filter((l) => !l.isCancelled);
      const code = (a) => (a && (a.icao || a.code)) || '';
      return toThread({
        key: b.tripId,
        kind: 'trip',
        curator: b.agentName,
        curatorEmail: b.agentEmail,
        client: (b.client && (b.client.companyName || b.client.fullName)) || '',
        route: legs.length ? [code(legs[0].origin), ...legs.map((l) => code(l.destination))].filter(Boolean).join(' → ') : '',
        flightDate: (legs[0] && legs[0].flightDate) || '',
        status: b.status,
        raw: b.curatorMessages
      });
    })
  ]
    .filter(Boolean)
    .sort((a, b) => new Date(b.lastAt || 0) - new Date(a.lastAt || 0));
  res.json({ success: true, data: { threads, unread: threads.reduce((n, t) => n + t.unread, 0) } });
});

router.post('/:requestId/read', async (req, res) => {
  const t = await findThread(req.params.requestId);
  if (!t) return res.status(404).json({ success: false, message: 'Conversation not found' });
  let changed = false;
  (t.list || []).forEach((m) => {
    if (!DESK.has(m.senderRole) && !m.readByDeskAt) {
      m.readByDeskAt = new Date();
      changed = true;
    }
  });
  if (changed) await t.save();
  res.json({ success: true });
});

router.post('/:requestId/reply', async (req, res) => {
  const text = String((req.body && req.body.message) || '').trim();
  if (!text) return res.status(400).json({ success: false, message: 'Write a reply first.' });
  const t = await findThread(req.params.requestId);
  if (!t) return res.status(404).json({ success: false, message: 'Request or trip not found' });
  (t.list || []).forEach((m) => {
    if (!DESK.has(m.senderRole) && !m.readByDeskAt) m.readByDeskAt = new Date();
  });
  t.list.push({
    id: crypto.randomUUID(),
    sender: (req.user && (req.user.name || req.user.email)) || 'Desk',
    senderRole: DESK.has(req.user && req.user.role) ? req.user.role : 'admin',
    senderEmail: (req.user && req.user.email) || '',
    message: text.slice(0, 4000),
    timestamp: new Date()
  });
  await t.save();
  res.status(201).json({ success: true });
});

module.exports = router;

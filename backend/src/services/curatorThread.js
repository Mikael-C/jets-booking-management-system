/**
 * Messages and documents between the desk and a Curator, kept where the Curator already reads them:
 * on the request the quote came from, or on the trip when the desk made it without a request
 * (curatorMessages on the version that holds the conversation).
 */
const crypto = require('crypto');
const AgentRequest = require('../models/AgentRequest');
const Booking = require('../models/Booking');
const { createNotification } = require('./notificationService');

const DESK_ROLES = new Set(['super_admin', 'admin', 'finance', 'operations', 'system']);

async function requestFor(booking) {
  const rid = String((booking && booking.sourceAgentRequestId) || '');
  if (!rid) return null;
  const or = [{ id: rid }, { requestNumber: rid }];
  if (/^[a-f0-9]{24}$/i.test(rid)) or.push({ _id: rid });
  return AgentRequest.findOne({ $or: or, isDeleted: { $ne: true } });
}

/** The version of the trip that keeps the conversation (or the booked one, or the latest). */
async function tripHolder(booking) {
  if (!booking.tripId) return Booking.findById(booking._id);
  const versions = await Booking.find({ tripId: booking.tripId, isDeleted: { $ne: true }, isDraft: { $ne: true } });
  if (!versions.length) return Booking.findById(booking._id);
  return (
    versions.find((v) => Array.isArray(v.curatorMessages) && v.curatorMessages.length) ||
    versions.find((v) => v.isBooked && !v.isCancelled) ||
    versions.sort((a, b) => (Number(b.quoteVersion) || 1) - (Number(a.quoteVersion) || 1))[0]
  );
}

/** Posts a message into the Curator's conversation for this quote or trip. Returns the thread key. */
async function postToCurator(booking, { text, user = null, fromCurator = false }) {
  const role = fromCurator ? 'agent' : DESK_ROLES.has(user && user.role) ? user.role : 'system';
  const entry = {
    id: crypto.randomUUID(),
    sender: (user && (user.name || user.email)) || (fromCurator ? 'Curator' : 'Orbelo desk'),
    senderRole: role,
    senderEmail: (user && user.email) || '',
    message: String(text || '').slice(0, 4000),
    timestamp: new Date(),
  };
  const r = await requestFor(booking);
  if (r) {
    r.messages.push(entry);
    await r.save();
    return r.requestNumber || r.id;
  }
  const holder = await tripHolder(booking);
  if (!holder) return null;
  holder.curatorMessages = [...(Array.isArray(holder.curatorMessages) ? holder.curatorMessages : []), entry];
  holder.markModified('curatorMessages');
  await holder.save();
  return holder.tripId || null;
}

/** Records that a document went to the Curator (shown on their request and trip pages). */
function recordSent(doc, item) {
  const list = Array.isArray(doc.sentDocuments) ? doc.sentDocuments : [];
  doc.sentDocuments = [...list, { ...item, at: new Date().toISOString() }];
  doc.markModified('sentDocuments');
}

/** A notice for the desk (bell and Overview). */
function notifyDesk({ title, message, entityId, link }) {
  return createNotification({ type: 'info', title, message, entityId: entityId || '', entityType: 'booking', link: link || '', priority: 'high' }).catch(() => null);
}

module.exports = { postToCurator, recordSent, notifyDesk, requestFor, tripHolder, DESK_ROLES };

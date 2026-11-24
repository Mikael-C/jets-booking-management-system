/**
 * Documents and money across trips:
 *   GET  /api/registry/invoices                 invoices + credit notes (Invoices & credit notes page)
 *   GET  /api/registry/payments                 payment rows + KPIs (Payments page)
 *   GET  /api/registry/contracts                charter agreements (Contracts page)
 *   GET  /api/registry/flight-briefs            flight briefs (Flight briefs page)
 *   GET  /api/registry/trips/:id/ledger         one trip's Accounting tab
 *   POST /api/registry/trips/:id/invoices       new invoice
 *   POST /api/registry/trips/:id/combine        combine open invoices into one
 *   POST /api/registry/trips/:id/credit-notes   new credit note (optionally with an invoice for the remainder)
 *   POST /api/registry/trips/:id/payments       record a payment (or proof of a wire)
 *   POST /api/registry/trips/:id/payments/:paymentId/confirm
 *   POST /api/registry/trips/:id/invoices/:number/payment-link
 *   POST /api/registry/trips/:id/invoices/:number/remind
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const mongoose = require('mongoose');
const axios = require('axios');
const Booking = require('../models/Booking');
const Contact = require('../models/Contact');
const { createAuditEntry } = require('../services/auditService');
const ledger = require('../services/ledgerService');

let sendEmail = null;
try {
  ({ sendEmail } = require('../services/emailService'));
} catch {
  sendEmail = null;
}

const { toIsoFromGerman, ensureLedger, computeLedger, syncSummary, tripToken, versionOf, isBooked, firstDeparture, routeLabel, clientName, nextNumber, round2, DAY } = ledger;

const audit = async (req, action, entityId, details) => {
  if (!req.user) return;
  try {
    await createAuditEntry({ user: req.user, action, entityType: 'Booking', entityId: String(entityId), details });
  } catch {
    // never block a money action on the audit log
  }
};

const findBooking = async (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id)) {
    const byId = await Booking.findOne({ _id: id, isDeleted: { $ne: true } });
    if (byId) return byId;
  }
  return Booking.findOne({
    isDeleted: { $ne: true },
    $or: [{ id }, { tripNumber: id }, { bookingRevisionId: id }, { invoiceNumber: id }, { quoteId: id }]
  });
};

const siblingsOf = async (b) => {
  const or = [];
  if (b.tripId) or.push({ tripId: b.tripId });
  if (b.quoteGroupId) or.push({ quoteGroupId: b.quoteGroupId });
  if (!or.length) return [];
  return Booking.find({ isDeleted: { $ne: true }, $or: or }).select('quoteVersion isBooked status isCancelled cancellationReason createdAt tripId').lean();
};

async function ledgerResponse(doc) {
  const siblings = await siblingsOf(doc);
  return computeLedger(doc.toObject ? doc.toObject() : doc, siblings);
}

/** Latest live version of each trip (for the cross-trip pages). */
function latestBooked(bookings) {
  const map = new Map();
  bookings.forEach((b) => {
    if (!isBooked(b) || b.isCancelled) return;
    const key = tripToken(b);
    const cur = map.get(key);
    if (!cur || (Number(b.quoteVersion) || 1) > (Number(cur.quoteVersion) || 1)) map.set(key, b);
  });
  return Array.from(map.values());
}

/** Loads booked trips and writes the ledger for older ones (once). */
async function loadBookedTrips() {
  const docs = await Booking.find({ isDeleted: { $ne: true }, isCancelled: { $ne: true } }).sort({ updatedAt: -1 }).limit(1000);
  const booked = docs.filter((d) => isBooked(d));
  for (const d of booked) {
    if (ensureLedger(d)) {
      try {
        await d.save();
      } catch {
        // a single bad record must not break the list
      }
    }
  }
  return latestBooked(booked.map((d) => d.toObject()));
}

// ---------------------------------------------------------------- lists

router.get('/invoices', async (req, res) => {
  const trips = await loadBookedTrips();
  const rows = [];
  trips.forEach((b) => {
    const l = computeLedger(b);
    const t = l.tripToken;
    l.invoices.forEach((inv) => {
      rows.push({
        id: `${l.bookingId}:${inv.number}`,
        bookingId: l.bookingId,
        number: inv.number,
        type: inv.kind === 'combined' ? 'Combined invoice' : 'Invoice',
        kind: 'invoice',
        trip: `TRI-${t}`,
        tripToken: t,
        client: l.clientName,
        date: inv.issuedAt,
        amount: inv.amount,
        open: inv.open,
        currency: l.currency,
        appliesTo: inv.purpose || 'Charter',
        status: inv.status,
        combined: inv.kind === 'combined' || inv.status === 'combined',
        paymentLink: inv.paymentLink ? inv.paymentLink.url : ''
      });
    });
    l.creditNotes.forEach((n) => {
      rows.push({
        id: `${l.bookingId}:${n.number}`,
        bookingId: l.bookingId,
        number: n.number,
        type: n.direction === 'charge' ? 'Credit note · charge' : 'Credit note',
        kind: 'credit_note',
        trip: `TRI-${t}`,
        tripToken: t,
        client: l.clientName,
        date: n.issuedAt,
        amount: n.direction === 'credit' ? -n.amount : n.amount,
        open: 0,
        currency: l.currency,
        appliesTo: n.against || n.reasonCategory,
        status: 'issued',
        combined: false,
        internalNote: n.internalNote,
        reasonCategory: n.reasonCategory
      });
    });
  });
  rows.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  res.json({ success: true, data: rows });
});

router.get('/payments', async (req, res) => {
  const trips = await loadBookedTrips();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const rows = [];
  let receivedMonth = 0;
  let receivedCount = 0;
  let awaiting = 0;
  const awaitingTrips = new Set();
  let overdue = 0;
  const soonUnpaid = [];

  trips.forEach((b) => {
    const l = computeLedger(b);
    const dep = l.departure ? new Date(l.departure) : null;
    const base = {
      bookingId: l.bookingId,
      trip: `TRI-${l.tripToken}`,
      tripToken: l.tripToken,
      departure: l.departure,
      client: l.clientName,
      clientEmail: l.clientEmail,
      currency: l.currency
    };
    l.payments.forEach((p) => {
      if (p.status === 'received' && p.receivedAt && new Date(p.receivedAt) >= monthStart) {
        receivedMonth += p.amount;
        receivedCount += 1;
      }
      const inv = l.invoices.find((i) => i.number === p.invoiceNumber);
      rows.push({
        ...base,
        id: `p:${l.bookingId}:${p.id}`,
        kind: 'payment',
        paymentId: p.id,
        status: p.status === 'received' ? 'paid' : 'proof_uploaded',
        invoice: p.invoiceNumber,
        purpose: inv ? inv.purpose : 'Charter',
        amount: p.amount,
        due: inv ? inv.dueDate : null,
        method: p.method === 'card' ? `Card${p.provider ? ` · ${p.provider}` : ''}` : 'Bank transfer',
        methodKey: p.method,
        proofName: p.proofName || (p.method === 'card' ? 'auto' : ''),
        proofUrl: p.proofUrl || '',
        date: p.receivedAt || p.createdAt
      });
    });
    l.invoices
      .filter((i) => ['unpaid', 'overdue', 'part_paid'].includes(i.status) && i.open > 0)
      .forEach((inv) => {
        awaiting += inv.open;
        awaitingTrips.add(l.tripToken);
        if (inv.status === 'overdue') overdue += inv.open;
        if (dep && dep.getTime() - now.getTime() < 3 * DAY && dep.getTime() > now.getTime() - DAY) {
          soonUnpaid.push({ trip: `TRI-${l.tripToken}`, amount: inv.open, currency: l.currency });
        }
        rows.push({
          ...base,
          id: `i:${l.bookingId}:${inv.number}`,
          kind: 'invoice',
          status: inv.status === 'overdue' ? 'overdue' : 'awaiting',
          invoice: inv.number,
          purpose: inv.purpose || 'Charter',
          amount: inv.open,
          due: inv.dueDate,
          method: inv.paymentLink && inv.paymentLink.provider === 'Stripe' ? 'Card · Stripe' : 'Bank transfer',
          methodKey: inv.paymentLink && inv.paymentLink.provider === 'Stripe' ? 'card' : 'bank_transfer',
          proofName: '',
          proofUrl: '',
          paymentLink: inv.paymentLink ? inv.paymentLink.url : '',
          date: inv.issuedAt
        });
      });
  });
  rows.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  res.json({
    success: true,
    data: {
      rows,
      kpis: {
        received: round2(receivedMonth),
        receivedCount,
        month: monthStart.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }).toUpperCase(),
        awaiting: round2(awaiting),
        awaitingTrips: awaitingTrips.size,
        overdue: round2(overdue),
        soonUnpaidCount: soonUnpaid.length,
        soonUnpaidFirst: soonUnpaid[0] || null
      }
    }
  });
});

router.get('/contracts', async (req, res) => {
  const docs = await Booking.find({ isDeleted: { $ne: true } }).sort({ updatedAt: -1 }).limit(1000).lean();
  const now = Date.now();
  const rows = [];
  docs.forEach((b) => {
    const s = String(b.status || '').toLowerCase();
    const qs = String(b.quoteStatus || '').toLowerCase();
    const booked = isBooked(b);
    const sent = booked || ['sent', 'accepted', 'viewed'].includes(qs) || ['quote_sent', 'contract_sent', 'client_review'].includes(s);
    if (!sent) return;
    if (b.isCancelled && !booked) return;
    const t = tripToken(b);
    const v = versionOf(b);
    const exp = b.quoteExpirationDate ? new Date(b.quoteExpirationDate) : null;
    const expired = !booked && exp && !isNaN(exp.getTime()) && exp.getTime() < now;
    const sentAt = b.quoteSentAt || b.contractSentAt || b.createdAt;
    rows.push({
      id: b.id || String(b._id),
      bookingId: b.id || String(b._id),
      contract: `CA-${t}-${v}`,
      tripVersion: `${booked ? 'TRI' : 'QUO'}-${t}-${v}`,
      tripToken: t,
      client: clientName(b),
      value: round2(b.pricing && b.pricing.totalFlightPrice),
      currency: (b.pricing && b.pricing.currency) || 'EUR',
      sentAt: sentAt ? new Date(sentAt).toISOString() : null,
      sentVia: b.agentName ? 'Curator' : 'Client',
      signedAt: booked ? toIsoFromGerman(b.contractSignedDate || b.contractDate) || (b.updatedAt ? new Date(b.updatedAt).toISOString() : null) : null,
      signedVia: booked ? (b.contractSignedBy ? `${b.contractSignedBy}` : 'e-sign') : '',
      termsVersion: b.termsVersion || 'T&C v1.0',
      status: booked ? 'signed' : expired ? 'expired' : 'awaiting'
    });
  });
  res.json({ success: true, data: rows });
});

router.get('/flight-briefs', async (req, res) => {
  const docs = await Booking.find({ isDeleted: { $ne: true } }).sort({ updatedAt: -1 }).limit(1000).lean();
  const booked = docs.filter((b) => isBooked(b) || (b.isCancelled && b.lastBriefIssuedAt));
  // Contacts for passport checks
  const ids = new Set();
  const names = new Set();
  booked.forEach((b) =>
    ((b.legs || [])[0]?.passengers || []).forEach((p) => {
      if (p.contactId) ids.add(String(p.contactId));
      if (p.fullName) names.add(String(p.fullName).trim());
    })
  );
  const contacts = ids.size || names.size
    ? await Contact.find({ $or: [{ id: { $in: Array.from(ids) } }, { fullName: { $in: Array.from(names) } }] })
        .select('id fullName passportDetails idDetails')
        .lean()
        .catch(() => [])
    : [];
  const hasDoc = (p) => {
    if (p.passportNumber && String(p.passportNumber).length >= 5) return true;
    const c = contacts.find((x) => (p.contactId && String(x.id) === String(p.contactId)) || x.fullName === p.fullName);
    const num = c?.passportDetails?.passportNumber || c?.idDetails?.idNumber;
    return Boolean(num && String(num).length >= 5);
  };
  const now = Date.now();
  const rows = booked.map((b) => {
    const t = tripToken(b);
    const v = versionOf(b);
    const legs = (b.legs || []).filter((l) => !l.isCancelled);
    const leg = legs[0] || {};
    const dep = firstDeparture(b);
    const missingPassports = (leg.passengers || []).filter((p) => !hasDoc(p)).length;
    const missingReg = legs.some((l) => !l.aircraftRegistration || !l.flightNumber);
    const weaponPending = legs.some((l) => l.weapons && l.weapons.onBoard && (l.weapons.clearances || []).some((c) => c.status !== 'cleared'));
    const readiness = [];
    if (missingPassports) readiness.push(`${missingPassports} passport${missingPassports === 1 ? '' : 's'}`);
    if (missingReg) readiness.push('Reg / flight no.');
    if (weaponPending) readiness.push('Weapon clearance');
    const sentToCurator = (b.itineraryActivity || []).some((a) => a.group === 'brief' && /curator/i.test(a.text || ''));
    let status = 'draft';
    if (b.isCancelled) status = 'cancelled';
    else if (dep && dep.getTime() < now - DAY && b.lastBriefIssuedAt) status = 'final';
    else if (b.lastBriefIssuedAt) status = 'sent';
    return {
      id: b.id || String(b._id),
      bookingId: b.id || String(b._id),
      brief: `FB-${t}-${v}`,
      trip: `TRI-${t}`,
      tripToken: t,
      departure: dep ? dep.toISOString() : null,
      departureLocal: leg.flightDate ? `${leg.flightDate} ${leg.departureTimeLocal || ''}`.trim() : '',
      route: routeLabel(b).split(' → ').slice(0, 2).join(' → ') + (legs.length > 1 ? ` +${legs.length - 1}` : ''),
      aircraft: leg.aircraftType || (b.aircraft && b.aircraft.name) || '—',
      tail: leg.aircraftRegistration || 'TBA',
      pax: (leg.passengers || []).length || leg.paxCount || 0,
      readiness,
      sentTo: b.lastBriefIssuedAt ? (sentToCurator ? 'Client + Curator' : 'Client') : '',
      sentAt: b.lastBriefIssuedAt || null,
      status
    };
  });
  rows.sort((a, b) => new Date(b.departure || 0) - new Date(a.departure || 0));
  res.json({ success: true, data: rows });
});

// ---------------------------------------------------------------- one trip

async function loadTrip(req, res) {
  const doc = await findBooking(req.params.id);
  if (!doc) {
    res.status(404).json({ success: false, message: 'Trip not found' });
    return null;
  }
  if (ensureLedger(doc)) await doc.save();
  return doc;
}

async function saveAndRespond(doc, res) {
  const l = await ledgerResponse(doc);
  syncSummary(doc, l);
  doc.markModified('invoices');
  doc.markModified('payments');
  doc.markModified('creditNotes');
  await doc.save();
  res.json({ success: true, data: await ledgerResponse(doc) });
}

router.get('/trips/:id/ledger', async (req, res) => {
  const doc = await loadTrip(req, res);
  if (!doc) return;
  res.json({ success: true, data: await ledgerResponse(doc) });
});

router.post('/trips/:id/invoices', async (req, res) => {
  const doc = await loadTrip(req, res);
  if (!doc) return;
  const amount = round2(req.body.amount);
  if (!(amount > 0)) return res.status(400).json({ success: false, message: 'Amount must be more than zero' });
  const l = await ledgerResponse(doc);
  const dep = firstDeparture(doc);
  const inv = {
    number: l.nextInvoiceNumber,
    kind: req.body.kind || 'additional',
    purpose: req.body.purpose || 'Additional service',
    line: req.body.line || req.body.purpose || 'Additional service',
    amount,
    currency: l.currency,
    versionLabel: l.versionLabel,
    issuedAt: new Date().toISOString(),
    dueDate: req.body.dueDate || (dep ? new Date(dep.getTime() - 2 * DAY).toISOString() : null),
    status: 'open',
    reminders: []
  };
  doc.invoices = [...(doc.invoices || []), inv];
  await audit(req, 'INVOICE_CREATED', doc.id || doc._id, `Invoice ${inv.number} · ${inv.line} · ${amount}`);
  await saveAndRespond(doc, res);
});

router.post('/trips/:id/combine', async (req, res) => {
  const doc = await loadTrip(req, res);
  if (!doc) return;
  const l = await ledgerResponse(doc);
  const open = l.invoices.filter((i) => ['unpaid', 'overdue', 'part_paid'].includes(i.status) && i.open > 0);
  if (open.length < 2) {
    return res.status(400).json({ success: false, message: 'Combining needs at least two open invoices on this trip' });
  }
  const number = l.nextInvoiceNumber;
  const oldNumbers = open.map((o) => o.number);
  // The combined invoice carries the full amounts; payments and credits move with it, so nothing counts twice
  const total = round2(open.reduce((s, i) => s + i.amount, 0));
  const dueDates = open.map((i) => i.dueDate).filter(Boolean).sort();
  doc.invoices = (doc.invoices || []).map((i) => (oldNumbers.includes(i.number) ? { ...i, status: 'combined', combinedInto: number } : i));
  doc.payments = (doc.payments || []).map((p) => (oldNumbers.includes(p.invoiceNumber) ? { ...p, invoiceNumber: number } : p));
  doc.creditNotes = (doc.creditNotes || []).map((n) => (oldNumbers.includes(n.against) ? { ...n, against: number } : n));
  doc.invoices.push({
    number,
    kind: 'combined',
    purpose: 'Combined',
    line: `Combined · ${oldNumbers.join(', ')}`,
    amount: total,
    currency: l.currency,
    versionLabel: l.versionLabel,
    issuedAt: new Date().toISOString(),
    dueDate: dueDates[0] || null,
    status: 'open',
    combinedFrom: oldNumbers,
    reminders: []
  });
  await audit(req, 'INVOICES_COMBINED', doc.id || doc._id, `Combined ${open.map((o) => o.number).join(', ')} into ${number}`);
  await saveAndRespond(doc, res);
});

router.post('/trips/:id/credit-notes', async (req, res) => {
  const doc = await loadTrip(req, res);
  if (!doc) return;
  const l = await ledgerResponse(doc);
  const against = l.invoices.find((i) => i.number === req.body.against);
  if (!against) return res.status(400).json({ success: false, message: 'Pick the invoice the credit note is against' });
  const creditAmount = round2(req.body.amount);
  const output = ['credit_only', 'invoice_remainder', 'both'].includes(req.body.output) ? req.body.output : 'credit_only';
  const maxCredit = round2(against.amount - against.credited);
  if (!(creditAmount > 0)) return res.status(400).json({ success: false, message: 'Credit amount must be more than zero' });
  if (creditAmount > maxCredit + 0.005) {
    return res.status(400).json({ success: false, message: `Credit can't be more than what is left on ${against.number} (${maxCredit})` });
  }
  const now = new Date().toISOString();
  const notes = [];
  const fullCredit = output !== 'credit_only' ? maxCredit : creditAmount;
  notes.push({
    id: `cn-${crypto.randomUUID()}`,
    number: l.nextCreditNoteNumber,
    against: against.number,
    direction: 'credit',
    reasonCategory: req.body.reasonCategory || 'Credit',
    internalNote: req.body.internalNote || '',
    cancellationFeePct: Number(req.body.cancellationFeePct) || 0,
    amount: fullCredit,
    issuedAt: now
  });
  doc.creditNotes = [...notes, ...(doc.creditNotes || [])];
  let remainderInvoice = null;
  if (output !== 'credit_only') {
    const remainder = round2(maxCredit - creditAmount);
    if (remainder > 0) {
      const tmp = computeLedger(doc.toObject());
      remainderInvoice = {
        number: tmp.nextInvoiceNumber,
        kind: 'remainder',
        purpose: req.body.reasonCategory === 'Cancellation' ? 'Cancellation fee' : 'Remainder',
        line: `${req.body.reasonCategory === 'Cancellation' ? `Cancellation fee ${Number(req.body.cancellationFeePct) || 0} %` : 'Remainder'} · after ${notes[0].number}`,
        amount: remainder,
        currency: l.currency,
        versionLabel: l.versionLabel,
        issuedAt: now,
        dueDate: new Date(Date.now() + 7 * DAY).toISOString(),
        status: 'open',
        reminders: []
      };
      doc.invoices = [...(doc.invoices || []), remainderInvoice];
    }
  }
  if (req.body.reasonCategory === 'Cancellation' && req.body.cancelTrip) {
    doc.status = 'cancelled';
    doc.isCancelled = true;
    doc.cancellationReason = req.body.internalNote || 'Cancelled by client';
  }
  await audit(req, 'CREDIT_NOTE_ISSUED', doc.id || doc._id, `Credit note ${notes[0].number} · ${fullCredit} against ${against.number}${remainderInvoice ? ` · invoice ${remainderInvoice.number} for ${remainderInvoice.amount}` : ''}`);
  await saveAndRespond(doc, res);
});

router.post('/trips/:id/payments', async (req, res) => {
  const doc = await loadTrip(req, res);
  if (!doc) return;
  const l = await ledgerResponse(doc);
  const inv = l.invoices.find((i) => i.number === req.body.invoiceNumber) || l.invoices.find((i) => i.open > 0);
  const amount = round2(req.body.amount ?? (inv ? inv.open : 0));
  if (!(amount > 0)) return res.status(400).json({ success: false, message: 'Amount must be more than zero' });
  const method = req.body.method === 'card' ? 'card' : 'bank_transfer';
  const status = req.body.status === 'proof_uploaded' ? 'proof_uploaded' : 'received';
  const p = {
    id: `pay-${crypto.randomUUID()}`,
    invoiceNumber: inv ? inv.number : '',
    amount,
    method,
    provider: method === 'card' ? req.body.provider || 'Stripe' : '',
    reference: req.body.reference || '',
    proofName: req.body.proofName || '',
    proofUrl: typeof req.body.proofUrl === 'string' && req.body.proofUrl.length < 6 * 1024 * 1024 ? req.body.proofUrl : '',
    status,
    receivedAt: status === 'received' ? req.body.receivedAt || new Date().toISOString() : null,
    createdAt: new Date().toISOString(),
    confirmedBy: status === 'received' ? req.user?.email || '' : ''
  };
  doc.payments = [...(doc.payments || []), p];
  await audit(req, 'PAYMENT_RECORDED', doc.id || doc._id, `Payment ${amount} (${method}) on ${p.invoiceNumber || 'trip'} · ${status}`);
  await saveAndRespond(doc, res);
});

router.post('/trips/:id/payments/:paymentId/confirm', async (req, res) => {
  const doc = await loadTrip(req, res);
  if (!doc) return;
  let found = false;
  doc.payments = (doc.payments || []).map((p) => {
    if (p.id !== req.params.paymentId) return p;
    found = true;
    return { ...p, status: 'received', receivedAt: new Date().toISOString(), confirmedBy: req.user?.email || '' };
  });
  if (!found) return res.status(404).json({ success: false, message: 'Payment not found' });
  await audit(req, 'PAYMENT_CONFIRMED', doc.id || doc._id, `Payment ${req.params.paymentId} confirmed as received`);
  await saveAndRespond(doc, res);
});

async function createStripeCheckout({ amount, currency, description, successUrl, cancelUrl, metadata }) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('success_url', successUrl);
  params.append('cancel_url', cancelUrl);
  params.append('line_items[0][quantity]', '1');
  params.append('line_items[0][price_data][currency]', String(currency || 'EUR').toLowerCase());
  params.append('line_items[0][price_data][unit_amount]', String(Math.round(amount * 100)));
  params.append('line_items[0][price_data][product_data][name]', description);
  Object.entries(metadata || {}).forEach(([k, v]) => params.append(`metadata[${k}]`, String(v)));
  const r = await axios.post('https://api.stripe.com/v1/checkout/sessions', params.toString(), {
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15000
  });
  return { id: r.data.id, url: r.data.url };
}

const frontendBase = (req) => {
  const fromBody = typeof req.body.origin === 'string' && /^https?:\/\/[^\s/]+$/i.test(req.body.origin) ? req.body.origin : '';
  const fromEnv = String(process.env.FRONTEND_URL || '').split(',')[0].trim().replace(/\/+$/, '');
  return fromBody || fromEnv || 'http://localhost:3000';
};

router.post('/trips/:id/invoices/:number/payment-link', async (req, res) => {
  const doc = await loadTrip(req, res);
  if (!doc) return;
  const l = await ledgerResponse(doc);
  const inv = l.invoices.find((i) => i.number === req.params.number);
  if (!inv) return res.status(404).json({ success: false, message: 'Invoice not found' });
  if (!(inv.open > 0)) return res.status(400).json({ success: false, message: 'This invoice has nothing left to pay' });
  const existing = (doc.invoices || []).find((i) => i.number === inv.number);
  const token = (existing && existing.paymentLink && existing.paymentLink.token) || crypto.randomBytes(18).toString('base64url');
  const base = frontendBase(req);
  const payPage = `${base}/pay/${token}`;
  let provider = 'Bank transfer';
  let checkout = null;
  try {
    checkout = await createStripeCheckout({
      amount: inv.open,
      currency: l.currency,
      description: `${inv.number} · ${inv.purpose || 'Charter'} · TRI-${l.tripToken}`,
      successUrl: `${payPage}?paid=1`,
      cancelUrl: payPage,
      metadata: { bookingId: l.bookingId, invoiceNumber: inv.number, token }
    });
    if (checkout) provider = 'Stripe';
  } catch (err) {
    checkout = null; // card checkout unavailable: the link still offers bank transfer and proof upload
  }
  const link = {
    token,
    url: payPage,
    provider,
    checkoutUrl: checkout ? checkout.url : '',
    checkoutId: checkout ? checkout.id : '',
    amount: inv.open,
    currency: l.currency,
    createdAt: new Date().toISOString(),
    createdBy: req.user?.email || ''
  };
  doc.invoices = (doc.invoices || []).map((i) => (i.number === inv.number ? { ...i, paymentLink: link } : i));
  await audit(req, 'PAYMENT_LINK_CREATED', doc.id || doc._id, `Payment link for ${inv.number} · ${inv.open}`);
  doc.markModified('invoices');
  await doc.save();
  res.json({ success: true, data: { url: payPage, provider, checkoutUrl: link.checkoutUrl, amount: inv.open, currency: l.currency, invoiceNumber: inv.number } });
});

router.post('/trips/:id/invoices/:number/remind', async (req, res) => {
  const doc = await loadTrip(req, res);
  if (!doc) return;
  const l = await ledgerResponse(doc);
  const inv = l.invoices.find((i) => i.number === req.params.number);
  if (!inv) return res.status(404).json({ success: false, message: 'Invoice not found' });
  const to = l.clientEmail;
  let emailed = false;
  if (to && sendEmail) {
    try {
      const link = inv.paymentLink && inv.paymentLink.url ? `<p><a href="${inv.paymentLink.url}">Pay online</a></p>` : '';
      await sendEmail({
        to,
        subject: `Payment reminder · ${inv.number}`,
        html: `<p>Dear ${l.clientName},</p><p>This is a kind reminder that invoice <strong>${inv.number}</strong> (${l.currency} ${inv.open.toFixed(2)}) for trip TRI-${l.tripToken} is open.</p>${link}<p>Thank you.</p>`
      });
      emailed = true;
    } catch {
      emailed = false;
    }
  }
  doc.invoices = (doc.invoices || []).map((i) =>
    i.number === inv.number ? { ...i, reminders: [...(i.reminders || []), { at: new Date().toISOString(), by: req.user?.email || '', emailed }] } : i
  );
  doc.markModified('invoices');
  await doc.save();
  await audit(req, 'PAYMENT_REMINDER_SENT', doc.id || doc._id, `Reminder for ${inv.number}${emailed ? ` emailed to ${to}` : ' logged (email not sent)'}`);
  res.json({ success: true, data: { emailed, to } });
});

module.exports = router;
module.exports.findBooking = findBooking;
module.exports.createStripeCheckout = createStripeCheckout;

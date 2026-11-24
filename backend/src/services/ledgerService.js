/**
 * Trip money ledger: invoices, credit notes and payments stored on the booking.
 *
 *  booking.invoices    [{ number, kind, purpose, line, amount, currency, versionLabel, issuedAt, dueDate,
 *                         status ('open' | 'combined' | 'void'), combinedInto, paymentLink, reminders[] }]
 *  booking.payments    [{ id, invoiceNumber, amount, method ('bank_transfer' | 'card'), provider, reference,
 *                         proofName, proofUrl, status ('proof_uploaded' | 'received'), receivedAt, createdAt, confirmedBy }]
 *  booking.creditNotes [{ id, number, against, direction ('credit' | 'charge'), reasonCategory, internalNote,
 *                         cancellationFeePct, amount, issuedAt }]
 *
 * Older trips (made before the ledger) get their charter invoice and payment written once, from the
 * booking's own figures (total, payment status, amount received).
 */
const crypto = require('crypto');

const DAY = 24 * 60 * 60 * 1000;
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const pad3 = (n) => String(n || 1).padStart(3, '0');

function tripToken(b) {
  const raw = String(b.tripId || b.tripNumber || b.quoteId || b.quoteReference || b.id || '');
  const m = raw.match(/([A-Z]{2}\d{3,6})/i);
  if (m) return m[1].toUpperCase();
  return raw.replace(/^(booking|trip|tri|quo)-/i, '').split('-')[0].toUpperCase() || 'TRIP';
}

const versionOf = (b) => pad3(b.quoteVersion);

function isBooked(b) {
  const s = String(b.status || '').toLowerCase();
  return Boolean(b.isBooked) || ['booked', 'paid', 'accepted', 'contract_signed', 'confirmed', 'dispatched', 'in_flight', 'completed', 'flown'].includes(s);
}

function firstDeparture(b) {
  const leg = (b.legs || []).find((l) => !l.isCancelled) || (b.legs || [])[0];
  if (!leg || !leg.flightDate) return null;
  const t = String(leg.departureTimeLocal || '00:00').match(/(\d{1,2})[:.h]?(\d{2})/);
  const d = new Date(`${String(leg.flightDate).slice(0, 10)}T${t ? t[1].padStart(2, '0') : '00'}:${t ? t[2] : '00'}:00Z`);
  return isNaN(d.getTime()) ? null : d;
}

function routeLabel(b) {
  const legs = (b.legs || []).filter((l) => !l.isCancelled);
  if (!legs.length) return '';
  const code = (a) => (a && (a.icao || a.code)) || '';
  return [code(legs[0].origin), ...legs.map((l) => code(l.destination))].filter(Boolean).join(' → ');
}

const clientName = (b) => (b.client && (b.client.companyName || b.client.fullName)) || 'Client';

/** Credit notes saved by older screens have no direction: a note where the client owes money is a charge. */
function normalizeNote(n, idx) {
  const amount = Math.abs(Number(n.amount ?? n.netBalance ?? 0)) || 0;
  let direction = n.direction;
  if (!direction) direction = Number(n.clientOwes) > 0 && !(Number(n.weOweClient) > 0) ? 'charge' : 'credit';
  return {
    id: String(n.id || `cn-${idx}`),
    number: String(n.number || n.creditNoteNumber || `CN-${idx + 1}`),
    against: n.against || n.appliesTo || '',
    direction,
    reasonCategory: n.reasonCategory || (direction === 'charge' ? 'Additional service' : 'Credit'),
    internalNote: n.internalNote || n.reason || '',
    cancellationFeePct: Number(n.cancellationFeePct) || 0,
    amount: round2(amount),
    issuedAt: n.issuedAt || n.createdAt || toIsoFromGerman(n.issueDate || n.date) || null
  };
}

function toIsoFromGerman(s) {
  if (!s) return null;
  const m = String(s).match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])).toISOString();
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function nextNumber(prefix, existing) {
  let n = 1;
  const taken = new Set(existing);
  while (taken.has(`${prefix}-${n}`)) n++;
  return `${prefix}-${n}`;
}

/** Writes the charter invoice (and payment, if already paid) for trips made before the ledger. Returns true if changed. */
function ensureLedger(doc) {
  if (!isBooked(doc) || doc.isCancelled) return false;
  if (Array.isArray(doc.invoices) && doc.invoices.length > 0) return false;
  const t = tripToken(doc);
  const v = versionOf(doc);
  const total = round2(doc.pricing && doc.pricing.totalFlightPrice);
  const notes = (doc.creditNotes || []).map(normalizeNote);
  const charges = notes.filter((n) => n.direction === 'charge').reduce((s, n) => s + n.amount, 0);
  const charterAmount = round2(Math.max(0, total - charges));
  const dep = firstDeparture(doc);
  const legacyNumber = /^INV-/i.test(String(doc.invoiceNumber || '')) ? String(doc.invoiceNumber) : `INV-${t}-${v}-1`;
  const issuedAt = toIsoFromGerman(doc.contractDate) || (doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString());
  doc.invoices = [
    {
      number: legacyNumber,
      kind: 'charter',
      purpose: 'Charter',
      line: `Charter · ${routeLabel(doc)}`,
      amount: charterAmount,
      currency: (doc.pricing && doc.pricing.currency) || 'EUR',
      versionLabel: `TRI-${t}-${v}`,
      issuedAt,
      dueDate: dep ? new Date(dep.getTime() - 2 * DAY).toISOString() : null,
      status: 'open',
      reminders: []
    }
  ];
  if (!Array.isArray(doc.payments) || doc.payments.length === 0) {
    const status = String(doc.paymentStatus || '').toLowerCase();
    const paidAmount = ['fully_paid', 'paid'].includes(status) ? total : Number(doc.amountReceived) || 0;
    if (paidAmount > 0) {
      doc.payments = [
        {
          id: `pay-${crypto.randomUUID()}`,
          invoiceNumber: legacyNumber,
          amount: round2(Math.min(paidAmount, charterAmount) || paidAmount),
          method: doc.paymentMethodChoice === 'card' ? 'card' : 'bank_transfer',
          provider: doc.paymentMethodChoice === 'card' ? 'Stripe' : '',
          reference: 'Recorded before the ledger',
          status: 'received',
          receivedAt: (doc.paidAt && new Date(doc.paidAt).toISOString()) || (doc.updatedAt && new Date(doc.updatedAt).toISOString()) || issuedAt,
          createdAt: new Date().toISOString()
        }
      ];
    }
  }
  if (typeof doc.markModified === 'function') {
    doc.markModified('invoices');
    doc.markModified('payments');
  }
  return true;
}

/** Figures and rows for one trip version. */
function computeLedger(b, siblings = []) {
  const now = Date.now();
  const currency = (b.pricing && b.pricing.currency) || 'EUR';
  const notes = (b.creditNotes || []).map(normalizeNote);
  const payments = (b.payments || []).map((p) => ({ ...p, amount: round2(p.amount) }));
  const dep = firstDeparture(b);

  const invoices = (b.invoices || []).map((inv) => {
    const paid = round2(payments.filter((p) => p.invoiceNumber === inv.number && p.status === 'received').reduce((s, p) => s + p.amount, 0));
    const proof = payments.find((p) => p.invoiceNumber === inv.number && p.status === 'proof_uploaded');
    const credited = round2(notes.filter((n) => n.direction === 'credit' && n.against === inv.number).reduce((s, n) => s + n.amount, 0));
    const amount = round2(inv.amount);
    const open = round2(Math.max(0, amount - paid - credited));
    let status;
    if (inv.status === 'combined') status = 'combined';
    else if (inv.status === 'void') status = 'void';
    else if (credited > 0 && credited >= amount) status = 'credited';
    else if (open <= 0.005) status = 'paid';
    else if (proof) status = 'proof_uploaded';
    else if (inv.dueDate && new Date(inv.dueDate).getTime() < now) status = 'overdue';
    else if (paid > 0) status = 'part_paid';
    else status = 'unpaid';
    return { ...inv, amount, paid, credited, open, status, hasProof: Boolean(proof), linkSent: Boolean(inv.paymentLink && inv.paymentLink.url) };
  });

  const live = invoices.filter((i) => i.status !== 'combined' && i.status !== 'void');
  const charges = notes.filter((n) => n.direction === 'charge');
  const credits = notes.filter((n) => n.direction === 'credit');
  const invoiced = round2(live.reduce((s, i) => s + i.amount, 0) + charges.reduce((s, n) => s + n.amount, 0));
  const credited = round2(credits.reduce((s, n) => s + n.amount, 0));
  const netDue = round2(invoiced - credited);
  const received = round2(payments.filter((p) => p.status === 'received').reduce((s, p) => s + p.amount, 0));
  const openBalance = round2(netDue - received);

  const t = tripToken(b);
  const label = `TRI-${t}-${versionOf(b)}`;
  const rows = [];
  invoices.forEach((inv) => {
    rows.push({
      id: `inv-${inv.number}`,
      at: inv.issuedAt,
      version: inv.versionLabel || label,
      document: inv.number,
      docType: 'invoice',
      line: inv.line || inv.purpose,
      amount: inv.amount,
      status: inv.status,
      statusText:
        inv.status === 'unpaid' && inv.linkSent
          ? 'Unpaid · pay link sent'
          : { unpaid: 'Unpaid', overdue: 'Overdue', part_paid: 'Part paid', paid: 'Paid', credited: 'Credited', combined: 'Combined', void: 'Void', proof_uploaded: 'Proof uploaded' }[inv.status]
    });
  });
  notes.forEach((n) => {
    rows.push({
      id: `cn-${n.id}`,
      at: n.issuedAt,
      version: label,
      document: n.number,
      docType: 'credit_note',
      line: n.direction === 'charge' ? `${n.reasonCategory}${n.internalNote ? ` · ${n.internalNote}` : ''}` : `Credit · ${n.reasonCategory}${n.against ? ` against ${n.against}` : ''}`,
      amount: n.direction === 'credit' ? -n.amount : n.amount,
      status: 'issued',
      statusText: 'Issued',
      internalNote: n.internalNote
    });
  });
  payments.forEach((p) => {
    rows.push({
      id: `pay-${p.id}`,
      at: p.receivedAt || p.createdAt,
      version: label,
      document: p.invoiceNumber || '—',
      docType: 'payment',
      line: `${p.method === 'card' ? `Card${p.provider ? ` · ${p.provider}` : ''}` : 'Bank transfer'}${p.reference ? ` · ${p.reference}` : ''}`,
      amount: p.amount,
      status: p.status,
      statusText: p.status === 'received' ? 'Received' : 'Proof uploaded · confirm',
      proofName: p.proofName,
      proofUrl: p.proofUrl,
      paymentId: p.id
    });
  });
  siblings
    .filter((s) => String(s._id) !== String(b._id))
    .forEach((s) => {
      const sl = `${isBooked(s) ? 'TRI' : 'QUO'}-${t}-${versionOf(s)}`;
      rows.push({
        id: `ver-${s._id}`,
        at: s.createdAt ? new Date(s.createdAt).toISOString() : null,
        version: sl,
        document: '—',
        docType: 'version',
        line: s.cancellationReason || (isBooked(s) ? 'Booked version' : 'Quote version'),
        amount: 0,
        status: s.isCancelled ? 'superseded' : isBooked(s) ? 'booked' : 'quote',
        statusText: s.isCancelled ? 'Revision' : isBooked(s) ? 'Booked' : 'Quote'
      });
    });
  rows.sort((x, y) => new Date(y.at || 0) - new Date(x.at || 0));

  return {
    bookingId: b.id || String(b._id),
    tripToken: t,
    versionLabel: label,
    currency,
    clientName: clientName(b),
    clientEmail: (b.client && b.client.email) || '',
    departure: dep ? dep.toISOString() : null,
    totals: { invoiced, credited, netDue, received, openBalance },
    invoices,
    creditNotes: notes,
    payments,
    rows,
    nextCreditNoteNumber: nextNumber(`CN-${t}-${versionOf(b)}`, notes.map((n) => n.number)),
    nextInvoiceNumber: nextNumber(`INV-${t}-${versionOf(b)}`, invoices.map((i) => i.number))
  };
}

/** Keeps the booking's summary fields in step with the ledger (used by Overview, Payments, filters). */
function syncSummary(doc, ledger) {
  const { netDue, received, openBalance } = ledger.totals;
  doc.amountReceived = received;
  if (netDue > 0 && openBalance <= 0.005) {
    doc.paymentStatus = 'fully_paid';
    if (!doc.paidAt) doc.paidAt = new Date();
  } else if (received > 0) {
    doc.paymentStatus = 'deposit_paid';
  } else if (isBooked(doc)) {
    doc.paymentStatus = ledger.invoices.some((i) => i.status === 'overdue') ? 'overdue' : 'unpaid';
  }
}

module.exports = { toIsoFromGerman, ensureLedger, computeLedger, syncSummary, tripToken, versionOf, isBooked, firstDeparture, routeLabel, clientName, nextNumber, round2, DAY };

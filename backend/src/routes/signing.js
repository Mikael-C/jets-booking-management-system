/**
 * Charter agreement signing (R-093)
 *
 * Public (no login; the link carries a private key ?k=…):
 *   GET  /api/sign/:number            agreement for the signing page (no margins, no buying prices)
 *   POST /api/sign/:number/code       emails a one-time code to the person who signs
 *   POST /api/sign/:number/sign       four confirmations + name, position, signature, code → signed
 *
 * Desk (login):
 *   POST /api/agreements/:id/wet-signed           upload a wet-signed copy (waits for the MD)
 *   POST /api/agreements/:id/wet-signed/confirm   the MD confirms it → same steps as an online signature
 *   GET  /api/agreements/:id/files/:kind          signed agreement or signature certificate
 *
 * One signature triggers everything:
 *   1 signed PDF stored with a certificate (name, email, time, IP, code, versions accepted)
 *   2 QUO → TRI, moved to Bookings
 *   3 MD countersignature applied; countersigned PDF emailed
 *   4 first invoice issued with its due date
 *   5 payment reminders, passenger request and the message plan start
 *   6 Curator notified
 *   7 tasks added to the Overview
 */
const express = require('express');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const Booking = require('../models/Booking');
const AgentRequest = require('../models/AgentRequest');
const { MessageQueueItem } = require('../models/MessageAutomation');
const { authorize } = require('../middleware/auth');
const { createAuditEntry } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');
const { sendEmail, sendSignCodeEmail, sendSignedAgreementEmail } = require('../services/emailService');
const { ensureLedger, computeLedger, syncSummary, firstDeparture, routeLabel } = require('../services/ledgerService');
const { agreementLinks, agreementNumber, quoteNumber } = require('../services/agreementLinks');
const { convertQuoteToBooking } = require('./quotes');

const publicRouter = express.Router();
const deskRouter = express.Router();

const CODE_TTL = 15 * 60 * 1000;
const MAX_CODES_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;
const DAY = 24 * 60 * 60 * 1000;

const hash = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const ipOf = (req) => String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
const maskEmail = (e) => {
  const [u, d] = String(e || '').split('@');
  if (!u || !d) return '';
  return `${u[0]}${'•'.repeat(Math.max(2, Math.min(6, u.length - 1)))}@${d}`;
};
const plain = (doc) => (doc && doc.toObject ? doc.toObject() : doc || {});

async function findForSigning(number, key) {
  if (!key || String(key).length < 16) return null;
  const doc = await Booking.findOne({ signToken: String(key), isDeleted: { $ne: true } });
  if (!doc) return null;
  if (String(agreementNumber(doc)).toUpperCase() !== String(number || '').toUpperCase()) return null;
  return doc;
}

/** Who signs: the Authorised Owner, or the assistant when the assistant signs with written authority. */
function signerOf(doc) {
  const b = plain(doc);
  const c = b.client || {};
  const assistant = b.signsAgreement === 'assistant' && (b.paName || c.paName);
  return {
    name: assistant ? b.paName || c.paName : b.authorisedOwnerName || c.fullName || '',
    position: assistant ? 'Assistant (authorised)' : c.title || c.position || '',
    email: (assistant ? b.paEmail || c.paEmail : '') || c.email || '',
    company: c.companyName || '',
  };
}

/** C1, C2, C3, C5 versions frozen on the quote (falls back to the Library). */
async function legalVersions(b) {
  const snap = (b.documentSnapshot && b.documentSnapshot.legalVersions) || {};
  const out = { C1: snap.C1 || '', C2: snap.C2 || '', C3: snap.C3 || '', C5: snap.C5 || '' };
  if (out.C1 && out.C2 && out.C3 && out.C5) return out;
  try {
    const { PolicyDocument } = require('../models/PolicyDocument');
    const docs = await PolicyDocument.find({ code: { $in: ['POL-C1', 'POL-C2', 'POL-C3', 'POL-C5'] } }).lean();
    for (const d of docs) {
      const k = d.code.replace('POL-', '');
      if (!out[k]) out[k] = d.version || '';
    }
  } catch {
    /* library not available */
  }
  return out;
}

/** What the signing page may see: the agreement as printed, without margins, buying prices or operators. */
function publicBooking(b) {
  const x = JSON.parse(JSON.stringify(plain(b)));
  delete x._id;
  delete x.__v;
  delete x.operator;
  delete x.legOperators;
  delete x.signOtp;
  delete x.signedDocuments;
  delete x.wetSignature;
  delete x.taxChangeLog;
  delete x.tripActionAudit;
  delete x.internalNotes;
  delete x.overviewTasks;
  delete x.invoices;
  delete x.payments;
  delete x.creditNotes;
  if (x.pricing) {
    delete x.pricing.companyMargin;
    delete x.pricing.agentCommission;
    delete x.pricing.operatorCost;
    delete x.pricing.flightPrice;
  }
  delete x.commissionPercentage;
  delete x.adminMarginValue;
  (x.legPricing || []).forEach((l) => {
    delete l.buyingPrice;
    delete l.margin;
  });
  (x.legs || []).forEach((l) => {
    delete l.buyingPrice;
    delete l.crew;
  });
  return x;
}

/* ───────────── public ───────────── */

publicRouter.get('/:number', async (req, res) => {
  const doc = await findForSigning(req.params.number, req.query.k);
  if (!doc) return res.status(404).json({ success: false, message: 'This signing link is not valid. Open the link from your email.' });
  if (doc.isCancelled && !doc.get('isContractSigned')) {
    return res.status(410).json({ success: false, message: 'This agreement has been replaced by a newer version. Use the link in the latest email.' });
  }
  const signer = signerOf(doc);
  const sig = doc.get('contractSignature') || null;
  res.json({
    success: true,
    data: {
      number: agreementNumber(doc),
      quote: quoteNumber(doc),
      signed: Boolean(doc.get('isContractSigned')),
      signedAt: sig ? sig.signedAt : null,
      signedBy: sig ? sig.name : doc.get('contractSignedBy') || '',
      wetPending: Boolean(doc.get('wetSignature') && doc.get('wetSignature').uploadedAt && !doc.get('wetSignature').confirmedAt),
      signer: { name: signer.name, position: signer.position, email: maskEmail(signer.email), company: signer.company },
      versions: await legalVersions(doc),
      links: agreementLinks(doc, req.query.origin),
      booking: publicBooking(doc),
    },
  });
  // (the signing key already exists: it is how this agreement was found)
});

publicRouter.post('/:number/code', async (req, res) => {
  const doc = await findForSigning(req.params.number, req.query.k || (req.body && req.body.k));
  if (!doc) return res.status(404).json({ success: false, message: 'This signing link is not valid.' });
  if (doc.get('isContractSigned')) return res.status(409).json({ success: false, message: 'This agreement is already signed.' });
  if (doc.isCancelled) return res.status(410).json({ success: false, message: 'This agreement has been replaced by a newer version.' });
  const signer = signerOf(doc);
  if (!signer.email) return res.status(400).json({ success: false, message: 'There is no email address to send the code to. Please contact your representative.' });

  const now = Date.now();
  const prev = doc.get('signOtp') || {};
  const recent = (prev.sentTimes || []).filter((t) => now - new Date(t).getTime() < 60 * 60 * 1000);
  if (recent.length >= MAX_CODES_PER_HOUR) {
    return res.status(429).json({ success: false, message: 'Too many codes asked for. Please wait an hour and try again.' });
  }
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const sent = await sendSignCodeEmail(signer.email, { name: signer.name, number: agreementNumber(doc), code });
  if (!sent || sent.success === false) {
    return res.status(422).json({ success: false, message: 'The code could not be sent by email. Please contact your representative.' });
  }
  doc.set('signOtp', {
    hash: hash(`${code}:${doc.get('signToken')}`),
    expiresAt: new Date(now + CODE_TTL),
    attempts: 0,
    sentTo: signer.email,
    sentAt: new Date(now),
    sentTimes: [...recent, new Date(now)],
  });
  doc.markModified('signOtp');
  await doc.save();
  res.json({ success: true, data: { sentTo: maskEmail(signer.email), expiresInMinutes: CODE_TTL / 60000 } });
});

publicRouter.post('/:number/sign', async (req, res) => {
  const b = req.body || {};
  const doc = await findForSigning(req.params.number, req.query.k || b.k);
  if (!doc) return res.status(404).json({ success: false, message: 'This signing link is not valid.' });
  if (doc.get('isContractSigned')) return res.status(409).json({ success: false, message: 'This agreement is already signed.' });
  if (doc.isCancelled) return res.status(410).json({ success: false, message: 'This agreement has been replaced by a newer version.' });

  const checks = b.checks || {};
  if (!(checks.flights && checks.legal && checks.passengers && checks.authorised)) {
    return res.status(400).json({ success: false, message: 'Tick all four boxes before signing.' });
  }
  const name = String(b.name || '').trim();
  const position = String(b.position || '').trim();
  if (name.length < 2 || position.length < 2) return res.status(400).json({ success: false, message: 'Enter your name and position.' });
  const signature = String(b.signature || '');
  if (!/^data:image\/png;base64,/.test(signature) || signature.length < 200 || signature.length > 800 * 1024) {
    return res.status(400).json({ success: false, message: 'Draw your signature in the box.' });
  }
  const pdf = typeof b.pdf === 'string' && /^data:application\/pdf;base64,/.test(b.pdf) && b.pdf.length < 8 * 1024 * 1024 ? b.pdf : '';

  // One-time code
  const otp = doc.get('signOtp') || {};
  if (!otp.hash) return res.status(400).json({ success: false, message: 'Ask for a code first.' });
  if (new Date(otp.expiresAt).getTime() < Date.now()) return res.status(400).json({ success: false, message: 'The code has expired. Ask for a new one.' });
  if ((otp.attempts || 0) >= MAX_ATTEMPTS) return res.status(429).json({ success: false, message: 'Too many wrong codes. Ask for a new one.' });
  const code = String(b.code || '').replace(/\s+/g, '');
  if (hash(`${code}:${doc.get('signToken')}`) !== otp.hash) {
    doc.set('signOtp', { ...otp, attempts: (otp.attempts || 0) + 1 });
    doc.markModified('signOtp');
    await doc.save();
    return res.status(400).json({ success: false, message: 'That code is not right. Check the email and try again.' });
  }

  const versions = await legalVersions(doc);
  const now = new Date();
  const signer = signerOf(doc);
  const record = {
    method: 'online',
    name,
    position,
    email: otp.sentTo || signer.email,
    signedAt: now.toISOString(),
    ip: ipOf(req),
    userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
    code,
    codeSentAt: otp.sentAt,
    codeVerifiedAt: now.toISOString(),
    checks: { flights: true, legal: true, passengers: true, authorised: true },
    versions,
    signatureImage: signature,
    documentSha256: pdf ? hash(pdf) : '',
  };
  doc.set('signOtp', { ...otp, hash: '', usedAt: now });
  doc.markModified('signOtp');

  const result = await finalizeSignature(doc, record, { pdf, origin: b.origin, user: null, req });
  if (result.error) return res.status(result.error.status).json({ success: false, message: result.error.message });
  res.json({ success: true, data: result.data });
});

/* ───────────── shared: what one signature triggers ───────────── */

function certificatePdf(b, record, counter) {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({ size: 'A4', margin: 56 });
    const chunks = [];
    pdf.on('data', (c) => chunks.push(c));
    pdf.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);
    const row = (label, value) => {
      pdf.font('Helvetica-Bold').fontSize(9).fillColor('#4B5563').text(label.toUpperCase(), { continued: false });
      pdf.font('Helvetica').fontSize(11).fillColor('#111827').text(value || '—');
      pdf.moveDown(0.5);
    };
    pdf.font('Helvetica-Bold').fontSize(20).fillColor('#111827').text('Signature certificate');
    pdf.moveDown(0.3);
    pdf.font('Helvetica').fontSize(10).fillColor('#4B5563').text(`Charter agreement ${agreementNumber(b)} · based on quote ${quoteNumber(b)}`);
    pdf.moveTo(56, pdf.y + 8).lineTo(539, pdf.y + 8).strokeColor('#C9A24A').lineWidth(2).stroke();
    pdf.moveDown(1.5);
    row('Signed by', `${record.name}, ${record.position}`);
    row('Email (one-time code sent to)', record.email);
    row('Signed at (UTC)', new Date(record.signedAt).toISOString().replace('T', ' ').slice(0, 19));
    row('IP address', record.ip);
    row('Method', record.method === 'wet' ? `Wet signature uploaded by ${record.uploadedBy || 'the desk'}, confirmed by ${record.confirmedBy || 'the MD'}` : 'Online signature with one-time code');
    if (record.method !== 'wet') {
      row('One-time code', `${record.code} · sent ${record.codeSentAt ? new Date(record.codeSentAt).toISOString().replace('T', ' ').slice(0, 19) : ''} UTC · verified ${new Date(record.codeVerifiedAt).toISOString().replace('T', ' ').slice(0, 19)} UTC`);
      row('Confirmed by the client', 'Flights and price · C1, C3 and C5 by version · passenger details 48 h before departure · authorised to sign');
    }
    const v = record.versions || {};
    row('Versions accepted', `C1 Brokerage Terms ${v.C1 || '—'} · C2 Charter Agreement ${v.C2 || '—'} · C3 Cancellation Policy ${v.C3 || '—'} · C5 Privacy Notice ${v.C5 || '—'}`);
    if (record.documentSha256) row('Signed document (SHA-256)', record.documentSha256);
    row('Countersigned', `${counter.name}${counter.title ? `, ${counter.title}` : ''} · ${new Date(counter.at).toISOString().replace('T', ' ').slice(0, 19)} UTC`);
    if (record.signatureImage) {
      try {
        const img = Buffer.from(String(record.signatureImage).split(',')[1], 'base64');
        pdf.moveDown(0.5);
        pdf.font('Helvetica-Bold').fontSize(9).fillColor('#4B5563').text('SIGNATURE');
        pdf.image(img, { fit: [220, 80] });
      } catch {
        /* image could not be drawn */
      }
    }
    pdf.end();
  });
}

async function finalizeSignature(doc, record, { pdf = '', origin = '', user = null, req = null } = {}) {
  const b0 = plain(doc);
  const snap = b0.documentSnapshot || {};
  const company = snap.company || {};
  const counter = {
    name: company.representativeName || process.env.MD_NAME || 'Managing Director',
    title: company.signatoryTitle || 'Managing Director',
    entity: company.legalEntity || '',
    at: new Date().toISOString(),
  };

  // 1 · signature, certificate and the signed document
  doc.set('contractSignature', { ...record, signatureImage: record.signatureImage });
  doc.set('countersignature', counter);
  doc.set('isContractSigned', true);
  doc.set('contractSignedDate', new Date().toISOString().slice(0, 10));
  doc.set('contractSignedBy', record.name);
  const certificate = await certificatePdf(b0, record, counter).catch(() => null);
  const files = [];
  if (pdf) files.push({ kind: 'agreement', fileName: `${agreementNumber(b0)}-signed.pdf`, dataUrl: pdf, sha256: hash(pdf), at: new Date() });
  if (certificate) files.push({ kind: 'certificate', fileName: `${agreementNumber(b0)}-certificate.pdf`, dataUrl: `data:application/pdf;base64,${certificate.toString('base64')}`, at: new Date() });
  doc.set('signedDocuments', files);

  // 2 · QUO → TRI
  const converted = await convertQuoteToBooking(doc, { user, via: 'client' });
  if (converted.error) return { error: converted.error };
  const bk = converted.booking;

  // 4 · first invoice with its due date
  ensureLedger(bk);
  const ledger = computeLedger(bk.toObject());
  syncSummary(bk, ledger);
  const firstInvoice = (bk.invoices || [])[0] || null;

  // 5 · payment reminders, passenger request, message plan
  bk.autoPaymentRemindersEnabled = true;
  bk.set('passengerDetailsRequestedAt', new Date());
  bk.set('messagePlanStartedAt', new Date());
  const dep = firstDeparture(bk);
  const signer = signerOf(bk);
  const trip = bk.tripNumber || bk.bookingRevisionId || '';
  const tokenTrip = String(trip).replace(/^TRI-/, '').split('-')[0];
  const queue = [];
  if (firstInvoice) {
    queue.push({ automationCode: 'PAY-01', status: 'due_now', scheduledFor: new Date(), content: `Invoice ${firstInvoice.number} issued, due ${firstInvoice.dueDate ? String(firstInvoice.dueDate).slice(0, 10) : 'on receipt'}.` });
    const due = firstInvoice.dueDate ? new Date(firstInvoice.dueDate) : null;
    if (due && !isNaN(due.getTime())) {
      [2 * DAY, 1 * DAY, 0].forEach((before) => {
        const at = new Date(due.getTime() - before);
        if (at.getTime() > Date.now()) queue.push({ automationCode: 'PAY-02', status: 'scheduled', scheduledFor: at, content: `Reminder: invoice ${firstInvoice.number} due ${due.toISOString().slice(0, 10)}.` });
      });
    }
  }
  queue.push({ automationCode: 'OPS-02', status: 'due_now', scheduledFor: new Date(), content: `Please send full names and travel documents for every passenger, no later than 48 h before departure (${routeLabel(bk)}).` });
  if (dep) {
    [3 * DAY, 2 * DAY, 1 * DAY].forEach((before) => {
      const at = new Date(dep.getTime() - before);
      if (at.getTime() > Date.now()) queue.push({ automationCode: 'OPS-02', status: 'scheduled', scheduledFor: at, content: `Passenger details reminder for ${routeLabel(bk)}.` });
    });
  }
  await MessageQueueItem.insertMany(
    queue.map((q) => ({ ...q, tripNumber: tokenTrip || trip, recipientName: signer.name || signer.company, recipientContact: signer.email, channel: 'Email + WhatsApp' }))
  ).catch(() => {});

  // 7 · tasks on the Overview
  const tasks = [
    { key: 'operator-confirm', title: 'Confirm the aircraft with the operator', dueAt: new Date().toISOString(), tab: 'sourcing', linkText: 'Sourcing →', category: 'operator', shortBadge: 'confirm operator' },
    { key: 'passenger-details', title: 'Collect passenger names and documents', dueAt: dep ? new Date(dep.getTime() - 2 * DAY).toISOString() : new Date().toISOString(), tab: 'passengers', linkText: 'Passengers →', category: 'passengers', shortBadge: 'passenger details' },
  ];
  if (firstInvoice) tasks.push({ key: 'first-invoice', title: `Follow payment of ${firstInvoice.number}`, dueAt: firstInvoice.dueDate || new Date().toISOString(), tab: 'accounting', linkText: 'Payments →', category: 'payments', shortBadge: 'first invoice' });
  const existing = Array.isArray(bk.get('overviewTasks')) ? bk.get('overviewTasks') : [];
  bk.set('overviewTasks', [...existing.filter((t) => !tasks.some((n) => n.key === t.key)), ...tasks.map((t) => ({ ...t, addedAt: new Date().toISOString() }))]);
  bk.markModified('invoices');
  bk.markModified('overviewTasks');
  await bk.save();

  // 3 · countersigned copy by email (with the certificate)
  const links = agreementLinks(bk, origin);
  const attachments = files.map((f) => ({ filename: f.fileName, content: Buffer.from(String(f.dataUrl).split(',')[1], 'base64'), contentType: 'application/pdf' }));
  const mailed = await sendSignedAgreementEmail(record.email || signer.email, {
    name: record.name,
    number: agreementNumber(bk),
    tripNumber: trip,
    links,
    attachments,
  }).catch(() => ({ success: false }));

  // 6 · the Curator
  const sourceRequestId = bk.get('sourceAgentRequestId');
  if (sourceRequestId || bk.agentEmail) {
    const text = `${record.name} signed charter agreement ${agreementNumber(bk)}${record.method === 'wet' ? ' (wet signature confirmed)' : ' online'}. Booking ${trip} is confirmed${firstInvoice ? `; invoice ${firstInvoice.number} issued` : ''}.`;
    if (sourceRequestId) {
      await AgentRequest.updateOne(
        { $or: [{ id: sourceRequestId }, { requestNumber: sourceRequestId }] },
        { $push: { messages: { id: crypto.randomUUID(), sender: 'Orbelo desk', senderRole: 'system', senderEmail: '', message: text, timestamp: new Date() } } }
      ).catch(() => {});
    }
    if (bk.agentEmail) await sendEmail({ to: bk.agentEmail, subject: `Agreement signed · ${trip}`, html: `<p>${text}</p>`, text }).catch(() => {});
  }

  await createNotification({
    type: 'info',
    title: 'Charter agreement signed',
    message: `${record.name} signed ${agreementNumber(bk)} · booking ${trip} confirmed`,
    entityId: trip,
    entityType: 'booking',
    priority: 'high',
  }).catch(() => {});
  await createAuditEntry({
    user,
    userName: user ? '' : record.name,
    userEmail: user ? '' : record.email,
    userRole: user ? '' : 'client',
    action: 'AGREEMENT_SIGNED',
    entityType: 'booking',
    entityId: trip,
    details: { agreement: agreementNumber(bk), method: record.method, versions: record.versions, emailed: Boolean(mailed && mailed.success) },
    ipAddress: record.ip || '',
    req,
  });

  return {
    data: {
      agreement: agreementNumber(bk),
      tripNumber: trip,
      invoice: firstInvoice ? { number: firstInvoice.number, dueDate: firstInvoice.dueDate, amount: firstInvoice.amount } : null,
      emailed: Boolean(mailed && mailed.success),
      countersignedBy: counter.name,
    },
  };
}

/* ───────────── desk ───────────── */

async function findDesk(id) {
  const q = [{ id }, { tripNumber: id }, { quoteId: id }, { quoteReference: id }, { tripId: id }];
  if (/^[a-f0-9]{24}$/i.test(String(id))) q.push({ _id: id });
  return Booking.findOne({ $or: q, isDeleted: { $ne: true } });
}

deskRouter.post('/:id/wet-signed', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const doc = await findDesk(req.params.id);
  if (!doc) return res.status(404).json({ success: false, message: 'Quote not found.' });
  if (doc.get('isContractSigned')) return res.status(409).json({ success: false, message: 'This agreement is already signed.' });
  const b = req.body || {};
  const file = String(b.file || '');
  if (!/^data:(application\/pdf|image\/(png|jpeg));base64,/.test(file) || file.length > 8 * 1024 * 1024) {
    return res.status(400).json({ success: false, message: 'Upload the signed agreement as a PDF or image (max. 6 MB).' });
  }
  if (!String(b.signerName || '').trim()) return res.status(400).json({ success: false, message: 'Enter the name of the person who signed.' });
  doc.set('wetSignature', {
    uploadedAt: new Date(),
    uploadedBy: req.user.name || req.user.email,
    fileName: String(b.fileName || 'signed-agreement.pdf').slice(0, 120),
    file,
    signerName: String(b.signerName).trim(),
    signerPosition: String(b.signerPosition || '').trim(),
    confirmedAt: null,
  });
  await doc.save();
  await createAuditEntry({ user: req.user, action: 'AGREEMENT_WET_UPLOADED', entityType: 'booking', entityId: agreementNumber(doc), req });
  res.json({ success: true, message: 'Uploaded. The MD confirms it to book the trip.' });
});

deskRouter.post('/:id/wet-signed/confirm', authorize('super_admin'), async (req, res) => {
  const doc = await findDesk(req.params.id);
  if (!doc) return res.status(404).json({ success: false, message: 'Quote not found.' });
  const wet = doc.get('wetSignature') || {};
  if (!wet.uploadedAt) return res.status(400).json({ success: false, message: 'No wet-signed copy has been uploaded.' });
  if (doc.get('isContractSigned')) return res.status(409).json({ success: false, message: 'This agreement is already signed.' });
  doc.set('wetSignature', { ...wet, confirmedAt: new Date(), confirmedBy: req.user.name || req.user.email });
  doc.markModified('wetSignature');
  const signer = signerOf(doc);
  const record = {
    method: 'wet',
    name: wet.signerName,
    position: wet.signerPosition,
    email: signer.email,
    signedAt: new Date(wet.uploadedAt).toISOString(),
    ip: '',
    uploadedBy: wet.uploadedBy,
    confirmedBy: req.user.name || req.user.email,
    versions: await legalVersions(doc),
    signatureImage: '',
  };
  const pdf = /^data:application\/pdf/.test(wet.file) ? wet.file : '';
  const result = await finalizeSignature(doc, record, { pdf, origin: req.body && req.body.origin, user: req.user, req });
  if (result.error) return res.status(result.error.status).json({ success: false, message: result.error.message });
  res.json({ success: true, data: result.data });
});

deskRouter.get('/:id/files/:kind', authorize('super_admin', 'admin', 'operations', 'finance'), async (req, res) => {
  const doc = await findDesk(req.params.id);
  if (!doc) return res.status(404).json({ success: false, message: 'Not found.' });
  const f = (doc.get('signedDocuments') || []).find((x) => x.kind === req.params.kind);
  if (!f) return res.status(404).json({ success: false, message: 'No such file on this trip.' });
  res.json({ success: true, data: { fileName: f.fileName, dataUrl: f.dataUrl } });
});

module.exports = { publicRouter, deskRouter, finalizeSignature };

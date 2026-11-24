/**
 * Public payment link (no login): what the client opens from "Generate payment link".
 *   GET  /api/pay/:token          invoice summary, bank details, card checkout (if Stripe is set up)
 *   POST /api/pay/:token/proof    client uploads proof of a bank transfer → "Proof uploaded · confirm"
 *   POST /api/pay/:token/check    after card checkout: records the payment when Stripe says it is paid
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const Booking = require('../models/Booking');
const { ensureLedger, computeLedger, syncSummary, round2 } = require('../services/ledgerService');

async function findByToken(token) {
  if (!token || String(token).length < 10) return null;
  return Booking.findOne({ isDeleted: { $ne: true }, 'invoices.paymentLink.token': String(token) });
}

function summary(doc, token) {
  ensureLedger(doc);
  const l = computeLedger(doc.toObject());
  const inv = l.invoices.find((i) => i.paymentLink && i.paymentLink.token === token);
  if (!inv) return null;
  const op = doc.operator || {};
  return {
    invoiceNumber: inv.number,
    purpose: inv.purpose || 'Charter',
    trip: `TRI-${l.tripToken}`,
    client: l.clientName,
    amount: inv.amount,
    open: inv.open,
    currency: l.currency,
    dueDate: inv.dueDate,
    status: inv.status,
    proofUploaded: inv.hasProof,
    card: Boolean(inv.paymentLink.checkoutUrl),
    checkoutUrl: inv.paymentLink.checkoutUrl || '',
    bank: {
      accountHolder: op.accountHolder || op.companyName || '',
      bankName: op.bankName || '',
      iban: op.iban || '',
      bic: op.bic || '',
      reference: inv.number
    }
  };
}

router.get('/:token', async (req, res) => {
  const doc = await findByToken(req.params.token);
  const data = doc && summary(doc, req.params.token);
  if (!data) return res.status(404).json({ success: false, message: 'This payment link is not valid any more.' });
  res.json({ success: true, data });
});

router.post('/:token/proof', async (req, res) => {
  const doc = await findByToken(req.params.token);
  const data = doc && summary(doc, req.params.token);
  if (!data) return res.status(404).json({ success: false, message: 'This payment link is not valid any more.' });
  if (!(data.open > 0)) return res.status(400).json({ success: false, message: 'This invoice is already paid.' });
  const proofUrl = typeof req.body.proofUrl === 'string' && req.body.proofUrl.length < 6 * 1024 * 1024 ? req.body.proofUrl : '';
  if (!proofUrl && !req.body.reference) {
    return res.status(400).json({ success: false, message: 'Attach the transfer confirmation or type the bank reference.' });
  }
  doc.payments = [
    ...(doc.payments || []),
    {
      id: `pay-${crypto.randomUUID()}`,
      invoiceNumber: data.invoiceNumber,
      amount: round2(Number(req.body.amount) > 0 ? Math.min(Number(req.body.amount), data.open) : data.open),
      method: 'bank_transfer',
      provider: '',
      reference: String(req.body.reference || '').slice(0, 120),
      proofName: String(req.body.proofName || 'proof').slice(0, 120),
      proofUrl,
      payerName: String(req.body.payerName || '').slice(0, 120),
      status: 'proof_uploaded',
      receivedAt: null,
      createdAt: new Date().toISOString()
    }
  ];
  doc.markModified('payments');
  await doc.save();
  res.json({ success: true, data: summary(doc, req.params.token) });
});

router.post('/:token/check', async (req, res) => {
  const doc = await findByToken(req.params.token);
  const data = doc && summary(doc, req.params.token);
  if (!data) return res.status(404).json({ success: false, message: 'This payment link is not valid any more.' });
  const inv = (doc.invoices || []).find((i) => i.paymentLink && i.paymentLink.token === req.params.token);
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !inv.paymentLink.checkoutId) return res.json({ success: true, data });
  const already = (doc.payments || []).some((p) => p.reference === inv.paymentLink.checkoutId);
  if (!already) {
    try {
      const r = await axios.get(`https://api.stripe.com/v1/checkout/sessions/${inv.paymentLink.checkoutId}`, {
        headers: { Authorization: `Bearer ${key}` },
        timeout: 15000
      });
      if (r.data && r.data.payment_status === 'paid') {
        doc.payments = [
          ...(doc.payments || []),
          {
            id: `pay-${crypto.randomUUID()}`,
            invoiceNumber: inv.number,
            amount: round2((r.data.amount_total || 0) / 100),
            method: 'card',
            provider: 'Stripe',
            reference: inv.paymentLink.checkoutId,
            proofName: 'auto',
            status: 'received', // card payments turn green automatically
            receivedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          }
        ];
        const l = computeLedger(doc.toObject());
        syncSummary(doc, l);
        doc.markModified('payments');
        await doc.save();
      }
    } catch {
      // Stripe not reachable: the admin can still confirm by hand
    }
  }
  res.json({ success: true, data: summary(doc, req.params.token) });
});

module.exports = router;

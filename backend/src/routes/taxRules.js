/**
 * Settings · Taxes (R-091)
 *   GET    /api/tax-rules                  all rows (seeded on first use)
 *   POST   /api/tax-rules                  add a row (always "to confirm" until the adviser confirms it)
 *   PUT    /api/tax-rules/:code            edit wording, dates, source, notes (a confirmed rate is not edited in place)
 *   POST   /api/tax-rules/:code/new-rate   a rate change: a new row from a start date; the old row ends the day before
 *   POST   /api/tax-rules/:code/confirm    the adviser confirms the row
 *   POST   /api/tax-rules/:code/unconfirm  back to "to confirm"
 *   DELETE /api/tax-rules/:code            remove a row that was never confirmed
 */
const express = require('express');
const router = express.Router();
const TaxRule = require('../models/TaxRule');
const { authorize } = require('../middleware/auth');
const { createAuditEntry } = require('../services/auditService');

const EDITORS = ['super_admin', 'admin', 'finance'];

// Seed rows. Only the international exemption and "outside scope" are confirmed; every country rate
// waits for the adviser (France, Italy, Spain, Malta, Nigeria to confirm; Austria and Germany to check).
const SEED = [
  {
    code: 'INTL-EXEMPT',
    jurisdiction: 'International',
    type: 'EXEMPT',
    appliesTo: 'international',
    rateType: 'percent',
    rate: 0,
    effectiveFrom: '2026-01-01',
    wording: 'International passenger transport by air: exempt from VAT (zero-rated).',
    status: 'confirmed',
    source: 'Basis rule (principal contracting, international legs)',
  },
  {
    code: 'OUT-OF-SCOPE',
    jurisdiction: 'International',
    type: 'OUTSIDE_SCOPE',
    appliesTo: 'any',
    rateType: 'percent',
    rate: 0,
    effectiveFrom: '2026-01-01',
    wording: 'Outside the scope of VAT.',
    status: 'confirmed',
    source: 'Basis rule',
  },
  { code: 'AT-VAT-DOM', jurisdiction: 'Austria', rate: 10, wording: 'Austrian VAT 10 % on domestic passenger transport.', source: 'Seed · to check' },
  { code: 'DE-VAT-DOM', jurisdiction: 'Germany', rate: 19, wording: 'German VAT 19 % on domestic passenger transport.', source: 'Seed · to check' },
  { code: 'FR-VAT-DOM', jurisdiction: 'France', rate: 10, wording: 'French VAT 10 % on domestic passenger transport.', source: 'Seed · to confirm' },
  { code: 'IT-VAT-DOM', jurisdiction: 'Italy', rate: 10, wording: 'Italian VAT 10 % on domestic passenger transport.', source: 'Seed · to confirm' },
  { code: 'ES-VAT-DOM', jurisdiction: 'Spain', rate: 10, wording: 'Spanish VAT 10 % on domestic passenger transport.', source: 'Seed · to confirm' },
  { code: 'MT-VAT-DOM', jurisdiction: 'Malta', rate: 18, wording: 'Maltese VAT on domestic passenger transport.', source: 'Seed · to confirm' },
  { code: 'NG-VAT-DOM', jurisdiction: 'Nigeria', rate: 7.5, wording: 'Nigerian VAT 7.5 % on domestic passenger transport.', source: 'Seed · to confirm' },
  { code: 'CH-VAT-DOM', jurisdiction: 'Switzerland', rate: 8.1, wording: 'Swiss VAT 8.1 % on domestic passenger transport.', source: 'Seed · to confirm' },
  { code: 'GB-VAT-DOM', jurisdiction: 'United Kingdom', rate: 20, wording: 'UK VAT 20 % on domestic passenger transport.', source: 'Seed · to confirm' },
  {
    code: 'US-FET-DOM',
    jurisdiction: 'United States',
    type: 'US_FET',
    rate: 7.5,
    wording: 'US federal excise tax on domestic air transportation (7.5 %).',
    source: 'Seed · to confirm',
  },
  {
    code: 'US-FET-SEG',
    jurisdiction: 'United States',
    type: 'US_FET',
    appliesTo: 'segment',
    rateType: 'per_pax',
    rate: 5.3,
    currency: 'USD',
    wording: 'US domestic flight segment fee, per passenger per segment.',
    source: 'Seed · to confirm',
  },
].map((r) => ({
  type: 'VAT',
  appliesTo: 'domestic',
  rateType: 'percent',
  effectiveFrom: '2026-01-01',
  status: 'to_confirm',
  ...r,
}));

async function ensureSeed() {
  const count = await TaxRule.countDocuments({});
  if (count > 0) return;
  await TaxRule.insertMany(SEED.map((r) => ({ ...r, history: [{ at: new Date(), by: 'system', what: 'Seed row' }] })), { ordered: false }).catch(() => {});
}

const who = (req) => (req.user && (req.user.name || req.user.email)) || 'system';
const clean = (v) => (typeof v === 'string' ? v.trim() : v);
const dayBefore = (iso) => {
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00Z`);
  if (isNaN(d.getTime())) return '';
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

router.get('/', async (req, res) => {
  await ensureSeed();
  const rows = await TaxRule.find({ isDeleted: { $ne: true } }).sort({ jurisdiction: 1, code: 1, effectiveFrom: 1 }).lean();
  res.json({ success: true, data: rows });
});

router.post('/', authorize(...EDITORS), async (req, res) => {
  const b = req.body || {};
  const code = String(b.code || '').trim().toUpperCase();
  if (!code || !b.jurisdiction) return res.status(400).json({ success: false, message: 'A row needs a code and a jurisdiction.' });
  if (await TaxRule.findOne({ code })) return res.status(409).json({ success: false, message: `There is already a row ${code}.` });
  const row = await TaxRule.create({
    code,
    jurisdiction: clean(b.jurisdiction),
    type: b.type || 'VAT',
    appliesTo: b.appliesTo || 'domestic',
    rateType: b.rateType || 'percent',
    rate: Number(b.rate) || 0,
    currency: clean(b.currency) || '',
    effectiveFrom: clean(b.effectiveFrom) || new Date().toISOString().slice(0, 10),
    effectiveTo: clean(b.effectiveTo) || '',
    wording: clean(b.wording) || '',
    source: clean(b.source) || '',
    notes: clean(b.notes) || '',
    status: 'to_confirm',
    history: [{ at: new Date(), by: who(req), what: 'Row added' }],
  });
  await createAuditEntry({ user: req.user, action: 'TAX_RULE_ADDED', entityType: 'tax_rule', entityId: code, details: { rate: row.rate }, req });
  res.status(201).json({ success: true, data: row });
});

router.put('/:code', authorize(...EDITORS), async (req, res) => {
  const row = await TaxRule.findOne({ code: String(req.params.code).toUpperCase(), isDeleted: { $ne: true } });
  if (!row) return res.status(404).json({ success: false, message: 'Tax row not found.' });
  const b = req.body || {};
  const changes = [];
  for (const k of ['jurisdiction', 'type', 'appliesTo', 'rateType', 'currency', 'effectiveFrom', 'effectiveTo', 'wording', 'source', 'notes']) {
    if (b[k] !== undefined && String(b[k]) !== String(row[k] || '')) {
      changes.push(`${k}: ${row[k] || '—'} → ${b[k] || '—'}`);
      row[k] = clean(b[k]);
    }
  }
  if (b.rate !== undefined && Number(b.rate) !== row.rate) {
    if (row.status === 'confirmed') {
      return res.status(400).json({ success: false, message: 'A confirmed rate is not changed in place. Add the new rate with its start date.' });
    }
    changes.push(`rate: ${row.rate} → ${Number(b.rate) || 0}`);
    row.rate = Number(b.rate) || 0;
  }
  if (!changes.length) return res.json({ success: true, data: row });
  row.history.push({ at: new Date(), by: who(req), what: changes.join('; ') });
  await row.save();
  await createAuditEntry({ user: req.user, action: 'TAX_RULE_CHANGED', entityType: 'tax_rule', entityId: row.code, details: { changes }, req });
  res.json({ success: true, data: row });
});

router.post('/:code/new-rate', authorize(...EDITORS), async (req, res) => {
  const row = await TaxRule.findOne({ code: String(req.params.code).toUpperCase(), isDeleted: { $ne: true } });
  if (!row) return res.status(404).json({ success: false, message: 'Tax row not found.' });
  const from = String((req.body && req.body.effectiveFrom) || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) return res.status(400).json({ success: false, message: 'Give the date the new rate starts.' });
  if (row.effectiveFrom && from <= row.effectiveFrom) return res.status(400).json({ success: false, message: 'The new rate must start after the current one.' });
  const base = row.code.replace(/@\d{4}-\d{2}-\d{2}$/, '');
  const code = `${base}@${from}`;
  if (await TaxRule.findOne({ code })) return res.status(409).json({ success: false, message: `A rate from ${from} already exists.` });
  const next = await TaxRule.create({
    code,
    jurisdiction: row.jurisdiction,
    type: row.type,
    appliesTo: row.appliesTo,
    rateType: row.rateType,
    rate: Number(req.body.rate) || 0,
    currency: row.currency,
    effectiveFrom: from,
    effectiveTo: '',
    wording: clean(req.body.wording) || row.wording,
    source: clean(req.body.source) || '',
    status: 'to_confirm',
    history: [{ at: new Date(), by: who(req), what: `New rate from ${from} (replaces ${row.code})` }],
  });
  row.effectiveTo = dayBefore(from);
  row.history.push({ at: new Date(), by: who(req), what: `Ends ${row.effectiveTo}; replaced by ${code}` });
  await row.save();
  await createAuditEntry({ user: req.user, action: 'TAX_RATE_CHANGED', entityType: 'tax_rule', entityId: code, details: { from, rate: next.rate, replaces: row.code }, req });
  res.status(201).json({ success: true, data: next });
});

async function setStatus(req, res, status) {
  const row = await TaxRule.findOne({ code: String(req.params.code).toUpperCase(), isDeleted: { $ne: true } });
  if (!row) return res.status(404).json({ success: false, message: 'Tax row not found.' });
  row.status = status;
  if (req.body && req.body.source) row.source = clean(req.body.source);
  row.history.push({ at: new Date(), by: who(req), what: status === 'confirmed' ? 'Confirmed by adviser' : 'Marked to confirm' });
  await row.save();
  await createAuditEntry({ user: req.user, action: status === 'confirmed' ? 'TAX_RULE_CONFIRMED' : 'TAX_RULE_UNCONFIRMED', entityType: 'tax_rule', entityId: row.code, req });
  res.json({ success: true, data: row });
}
router.post('/:code/confirm', authorize(...EDITORS), (req, res) => setStatus(req, res, 'confirmed'));
router.post('/:code/unconfirm', authorize(...EDITORS), (req, res) => setStatus(req, res, 'to_confirm'));

router.delete('/:code', authorize(...EDITORS), async (req, res) => {
  const row = await TaxRule.findOne({ code: String(req.params.code).toUpperCase(), isDeleted: { $ne: true } });
  if (!row) return res.status(404).json({ success: false, message: 'Tax row not found.' });
  if (row.status === 'confirmed') return res.status(400).json({ success: false, message: 'A confirmed row stays for the record. End it with a date instead.' });
  row.isDeleted = true;
  row.history.push({ at: new Date(), by: who(req), what: 'Removed' });
  await row.save();
  await createAuditEntry({ user: req.user, action: 'TAX_RULE_REMOVED', entityType: 'tax_rule', entityId: row.code, req });
  res.json({ success: true });
});

module.exports = router;

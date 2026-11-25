/**
 * Links carried by the charter agreement and its emails (R-093):
 *   sign.orbaero.com/CA-…               the online signing page (with a private key so the number alone opens nothing)
 *   orbaero.com/legal/charter-agreement  C2, the current form
 *   orbaero.com/legal/terms              C1 Brokerage Terms
 *   orbaero.com/legal/cancellation       C3 Cancellation Policy
 *   orbaero.com/legal/privacy            C5 Privacy Notice
 * Each legal link carries the issue date, so it opens the version in force that day.
 */
const crypto = require('crypto');
const { tripToken, versionOf } = require('./ledgerService');

const agreementNumber = (b) => `CA-${tripToken(b)}-${versionOf(b)}`;
const quoteNumber = (b) => `QUO-${tripToken(b)}-${versionOf(b)}`;

function ensureSignToken(booking) {
  let t = (booking.get && booking.get('signToken')) || booking.signToken;
  if (!t) {
    t = crypto.randomBytes(12).toString('hex');
    if (booking.set) booking.set('signToken', t);
    else booking.signToken = t;
  }
  return t;
}

const stripSlash = (u) => String(u || '').replace(/\/+$/, '');
const withScheme = (u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

function agreementLinks(booking, origin) {
  const b = booking && booking.toObject ? booking.toObject() : booking || {};
  const snap = (b.documentSnapshot && b.documentSnapshot.links) || {};
  const legalBase = stripSlash(withScheme(process.env.LEGAL_BASE_URL || snap.legalBase || 'orbaero.com'));
  const signBase = stripSlash(process.env.SIGN_BASE_URL || (origin ? `${stripSlash(origin)}/sign` : '') || 'https://sign.orbaero.com');
  const number = agreementNumber(b);
  const issuedRaw = b.quoteSentAt || b.createdAt || new Date();
  const issued = (issuedRaw instanceof Date ? issuedRaw.toISOString() : String(issuedRaw)).slice(0, 10);
  const issuedIso = /^\d{4}-\d{2}-\d{2}$/.test(issued) ? issued : new Date().toISOString().slice(0, 10);
  const token = ensureSignToken(booking);
  const legal = (path) => `${legalBase}/legal/${path}?on=${issuedIso}`;
  return {
    number,
    quote: quoteNumber(booking),
    sign: `${signBase}/${encodeURIComponent(number)}?k=${token}`,
    signLabel: `${(snap.signHost || 'sign.orbaero.com').replace(/^https?:\/\//, '')}/${number}`,
    form: legal('charter-agreement'),
    terms: legal('terms'),
    cancellation: legal('cancellation'),
    privacy: legal('privacy'),
  };
}

module.exports = { agreementLinks, agreementNumber, quoteNumber, ensureSignToken };

/**
 * Revisions of a trip: every quote and booking version shares one sequence (-001, -002, …).
 * Each row says what changed against the version before it, worked out from the saved versions.
 */
const { tripToken, isBooked, round2 } = require('./ledgerService');

const pad3 = (n) => String(n || 1).padStart(3, '0');

/** Version number: the larger of the quote version and the booking revision suffix. */
function versionNumber(b) {
  const q = Number(b.quoteVersion) || 0;
  const r = Number(String(b.bookingRevisionId || '').split('-').pop()) || 0;
  return Math.max(q, r, 1);
}

const code = (a) => (a && (a.icao || a.code || a.iata)) || (typeof a === 'string' ? a : '');
const liveLegs = (b) => (b.legs || []).filter((l) => !l.isCancelled);

function routeOf(b) {
  const legs = liveLegs(b);
  if (!legs.length) return '';
  return [code(legs[0].origin), ...legs.map((l) => code(l.destination))].filter(Boolean).join(' → ');
}

const dayOf = (v) => {
  if (!v) return '';
  const d = new Date(String(v).length === 10 ? `${v}T12:00:00Z` : v);
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' });
};

const paxOf = (b) =>
  (Array.isArray(b.passengers) && b.passengers.length) ||
  (liveLegs(b)[0] && Array.isArray(liveLegs(b)[0].passengers) && liveLegs(b)[0].passengers.length) ||
  Number(b.passengerCount) ||
  0;

const aircraftOf = (b) => {
  const a = b.aircraft || {};
  return [a.model || a.name || a.type || '', a.registration || ''].filter(Boolean).join(' · ');
};

const operatorOf = (b) => (b.operator && (b.operator.companyName || b.operator.name)) || '';

const totalOf = (b) => round2(b.pricing && b.pricing.totalFlightPrice);

const currencyOf = (b) => (b.pricing && b.pricing.currency) || 'EUR';

const money = (n, c) => {
  const sym = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF' }[c] || c;
  return `${sym} ${Math.abs(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/** Services that cost the client money or show on the Services tab, by name. */
function servicesOf(b) {
  const names = new Map();
  (b.tripServices || [])
    .filter((s) => s && s.status !== 'cancelled')
    .forEach((s) => {
      const base =
        { limousine: 'VIP limousine', helicopter: 'Helicopter transfer', catering: 'Catering' }[s.type] || s.title || s.name || 'Service';
      const timing = s.timing ? (s.timing === 'both' ? ' on arrival and departure' : ` on ${s.timing}`) : '';
      const name = `${base}${timing}${s.airport ? ` ${s.airport}` : ''}`.trim();
      names.set(name, Number(s.included ? 0 : s.clientPrice) || 0);
    });
  (b.manualServices || []).forEach((s) => {
    if (!s || !s.name) return;
    const short = String(s.name).split(' · ')[0];
    if (![...names.keys()].some((k) => k.startsWith(short))) names.set(s.name, Number(s.price) || 0);
  });
  return names;
}

const legTimes = (b) =>
  liveLegs(b).map((l) => ({
    route: `${code(l.origin)} → ${code(l.destination)}`,
    date: String(l.flightDate || '').slice(0, 10),
    time: l.departureTimeLocal || l.departureTime || ''
  }));

/** Differences between two versions, as short lines ("Route: A → B changed to A → C"). */
function differences(a, b, { short = false } = {}) {
  const out = [];
  const c = currencyOf(b);
  const ra = routeOf(a);
  const rb = routeOf(b);
  if (ra !== rb) out.push(short ? `Route ${ra || '—'} changed to ${rb || '—'}` : `Route: ${ra || '—'} → ${rb || '—'}`);

  const ta = legTimes(a);
  const tb = legTimes(b);
  tb.forEach((leg, i) => {
    const prev = ta[i];
    if (!prev || prev.route !== leg.route) return;
    if (prev.date !== leg.date) out.push(`${leg.route}: date ${dayOf(prev.date)} → ${dayOf(leg.date)}`);
    if (prev.time && leg.time && prev.time !== leg.time) out.push(short ? `Departure ${prev.time} → ${leg.time}` : `${leg.route}: departure ${prev.time} → ${leg.time}`);
  });

  const aa = aircraftOf(a);
  const ab = aircraftOf(b);
  if (aa !== ab && (aa || ab)) out.push(`Aircraft: ${aa || '—'} → ${ab || '—'}`);
  const oa = operatorOf(a);
  const ob = operatorOf(b);
  if (oa !== ob && (oa || ob)) out.push(`Operator: ${oa || '—'} → ${ob || '—'}`);

  const pa = paxOf(a);
  const pb = paxOf(b);
  if (pa !== pb && pb) out.push(`Passengers: ${pa} → ${pb}`);

  const sa = servicesOf(a);
  const sb = servicesOf(b);
  sb.forEach((price, name) => {
    if (!sa.has(name)) out.push(short ? `${name} added${price ? ` (${money(price, c)})` : ''}` : `Services: + ${name}${price ? ` (${money(price, c)})` : ''}`);
  });
  sa.forEach((price, name) => {
    if (!sb.has(name)) out.push(short ? `${name} removed` : `Services: − ${name}${price ? ` (${money(price, c)})` : ''}`);
  });

  if (!short) {
    const fa = totalOf(a);
    const fb = totalOf(b);
    out.push(fa === fb ? `Charter price: unchanged (${money(fb, c)})` : `Charter price: ${money(fa, c)} → ${money(fb, c)}`);
  }
  return out;
}

/**
 * @param {object[]} versions every saved version of the trip (plain objects)
 * @param {Map<string,string>} names e-mail → display name
 */
function buildRevisions(versions, names = new Map()) {
  // One row per version number: if two records share a number, the newest wins
  const byVersion = new Map();
  versions
    .filter((v) => v && !v.isDeleted)
    .forEach((v) => {
      const n = versionNumber(v);
      const cur = byVersion.get(n);
      if (!cur || new Date(v.createdAt || 0) > new Date(cur.createdAt || 0)) byVersion.set(n, v);
    });
  const ordered = [...byVersion.entries()].sort((x, y) => x[0] - y[0]).map(([n, v]) => ({ n, v }));
  if (!ordered.length) return { rows: [], latestVersion: null, token: '' };

  const token = tripToken(ordered[ordered.length - 1].v);
  // The current version: the latest live one (not cancelled), else the latest
  const live = ordered.filter(({ v }) => !v.isCancelled);
  const current = (live.length ? live : ordered)[(live.length ? live : ordered).length - 1];

  const rows = ordered.map(({ n, v }, i) => {
    const prev = i > 0 ? ordered[i - 1].v : null;
    const booked = isBooked(v);
    const c = currencyOf(v);
    const label = `-${pad3(n)}`;
    let whatChanged;
    if (!prev) {
      const req = v.sourceAgentRequestId || v.requestNumber || '';
      whatChanged = req
        ? `Created from request ${req}${v.agentName ? ` (${v.agentName})` : ''}`
        : `Created${v.agentName ? ` for ${v.agentName}` : ''}`;
      if (booked) whatChanged += ` · booked${v.contractDate ? `, contract CA-${token}-${pad3(n)} signed` : ''}`;
    } else {
      const diffs = differences(prev, v, { short: true });
      const bookedNow = booked && !isBooked(prev);
      const parts = [];
      if (bookedNow) parts.push(`Booked from -${pad3(ordered[i - 1].n)}${v.contractDate ? ` · contract CA-${token}-${pad3(n)} signed` : ''}`);
      parts.push(...diffs);
      whatChanged = parts.length ? parts.join(' · ') : 'No changes to route, times, aircraft, passengers or services';
    }

    // The first version and the first booked version show the full amount; later ones the change
    const firstBooked = booked && (!prev || !isBooked(prev));
    const amountChange = !prev || firstBooked ? totalOf(v) : round2(totalOf(v) - totalOf(prev));
    const next = ordered[i + 1] ? ordered[i + 1].v : null;
    let state;
    let stateLabel;
    if (current.v === v) {
      state = 'current';
      stateLabel = 'Current';
    } else if (next && !booked && isBooked(next)) {
      state = 'booked';
      stateLabel = `Booked → -${pad3(ordered[i + 1].n)}`;
    } else if (v.isCancelled && !/supersed/i.test(v.cancellationReason || '') && !v.supersededBy && !next) {
      state = 'cancelled';
      stateLabel = 'Cancelled';
    } else if (next && booked && routeOf(next) !== routeOf(v)) {
      state = 'cancelled_route';
      stateLabel = 'Cancelled route';
    } else if (booked && next && isBooked(next)) {
      // A booking revision adds to or subtracts from the booking: it never replaces it
      state = 'amended';
      stateLabel = `Amended by -${pad3(ordered[i + 1].n)}`;
    } else {
      state = 'superseded';
      stateLabel = 'Superseded';
    }

    // This revision's own invoice (the change only) and the booking's running total
    let revisionInvoice = null;
    let totalInvoice = null;
    if (booked) {
      const pending = (v.supplementaryInvoices || []).find((x) => x && x.invoiceNumber === `INV-${token}-${pad3(n)}`);
      const credit = (v.creditNotes || []).find((x) => x && (x.number || x.creditNoteNumber) === `CN-${token}-${pad3(n)}`);
      if (firstBooked) {
        revisionInvoice = { kind: 'invoice', number: v.originalInvoiceNumber || v.invoiceNumber || `INV-${token}-${pad3(n)}`, amount: totalOf(v), currency: c };
      } else if (amountChange > 0) {
        revisionInvoice = { kind: 'invoice', number: `INV-${token}-${pad3(n)}`, amount: round2(pending?.amount ?? amountChange), currency: c };
      } else if (amountChange < 0) {
        revisionInvoice = {
          kind: 'credit_note',
          number: `CN-${token}-${pad3(n)}`,
          amount: round2(credit?.amount ?? Math.abs(amountChange)),
          currency: c,
          note: credit || null
        };
      }
      totalInvoice = {
        kind: 'invoice',
        number: v.originalInvoiceNumber || `INV-${token}-001`,
        amount: totalOf(v),
        currency: c,
        parts: ordered
          .slice(0, i + 1)
          .filter(({ v: x }) => isBooked(x))
          .map(({ n: k }) => `-${pad3(k)}`)
      };
    }

    const email = v.revisedByEmail || v.createdByEmail || '';
    const by = v.revisedByName || names.get(email) || v.createdByName || (email ? email.split('@')[0] : '') || 'System';
    const when = v.revisedAt || v.createdAt || v.updatedAt;

    return {
      version: n,
      label,
      bookingId: String(v.id || v._id),
      mongoId: String(v._id || ''),
      type: booked ? 'Booking' : 'Quote',
      whatChanged,
      reason: v.revisionReason || v.changeReason || '',
      amountChange,
      amountIsTotal: !prev || firstBooked,
      currency: c,
      state,
      stateLabel,
      by: String(by).split(' ')[0],
      byFull: by,
      at: when ? new Date(when).toISOString() : null,
      documents: {
        quote: true,
        invoice: booked,
        brief: booked,
        creditNote: booked && current.v === v
      },
      revisionInvoice,
      totalInvoice,
      quoteNumber: `QUO-${token}-${pad3(n)}`,
      tripNumber: `TRI-${token}-${pad3(n)}`
    };
  });

  return { rows: rows.reverse(), latestVersion: current.n, token };
}

/** Compare two versions by number. */
function compareVersions(versions, fromN, toN) {
  const pick = (n) => {
    const all = versions.filter((v) => versionNumber(v) === Number(n));
    return all.sort((x, y) => new Date(y.createdAt || 0) - new Date(x.createdAt || 0))[0] || null;
  };
  const a = pick(fromN);
  const b = pick(toN);
  if (!a || !b) return { from: Number(fromN), to: Number(toN), lines: [], missing: true };
  if (a === b) return { from: Number(fromN), to: Number(toN), lines: ['Same version'], missing: false };
  return { from: Number(fromN), to: Number(toN), lines: differences(a, b), missing: false };
}

module.exports = { versionNumber, buildRevisions, compareVersions, differences, routeOf };

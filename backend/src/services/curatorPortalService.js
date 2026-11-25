/**
 * Curator portal: everything a Curator (agent) sees is worked out here from their own saved
 * requests, quotes and trips. Nothing is typed in: no sample rows.
 *
 * Tokens: three buckets, used in this order: monthly → free → paid.
 *  - monthly: the tier's allowance, refilled on the first visit of each month, expires at month end
 *  - free:    +1 per completed booking, and tokens returned when no aircraft was found
 *  - paid:    bundles bought; never expire
 */
const {
  tripToken,
  versionOf,
  isBooked,
  firstDeparture,
  routeLabel,
  clientName,
  round2,
  toIsoFromGerman,
  DAY
} = require('./ledgerService');
const { versionNumber, differences } = require('./revisionService');

const pad3 = (n) => String(n || 1).padStart(3, '0');
const escapeRegex = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const emailFilter = (email) => ({ $regex: `^${escapeRegex(String(email || '').trim())}$`, $options: 'i' });

const CATEGORY_KEYS = {
  light: 'light',
  'light jet': 'light',
  'very light jet': 'light',
  midsize: 'midsize',
  'midsize jet': 'midsize',
  'super midsize': 'super-midsize',
  'super-midsize': 'super-midsize',
  'super midsize jet': 'super-midsize',
  heavy: 'large',
  'heavy jet': 'large',
  large: 'large',
  'ultra long range': 'ultra-long-range',
  'ultra-long-range': 'ultra-long-range'
};
const categoryKey = (label) => CATEGORY_KEYS[String(label || '').toLowerCase().trim()] || 'any';

/* ───────────────────────── trips and versions ───────────────────────── */

/** Groups a Curator's saved versions by trip code; each group knows its latest and booked version. */
function groupTrips(bookings) {
  const groups = new Map();
  bookings.forEach((b) => {
    const t = tripToken(b);
    if (!groups.has(t)) groups.set(t, []);
    groups.get(t).push(b);
  });
  return [...groups.entries()].map(([token, versions]) => {
    const sorted = [...versions].sort(
      (a, b) => versionNumber(a) - versionNumber(b) || new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    );
    const live = sorted.filter((v) => !v.isCancelled || isBooked(v));
    const latest = (live.length ? live : sorted)[(live.length ? live : sorted).length - 1];
    const booked = [...sorted].reverse().find((v) => isBooked(v) && !v.isCancelled) || null;
    return { token, versions: sorted, latest, booked };
  });
}

/** The request a saved version came from. */
function requestForGroup(group, requests) {
  const ids = new Set();
  group.versions.forEach((v) => {
    if (v.sourceAgentRequestId) ids.add(String(v.sourceAgentRequestId));
  });
  return (
    requests.find((r) => ids.has(String(r.id)) || ids.has(String(r.requestNumber)) || ids.has(String(r._id))) ||
    requests.find((r) => tripToken(r) === group.token) ||
    null
  );
}

const code = (a) => (a && (a.icao || a.code)) || '';
const cityOf = (a) => {
  if (!a) return '';
  const raw = a.city || a.name || a.icao || '';
  return String(raw).split(/[\/,(]/)[0].trim();
};
const liveLegs = (b) => (b.legs || []).filter((l) => !l.isCancelled);
const cityRoute = (b) => {
  const legs = liveLegs(b);
  if (!legs.length) return '';
  const names = [cityOf(legs[0].origin), ...legs.map((l) => cityOf(l.destination))].filter(Boolean);
  // A return trip reads "Paris → Milan" in headings, like the designs
  if (names.length === 3 && names[0] === names[2]) return `${names[0]} → ${names[1]}`;
  return names.join(' → ');
};
const icaoRoute = (b) => {
  const legs = liveLegs(b);
  if (!legs.length) return '';
  if (legs.length === 2 && code(legs[0].origin) === code(legs[1].destination) && code(legs[0].destination) === code(legs[1].origin)) {
    return `${code(legs[0].origin)} → ${code(legs[0].destination)}`;
  }
  return routeLabel(b);
};

const paxOf = (b) =>
  (Array.isArray(b.passengers) && b.passengers.length) ||
  (liveLegs(b)[0] && Array.isArray(liveLegs(b)[0].passengers) && liveLegs(b)[0].passengers.length) ||
  Number(b.passengerCount) ||
  Number(liveLegs(b)[0] && liveLegs(b)[0].paxCount) ||
  0;

const money = (n, c = 'EUR') => {
  const sym = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF ' }[c] || `${c} `;
  return `${sym}${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

/** Quote expiry as a date (quoteExpirationDate is saved as "dd.mm.yyyy", an ISO date or a timestamp). */
function expiryOf(b) {
  const raw = b.quoteExpirationDate || b.quoteExpiresAt;
  if (!raw) return null;
  const iso = toIsoFromGerman(String(raw));
  const d = new Date(iso || raw);
  if (isNaN(d.getTime())) return null;
  // A date with no time expires at the end of that day
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(String(raw)) || /^\d{4}-\d{2}-\d{2}$/.test(String(raw))) d.setUTCHours(23, 59, 0, 0);
  return d;
}

const leftText = (ms) => {
  if (ms <= 0) return 'expired';
  const h = Math.floor(ms / 3600000);
  if (h < 1) return `${Math.max(1, Math.floor(ms / 60000))} min`;
  if (h < 48) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
};

const dayLabel = (d, withYearIfOld = false) => {
  if (!d) return '';
  const x = new Date(d);
  if (isNaN(x.getTime())) return '';
  const now = new Date();
  if (withYearIfOld && x.getUTCFullYear() !== now.getUTCFullYear()) {
    return x.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  return x.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }).replace(/^0/, '');
};

/** Passenger list of a version with the passport state of each (from the trip or the saved contact). */
function passengersOf(b, contacts = []) {
  const legs = liveLegs(b);
  const list = (Array.isArray(b.passengers) && b.passengers.length ? b.passengers : (legs[0] && legs[0].passengers) || []) || [];
  return list.map((p, i) => {
    const c = contacts.find((x) => p.contactId && (String(x.id) === String(p.contactId) || String(x._id) === String(p.contactId)));
    const pp = (c && (c.passportDetails || c.idDetails)) || {};
    const number = p.passportNumber || pp.passportNumber || pp.idNumber || '';
    return {
      id: String(p.id || p.contactId || `pax-${i + 1}`),
      name: p.fullName || (c && c.fullName) || `Passenger ${i + 1}`,
      complete: Boolean(number),
      nationality: p.nationality || pp.nationality || pp.issuingCountry || '',
      passportExpiry: p.passportExpiry || pp.expirationDate || ''
    };
  });
}

/** Commission on a version: the Curator margin inside the client price. */
function commissionOf(b) {
  const pricing = b.pricing || {};
  const pct = Number(b.commissionPercentage) || Number(pricing.agentMarginPercentage) || Number(b.agentMarginValue) || 0;
  const clientPrice = round2(pricing.totalFlightPrice);
  let amount = round2(pricing.agentMargin);
  if (!(amount > 0) && pct > 0 && clientPrice > 0) {
    const services = Number(pricing.additionalServicesTotal) || 0;
    const base = Math.max(0, clientPrice - services);
    amount = round2(base - base / (1 + pct / 100));
  }
  return { pct, amount, clientPrice, net: round2(clientPrice - amount), currency: pricing.currency || 'EUR' };
}

function servicesText(b) {
  const out = [];
  (b.tripServices || [])
    .filter((s) => s && s.status !== 'cancelled')
    .forEach((s) => {
      const base = { limousine: 'Limousine', helicopter: 'Helicopter transfer', catering: 'Catering' }[s.type] || s.title || 'Service';
      const where = s.airport ? ` at ${cityOf({ icao: s.airport, city: s.airportCity }) || s.airport}` : '';
      out.push(`${base}${where}`);
    });
  if (!out.length) {
    (b.manualServices || []).forEach((s) => s && s.name && out.push(String(s.name).split(' · ')[0]));
  }
  return [...new Set(out)];
}

/* ───────────────────────── tokens ───────────────────────── */

function parseBundles(rules) {
  const per = Number(rules && rules.pricePerToken) || 10;
  const text = String((rules && rules.bundles) || '');
  const bundles = text
    .split('/')
    .map((part) => {
      const m = part.match(/(\d+)\s*·\s*([$€£])\s*([\d,.]+)/);
      if (!m) return null;
      const tokens = Number(m[1]);
      const price = Number(m[3].replace(/,/g, ''));
      return { tokens, price, currency: { $: 'USD', '€': 'EUR', '£': 'GBP' }[m[2]] || 'USD', symbol: m[2] };
    })
    .filter(Boolean)
    .map((b) => ({ ...b, savePct: per > 0 ? Math.max(0, Math.round((1 - b.price / (b.tokens * per)) * 100)) : 0 }));
  const symbol = bundles[0] ? bundles[0].symbol : '$';
  return { single: { tokens: 1, price: per, currency: bundles[0] ? bundles[0].currency : 'USD', symbol, savePct: 0 }, bundles };
}

const monthKey = (d = new Date()) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
const monthEnd = (d = new Date()) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59));

function tierOf(user, config) {
  const tiers = (config && config.tiers) || [];
  const want = String(user.curatorTier || 'Patron').toLowerCase();
  return tiers.find((t) => String(t.tier).toLowerCase() === want) || tiers.find((t) => t.tier === 'Patron') || tiers[0] || { tier: 'Patron', monthlyTokens: 0 };
}

function pushTx(user, { type, amount, bucket, movement, tripRef = '', action, pricePaid = 0, currency = 'USD', at }) {
  const state = user.tokenState;
  const balanceAfter = (state.monthly || 0) + (state.free || 0) + (state.paid || 0);
  user.tokenTransactions = user.tokenTransactions || [];
  user.tokenTransactions.push({
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    type,
    amount: Math.abs(amount),
    balanceAfter,
    action: action || movement,
    description: movement,
    currency,
    pricePaid,
    bucket,
    tripRef,
    movement,
    createdAt: at || new Date()
  });
}

/**
 * Brings the token buckets up to date: month change, earned and returned tokens,
 * and any change made to the balance by other screens (admin grants, older flows).
 * Returns true when the user needs saving.
 */
function syncTokens(user, config, { requests = [], bookings = [] } = {}) {
  let changed = false;
  const tier = tierOf(user, config);
  const st = user.tokenState && typeof user.tokenState === 'object' ? { ...user.tokenState } : null;
  if (!st) {
    // First visit: everything already on the account counts as paid tokens
    user.tokenState = { monthly: 0, free: 0, paid: Math.max(0, Number(user.tokens) || 0), monthlyPeriod: '', earnedTrips: [], returnedRefs: [] };
    changed = true;
  } else {
    user.tokenState = st;
  }
  const s = user.tokenState;
  s.earnedTrips = Array.isArray(s.earnedTrips) ? s.earnedTrips : [];
  s.returnedRefs = Array.isArray(s.returnedRefs) ? s.returnedRefs : [];

  // Balance changed elsewhere (grants, older screens): settle the difference on paid tokens
  const sum = (s.monthly || 0) + (s.free || 0) + (s.paid || 0);
  const actual = Math.max(0, Number(user.tokens) || 0);
  if (sum !== actual) {
    let diff = actual - sum;
    if (diff > 0) s.paid = (s.paid || 0) + diff;
    else {
      diff = -diff;
      for (const k of ['monthly', 'free', 'paid']) {
        const take = Math.min(s[k] || 0, diff);
        s[k] = (s[k] || 0) - take;
        diff -= take;
      }
    }
    changed = true;
  }

  // New month: unused monthly tokens expire, the allowance is refilled
  const period = monthKey();
  if (s.monthlyPeriod !== period) {
    if ((s.monthly || 0) > 0) {
      const left = s.monthly;
      s.monthly = 0;
      pushTx(user, { type: 'debit', amount: left, bucket: 'monthly', movement: 'Monthly tokens expired' });
    }
    const allowance = Number(tier.monthlyTokens) || 0;
    s.monthlyPeriod = period;
    if (allowance > 0) {
      s.monthly = allowance;
      pushTx(user, { type: 'credit', amount: allowance, bucket: 'monthly', movement: 'Monthly allowance' });
    }
    changed = true;
  }

  // +1 free token per completed booking
  groupTrips(bookings).forEach((g) => {
    const done = g.versions.some((v) => ['completed', 'flown'].includes(String(v.status || '').toLowerCase()));
    if (done && !s.earnedTrips.includes(g.token)) {
      s.earnedTrips.push(g.token);
      s.free = (s.free || 0) + 1;
      pushTx(user, { type: 'credit', amount: 1, bucket: 'free', movement: 'Booking completed', tripRef: `TRI-${g.token}` });
      changed = true;
    }
  });

  // Tokens come back when the desk found no aircraft
  requests.forEach((r) => {
    if (String(r.status) !== 'declined') return;
    const ref = String(r.requestNumber || r.id);
    if (s.returnedRefs.includes(ref)) return;
    const spent = r.tokenSpend && typeof r.tokenSpend === 'object' ? r.tokenSpend : null;
    if (!spent) {
      s.returnedRefs.push(ref);
      changed = true;
      return; // requests sent before tokens were tracked here: nothing to give back
    }
    s.returnedRefs.push(ref);
    ['monthly', 'free', 'paid'].forEach((k) => {
      const n = Number(spent[k]) || 0;
      if (n > 0) {
        // Monthly tokens from an earlier month have expired: they come back as free tokens
        const bucket = k === 'monthly' && spent.period !== period ? 'free' : k;
        s[bucket] = (s[bucket] || 0) + n;
        pushTx(user, {
          type: 'credit',
          amount: n,
          bucket,
          movement: 'No aircraft found · returned',
          tripRef: `QUO-${tripToken(r)}-001`
        });
      }
    });
    changed = true;
  });

  user.tokens = (s.monthly || 0) + (s.free || 0) + (s.paid || 0);
  if (changed && typeof user.markModified === 'function') {
    user.markModified('tokenState');
    user.markModified('tokenTransactions');
  }
  return changed;
}

/** Spends tokens in the order monthly → free → paid. Returns the split, or null when there are not enough. */
function spendTokens(user, count, { movement, tripRef }) {
  const s = user.tokenState;
  const total = (s.monthly || 0) + (s.free || 0) + (s.paid || 0);
  if (total < count) return null;
  let left = count;
  const split = { monthly: 0, free: 0, paid: 0, period: s.monthlyPeriod };
  for (const k of ['monthly', 'free', 'paid']) {
    const take = Math.min(s[k] || 0, left);
    if (take > 0) {
      s[k] -= take;
      split[k] = take;
      left -= take;
    }
  }
  ['monthly', 'free', 'paid'].forEach((k) => {
    if (split[k] > 0) pushTx(user, { type: 'debit', amount: split[k], bucket: k, movement, tripRef });
  });
  user.tokens = (s.monthly || 0) + (s.free || 0) + (s.paid || 0);
  if (typeof user.markModified === 'function') {
    user.markModified('tokenState');
    user.markModified('tokenTransactions');
  }
  return split;
}

function refundSplit(user, split, { movement, tripRef }) {
  if (!split) return;
  const s = user.tokenState;
  ['monthly', 'free', 'paid'].forEach((k) => {
    const n = Number(split[k]) || 0;
    if (n > 0) {
      s[k] = (s[k] || 0) + n;
      pushTx(user, { type: 'credit', amount: n, bucket: k, movement, tripRef });
    }
  });
  user.tokens = (s.monthly || 0) + (s.free || 0) + (s.paid || 0);
  if (typeof user.markModified === 'function') {
    user.markModified('tokenState');
    user.markModified('tokenTransactions');
  }
}

const BUCKET_LABEL = { monthly: 'Monthly', free: 'Free (earned)', paid: 'Paid', none: '—' };

function tokenLedgerRows(user) {
  return (user.tokenTransactions || [])
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 200)
    .map((t) => {
      const sign = t.type === 'debit' ? -1 : 1;
      const bucket = t.bucket || (t.amount === 0 ? 'none' : 'paid');
      let type = BUCKET_LABEL[bucket] || '—';
      if (bucket === 'free' && !/completed/i.test(t.movement || '')) type = 'Free';
      return {
        id: t.id,
        at: t.createdAt,
        movement: t.movement || t.description || t.action || '',
        tripRef: t.tripRef || '',
        tokens: sign * (Number(t.amount) || 0),
        type
      };
    });
}

/* ───────────────────────── price estimate ───────────────────────── */

const DEFAULT_RATE_TABLE = [
  { key: 'light', label: 'Light jet', seats: '4–7', maxSeats: 7, cruiseKts: 400, hourly: [2600, 3600], feesPerLeg: [700, 1000] },
  { key: 'midsize', label: 'Midsize', seats: '7–8', maxSeats: 8, cruiseKts: 430, hourly: [3600, 4700], feesPerLeg: [1000, 1400] },
  { key: 'super-midsize', label: 'Super-midsize', seats: '8–9', maxSeats: 9, cruiseKts: 460, hourly: [4700, 6000], feesPerLeg: [1300, 1800] },
  { key: 'large', label: 'Heavy jet', seats: '10–14', maxSeats: 14, cruiseKts: 470, hourly: [7000, 9000], feesPerLeg: [2000, 2700] }
];

function haversineNm(a, b) {
  const R = 3440.065;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const hm = (hours) => {
  const total = Math.max(1, Math.round(hours * 60 / 5) * 5);
  return `${Math.floor(total / 60)} h ${String(total % 60).padStart(2, '0')}`;
};

/**
 * Ranges by category. Hourly rates × flying time, plus typical positioning, landing, handling
 * and waiting fees, plus the Curator margin and the company fee; December adds 10–20 %.
 */
function estimate({ from, to, pax, trip, date, marginPct = 8, feePct = 5, rateTable }) {
  const table = Array.isArray(rateTable) && rateTable.length ? rateTable : DEFAULT_RATE_TABLE;
  const nm = haversineNm(from, to) * 1.05; // airways are not straight lines
  const legs = trip === 'one_way' ? 1 : 2;
  const d = date ? new Date(date) : null;
  const december = d && !isNaN(d.getTime()) && d.getUTCMonth() === 11;
  const round = (n) => Math.round(n / 500) * 500;
  const rows = table
    .filter((c) => !pax || (Number(c.maxSeats) || 99) >= Number(pax))
    .map((c) => {
      const hours = nm / (Number(c.cruiseKts) || 420) + 0.25;
      const [hLow, hHigh] = c.hourly;
      const [fLow, fHigh] = c.feesPerLeg || [0, 0];
      const k = (1 + marginPct / 100) * (1 + feePct / 100);
      let low = (hLow * hours * legs + fLow * legs) * k;
      let high = (hHigh * hours * legs + fHigh * legs) * k;
      if (december) {
        low *= 1.1;
        high *= 1.2;
      }
      return {
        key: c.key,
        label: c.label,
        seats: c.seats,
        flyingTime: `≈ ${hm(hours)}`,
        low: Math.max(500, round(low)),
        high: Math.max(1000, round(high))
      };
    });
  return { nm: Math.round(nm), legs, december: Boolean(december), currency: 'USD', rows };
}

module.exports = {
  emailFilter,
  categoryKey,
  groupTrips,
  requestForGroup,
  cityRoute,
  icaoRoute,
  cityOf,
  liveLegs,
  paxOf,
  money,
  expiryOf,
  leftText,
  dayLabel,
  passengersOf,
  commissionOf,
  servicesText,
  parseBundles,
  tierOf,
  monthEnd,
  syncTokens,
  spendTokens,
  refundSplit,
  pushTx,
  tokenLedgerRows,
  estimate,
  DEFAULT_RATE_TABLE,
  pad3,
  differences,
  versionNumber,
  tripToken,
  versionOf,
  isBooked,
  firstDeparture,
  clientName,
  round2,
  DAY
};

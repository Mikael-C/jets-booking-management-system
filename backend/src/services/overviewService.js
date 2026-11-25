/**
 * Overview and Board data, built from live records (no demo data).
 *
 *  - Board cards: open Curator requests + the latest version of every quote / trip.
 *  - Needs action: generated from the same records (new requests, missing passports,
 *    payments due, expiring quotes, missing registration / flight no., weapon clearances,
 *    operators with documents pending, itinerary changes not yet sent in a brief).
 *  - Flights today / next 24 h: legs of booked trips, with Flight watch status when tracked.
 *  - Financial health: unpaid, overdue, received this month, company margin this month,
 *    Curator payouts due.
 */
const Booking = require('../models/Booking');
const AgentRequest = require('../models/AgentRequest');
const Contact = require('../models/Contact');
const FlightWatch = require('../models/FlightWatch');

const STAGES = ['request', 'sourcing', 'quoted', 'booked', 'confirmed', 'flown_close'];
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// ---------- small helpers ----------

const pad3 = (n) => String(n || 1).padStart(3, '0');

const symbol = (currency) => (currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'CHF' ? 'CHF' : '€');

const money = (amount, currency) =>
  `${symbol(currency)} ${Math.round(Number(amount) || 0).toLocaleString('en-GB')}`;

const shortDate = (d) => (d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }) : '');

const dayLabel = (d) =>
  d ? d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) : '';

const shortName = (name) => {
  const clean = String(name || '').replace(/\s*\(.*\)\s*$/, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return clean;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
};

/** "TRI-FE4578-005" / "booking-fe4578-v5" / "QUO-FE4578-002" → "FE4578" */
function tripToken(b) {
  const raw = String(b.tripId || b.tripNumber || b.quoteId || b.quoteReference || b.id || '');
  const m = raw.match(/([A-Z]{2}\d{3,6})/i);
  if (m) return m[1].toUpperCase();
  return raw.replace(/^(booking|trip|tri|quo)-/i, '').split('-')[0].toUpperCase();
}

/** Leg departure as a Date (times are local; treated as UTC for ordering, which is close enough for a dashboard). */
function legDate(leg, which = 'departure') {
  if (!leg || !leg.flightDate) return null;
  const rawTime = which === 'arrival' ? leg.arrivalTimeLocal : leg.departureTimeLocal || leg.departureTime;
  const t = String(rawTime || '00:00').match(/(\d{1,2})[:.h]?(\d{2})/);
  const hh = t ? t[1].padStart(2, '0') : '00';
  const mm = t ? t[2] : '00';
  const d = new Date(`${String(leg.flightDate).slice(0, 10)}T${hh}:${mm}:00Z`);
  if (isNaN(d.getTime())) return null;
  if (which === 'arrival' && leg.departureTimeLocal) {
    const dep = legDate(leg, 'departure');
    if (dep && d < dep) d.setTime(d.getTime() + DAY); // arrives after midnight
  }
  return d;
}

const activeLegs = (b) => (b.legs || []).filter((l) => !l.isCancelled);
const firstDeparture = (b) => legDate(activeLegs(b)[0]);
const lastDeparture = (b) => {
  const legs = activeLegs(b);
  return legDate(legs[legs.length - 1]);
};

function routeLabel(b) {
  const legs = activeLegs(b);
  if (legs.length === 0) return '—';
  const code = (a) => (a && (a.icao || a.code)) || '';
  const first = code(legs[0].origin);
  if (legs.length === 2 && code(legs[1].destination) === first && code(legs[1].origin) === code(legs[0].destination)) {
    return `${first} ⇄ ${code(legs[0].destination)}`;
  }
  return [first, ...legs.map((l) => code(l.destination))].filter(Boolean).join(' → ');
}

function urgencyFor(due, now) {
  const diff = due.getTime() - now.getTime();
  if (diff < 0) {
    const late = -diff;
    const text = late < HOUR ? `${Math.max(1, Math.round(late / MIN))} m late` : late < DAY ? `${Math.round(late / HOUR)} h late` : `${Math.round(late / DAY)} d late`;
    return { text, variant: 'rose' };
  }
  if (diff < HOUR) return { text: `in ${Math.max(1, Math.round(diff / MIN))} m`, variant: 'rose' };
  if (diff < 12 * HOUR) return { text: `in ${Math.round(diff / HOUR)} h`, variant: 'amber' };
  if (diff < DAY) return { text: `in ${Math.round(diff / HOUR)} h`, variant: 'amber' };
  return { text: `in ${Math.round(diff / DAY)} d`, variant: 'slate' };
}

const isPaid = (b) => ['fully_paid', 'paid'].includes(String(b.paymentStatus || '').toLowerCase());

function openBalance(b) {
  const total = Number(b.pricing?.totalFlightPrice) || 0;
  if (isPaid(b)) return 0;
  const received = Number(b.amountReceived) || 0;
  return Math.max(0, Math.round((total - received) * 100) / 100);
}

// ---------- stage logic ----------

function derivedBookingStage(b, now) {
  const s = String(b.status || '').toLowerCase();
  if (b.isCancelled || s === 'cancelled') return null;
  if (['completed', 'flown', 'closed'].includes(s)) return 'flown_close';
  const last = lastDeparture(b);
  const booked = Boolean(b.isBooked) || ['booked', 'paid', 'accepted', 'contract_signed', 'confirmed', 'dispatched', 'in_flight'].includes(s);
  if (booked && last && last.getTime() < now.getTime() - DAY) return 'flown_close';
  if (['confirmed', 'dispatched', 'in_flight'].includes(s)) return 'confirmed';
  if (booked) return 'booked';
  if (['in_sourcing', 'sourcing'].includes(s)) return 'sourcing';
  return 'quoted';
}

/** A stage moved by hand on the board holds until the record itself moves on. */
function effectiveStage(record, derived) {
  if (record.boardStage && STAGES.includes(record.boardStage) && record.boardStageBase === derived) return record.boardStage;
  return derived;
}

function derivedRequestStage(r) {
  const s = String(r.status || '').toLowerCase();
  if (r.isDeleted || ['completed', 'declined'].includes(s)) return null;
  if (['in_sourcing', 'processing'].includes(s)) return 'sourcing';
  return 'request';
}

/** Latest live version of each trip. */
function latestVersions(bookings) {
  const byTrip = new Map();
  bookings.forEach((b) => {
    if (b.isDeleted) return;
    const key = tripToken(b);
    const cur = byTrip.get(key);
    const ver = Number(b.quoteVersion) || 1;
    if (
      !cur ||
      ver > (Number(cur.quoteVersion) || 1) ||
      (ver === (Number(cur.quoteVersion) || 1) && new Date(b.updatedAt || 0) > new Date(cur.updatedAt || 0))
    ) {
      byTrip.set(key, b);
    }
  });
  return Array.from(byTrip.values()).filter((b) => !b.supersededBy);
}

// ---------- needs action ----------

function passengerHasDocument(pax, contactsById, contactsByName) {
  if (pax.passportNumber && String(pax.passportNumber).length >= 5) return true;
  const c =
    (pax.contactId && contactsById.get(String(pax.contactId))) ||
    contactsByName.get(String(pax.fullName || '').replace(/\s*\(lead\)\s*$/i, '').trim().toLowerCase());
  const num = c?.passportDetails?.passportNumber || c?.idDetails?.idNumber;
  return Boolean(num && String(num).length >= 5);
}

function actionsForTrip(b, stage, ctx) {
  const { now, userEmail, contactsById, contactsByName } = ctx;
  const items = [];
  const token = tripToken(b);
  const ver = pad3(b.quoteVersion);
  const isQuote = stage === 'quoted' || stage === 'sourcing';
  const code = isQuote ? `QUO - ${token}-${ver}` : `TRI - ${token}`;
  const dep = firstDeparture(b);
  const isMine = Boolean(userEmail && (b.createdByEmail === userEmail || b.assignedToEmail === userEmail));
  const curator = b.agentName ? shortName(b.agentName) : 'Desk';
  const base = { code, isMine, curator, tripToken: token };
  const upcoming = dep && dep.getTime() > now.getTime() - 6 * HOUR;
  const push = (key, due, title, linkText, tab, category, shortBadge) => {
    const u = urgencyFor(due, now);
    items.push({
      ...base,
      id: `na-${token}-${key}`,
      urgency: u.text,
      badgeVariant: u.variant,
      title,
      linkText,
      linkUrl: `/trips/${token}/${tab}`,
      category,
      dueAt: due.toISOString(),
      shortBadge
    });
  };

  // Tasks written on the trip when the agreement is signed (R-093), until they are done
  (Array.isArray(b.overviewTasks) ? b.overviewTasks : [])
    .filter((t) => t && !t.doneAt && t.key && t.title)
    .forEach((t) => {
      const due = t.dueAt ? new Date(t.dueAt) : now;
      push(`task-${t.key}`, isNaN(due.getTime()) ? now : due, `${t.title} · ${code}`, t.linkText || 'Open →', t.tab || 'overview', t.category || 'booking', t.shortBadge || t.title.toLowerCase());
    });

  if (isQuote) {
    // A wet-signed agreement waits for the MD to confirm it
    const wet = b.wetSignature || {};
    if (wet.uploadedAt && !wet.confirmedAt) {
      push('wet-signed', now, `Wet-signed agreement to confirm · ${code}`, 'Documents →', 'documents', 'quote', 'signed copy to confirm');
    }
    const exp = b.quoteExpirationDate ? new Date(b.quoteExpirationDate) : null;
    if (exp && !isNaN(exp.getTime()) && exp.getTime() - now.getTime() < 2 * DAY) {
      push('quote-exp', exp, `Quote expires · ${code}`, 'Quote →', 'pricing', 'quote', `expires ${urgencyFor(exp, now).text.replace(/^in /, '')}`);
    }
    if (b.operatorPendingApproval) {
      const due = dep ? new Date(dep.getTime() - 3 * DAY) : now;
      push('op-pending', due, `Operator documents pending · ${code}`, 'Sourcing →', 'sourcing', 'operator', 'operator pending');
    }
    return items;
  }

  if (stage === 'flown_close') return items;

  // Payment due 48 h before the flight
  const open = openBalance(b);
  if (open > 0 && dep) {
    const due = new Date(dep.getTime() - 2 * DAY);
    push('payment', due, `${money(open, b.pricing?.currency)} due before flight · ${code}`, 'Payments →', 'accounting', 'payments', `${money(open, b.pricing?.currency)} open`);
  }

  if (!upcoming) return items;

  // Passports
  const firstLeg = activeLegs(b)[0];
  const missing = (firstLeg?.passengers || []).filter((p) => !passengerHasDocument(p, contactsById, contactsByName)).length;
  if (missing > 0) {
    push('passports', new Date(dep.getTime() - DAY), `${missing} passport${missing === 1 ? '' : 's'} missing · ${code}`, 'Passengers →', 'passengers', 'passengers', `${missing} passport${missing === 1 ? '' : 's'} missing`);
  }

  // Registration / flight number
  const legsMissing = activeLegs(b).filter((l) => !l.aircraftRegistration || !l.flightNumber);
  if (legsMissing.length > 0 && dep.getTime() - now.getTime() < 3 * DAY) {
    push('reg', new Date(dep.getTime() - DAY), `Registration or flight no. missing · ${code}`, 'Itinerary →', 'itinerary', 'itinerary', 'reg / flight no. missing');
  }

  // Weapons on board
  const weaponPending = activeLegs(b).some((l) => l.weapons && l.weapons.onBoard && (l.weapons.clearances || []).some((c) => c.status !== 'cleared'));
  if (weaponPending) {
    push('weapons', new Date(dep.getTime() - DAY), `Weapon clearance pending · ${code}`, 'Passengers →', 'passengers', 'passengers', 'weapon clearance pending');
  }

  // Operator still has documents pending
  if (b.operatorPendingApproval) {
    push('op-pending', new Date(dep.getTime() - 3 * DAY), `Operator documents pending · ${code}`, 'Sourcing →', 'sourcing', 'operator', 'operator pending');
  }

  // Itinerary changed after the last brief
  if (b.lastBriefIssuedAt) {
    const since = new Date(b.lastBriefIssuedAt).getTime();
    const changed = (b.itineraryActivity || []).some((a) => a.group !== 'brief' && new Date(a.at).getTime() > since);
    if (changed) {
      push('brief', new Date(dep.getTime() - 12 * HOUR), `Changes not yet sent in a brief · ${code}`, 'Itinerary →', 'itinerary', 'itinerary', 'brief update not sent');
    }
  }

  return items;
}

function actionsForRequest(r, ctx) {
  const { now, userEmail } = ctx;
  const num = String(r.requestNumber || r.id || r._id).replace(/^REQ-?/i, '');
  const code = `REQ - ${num}`;
  const due = new Date(new Date(r.createdAt || now).getTime() + 30 * MIN); // 30 min to start sourcing
  const u = urgencyFor(due, now);
  const waiting = Math.max(0, Math.round((now.getTime() - new Date(r.createdAt || now).getTime()) / MIN));
  return [
    {
      id: `na-req-${num}`,
      urgency: due < now ? u.text : 'new',
      badgeVariant: due < now ? 'rose' : 'blue',
      title: `New request, start sourcing · ${code}`,
      code,
      linkText: 'Request →',
      linkUrl: `/requests/${r.id || r._id}`,
      isMine: Boolean(userEmail && r.assignedToEmail === userEmail),
      category: 'request',
      curator: shortName(r.agentName) || 'Curator',
      dueAt: due.toISOString(),
      shortBadge: waiting >= 60 ? `waiting ${Math.round(waiting / 60)} h` : `waiting ${waiting} m`
    }
  ];
}

// ---------- main ----------

async function buildOverview({ userEmail } = {}) {
  const now = new Date();
  const [bookings, requests] = await Promise.all([
    Booking.find({ isDeleted: { $ne: true } }).select('-signedDocuments -signOtp -wetSignature.file -contractSignature.signatureImage').sort({ updatedAt: -1 }).limit(2000).lean(),
    AgentRequest.find({ isDeleted: { $ne: true }, status: { $in: ['pending', 'in_sourcing', 'processing'] } })
      .sort({ createdAt: 1 })
      .limit(500)
      .lean()
  ]);

  const trips = latestVersions(bookings);

  // Contacts referenced on manifests (documents follow the contact)
  const contactIds = new Set();
  const contactNames = new Set();
  trips.forEach((b) =>
    (activeLegs(b)[0]?.passengers || []).forEach((p) => {
      if (p.contactId) contactIds.add(String(p.contactId));
      if (p.fullName) contactNames.add(String(p.fullName).replace(/\s*\(lead\)\s*$/i, '').trim());
    })
  );
  const contacts = contactIds.size || contactNames.size
    ? await Contact.find({
        isDeleted: { $ne: true },
        $or: [{ id: { $in: Array.from(contactIds) } }, { fullName: { $in: Array.from(contactNames) } }]
      })
        .select('id fullName firstName lastName1 passportDetails idDetails')
        .lean()
        .catch(() => [])
    : [];
  const contactsById = new Map(contacts.map((c) => [String(c.id || c._id), c]));
  const contactsByName = new Map(
    contacts.map((c) => [String(c.fullName || `${c.firstName || ''} ${c.lastName1 || ''}`).trim().toLowerCase(), c])
  );
  const ctx = { now, userEmail, contactsById, contactsByName };

  // ----- board cards + needs action -----
  const cards = [];
  const needsAction = [];

  requests.forEach((r, i) => {
    const derived = derivedRequestStage(r);
    if (!derived) return;
    const stage = effectiveStage(r, derived);
    const items = actionsForRequest(r, ctx);
    needsAction.push(...items);
    const date = r.flightDate ? new Date(`${String(r.flightDate).slice(0, 10)}T00:00:00Z`) : null;
    const validDate = date && !isNaN(date.getTime()) ? date : null;
    const num = String(r.requestNumber || r.id || r._id).replace(/^REQ-?/i, '');
    cards.push({
      id: `req:${r._id}`,
      code: `REQ - ${num}`,
      route: `${r.originIcao || ''}${r.tripType === 'round_trip' ? ' ⇄ ' : ' → '}${r.destIcao || ''}`,
      details: [validDate ? shortDate(validDate) : r.flightDate, r.aircraftCategory && r.aircraftCategory !== 'any' ? r.aircraftCategory : '', shortName(r.agentName)]
        .filter(Boolean)
        .join(' · '),
      badge: items[0]?.shortBadge || null,
      badgeVariant: items[0] ? (items[0].badgeVariant === 'blue' ? 'sky' : items[0].badgeVariant) : null,
      stage,
      curator: shortName(r.agentName) || 'Curator',
      isMine: items[0]?.isMine || false,
      needsAction: true,
      departingIn7Days: Boolean(validDate && validDate.getTime() - now.getTime() < 7 * DAY && validDate.getTime() > now.getTime() - DAY),
      linkUrl: `/requests/${r.id || r._id}`,
      order: i + 1
    });
  });

  trips.forEach((b) => {
    const derived = derivedBookingStage(b, now);
    if (!derived) return;
    const stage = effectiveStage(b, derived);
    const items = actionsForTrip(b, stage, ctx);
    needsAction.push(...items);
    const token = tripToken(b);
    const dep = firstDeparture(b);
    const currency = b.pricing?.currency;
    const total = Number(b.pricing?.totalFlightPrice) || 0;
    let details;
    if (stage === 'quoted' || stage === 'sourcing') {
      details = [shortDate(dep), total ? money(total, currency) : '', shortName(b.agentName)].filter(Boolean).join(' · ');
    } else if (stage === 'flown_close') {
      const payout = Number(b.pricing?.agentCommission || b.pricing?.agentMargin) || 0;
      details = [shortDate(dep), payout && dep ? `payout ${shortDate(new Date(dep.getTime() + 7 * DAY))}` : 'closed'].filter(Boolean).join(' · ');
    } else {
      const open = openBalance(b);
      details = [shortDate(dep), open > 0 ? `${money(open, currency)} open` : 'paid'].filter(Boolean).join(' · ');
    }
    const top = items.slice().sort((x, y) => new Date(x.dueAt) - new Date(y.dueAt))[0];
    const isQuote = stage === 'quoted' || stage === 'sourcing';
    const tab = top ? top.linkUrl.split('/').pop() : isQuote ? 'pricing' : 'itinerary';
    cards.push({
      id: `bk:${b._id}`,
      code: isQuote ? `QUO - ${token}-${pad3(b.quoteVersion)}` : `TRI - ${token}-${pad3(b.quoteVersion)}`,
      route: routeLabel(b),
      details,
      badge: top ? top.shortBadge : null,
      badgeVariant: top ? (top.badgeVariant === 'slate' ? 'amber' : top.badgeVariant) : null,
      stage,
      curator: b.agentName ? shortName(b.agentName) : 'Desk',
      isMine: Boolean(userEmail && (b.createdByEmail === userEmail || b.assignedToEmail === userEmail)),
      needsAction: items.length > 0,
      departingIn7Days: Boolean(dep && dep.getTime() - now.getTime() < 7 * DAY && dep.getTime() > now.getTime() - DAY),
      linkUrl: `/trips/${token}/${tab}`,
      order: dep ? dep.getTime() : Number.MAX_SAFE_INTEGER
    });
  });

  needsAction.sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  cards.sort((a, b) => STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage) || a.order - b.order);

  // ----- flights today and next 24 h -----
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const horizon = new Date(now.getTime() + DAY);
  const flightTrips = trips.filter((b) => ['booked', 'confirmed'].includes(derivedBookingStage(b, now)));
  const tripNumbers = flightTrips.map((b) => b.tripNumber).filter(Boolean);
  const watches = tripNumbers.length
    ? await FlightWatch.find({ tripNumber: { $in: tripNumbers.concat(tripNumbers.map((t) => t.replace(/^TRI-/i, ''))) } })
        .lean()
        .catch(() => [])
    : [];
  const watchFor = (b) => watches.find((w) => w.tripNumber === b.tripNumber || `TRI-${w.tripNumber}` === b.tripNumber || w.bookingId === b.id);

  const flights = [];
  flightTrips.forEach((b) => {
    const legs = activeLegs(b);
    legs.forEach((leg, idx) => {
      const dep = legDate(leg);
      if (!dep || dep < startOfToday || dep > horizon) return;
      const arr = legDate(leg, 'arrival');
      const token = tripToken(b);
      const isToday = dep.getUTCDate() === now.getUTCDate() && dep.getUTCMonth() === now.getUTCMonth();
      const watch = idx === 0 ? watchFor(b) : null;
      let status = 'scheduled';
      let badgeText = 'Scheduled';
      let badgeVariant = 'slate';
      if (watch && watch.status && watch.status !== 'scheduled') {
        status = watch.status;
        badgeText = watch.statusLabel || watch.status;
        badgeVariant = watch.status === 'landed' ? 'green' : /delayed/.test(watch.status) ? 'rose' : 'slate';
      } else if (arr && arr < now) {
        status = 'arrived';
        badgeText = `Arrived · ${leg.arrivalTimeLocal || ''}`.trim();
        badgeVariant = 'green';
      } else if (dep < now) {
        status = 'airborne';
        badgeText = `Departed · ETA ${leg.arrivalTimeLocal || '—'}`;
        badgeVariant = 'slate';
      } else if (leg.openingHoursOverride) {
        status = 'fbo_overridden';
        badgeText = 'After hours · overridden';
        badgeVariant = 'amber';
      } else if (!leg.aircraftRegistration || !leg.flightNumber) {
        status = 'missing_details';
        badgeText = 'Reg / flight no. missing';
        badgeVariant = 'amber';
      } else if (b.lastBriefIssuedAt) {
        status = 'brief_sent';
        badgeText = 'Brief sent';
        badgeVariant = 'green';
      } else {
        status = 'brief_due';
        badgeText = 'Brief not sent';
        badgeVariant = 'amber';
      }
      const code = (a) => (a && (a.icao || a.code)) || '—';
      flights.push({
        id: `fl-${b._id}-${idx}`,
        time: String(leg.departureTimeLocal || '').slice(0, 5),
        code: `TRI - ${token}`,
        route: `${code(leg.origin)} → ${code(leg.destination)}`,
        leg: legs.length > 1 ? `leg ${idx + 1}` : '',
        aircraft: leg.aircraftType || b.aircraft?.name || '',
        status,
        badgeText,
        badgeVariant,
        tripId: token,
        dateGroup: isToday ? 'today' : 'next_24h',
        dateLabel: isToday ? dayLabel(dep) : `${dayLabel(dep)} · next 24 h`,
        sortAt: dep.getTime()
      });
    });
  });
  flights.sort((a, b) => a.sortAt - b.sortAt);

  // ----- financial health -----
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const monthShort = monthStart.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  const monthLong = monthStart.toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' }).toUpperCase();
  const bookedTrips = trips.filter((b) => ['booked', 'confirmed', 'flown_close'].includes(derivedBookingStage(b, now)));

  const unpaidTrips = bookedTrips.filter((b) => openBalance(b) > 0);
  const overdueTrips = unpaidTrips.filter((b) => {
    if (String(b.paymentStatus).toLowerCase() === 'overdue') return true;
    const dep = firstDeparture(b);
    return dep && dep.getTime() - 2 * DAY < now.getTime();
  });
  const sum = (list, fn) => Math.round(list.reduce((s, x) => s + (Number(fn(x)) || 0), 0) * 100) / 100;

  const paidIn = (b, from, to) => {
    if (!isPaid(b)) return false;
    const at = new Date(b.paidAt || b.updatedAt || 0);
    return at >= from && at < to;
  };
  const receivedNow = sum(bookedTrips.filter((b) => paidIn(b, monthStart, new Date(8640000000000000))), (b) => b.pricing?.totalFlightPrice);
  const receivedPrev = sum(bookedTrips.filter((b) => paidIn(b, prevMonthStart, monthStart)), (b) => b.pricing?.totalFlightPrice);
  const comparePct = receivedPrev > 0 ? Math.round(((receivedNow - receivedPrev) / receivedPrev) * 100) : null;
  const prevShort = prevMonthStart.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });

  const bookedThisMonth = bookedTrips.filter((b) => new Date(b.createdAt || 0) >= monthStart);
  const marginNow = sum(bookedThisMonth, (b) => b.pricing?.companyMargin);
  const costNow = sum(bookedThisMonth, (b) => b.pricing?.operatorCost || b.pricing?.flightPrice);
  const avgMarginPct = costNow > 0 ? Math.round((marginNow / costNow) * 1000) / 10 : 0;

  const payoutTrips = trips.filter(
    (b) => derivedBookingStage(b, now) === 'flown_close' && !b.curatorPayoutPaid && Number(b.pricing?.agentCommission || b.pricing?.agentMargin) > 0
  );
  const payoutCurators = new Set(payoutTrips.map((b) => b.agentName || b.agentEmail || 'Curator'));
  const nextPayout = payoutTrips
    .map((b) => lastDeparture(b))
    .filter(Boolean)
    .map((d) => new Date(d.getTime() + 7 * DAY))
    .sort((a, b) => a - b)[0];

  const financialHealth = {
    monthLabel: monthLong,
    unpaid: {
      amount: sum(unpaidTrips, openBalance),
      count: unpaidTrips.length,
      label: `${unpaidTrips.length} invoice${unpaidTrips.length === 1 ? '' : 's'}`,
      link: '/payments?filter=unpaid'
    },
    overdue: {
      amount: sum(overdueTrips, openBalance),
      count: overdueTrips.length,
      label: `${overdueTrips.length} · due 48 h before flight`,
      link: '/payments?filter=overdue'
    },
    received: {
      amount: receivedNow,
      month: monthShort,
      comparePct,
      compareText: comparePct === null ? `nothing received in ${prevShort}` : `${comparePct >= 0 ? '+' : ''}${comparePct} % vs ${prevShort}`,
      link: '/payments'
    },
    companyMargin: {
      amount: marginNow,
      month: monthShort,
      avgMarginPct,
      compareText: `average ${avgMarginPct} %`,
      link: '/payments'
    },
    curatorPayoutsDue: {
      amount: sum(payoutTrips, (b) => b.pricing?.agentCommission || b.pricing?.agentMargin),
      count: payoutCurators.size,
      label: payoutTrips.length
        ? `${payoutCurators.size} Curator${payoutCurators.size === 1 ? '' : 's'}${nextPayout ? ` · next ${shortDate(nextPayout)}` : ''}`
        : 'none due',
      link: '/curators'
    }
  };

  const tripsByStage = {
    request: cards.filter((c) => c.stage === 'request').length,
    sourcing: cards.filter((c) => c.stage === 'sourcing').length,
    quoted: cards.filter((c) => c.stage === 'quoted').length,
    booked: cards.filter((c) => c.stage === 'booked').length,
    confirmed: cards.filter((c) => c.stage === 'confirmed').length,
    flownClose: cards.filter((c) => c.stage === 'flown_close').length
  };

  return { financialHealth, flights, needsAction: needsAction.slice(0, 50), cards, tripsByStage, generatedAt: now.toISOString() };
}

function boardColumns(cards) {
  const titles = {
    request: 'REQUEST',
    sourcing: 'SOURCING',
    quoted: 'QUOTED',
    booked: 'BOOKED',
    confirmed: 'CONFIRMED',
    flown_close: 'FLOWN · CLOSE'
  };
  return STAGES.map((id) => {
    const list = cards.filter((c) => c.stage === id);
    return { id, title: titles[id], count: list.length, cards: list };
  });
}

/** Moves a card on the board. Returns the updated record summary or null. */
async function moveCard(cardId, stage, user) {
  if (!STAGES.includes(stage)) throw Object.assign(new Error(`Invalid stage: ${stage}`), { status: 400 });
  const now = new Date();
  const [kind, id] = String(cardId).split(':');
  if (kind === 'req') {
    const r = await AgentRequest.findById(id);
    if (!r) return null;
    const derived = derivedRequestStage(r);
    r.boardStage = stage === derived ? '' : stage;
    r.boardStageBase = stage === derived ? '' : derived || '';
    // Moving a request to Sourcing on the board also starts sourcing on the request
    if (stage === 'sourcing' && r.status === 'pending') {
      r.status = 'in_sourcing';
      r.boardStage = '';
      r.boardStageBase = '';
    }
    await r.save();
    return { kind: 'request', id: r._id, stage };
  }
  if (kind === 'bk') {
    const b = await Booking.findById(id);
    if (!b) return null;
    const derived = derivedBookingStage(b.toObject(), now);
    b.boardStage = stage === derived ? '' : stage;
    b.boardStageBase = stage === derived ? '' : derived || '';
    b.boardStageMovedBy = user?.email || '';
    b.boardStageMovedAt = now;
    await b.save();
    return { kind: 'booking', id: b._id, stage };
  }
  return null;
}

module.exports = { buildOverview, boardColumns, moveCard, STAGES };

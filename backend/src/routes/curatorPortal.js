/**
 * Curator portal (mounted at /api/curator, signed-in users). Every answer is built from the
 * signed-in Curator's own requests, quotes, trips, clients and token ledger; nothing else is visible.
 *
 *   GET  /me                          name and token balance (top bar)
 *   GET  /requests                    My requests and quotes
 *   POST /requests                    New request (spends 1 token per leg)
 *   POST /requests/:id/messages       Message the desk about a request
 *   GET  /quotes/:id                  Quote view
 *   POST /quotes/:id/confirm          Client agrees · confirm
 *   POST /quotes/:id/change           Ask for a change (2 free per request before signature)
 *   GET  /trips                       My trips
 *   GET  /trips/:id                   One trip: payment, passengers, documents, commission
 *   POST /trips/:id/proof             Client paid: upload the transfer proof
 *   POST /trips/:id/passports         Send passport details
 *   GET  /clients  POST /clients  POST /clients/:id/link
 *   GET  /documents                   Shared documents and every document the desk produced
 *   GET  /documents/library/:code     One shared document, to print as PDF
 *   POST /documents/library/:code/acknowledge
 *   POST /agreement/sign
 *   GET  /tokens  POST /tokens/buy  POST /tokens/purchases/:id/check
 *   GET  /estimate                    Price estimate by category
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const Booking = require('../models/Booking');
const AgentRequest = require('../models/AgentRequest');
const User = require('../models/User');
const Client = require('../models/Client');
const Contact = require('../models/Contact');
const { PolicyDocument } = require('../models/PolicyDocument');
const { getConfig } = require('./curatorTiers');
const library = require('./library');
const { ensureLedger, computeLedger } = require('../services/ledgerService');
const { getNextFeSequence } = require('../services/bookingIdentifiers');
const { createAuditEntry } = require('../services/auditService');
const airports = require('../utils/airportData');
const P = require('../services/curatorPortalService');

const audit = (req, action, entityType, entityId, details) =>
  createAuditEntry({ user: req.user, action, entityType, entityId: String(entityId || ''), details, req }).catch(() => {});

const myEmail = (req) => String((req.user && req.user.email) || '').toLowerCase();

async function loadMine(req) {
  const email = myEmail(req);
  const [requests, bookings] = await Promise.all([
    AgentRequest.find({ agentEmail: P.emailFilter(email), isDeleted: { $ne: true } }).sort({ createdAt: -1 }).lean(),
    Booking.find({ agentEmail: P.emailFilter(email), isDeleted: { $ne: true } }).sort({ createdAt: -1 }).lean()
  ]);
  return { requests, bookings, groups: P.groupTrips(bookings) };
}

/** Writes a note into the request thread so the desk sees it on the Requests page. */
async function tellDesk(req, requestLean, text) {
  if (!requestLean) return;
  try {
    await AgentRequest.updateOne(
      { _id: requestLean._id },
      {
        $push: {
          messages: {
            id: crypto.randomUUID(),
            sender: req.user.name || req.user.email,
            senderRole: 'agent',
            senderEmail: req.user.email,
            message: text,
            timestamp: new Date()
          }
        }
      }
    );
  } catch {
    // the action itself is saved; the note is a courtesy
  }
}

const matchesId = (b, id) => {
  const s = String(id || '');
  return [b.id, String(b._id), b.quoteId, b.tripNumber, b.bookingRevisionId].filter(Boolean).map(String).includes(s);
};

function findGroup(groups, id) {
  const raw = String(id || '').trim();
  const token = (raw.match(/([A-Z]{2}\d{3,6})/i) || [])[1];
  const byVersion = groups.find((g) => g.versions.some((v) => matchesId(v, raw)));
  if (byVersion) return byVersion;
  return token ? groups.find((g) => g.token === token.toUpperCase()) || null : null;
}

const docRef = (prefix, token, version) => ({ prefix, token, suffix: version ? `-${version}` : '' });

/* ─────────────────────────── top bar ─────────────────────────── */

router.get('/me', async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const config = await getConfig();
  const { requests, bookings } = await loadMine(req);
  if (P.syncTokens(user, config, { requests, bookings })) await user.save();
  res.json({ success: true, data: { name: user.name, email: user.email, tokens: user.tokens || 0, tier: P.tierOf(user, config).tier } });
});

/* ─────────────────────────── requests ─────────────────────────── */

function requestRows(requests, groups) {
  const now = Date.now();
  const rows = [];
  const groupsByRequest = new Map();
  const orphanGroups = [];
  groups.forEach((g) => {
    const r = P.requestForGroup(g, requests);
    if (r) {
      const k = String(r._id);
      if (!groupsByRequest.has(k)) groupsByRequest.set(k, []);
      groupsByRequest.get(k).push(g);
    } else orphanGroups.push(g);
  });

  const groupRow = (g, r) => {
    if (g.booked) {
      const b = g.booked;
      const p = b.pricing || {};
      return {
        id: `trip-${g.token}`,
        kind: 'trip',
        ref: docRef('TRI', g.token, ''),
        client: P.clientName(b),
        route: P.icaoRoute(b),
        flight: P.dayLabel(P.firstDeparture(b)),
        flightAt: P.firstDeparture(b),
        status: 'confirmed',
        statusLabel: String(b.status) === 'cancelled' || b.isCancelled ? 'Cancelled' : ['completed', 'flown'].includes(String(b.status)) ? 'Flown' : 'Booked',
        clientPrice: P.round2(p.totalFlightPrice),
        currency: p.currency || 'EUR',
        expires: null,
        action: { label: 'Open trip', href: `/agent/trips/${g.token}` },
        createdAt: b.createdAt,
        requestId: r ? r.requestNumber || r.id : null
      };
    }
    const q = g.latest;
    const p = q.pricing || {};
    const exp = P.expiryOf(q);
    const confirmed = Boolean(q.clientConfirmedAt);
    const expired = !confirmed && ((exp && exp.getTime() < now) || (q.isCancelled && !g.versions.some((v) => !v.isCancelled)));
    return {
      id: `quote-${q._id}`,
      kind: 'quote',
      ref: docRef('QUO', g.token, P.versionOf(q)),
      client: P.clientName(q),
      route: P.icaoRoute(q),
      flight: P.dayLabel(P.firstDeparture(q)),
      flightAt: P.firstDeparture(q),
      status: confirmed ? 'confirmed' : expired ? 'expired' : 'quoted',
      statusLabel: confirmed ? 'Client confirmed' : expired ? 'Expired' : exp ? `Quoted · expires ${P.leftText(exp.getTime() - now)}` : 'Quoted',
      clientPrice: P.round2(p.totalFlightPrice),
      currency: p.currency || 'EUR',
      expires: confirmed || expired || !exp ? null : P.leftText(exp.getTime() - now),
      action: { label: 'View quote', href: `/agent/quotes/${q.id || q._id}` },
      createdAt: q.createdAt,
      requestId: r ? r.requestNumber || r.id : null
    };
  };

  requests.forEach((r) => {
    const gs = groupsByRequest.get(String(r._id)) || [];
    const token = P.tripToken(r);
    const firstDate = r.flightDate ? new Date(String(r.flightDate).length === 10 ? `${r.flightDate}T12:00:00Z` : r.flightDate) : null;
    const base = {
      id: `req-${r._id}`,
      kind: 'request',
      ref: docRef('REQ', token, ''),
      client: r.companyName || r.clientName || '—',
      route: r.tripType === 'round_trip' ? `${r.originIcao} → ${r.destIcao}` : r.route || `${r.originIcao} → ${r.destIcao}`,
      flight: P.dayLabel(firstDate),
      flightAt: firstDate,
      clientPrice: null,
      currency: 'EUR',
      expires: null,
      createdAt: r.createdAt,
      requestId: r.requestNumber || r.id
    };
    if (gs.length === 0) {
      if (r.status === 'declined') {
        rows.push({ ...base, status: 'expired', statusLabel: 'Declined · no aircraft', action: null });
      } else {
        rows.push({ ...base, status: 'waiting', statusLabel: 'Waiting for quote', action: { label: 'Message desk', message: true } });
      }
      return;
    }
    gs.forEach((g) => rows.push(groupRow(g, r)));
    const open = gs.find((g) => !g.booked);
    if (open && !gs.some((g) => g.booked)) {
      rows.push({ ...base, status: 'quoted', statusLabel: 'Quoted', statusRef: docRef('QUO', open.token, ''), action: null });
    }
  });
  orphanGroups.forEach((g) => rows.push(groupRow(g, null)));
  rows.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return rows;
}

router.get('/requests', async (req, res) => {
  const { requests, groups } = await loadMine(req);
  const rows = requestRows(requests, groups);
  const counts = {
    all: rows.length,
    waiting: rows.filter((r) => r.status === 'waiting').length,
    quoted: rows.filter((r) => r.status === 'quoted').length,
    confirmed: rows.filter((r) => r.status === 'confirmed').length,
    expired: rows.filter((r) => r.status === 'expired').length
  };
  res.json({ success: true, data: { rows, counts } });
});

router.post('/requests/:id/messages', async (req, res) => {
  const text = String((req.body && req.body.message) || '').trim();
  if (!text) return res.status(400).json({ success: false, message: 'Write a message first.' });
  const id = String(req.params.id);
  const request = await AgentRequest.findOne({
    agentEmail: P.emailFilter(myEmail(req)),
    $or: [{ id }, { requestNumber: id }, ...(/^[a-f0-9]{24}$/i.test(id) ? [{ _id: id }] : [])]
  });
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
  request.messages.push({
    id: crypto.randomUUID(),
    sender: req.user.name || req.user.email,
    senderRole: 'agent',
    senderEmail: req.user.email,
    message: text.slice(0, 4000),
    timestamp: new Date()
  });
  await request.save();
  res.status(201).json({ success: true });
});

const CATEGORY_LABELS = { light: 'Light', midsize: 'Midsize', 'super-midsize': 'Super midsize', large: 'Heavy', 'ultra-long-range': 'Ultra long range' };

router.post('/requests', async (req, res) => {
  const body = req.body || {};
  const legs = (Array.isArray(body.legs) ? body.legs : [])
    .map((l) => ({
      originIcao: String(l.from || l.originIcao || '').toUpperCase().trim(),
      destIcao: String(l.to || l.destIcao || '').toUpperCase().trim(),
      flightDate: String(l.date || l.flightDate || '').slice(0, 10),
      departureTime: String(l.time || l.departureTime || ''),
      flexibility: String(l.flex || ''),
      paxCount: Number(l.pax) || Number(body.passengers) || 1
    }))
    .filter((l) => l.originIcao && l.destIcao);
  if (!legs.length) return res.status(400).json({ success: false, message: 'Add at least one leg with a departure and a destination.' });
  if (legs.some((l) => !l.flightDate)) return res.status(400).json({ success: false, message: 'Every leg needs a date.' });
  const pax = Number(body.passengers) || legs[0].paxCount;
  if (!(pax >= 1)) return res.status(400).json({ success: false, message: 'Add the number of passengers.' });

  // The client must be one of this Curator's clients
  const email = myEmail(req);
  let client = null;
  if (body.clientId && /^[a-f0-9]{24}$/i.test(String(body.clientId))) client = await Client.findById(body.clientId).lean();
  if (!client) return res.status(400).json({ success: false, message: 'Pick the client first.' });
  const tripType = ['one_way', 'round_trip', 'multi_leg'].includes(body.tripType) ? body.tripType : legs.length === 1 ? 'one_way' : legs.length === 2 && legs[0].originIcao === legs[1].destIcao ? 'round_trip' : 'multi_leg';
  const tokenCost = legs.length;

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const config = await getConfig();
  const mine = await loadMine(req);
  P.syncTokens(user, config, mine);

  const token = await getNextFeSequence();
  const requestNumber = `REQ-${token}`;
  const split = P.spendTokens(user, tokenCost, { movement: `Quote request · ${tokenCost} leg${tokenCost === 1 ? '' : 's'}`, tripRef: `QUO-${token}-001` });
  if (!split) {
    await user.save();
    return res.status(402).json({
      success: false,
      code: 'INSUFFICIENT_TOKENS',
      message: `This request needs ${tokenCost} token${tokenCost === 1 ? '' : 's'} (1 per leg). You have ${user.tokens}.`,
      balance: user.tokens
    });
  }

  const legAircraft = (Array.isArray(body.legAircraft) ? body.legAircraft : []).map((a, i) => ({
    leg: i + 1,
    category: P.categoryKey(a.category),
    categoryLabel: CATEGORY_LABELS[P.categoryKey(a.category)] || a.category || '',
    model: String(a.model || ''),
    why: String(a.why || '')
  }));
  const firstAircraft = legAircraft[0] || {};
  const pets = (Array.isArray(body.pets) ? body.pets : [])
    .filter((p) => p && (p.species || p.breed || p.name))
    .map((p) => ({
      name: String(p.name || ''),
      species: String(p.species || ''),
      petType: String(p.species || ''),
      breed: String(p.breed || ''),
      weightKg: Number(p.weightKg) || 0,
      travels: String(p.travels || '')
    }));
  const hasPets = Boolean(body.hasPets) && pets.length > 0;
  const ground = body.ground && body.ground.enabled ? body.ground : null;
  const heli = body.helicopter && body.helicopter.enabled ? body.helicopter : null;
  const legLabel = (i) => `Leg ${i + 1}`;
  const groundLegs = ground ? (ground.legs || []).filter((g) => g && g.selected) : [];
  const heliLegs = heli ? (heli.legs || []).filter((h) => h && h.selected) : [];
  const firstGround = groundLegs[0] || {};
  const firstHeli = heliLegs[0] || {};
  const route =
    tripType === 'round_trip'
      ? `${legs[0].originIcao} ⇄ ${legs[0].destIcao}`
      : [legs[0].originIcao, ...legs.map((l) => l.destIcao)].join(' → ');
  const suitcases = Number(body.suitcases) || 0;
  const oversize = String(body.oversizeItems || '').trim();
  const clientLabel = client.companyName || client.fullName;

  try {
    const request = await AgentRequest.create({
      id: requestNumber,
      requestNumber,
      tripId: `TRI-${token}`,
      quoteGroupId: `QUO-${token}`,
      type: 'quote',
      title: `Charter request: ${route} (${clientLabel})`,
      agentName: req.user.name,
      agentEmail: req.user.email,
      status: 'pending',
      clientId: String(client._id),
      clientName: client.authorisedPersonName || client.fullName,
      clientEmail: client.email,
      clientPhone: client.whatsapp || client.phone || '',
      companyName: client.clientType === 'person' ? '' : client.companyName || '',
      assistantName: client.assistantName || '',
      assistantEmail: client.assistantEmail || '',
      documentsTo: client.documentsTo || 'owner',
      route,
      tripType,
      originIcao: legs[0].originIcao,
      destIcao: legs[0].destIcao,
      flightDate: legs[0].flightDate,
      departureTime: legs[0].departureTime,
      isFlexibleTime: Boolean(legs[0].flexibility && legs[0].flexibility !== 'Fixed'),
      returnDate: tripType === 'round_trip' && legs[1] ? legs[1].flightDate : '',
      returnFlightDate: tripType === 'round_trip' && legs[1] ? legs[1].flightDate : '',
      returnDepartureTime: tripType === 'round_trip' && legs[1] ? legs[1].departureTime : '',
      multiLegs: legs,
      additionalLegs: legs.slice(1).map((l) => ({ originIcao: l.originIcao, destIcao: l.destIcao, flightDate: l.flightDate, departureTime: l.departureTime, paxCount: l.paxCount })),
      paxCount: pax,
      aircraftMode: body.aircraftMode === 'per_leg' ? 'per_leg' : 'same',
      aircraftCategory: firstAircraft.category || 'any',
      categoryLabel: firstAircraft.categoryLabel || '',
      preferredAircraft: firstAircraft.model || '',
      aircraftPreference: [firstAircraft.categoryLabel, firstAircraft.model].filter(Boolean).join(' · '),
      legAircraft,
      luggageCount: suitcases,
      luggage: { pieceCount: suitcases, specialLuggageDescription: oversize },
      luggageDetailsText: [suitcases ? `${suitcases} suitcase${suitcases === 1 ? '' : 's'}` : '', oversize].filter(Boolean).join(' · '),
      oversizeItems: oversize,
      hasPets,
      petList: hasPets ? pets : [],
      pets: hasPets ? pets : [],
      petDetails: hasPets
        ? {
            hasPets: true,
            petCount: pets.length,
            totalWeightKg: pets.reduce((s, p) => s + (p.weightKg || 0), 0),
            breed: pets[0].breed,
            petType: pets[0].species,
            notes: pets.map((p) => [p.name, p.species, p.breed, p.weightKg ? `${p.weightKg} kg` : '', p.travels].filter(Boolean).join(' ')).join('; ')
          }
        : {},
      limousineService: Boolean(ground),
      helicopterService: Boolean(heli),
      groundTransportation: ground
        ? {
            enabled: true,
            flightLeg: groundLegs.map((g) => legLabel(Number(g.leg) - 1)),
            onArrival: {
              required: Boolean(firstGround.arrival && firstGround.arrival.enabled),
              dropOffLocation: (firstGround.arrival && firstGround.arrival.location) || '',
              vehiclePreference: (firstGround.arrival && firstGround.arrival.vehicle) || ''
            },
            onDeparture: {
              required: Boolean(firstGround.departure && firstGround.departure.enabled),
              pickUpLocation: (firstGround.departure && firstGround.departure.location) || '',
              vehiclePreference: (firstGround.departure && firstGround.departure.vehicle) || ''
            },
            additionalRequirements: { passengers: Number(firstGround.passengers) || pax, specialInstructions: firstGround.special || '' },
            perLeg: groundLegs,
            extraTransfers: Array.isArray(ground.extra) ? ground.extra : []
          }
        : {},
      helicopterTransfer: heli
        ? {
            enabled: true,
            flightLeg: heliLegs.map((h) => legLabel(Number(h.leg) - 1)),
            onArrival: {
              required: true,
              dropOffLocation: firstHeli.to || '',
              vehiclePreference: firstHeli.type || ''
            },
            onDeparture: { required: false, pickUpLocation: '', vehiclePreference: '' },
            additionalRequirements: { passengers: Number(firstHeli.passengers) || pax, specialInstructions: firstHeli.luggage ? `Luggage: ${firstHeli.luggage}` : '' },
            perLeg: heliLegs,
            extraTransfers: Array.isArray(heli.extra) ? heli.extra : []
          }
        : {},
      cateringRequested: Boolean(body.catering),
      deicingInsurance: body.deicing ? 'at_reservation' : 'none',
      meetAndAssist: Boolean(body.meetAssist),
      specialRequests: [body.catering ? 'Catering' : '', body.meetAssist ? 'Meet & assist at terminal' : '', String(body.notes || '')].filter(Boolean).join(' · '),
      agentMarginPct: Math.max(0, Math.min(30, Number(body.marginPct) || 0)),
      tokensUsed: tokenCost,
      tokenSpend: split
    });
    await user.save();
    await Client.updateOne({ _id: client._id }, { $addToSet: { curatorEmails: email } }).catch(() => {});
    audit(req, 'agent_request_created', 'agent_request', request._id, { requestNumber, legs: legs.length, tokens: tokenCost });
    res.status(201).json({ success: true, data: { id: request.requestNumber, requestNumber, tokens: user.tokens } });
  } catch (err) {
    P.refundSplit(user, split, { movement: 'Request not saved · returned', tripRef: `QUO-${token}-001` });
    await user.save().catch(() => {});
    res.status(400).json({ success: false, message: err && err.message ? err.message : 'The request could not be saved.' });
  }
});

/* ─────────────────────────── quote view ─────────────────────────── */

const relDay = (d) => {
  if (!d) return '';
  const x = new Date(d);
  const today = new Date();
  const a = Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
  const b = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const diff = Math.round((b - a) / P.DAY);
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  return P.dayLabel(x);
};

const departureText = (b) => {
  const leg = P.liveLegs(b)[0];
  if (!leg || !leg.flightDate) return '';
  const d = new Date(`${String(leg.flightDate).slice(0, 10)}T12:00:00Z`);
  const day = isNaN(d.getTime()) ? String(leg.flightDate) : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const time = leg.departureTimeLocal || leg.departureTime || '';
  return `${day}${time ? ` ${time} LT` : ''}`;
};

function expiresText(exp) {
  if (!exp) return '';
  const now = new Date();
  if (exp.getTime() < now.getTime()) return 'expired';
  const time = exp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  const sameDay = exp.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
  return sameDay ? `expires today ${time}` : `expires ${P.dayLabel(exp)} ${time}`;
}

router.get('/quotes/:id', async (req, res) => {
  const { requests, groups } = await loadMine(req);
  const g = findGroup(groups, req.params.id);
  if (!g) return res.status(404).json({ success: false, message: 'Quote not found' });
  const q = g.versions.find((v) => matchesId(v, req.params.id)) || g.latest;
  const r = P.requestForGroup(g, requests);
  const pricing = q.pricing || {};
  const c = P.commissionOf(q);
  const leg = P.liveLegs(q)[0] || {};
  const exp = P.expiryOf(q);
  const ac = q.aircraft || {};
  const owner = q.authorisedOwnerName || (q.client && q.client.fullName) || (r && r.clientName) || '';
  const suitcases = Number((q.luggage && q.luggage.pieceCount) || q.luggageCount || (r && r.luggageCount)) || 0;
  const changes = Array.isArray(r && r.changeRequests) ? r.changeRequests.length : Array.isArray(q.changeRequests) ? q.changeRequests.length : 0;
  const versions = g.versions
    .map((v, i) => {
      const prev = i > 0 ? g.versions[i - 1] : null;
      let text = 'first quote';
      if (prev) {
        const diffs = P.differences(prev, v, { short: true });
        text = diffs.length ? diffs.join(', ') : 'revised';
        text = text.charAt(0).toLowerCase() + text.slice(1);
      }
      if (P.isBooked(v) && !(prev && P.isBooked(prev))) text = `booked${prev ? ` · ${text}` : ''}`;
      return { label: `-${P.versionOf(v)}`, text, when: relDay(v.createdAt), id: v.id || String(v._id) };
    })
    .reverse();

  res.json({
    success: true,
    data: {
      id: q.id || String(q._id),
      mongoId: String(q._id),
      ref: docRef('QUO', g.token, P.versionOf(q)),
      title: P.cityRoute(q),
      client: P.clientName(q),
      owner,
      departure: departureText(q),
      pax: P.paxOf(q),
      expires: expiresText(exp),
      isExpired: Boolean(exp && exp.getTime() < Date.now()),
      flight: {
        route: P.icaoRoute(q),
        aircraft: [ac.model || ac.name || ac.type || '', ac.yearOfManufacture || ac.year || ac.manufactureYear || ''].filter(Boolean).join(' · '),
        luggage: suitcases ? `${suitcases} suitcase${suitcases === 1 ? '' : 's'}` : (r && r.luggageDetailsText) || '',
        departs: leg.departureTimeLocal ? `${leg.departureTimeLocal} LT` : '',
        arrives: leg.arrivalTimeLocal ? `${leg.arrivalTimeLocal} LT` : '',
        services: P.servicesText(q).join(', ')
      },
      price: { net: c.net, marginPct: c.pct, margin: c.amount, client: c.clientPrice, currency: pricing.currency || 'EUR' },
      versions,
      state: {
        confirmedAt: q.clientConfirmedAt || null,
        booked: Boolean(g.booked),
        tripHref: g.booked ? `/agent/trips/${g.token}` : null,
        isLatest: String(q._id) === String(g.latest._id),
        latestHref: `/agent/quotes/${g.latest.id || g.latest._id}`,
        changesUsed: changes,
        freeChangesLeft: Math.max(0, 2 - changes)
      }
    }
  });
});

router.post('/quotes/:id/confirm', async (req, res) => {
  const { requests, groups } = await loadMine(req);
  const g = findGroup(groups, req.params.id);
  if (!g) return res.status(404).json({ success: false, message: 'Quote not found' });
  if (g.booked) return res.status(409).json({ success: false, message: 'This trip is already booked.' });
  const q = g.versions.find((v) => matchesId(v, req.params.id)) || g.latest;
  if (String(q._id) !== String(g.latest._id)) return res.status(409).json({ success: false, message: 'A newer version of this quote exists. Open the latest one.' });
  const exp = P.expiryOf(q);
  if (exp && exp.getTime() < Date.now()) return res.status(409).json({ success: false, message: 'This quote has expired. Ask the desk for a new one.' });
  const doc = await Booking.findById(q._id);
  if (!doc) return res.status(404).json({ success: false, message: 'Quote not found' });
  if (doc.clientConfirmedAt) return res.json({ success: true, data: { confirmedAt: doc.clientConfirmedAt } });
  doc.clientConfirmedAt = new Date();
  doc.clientConfirmedBy = req.user.name || req.user.email;
  doc.quoteStatus = 'client_confirmed';
  await doc.save();
  const ref = `QUO-${g.token}-${P.versionOf(q)}`;
  await tellDesk(req, P.requestForGroup(g, requests), `Client agrees to ${ref}. Please recheck the aircraft and send the contract.`);
  audit(req, 'curator_client_confirmed', 'Quote', ref, { ref });
  res.json({ success: true, data: { confirmedAt: doc.clientConfirmedAt } });
});

router.post('/quotes/:id/change', async (req, res) => {
  const text = String((req.body && req.body.message) || '').trim();
  if (!text) return res.status(400).json({ success: false, message: 'Say what should change.' });
  const { requests, bookings, groups } = await loadMine(req);
  const g = findGroup(groups, req.params.id);
  if (!g) return res.status(404).json({ success: false, message: 'Quote not found' });
  if (g.booked) return res.status(409).json({ success: false, code: 'SIGNED', message: 'The contract is signed. Message the desk about changes to the trip.' });
  const q = g.versions.find((v) => matchesId(v, req.params.id)) || g.latest;
  const ref = `QUO-${g.token}-${P.versionOf(q)}`;
  const r = P.requestForGroup(g, requests);
  const used = Array.isArray(r && r.changeRequests) ? r.changeRequests.length : Array.isArray(q.changeRequests) ? q.changeRequests.length : 0;
  if (used >= 2) {
    return res.status(409).json({
      success: false,
      code: 'NEW_REQUEST_NEEDED',
      message: 'Two changes per request are free before signing. A third change is a new request.'
    });
  }
  const entry = { text: text.slice(0, 2000), quoteRef: ref, at: new Date(), by: req.user.name || req.user.email };
  if (r) await AgentRequest.updateOne({ _id: r._id }, { $push: { changeRequests: entry } });
  else await Booking.updateOne({ _id: q._id }, { $push: { changeRequests: entry } });
  await tellDesk(req, r, `Change requested on ${ref}: ${entry.text}`);

  const user = await User.findById(req.userId);
  if (user) {
    const config = await getConfig();
    P.syncTokens(user, config, { requests, bookings });
    P.pushTx(user, { type: 'debit', amount: 0, bucket: 'none', movement: `Revision ${used + 1} of 2 (free)`, tripRef: ref });
    user.markModified('tokenTransactions');
    await user.save();
  }
  audit(req, 'curator_change_requested', 'Quote', ref, { text: entry.text });
  res.status(201).json({ success: true, data: { changesUsed: used + 1, freeChangesLeft: Math.max(0, 1 - used) } });
});

/* ─────────────────────────── trips ─────────────────────────── */

router.get('/trips', async (req, res) => {
  const { groups } = await loadMine(req);
  const contactIds = [];
  groups.forEach((g) => g.booked && ((P.liveLegs(g.booked)[0] || {}).passengers || []).forEach((p) => p.contactId && contactIds.push(String(p.contactId))));
  const contacts = contactIds.length ? await Contact.find({ $or: [{ id: { $in: contactIds } }, { _id: { $in: contactIds.filter((x) => /^[a-f0-9]{24}$/i.test(x)) } }] }).lean() : [];
  const rows = groups
    .filter((g) => g.booked)
    .map((g) => {
      const b = g.booked;
      const ledger = computeLedger(b);
      const missing = P.passengersOf(b, contacts).filter((p) => !p.complete).length;
      const st = String(b.status || '').toLowerCase();
      return {
        token: g.token,
        ref: docRef('TRI', g.token, ''),
        title: P.cityRoute(b),
        client: P.clientName(b),
        route: P.icaoRoute(b),
        flight: P.dayLabel(P.firstDeparture(b)),
        flightAt: P.firstDeparture(b),
        status: b.isCancelled || st === 'cancelled' ? 'Cancelled' : ['completed', 'flown'].includes(st) ? 'Flown' : st === 'paid' || b.paymentStatus === 'fully_paid' ? 'Paid' : 'Booked',
        price: P.round2(b.pricing && b.pricing.totalFlightPrice),
        currency: (b.pricing && b.pricing.currency) || 'EUR',
        open: (b.invoices || []).length ? Math.max(0, ledger.totals.openBalance) : null,
        missingPassports: missing
      };
    })
    .sort((a, b) => new Date(b.flightAt || 0) - new Date(a.flightAt || 0));
  res.json({ success: true, data: rows });
});

async function tripDoc(req, res) {
  const { requests, groups } = await loadMine(req);
  const g = findGroup(groups, req.params.id);
  if (!g) {
    res.status(404).json({ success: false, message: 'Trip not found' });
    return null;
  }
  const main = g.booked || g.latest;
  const doc = await Booking.findById(main._id);
  if (!doc) {
    res.status(404).json({ success: false, message: 'Trip not found' });
    return null;
  }
  return { g, doc, request: P.requestForGroup(g, requests) };
}

const INVOICE_STATUS = (inv) => {
  if (inv.status === 'paid') return { text: 'Paid', tone: 'green' };
  if (inv.status === 'credited') return { text: 'Credited', tone: 'grey' };
  if (inv.status === 'proof_uploaded') return { text: 'Proof uploaded · desk confirming', tone: 'amber' };
  const due = inv.dueDate ? ` · due ${P.dayLabel(inv.dueDate)}` : '';
  if (inv.status === 'overdue') return { text: `Overdue${due}`, tone: 'red' };
  if (inv.status === 'part_paid') return { text: `Part paid${due}`, tone: 'amber' };
  return { text: `Open${due}`, tone: 'amber' };
};

router.get('/trips/:id', async (req, res) => {
  const found = await tripDoc(req, res);
  if (!found) return;
  const { g, doc } = found;
  if (P.isBooked(doc) && ensureLedger(doc)) await doc.save();
  const b = doc.toObject();
  const ledger = computeLedger(b);
  const c = P.commissionOf(b);
  const contactIds = ((P.liveLegs(b)[0] || {}).passengers || []).map((p) => String(p.contactId || '')).filter(Boolean);
  const contacts = contactIds.length ? await Contact.find({ $or: [{ id: { $in: contactIds } }, { _id: { $in: contactIds.filter((x) => /^[a-f0-9]{24}$/i.test(x)) } }] }).lean() : [];
  const passengers = P.passengersOf(b, contacts);
  const missing = passengers.filter((p) => !p.complete).length;
  const v = P.versionOf(b);
  const currency = (b.pricing && b.pricing.currency) || 'EUR';

  const invoices = ledger.invoices
    .filter((i) => !['combined', 'void'].includes(i.status))
    .map((i) => {
      const what = i.kind === 'charter' || /^charter/i.test(i.line || '') ? 'charter' : String(i.line || i.purpose || 'invoice').replace(/^Additional service · /i, '').split(' · ')[0].toLowerCase();
      return {
        number: i.number,
        label: i.kind === 'charter' ? 'charter' : `${what} ${P.money(i.amount, currency)}`,
        amount: i.amount,
        open: i.open,
        status: INVOICE_STATUS(i)
      };
    });

  // Documents: the last quote before booking, the contract, every invoice and credit note, the brief
  const quoteVersion = [...g.versions].reverse().find((x) => !P.isBooked(x)) || g.versions[0];
  const documents = [];
  if (quoteVersion) documents.push({ label: 'Quote', ref: docRef('QUO', g.token, P.versionOf(quoteVersion)), bookingId: quoteVersion.id || String(quoteVersion._id), docType: 'quotation', ready: true });
  if (P.isBooked(b)) documents.push({ label: 'Contract', ref: docRef('CA', g.token, v), bookingId: b.id || String(b._id), docType: 'charter_agreement', ready: true });
  ledger.invoices
    .filter((i) => !['combined', 'void'].includes(i.status))
    .forEach((i) => {
      const m = String(i.number).match(/^INV-([A-Z0-9]+)-(\d{3}-\d+)$/i);
      documents.push({
        label: 'Invoice',
        ref: m ? { prefix: 'INV', token: m[1], suffix: `-${m[2]}` } : { prefix: '', token: i.number, suffix: '' },
        bookingId: b.id || String(b._id),
        docType: 'invoice',
        invoice: { number: i.number, amount: i.amount, line: i.line || '' },
        ready: true
      });
    });
  (b.creditNotes || [])
    .filter((n) => n && n.direction !== 'charge' && n.number)
    .forEach((n) => {
      const m = String(n.number).match(/^CN-([A-Z0-9]+)-(\d{3}-\d+)$/i);
      documents.push({
        label: 'Credit note',
        ref: m ? { prefix: 'CN', token: m[1], suffix: `-${m[2]}` } : { prefix: '', token: n.number, suffix: '' },
        bookingId: b.id || String(b._id),
        docType: 'credit_note',
        creditNote: { number: n.number, amount: n.amount, against: n.against, reasonCategory: n.reasonCategory, issuedAt: n.issuedAt },
        ready: true
      });
    });
  documents.push({ label: 'Flight brief', ref: null, bookingId: b.id || String(b._id), docType: 'flight_brief', ready: Boolean(b.lastBriefIssuedAt) });

  const ac = b.aircraft || {};
  const st = String(b.status || '').toLowerCase();
  res.json({
    success: true,
    data: {
      token: g.token,
      bookingId: b.id || String(b._id),
      mongoId: String(b._id),
      ref: docRef('TRI', g.token, ''),
      title: P.cityRoute(b),
      sub: [P.clientName(b), departureText(b), ac.model || ac.name || '', P.paxOf(b) ? `${P.paxOf(b)} pax` : ''].filter(Boolean),
      badges: {
        contract: P.isBooked(b) ? 'signed' : 'awaiting',
        open: ledger.totals.openBalance > 0.005 ? P.round2(ledger.totals.openBalance) : 0,
        missingPassports: missing,
        cancelled: Boolean(b.isCancelled || st === 'cancelled')
      },
      currency,
      invoices,
      canUploadProof: invoices.some((i) => i.open > 0 && i.status.text.startsWith('Open')) || invoices.some((i) => i.open > 0 && /Overdue|Part paid/.test(i.status.text)),
      passengers,
      documents,
      commission: { pct: c.pct, amount: c.amount, currency, note: 'Paid 1 week after the flight' }
    }
  });
});

router.post('/trips/:id/proof', async (req, res) => {
  const found = await tripDoc(req, res);
  if (!found) return;
  const { g, doc, request } = found;
  if (ensureLedger(doc)) await doc.save();
  const ledger = computeLedger(doc.toObject());
  const wanted = String((req.body && req.body.invoiceNumber) || '');
  const inv =
    ledger.invoices.find((i) => i.number === wanted && i.open > 0) ||
    ledger.invoices.find((i) => i.open > 0 && !['combined', 'void', 'proof_uploaded'].includes(i.status));
  if (!inv) return res.status(400).json({ success: false, message: 'Nothing is open on this trip.' });
  const proofUrl = typeof req.body.proofUrl === 'string' && req.body.proofUrl.length < 6 * 1024 * 1024 ? req.body.proofUrl : '';
  if (!proofUrl) return res.status(400).json({ success: false, message: 'Attach the transfer confirmation (PDF or image, up to 4 MB).' });
  doc.payments = [
    ...(doc.payments || []),
    {
      id: `pay-${crypto.randomUUID()}`,
      invoiceNumber: inv.number,
      amount: inv.open,
      method: 'bank_transfer',
      provider: '',
      reference: String(req.body.reference || '').slice(0, 120),
      proofName: String(req.body.proofName || 'proof').slice(0, 120),
      proofUrl,
      payerName: P.clientName(doc),
      uploadedBy: req.user.name || req.user.email,
      status: 'proof_uploaded',
      receivedAt: null,
      createdAt: new Date().toISOString()
    }
  ];
  doc.markModified('payments');
  await doc.save();
  await tellDesk(req, request, `Transfer proof uploaded for ${inv.number} (TRI-${g.token}). Please confirm when the money arrives.`);
  audit(req, 'curator_payment_proof', 'Booking', doc.id || doc._id, { invoice: inv.number });
  res.status(201).json({ success: true, data: { invoiceNumber: inv.number } });
});

router.post('/trips/:id/passports', async (req, res) => {
  const found = await tripDoc(req, res);
  if (!found) return;
  const { g, doc, request } = found;
  const updates = (Array.isArray(req.body && req.body.passengers) ? req.body.passengers : []).filter((p) => p && String(p.passportNumber || '').trim());
  if (!updates.length) return res.status(400).json({ success: false, message: 'Fill in at least one passport number.' });
  const apply = (p) => {
    const u = updates.find((x) => (x.id && String(x.id) === String(p.id || p.contactId)) || (x.name && String(x.name).trim() === String(p.fullName || '').trim()));
    if (!u) return p;
    return {
      ...p,
      passportNumber: String(u.passportNumber).trim().slice(0, 40),
      nationality: String(u.nationality || p.nationality || '').slice(0, 60),
      passportExpiry: String(u.passportExpiry || p.passportExpiry || '').slice(0, 20),
      dateOfBirth: String(u.dateOfBirth || p.dateOfBirth || '').slice(0, 20),
      documentType: 'Passport'
    };
  };
  const legs = (doc.legs || []).map((l) => {
    const leg = typeof l.toObject === 'function' ? l.toObject() : l;
    return { ...leg, passengers: (leg.passengers || []).map(apply) };
  });
  doc.legs = legs;
  if (Array.isArray(doc.passengers) && doc.passengers.length) doc.passengers = doc.passengers.map((p) => apply(typeof p.toObject === 'function' ? p.toObject() : p));
  doc.markModified('legs');
  doc.markModified('passengers');
  await doc.save();
  // Keep the saved contacts up to date too
  const firstLeg = (legs.find((l) => !l.isCancelled) || legs[0] || {}).passengers || [];
  for (const p of firstLeg) {
    if (!p.contactId || !p.passportNumber) continue;
    const q = /^[a-f0-9]{24}$/i.test(String(p.contactId)) ? { $or: [{ id: p.contactId }, { _id: p.contactId }] } : { id: p.contactId };
    await Contact.updateOne(q, {
      $set: {
        'passportDetails.passportNumber': p.passportNumber,
        'passportDetails.nationality': p.nationality || '',
        'passportDetails.expirationDate': p.passportExpiry || ''
      }
    }).catch(() => {});
  }
  await tellDesk(req, request, `Passport details sent for ${updates.length} passenger${updates.length === 1 ? '' : 's'} on TRI-${g.token}.`);
  audit(req, 'curator_passports_sent', 'Booking', doc.id || doc._id, { count: updates.length });
  res.json({ success: true });
});

/* ─────────────────────────── clients ─────────────────────────── */

router.get('/clients', async (req, res) => {
  const email = myEmail(req);
  const { requests, groups } = await loadMine(req);
  const requestEmails = [...new Set(requests.map((r) => String(r.clientEmail || '').toLowerCase()).filter(Boolean))];
  const clients = await Client.find({
    isActive: { $ne: false },
    $or: [{ curatorEmails: email }, ...(requestEmails.length ? [{ email: { $in: requestEmails } }] : [])]
  })
    .sort({ companyName: 1, fullName: 1 })
    .lean();

  // Passports: contacts of passengers on upcoming booked trips
  const contactIds = [];
  groups.forEach((g) => g.booked && ((P.liveLegs(g.booked)[0] || {}).passengers || []).forEach((p) => p.contactId && contactIds.push(String(p.contactId))));
  const contacts = contactIds.length ? await Contact.find({ $or: [{ id: { $in: contactIds } }, { _id: { $in: contactIds.filter((x) => /^[a-f0-9]{24}$/i.test(x)) } }] }).lean() : [];
  const now = Date.now();
  const rows = clients.map((c) => {
    const ce = String(c.email || '').toLowerCase();
    const name = c.clientType === 'person' ? c.fullName : c.companyName || c.fullName;
    const mine = groups.filter((g) => {
      const b = g.booked || g.latest;
      const be = String((b.client && b.client.email) || '').toLowerCase();
      const bn = String((b.client && (b.client.companyName || b.client.fullName)) || '').toLowerCase();
      return (be && be === ce) || (bn && (bn === String(c.companyName || '').toLowerCase() || bn === String(c.fullName || '').toLowerCase()));
    });
    const booked = mine.filter((g) => g.booked);
    const lastDep = booked.map((g) => P.firstDeparture(g.booked)).filter(Boolean).sort((a, b) => b - a)[0];
    const upcoming = booked.filter((g) => {
      const d = P.firstDeparture(g.booked);
      return d && d.getTime() > now - P.DAY && !g.booked.isCancelled;
    });
    const missing = upcoming.reduce((s, g) => s + P.passengersOf(g.booked, contacts).filter((p) => !p.complete).length, 0);
    return {
      id: String(c._id),
      name,
      type: c.clientType === 'person' ? 'Person' : 'Company',
      authorisedPerson: c.authorisedPersonName || c.fullName,
      assistant: c.assistantName || '',
      email: c.email,
      whatsapp: c.whatsapp || c.phone || '',
      documentsTo: c.documentsTo || (c.assistantName ? 'owner and assistant' : 'owner'),
      trips: booked.length,
      requests: requests.filter((r) => String(r.clientEmail || '').toLowerCase() === ce || String(r.clientId || '') === String(c._id)).length,
      lastTrip: lastDep ? P.dayLabel(lastDep, true) : '—',
      missingPassports: missing,
      linked: (c.curatorEmails || []).includes(email)
    };
  });
  res.json({ success: true, data: rows });
});

router.post('/clients', async (req, res) => {
  const b = req.body || {};
  const type = b.type === 'person' ? 'person' : 'company';
  const owner = String(b.ownerName || '').trim();
  const company = String(b.companyName || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  if (type === 'company' && !company) return res.status(400).json({ success: false, message: 'Add the company name.' });
  if (!owner) return res.status(400).json({ success: false, message: 'Add the authorised owner.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ success: false, message: 'Add a valid email address.' });
  const me = myEmail(req);
  const existing = await Client.findOne({ email }).lean();
  if (existing) {
    if ((existing.curatorEmails || []).includes(me)) {
      return res.status(409).json({ success: false, code: 'ALREADY_YOURS', message: 'This client is already in your list.', client: { id: String(existing._id) } });
    }
    return res.status(409).json({
      success: false,
      code: 'EXISTS',
      message: 'The desk already has this client. Link them to your list instead of creating a copy.',
      client: { id: String(existing._id), name: existing.companyName || existing.fullName }
    });
  }
  const assistant = String(b.assistantName || '').trim();
  const created = await Client.create({
    fullName: owner,
    companyName: type === 'company' ? company : '',
    email,
    phone: String(b.whatsapp || '').trim(),
    whatsapp: String(b.whatsapp || '').trim(),
    clientType: type,
    authorisedPersonName: owner,
    assistantName: assistant,
    assistantEmail: String(b.assistantEmail || '').trim().toLowerCase(),
    documentsTo: assistant ? 'owner and assistant' : 'owner',
    curatorEmails: [me],
    notes: `Added by Curator ${req.user.name || me}`
  });
  audit(req, 'curator_client_added', 'Client', created._id, { email });
  res.status(201).json({ success: true, data: { id: String(created._id) } });
});

router.post('/clients/:id/link', async (req, res) => {
  if (!/^[a-f0-9]{24}$/i.test(String(req.params.id))) return res.status(404).json({ success: false, message: 'Client not found' });
  const r = await Client.updateOne({ _id: req.params.id }, { $addToSet: { curatorEmails: myEmail(req) } });
  if (!r.matchedCount && !r.n) return res.status(404).json({ success: false, message: 'Client not found' });
  audit(req, 'curator_client_linked', 'Client', req.params.id, {});
  res.json({ success: true, data: { id: req.params.id } });
});

/* ─────────────────────────── documents ─────────────────────────── */

const curatorAccess = (doc, tierName) => {
  const m = doc.accessMatrix || {};
  const v = String((String(tierName).toLowerCase() === 'founding' ? m.curatorFounding : m.curatorStandard) || m.curatorStandard || '—').trim();
  return v && v !== '—' && v !== '-' ? v : '';
};
const updatedDay = (d) => {
  const raw = String(d.updatedDate || '');
  const m = raw.match(/^(\d{1,2})\s+([A-Za-z]{3})/);
  if (m) return `${Number(m[1])} ${m[2]}`;
  return P.dayLabel(d.updatedAt);
};

router.get('/documents', async (req, res) => {
  const user = await User.findById(req.userId).lean();
  const config = await getConfig();
  const tier = P.tierOf(user || {}, config).tier;
  if (typeof library.ensureSeeded === 'function') await library.ensureSeeded().catch(() => {});
  const docs = await PolicyDocument.find().sort({ code: 1 }).lean();
  const shared = docs
    .map((d) => ({ d, access: curatorAccess(d, tier) }))
    .filter((x) => x.access)
    .map(({ d, access }) => {
      const isAgreement = /own signed/i.test(access) || /curator agreement/i.test(d.title);
      const isConduct = /conduct/i.test(d.title);
      const isKit = /sales kit/i.test(d.title);
      const isBrochure = /brochure/i.test(d.title);
      const ack = (d.acknowledgements || []).some((a) => (a.userEmail && a.userEmail === myEmail(req)) || (a.userName && user && a.userName === user.name));
      const signedAt = user && user.agreementSignedAt;
      return {
        code: d.code,
        title: isAgreement ? 'My Curator agreement' : d.title,
        note: isAgreement
          ? signedAt
            ? `(signed ${new Date(signedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })})`
            : '(not signed yet)'
          : isKit
            ? '(route cards, brochure, messages)'
            : '',
        noteBold: isAgreement,
        version: String(d.version || '').split(' ')[0],
        updated: isAgreement && signedAt ? P.dayLabel(signedAt) : updatedDay(d),
        kind: isAgreement ? 'agreement' : isConduct ? 'conduct' : isKit ? 'kit' : isBrochure ? 'brochure' : 'pdf',
        acknowledged: ack,
        signed: Boolean(signedAt),
        order: isAgreement ? 0 : isConduct ? 1 : isKit ? 2 : isBrochure ? 3 : 4
      };
    })
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

  // Every document the desk produced for this Curator's trips
  const { groups } = await loadMine(req);
  const desk = [];
  groups.forEach((g) => {
    g.versions.forEach((v) => {
      const ver = P.versionOf(v);
      const id = v.id || String(v._id);
      const title = P.cityRoute(v);
      desk.push({ key: `q-${v._id}`, label: 'Quote', ref: docRef('QUO', g.token, ver), title, version: `-${ver}`, at: v.quoteSentAt || v.createdAt, bookingId: id, docType: 'quotation' });
      if (P.isBooked(v)) {
        desk.push({ key: `ca-${v._id}`, label: 'Contract', ref: docRef('CA', g.token, ver), title, version: `-${ver}`, at: v.contractSignedAt || v.updatedAt || v.createdAt, bookingId: id, docType: 'charter_agreement' });
        const copy = JSON.parse(JSON.stringify(v));
        ensureLedger(copy);
        computeLedger(copy)
          .invoices.filter((i) => !['combined', 'void'].includes(i.status))
          .forEach((i) => {
            const m = String(i.number).match(/^INV-([A-Z0-9]+)-(\d{3}-\d+)$/i);
            desk.push({
              key: `inv-${i.number}`,
              label: 'Invoice',
              ref: m ? { prefix: 'INV', token: m[1], suffix: `-${m[2]}` } : { prefix: '', token: i.number, suffix: '' },
              title: i.kind === 'charter' ? title : String(i.line || i.purpose || title),
              version: `-${ver}`,
              at: i.issuedAt,
              bookingId: id,
              docType: 'invoice',
              invoice: { number: i.number, amount: i.amount, line: i.line || '' }
            });
          });
        (v.creditNotes || [])
          .filter((n) => n && n.number && n.direction !== 'charge')
          .forEach((n) => {
            const m = String(n.number).match(/^CN-([A-Z0-9]+)-(\d{3}-\d+)$/i);
            desk.push({
              key: `cn-${n.number}`,
              label: 'Credit note',
              ref: m ? { prefix: 'CN', token: m[1], suffix: `-${m[2]}` } : { prefix: '', token: n.number, suffix: '' },
              title: n.reasonCategory || title,
              version: `-${ver}`,
              at: n.issuedAt,
              bookingId: id,
              docType: 'credit_note',
              creditNote: { number: n.number, amount: n.amount, against: n.against, reasonCategory: n.reasonCategory, issuedAt: n.issuedAt }
            });
          });
        if (v.lastBriefIssuedAt) {
          desk.push({ key: `fb-${v._id}`, label: 'Flight brief', ref: docRef('FB', g.token, ver), title, version: `-${ver}`, at: v.lastBriefIssuedAt, bookingId: id, docType: 'flight_brief' });
        }
      }
    });
  });
  // Invoices carried over from one version to the next appear once
  const seen = new Set();
  const deskRows = desk
    .filter((d) => {
      if (seen.has(d.key)) return false;
      seen.add(d.key);
      return true;
    })
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
    .map((d) => ({ ...d, updated: P.dayLabel(d.at) }));

  res.json({ success: true, data: { shared, desk: deskRows, user: { name: (user && user.name) || '', email: (user && user.email) || '' } } });
});

router.get('/documents/library/:code', async (req, res) => {
  const user = await User.findById(req.userId).lean();
  const config = await getConfig();
  const d = await PolicyDocument.findOne({ code: req.params.code }).lean();
  if (!d || !curatorAccess(d, P.tierOf(user || {}, config).tier)) return res.status(404).json({ success: false, message: 'Document not found' });
  res.json({
    success: true,
    data: {
      code: d.code,
      title: d.title,
      version: d.version,
      updated: d.updatedDate || P.dayLabel(d.updatedAt),
      description: d.description || '',
      content: d.contentSummary || '',
      owner: d.ownerApprover || '',
      signedAt: /curator agreement/i.test(d.title) ? (user && user.agreementSignedAt) || null : null,
      downloadedBy: (user && user.name) || '',
      downloadedAt: new Date().toISOString()
    }
  });
});

router.post('/documents/library/:code/acknowledge', async (req, res) => {
  const d = await PolicyDocument.findOne({ code: req.params.code });
  if (!d) return res.status(404).json({ success: false, message: 'Document not found' });
  const email = myEmail(req);
  const already = (d.acknowledgements || []).some((a) => a.userEmail === email || a.userName === req.user.name);
  if (!already) {
    d.acknowledgements.push({ userName: req.user.name, userRole: 'Curator', acknowledgedAt: new Date(), version: d.version });
    // userEmail is not in the schema list: keep it via set on the last element
    await d.save();
    await PolicyDocument.updateOne({ _id: d._id, 'acknowledgements.userName': req.user.name }, { $set: { 'acknowledgements.$.userEmail': email } }, { strict: false }).catch(() => {});
  }
  audit(req, 'curator_document_acknowledged', 'PolicyDocument', d.code, { version: d.version });
  res.json({ success: true });
});

router.post('/agreement/sign', async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (!user.agreementSignedAt) {
    const d = await PolicyDocument.findOne({ title: /curator agreement/i }).lean();
    user.agreementSignedAt = new Date();
    user.agreementVersion = (d && d.version) || '';
    await user.save();
    audit(req, 'curator_agreement_signed', 'User', user._id, { version: user.agreementVersion });
  }
  res.json({ success: true, data: { signedAt: user.agreementSignedAt } });
});

/* ─────────────────────────── tokens ─────────────────────────── */

async function tokenSummary(req) {
  const user = await User.findById(req.userId);
  if (!user) return null;
  const config = await getConfig();
  const mine = await loadMine(req);
  if (P.syncTokens(user, config, mine)) await user.save();
  const s = user.tokenState || {};
  const tier = P.tierOf(user, config);
  const ledger = P.tokenLedgerRows(user);
  const year = new Date().getUTCFullYear();
  const earned = (user.tokenTransactions || [])
    .filter((t) => t.bucket === 'free' && /booking completed/i.test(t.movement || '') && new Date(t.createdAt).getUTCFullYear() === year)
    .reduce((n, t) => n + (Number(t.amount) || 0), 0);
  const returnedTx = (user.tokenTransactions || []).filter((t) => t.type === 'credit' && /returned/i.test(t.movement || '') && !/not saved/i.test(t.movement || ''));
  const returned = returnedTx.reduce((n, t) => n + (Number(t.amount) || 0), 0);
  const reasons = [...new Set(returnedTx.map((t) => (/no aircraft/i.test(t.movement) ? 'no aircraft' : 'operational cancellation')))];
  const rules = (config.tokenRules && (config.tokenRules.toObject ? config.tokenRules.toObject() : config.tokenRules)) || {};
  const { single, bundles } = P.parseBundles(rules);
  return {
    user,
    data: {
      balance: user.tokens || 0,
      buckets: { monthly: s.monthly || 0, free: s.free || 0, paid: s.paid || 0 },
      tier: tier.tier,
      monthlyAllowance: Number(tier.monthlyTokens) || 0,
      monthlyLeft: s.monthly || 0,
      monthlyExpires: P.dayLabel(P.monthEnd()),
      earnedThisYear: earned,
      returned,
      returnedReasons: reasons,
      ledger,
      single,
      bundles,
      rules: {
        perRequest: rules.perRequest || '1 token per leg',
        afterSignature: rules.afterSignature || '',
        orderOfUse: rules.orderOfUse || 'Monthly → free → paid',
        paidExpiry: rules.paidExpiry || 'Never',
        freeRevisions: rules.freeRevisions || '2 before contract signature'
      },
      cardPayments: Boolean(process.env.STRIPE_SECRET_KEY)
    }
  };
}

router.get('/tokens', async (req, res) => {
  const out = await tokenSummary(req);
  if (!out) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: out.data });
});

const frontendBase = (req) => {
  const fromBody = typeof req.body.origin === 'string' && /^https?:\/\/[^\s/]+$/i.test(req.body.origin) ? req.body.origin : '';
  const fromEnv = String(process.env.FRONTEND_URL || '').split(',')[0].trim().replace(/\/+$/, '');
  return fromBody || fromEnv || 'http://localhost:3000';
};

function creditPurchase(user, { tokens, price, currency }) {
  user.tokenState = user.tokenState || { monthly: 0, free: 0, paid: 0 };
  user.tokenState.paid = (user.tokenState.paid || 0) + tokens;
  user.tokens = (user.tokenState.monthly || 0) + (user.tokenState.free || 0) + (user.tokenState.paid || 0);
  P.pushTx(user, {
    type: 'credit',
    amount: tokens,
    bucket: 'paid',
    movement: tokens === 1 ? '1 token bought' : `Bundle of ${tokens} bought`,
    pricePaid: price,
    currency
  });
  user.markModified('tokenState');
  user.markModified('tokenTransactions');
}

router.post('/tokens/buy', async (req, res) => {
  const out = await tokenSummary(req);
  if (!out) return res.status(404).json({ success: false, message: 'User not found' });
  const { user, data } = out;
  const want = Number(req.body && req.body.tokens);
  const option = [data.single, ...data.bundles].find((b) => b.tokens === want);
  if (!option) return res.status(400).json({ success: false, message: 'Pick a bundle.' });

  if (process.env.STRIPE_SECRET_KEY) {
    const id = `tp-${crypto.randomUUID()}`;
    const base = frontendBase(req);
    try {
      const params = new URLSearchParams();
      params.append('mode', 'payment');
      params.append('success_url', `${base}/agent/tokens?purchase=${id}`);
      params.append('cancel_url', `${base}/agent/tokens`);
      params.append('line_items[0][quantity]', '1');
      params.append('line_items[0][price_data][currency]', String(option.currency || 'USD').toLowerCase());
      params.append('line_items[0][price_data][unit_amount]', String(Math.round(option.price * 100)));
      params.append('line_items[0][price_data][product_data][name]', `${option.tokens} Curator token${option.tokens === 1 ? '' : 's'}`);
      params.append('metadata[purchaseId]', id);
      const r = await axios.post('https://api.stripe.com/v1/checkout/sessions', params.toString(), {
        headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000
      });
      user.pendingTokenPurchases = [
        ...(user.pendingTokenPurchases || []),
        { id, sessionId: r.data.id, tokens: option.tokens, price: option.price, currency: option.currency, createdAt: new Date(), status: 'pending' }
      ];
      user.markModified('pendingTokenPurchases');
      await user.save();
      return res.json({ success: true, data: { checkoutUrl: r.data.url, purchaseId: id } });
    } catch (err) {
      return res.status(502).json({ success: false, message: 'The card payment page could not be opened. Try again in a moment.' });
    }
  }

  // No card processor set up: the bundle is added straight away and billed by the desk
  creditPurchase(user, option);
  await user.save();
  audit(req, 'curator_tokens_bought', 'tokens', user._id, { tokens: option.tokens, price: option.price, currency: option.currency, billed: 'desk' });
  res.json({ success: true, data: { tokens: user.tokens, added: option.tokens } });
});

router.post('/tokens/purchases/:id/check', async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const list = user.pendingTokenPurchases || [];
  const p = list.find((x) => x && x.id === req.params.id);
  if (!p) return res.status(404).json({ success: false, message: 'Purchase not found' });
  if (p.status === 'paid') return res.json({ success: true, data: { tokens: user.tokens, status: 'paid' } });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(400).json({ success: false, message: 'Card payments are not set up.' });
  try {
    const r = await axios.get(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(p.sessionId)}`, {
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
      timeout: 15000
    });
    if (r.data.payment_status !== 'paid') return res.json({ success: true, data: { status: 'pending', tokens: user.tokens } });
  } catch {
    return res.status(502).json({ success: false, message: 'The payment could not be checked. Try again in a moment.' });
  }
  user.pendingTokenPurchases = list.map((x) => (x.id === p.id ? { ...x, status: 'paid', paidAt: new Date() } : x));
  user.markModified('pendingTokenPurchases');
  creditPurchase(user, p);
  await user.save();
  res.json({ success: true, data: { status: 'paid', tokens: user.tokens, added: p.tokens } });
});

/* ─────────────────────────── estimate ─────────────────────────── */

router.get('/estimate', async (req, res) => {
  const q = req.query || {};
  const point = (codeParam, lat, lng) => {
    const a = codeParam ? airports.getAirportByCode(String(codeParam).toUpperCase()) : null;
    if (a && Number.isFinite(Number(a.lat)) && Number.isFinite(Number(a.lng))) return { lat: Number(a.lat), lng: Number(a.lng) };
    if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && lat !== '' && lng !== '') return { lat: Number(lat), lng: Number(lng) };
    return null;
  };
  const from = point(q.from, q.fromLat, q.fromLng);
  const to = point(q.to, q.toLat, q.toLng);
  if (!from || !to) return res.status(400).json({ success: false, message: 'Pick both airports.' });
  const config = await getConfig();
  const rateTable = Array.isArray(config.rateTable) && config.rateTable.length ? config.rateTable : null;
  const marginPct = Number(config.directRoute && config.directRoute.standardMarkupPct) || 8;
  const data = P.estimate({
    from,
    to,
    pax: Number(q.pax) || 0,
    trip: q.trip === 'one_way' ? 'one_way' : 'return',
    date: q.date,
    marginPct,
    rateTable
  });
  res.json({ success: true, data: { ...data, placeholders: !rateTable } });
});

module.exports = router;

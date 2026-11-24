const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const AgentRequest = require('../models/AgentRequest');
const Client = require('../models/Client');
const Operator = require('../models/Operator');
const AuditLog = require('../models/AuditLog');
const { authorize } = require('../middleware/auth');
const dayjs = require('dayjs');

// GET /api/dashboard/kpis
router.get('/kpis', authorize('super_admin', 'admin', 'finance', 'operations'), async (req, res) => {
  const now = dayjs();
  const startOfMonth = now.startOf('month').toDate();
  const endOfMonth = now.endOf('month').toDate();
  const startOfLastMonth = now.subtract(1, 'month').startOf('month').toDate();
  const endOfLastMonth = now.subtract(1, 'month').endOf('month').toDate();

  const [
    bookingsThisMonth, bookingsLastMonth,
    activeTrips, pendingRequests,
    totalClients, pendingPayments
  ] = await Promise.all([
    Booking.find({ createdAt: { $gte: startOfMonth, $lte: endOfMonth }, isDeleted: { $ne: true } }),
    Booking.find({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }, isDeleted: { $ne: true } }),
    Booking.countDocuments({ status: { $in: ['confirmed', 'dispatched', 'in_flight'] }, isDeleted: { $ne: true } }),
    AgentRequest.countDocuments({ status: { $in: ['pending', 'in_sourcing', 'processing'] } }),
    Client.countDocuments(),
    Booking.countDocuments({ paymentStatus: { $in: ['unpaid', 'overdue'] }, status: { $nin: ['cancelled', 'expired'] }, isDeleted: { $ne: true } })
  ]);

  const revThisMonth = bookingsThisMonth
    .filter(b => b.paymentStatus === 'fully_paid' || b.paymentStatus === 'deposit_paid')
    .reduce((sum, b) => sum + (b.pricing?.totalFlightPrice || 0), 0);

  const revLastMonth = bookingsLastMonth
    .filter(b => b.paymentStatus === 'fully_paid' || b.paymentStatus === 'deposit_paid')
    .reduce((sum, b) => sum + (b.pricing?.totalFlightPrice || 0), 0);

  const totalQuotes = bookingsThisMonth.filter(b => ['quoted', 'quote_sent', 'client_review', 'draft'].includes(b.status)).length;
  const accepted = bookingsThisMonth.filter(b => ['accepted', 'paid', 'confirmed', 'flown', 'completed'].includes(b.status)).length;
  const conversionRate = totalQuotes > 0 ? Math.round((accepted / (totalQuotes + accepted)) * 100) : 0;

  res.json({
    revenueMTD: revThisMonth,
    revenueLastMonth: revLastMonth,
    revenueGrowthPct: revLastMonth > 0 ? Math.round(((revThisMonth - revLastMonth) / revLastMonth) * 100) : 0,
    bookingsThisMonth: bookingsThisMonth.length,
    bookingsLastMonth: bookingsLastMonth.length,
    activeTrips,
    pendingRequests,
    totalClients,
    pendingPayments,
    conversionRate
  });
});

// GET /api/dashboard/bookings-summary
router.get('/bookings-summary', authorize('super_admin', 'admin', 'finance', 'operations'), async (req, res) => {
  const statuses = ['submitted','in_sourcing','quoted','accepted','paid','confirmed','flown','cancelled','expired','draft','quote_sent','client_review','dispatched','in_flight','completed'];
  const counts = await Promise.all(
    statuses.map(s => Booking.countDocuments({ status: s, isDeleted: { $ne: true } }).then(c => ({ status: s, count: c })))
  );
  res.json(counts);
});

// GET /api/dashboard/revenue-chart?months=6
router.get('/revenue-chart', authorize('super_admin', 'admin', 'finance'), async (req, res) => {
  const months = parseInt(req.query.months) || 6;
  const data = [];
  for (let i = months - 1; i >= 0; i--) {
    const start = dayjs().subtract(i, 'month').startOf('month').toDate();
    const end = dayjs().subtract(i, 'month').endOf('month').toDate();
    const bookings = await Booking.find({
      createdAt: { $gte: start, $lte: end },
      isDeleted: { $ne: true },
      paymentStatus: { $in: ['fully_paid', 'deposit_paid'] }
    }).select('pricing.totalFlightPrice');
    const revenue = bookings.reduce((s, b) => s + (b.pricing?.totalFlightPrice || 0), 0);
    data.push({ month: dayjs().subtract(i, 'month').format('MMM YYYY'), revenue, bookings: bookings.length });
  }
  res.json(data);
});

// GET /api/dashboard/upcoming-flights?days=7
router.get('/upcoming-flights', authorize('super_admin', 'admin', 'operations', 'finance'), async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const from = new Date();
  const to = dayjs().add(days, 'day').toDate();

  const bookings = await Booking.find({
    status: { $in: ['confirmed', 'paid', 'dispatched'] },
    isDeleted: { $ne: true }
  }).select('tripNumber client aircraft legs status').limit(50);

  const upcoming = bookings.filter(b => {
    return b.legs?.some(leg => {
      const legDate = new Date(leg.flightDate);
      return legDate >= from && legDate <= to;
    });
  }).slice(0, 20);

  res.json(upcoming);
});

// GET /api/dashboard/agent-performance
router.get('/agent-performance', authorize('super_admin', 'admin', 'finance'), async (req, res) => {
  const pipeline = [
    { $match: { isDeleted: { $ne: true }, agentEmail: { $exists: true, $ne: null } } },
    { $group: {
      _id: '$agentEmail',
      agentName: { $first: '$agentName' },
      bookingsCount: { $sum: 1 },
      totalRevenue: { $sum: '$pricing.totalFlightPrice' },
      confirmedCount: { $sum: { $cond: [{ $in: ['$status', ['confirmed', 'flown', 'completed']] }, 1, 0] } }
    }},
    { $sort: { totalRevenue: -1 } },
    { $limit: 10 }
  ];
  const results = await Booking.aggregate(pipeline);
  res.json(results);
});

// GET /api/dashboard/alerts
router.get('/alerts', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const alerts = [];
  const now = dayjs();
  const thirtyDays = now.add(30, 'day').toISOString();

  // Overdue payments
  const overduePayments = await Booking.find({ paymentStatus: 'overdue', isDeleted: { $ne: true } }).select('tripNumber client');
  overduePayments.forEach(b => alerts.push({ type: 'error', category: 'payment', message: `Overdue payment for ${b.tripNumber} — ${b.client.fullName}`, entityId: b._id }));

  // Quote expiry soon
  const expiringQuotes = await Booking.find({ quoteStatus: { $in: ['sent', 'pending'] }, quoteExpirationDate: { $lte: thirtyDays } }).select('tripNumber quoteExpirationDate client');
  expiringQuotes.forEach(b => alerts.push({ type: 'warning', category: 'quote', message: `Quote ${b.tripNumber} expires soon — ${b.client.fullName}`, entityId: b._id }));

  // Operator AOC expiry
  const operators = await Operator.find({ status: { $ne: 'rejected' } }).select('tradingName aocExpiry insuranceExpiry');
  operators.forEach(op => {
    if (op.aocExpiry && op.aocExpiry <= thirtyDays) {
      alerts.push({ type: 'warning', category: 'operator', message: `${op.tradingName} AOC expires on ${op.aocExpiry}` });
    }
    if (op.insuranceExpiry && op.insuranceExpiry <= thirtyDays) {
      alerts.push({ type: 'warning', category: 'operator', message: `${op.tradingName} insurance expires on ${op.insuranceExpiry}` });
    }
  });

  res.json(alerts);
});

// ─── Overview & Board (live data from bookings, requests, contacts, flight watch) ───
const { buildOverview, boardColumns, moveCard } = require('../services/overviewService');
const { createAuditEntry } = require('../services/auditService');

const userEmailOf = (req) => (req.user && req.user.email) || '';

// Small cache so the overview's polling does not rebuild everything on every request
const cache = new Map();
async function overviewFor(req) {
  const key = userEmailOf(req) || 'anon';
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 15000) return hit.data;
  const data = await buildOverview({ userEmail: userEmailOf(req) });
  cache.set(key, { at: Date.now(), data });
  return data;
}
const clearOverviewCache = () => cache.clear();

// GET /api/dashboard/overview
router.get('/overview', async (req, res) => {
  const { timeframe, assignee } = req.query;
  const data = await overviewFor(req);
  const flights = timeframe === 'today' ? data.flights.filter((f) => f.dateGroup === 'today') : data.flights;
  const needsAction = assignee === 'mine' ? data.needsAction.filter((n) => n.isMine) : data.needsAction;
  res.json({
    success: true,
    data: {
      financialHealth: data.financialHealth,
      flights: { totalCount: flights.length, items: flights },
      needsAction: { totalCount: needsAction.length, items: needsAction },
      tripsByStage: data.tripsByStage,
      generatedAt: data.generatedAt
    }
  });
});

// GET /api/dashboard/board
router.get('/board', async (req, res) => {
  const { curator, needsAction, departing7Days } = req.query;
  const data = await overviewFor(req);
  let cards = data.cards;
  if (curator === 'mine') cards = cards.filter((c) => c.isMine);
  else if (curator && curator !== 'all') cards = cards.filter((c) => (c.curator || '').toLowerCase().includes(String(curator).toLowerCase()));
  if (needsAction === 'true' || needsAction === true) cards = cards.filter((c) => c.needsAction);
  if (departing7Days === 'true' || departing7Days === true) cards = cards.filter((c) => c.departingIn7Days);
  res.json({
    success: true,
    data: {
      financialHealth: data.financialHealth,
      columns: boardColumns(cards),
      totalCards: cards.length,
      generatedAt: data.generatedAt
    }
  });
});

// PATCH /api/dashboard/board/card-stage · saved on the booking or request
router.patch('/board/card-stage', async (req, res) => {
  const { cardId, stage } = req.body || {};
  if (!cardId || !stage) {
    return res.status(400).json({ success: false, message: 'Missing cardId or stage' });
  }
  try {
    const moved = await moveCard(cardId, stage, req.user);
    if (!moved) return res.status(404).json({ success: false, message: 'Card not found' });
    clearOverviewCache();
    if (req.user) {
      try {
        await createAuditEntry({
          user: req.user,
          action: 'BOARD_STAGE_CHANGED',
          entityType: moved.kind === 'request' ? 'AgentRequest' : 'Booking',
          entityId: String(moved.id),
          details: `Moved board card ${cardId} to ${stage}`
        });
      } catch {
        // the move is saved even if the audit entry is not
      }
    }
    res.json({ success: true, message: 'Card stage updated', card: { id: cardId, stage } });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Could not move the card' });
  }
});

// GET /api/dashboard/flights-24h
router.get('/flights-24h', async (req, res) => {
  const data = await overviewFor(req);
  const items = req.query.filter === 'today' ? data.flights.filter((f) => f.dateGroup === 'today') : data.flights;
  res.json({ success: true, data: { totalCount: items.length, items } });
});

// GET /api/dashboard/needs-action
router.get('/needs-action', async (req, res) => {
  const data = await overviewFor(req);
  const items = req.query.filter === 'mine' ? data.needsAction.filter((n) => n.isMine) : data.needsAction;
  res.json({ success: true, data: { totalCount: items.length, items } });
});

// GET /api/dashboard/financial-health
router.get('/financial-health', async (req, res) => {
  const data = await overviewFor(req);
  res.json({ success: true, data: data.financialHealth });
});

module.exports = router;
module.exports.clearOverviewCache = clearOverviewCache;

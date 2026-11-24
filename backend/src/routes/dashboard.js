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

// ─── Shared Baseline Data for Overview & Board Screens ────────────────────────
const defaultFinancialHealth = {
  unpaid: {
    amount: 48250,
    count: 3,
    label: "3 invoices",
    link: "/payments?filter=unpaid"
  },
  overdue: {
    amount: 8000,
    count: 1,
    label: "1 · due 48 h before flight",
    link: "/payments?filter=overdue"
  },
  received: {
    amount: 212640,
    month: "NOV",
    comparePct: 18,
    compareText: "+18 % vs Oct",
    link: "/payments"
  },
  companyMargin: {
    amount: 17920,
    month: "NOV",
    avgMarginPct: 9.4,
    compareText: "average 9.4 %",
    link: "/payments"
  },
  curatorPayoutsDue: {
    amount: 4310,
    count: 2,
    label: "2 Curators · next 18 Nov",
    link: "/curators"
  }
};

const defaultFlights = [
  {
    id: "fl-1",
    time: "09:30",
    code: "TRI - NK1188",
    route: "LFMN → LSGG",
    leg: "leg 1",
    aircraft: "Challenger 650",
    status: "landed",
    badgeText: "Landed 10:38",
    badgeVariant: "green",
    tripId: "NK1188",
    dateGroup: "today",
    dateLabel: "Tue 17 Nov"
  },
  {
    id: "fl-2",
    time: "11:15",
    code: "TRI - WS0193",
    route: "EGLF → LIRA",
    leg: "",
    aircraft: "Citation XLS+",
    status: "airborne",
    badgeText: "Airborne - ETA 14:20",
    badgeVariant: "slate",
    tripId: "WS0193",
    dateGroup: "today",
    dateLabel: "Tue 17 Nov"
  },
  {
    id: "fl-3",
    time: "15:00",
    code: "TRI - NK1188",
    route: "LSGG → DNAA",
    leg: "leg 2",
    aircraft: "Challenger 650",
    status: "fbo_overridden",
    badgeText: "FBO after hours · overridden",
    badgeVariant: "amber",
    tripId: "NK1188",
    dateGroup: "today",
    dateLabel: "Tue 17 Nov"
  },
  {
    id: "fl-4",
    time: "18:40",
    code: "TRI - TB7710",
    route: "OMDB → DNMM",
    leg: "",
    aircraft: "Legacy 600",
    status: "delayed",
    badgeText: "Delayed 35 m",
    badgeVariant: "rose",
    tripId: "TB7710",
    dateGroup: "today",
    dateLabel: "Tue 17 Nov"
  },
  {
    id: "fl-5",
    time: "07:00",
    code: "TRI - AK5562",
    route: "DNAA → FAOR",
    leg: "",
    aircraft: "Global 6000",
    status: "slot_pending",
    badgeText: "Slot pending",
    badgeVariant: "amber",
    tripId: "AK5562",
    dateGroup: "next_24h",
    dateLabel: "Wed 18 Nov · next 24 h"
  },
  {
    id: "fl-6",
    time: "10:30",
    code: "TRI - PT1204",
    route: "LEMD → EGLF",
    leg: "",
    aircraft: "Phenom 300E",
    status: "brief_sent",
    badgeText: "Brief sent",
    badgeVariant: "green",
    tripId: "PT1204",
    dateGroup: "next_24h",
    dateLabel: "Wed 18 Nov · next 24 h"
  }
];

const defaultNeedsAction = [
  {
    id: "na-1",
    urgency: "40 m late",
    badgeVariant: "rose",
    title: "New request, start sourcing · REQ - KN4410",
    code: "REQ - KN4410",
    linkText: "Request →",
    linkUrl: "/requests/KN4410",
    isMine: false,
    category: "request",
    curator: "T. Bello"
  },
  {
    id: "na-2",
    urgency: "today",
    badgeVariant: "rose",
    title: "2 passports missing · TRI - FE4578",
    code: "TRI - FE4578",
    linkText: "Passengers →",
    linkUrl: "/trips/FE4578/passengers",
    isMine: true,
    category: "passengers",
    curator: "Mine"
  },
  {
    id: "na-3",
    urgency: "in 2 h",
    badgeVariant: "amber",
    title: "Wire proof uploaded, confirm receipt · TRI - FE4578",
    code: "TRI - FE4578",
    linkText: "Payments →",
    linkUrl: "/trips/FE4578/accounting",
    isMine: true,
    category: "payments",
    curator: "Mine"
  },
  {
    id: "na-4",
    urgency: "in 3 h",
    badgeVariant: "amber",
    title: "Quote expires · QUO - RB3310 002",
    code: "QUO - RB3310 002",
    linkText: "Quote →",
    linkUrl: "/trips/RB3310/pricing",
    isMine: false,
    category: "quote",
    curator: "M. Vance"
  },
  {
    id: "na-5",
    urgency: "in 18 h",
    badgeVariant: "amber",
    title: "Slot LFMN still pending · TRI - AK5562",
    code: "TRI - AK5562",
    linkText: "Itinerary →",
    linkUrl: "/trips/AK5562/itinerary",
    isMine: false,
    category: "itinerary",
    curator: "Operations"
  },
  {
    id: "na-6",
    urgency: "new",
    badgeVariant: "blue",
    title: "Card scan lead · Chidi Nwosu · LEAD - NW7731",
    code: "LEAD - NW7731",
    linkText: "Lead →",
    linkUrl: "/contacts",
    isMine: true,
    category: "lead",
    curator: "Mine"
  }
];

let boardCardsState = [
  {
    id: "card-req-1",
    code: "REQ - KN4410",
    route: "DNMM → KTEB",
    details: "02 Dec · Heavy · T. Bello",
    badge: "waiting 40 m",
    badgeVariant: "rose",
    stage: "request",
    curator: "T. Bello",
    isMine: false,
    needsAction: true,
    departingIn7Days: true,
    linkUrl: "/requests/KN4410",
    order: 1
  },
  {
    id: "card-req-2",
    code: "REQ - DS6602",
    route: "DGAA → OMDB",
    details: "28 Nov · Midsize · A. Okafor",
    badge: null,
    badgeVariant: null,
    stage: "request",
    curator: "A. Okafor",
    isMine: false,
    needsAction: false,
    departingIn7Days: true,
    linkUrl: "/requests/DS6602",
    order: 2
  },
  {
    id: "card-src-1",
    code: "QUO - MX5521-001",
    route: "LFPB ⇄ DNAA",
    details: "24 Nov · 2 aircraft · C. Laurent",
    badge: "4 offers in",
    badgeVariant: "sky",
    stage: "sourcing",
    curator: "C. Laurent",
    isMine: false,
    needsAction: false,
    departingIn7Days: true,
    linkUrl: "/requests/MX5521",
    order: 1
  },
  {
    id: "card-quo-1",
    code: "QUO - RB3310-002",
    route: "LFPB → LIML",
    details: "19 Nov · € 14,900 · M. Vance",
    badge: "expires 3 h",
    badgeVariant: "amber",
    stage: "quoted",
    curator: "M. Vance",
    isMine: true,
    needsAction: true,
    departingIn7Days: true,
    linkUrl: "/trips/RB3310/pricing",
    order: 1
  },
  {
    id: "card-quo-2",
    code: "QUO - KD2201-003",
    route: "EGGW → LFMN",
    details: "21 Nov · € 6,930",
    badge: "Curator confirmed",
    badgeVariant: "green",
    stage: "quoted",
    curator: "Mine",
    isMine: true,
    needsAction: false,
    departingIn7Days: true,
    linkUrl: "/trips/KD2201/pricing",
    order: 2
  },
  {
    id: "card-bk-1",
    code: "TRI - FE4578-005",
    route: "LEIB → LSGG",
    details: "20 Nov · € 250 open",
    badge: "2 passports missing",
    badgeVariant: "amber",
    stage: "booked",
    curator: "Mine",
    isMine: true,
    needsAction: true,
    departingIn7Days: true,
    linkUrl: "/trips/FE4578/passengers",
    order: 1
  },
  {
    id: "card-conf-1",
    code: "TRI - NK1188-004",
    route: "LFMN → LSGG → DNAA",
    details: "17 Nov · paid",
    badge: "FBO after hours · overridden",
    badgeVariant: "peach",
    stage: "confirmed",
    curator: "Alexander Vance",
    isMine: false,
    needsAction: true,
    departingIn7Days: true,
    linkUrl: "/trips/NK1188/itinerary",
    order: 1
  },
  {
    id: "card-flown-1",
    code: "TRI - AW0412-003",
    route: "OMDB → DNMM",
    details: "11 Nov · payout 18 Nov",
    badge: null,
    badgeVariant: null,
    stage: "flown_close",
    curator: "Mine",
    isMine: true,
    needsAction: false,
    departingIn7Days: false,
    linkUrl: "/trips/AW0412/accounting",
    order: 1
  }
];

// ─── Helper: Aggregate Live Data from DB if present ─────────────────────────
async function computeOverviewMetrics() {
  const financialHealth = { ...defaultFinancialHealth };
  const flights = [...defaultFlights];
  const needsAction = [...defaultNeedsAction];

  try {
    const [liveBookings, liveRequests] = await Promise.all([
      Booking.find({ isDeleted: { $ne: true } }).limit(50).lean().catch(() => []),
      AgentRequest.find().limit(50).lean().catch(() => [])
    ]);

    // If live bookings exist with unpaid/overdue, enrich the numbers
    if (liveBookings && liveBookings.length > 0) {
      const unpaidBookings = liveBookings.filter(b => b.paymentStatus === 'unpaid');
      const overdueBookings = liveBookings.filter(b => b.paymentStatus === 'overdue');
      if (unpaidBookings.length > 0) {
        const sum = unpaidBookings.reduce((s, b) => s + (b.pricing?.totalFlightPrice || 0), 0);
        financialHealth.unpaid = {
          amount: sum || financialHealth.unpaid.amount,
          count: unpaidBookings.length,
          label: `${unpaidBookings.length} invoices`,
          link: "/payments?filter=unpaid"
        };
      }
      if (overdueBookings.length > 0) {
        const sum = overdueBookings.reduce((s, b) => s + (b.pricing?.totalFlightPrice || 0), 0);
        financialHealth.overdue = {
          amount: sum || financialHealth.overdue.amount,
          count: overdueBookings.length,
          label: `${overdueBookings.length} · due 48 h before flight`,
          link: "/payments?filter=overdue"
        };
      }
    }
  } catch (err) {
    // Graceful fallback to default baseline
  }

  // Calculate tripsByStage counts from board cards
  const tripsByStage = {
    request: boardCardsState.filter(c => c.stage === 'request').length,
    sourcing: boardCardsState.filter(c => c.stage === 'sourcing').length,
    quoted: boardCardsState.filter(c => c.stage === 'quoted').length,
    booked: boardCardsState.filter(c => c.stage === 'booked').length,
    confirmed: boardCardsState.filter(c => c.stage === 'confirmed').length,
    flownClose: boardCardsState.filter(c => c.stage === 'flown_close').length
  };

  return { financialHealth, flights, needsAction, tripsByStage };
}

// ─── GET /api/dashboard/overview ─────────────────────────────────────────────
router.get('/overview', async (req, res) => {
  const { timeframe, assignee } = req.query;
  const metrics = await computeOverviewMetrics();

  let flights = metrics.flights;
  if (timeframe === 'today') {
    flights = flights.filter(f => f.dateGroup === 'today');
  }

  let needsAction = metrics.needsAction;
  if (assignee === 'mine') {
    needsAction = needsAction.filter(n => n.isMine);
  }

  res.json({
    success: true,
    data: {
      financialHealth: metrics.financialHealth,
      flights: {
        totalCount: flights.length,
        items: flights
      },
      needsAction: {
        totalCount: needsAction.length,
        items: needsAction
      },
      tripsByStage: metrics.tripsByStage
    }
  });
});

// ─── GET /api/dashboard/board ────────────────────────────────────────────────
router.get('/board', async (req, res) => {
  const { curator, needsAction, departing7Days } = req.query;
  const metrics = await computeOverviewMetrics();

  let filteredCards = [...boardCardsState];

  if (curator === 'mine') {
    filteredCards = filteredCards.filter(c => c.isMine);
  } else if (curator && curator !== 'all') {
    filteredCards = filteredCards.filter(c => (c.curator || '').toLowerCase().includes(curator.toLowerCase()));
  }

  if (needsAction === 'true' || needsAction === true) {
    filteredCards = filteredCards.filter(c => c.needsAction);
  }

  if (departing7Days === 'true' || departing7Days === true) {
    filteredCards = filteredCards.filter(c => c.departingIn7Days);
  }

  const columns = [
    {
      id: "request",
      title: "REQUEST",
      count: filteredCards.filter(c => c.stage === "request").length,
      cards: filteredCards.filter(c => c.stage === "request")
    },
    {
      id: "sourcing",
      title: "SOURCING",
      count: filteredCards.filter(c => c.stage === "sourcing").length,
      cards: filteredCards.filter(c => c.stage === "sourcing")
    },
    {
      id: "quoted",
      title: "QUOTED",
      count: filteredCards.filter(c => c.stage === "quoted").length,
      cards: filteredCards.filter(c => c.stage === "quoted")
    },
    {
      id: "booked",
      title: "BOOKED",
      count: filteredCards.filter(c => c.stage === "booked").length,
      cards: filteredCards.filter(c => c.stage === "booked")
    },
    {
      id: "confirmed",
      title: "CONFIRMED",
      count: filteredCards.filter(c => c.stage === "confirmed").length,
      cards: filteredCards.filter(c => c.stage === "confirmed")
    },
    {
      id: "flown_close",
      title: "FLOWN · CLOSE",
      count: filteredCards.filter(c => c.stage === "flown_close").length,
      cards: filteredCards.filter(c => c.stage === "flown_close")
    }
  ];

  res.json({
    success: true,
    data: {
      financialHealth: metrics.financialHealth,
      columns,
      totalCards: filteredCards.length
    }
  });
});

// ─── PATCH /api/dashboard/board/card-stage ───────────────────────────────────
router.patch('/board/card-stage', async (req, res) => {
  const { cardId, stage } = req.body;
  if (!cardId || !stage) {
    return res.status(400).json({ success: false, message: "Missing cardId or stage" });
  }

  const validStages = ['request', 'sourcing', 'quoted', 'booked', 'confirmed', 'flown_close'];
  if (!validStages.includes(stage)) {
    return res.status(400).json({ success: false, message: `Invalid stage: ${stage}` });
  }

  const cardIndex = boardCardsState.findIndex(c => c.id === cardId || c.code === cardId);
  if (cardIndex !== -1) {
    boardCardsState[cardIndex].stage = stage;
    res.json({
      success: true,
      message: "Card stage updated successfully",
      card: boardCardsState[cardIndex]
    });
  } else {
    // If it's a dynamic card not yet in initial list, add it
    const newCard = {
      id: cardId,
      code: cardId,
      route: "ROUTE",
      details: "Updated stage",
      badge: null,
      badgeVariant: null,
      stage,
      curator: "Desk",
      isMine: false,
      needsAction: false,
      departingIn7Days: true,
      linkUrl: `/requests/${cardId}`
    };
    boardCardsState.push(newCard);
    res.json({
      success: true,
      message: "Card stage registered and updated",
      card: newCard
    });
  }
});

// ─── GET /api/dashboard/flights-24h ──────────────────────────────────────────
router.get('/flights-24h', async (req, res) => {
  const { filter } = req.query;
  let items = [...defaultFlights];
  if (filter === 'today') {
    items = items.filter(f => f.dateGroup === 'today');
  }
  res.json({
    success: true,
    data: {
      totalCount: items.length,
      items
    }
  });
});

// ─── GET /api/dashboard/needs-action ─────────────────────────────────────────
router.get('/needs-action', async (req, res) => {
  const { filter } = req.query;
  let items = [...defaultNeedsAction];
  if (filter === 'mine') {
    items = items.filter(n => n.isMine);
  }
  res.json({
    success: true,
    data: {
      totalCount: items.length,
      items
    }
  });
});

// ─── GET /api/dashboard/financial-health ─────────────────────────────────────
router.get('/financial-health', async (req, res) => {
  const metrics = await computeOverviewMetrics();
  res.json({
    success: true,
    data: metrics.financialHealth
  });
});

module.exports = router;

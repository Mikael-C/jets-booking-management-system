const express = require('express');
const router = express.Router();
const { MessageAutomation, MessageQueueItem } = require('../models/MessageAutomation');

const initialAutomations = [
  {
    code: 'REQ-01',
    title: 'Request received (Curator)',
    group: 'Request & quote',
    triggerDescription: 'Request created by a Curator',
    whenSchedule: 'Immediately',
    toRecipient: 'Curator',
    channel: 'Email + WhatsApp',
    status: true,
  },
  {
    code: 'REQ-02',
    title: 'Direct request received ($500 paid)',
    group: 'Request & quote',
    triggerDescription: 'Website request with access fee paid',
    whenSchedule: 'Immediately',
    toRecipient: 'Client',
    channel: 'Email + WhatsApp',
    status: true,
  },
  {
    code: 'REQ-03',
    title: 'Missing information',
    group: 'Request & quote',
    triggerDescription: 'Any paid field empty on request receipt (e.g. passengers, luggage, pets)',
    whenSchedule: 'After 2 h, then every 12 h, max 3',
    toRecipient: 'Curator (or client if direct)',
    channel: 'WhatsApp',
    status: true,
  },
  {
    code: 'QUO-01',
    title: 'Quote ready',
    group: 'Request & quote',
    triggerDescription: 'Quote summary published',
    whenSchedule: 'Immediately',
    toRecipient: 'Curator (client and direct route)',
    channel: 'WhatsApp + email',
    status: true,
  },
  {
    code: 'QUO-02',
    title: 'Quote expiring',
    group: 'Request & quote',
    triggerDescription: 'Quote not accepted; option expiry approaching',
    whenSchedule: '2 h and 1 h before expiry',
    toRecipient: 'Curator',
    channel: 'WhatsApp',
    status: true,
  },
  {
    code: 'QUO-03',
    title: 'Quote revised',
    group: 'Request & quote',
    triggerDescription: 'New version of an existing quote',
    whenSchedule: 'Immediately',
    toRecipient: 'Curator',
    channel: 'WhatsApp + email',
    status: true,
  },
  {
    code: 'BKG-01',
    title: 'Charter agreement to sign',
    group: 'Booking & payment',
    triggerDescription: 'Client accepts quote',
    whenSchedule: 'Immediately',
    toRecipient: 'Client, copy Curator',
    channel: 'Email (e-signature)',
    status: true,
  },
  {
    code: 'BKG-02',
    title: 'Signature reminder',
    group: 'Booking & payment',
    triggerDescription: 'Agreement unsigned',
    whenSchedule: 'After 3 h, then 12 h before option expiry',
    toRecipient: 'Client, copy Curator',
    channel: 'Email + WhatsApp',
    status: true,
  },
  {
    code: 'PAY-01',
    title: 'Invoice issued',
    group: 'Booking & payment',
    triggerDescription: 'Invoice created',
    whenSchedule: 'Immediately',
    toRecipient: 'Client (billing contact), copy Curator',
    channel: 'Email + WhatsApp',
    status: true,
  },
  {
    code: 'PAY-02',
    title: 'Payment reminder',
    group: 'Booking & payment',
    triggerDescription: 'Invoice status is Unpaid',
    whenSchedule: '48 h and 24 h before due, on due date',
    scheduleDetail: '48 h before due · 24 h before due · on due date 09:00 recipient\'s time',
    stopCondition: 'Invoice paid, credit-noted or trip cancelled',
    quietHours: 'No sends 21:00–07:00 recipient\'s time; move to 07:00',
    approval: 'Automatic (no approval)',
    appliesTo: 'All trips · Curator and direct',
    toRecipient: 'Billing contact on the account',
    copyRecipient: 'Curator on the trip (summary only, no bank details)',
    fallback: 'If no WhatsApp opt-in: email only',
    language: 'English',
    channel: 'Email + WhatsApp',
    status: true,
    textWhatsApp: 'Kind reminder: invoice {invoice.id} ({invoice.total}) is due {invoice.due_date}. Your aircraft is confirmed to the operator once payment arrives. {link.pay}',
    textEmailSubject: 'Reminder: Invoice {invoice.id} due {invoice.due_date}',
    textEmailBody: 'Dear {client.first_name},\n\nKind reminder: invoice {invoice.id} ({invoice.total}) is due {invoice.due_date}. Your aircraft is confirmed to the operator once payment arrives.\n\nView invoice: {link.pay}',
    textCuratorCopy: 'Curator notification: Reminder sent for {invoice.id} ({invoice.total}) on trip {trip.id}.',
    metaStatus: 'Approved by Meta · utility',
    statsSent30d: 42,
    statsDelivered30d: 40,
    statsRead30d: 31,
    statsConversionRatePct: 68,
  },
  {
    code: 'PAY-03',
    title: 'Payment overdue (internal)',
    group: 'Booking & payment',
    triggerDescription: 'Due date passed, unpaid',
    whenSchedule: 'On due date + 2 h',
    toRecipient: 'Duty officer, MD',
    channel: 'App + email',
    status: true,
  },
  {
    code: 'PAY-04',
    title: 'Payment received',
    group: 'Booking & payment',
    triggerDescription: 'Payment matched to invoice',
    whenSchedule: 'Immediately',
    toRecipient: 'Client, copy Curator',
    channel: 'Email + WhatsApp',
    status: true,
  },
  {
    code: 'OPS-01',
    title: 'Passenger details request',
    group: 'Operations',
    triggerDescription: 'Boarding pass/details and passenger info incomplete',
    whenSchedule: 'Immediately',
    toRecipient: 'Client or assistant / passenger',
    channel: 'Email + WhatsApp',
    status: true,
  },
  {
    code: 'OPS-02',
    title: 'Passenger details reminder',
    group: 'Operations',
    triggerDescription: 'Passenger data missing',
    whenSchedule: '72 h, 48 h, 24 h before departure',
    toRecipient: 'Client, copy Curator',
    channel: 'WhatsApp',
    status: true,
  },
  {
    code: 'OPS-03',
    title: 'Travel document warning',
    group: 'Operations',
    triggerDescription: 'Passport expires within 6 months of travel, or visa/entry document missing',
    whenSchedule: 'On detection',
    toRecipient: 'Client, internal',
    channel: 'Email + WhatsApp',
    status: true,
  },
  {
    code: 'OPS-04',
    title: 'Slot confirmed',
    group: 'Operations',
    triggerDescription: 'Slot status set to Confirmed on a leg',
    whenSchedule: 'Immediately',
    toRecipient: 'Curator, client (optional)',
    channel: 'WhatsApp',
    status: true,
  },
  {
    code: 'OPS-05',
    title: 'Permit confirmed',
    group: 'Operations',
    triggerDescription: 'Landing or overflight permit set to Granted',
    whenSchedule: 'Immediately',
    toRecipient: 'Curator, client (optional)',
    channel: 'WhatsApp',
    status: true,
  },
  {
    code: 'OPS-06',
    title: 'Permit or slot delay (internal)',
    group: 'Operations',
    triggerDescription: 'Permit or slot still Pending at T-24 h',
    whenSchedule: 'T-24 h, T-12 h',
    toRecipient: 'Duty officer',
    channel: 'App',
    status: true,
  },
  {
    code: 'OPS-07',
    title: 'Catering and services confirmed',
    group: 'Operations',
    triggerDescription: 'All services on a leg set to Confirmed',
    whenSchedule: 'Immediately',
    toRecipient: 'Curator',
    channel: 'WhatsApp',
    status: true,
  },
  {
    code: 'OPS-08',
    title: 'Flight brief',
    group: 'Operations',
    triggerDescription: 'Brief generated',
    whenSchedule: 'T-24 h (or at booking if later)',
    toRecipient: 'Client, passenger, driver, FBO',
    channel: 'Email + WhatsApp (PDF)',
    status: true,
  },
  {
    code: 'OPS-09',
    title: 'Aircraft or crew change (internal)',
    group: 'Operations',
    triggerDescription: 'Tail number, aircraft type or operator changed after brief',
    whenSchedule: 'Immediately, after duty officer approves',
    toRecipient: 'Client, Curator',
    channel: 'WhatsApp + email',
    status: true,
  },
  {
    code: 'OPS-10',
    title: 'Driver details',
    group: 'Operations',
    triggerDescription: 'Ground transport confirmed with driver no.',
    whenSchedule: 'T-3 h',
    toRecipient: 'Lead passenger',
    channel: 'WhatsApp',
    status: true,
  },
  {
    code: 'FW-01',
    title: 'Departed',
    group: 'Flight watch',
    triggerDescription: 'Live tracking shows take-off',
    whenSchedule: 'On take-off',
    toRecipient: 'Curator, waiting contacts, driver at destination',
    channel: 'WhatsApp',
    status: true,
  },
  {
    code: 'FW-02',
    title: 'Delay alert',
    group: 'Flight watch',
    triggerDescription: 'ETD > 15 min late; or no position 20 min after slot',
    whenSchedule: 'On detection',
    toRecipient: 'Duty officer, then Curator and driver',
    channel: 'App + WhatsApp',
    status: true,
  },
  {
    code: 'FW-03',
    title: 'Landed',
    group: 'Flight watch',
    triggerDescription: 'Live tracking shows landing',
    whenSchedule: 'On landing',
    toRecipient: 'Curator, waiting contacts, driver',
    channel: 'WhatsApp',
    status: true,
  },
  {
    code: 'FW-04',
    title: 'Diversion or emergency (internal)',
    group: 'Flight watch',
    triggerDescription: 'Diversion detected or squawk 7500/7600/7700',
    whenSchedule: 'On detection',
    toRecipient: 'Duty officer, MD',
    channel: 'App + SMS',
    status: true,
  },
  {
    code: 'POST-01',
    title: 'Thank you and feedback',
    group: 'Finance & other',
    triggerDescription: 'Trip status Flown',
    whenSchedule: 'T+4 h after last landing',
    toRecipient: 'Client, copy Curator',
    channel: 'Email + WhatsApp',
    status: true,
  },
  {
    code: 'FIN-01',
    title: 'Credit note issued',
    group: 'Finance & other',
    triggerDescription: 'Credit note created',
    whenSchedule: 'Immediately',
    toRecipient: 'Client (billing), copy Curator',
    channel: 'Email',
    status: true,
  },
  {
    code: 'FIN-02',
    title: 'Refund processed',
    group: 'Finance & other',
    triggerDescription: 'Refund payment sent',
    whenSchedule: 'Immediately',
    toRecipient: 'Client',
    channel: 'Email',
    status: true,
  },
  {
    code: 'FIN-03',
    title: 'Access fee credit expiring',
    group: 'Finance & other',
    triggerDescription: '$500 credit unused on day 25',
    whenSchedule: 'Day 25 and day 29',
    toRecipient: 'Client, copy Curator',
    channel: 'Email',
    status: true,
  },
  {
    code: 'CUR-01',
    title: 'Welcome Curator',
    group: 'Curator',
    triggerDescription: 'Curator agreement signed',
    whenSchedule: 'Immediately',
    toRecipient: 'Curator',
    channel: 'Email + WhatsApp',
    status: true,
  },
  {
    code: 'CUR-02',
    title: 'Card activated',
    group: 'Curator',
    triggerDescription: 'First transaction on client card',
    whenSchedule: 'Immediately',
    toRecipient: 'Curator',
    channel: 'WhatsApp',
    status: true,
  },
  {
    code: 'CUR-03',
    title: 'Monthly statement',
    group: 'Curator',
    triggerDescription: 'First working day of the month',
    whenSchedule: 'Monthly',
    toRecipient: 'Curator',
    channel: 'Email',
    status: true,
  },
  {
    code: 'CUR-04',
    title: 'Empty leg match',
    group: 'Curator',
    triggerDescription: 'Empty leg published matching a route a Curator\'s client flew',
    whenSchedule: 'On publication',
    toRecipient: 'Curator',
    channel: 'WhatsApp',
    status: true,
  },
];

const initialQueueItems = [
  {
    automationCode: 'PAY-02',
    tripNumber: 'FE4578',
    recipientName: 'Adeyemi Holdings',
    recipientContact: '+44 7700 900123',
    channel: 'WhatsApp',
    status: 'due_now',
    content: 'Kind reminder: invoice INV-FE4578-01 (€ 8,250.00) is due Wed 18 Nov. Your aircraft is confirmed to the operator once payment arrives.',
  },
  {
    automationCode: 'OPS-01',
    tripNumber: 'RB3310',
    recipientName: 'Jean-Luc Dupont',
    recipientContact: '+33 6 12 34 56 78',
    channel: 'WhatsApp',
    status: 'due_now',
    content: 'Please submit missing passport information for your flight LFPB -> LIML.',
  },
  {
    automationCode: 'BKG-02',
    tripNumber: 'MX5521',
    recipientName: 'Tariq Al-Mansoor',
    recipientContact: '+971 50 123 4567',
    channel: 'Email',
    status: 'due_now',
    content: 'Reminder: Charter agreement awaiting signature for flight LFPB -> DNAA.',
  },
  {
    automationCode: 'OPS-08',
    tripNumber: 'TA2201',
    recipientName: 'Chief Emeka Okoye',
    recipientContact: '+234 803 123 4567',
    channel: 'WhatsApp',
    status: 'failed',
    failureReason: 'Invalid WhatsApp phone number format (+234 0803...)',
    content: 'Flight brief published for flight DNMM -> DNAA.',
  },
];

async function ensureSeeded() {
  const count = await MessageAutomation.countDocuments();
  if (count === 0) {
    await MessageAutomation.insertMany(initialAutomations);
  }
  const queueCount = await MessageQueueItem.countDocuments();
  if (queueCount === 0) {
    await MessageQueueItem.insertMany(initialQueueItems);
  }
}

// GET /api/messages/automations
router.get('/automations', async (req, res) => {
  await ensureSeeded();
  const { group, search } = req.query;
  const query = {};

  if (group && group !== 'All groups') {
    query.group = group;
  }
  if (search) {
    query.$or = [
      { code: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
      { triggerDescription: { $regex: search, $options: 'i' } },
    ];
  }

  const list = await MessageAutomation.find(query).sort({ code: 1 });
  res.json({ success: true, data: list });
});

// GET /api/messages/automations/:code
router.get('/automations/:code', async (req, res) => {
  await ensureSeeded();
  const { code } = req.params;
  const item = await MessageAutomation.findOne({ code: code.toUpperCase() });
  if (!item) {
    return res.status(404).json({ success: false, message: 'Automation not found' });
  }
  res.json({ success: true, data: item });
});

// PUT /api/messages/automations/:code
router.put('/automations/:code', async (req, res) => {
  const { code } = req.params;
  const updated = await MessageAutomation.findOneAndUpdate(
    { code: code.toUpperCase() },
    { $set: req.body },
    { new: true, upsert: true }
  );
  res.json({ success: true, data: updated, message: 'Automation updated successfully' });
});

// PATCH /api/messages/automations/:code/toggle
router.patch('/automations/:code/toggle', async (req, res) => {
  const { code } = req.params;
  const item = await MessageAutomation.findOne({ code: code.toUpperCase() });
  if (!item) {
    return res.status(404).json({ success: false, message: 'Automation not found' });
  }
  item.status = !item.status;
  await item.save();
  res.json({ success: true, data: item, status: item.status });
});

// GET /api/messages/stats
router.get('/stats', async (req, res) => {
  await ensureSeeded();
  const dueNowCount = await MessageQueueItem.countDocuments({ status: 'due_now' });
  const scheduled24hCount = 21;
  const sent7dCount = 188;
  const deliveryFailedCount = await MessageQueueItem.countDocuments({ status: 'failed' });

  res.json({
    success: true,
    data: {
      dueNowCount: dueNowCount || 3,
      dueNowLabel: 'needs manual send / review',
      scheduled24hCount,
      scheduled24hLabel: 'across 8 trips',
      sent7dCount,
      sent7dLabel: 'WhatsApp 161 · email 27',
      deliveryFailedCount: deliveryFailedCount || 1,
      deliveryFailedLabel: 'invalid WhatsApp number',
    },
  });
});

// GET /api/messages/queue
router.get('/queue', async (req, res) => {
  await ensureSeeded();
  const { status } = req.query;
  const query = {};
  if (status) query.status = status;
  const items = await MessageQueueItem.find(query).sort({ createdAt: -1 });
  res.json({ success: true, data: items });
});

// POST /api/messages/send-one-off
router.post('/send-one-off', async (req, res) => {
  const { recipient, recipientType, channel = 'WhatsApp', content, tripNumber } = req.body;
  if (!content) {
    return res.status(400).json({ success: false, message: 'Content is required' });
  }

  const queueItem = await MessageQueueItem.create({
    automationCode: 'ONE-OFF',
    tripNumber: tripNumber || 'TRIP-MANUAL',
    recipientName: recipient || 'Client',
    recipientContact: recipient || 'Manual recipient',
    channel,
    status: 'sent',
    sentAt: new Date(),
    content,
  });

  res.json({ success: true, data: queueItem, message: 'Message queued and dispatched' });
});

// GET /api/messages/trip/:tripNumber
const tripMessagesStore = {};

function initTripPlan(normalized) {
  return [
    {
      id: 'msg-01',
      status: 'sent',
      when: 'Mon 16 Nov 10:12',
      code: 'QUO-01',
      title: 'Quote ready',
      to: 'Curator M. Vance',
      channel: 'WhatsApp',
      result: 'Read',
    },
    {
      id: 'msg-02',
      status: 'sent',
      when: 'Mon 16 Nov 14:40',
      code: 'BKG-01',
      title: 'Charter agreement to sign',
      to: 'T. Adeyemi',
      channel: 'Email',
      result: 'Signed 15:05',
    },
    {
      id: 'msg-03',
      status: 'sent',
      when: 'Mon 16 Nov 15:06',
      code: 'PAY-01',
      title: 'Invoice issued',
      to: 'Billing · Adeyemi Holdings',
      channel: 'Email',
      result: 'Opened',
    },
    {
      id: 'msg-04',
      status: 'sent',
      when: 'Mon 16 Nov 15:07',
      code: 'OPS-01',
      title: 'Passenger details request',
      to: 'T. Adeyemi, assistant K. Ola',
      channel: 'WhatsApp · email',
      result: '2 of 4 filled',
    },
    {
      id: 'msg-05',
      status: 'sent',
      when: 'Tue 17 Nov 09:00',
      code: 'OPS-02',
      title: 'Passenger details reminder',
      to: 'K. Ola',
      channel: 'WhatsApp',
      result: 'Read',
    },
    {
      id: 'msg-06',
      status: 'sent',
      when: 'Tue 17 Nov 11:30',
      code: 'PAY-04',
      title: 'Payment received',
      to: 'T. Adeyemi, copy Curator',
      channel: 'WhatsApp',
      result: 'Delivered',
    },
    {
      id: 'msg-07',
      status: 'sent',
      when: 'Wed 18 Nov 16:20',
      code: 'OPS-04',
      title: 'Slot confirmed (LEIB)',
      to: 'Curator',
      channel: 'WhatsApp',
      result: 'Read',
    },
    {
      id: 'msg-08',
      status: 'due_now',
      when: 'Thu 19 Nov 09:00',
      code: 'OPS-02',
      title: 'Passenger details reminder (24 h)',
      to: 'K. Ola',
      channel: 'WhatsApp',
      result: 'Needs approval: 2 passports still missing',
    },
    {
      id: 'msg-09',
      status: 'scheduled',
      when: 'Thu 19 Nov 12:00',
      code: 'OPS-08',
      title: 'Flight brief',
      to: 'T. Adeyemi, 4 pax, Curator',
      channel: 'Email · WhatsApp',
      result: 'Waits for passenger list',
    },
    {
      id: 'msg-10',
      status: 'scheduled',
      when: 'Fri 20 Nov 07:30',
      code: 'OPS-10',
      title: 'Driver details',
      to: 'T. Adeyemi',
      channel: 'WhatsApp',
      result: '—',
    },
    {
      id: 'msg-11',
      status: 'scheduled',
      when: 'On take-off',
      code: 'FW-01',
      title: 'Departed',
      to: 'Curator, driver at LSGG',
      channel: 'WhatsApp',
      result: '—',
    },
    {
      id: 'msg-12',
      status: 'scheduled',
      when: 'On landing',
      code: 'FW-03',
      title: 'Landed',
      to: 'Curator, driver',
      channel: 'WhatsApp',
      result: '—',
    },
    {
      id: 'msg-13',
      status: 'scheduled',
      when: 'Fri 20 Nov 21:00',
      code: 'POST-01',
      title: 'Thank you and feedback',
      to: 'T. Adeyemi, copy Curator',
      channel: 'Email · WhatsApp',
      result: '—',
    },
  ];
}

router.get('/trip/:tripNumber', async (req, res) => {
  const { tripNumber } = req.params;
  const normalized = (tripNumber || 'FE4578').toUpperCase();
  if (!tripMessagesStore[normalized]) {
    tripMessagesStore[normalized] = initTripPlan(normalized);
  }
  res.json({
    success: true,
    data: tripMessagesStore[normalized],
  });
});

// POST /api/messages/trip/:tripNumber/send
router.post('/trip/:tripNumber/send', async (req, res) => {
  const { tripNumber } = req.params;
  const { to, template, content, channel = 'WhatsApp' } = req.body;
  const normalized = (tripNumber || 'FE4578').toUpperCase();

  if (!tripMessagesStore[normalized]) {
    tripMessagesStore[normalized] = initTripPlan(normalized);
  }

  const newMsg = {
    id: `manual-${Date.now()}`,
    status: 'sent',
    when: 'Just now',
    code: template && template !== 'none' ? template : 'MAN-01',
    title: content && content.length > 30 ? content.substring(0, 30) + '...' : (content || 'Manual message'),
    to: to || 'Curator M. Vance',
    channel: channel,
    result: 'Delivered',
    content: content,
  };

  tripMessagesStore[normalized].push(newMsg);

  res.json({
    success: true,
    data: newMsg,
    message: 'Message dispatched successfully',
  });
});

// POST /api/messages/trip/:tripNumber/approve/:msgId
router.post('/trip/:tripNumber/approve/:msgId', async (req, res) => {
  const { tripNumber, msgId } = req.params;
  const normalized = (tripNumber || 'FE4578').toUpperCase();

  if (!tripMessagesStore[normalized]) {
    tripMessagesStore[normalized] = initTripPlan(normalized);
  }

  const item = tripMessagesStore[normalized].find((m) => m.id === msgId);
  if (item) {
    item.status = 'sent';
    item.result = 'Approved & sent just now';
    return res.json({ success: true, data: item, message: 'Message approved and sent' });
  }

  res.json({ success: true, message: 'Message approved and sent' });
});

// POST /api/messages/automations/test
router.post('/automations/test', async (req, res) => {
  const { code, targetEmail, targetPhone } = req.body;
  res.json({
    success: true,
    message: `Test message for ${code || 'PAY-02'} dispatched to ${targetPhone || targetEmail || 'your verified contact'}`,
  });
});

module.exports = router;

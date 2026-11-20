const mongoose = require('mongoose');

const messageAutomationSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // e.g. PAY-02, REQ-01, OPS-01
  title: { type: String, required: true }, // e.g. Payment reminder
  group: {
    type: String,
    enum: [
      'Request & quote',
      'Booking & payment',
      'Operations',
      'Flight watch',
      'Finance & other',
      'Curator',
    ],
    default: 'Booking & payment',
  },
  triggerDescription: { type: String, default: '' },
  whenSchedule: { type: String, default: 'Immediately' },
  scheduleDetail: { type: String, default: '48 h before due · 24 h before due · on due date 09:00 recipient\'s time' },
  stopCondition: { type: String, default: 'Invoice paid, credit-noted or trip cancelled' },
  quietHours: { type: String, default: 'No sends 21:00–07:00 recipient\'s time; move to 07:00' },
  approval: { type: String, default: 'Automatic (no approval)' },
  appliesTo: { type: String, default: 'All trips · Curator and direct' },
  toRecipient: { type: String, default: 'Billing contact on the account' },
  copyRecipient: { type: String, default: 'Curator on the trip (summary only, no bank details)' },
  fallback: { type: String, default: 'If no WhatsApp opt-in: email only' },
  language: { type: String, default: 'English' },
  channel: { type: String, default: 'Email + WhatsApp' },
  primaryChannel: { type: String, enum: ['whatsapp', 'email', 'app', 'multi'], default: 'whatsapp' },
  status: { type: Boolean, default: true }, // active toggle

  // Content Templates
  textWhatsApp: {
    type: String,
    default: 'Kind reminder: invoice {invoice.id} ({invoice.total}) is due {invoice.due_date}. Your aircraft is confirmed to the operator once payment arrives. {link.pay}',
  },
  textEmailSubject: {
    type: String,
    default: 'Reminder: Invoice {invoice.id} due {invoice.due_date}',
  },
  textEmailBody: {
    type: String,
    default: 'Dear {client.first_name},\n\nThis is a reminder that invoice {invoice.id} for {invoice.total} on trip {trip.id} ({route}) is due on {invoice.due_date}.\n\nTo view and pay your invoice, please visit: {link.pay}\n\nWarm regards,\nOrbAero Flight Team',
  },
  textCuratorCopy: {
    type: String,
    default: 'Notice: Payment reminder sent to {client.first_name} for trip {trip.id} ({route}). Due date: {invoice.due_date}.',
  },
  metaStatus: { type: String, default: 'Approved by Meta · utility' },

  // Stats
  statsSent30d: { type: Number, default: 42 },
  statsDelivered30d: { type: Number, default: 40 },
  statsRead30d: { type: Number, default: 31 },
  statsConversionRatePct: { type: Number, default: 68 },
}, {
  timestamps: true,
});

const messageQueueSchema = new mongoose.Schema({
  automationCode: { type: String, default: 'PAY-02' },
  tripNumber: { type: String, default: 'FE4578' },
  recipientName: { type: String, default: 'Adeyemi Holdings' },
  recipientContact: { type: String, default: '+44 7700 900123' },
  channel: { type: String, default: 'WhatsApp' },
  scheduledFor: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['due_now', 'scheduled', 'sent', 'failed'],
    default: 'due_now',
  },
  failureReason: { type: String, default: '' },
  sentAt: { type: Date, default: null },
  content: { type: String, default: '' },
}, {
  timestamps: true,
});

const MessageAutomation = mongoose.model('MessageAutomation', messageAutomationSchema);
const MessageQueueItem = mongoose.model('MessageQueueItem', messageQueueSchema);

module.exports = {
  MessageAutomation,
  MessageQueueItem,
};

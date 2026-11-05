const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userEmail: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: [
        'booking_created', 'booking_updated', 'booking_status_changed',
        'payment_received', 'quote_sent', 'quote_accepted', 'quote_declined',
        'agent_request_created', 'agent_request_updated',
        'operator_expiry_alert', 'aoc_expiry_alert',
        'checklist_completed', 'document_generated',
        'system', 'info', 'warning', 'error',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    entityId: { type: String, default: '' },
    entityType: { type: String, default: '' },
    link: { type: String, default: '' },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userEmail: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;

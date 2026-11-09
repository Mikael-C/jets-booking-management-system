const mongoose = require('mongoose');

const messageAttachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, default: '' },
    type: { type: String, default: 'document' }, // document, image, quote, brief, invoice
    tripNumber: { type: String, default: '' },
    docType: { type: String, default: '' },
    fileSize: { type: String, default: '' },
  },
  { _id: true }
);

const messageSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    channel: {
      type: String,
      default: 'operations',
      index: true,
    }, // 'operations', 'broker_desk', 'finance', 'client_services', or 'direct'
    senderId: { type: String, default: '' },
    senderName: { type: String, required: true },
    senderEmail: { type: String, required: true, index: true },
    senderRole: {
      type: String,
      enum: ['super_admin', 'admin', 'finance', 'operations', 'agent', 'client', 'system'],
      default: 'operations',
    },
    recipientEmail: { type: String, default: '', index: true },
    recipientName: { type: String, default: '' },
    recipientRole: { type: String, default: '' },
    content: { type: String, required: true },
    tripNumber: { type: String, default: '', index: true },
    requestId: { type: String, default: '', index: true },
    attachments: { type: [messageAttachmentSchema], default: [] },
    readBy: [
      {
        userEmail: { type: String, required: true },
        readAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

messageSchema.index({ createdAt: -1 });
messageSchema.index({ channel: 1, createdAt: -1 });
messageSchema.index({ senderEmail: 1, recipientEmail: 1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;

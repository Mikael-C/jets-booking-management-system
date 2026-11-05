const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now, index: true },
    userEmail: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userRole: { type: String, default: '' },
    action: { type: String, required: true, index: true },
    entityType: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    entityId: { type: String, default: '', index: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    changes: {
      before: { type: mongoose.Schema.Types.Mixed, default: null },
      after: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    success: { type: Boolean, default: true },
  },
  {
    timestamps: false,
    collection: 'audit_logs',
  }
);

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ userEmail: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;

const AuditLog = require('../models/AuditLog');
const logger = require('../middleware/logger');

/**
 * Create an audit log entry
 */
const createAuditEntry = async ({
  user,
  action,
  entityType,
  entityId = '',
  details = {},
  changes = { before: null, after: null },
  req = null,
}) => {
  try {
    const entry = await AuditLog.create({
      timestamp: new Date(),
      userEmail: user?.email || 'system',
      userName: user?.name || 'System',
      userRole: user?.role || 'system',
      action,
      entityType,
      entityId: String(entityId),
      details,
      changes,
      ipAddress: req ? (req.headers['x-forwarded-for'] || req.ip || '') : '',
      userAgent: req ? (req.headers['user-agent'] || '') : '',
      success: true,
    });
    return entry;
  } catch (error) {
    logger.error(`Failed to create audit log: ${error.message}`);
    // Don't throw — audit logging should never break the main flow
    return null;
  }
};

/**
 * Log a booking action
 */
const logBookingAction = (user, action, booking, req = null) =>
  createAuditEntry({
    user,
    action,
    entityType: 'booking',
    entityId: booking._id || booking.id,
    details: {
      tripNumber: booking.tripNumber,
      status: booking.status,
      clientName: booking.client?.fullName,
    },
    req,
  });

/**
 * Log a status change
 */
const logStatusChange = (user, entityType, entityId, oldStatus, newStatus, req = null) =>
  createAuditEntry({
    user,
    action: `${entityType}_status_changed`,
    entityType,
    entityId,
    details: { oldStatus, newStatus },
    changes: {
      before: { status: oldStatus },
      after: { status: newStatus },
    },
    req,
  });

/**
 * Log authentication event
 */
const logAuthEvent = (user, action, req = null) =>
  createAuditEntry({
    user,
    action,
    entityType: 'user',
    entityId: user?._id || '',
    details: { email: user?.email },
    req,
  });

/**
 * Get paginated audit logs with filters
 */
const getAuditLogs = async ({
  page = 1,
  limit = 50,
  entityType,
  entityId,
  userEmail,
  action,
  startDate,
  endDate,
}) => {
  const filter = {};
  if (entityType) filter.entityType = entityType;
  if (entityId) filter.entityId = entityId;
  if (userEmail) filter.userEmail = new RegExp(userEmail, 'i');
  if (action) filter.action = new RegExp(action, 'i');
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = new Date(startDate);
    if (endDate) filter.timestamp.$lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

module.exports = {
  createAuditEntry,
  logBookingAction,
  logStatusChange,
  logAuthEvent,
  getAuditLogs,
};

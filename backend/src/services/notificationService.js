const Notification = require('../models/Notification');
const logger = require('../middleware/logger');

/**
 * Create a notification for a user
 */
const createNotification = async ({
  userId,
  userEmail,
  type,
  title,
  message,
  entityId = '',
  entityType = '',
  link = '',
  priority = 'medium',
}) => {
  try {
    const notification = await Notification.create({
      userId,
      userEmail,
      type,
      title,
      message,
      entityId,
      entityType,
      link,
      priority,
      read: false,
    });
    return notification;
  } catch (error) {
    logger.error(`Failed to create notification: ${error.message}`);
    return null;
  }
};

/**
 * Notify all admins and super_admins about an event
 */
const notifyAdmins = async (User, type, title, message, options = {}) => {
  try {
    const admins = await User.find({ role: { $in: ['super_admin', 'admin'] }, isActive: true }).lean();
    const notifications = admins.map((admin) =>
      createNotification({
        userId: admin._id,
        userEmail: admin.email,
        type,
        title,
        message,
        ...options,
      })
    );
    await Promise.allSettled(notifications);
  } catch (error) {
    logger.error(`Failed to notify admins: ${error.message}`);
  }
};

/**
 * Notify operations team
 */
const notifyOperations = async (User, type, title, message, options = {}) => {
  try {
    const ops = await User.find({ role: { $in: ['super_admin', 'admin', 'operations'] }, isActive: true }).lean();
    const notifications = ops.map((user) =>
      createNotification({
        userId: user._id,
        userEmail: user.email,
        type,
        title,
        message,
        ...options,
      })
    );
    await Promise.allSettled(notifications);
  } catch (error) {
    logger.error(`Failed to notify operations: ${error.message}`);
  }
};

/**
 * Get notifications for a user
 */
const getUserNotifications = async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
  const filter = { userId };
  if (unreadOnly) filter.read = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, read: false }),
  ]);

  return { notifications, total, unreadCount, page, totalPages: Math.ceil(total / limit) };
};

/**
 * Mark a notification as read
 */
const markAsRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { new: true }
  );
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
  return Notification.updateMany({ userId, read: false }, { read: true });
};

/**
 * Delete a notification
 */
const deleteNotification = async (notificationId, userId) => {
  return Notification.findOneAndDelete({ _id: notificationId, userId });
};

module.exports = {
  createNotification,
  notifyAdmins,
  notifyOperations,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

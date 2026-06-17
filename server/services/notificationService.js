const Notification = require('../models/Notification');

/**
 * Create and optionally push a real-time notification via Socket.io
 */
const createNotification = async ({ recipient, sender = null, title, message, type, relatedComplaint = null, link = '', io = null }) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      title,
      message,
      type,
      relatedComplaint,
      link,
    });

    // Emit to socket room if io is available
    if (io) {
      io.to(`user_${recipient}`).emit('notification:new', {
        notification: await notification.populate('sender', 'name profilePic'),
      });
    }

    return notification;
  } catch (error) {
    console.error('Notification creation error:', error.message);
  }
};

const markAsRead = async (notificationId, userId) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

const markAllAsRead = async (userId) => {
  return await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ recipient: userId, isRead: false });
};

module.exports = { createNotification, markAsRead, markAllAsRead, getUnreadCount };

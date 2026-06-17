const ActivityLog = require('../models/ActivityLog');

const logActivity = (action, targetType) => async (req, res, next) => {
  // Attach logging function to req for use in controllers
  req.logActivity = async (targetId, metadata = {}) => {
    try {
      await ActivityLog.create({
        action,
        performedBy: req.user._id,
        targetId,
        targetType,
        metadata,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      });
    } catch (error) {
      console.error('Activity log error:', error.message);
    }
  };
  next();
};

module.exports = { logActivity };

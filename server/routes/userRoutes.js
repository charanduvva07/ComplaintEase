const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  updatePreferences,
  getUserComplaints,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUserDashboard,
} = require('../controllers/userController');
const { protect } = require('../middlewares/auth');
const { uploadProfile } = require('../config/cloudinary');

router.use(protect);

router.get('/dashboard', getUserDashboard);
router.get('/profile', getProfile);
router.put('/profile', uploadProfile.single('profilePic'), updateProfile);
router.put('/change-password', changePassword);
router.put('/preferences', updatePreferences);
router.get('/complaints', getUserComplaints);
router.get('/notifications', getUserNotifications);
router.put('/notifications/read-all', markAllNotificationsRead);
router.put('/notifications/:id/read', markNotificationRead);

module.exports = router;

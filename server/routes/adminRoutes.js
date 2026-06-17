const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getAllComplaints,
  getAllUsers,
  toggleUserStatus,
  updateUserRole,
  getAnalytics,
  generateReport,
  getReports,
  getDepartments,
  createDepartment,
  updateDepartment,
  getAuditLogs,
  bulkUpdateComplaints,
  getStaff,
  assignStaff,
  verifyCompletion,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect, authorize('admin', 'staff'));

router.get('/dashboard', getDashboard);
router.get('/analytics', getAnalytics);

router.get('/complaints', getAllComplaints);
router.put('/complaints/:id/assign', assignStaff);
router.put('/complaints/:id/verify', verifyCompletion);
router.put('/complaints/bulk', authorize('admin'), bulkUpdateComplaints);

router.get('/users', authorize('admin'), getAllUsers);
router.put('/users/:id/status', authorize('admin'), toggleUserStatus);
router.put('/users/:id/role', authorize('admin'), updateUserRole);

router.get('/staff', getStaff);

router.post('/reports/generate', authorize('admin'), generateReport);
router.get('/reports', getReports);

router.get('/departments', getDepartments);
router.post('/departments', authorize('admin'), createDepartment);
router.put('/departments/:id', authorize('admin'), updateDepartment);

router.get('/audit-logs', authorize('admin'), getAuditLogs);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getAssignedComplaints,
  acceptComplaint,
  startWork,
  completeWork
} = require('../controllers/staffController');
const { protect, authorize } = require('../middlewares/auth');
const { uploadComplaint } = require('../config/cloudinary');

router.use(protect);
router.use(authorize('staff', 'admin'));

router.get('/complaints', getAssignedComplaints);
router.put('/complaints/:id/accept', acceptComplaint);
router.put('/complaints/:id/start', startWork);
router.put('/complaints/:id/complete', uploadComplaint.array('proofImages', 5), completeWork);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  submitComplaint,
  getComplaints,
  getComplaint,
  updateComplaint,
  deleteComplaint,
  addComment,
  getComments,
  rateComplaint,
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middlewares/auth');
const { uploadComplaint } = require('../config/cloudinary');

router.use(protect);

router
  .route('/')
  .get(getComplaints)
  .post(uploadComplaint.array('attachments', 10), submitComplaint);

router
  .route('/:id')
  .get(getComplaint)
  .put(authorize('admin', 'staff'), updateComplaint)
  .delete(deleteComplaint);

router
  .route('/:id/comments')
  .get(getComments)
  .post(uploadComplaint.array('attachments', 5), addComment);

router.post('/:id/rate', rateComplaint);

module.exports = router;

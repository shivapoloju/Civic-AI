const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { authMiddleware, authorize } = require('../middleware/auth');
const upload = require('../config/multer');

const complaintUploads = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'voice', maxCount: 1 }
]);

router.post('/', authMiddleware, authorize('citizen', 'admin'), complaintUploads, complaintController.createComplaint);
router.post('/analyze', authMiddleware, complaintUploads, complaintController.analyzeMedia);
router.get('/', authMiddleware, complaintController.listComplaints);
router.get('/:id', authMiddleware, complaintController.getComplaint);
router.post('/rate', authMiddleware, authorize('citizen', 'admin'), complaintController.rateAndClose);
router.post('/translate', authMiddleware, complaintController.translateText);

module.exports = router;

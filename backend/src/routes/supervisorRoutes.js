const express = require('express');
const router = express.Router();
const supervisorController = require('../controllers/supervisorController');
const { authMiddleware, authorize } = require('../middleware/auth');

router.get('/pending-verifications', authMiddleware, authorize('supervisor', 'officer', 'admin'), supervisorController.getPendingVerifications);
router.post('/compare-images', authMiddleware, authorize('supervisor', 'officer', 'admin'), supervisorController.verifyRepairImages);
router.post('/verify-decision', authMiddleware, authorize('supervisor', 'officer', 'admin'), supervisorController.processVerification);
router.post('/assign-worker', authMiddleware, authorize('supervisor', 'officer', 'admin'), supervisorController.assignWorker);
router.get('/available-workers', authMiddleware, authorize('supervisor', 'officer', 'admin'), supervisorController.getAvailableWorkers);
router.post('/worker', authMiddleware, authorize('supervisor'), supervisorController.createWorker);

module.exports = router;

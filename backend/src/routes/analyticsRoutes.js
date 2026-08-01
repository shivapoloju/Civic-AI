const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authMiddleware, authorize } = require('../middleware/auth');

router.get('/dashboard-stats', authMiddleware, authorize('supervisor', 'officer', 'admin'), analyticsController.getDashboardStats);
router.get('/live-map', authMiddleware, analyticsController.getComplaintLocations);
router.get('/predictive-maintenance', authMiddleware, authorize('supervisor', 'officer', 'admin'), analyticsController.getPredictiveMaintenanceAlerts);

module.exports = router;

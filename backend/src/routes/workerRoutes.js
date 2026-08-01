const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const { authMiddleware, authorize } = require('../middleware/auth');
const upload = require('../config/multer');

const afterImageUpload = upload.fields([
  { name: 'imageAfter', maxCount: 1 }
]);

router.get('/tasks', authMiddleware, authorize('worker', 'admin'), workerController.getTasks);
router.post('/location', authMiddleware, authorize('worker', 'admin'), workerController.updateLocation);
router.post('/update-task', authMiddleware, authorize('worker', 'admin'), afterImageUpload, workerController.updateTaskStatus);
router.post('/sync', authMiddleware, authorize('worker', 'admin'), workerController.syncOfflineData);

module.exports = router;

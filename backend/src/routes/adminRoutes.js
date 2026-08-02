const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, authorize } = require('../middleware/auth');

router.get('/users', authMiddleware, authorize('admin'), adminController.getUsers);
router.post('/department', authMiddleware, authorize('admin'), adminController.createDepartment);
router.get('/departments', authMiddleware, adminController.listDepartments);
router.post('/change-role', authMiddleware, authorize('admin'), adminController.updateUserRole);
router.post('/worker', authMiddleware, authorize('admin'), adminController.createWorker);
router.post('/supervisor', authMiddleware, authorize('admin'), adminController.createSupervisor);
router.get('/audit', authMiddleware, authorize('admin'), adminController.getAuditTrail);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getUserNotifications, markNotificationRead } = require('../services/mongoService');
const { authMiddleware } = require('../middleware/auth');

// Get all notifications for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await getUserNotifications(req.user.id);
    res.json(notifications);
  } catch (error) {
    console.error('Fetch notifications route error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// Mark notification as read
router.post('/:id/read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await markNotificationRead(id);
    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    console.error('Mark notification read route error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
});

module.exports = router;

const { ActivityLog, Notification } = require('../models/schemas');
const { isMongoConnected } = require('../config/db');
const fs = require('fs');
const path = require('path');

// Local fallback file paths
const fallbackLogsPath = path.join(__dirname, '../../data/activity_logs.json');
const fallbackNotifsPath = path.join(__dirname, '../../data/notifications.json');

const ensureFileExists = (filePath) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  }
};

const readLocalData = (filePath) => {
  ensureFileExists(filePath);
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const writeLocalData = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Failed to write local fallback data to ${filePath}:`, err);
  }
};

const logActivity = async (entityType, entityId, action, performedBy, metadata = {}) => {
  const logData = { entityType, entityId, action, performedBy, metadata, createdAt: new Date() };
  
  if (isMongoConnected()) {
    try {
      await ActivityLog.create(logData);
      return;
    } catch (err) {
      console.error('Failed to write activity log to MongoDB:', err);
    }
  }

  // Fallback
  console.log(`[ACTIVITY LOG] ${entityType} ID:${entityId} Action:${action} By:${performedBy}`);
  const logs = readLocalData(fallbackLogsPath);
  logs.push({ id: Math.random().toString(36).substr(2, 9), ...logData });
  writeLocalData(fallbackLogsPath, logs);
};

const createNotification = async (userId, title, message, type = 'STATUS') => {
  const notifData = { userId, title, message, type, isRead: false, createdAt: new Date() };

  if (isMongoConnected()) {
    try {
      const notif = await Notification.create(notifData);
      // Emit socket update if global.io exists
      if (global.io) {
        global.io.to(userId).emit('notification', notif);
      }
      return notif;
    } catch (err) {
      console.error('Failed to write notification to MongoDB:', err);
    }
  }

  // Fallback
  const notifs = readLocalData(fallbackNotifsPath);
  const id = Math.random().toString(36).substr(2, 9);
  const newNotif = { id, ...notifData };
  notifs.push(newNotif);
  writeLocalData(fallbackNotifsPath, notifs);

  if (global.io) {
    global.io.to(userId).emit('notification', newNotif);
  }

  return newNotif;
};

const getUserNotifications = async (userId) => {
  if (isMongoConnected()) {
    try {
      return await Notification.find({ userId }).sort({ createdAt: -1 });
    } catch (err) {
      console.error('Failed to get notifications from MongoDB:', err);
    }
  }

  // Fallback
  const notifs = readLocalData(fallbackNotifsPath);
  return notifs.filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const markNotificationRead = async (notificationId) => {
  if (isMongoConnected()) {
    try {
      await Notification.findByIdAndUpdate(notificationId, { isRead: true });
      return;
    } catch (err) {
      console.error('Failed to update notification in MongoDB:', err);
    }
  }

  // Fallback
  const notifs = readLocalData(fallbackNotifsPath);
  const notif = notifs.find(n => n.id === notificationId || n._id === notificationId);
  if (notif) {
    notif.isRead = true;
    writeLocalData(fallbackNotifsPath, notifs);
  }
};

const getActivityLogs = async (limit = 100) => {
  if (isMongoConnected()) {
    try {
      return await ActivityLog.find().sort({ createdAt: -1 }).limit(limit);
    } catch (err) {
      console.error('Failed to get activity logs from MongoDB:', err);
    }
  }

  // Fallback
  const logs = readLocalData(fallbackLogsPath);
  return logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
};

module.exports = {
  logActivity,
  createNotification,
  getUserNotifications,
  markNotificationRead,
  getActivityLogs
};

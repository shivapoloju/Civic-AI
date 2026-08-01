const { Complaint, Department, Worker, User } = require('../models/schemas');
const { Op } = require('sequelize');
const aiService = require('../services/aiService');
const { getActivityLogs } = require('../services/mongoService');

// Get overall platform stats and charts data
exports.getDashboardStats = async (req, res) => {
  try {
    const totalRaised = await Complaint.count();
    const totalResolved = await Complaint.count({ where: { status: 'closed' } });
    const activeComplaints = await Complaint.count({
      where: {
        status: { [Op.notIn]: ['closed', 'citizen_verified'] }
      }
    });
    const pendingVerification = await Complaint.count({ where: { status: 'completed' } });

    // Category distribution
    const categories = await Complaint.findAll({
      attributes: ['category', [Complaint.sequelize.fn('COUNT', Complaint.sequelize.col('category')), 'count']],
      group: ['category']
    });

    // Priority breakdown
    const priorities = await Complaint.findAll({
      attributes: ['priority', [Complaint.sequelize.fn('COUNT', Complaint.sequelize.col('priority')), 'count']],
      group: ['priority']
    });

    // Status breakdown
    const statuses = await Complaint.findAll({
      attributes: ['status', [Complaint.sequelize.fn('COUNT', Complaint.sequelize.col('status')), 'count']],
      group: ['status']
    });

    res.json({
      summary: {
        totalRaised,
        totalResolved,
        activeComplaints,
        pendingVerification,
        resolutionRate: totalRaised > 0 ? ((totalResolved / totalRaised) * 100).toFixed(1) : 0
      },
      charts: {
        categories,
        priorities,
        statuses
      }
    });
  } catch (error) {
    console.error('Analytics getDashboardStats error:', error);
    res.status(500).json({ error: 'Failed to generate dashboard analytics.' });
  }
};

// Fetch complaints mapping data for Leaflet/Google Maps (Locations & Statuses)
exports.getComplaintLocations = async (req, res) => {
  try {
    const complaints = await Complaint.findAll({
      attributes: ['id', 'category', 'lat', 'lng', 'status', 'priority', 'address'],
      where: {
        status: { [Op.ne]: 'closed' } // only live issues
      }
    });

    const workers = await Worker.findAll({
      include: [{ model: User, attributes: ['name'] }],
      attributes: ['id', 'lat', 'lng', 'status']
    });

    res.json({ complaints, workers });
  } catch (error) {
    console.error('Analytics getComplaintLocations error:', error);
    res.status(500).json({ error: 'Failed to fetch map markers data.' });
  }
};

// Predictive maintenance warnings from past complaints data
exports.getPredictiveMaintenanceAlerts = async (req, res) => {
  try {
    // Retrieve past 30 days reports
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const history = await Complaint.findAll({
      where: {
        createdAt: { [Op.gte]: oneMonthAgo }
      },
      attributes: ['id', 'category', 'lat', 'lng', 'createdAt']
    });

    // Contact AI service for maintenance prediction
    const prediction = await aiService.getPredictiveMaintenance(history);
    res.json(prediction);
  } catch (error) {
    console.error('Analytics getPredictiveMaintenanceAlerts error:', error);
    res.status(500).json({ error: 'Failed to perform predictive failure queries.' });
  }
};

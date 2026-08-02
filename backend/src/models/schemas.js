const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const mongoose = require('mongoose');

// ==========================================
// SEQUELIZE (SQL) MODELS
// ==========================================

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('citizen', 'worker', 'supervisor', 'officer', 'admin'),
    allowNull: false,
    defaultValue: 'citizen'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  otpExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  civicPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Departments', key: 'id' }
  }
}, {
  timestamps: true,
  indexes: [
    { unique: true, fields: ['email'] },
    { fields: ['role'] }
  ]
});

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  timestamps: true
});

const Worker = sequelize.define('Worker', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: { model: User, key: 'id' }
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: Department, key: 'id' }
  },
  status: {
    type: DataTypes.ENUM('available', 'busy', 'offline'),
    defaultValue: 'available'
  },
  lat: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  lng: {
    type: DataTypes.DOUBLE,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['status'] },
    { fields: ['departmentId'] }
  ]
});

const Complaint = sequelize.define('Complaint', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  citizenId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: User, key: 'id' }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  lat: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  lng: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM(
      'raised',
      'assigned',
      'worker_assigned',
      'worker_reached',
      'work_started',
      'completed',
      'supervisor_approved',
      'citizen_verified',
      'closed'
    ),
    defaultValue: 'raised'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: Department, key: 'id' }
  },
  imageUrlBefore: {
    type: DataTypes.STRING,
    allowNull: true
  },
  imageUrlAfter: {
    type: DataTypes.STRING,
    allowNull: true
  },
  voiceUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isFake: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  aiDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['citizenId'] },
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['departmentId'] }
  ]
});

const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  complaintId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: Complaint, key: 'id' }
  },
  workerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: Worker, key: 'id' }
  },
  status: {
    type: DataTypes.ENUM('assigned', 'accepted', 'working', 'completed'),
    defaultValue: 'assigned'
  },
  isAutoAssigned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true
});

const Verification = sequelize.define('Verification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  complaintId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: Complaint, key: 'id' }
  },
  supervisorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: User, key: 'id' }
  },
  confidenceScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  status: {
    type: DataTypes.ENUM('approved', 'rejected', 'sent_back'),
    allowNull: false
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

const Rating = sequelize.define('Rating', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  complaintId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: { model: Complaint, key: 'id' }
  },
  citizenId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: User, key: 'id' }
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  review: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

// Relationships
User.hasOne(Worker, { foreignKey: 'userId' });
Worker.belongsTo(User, { foreignKey: 'userId' });

User.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Department.hasMany(User, { foreignKey: 'departmentId', as: 'supervisors' });

Department.hasMany(Worker, { foreignKey: 'departmentId' });
Worker.belongsTo(Department, { foreignKey: 'departmentId' });

User.hasMany(Complaint, { foreignKey: 'citizenId' });
Complaint.belongsTo(User, { foreignKey: 'citizenId', as: 'citizen' });

Department.hasMany(Complaint, { foreignKey: 'departmentId' });
Complaint.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

Complaint.hasMany(Assignment, { foreignKey: 'complaintId' });
Assignment.belongsTo(Complaint, { foreignKey: 'complaintId' });

Worker.hasMany(Assignment, { foreignKey: 'workerId' });
Assignment.belongsTo(Worker, { foreignKey: 'workerId', as: 'worker' });

Complaint.hasOne(Verification, { foreignKey: 'complaintId' });
Verification.belongsTo(Complaint, { foreignKey: 'complaintId' });

Complaint.hasOne(Rating, { foreignKey: 'complaintId' });
Rating.belongsTo(Complaint, { foreignKey: 'complaintId' });


// ==========================================
// MONGOOSE (NOSQL) SCHEMAS
// ==========================================

const ActivityLogSchema = new mongoose.Schema({
  entityType: { type: String, required: true }, // e.g., 'Complaint', 'Worker'
  entityId: { type: String, required: true },
  action: { type: String, required: true }, // e.g., 'STATUS_CHANGE', 'ASSIGNED'
  performedBy: { type: String, required: true }, // User UUID or system
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

const NotificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['STATUS', 'ASSIGNMENT', 'VERIFICATION', 'ALERT'], default: 'STATUS' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Define Models (only compiled if MongoDB is connected, or standard mongoose models)
const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);
const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = {
  User,
  Department,
  Worker,
  Complaint,
  Assignment,
  Verification,
  Rating,
  ActivityLog,
  Notification
};

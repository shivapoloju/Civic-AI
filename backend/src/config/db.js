const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Create scratch or data directory for SQLite fallback if needed
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let sequelize;
const pgUri = process.env.DATABASE_URL;

if (pgUri) {
  console.log('Connecting to PostgreSQL database...');
  sequelize = new Sequelize(pgUri, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  });
} else {
  const sqlitePath = path.join(dataDir, 'civicai.sqlite');
  console.log(`No DATABASE_URL found. Falling back to local SQLite at: ${sqlitePath}`);
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: sqlitePath,
    logging: false
  });
}

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/civicai';
let mongoConnected = false;

const connectMongo = async () => {
  try {
    console.log(`Connecting to MongoDB at: ${mongoUri.replace(/:([^:]+)@/, ':***@')}`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout
    });
    mongoConnected = true;
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.warn('WARNING: Failed to connect to MongoDB. Notifications and Activity Logs will run in mock in-memory fallback mode.');
    mongoConnected = false;
  }
};

module.exports = {
  sequelize,
  connectMongo,
  isMongoConnected: () => mongoConnected
};

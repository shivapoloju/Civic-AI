const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { sequelize, connectMongo } = require('./config/db');
const { User, Department, Worker } = require('./models/schemas');

// Route imports
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const workerRoutes = require('./routes/workerRoutes');
const supervisorRoutes = require('./routes/supervisorRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);

// Realtime WebSocket integration
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Bind io globally
global.io = io;

io.on('connection', (socket) => {
  console.log(`WebSocket client connected: ${socket.id}`);
  
  // Join role/user channels
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room channel.`);
  });

  socket.on('disconnect', () => {
    console.log(`WebSocket client disconnected: ${socket.id}`);
  });
});

// Security & Request Parsing Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // allow React Leaflet tile fetches
  crossOriginResourcePolicy: false // allow cross-origin image loads
}));
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Health Check API
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', database: 'connected', time: new Date() });
});

// API Routes registry
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/supervisors', supervisorRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error Logger]:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

// Database Sync and Boot
const PORT = process.env.PORT || 5000;

const seedDatabase = async () => {
  try {
    // 1. Seed Departments
    const depts = ['Roads', 'Water', 'Sanitation', 'Electricity', 'Traffic', 'Parks'];
    const deptInstances = {};
    for (const name of depts) {
      const [inst] = await Department.findOrCreate({ where: { name } });
      deptInstances[name] = inst;
    }

    // 2. Seed Admin
    const adminEmail = 'admin@civicai.org';
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const [adminUser] = await User.findOrCreate({
      where: { email: adminEmail },
      defaults: {
        name: 'System Admin',
        passwordHash: adminPasswordHash,
        role: 'admin',
        phone: '1111111111'
      }
    });

    // 3. Seed Supervisor
    const supervisorEmail = 'supervisor@civicai.org';
    const supervisorPasswordHash = await bcrypt.hash('Supervisor@123', 10);
    const [supervisorUser] = await User.findOrCreate({
      where: { email: supervisorEmail },
      defaults: {
        name: 'Municipal Supervisor',
        passwordHash: supervisorPasswordHash,
        role: 'supervisor',
        phone: '2222222222'
      }
    });

    // 4. Seed Worker
    const workerEmail = 'worker@civicai.org';
    const workerPasswordHash = await bcrypt.hash('Worker@123', 10);
    const [workerUser] = await User.findOrCreate({
      where: { email: workerEmail },
      defaults: {
        name: 'Field Technician',
        passwordHash: workerPasswordHash,
        role: 'worker',
        phone: '3333333333'
      }
    });

    // Bind worker to department 'Roads'
    await Worker.findOrCreate({
      where: { userId: workerUser.id },
      defaults: {
        departmentId: deptInstances['Roads'].id,
        status: 'available',
        lat: 17.385044, // Default City Center Coord
        lng: 78.486671
      }
    });

    // 5. Seed Citizen
    const citizenEmail = 'citizen@civicai.org';
    const citizenPasswordHash = await bcrypt.hash('Citizen@123', 10);
    await User.findOrCreate({
      where: { email: citizenEmail },
      defaults: {
        name: 'John Doe (Citizen)',
        passwordHash: citizenPasswordHash,
        role: 'citizen',
        phone: '9999999999',
        civicPoints: 50
      }
    });

    console.log('Database seeded with standard accounts successfully.');
  } catch (err) {
    console.error('Error seeding databases:', err);
  }
};

const boot = async () => {
  try {
    // Connect Relational
    await sequelize.authenticate();
    console.log('Relational Database connection established.');
    
    // Sync models
    await sequelize.sync();
    console.log('SQL Schemas synchronized successfully.');
    
    // Seed
    await seedDatabase();

    // Connect NoSQL MongoDB (Non-blocking)
    connectMongo();

    server.listen(PORT, () => {
      console.log(`CivicAI Backend Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start CivicAI Backend:', error);
    process.exit(1);
  }
};

boot();

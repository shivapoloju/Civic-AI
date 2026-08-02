const { User, Department, Worker } = require('../models/schemas');
const bcrypt = require('bcryptjs');
const { getActivityLogs } = require('../services/mongoService');

// Get all system users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'phone', 'civicPoints', 'createdAt'],
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        },
        {
          model: Worker,
          attributes: ['id', 'status'],
          include: [
            {
              model: Department,
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    console.error('Admin getUsers error:', error);
    res.status(500).json({ error: 'Failed to retrieve user accounts.' });
  }
};

// Create a new urban management department
exports.createDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Department name is required.' });
    }

    const existing = await Department.findOne({ where: { name } });
    if (existing) {
      return res.status(400).json({ error: 'Department already exists.' });
    }

    const department = await Department.create({ name });
    res.status(201).json({ message: 'Department created successfully.', department });
  } catch (error) {
    console.error('Admin createDepartment error:', error);
    res.status(500).json({ error: 'Failed to create department.' });
  }
};

// List all departments
exports.listDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({ order: [['name', 'ASC']] });
    res.json(departments);
  } catch (error) {
    console.error('Admin listDepartments error:', error);
    res.status(500).json({ error: 'Failed to list departments.' });
  }
};

// Change a user's role
exports.updateUserRole = async (req, res) => {
  try {
    const { userId, role, departmentId } = req.body;
    if (!userId || !role) {
      return res.status(400).json({ error: 'User ID and target role are required.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    user.role = role;
    await user.save();

    // If changing to worker, bind them to a department
    if (role === 'worker') {
      if (!departmentId) {
        return res.status(400).json({ error: 'Assigning worker role requires a departmentId.' });
      }

      // Check if worker entry already exists
      let worker = await Worker.findOne({ where: { userId } });
      if (worker) {
        worker.departmentId = departmentId;
        await worker.save();
      } else {
        await Worker.create({
          userId,
          departmentId,
          status: 'available'
        });
      }
    }

    res.json({ message: `User role successfully changed to ${role}.`, user });
  } catch (error) {
    console.error('Admin updateUserRole error:', error);
    res.status(500).json({ error: 'Failed to update user access level.' });
  }
};

// View activity logs audit trail
exports.getAuditTrail = async (req, res) => {
  try {
    const logs = await getActivityLogs(100);
    res.json(logs);
  } catch (error) {
    console.error('Admin getAuditTrail error:', error);
    res.status(500).json({ error: 'Failed to retrieve system audit trails.' });
  }
};

// Create a new Field Worker account and bind to a department
exports.createWorker = async (req, res) => {
  try {
    const { name, email, password, phone, departmentId } = req.body;
    
    if (!name || !email || !password || !phone || !departmentId) {
      return res.status(400).json({ error: 'All fields (name, email, password, phone, department) are required.' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      passwordHash,
      name,
      role: 'worker',
      phone,
      civicPoints: 0
    });

    const worker = await Worker.create({
      userId: user.id,
      departmentId,
      status: 'available'
    });

    res.status(201).json({
      message: `Worker account for ${name} created and assigned successfully.`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      worker
    });
  } catch (error) {
    console.error('Admin createWorker error:', error);
    res.status(500).json({ error: 'Failed to create worker account.' });
  }
};

// Create a new Supervisor account and bind to a department
exports.createSupervisor = async (req, res) => {
  try {
    const { name, email, password, phone, departmentId } = req.body;
    
    if (!name || !email || !password || !phone || !departmentId) {
      return res.status(400).json({ error: 'All fields (name, email, password, phone, department) are required.' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      passwordHash,
      name,
      role: 'supervisor',
      phone,
      departmentId,
      civicPoints: 0
    });

    res.status(201).json({
      message: `Supervisor account for ${name} created and assigned successfully.`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId
      }
    });
  } catch (error) {
    console.error('Admin createSupervisor error:', error);
    res.status(500).json({ error: 'Failed to create supervisor account.' });
  }
};

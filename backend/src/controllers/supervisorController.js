const { Complaint, Assignment, Worker, User, Verification, Department } = require('../models/schemas');
const { Op } = require('sequelize');
const aiService = require('../services/aiService');
const { logActivity, createNotification } = require('../services/mongoService');

// Get all complaints pending verification
exports.getPendingVerifications = async (req, res) => {
  try {
    const complaints = await Complaint.findAll({
      where: {
        status: { [Op.or]: ['citizen_verified', 'citizen_rejected'] }
      },
      include: [
        { model: User, as: 'citizen', attributes: ['name', 'phone'] },
        { model: Assignment, include: [{ model: Worker, as: 'worker', include: [{ model: User, attributes: ['name'] }] }] }
      ]
    });
    res.json(complaints);
  } catch (error) {
    console.error('Supervisor getPendingVerifications error:', error);
    res.status(500).json({ error: 'Failed to fetch pending verifications.' });
  }
};

// Compare before/after repair images using AI
exports.verifyRepairImages = async (req, res) => {
  try {
    const { complaintId } = req.body;
    if (!complaintId) {
      return res.status(400).json({ error: 'Complaint ID is required.' });
    }

    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    if (!complaint.imageUrlBefore || !complaint.imageUrlAfter) {
      return res.status(400).json({ error: 'Complaint requires both before and after images for AI analysis.' });
    }

    // Call AI Bridge service
    const verificationResult = await aiService.verifyRepair(complaint.imageUrlBefore, {
      path: require('path').join(__dirname, '../../public', complaint.imageUrlAfter),
      originalname: 'after_repair.jpg',
      mimetype: 'image/jpeg'
    });

    res.json({
      complaintId,
      confidenceScore: verificationResult.confidenceScore,
      repairApproved: verificationResult.repairApproved,
      feedback: verificationResult.feedback
    });
  } catch (error) {
    console.error('Supervisor verifyRepairImages error:', error);
    res.status(500).json({ error: 'Failed to complete AI comparison evaluation.' });
  }
};

// Supervisor Decision: Approve, Reject, or Send Back
exports.processVerification = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const { complaintId, decision, feedback, confidenceScore } = req.body;

    if (!complaintId || !decision) {
      return res.status(400).json({ error: 'Complaint ID and decision (approve, reject, send_back) are required.' });
    }

    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const assignment = await Assignment.findOne({
      where: { complaintId: complaint.id, status: 'completed' },
      order: [['createdAt', 'DESC']]
    });

    if (decision === 'approve') {
      complaint.status = 'closed';
      await complaint.save();

      await Verification.create({
        complaintId,
        supervisorId,
        confidenceScore: confidenceScore || 1.0,
        status: 'approved',
        feedback: feedback || 'Repair verified and approved by higher authority.'
      });

      await logActivity('Complaint', complaintId, 'CLOSED_BY_SUPERVISOR', supervisorId, { feedback });
      await createNotification(
        complaint.citizenId,
        'Complaint Closed by Authority',
        `Your reported complaint has been verified by the higher authority and closed. Thank you for helping improve our city together!`,
        'STATUS'
      );
    } else if (decision === 'reject' || decision === 'send_back') {
      complaint.status = 'work_started'; // send back to progress
      await complaint.save();

      if (assignment) {
        assignment.status = 'working';
        await assignment.save();
      }

      await Verification.create({
        complaintId,
        supervisorId,
        confidenceScore: confidenceScore || 0.0,
        status: decision === 'reject' ? 'rejected' : 'sent_back',
        feedback: feedback || 'Repair quality unsatisfactory. Assigned back to worker.'
      });

      await logActivity('Complaint', complaintId, `SUPERVISOR_${decision.toUpperCase()}`, supervisorId, { feedback });

      // Notify the worker
      if (assignment) {
        const workerProfile = await Worker.findByPk(assignment.workerId);
        if (workerProfile) {
          await createNotification(
            workerProfile.userId,
            'Job Sent Back',
            `Supervisor rejected the repair photo for complaint ID: ${complaint.id.substring(0, 8)}. Reason: ${feedback}`,
            'ALERT'
          );
        }
      }
    } else {
      return res.status(400).json({ error: 'Invalid decision action.' });
    }

    // Notify sockets
    if (global.io) {
      global.io.emit('complaint_status_change', {
        id: complaint.id,
        status: complaint.status
      });
    }

    res.json({ message: `Verification decision '${decision}' saved.`, complaint });
  } catch (error) {
    console.error('Supervisor processVerification error:', error);
    res.status(500).json({ error: 'Failed to process verification decision.' });
  }
};

// Dispatch a complaint to a worker
exports.assignWorker = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const { complaintId, workerId } = req.body;

    if (!complaintId || !workerId) {
      return res.status(400).json({ error: 'Complaint ID and Worker ID are required.' });
    }

    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const worker = await Worker.findByPk(workerId, { include: [User] });
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found.' });
    }

    // Create assignment
    const assignment = await Assignment.create({
      complaintId,
      workerId,
      status: 'assigned'
    });

    complaint.status = 'assigned';
    await complaint.save();

    // Mark worker status busy
    worker.status = 'busy';
    await worker.save();

    await logActivity('Complaint', complaintId, 'WORKER_ASSIGNED', supervisorId, { workerId, workerName: worker.User.name });
    
    // Notify Citizen
    await createNotification(
      complaint.citizenId,
      'Worker Assigned',
      `Field worker ${worker.User.name} has been dispatched to resolve your complaint.`,
      'STATUS'
    );

    // Notify Worker
    await createNotification(
      worker.userId,
      'New Task Assigned',
      `You have been assigned a new complaint: ${complaint.category} at ${complaint.address}`,
      'ASSIGNMENT'
    );

    // Notify socket rooms
    if (global.io) {
      global.io.emit('complaint_status_change', {
        id: complaint.id,
        status: 'assigned',
        assignment
      });
    }

    res.status(201).json({
      message: 'Worker assigned successfully.',
      assignment
    });
  } catch (error) {
    console.error('Supervisor assignWorker error:', error);
    res.status(500).json({ error: 'Failed to assign worker.' });
  }
};

// Retrieve workers for routing recommendations
exports.getAvailableWorkers = async (req, res) => {
  try {
    const { departmentId } = req.query;
    const whereClause = { status: 'available' };
    if (departmentId) whereClause.departmentId = departmentId;

    const workers = await Worker.findAll({
      where: whereClause,
      include: [
        { model: User, attributes: ['id', 'name', 'phone', 'email'] },
        { model: Department, attributes: ['id', 'name'] }
      ]
    });

    res.json(workers);
  } catch (error) {
    console.error('Supervisor getAvailableWorkers error:', error);
    res.status(500).json({ error: 'Failed to retrieve available workers list.' });
  }
};

// Create a new Field Worker under supervisor department
exports.createWorker = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'All fields (name, email, password, phone) are required.' });
    }

    const supervisor = await User.findByPk(supervisorId);
    if (!supervisor || !supervisor.departmentId) {
      return res.status(400).json({ error: 'Supervisor is not assigned to any municipal department.' });
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
      departmentId: supervisor.departmentId,
      status: 'available'
    });

    await logActivity('Worker', worker.id, 'CREATED_BY_SUPERVISOR', supervisorId);

    res.status(201).json({
      message: `Worker account for ${name} created and assigned to department successfully.`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      worker
    });
  } catch (error) {
    console.error('Supervisor createWorker error:', error);
    res.status(500).json({ error: 'Failed to create worker account.' });
  }
};

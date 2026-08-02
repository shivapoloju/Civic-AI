const { Worker, Assignment, Complaint, User } = require('../models/schemas');
const { logActivity, createNotification } = require('../services/mongoService');

// Helper to automatically assign the oldest pending complaint in the department to this worker
async function autoAssignPendingComplaint(worker) {
  try {
    const oldestComplaint = await Complaint.findOne({
      where: {
        departmentId: worker.departmentId,
        status: 'raised',
        isFake: false
      },
      order: [['createdAt', 'ASC']]
    });

    if (oldestComplaint) {
      await Assignment.create({
        complaintId: oldestComplaint.id,
        workerId: worker.id,
        status: 'assigned',
        isAutoAssigned: true
      });

      oldestComplaint.status = 'assigned';
      await oldestComplaint.save();

      worker.status = 'busy';
      await worker.save();

      // Log activity
      await logActivity('Complaint', oldestComplaint.id, 'AUTO_ASSIGNED_ON_WORKER_AVAILABLE', 'SYSTEM', { 
        workerId: worker.id 
      });

      // Notify citizen
      await createNotification(
        oldestComplaint.citizenId,
        'Worker Auto-Dispatched',
        `A municipal crew member is automatically assigned to resolve your complaint.`,
        'STATUS'
      );

      // Notify worker
      await createNotification(
        worker.userId,
        'Auto Task Assignment',
        `You have been automatically assigned a new complaint in your department: ${oldestComplaint.category}.`,
        'ASSIGNMENT'
      );

      // Notify socket rooms
      if (global.io) {
        global.io.emit('complaint_status_change', {
          id: oldestComplaint.id,
          status: 'assigned'
        });
        global.io.emit('worker_location_update', {
          workerId: worker.id,
          status: 'busy',
          lat: worker.lat,
          lng: worker.lng
        });
      }
      return true;
    }
  } catch (err) {
    console.error('Error in autoAssignPendingComplaint:', err);
  }
  return false;
}

// Get worker's current active tasks
exports.getTasks = async (req, res) => {
  try {
    const worker = await Worker.findOne({ where: { userId: req.user.id } });
    if (!worker) {
      return res.status(404).json({ error: 'Worker profile not found.' });
    }

    const assignments = await Assignment.findAll({
      where: { workerId: worker.id },
      include: [{
        model: Complaint,
        include: [{ model: User, as: 'citizen', attributes: ['name', 'phone'] }]
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ worker, assignments });
  } catch (error) {
    console.error('Worker getTasks error:', error);
    res.status(500).json({ error: 'Failed to fetch assigned tasks.' });
  }
};

// Update worker status and location coordinates
exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng, status } = req.body;
    const worker = await Worker.findOne({ where: { userId: req.user.id } });
    
    if (!worker) {
      return res.status(404).json({ error: 'Worker profile not found.' });
    }

    if (lat !== undefined) worker.lat = Number(lat);
    if (lng !== undefined) worker.lng = Number(lng);
    if (status !== undefined) worker.status = status;

    await worker.save();

    // Trigger auto assignment if worker marked available
    if (status === 'available') {
      await autoAssignPendingComplaint(worker);
    }

    // Notify supervisors or dispatch room of position update (realtime Map tracking)
    if (global.io) {
      global.io.emit('worker_location_update', {
        workerId: worker.id,
        name: req.user.name,
        lat: worker.lat,
        lng: worker.lng,
        status: worker.status
      });
    }

    res.json({ message: 'Worker location and status updated.', worker });
  } catch (error) {
    console.error('Worker updateLocation error:', error);
    res.status(500).json({ error: 'Failed to update location information.' });
  }
};

// Update specific task state (timeline flow)
exports.updateTaskStatus = async (req, res) => {
  try {
    const { assignmentId, status } = req.body;
    if (!assignmentId || !status) {
      return res.status(400).json({ error: 'Assignment ID and status updates are required.' });
    }

    const assignment = await Assignment.findByPk(assignmentId, {
      include: [{ model: Complaint }]
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment record not found.' });
    }

    const complaint = assignment.Complaint || assignment.complaint;
    let complaintStatus = complaint.status;

    const worker = await Worker.findOne({ where: { id: assignment.workerId } });
    if (!worker) {
      return res.status(404).json({ error: 'Worker profile not found.' });
    }

    // Timeline rules mapping
    if (status === 'accepted') {
      assignment.status = 'accepted';
      complaintStatus = 'worker_assigned';
    } else if (status === 'reached') {
      assignment.status = 'working';
      complaintStatus = 'worker_reached';
    } else if (status === 'working') {
      assignment.status = 'working';
      complaintStatus = 'work_started';
    } else if (status === 'completed') {
      // Must upload after-image for completion
      const afterImage = req.files && req.files.imageAfter ? req.files.imageAfter[0] : null;
      if (!afterImage && !complaint.imageUrlAfter) {
        return res.status(400).json({ error: 'Completion requires uploading a repair validation photo.' });
      }

      if (afterImage) {
        complaint.imageUrlAfter = `/uploads/${afterImage.filename}`;
      }
      
      assignment.status = 'completed';
      complaintStatus = 'completed';
    } else {
      return res.status(400).json({ error: 'Invalid workflow status update.' });
    }

    await assignment.save();
    complaint.status = complaintStatus;
    await complaint.save();

    // Reset worker status back to available if completing the task
    if (status === 'completed') {
      worker.status = 'available';
      await worker.save();
      await autoAssignPendingComplaint(worker);
    }

    // Log & notify
    await logActivity('Complaint', complaint.id, `WORKER_${status.toUpperCase()}`, req.user.id);
    await createNotification(
      complaint.citizenId,
      'Complaint Status Update',
      `Your complaint reference ID: ${complaint.id.substring(0, 8)} status changed to: ${complaintStatus.replace('_', ' ')}`,
      'STATUS'
    );

    // Notify socket rooms
    if (global.io) {
      global.io.emit('complaint_status_change', {
        id: complaint.id,
        status: complaintStatus,
        assignmentId
      });
    }

    res.json({
      message: `Task updated to ${status}.`,
      assignment,
      complaint
    });
  } catch (error) {
    console.error('Worker updateTaskStatus error:', error);
    res.status(500).json({ error: 'Failed to update task timeline.' });
  }
};

// Batch offline synchronization
exports.syncOfflineData = async (req, res) => {
  try {
    const { logs } = req.body; // array of: { assignmentId, status, timestamp, lat, lng }
    if (!logs || !Array.isArray(logs)) {
      return res.status(400).json({ error: 'Sync logs array is required.' });
    }

    console.log(`Synchronizing ${logs.length} offline status events for worker user: ${req.user.name}`);
    const results = [];

    for (const log of logs) {
      try {
        const assignment = await Assignment.findByPk(log.assignmentId, { include: [Complaint] });
        if (!assignment) continue;

        if (log.status === 'completed' && log.imageUrlAfter) {
          assignment.complaint.imageUrlAfter = log.imageUrlAfter;
        }

        assignment.status = log.status === 'reached' || log.status === 'working' ? 'working' : log.status;
        await assignment.save();

        let compStatus = 'raised';
        if (log.status === 'accepted') compStatus = 'worker_assigned';
        if (log.status === 'reached') compStatus = 'worker_reached';
        if (log.status === 'working') compStatus = 'work_started';
        if (log.status === 'completed') compStatus = 'completed';

        assignment.complaint.status = compStatus;
        await assignment.complaint.save();

        await logActivity('Complaint', assignment.complaint.id, `SYNC_WORKER_${log.status.toUpperCase()}`, req.user.id, { timestamp: log.timestamp });
        results.push({ assignmentId: log.assignmentId, success: true });
      } catch (err) {
        results.push({ assignmentId: log.assignmentId, success: false, error: err.message });
      }
    }

    res.json({ message: 'Sync processed successfully.', results });
  } catch (error) {
    console.error('Worker syncOfflineData error:', error);
    res.status(500).json({ error: 'Failed to sync offline logs.' });
  }
};

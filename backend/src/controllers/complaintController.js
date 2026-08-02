const { Complaint, User, Department, Assignment, Worker, Verification, Rating } = require('../models/schemas');
const { Op } = require('sequelize');
const aiService = require('../services/aiService');
const { logActivity, createNotification } = require('../services/mongoService');

// Create a new complaint (Citizen raises issue)
exports.createComplaint = async (req, res) => {
  try {
    const citizenId = req.user.id;
    const { lat, lng, address, category: manualCategory, description: manualDescription, priority: manualPriority } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude coordinates are required.' });
    }

    const imageFile = req.files && req.files.image ? req.files.image[0] : null;
    const voiceFile = req.files && req.files.voice ? req.files.voice[0] : null;

    if (!imageFile && !voiceFile && !manualDescription) {
      return res.status(400).json({ error: 'Please upload an image, audio clip, or type a description.' });
    }

    // Get active complaints for duplicate check
    const activeComplaints = await Complaint.findAll({
      where: {
        status: { [Op.notIn]: ['closed', 'citizen_verified'] }
      }
    });

    // Run duplicate detection via AI service (fallback checks distances)
    let isDuplicate = false;
    let duplicateId = null;

    if (imageFile || manualCategory) {
      const categoryToCheck = manualCategory || 'Garbage';
      const duplicateResult = await aiService.checkDuplicates(Number(lat), Number(lng), categoryToCheck, activeComplaints);
      isDuplicate = duplicateResult.isDuplicate;
      duplicateId = duplicateResult.duplicateId;
    }

    if (isDuplicate) {
      return res.status(409).json({
        error: 'A similar complaint has already been registered in this area.',
        duplicateComplaintId: duplicateId
      });
    }

    // Call AI analyzer (Grok Vision extraction or local heuristical engine)
    const analysis = await aiService.analyzeComplaint(imageFile, voiceFile, lat, lng);

    const isFake = analysis.isFake || false;

    // Map AI analysis variables to database fields
    const category = manualCategory || analysis.category;
    const description = manualDescription || analysis.description || analysis.speechTranscribed || 'Issue reported via media.';
    const priority = manualPriority || analysis.priority || 'medium';
    
    // Resolve Department or create default
    const deptName = analysis.department || 'Sanitation';
    let dept = await Department.findOne({ 
      where: Department.sequelize.where(
        Department.sequelize.fn('LOWER', Department.sequelize.col('name')), 
        deptName.toLowerCase()
      )
    });
    if (!dept) {
      dept = await Department.findOne() || await Department.create({ name: deptName });
    }

    // Save image/audio links
    const imageUrlBefore = imageFile ? `/uploads/${imageFile.filename}` : null;
    const voiceUrl = voiceFile ? `/uploads/${voiceFile.filename}` : null;

    const complaint = await Complaint.create({
      citizenId,
      category,
      description,
      lat: Number(lat),
      lng: Number(lng),
      address: address || 'Auto-detected location coordinates',
      status: 'raised',
      priority,
      departmentId: dept.id,
      imageUrlBefore,
      voiceUrl,
      isFake
    });

    await logActivity('Complaint', complaint.id, 'CREATED', citizenId, { category, priority });
    await createNotification(citizenId, 'Complaint Raised Successfully', `Your grievance for '${category}' has been filed. Reference ID: ${complaint.id.substring(0, 8)}`, 'STATUS');

    // AI Spatial Auto-Dispatch Agent: Match closest available worker from matching department
    try {
      if (!isFake) {
        const availableWorkers = await Worker.findAll({
          where: {
            departmentId: dept.id,
            status: 'available'
          },
          include: [{ model: User }]
        });

        if (availableWorkers.length > 0) {
          let closestWorker = null;
          let minDistance = Infinity;

          const getDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = 
              Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
          };

          for (const worker of availableWorkers) {
            if (worker.lat !== null && worker.lng !== null) {
              const dist = getDistance(Number(lat), Number(lng), Number(worker.lat), Number(worker.lng));
              if (dist < minDistance) {
                minDistance = dist;
                closestWorker = worker;
              }
            }
          }

          if (closestWorker) {
            await Assignment.create({
              complaintId: complaint.id,
              workerId: closestWorker.id,
              status: 'assigned',
              isAutoAssigned: true
            });

            complaint.status = 'assigned';
            await complaint.save();

            closestWorker.status = 'busy';
            await closestWorker.save();

            await logActivity('Complaint', complaint.id, 'AUTO_ASSIGNED_BY_AI', 'SYSTEM', { 
              workerId: closestWorker.id, 
              workerName: closestWorker.User?.name,
              distanceKm: minDistance.toFixed(2)
            });

            await createNotification(
              citizenId,
              'AI Auto-Dispatch Worker',
              `AI has automatically matched and dispatched worker ${closestWorker.User?.name} (located ${minDistance.toFixed(2)} km away) to address your report.`,
              'STATUS'
            );

            await createNotification(
              closestWorker.userId,
              'Auto Task Assignment',
              `AI has automatically assigned you complaint ID: ${complaint.id.substring(0, 8)} (${complaint.category}) located ${minDistance.toFixed(2)} km away.`,
              'ASSIGNMENT'
            );
          }
        }
      }
    } catch (assignError) {
      console.error('[AI Auto-Assignment Fail]', assignError);
    }

    // Notify all available workers or supervisors in this department (Real-time socket emit)
    if (global.io) {
      global.io.emit('new_complaint', {
        id: complaint.id,
        category: complaint.category,
        priority: complaint.priority,
        departmentId: dept.id,
        status: complaint.status
      });
    }

    res.status(201).json({
      message: 'Complaint filed successfully.',
      complaint
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ error: 'Internal server error filing the complaint.' });
  }
};

// Retrieve complaints list
exports.listComplaints = async (req, res) => {
  try {
    const { status, category, priority, departmentId, citizenId } = req.query;
    const whereClause = {};

    if (status) whereClause.status = status;
    if (category) whereClause.category = category;
    if (priority) whereClause.priority = priority;
    if (departmentId) whereClause.departmentId = departmentId;
    if (citizenId) whereClause.citizenId = citizenId;

    // Users who are workers can only view assigned tasks or general department complaints
    if (req.user.role === 'worker') {
      const worker = await Worker.findOne({ where: { userId: req.user.id } });
      if (worker) {
        whereClause.departmentId = worker.departmentId;
      }
    }

    const complaints = await Complaint.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'citizen', attributes: ['id', 'name', 'email', 'phone'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        { model: Assignment, include: [{ model: Worker, as: 'worker', include: [{ model: User, attributes: ['name', 'phone'] }] }] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(complaints);
  } catch (error) {
    console.error('List complaints error:', error);
    res.status(500).json({ error: 'Failed to retrieve complaints.' });
  }
};

// Retrieve a single complaint
exports.getComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findByPk(id, {
      include: [
        { model: User, as: 'citizen', attributes: ['id', 'name', 'email', 'phone'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        { model: Assignment, include: [{ model: Worker, as: 'worker', include: [{ model: User, attributes: ['name', 'phone'] }] }] },
        { model: Verification },
        { model: Rating }
      ]
    });

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    res.json(complaint);
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({ error: 'Failed to fetch complaint details.' });
  }
};

// Citizen reviews, ratings, and closes complaint
exports.rateAndClose = async (req, res) => {
  try {
    const citizenId = req.user.id;
    const { complaintId, score, review, rejected } = req.body;

    if (!complaintId) {
      return res.status(400).json({ error: 'Complaint ID is required.' });
    }

    if (!rejected && !score) {
      return res.status(400).json({ error: 'Score ratings (1-5) are required to verify resolution.' });
    }

    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    if (complaint.citizenId !== citizenId) {
      return res.status(403).json({ error: 'Access denied. Only the author citizen can rate this resolution.' });
    }

    if (complaint.status !== 'completed') {
      return res.status(400).json({ error: 'Complaint is not in completed status for citizen verification.' });
    }

    // Save or update review if score or rejected message is present
    const existingRating = await Rating.findOne({ where: { complaintId } });
    if (existingRating) {
      existingRating.score = score ? Number(score) : 1;
      existingRating.review = review || (rejected ? 'Rejected by citizen.' : 'Verified by citizen.');
      await existingRating.save();
    } else {
      await Rating.create({
        complaintId,
        citizenId,
        score: score ? Number(score) : 1,
        review: review || (rejected ? 'Rejected by citizen.' : 'Verified by citizen.')
      });
    }

    const citizen = await User.findByPk(citizenId);

    if (rejected) {
      complaint.status = 'citizen_rejected';
      await complaint.save();

      await logActivity('Complaint', complaintId, 'REJECTED_BY_CITIZEN', citizenId, { review });
      await createNotification(citizenId, 'Resolution Rejected', 'You rejected the repair work. The supervisor will review the work proof and make a final decision.', 'STATUS');

      if (global.io) {
        global.io.emit('complaint_status_change', {
          id: complaint.id,
          status: complaint.status
        });
      }

      res.json({
        message: 'Complaint successfully rejected. Awaiting supervisor review.',
        status: 'citizen_rejected'
      });
    } else {
      complaint.status = 'citizen_verified';
      await complaint.save();

      // Reward civic points
      citizen.civicPoints = (citizen.civicPoints || 0) + 15; // 15 points per closed review
      await citizen.save();

      await logActivity('Complaint', complaintId, 'VERIFIED_BY_CITIZEN', citizenId, { rating: score });
      await createNotification(citizenId, 'Resolution Verified', 'Thank you for verifying! Your feedback has been sent to the supervisor for final approval.', 'STATUS');

      if (global.io) {
        global.io.emit('complaint_status_change', {
          id: complaint.id,
          status: complaint.status
        });
      }

      res.json({
        message: 'Complaint successfully verified by citizen. Awaiting supervisor approval.',
        civicPoints: citizen.civicPoints,
        status: 'citizen_verified'
      });
    }
  } catch (error) {
    console.error('Rate and close error:', error);
    res.status(500).json({ error: 'Internal server error finalizing the complaint review.' });
  }
};

// Analyze uploaded media instantly for category and description auto-fill
exports.analyzeMedia = async (req, res) => {
  try {
    const imageFile = req.files && req.files.image ? req.files.image[0] : null;
    const voiceFile = req.files && req.files.voice ? req.files.voice[0] : null;

    if (!imageFile && !voiceFile) {
      return res.status(400).json({ error: 'Please upload an image or voice clip to run AI analysis.' });
    }

    const analysis = await aiService.analyzeComplaint(imageFile, voiceFile, 0, 0);
    res.json(analysis);
  } catch (error) {
    console.error('Media analysis endpoint error:', error);
    res.status(500).json({ error: 'Failed to complete media analysis.' });
  }
};

exports.translateText = async (req, res) => {
  try {
    const { text, targetLang } = req.body;
    if (!text) {
      return res.json({ translatedText: '' });
    }
    const translated = await aiService.translateText(text, targetLang);
    res.json({ translatedText: translated });
  } catch (error) {
    console.error('Translation controller error:', error);
    res.status(500).json({ error: 'Failed to translate text.' });
  }
};

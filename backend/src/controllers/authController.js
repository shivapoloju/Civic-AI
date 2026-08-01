const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Worker, Department } = require('../models/schemas');
const { JWT_SECRET } = require('../middleware/auth');
const { logActivity } = require('../services/mongoService');

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.signup = async (req, res) => {
  try {
    const { email, password, name, role, phone, departmentName } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role || 'citizen';

    const user = await User.create({
      email,
      passwordHash,
      name,
      role: userRole,
      phone,
      civicPoints: userRole === 'citizen' ? 10 : 0 // initial signup gift points
    });

    // If role is worker, bind to a department
    if (userRole === 'worker') {
      let dept;
      if (departmentName) {
        dept = await Department.findOne({ where: { name: departmentName } });
      }
      if (!dept) {
        // Fallback or create default dept
        dept = await Department.findOne() || await Department.create({ name: 'Roads' });
      }

      await Worker.create({
        userId: user.id,
        departmentId: dept.id,
        status: 'available'
      });
    }

    await logActivity('User', user.id, 'SIGNUP', user.id, { role: user.role });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        civicPoints: user.civicPoints
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    await logActivity('User', user.id, 'LOGIN', user.id);

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        civicPoints: user.civicPoints
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
};

exports.requestOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    let user = await User.findOne({ where: { phone } });
    if (!user) {
      // Auto-register as citizen
      user = await User.create({
        email: `${phone}@civicai.local`,
        passwordHash: await bcrypt.hash('temp-password-123', 10),
        name: `Citizen_${phone.slice(-4)}`,
        role: 'citizen',
        phone,
        civicPoints: 10
      });
    }

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    user.otp = otp;
    user.otpExpiry = expiry;
    await user.save();

    console.log(`[SMS Gateway Mock] Sending OTP: ${otp} to phone number: ${phone}`);

    await logActivity('User', user.id, 'OTP_REQUEST', user.id);

    res.json({
      message: 'OTP sent successfully (Simulated). Check backend logs for the OTP code.',
      phone // in demo env, we can just print it
    });
  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({ error: 'Internal server error during OTP request.' });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP code are required.' });
    }

    const user = await User.findOne({ where: { phone } });
    if (!user || user.otp !== otp) {
      return res.status(401).json({ error: 'Invalid or incorrect OTP.' });
    }

    if (new Date() > new Date(user.otpExpiry)) {
      return res.status(401).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Clear OTP details
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    await logActivity('User', user.id, 'OTP_VERIFIED', user.id);

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'OTP verified successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        civicPoints: user.civicPoints
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Internal server error during OTP verification.' });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { email, name, googleId } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Google email and name are required.' });
    }

    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Register new user
      const randomPassword = Math.random().toString(36).substring(2, 15);
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      user = await User.create({
        email,
        passwordHash,
        name,
        role: 'citizen',
        civicPoints: 10
      });
      await logActivity('User', user.id, 'OAUTH_SIGNUP', user.id);
    } else {
      await logActivity('User', user.id, 'OAUTH_LOGIN', user.id);
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Google login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        civicPoints: user.civicPoints
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Internal server error during Google OAuth.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = req.user;
    
    let workerDetails = null;
    if (user.role === 'worker') {
      workerDetails = await Worker.findOne({
        where: { userId: user.id },
        include: [{ model: Department }]
      });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      civicPoints: user.civicPoints,
      workerDetails
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error fetching user session.' });
  }
};

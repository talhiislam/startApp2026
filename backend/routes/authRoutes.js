const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const VerificationCode = require('../models/VerificationCode');
const { sendVerificationEmail } = require('../config/email');
const { protect } = require('../middleware/auth');

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { username, password } = req.body;

    if (!email || !username || !password)
      return res.status(400).json({ error: 'All fields are required' });

    if (await User.findOne({ email }))
      return res.status(400).json({ error: 'Email already in use' });

    if (await User.findOne({ username }))
      return res.status(400).json({ error: 'Username already taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const hasEmailService = !!process.env.RESEND_API_KEY;

    await User.create({
      email, username,
      password: hashedPassword,
      role: 'camper',
      isVerified: !hasEmailService,
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await VerificationCode.deleteMany({ email });
    await VerificationCode.create({ email, code, expiresAt });

    let emailSent = true;
    if (!hasEmailService) {
      console.log(`\n[DEV] Verification code for ${email}: ${code}\n`);
      emailSent = false;
    } else {
      try { await sendVerificationEmail(email, code); }
      catch { emailSent = false; }
    }

    res.status(201).json({
      success: true,
      emailSent,
      autoVerified: !hasEmailService,
      message: hasEmailService
        ? 'Account created. Please verify your email.'
        : 'Account created successfully.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login  (web — returns JWT)
router.post('/login', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user || !user.password)
      return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.isVerified)
      return res.status(403).json({ error: 'Please verify your email before signing in.' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/mobile-login  (returns opaque token, 30d)
router.post('/mobile-login', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user || !user.password)
      return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.isVerified)
      return res.status(403).json({ error: 'Please verify your email before signing in.' });

    const mobileToken = crypto.randomBytes(32).toString('hex');
    const mobileTokenExpiry = new Date(Date.now() + TOKEN_TTL_MS);
    await User.findByIdAndUpdate(user._id, { mobileToken, mobileTokenExpiry });

    res.json({
      success: true,
      token: mobileToken,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        name: user.fullName || user.username,
        role: user.role,
        avatar: user.avatar ?? null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/verify
router.post('/verify', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { code } = req.body;

    if (!email || !code)
      return res.status(400).json({ error: 'Email and code are required' });

    const record = await VerificationCode.findOne({ email, code });
    if (!record)
      return res.status(400).json({ error: 'Invalid verification code' });

    if (record.expiresAt < new Date())
      return res.status(400).json({ error: 'Verification code has expired' });

    await User.findOneAndUpdate({ email }, { isVerified: true });
    await VerificationCode.deleteMany({ email });

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/resend-code
router.post('/resend-code', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email)
      return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ error: 'User not found' });

    if (user.isVerified)
      return res.status(400).json({ error: 'Account already verified' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await VerificationCode.deleteMany({ email });
    await VerificationCode.create({ email, code, expiresAt });

    if (process.env.RESEND_API_KEY) {
      await sendVerificationEmail(email, code);
    } else {
      console.log(`[DEV] New code for ${email}: ${code}`);
    }

    res.json({ success: true, message: 'Verification code sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout  (invalidate mobile token)
router.post('/logout', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { mobileToken: null, mobileTokenExpiry: null });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const User = require('../models/User');
const jwtConfig = require('../config/jwt');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { logAuthEvent } = require('../services/auditService');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash +refreshTokens');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact admin.' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const payload = { id: user._id, email: user.email, role: user.role };
  const accessToken = jwtConfig.signAccessToken(payload);
  const refreshToken = jwtConfig.signRefreshToken(payload);

  // Store refresh token (keep only last 5)
  user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
  user.lastLogin = new Date();
  await user.save();

  await logAuthEvent(user, 'user_login', req);

  res.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: user.toSafeObject(),
    },
  });
});

// POST /api/auth/refresh
router.post('/refresh', validate(refreshSchema), async (req, res) => {
  const { refreshToken } = req.body;

  let decoded;
  try {
    decoded = jwtConfig.verifyRefreshToken(refreshToken);
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user || !user.refreshTokens.includes(refreshToken)) {
    return res.status(401).json({ success: false, message: 'Refresh token revoked' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Account is deactivated' });
  }

  const payload = { id: user._id, email: user.email, role: user.role };
  const newAccessToken = jwtConfig.signAccessToken(payload);
  const newRefreshToken = jwtConfig.signRefreshToken(payload);

  // Rotate refresh token
  user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken).slice(-4).concat(newRefreshToken);
  await user.save();

  res.json({
    success: true,
    data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
  });
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  const { refreshToken } = req.body;
  const user = await User.findById(req.userId).select('+refreshTokens');
  if (user && refreshToken) {
    user.refreshTokens = (user.refreshTokens || []).filter((t) => t !== refreshToken);
    await user.save();
  }
  await logAuthEvent(req.user, 'user_logout', req);
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, data: user.toSafeObject() });
});

// PUT /api/auth/me — update own profile
router.put('/me', authenticate, async (req, res) => {
  const allowedFields = ['name', 'phone', 'avatar'];
  const updates = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true });
  res.json({ success: true, data: user.toSafeObject() });
});

// PUT /api/auth/change-password
router.put('/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'Invalid password data. New password must be at least 8 characters.' });
  }

  const user = await User.findById(req.userId).select('+passwordHash');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }

  user.passwordHash = await User.hashPassword(newPassword);
  user.refreshTokens = []; // Invalidate all sessions
  await user.save();

  await logAuthEvent(user, 'password_changed', req);

  res.json({ success: true, message: 'Password changed successfully. Please log in again.' });
});

// GET /api/auth/users (admin only)
router.get('/users', authenticate, async (req, res) => {
  if (!['super_admin', 'admin'].includes(req.userRole)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  const users = await User.find().select('-passwordHash -refreshTokens').sort({ createdAt: -1 });
  res.json({ success: true, data: users, total: users.length });
});

// POST /api/auth/users (super_admin only)
router.post('/users', authenticate, async (req, res) => {
  if (req.userRole !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Only super admins can create users' });
  }

  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'name, email, password, and role are required' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already exists' });
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role });

  await logAuthEvent(req.user, 'user_created', req);

  res.status(201).json({ success: true, data: user.toSafeObject() });
});

// PATCH /api/auth/users/:id (super_admin only)
router.patch('/users/:id', authenticate, async (req, res) => {
  if (req.userRole !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Only super admins can modify users' });
  }

  const { name, role, isActive } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (role !== undefined) updates.role = role;
  if (isActive !== undefined) updates.isActive = isActive;

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  res.json({ success: true, data: user.toSafeObject() });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { logAuthEvent, createAuditLog, createAuditEntry } = require('../services/auditService');

const VALID_ROLES = ['super_admin', 'admin', 'finance', 'operations', 'agent'];

// Validation schemas
const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid(...VALID_ROLES).required(),
  phone: Joi.string().allow('', null).optional(),
  title: Joi.string().allow('', null).optional(),
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).max(100).optional(),
  role: Joi.string().valid(...VALID_ROLES).optional(),
  isActive: Joi.boolean().optional(),
  phone: Joi.string().allow('', null).optional(),
  title: Joi.string().allow('', null).optional(),
});

/**
 * GET /api/users
 * Restricted to super_admin and admin
 */
router.get('/', authorize('super_admin', 'admin'), async (req, res) => {
  const { role, isActive, search } = req.query;
  const filter = {};

  if (role && VALID_ROLES.includes(role)) {
    filter.role = role;
  }
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(filter)
    .select('-passwordHash -refreshTokens')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: users,
    total: users.length,
  });
});

/**
 * GET /api/users/:id
 * Restricted to super_admin and admin
 */
router.get('/:id', authorize('super_admin', 'admin'), async (req, res) => {
  const user = await User.findById(req.params.id).select('-passwordHash -refreshTokens');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({
    success: true,
    data: user,
  });
});

/**
 * POST /api/users
 * Create a new user with designated role
 * - super_admin can create any role (including super_admin)
 * - admin can create admin, finance, operations, agent
 */
router.post('/', authorize('super_admin', 'admin'), validate(createUserSchema), async (req, res) => {
  const { name, email, password, role, phone, title } = req.body;

  // Role creation permission check
  if (role === 'super_admin' && req.userRole !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Only super admins can provision new super admin accounts',
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: `A user with email ${normalizedEmail} already exists`,
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const newUser = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role,
    phone: phone || '',
    title: title || '',
    isActive: true,
  });

  // Audit trail (safely logged without blocking response)
  createAuditEntry({
    userEmail: req.user?.email || 'system',
    userName: req.user?.name || 'Administrator',
    action: 'USER_CREATED',
    entityType: 'User',
    entityId: newUser._id.toString(),
    details: `Created user account for ${newUser.name} (${newUser.email}) with role '${role}'`,
    ipAddress: req.ip,
  }).catch((err) => {
    // Non-blocking
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: newUser.toSafeObject(),
  });
});

/**
 * PATCH /api/users/:id
 * Update an existing user's role, status, or details
 */
router.patch('/:id', authorize('super_admin', 'admin'), validate(updateUserSchema), async (req, res) => {
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Prevent admin from modifying super_admin
  if (targetUser.role === 'super_admin' && req.userRole !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Only super admins can modify other super admin accounts',
    });
  }

  // Prevent admin from promoting anyone to super_admin
  if (req.body.role === 'super_admin' && req.userRole !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Only super admins can assign the super_admin role',
    });
  }

  const updates = {};
  if (req.body.name !== undefined) updates.name = req.body.name.trim();
  if (req.body.role !== undefined) updates.role = req.body.role;
  if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
  if (req.body.phone !== undefined) updates.phone = req.body.phone;
  if (req.body.title !== undefined) updates.title = req.body.title;

  if (req.body.password) {
    updates.passwordHash = await bcrypt.hash(req.body.password, 12);
    updates.refreshTokens = []; // Force re-login
  }

  const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).select('-passwordHash -refreshTokens');

  // Audit trail
  const detailsList = Object.keys(updates)
    .filter(k => k !== 'passwordHash')
    .map(k => `${k}=${updates[k]}`)
    .join(', ');

  createAuditEntry({
    userEmail: req.user?.email || 'system',
    userName: req.user?.name || 'Administrator',
    action: req.body.isActive !== undefined ? 'USER_STATUS_CHANGE' : 'USER_UPDATED',
    entityType: 'User',
    entityId: updatedUser._id.toString(),
    details: `Updated user ${updatedUser.name} (${updatedUser.email}): ${detailsList || 'Password reset'}`,
    ipAddress: req.ip,
  }).catch(() => {});

  res.json({
    success: true,
    message: 'User updated successfully',
    data: updatedUser,
  });
});

/**
 * DELETE /api/users/:id
 * Restricted to super_admin only
 */
router.delete('/:id', authorize('super_admin'), async (req, res) => {
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Prevent self-deletion
  if (targetUser._id.toString() === req.userId.toString()) {
    return res.status(400).json({
      success: false,
      message: 'You cannot delete your own super admin account',
    });
  }

  await User.findByIdAndDelete(req.params.id);

  // Audit trail
  createAuditEntry({
    userEmail: req.user?.email || 'system',
    userName: req.user?.name || 'Super Admin',
    action: 'USER_DELETED',
    entityType: 'User',
    entityId: targetUser._id.toString(),
    details: `Deleted user account ${targetUser.name} (${targetUser.email}, role: ${targetUser.role})`,
    ipAddress: req.ip,
  }).catch(() => {});

  res.json({
    success: true,
    message: `User ${targetUser.name} deleted successfully`,
  });
});

module.exports = router;

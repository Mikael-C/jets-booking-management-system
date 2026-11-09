const express = require('express');
const router = express.Router();
const Joi = require('joi');
const User = require('../models/User');
const { authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createAuditEntry } = require('../services/auditService');

// ─── GET /api/tokens/balance ────────────────────────────────────────────────
router.get('/balance', async (req, res) => {
  const user = await User.findById(req.userId).select('tokens tokenTier subscriptionStatus subscriptionExpiresAt tokenTransactions role');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Staff roles have unlimited access
  const isStaff = ['super_admin', 'admin', 'finance', 'operations'].includes(user.role);

  res.json({
    success: true,
    data: {
      tokens: user.tokens ?? (isStaff ? 999999 : 0),
      isStaff,
      tokenTier: user.tokenTier || (isStaff ? 'enterprise' : 'free'),
      subscriptionStatus: user.subscriptionStatus || (isStaff ? 'active' : 'none'),
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      recentTransactions: (user.tokenTransactions || []).slice(-10).reverse(),
    },
  });
});

// ─── POST /api/tokens/subscribe ─────────────────────────────────────────────
// Agent subscribes/refills: 2000 tokens for £500 GBP or $600 USD
const subscribeSchema = Joi.object({
  currency: Joi.string().valid('GBP', 'USD').default('GBP'),
  paymentMethod: Joi.string().allow('', null).default('card'),
});

router.post('/subscribe', validate(subscribeSchema), async (req, res) => {
  const { currency, paymentMethod } = req.body;
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const pricePaid = currency === 'USD' ? 600 : 500;
  const tokensToAdd = 2000;
  const newBalance = (user.tokens || 0) + tokensToAdd;

  const newTx = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'credit',
    amount: tokensToAdd,
    balanceAfter: newBalance,
    action: 'SUBSCRIPTION_PURCHASE',
    description: `Subscribed to 2,000 Token Package (${currency === 'USD' ? '$600 USD' : '£500 GBP'}) via ${paymentMethod || 'Credit Card'}`,
    currency: currency || 'GBP',
    pricePaid,
    createdAt: new Date(),
  };

  user.tokens = newBalance;
  user.tokenTier = 'standard';
  user.subscriptionStatus = 'active';
  // 30 days renewal window from now or extends current expiration
  const baseDate = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date()
    ? new Date(user.subscriptionExpiresAt)
    : new Date();
  user.subscriptionExpiresAt = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (!user.tokenTransactions) {
    user.tokenTransactions = [];
  }
  user.tokenTransactions.push(newTx);
  await user.save();

  createAuditEntry({
    user,
    action: 'TOKEN_SUBSCRIPTION_PURCHASE',
    entityType: 'tokens',
    entityId: user._id.toString(),
    details: {
      tokensGranted: tokensToAdd,
      currency,
      pricePaid,
      newBalance,
      paymentMethod,
    },
    req,
  }).catch(() => {});

  res.json({
    success: true,
    message: `Subscription successful! 2,000 tokens added to your balance.`,
    data: {
      tokens: user.tokens,
      tokenTier: user.tokenTier,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      transaction: newTx,
    },
  });
});

// ─── POST /api/tokens/deduct ────────────────────────────────────────────────
// Deducts tokens (default 100 per core agent action)
const deductSchema = Joi.object({
  amount: Joi.number().integer().min(1).default(100),
  action: Joi.string().required(),
  description: Joi.string().allow('', null).optional(),
});

router.post('/deduct', validate(deductSchema), async (req, res) => {
  const { amount, action, description } = req.body;
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Staff roles have unlimited bypass
  if (['super_admin', 'admin', 'finance', 'operations'].includes(user.role)) {
    return res.json({
      success: true,
      bypassed: true,
      message: `Staff role (${user.role}) has unlimited access. No tokens deducted.`,
      balance: 999999,
    });
  }

  const currentBalance = user.tokens || 0;
  if (currentBalance < amount) {
    return res.status(402).json({
      success: false,
      code: 'INSUFFICIENT_TOKENS',
      message: `Insufficient token balance (${currentBalance} available, ${amount} required for ${action}). Please subscribe or refill to continue.`,
      balance: currentBalance,
      required: amount,
    });
  }

  const newBalance = currentBalance - amount;
  const newTx = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'debit',
    amount,
    balanceAfter: newBalance,
    action,
    description: description || `Used ${amount} tokens for ${action}`,
    currency: 'GBP',
    pricePaid: 0,
    createdAt: new Date(),
  };

  user.tokens = newBalance;
  if (!user.tokenTransactions) {
    user.tokenTransactions = [];
  }
  user.tokenTransactions.push(newTx);
  await user.save();

  createAuditEntry({
    user,
    action: 'TOKEN_DEDUCTION',
    entityType: 'tokens',
    entityId: user._id.toString(),
    details: {
      amount,
      action,
      remainingTokens: newBalance,
      description,
    },
    req,
  }).catch(() => {});

  res.json({
    success: true,
    message: `Deducted ${amount} tokens for ${action}. Remaining balance: ${newBalance}`,
    balance: newBalance,
    transaction: newTx,
  });
});

// ─── GET /api/tokens/transactions ───────────────────────────────────────────
router.get('/transactions', async (req, res) => {
  const user = await User.findById(req.userId).select('tokenTransactions');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const transactions = (user.tokenTransactions || []).slice().reverse();
  res.json({
    success: true,
    data: transactions,
    total: transactions.length,
  });
});

// ─── POST /api/tokens/grant (admin / super_admin only) ───────────────────────
const grantSchema = Joi.object({
  targetUserId: Joi.string().required(),
  amount: Joi.number().integer().min(1).required(),
  reason: Joi.string().allow('', null).optional(),
});

router.post('/grant', authorize('super_admin', 'admin'), validate(grantSchema), async (req, res) => {
  const { targetUserId, amount, reason } = req.body;
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'Target user not found' });
  }

  const newBalance = (targetUser.tokens || 0) + amount;
  const newTx = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'credit',
    amount,
    balanceAfter: newBalance,
    action: 'ADMIN_GRANT',
    description: reason || `Granted ${amount} tokens by administrator`,
    currency: 'GBP',
    pricePaid: 0,
    createdAt: new Date(),
  };

  targetUser.tokens = newBalance;
  if (!targetUser.tokenTransactions) {
    targetUser.tokenTransactions = [];
  }
  targetUser.tokenTransactions.push(newTx);
  await targetUser.save();

  createAuditEntry({
    user: req.user,
    action: 'ADMIN_TOKEN_GRANT',
    entityType: 'tokens',
    entityId: targetUser._id.toString(),
    details: {
      targetEmail: targetUser.email,
      amount,
      reason,
      newBalance,
    },
    req,
  }).catch(() => {});

  res.json({
    success: true,
    message: `Granted ${amount} tokens to ${targetUser.name} (${targetUser.email}). New balance: ${newBalance}`,
    data: {
      targetUserId: targetUser._id,
      newBalance,
      transaction: newTx,
    },
  });
});

module.exports = router;

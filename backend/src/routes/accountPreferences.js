const express = require('express');
const router = express.Router();
const Joi = require('joi');
const AccountPreference = require('../models/AccountPreference');
const { validate } = require('../middleware/validate');

const saveSchema = Joi.object({
  accountId: Joi.string().allow('').optional(),
  quoteDefaults: Joi.object({
    authorisedOwnerId: Joi.string().allow('').optional(),
    isHandledByPa: Joi.boolean().optional(),
    assistantContactId: Joi.string().allow('').optional(),
    sendDocsTo: Joi.string().valid('owner', 'assistant', 'both').optional(),
    signsAgreement: Joi.string().valid('owner', 'assistant').optional(),
  }).required(),
});

// GET /api/account-preferences · all saved defaults (merged into accounts by the app)
router.get('/', async (req, res) => {
  const items = await AccountPreference.find().sort({ updatedAt: -1 }).limit(2000).lean();
  res.json({ success: true, data: items });
});

// GET /api/account-preferences/:accountNumber
router.get('/:accountNumber', async (req, res) => {
  const item = await AccountPreference.findOne({ accountNumber: req.params.accountNumber }).lean();
  if (!item) return res.status(404).json({ success: false, message: 'No saved defaults for this account' });
  res.json({ success: true, data: item });
});

// PUT /api/account-preferences/:accountNumber · saved when a quote is completed
router.put('/:accountNumber', validate(saveSchema), async (req, res) => {
  const item = await AccountPreference.findOneAndUpdate(
    { accountNumber: req.params.accountNumber },
    {
      $set: {
        accountNumber: req.params.accountNumber,
        accountId: req.body.accountId || '',
        quoteDefaults: req.body.quoteDefaults,
        updatedBy: req.user?.email || '',
      },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json({ success: true, data: item });
});

module.exports = router;

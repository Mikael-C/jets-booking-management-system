const express = require('express');
const router = express.Router();
const CuratorTierConfig = require('../models/CuratorTierConfig');
const User = require('../models/User');
const { createAuditEntry } = require('../services/auditService');

const initialConfig = {
  singletonKey: 'default_config',
  tiers: [
    {
      tier: 'Founding',
      handlesTrips: 'No',
      requestsRoutedTo: 'Desk (default) or chosen Associate',
      monthlyTokens: 10,
      startupTokens: 0,
      expiry: 'Month end',
      markupRange: '5–12 %',
      handlingShare: '20 % of mark-up',
    },
    {
      tier: 'Patron',
      handlesTrips: 'By choice',
      requestsRoutedTo: 'Desk, chosen Associate, or self',
      monthlyTokens: 5,
      startupTokens: 0,
      expiry: 'Month end',
      markupRange: '5–12 %',
      handlingShare: '20 % of mark-up',
    },
    {
      tier: 'Associate',
      handlesTrips: 'Yes',
      requestsRoutedTo: 'Self; receives assigned leads',
      monthlyTokens: 0,
      startupTokens: 5,
      expiry: 'None',
      markupRange: '5–12 %',
      handlingShare: 'Earns it when handling',
    },
  ],
  tokenRules: {
    pricePerToken: 15,
    perRequest: '1 token per leg',
    afterSignature: 'No further tokens, including changes',
    earnedTokens: '+1 per booking completed or cancelled with fee',
    paidExpiry: 'Never',
    bundles: '15 · $200 / 25 · $310 / 50 · $560',
    freeRevisions: '2 before contract signature',
    returnedConditions: 'No aircraft found; booking cancelled for operational reasons',
    orderOfUse: 'Monthly → free → paid',
    assignedLeads: 'No tokens',
  },
  directRoute: {
    bookingDeposit: 500,
    depositTerms: 'credited within 30 days; refunded if no aircraft.',
    assignmentRule: 'city / rotation / availability',
    standardMarkupPct: 8,
  },
  topUpHistory: [
    {
      curatorId: 'CUR-07',
      curatorName: 'No. 07',
      tokensAdded: 6,
      grantedBy: 'Obi (MD)',
      date: '12 Nov',
    },
  ],
};

async function getConfig() {
  let config = await CuratorTierConfig.findOne({ singletonKey: 'default_config' });
  if (!config) {
    config = await CuratorTierConfig.create(initialConfig);
  }
  return config;
}

// GET /api/curator-tiers
router.get('/', async (req, res) => {
  const config = await getConfig();
  res.json({ success: true, data: config });
});

// PUT /api/curator-tiers
router.put('/', async (req, res) => {
  const { tiers, tokenRules, directRoute } = req.body;
  const config = await getConfig();

  if (tiers) config.tiers = tiers;
  if (tokenRules) config.tokenRules = { ...config.tokenRules.toObject(), ...tokenRules };
  if (directRoute) config.directRoute = { ...config.directRoute.toObject(), ...directRoute };

  await config.save();
  res.json({ success: true, data: config, message: 'Curator tiers and token rules updated successfully' });
});

// POST /api/curator-tiers/top-up
router.post('/top-up', async (req, res) => {
  const { curatorId, curatorName, tokensAdded = 6, grantedBy = 'Obi (MD)' } = req.body;
  const config = await getConfig();

  const entry = {
    curatorId: curatorId || 'CUR-07',
    curatorName: curatorName || 'No. 07',
    tokensAdded: Number(tokensAdded) || 6,
    grantedBy,
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    createdAt: new Date(),
  };

  config.topUpHistory.unshift(entry);
  await config.save();

  // Also add tokens to user if exists
  if (curatorId) {
    await User.updateOne(
      { $or: [{ id: curatorId }, { email: curatorId }] },
      { $inc: { tokens: Number(tokensAdded) } }
    ).catch(() => {});
  }

  res.json({ success: true, data: entry, message: `Added ${tokensAdded} tokens to ${entry.curatorName}` });
});

module.exports = router;

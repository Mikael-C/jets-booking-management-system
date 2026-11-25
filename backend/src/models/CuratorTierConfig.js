const mongoose = require('mongoose');

const curatorTierSchema = new mongoose.Schema({
  tier: { type: String, required: true }, // Founding, Patron, Associate
  handlesTrips: { type: String, default: 'No' }, // No, By choice, Yes
  requestsRoutedTo: { type: String, default: 'Desk (default) or chosen Associate' },
  monthlyTokens: { type: Number, default: 10 },
  startupTokens: { type: Number, default: 0 },
  expiry: { type: String, default: 'Month end' },
  markupRange: { type: String, default: '5–12 %' },
  handlingShare: { type: String, default: '20 % of mark-up' },
}, { _id: false });

const tokenRulesSchema = new mongoose.Schema({
  pricePerToken: { type: Number, default: 15 },
  perRequest: { type: String, default: '1 token per leg' },
  afterSignature: { type: String, default: 'No further tokens, including changes' },
  earnedTokens: { type: String, default: '+1 per booking completed or cancelled with fee' },
  paidExpiry: { type: String, default: 'Never' },
  bundles: { type: String, default: '15 · $200 / 25 · $310 / 50 · $560' },
  freeRevisions: { type: String, default: '2 before contract signature' },
  returnedConditions: { type: String, default: 'No aircraft found; booking cancelled for operational reasons' },
  orderOfUse: { type: String, default: 'Monthly → free → paid' },
  assignedLeads: { type: String, default: 'No tokens' },
}, { _id: false });

const directRouteSchema = new mongoose.Schema({
  bookingDeposit: { type: Number, default: 500 },
  depositTerms: { type: String, default: 'credited within 30 days; refunded if no aircraft.' },
  assignmentRule: { type: String, default: 'city / rotation / availability' },
  standardMarkupPct: { type: Number, default: 8 },
}, { _id: false });

const topUpLogSchema = new mongoose.Schema({
  curatorId: { type: String, required: true },
  curatorName: { type: String, required: true },
  tokensAdded: { type: Number, default: 6 },
  grantedBy: { type: String, default: 'Obi (MD)' },
  date: { type: String, default: '12 Nov' },
  createdAt: { type: Date, default: Date.now },
});

const curatorConfigSchema = new mongoose.Schema({
  singletonKey: { type: String, default: 'default_config', unique: true },
  tiers: [curatorTierSchema],
  tokenRules: { type: tokenRulesSchema, default: () => ({}) },
  directRoute: { type: directRouteSchema, default: () => ({}) },
  topUpHistory: [topUpLogSchema],
  // Price estimate rate table (Curator portal): hourly rates, fees and speeds per category
  rateTable: { type: [mongoose.Schema.Types.Mixed], default: undefined },
}, {
  timestamps: true,
});

module.exports = mongoose.model('CuratorTierConfig', curatorConfigSchema);

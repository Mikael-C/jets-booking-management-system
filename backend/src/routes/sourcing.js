const express = require('express');
const router = express.Router();
const AgentRequest = require('../models/AgentRequest');
const { authorize } = require('../middleware/auth');
const { createAuditEntry } = require('../services/auditService');

// GET /api/sourcing/:requestId/options
router.get('/:requestId/options', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const request = await AgentRequest.findById(req.params.requestId);
  if (!request) return res.status(404).json({ message: 'Agent request not found' });
  res.json(request.sourcingOptions || []);
});

// POST /api/sourcing/:requestId/options — add a sourcing option
router.post('/:requestId/options', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const { operatorName, aircraftType, aircraftRegistration, baseAirport, price, currency = 'EUR', taxesIncluded = false, validUntil, notes, avInodeTripId } = req.body;
  if (!operatorName || !price) return res.status(400).json({ message: 'operatorName and price are required' });

  const request = await AgentRequest.findById(req.params.requestId);
  if (!request) return res.status(404).json({ message: 'Agent request not found' });

  const option = {
    id: `src-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    operatorName, aircraftType, aircraftRegistration, baseAirport,
    price, currency, taxesIncluded, validUntil, notes, avInodeTripId,
    createdAt: new Date().toISOString()
  };

  request.sourcingOptions = request.sourcingOptions || [];
  request.sourcingOptions.push(option);
  if (request.status === 'pending') request.status = 'in_sourcing';
  await request.save();

  await createAuditEntry({ user: req.user,
    action: 'SOURCING_OPTION_ADDED', entityType: 'AgentRequest', entityId: request._id.toString(),
    details: `Added sourcing option from ${operatorName} at ${currency} ${price} for request ${request._id}`
  });

  res.status(201).json(option);
});

// DELETE /api/sourcing/:requestId/options/:optionId
router.delete('/:requestId/options/:optionId', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const request = await AgentRequest.findById(req.params.requestId);
  if (!request) return res.status(404).json({ message: 'Agent request not found' });

  const before = (request.sourcingOptions || []).length;
  request.sourcingOptions = (request.sourcingOptions || []).filter(o => o.id !== req.params.optionId);
  if (request.sourcingOptions.length === before) return res.status(404).json({ message: 'Sourcing option not found' });
  await request.save();
  res.json({ message: 'Sourcing option removed' });
});

module.exports = router;

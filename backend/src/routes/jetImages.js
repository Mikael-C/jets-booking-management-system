const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const jetImagesService = require('../services/jetImagesService');

// GET /api/jet-images/search?query=gulfstream+g650+interior
router.get('/search', authorize('super_admin', 'admin', 'operations', 'finance', 'agent'), async (req, res) => {
  const { query, page = 1, perPage = 15 } = req.query;
  if (!query) return res.status(400).json({ message: 'query is required' });
  const results = await jetImagesService.searchImages(query, parseInt(page), parseInt(perPage));
  res.json(results);
});

// GET /api/jet-images/aircraft/:aircraftModel
router.get('/aircraft/:aircraftModel', authorize('super_admin', 'admin', 'operations', 'finance', 'agent'), async (req, res) => {
  const { view } = req.query; // 'interior' | 'exterior' | undefined (both)
  const results = await jetImagesService.getAircraftImages(
    decodeURIComponent(req.params.aircraftModel), view
  );
  res.json(results);
});

// GET /api/jet-images/interior
router.get('/interior', authorize('super_admin', 'admin', 'operations', 'finance', 'agent'), async (req, res) => {
  const { aircraftType, page = 1 } = req.query;
  const query = aircraftType ? `${aircraftType} private jet interior cabin` : 'private jet interior luxury cabin';
  const results = await jetImagesService.searchImages(query, parseInt(page), 20);
  res.json(results);
});

// GET /api/jet-images/exterior
router.get('/exterior', authorize('super_admin', 'admin', 'operations', 'finance', 'agent'), async (req, res) => {
  const { aircraftType, page = 1 } = req.query;
  const query = aircraftType ? `${aircraftType} private jet exterior` : 'private jet exterior tarmac';
  const results = await jetImagesService.searchImages(query, parseInt(page), 20);
  res.json(results);
});

module.exports = router;

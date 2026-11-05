const express = require('express');
const router = express.Router();
const { airportsList, findAirportByCode, searchAirports } = require('../utils/airportData');

// GET /api/airports/search?q=geneva
router.get('/search', (req, res) => {
  const { q, limit = 20 } = req.query;
  if (!q || q.trim().length < 2) return res.status(400).json({ message: 'Search query must be at least 2 characters' });
  const results = searchAirports(q.trim(), parseInt(limit));
  res.json(results);
});

// GET /api/airports/:code — by ICAO or IATA
router.get('/:code', (req, res) => {
  const airport = findAirportByCode(req.params.code.toUpperCase());
  if (!airport) return res.status(404).json({ message: 'Airport not found' });
  res.json(airport);
});

// GET /api/airports — list popular airports
router.get('/', (req, res) => {
  const { popular, region, type } = req.query;
  let results = airportsList;
  if (popular === 'true') results = results.filter(a => a.popular);
  if (region) results = results.filter(a => a.region?.toLowerCase() === region.toLowerCase());
  if (type) results = results.filter(a => a.type === type);
  res.json(results.slice(0, 100));
});

module.exports = router;

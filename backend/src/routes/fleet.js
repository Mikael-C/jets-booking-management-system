const express = require('express');
const router = express.Router();
const Joi = require('joi');
const multer = require('multer');
const Aircraft = require('../models/Aircraft');
const { authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createAuditEntry } = require('../services/auditService');
const { getJetImages } = require('../services/jetImagesService');

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const aircraftSchema = Joi.object({
  name: Joi.string().required(),
  manufacturer: Joi.string().required(),
  category: Joi.string().valid(
    'turboprop',
    'piston',
    'entry-level',
    'light',
    'super-light',
    'midsize',
    'super-midsize',
    'heavy',
    'ultra-long-range',
    'vip-airliner'
  ).required(),
  categoryLabel: Joi.string().required(),
  registration: Joi.string().optional().allow(''),
  tagline: Joi.string().optional().allow(''),
  description: Joi.string().optional().allow(''),
  passengers: Joi.number().integer().min(1).max(30).required(),
  passengersLabel: Joi.string().optional().allow(''),
  range: Joi.number().min(0).required(),
  rangeLabel: Joi.string().optional().allow(''),
  cabinHeight: Joi.string().optional().allow(''),
  cabinWidth: Joi.string().optional().allow(''),
  baggageVolume: Joi.string().optional().allow(''),
  cruiseSpeed: Joi.string().optional().allow(''),
  yearOfManufacture: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
  yearOfRefurbishment: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
  pricePerHour: Joi.number().min(0).required(),
  toilette: Joi.boolean().default(true),
  smokingCabin: Joi.boolean().default(false),
  imageExterior: Joi.string().optional().allow(''),
  imageInterior: Joi.string().optional().allow('')
});

// GET /api/fleet
router.get('/', async (req, res) => {
  const { category, search } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { manufacturer: { $regex: search, $options: 'i' } },
      { registration: { $regex: search, $options: 'i' } }
    ];
  }
  const aircraft = await Aircraft.find(filter).sort({ pricePerHour: 1 });
  res.json(aircraft);
});

// GET /api/fleet/:id
router.get('/:id', async (req, res) => {
  const aircraft = await Aircraft.findById(req.params.id);
  if (!aircraft) return res.status(404).json({ message: 'Aircraft not found' });
  res.json(aircraft);
});

// GET /api/fleet/:id/images
router.get('/:id/images', authorize('super_admin', 'admin', 'operations', 'finance', 'agent'), async (req, res) => {
  const aircraft = await Aircraft.findById(req.params.id);
  if (!aircraft) return res.status(404).json({ message: 'Aircraft not found' });

  const images = await getJetImages(aircraft.name, aircraft.manufacturer);
  res.json({
    aircraftId: aircraft._id,
    aircraftName: aircraft.name,
    storedExterior: aircraft.imageExterior,
    storedInterior: aircraft.imageInterior,
    additionalImages: images
  });
});

// POST /api/fleet
router.post('/', authorize('super_admin', 'admin'), validate(aircraftSchema), async (req, res) => {
  const aircraft = new Aircraft(req.body);
  await aircraft.save();

  await createAuditEntry({ user: req.user,
    action: 'AIRCRAFT_CREATED', entityType: 'Aircraft', entityId: aircraft._id.toString(),
    details: `Added aircraft ${aircraft.name} (${aircraft.registration || 'no reg'}) to fleet`
  });
  res.status(201).json(aircraft);
});

// PUT /api/fleet/:id
router.put('/:id', authorize('super_admin', 'admin'), validate(aircraftSchema), async (req, res) => {
  const aircraft = await Aircraft.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!aircraft) return res.status(404).json({ message: 'Aircraft not found' });

  await createAuditEntry({ user: req.user,
    action: 'AIRCRAFT_UPDATED', entityType: 'Aircraft', entityId: aircraft._id.toString(),
    details: `Updated aircraft ${aircraft.name}`
  });
  res.json(aircraft);
});

// POST /api/fleet/:id/images — upload exterior/interior images
router.post('/:id/images', authorize('super_admin', 'admin'), upload.fields([
  { name: 'exterior', maxCount: 1 },
  { name: 'interior', maxCount: 1 }
]), async (req, res) => {
  const aircraft = await Aircraft.findById(req.params.id);
  if (!aircraft) return res.status(404).json({ message: 'Aircraft not found' });

  const cloudinary = require('../config/cloudinary');
  const updates = {};

  if (req.files?.exterior) {
    const extResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `orbelo/fleet/${aircraft._id}/exterior`, resource_type: 'image' },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(req.files.exterior[0].buffer);
    });
    updates.imageExterior = extResult.secure_url;
  }

  if (req.files?.interior) {
    const intResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `orbelo/fleet/${aircraft._id}/interior`, resource_type: 'image' },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(req.files.interior[0].buffer);
    });
    updates.imageInterior = intResult.secure_url;
  }

  const updated = await Aircraft.findByIdAndUpdate(req.params.id, updates, { new: true });
  res.json(updated);
});

// DELETE /api/fleet/:id
router.delete('/:id', authorize('super_admin'), async (req, res) => {
  const aircraft = await Aircraft.findByIdAndDelete(req.params.id);
  if (!aircraft) return res.status(404).json({ message: 'Aircraft not found' });
  await createAuditEntry({ user: req.user,
    action: 'AIRCRAFT_DELETED', entityType: 'Aircraft', entityId: req.params.id,
    details: `Removed aircraft ${aircraft.name} from fleet`
  });
  res.json({ message: 'Aircraft removed from fleet' });
});

module.exports = router;

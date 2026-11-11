const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Contact = require('../models/Contact');
const Booking = require('../models/Booking');
const { authorize } = require('../middleware/auth');

const findContact = async (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const contact = await Contact.findById(id);
    if (contact) return contact;
  }
  return Contact.findOne({ id, isDeleted: false });
};

const getContactName = (contact) =>
  [contact.prefix, contact.firstName, contact.middleName1, contact.middleName2, contact.lastName1, contact.lastName2, contact.suffix]
    .filter(Boolean)
    .join(' ')
    .trim();

router.get('/', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const { search, accountNumber, page = 1, limit = 100 } = req.query;
  const filter = { isDeleted: false };
  if (accountNumber) filter.associatedAccountId = accountNumber;
  if (search) {
    const regex = new RegExp(String(search).trim(), 'i');
    filter.$or = [
      { firstName: regex },
      { middleName1: regex },
      { middleName2: regex },
      { lastName1: regex },
      { lastName2: regex },
      { fullName: regex },
      { email: regex },
      { 'passportDetails.passportNumber': regex }
    ];
  }
  const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 100));
  const [contacts, total] = await Promise.all([
    Contact.find(filter).sort({ updatedAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize).lean(),
    Contact.countDocuments(filter)
  ]);
  res.json({ success: true, data: contacts, total, page: pageNumber });
});

router.get('/:id/trips', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const contact = await findContact(req.params.id);
  if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });

  const selectors = [];
  if (contact.tripsFlown?.length) {
    selectors.push({ tripId: { $in: contact.tripsFlown } }, { tripNumber: { $in: contact.tripsFlown } });
  }
  if (contact.email) selectors.push({ 'legs.passengers.email': contact.email });
  const passportNumber = contact.passportDetails?.passportNumber;
  if (passportNumber) selectors.push({ 'legs.passengers.passportNumber': passportNumber });
  const fullName = contact.fullName || getContactName(contact);
  if (fullName) {
    const escapedName = fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    selectors.push(
      { 'legs.passengers.fullName': new RegExp(`^${escapedName}$`, 'i') },
      { contractSignedBy: new RegExp(`^${escapedName}$`, 'i') }
    );
  }
  if (!selectors.length) return res.json({ success: true, data: [] });

  const trips = await Booking.find({
    isDeleted: false,
    isCancelled: { $ne: true },
    $and: [
      { $or: [{ isBooked: true }, { status: { $in: ['confirmed', 'dispatched', 'in_flight', 'completed', 'flown'] } }] },
      { $or: selectors }
    ]
  }).sort({ createdAt: -1 }).lean();
  return res.json({ success: true, data: trips });
});

router.post('/', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const body = req.body || {};
  const contact = await Contact.create({
    ...body,
    id: body.id || `contact-${Date.now()}`,
    fullName: body.fullName || getContactName(body)
  });
  return res.status(201).json({ success: true, data: contact });
});

router.put('/:id', authorize('super_admin', 'admin', 'operations'), async (req, res) => {
  const contact = await findContact(req.params.id);
  if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
  const updates = { ...req.body };
  delete updates._id;
  delete updates.id;
  delete updates.tripsFlown;
  Object.assign(contact, updates);
  contact.fullName = req.body.fullName || getContactName(contact);
  await contact.save();
  return res.json({ success: true, data: contact });
});

router.delete('/:id', authorize('super_admin', 'admin'), async (req, res) => {
  const contact = await findContact(req.params.id);
  if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
  contact.isDeleted = true;
  await contact.save();
  return res.json({ success: true });
});

module.exports = router;

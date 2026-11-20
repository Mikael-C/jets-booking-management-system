const express = require('express');
const router = express.Router();
const { PolicyDocument, PersonException } = require('../models/PolicyDocument');
const { v4: uuidv4 } = require('uuid');

const initialDocuments = [
  {
    code: 'OPS-MAN',
    title: 'Operations Manual',
    type: 'Manual',
    version: 'v1.0',
    updatedDate: '19 Nov 2026',
    ownerApprover: 'Obi (MD)',
    whoCanOpen: 'All staff · duty officers',
    status: 'Approved',
    accessMatrix: {
      md: 'Edit',
      dutyOfficer: 'View + download',
      finance: 'View + download',
      salesDesk: 'View + download',
      curatorFounding: '—',
      curatorStandard: '—',
      operatorExternal: '—',
    },
  },
  {
    code: 'POL-C1',
    title: 'Brokerage terms (client)',
    type: 'Contract template',
    version: 'v0.9 draft',
    updatedDate: '19 Nov 2026',
    ownerApprover: 'Lawyer review',
    whoCanOpen: 'All staff',
    status: 'Lawyer review',
    accessMatrix: {
      md: 'Edit',
      dutyOfficer: 'View + download',
      finance: 'View + download',
      salesDesk: 'View + download',
      curatorFounding: '—',
      curatorStandard: '—',
      operatorExternal: '—',
    },
  },
  {
    code: 'POL-C2',
    title: 'Charter agreement',
    type: 'Contract template',
    version: 'v0.9 draft',
    updatedDate: '19 Nov 2026',
    ownerApprover: 'Lawyer review',
    whoCanOpen: 'All staff',
    status: 'Lawyer review',
    accessMatrix: {
      md: 'Edit',
      dutyOfficer: 'View + download',
      finance: 'View + download',
      salesDesk: 'View + download',
      curatorFounding: '—',
      curatorStandard: '—',
      operatorExternal: '—',
    },
  },
  {
    code: 'POL-C3',
    title: 'Cancellation table',
    type: 'Policy',
    version: 'v0.1',
    updatedDate: '19 Nov 2026',
    ownerApprover: 'Obi (MD)',
    whoCanOpen: 'All staff · Curators',
    status: 'Awaiting policy',
    accessMatrix: {
      md: 'Edit',
      dutyOfficer: 'View + download',
      finance: 'View + download',
      salesDesk: 'View + download',
      curatorFounding: 'View + download',
      curatorStandard: 'View + download',
      operatorExternal: '—',
    },
  },
  {
    code: 'POL-D1',
    title: 'Operator framework agreement',
    type: 'Contract template',
    version: 'v0.9 draft',
    updatedDate: '19 Nov 2026',
    ownerApprover: 'Lawyer review',
    whoCanOpen: 'Ops, MD',
    status: 'Lawyer review',
    accessMatrix: {
      md: 'Edit',
      dutyOfficer: 'View + download',
      finance: '—',
      salesDesk: '—',
      curatorFounding: '—',
      curatorStandard: '—',
      operatorExternal: 'Own signed copy',
    },
  },
  {
    code: 'POL-E2',
    title: 'Curator agreement',
    type: 'Contract template',
    version: 'v0.9 draft',
    updatedDate: '19 Nov 2026',
    ownerApprover: 'Lawyer review',
    whoCanOpen: 'MD · Curators (own copy)',
    status: 'Lawyer review',
    accessMatrix: {
      md: 'Edit',
      dutyOfficer: '—',
      finance: '—',
      salesDesk: '—',
      curatorFounding: 'Own signed copy',
      curatorStandard: 'Own signed copy',
      operatorExternal: '—',
    },
  },
  {
    code: 'POL-E3',
    title: 'Curator code of conduct',
    type: 'Policy',
    version: 'v1.0',
    updatedDate: '19 Nov 2026',
    ownerApprover: 'Obi (MD)',
    whoCanOpen: 'All staff · Curators',
    status: 'Approved',
    accessMatrix: {
      md: 'Edit',
      dutyOfficer: 'View + download',
      finance: 'View + download',
      salesDesk: 'View + download',
      curatorFounding: 'View + download',
      curatorStandard: 'View + download',
      operatorExternal: '—',
    },
  },
  {
    code: 'POL-F1',
    title: 'KYC and anti-money-laundering',
    type: 'Policy',
    version: 'v1.0',
    updatedDate: '19 Nov 2026',
    ownerApprover: 'Obi (MD)',
    whoCanOpen: 'MD, finance, duty officers',
    status: 'Approved',
    accessMatrix: {
      md: 'Edit',
      dutyOfficer: 'View + download',
      finance: 'View + download',
      salesDesk: '—',
      curatorFounding: '—',
      curatorStandard: '—',
      operatorExternal: '—',
    },
  },
  {
    code: 'POL-F3',
    title: 'Data protection (GDPR / NDPA)',
    type: 'Policy',
    version: 'v1.0',
    updatedDate: '19 Nov 2026',
    ownerApprover: 'Obi (MD)',
    whoCanOpen: 'All staff',
    status: 'Approved',
    accessMatrix: {
      md: 'Edit',
      dutyOfficer: 'View + download',
      finance: 'View + download',
      salesDesk: 'View + download',
      curatorFounding: '—',
      curatorStandard: '—',
      operatorExternal: '—',
    },
  },
  {
    code: 'POL-F5',
    title: 'Data breach response',
    type: 'Procedure',
    version: 'v1.0',
    updatedDate: '19 Nov 2026',
    ownerApprover: 'Obi (MD)',
    whoCanOpen: 'MD, IT',
    status: 'Approved',
    accessMatrix: {
      md: 'Edit',
      dutyOfficer: 'View + download',
      finance: '—',
      salesDesk: '—',
      curatorFounding: '—',
      curatorStandard: '—',
      operatorExternal: '—',
    },
  },
  {
    code: 'POL-G1',
    title: 'Invoicing and VAT',
    type: 'Procedure',
    version: 'v0.9',
    updatedDate: '19 Nov 2026',
    ownerApprover: 'Tax adviser',
    whoCanOpen: 'MD, finance',
    status: 'Adviser review',
    accessMatrix: {
      md: 'Edit',
      dutyOfficer: '—',
      finance: 'View + download',
      salesDesk: '—',
      curatorFounding: '—',
      curatorStandard: '—',
      operatorExternal: '—',
    },
  },
  {
    code: 'MKT-01',
    title: 'Curator sales kit',
    type: 'Guide',
    version: 'v1.0',
    updatedDate: '19 Nov 2026',
    ownerApprover: 'Obi (MD)',
    whoCanOpen: 'Curators',
    status: 'Approved',
    accessMatrix: {
      md: 'Edit',
      dutyOfficer: 'View + download',
      finance: '—',
      salesDesk: 'View + download',
      curatorFounding: 'View + download',
      curatorStandard: 'View + download',
      operatorExternal: '—',
    },
  },
  {
    code: 'EMR-01',
    title: 'Emergency response checklist',
    type: 'Checklist',
    version: 'v1.0',
    updatedDate: '19 Nov 2026',
    ownerApprover: 'Obi (MD)',
    whoCanOpen: 'Duty officers · MD',
    status: 'Approved',
    accessMatrix: {
      md: 'Edit',
      dutyOfficer: 'View + download',
      finance: '—',
      salesDesk: '—',
      curatorFounding: '—',
      curatorStandard: '—',
      operatorExternal: '—',
    },
  },
];

const initialExceptions = [
  {
    id: 'exc-1',
    personName: 'Ada N. (new duty officer)',
    personRole: 'Duty officer',
    exception: 'Invoicing and VAT · view',
    grantedBy: 'Obi (MD)',
    until: '31 Jan 2027',
  },
  {
    id: 'exc-2',
    personName: 'Curator No. 03',
    personRole: 'Curator (founding)',
    exception: 'Operations Manual · section 7 only',
    grantedBy: 'Obi (MD)',
    until: 'No end',
  },
];

async function ensureSeeded() {
  const count = await PolicyDocument.countDocuments();
  if (count === 0) {
    await PolicyDocument.insertMany(initialDocuments);
  }
  const excCount = await PersonException.countDocuments();
  if (excCount === 0) {
    await PersonException.insertMany(initialExceptions);
  }
}

// GET /api/library/documents
router.get('/documents', async (req, res) => {
  await ensureSeeded();
  const { type, status, search } = req.query;
  const query = {};

  if (type && type !== 'All') {
    query.type = type;
  }
  if (status && status === 'needs_review') {
    query.status = { $in: ['Lawyer review', 'Awaiting policy', 'Adviser review', 'Draft'] };
  }
  if (search) {
    query.$or = [
      { code: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
    ];
  }

  const documents = await PolicyDocument.find(query).sort({ code: 1 });
  const totalCount = await PolicyDocument.countDocuments();
  const needsReviewCount = await PolicyDocument.countDocuments({
    status: { $in: ['Lawyer review', 'Awaiting policy', 'Adviser review', 'Draft'] },
  });

  res.json({
    success: true,
    data: documents,
    meta: {
      totalCount,
      needsReviewCount,
      staffAcknowledged: '3 of 4 staff acknowledged v1.0',
      curatorsAcknowledged: '18 of 21 Curators',
      nextReviewDoc: 'Emergency checklist · Nov 2027',
    },
  });
});

// GET /api/library/access
router.get('/access', async (req, res) => {
  await ensureSeeded();
  const documents = await PolicyDocument.find().select('code title accessMatrix').sort({ code: 1 });
  const exceptions = await PersonException.find().sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      matrix: documents.map(d => ({
        code: d.code,
        title: d.title,
        ...d.accessMatrix.toObject(),
      })),
      exceptions,
    },
  });
});

// PUT /api/library/access
router.put('/access', async (req, res) => {
  const { matrix } = req.body;
  if (Array.isArray(matrix)) {
    for (const item of matrix) {
      await PolicyDocument.updateOne(
        { $or: [{ code: item.code }, { title: item.title }] },
        {
          $set: {
            'accessMatrix.md': item.md || 'Edit',
            'accessMatrix.dutyOfficer': item.dutyOfficer || '—',
            'accessMatrix.finance': item.finance || '—',
            'accessMatrix.salesDesk': item.salesDesk || '—',
            'accessMatrix.curatorFounding': item.curatorFounding || '—',
            'accessMatrix.curatorStandard': item.curatorStandard || '—',
            'accessMatrix.operatorExternal': item.operatorExternal || '—',
          },
        }
      );
    }
  }
  res.json({ success: true, message: 'Access rules updated successfully' });
});

// POST /api/library/exceptions
router.post('/exceptions', async (req, res) => {
  const { personName, personRole, exception, grantedBy = 'Obi (MD)', until = 'No end' } = req.body;
  if (!personName || !exception) {
    return res.status(400).json({ success: false, message: 'Person name and exception are required' });
  }

  const newExc = await PersonException.create({
    id: `exc-${Date.now()}`,
    personName,
    personRole: personRole || 'Staff Member',
    exception,
    grantedBy,
    until,
  });

  res.json({ success: true, data: newExc, message: 'Person exception created' });
});

// DELETE /api/library/exceptions/:id
router.delete('/exceptions/:id', async (req, res) => {
  const { id } = req.params;
  await PersonException.deleteOne({ $or: [{ id }, { _id: id }] });
  res.json({ success: true, message: 'Person exception removed' });
});

// POST /api/library/documents
router.post('/documents', async (req, res) => {
  const { code, title, type, version = 'v1.0', ownerApprover = 'Obi (MD)', whoCanOpen = 'All staff' } = req.body;
  if (!code || !title) {
    return res.status(400).json({ success: false, message: 'Code and title are required' });
  }

  const existing = await PolicyDocument.findOne({ code });
  if (existing) {
    existing.version = version;
    existing.updatedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    existing.status = 'Approved';
    await existing.save();
    return res.json({ success: true, data: existing, message: 'Document version updated' });
  }

  const doc = await PolicyDocument.create({
    code,
    title,
    type: type || 'Policy',
    version,
    updatedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    ownerApprover,
    whoCanOpen,
    status: 'Approved',
  });

  res.json({ success: true, data: doc, message: 'Document created successfully' });
});

module.exports = router;

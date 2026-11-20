const mongoose = require('mongoose');

const accessMatrixSchema = new mongoose.Schema({
  md: { type: String, default: 'Edit' },
  dutyOfficer: { type: String, default: 'View + download' },
  finance: { type: String, default: 'View + download' },
  salesDesk: { type: String, default: 'View + download' },
  curatorFounding: { type: String, default: '—' },
  curatorStandard: { type: String, default: '—' },
  operatorExternal: { type: String, default: '—' },
}, { _id: false });

const personExceptionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  personName: { type: String, required: true },
  personRole: { type: String, required: true },
  exception: { type: String, required: true },
  grantedBy: { type: String, default: 'Obi (MD)' },
  until: { type: String, default: 'No end' },
  createdAt: { type: Date, default: Date.now },
});

const policyDocumentSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // e.g. OPS-MAN, POL-C1
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['Manual', 'Contract template', 'Policy', 'Procedure', 'Guide', 'Checklist'],
    default: 'Policy',
  },
  version: { type: String, default: 'v1.0' },
  updatedDate: { type: String, default: '19 Nov 2026' },
  ownerApprover: { type: String, default: 'Obi (MD)' },
  whoCanOpen: { type: String, default: 'All staff' },
  status: {
    type: String,
    enum: ['Approved', 'Lawyer review', 'Awaiting policy', 'Adviser review', 'Draft'],
    default: 'Approved',
  },
  downloadFormats: {
    pdf: { type: Boolean, default: true },
    docx: { type: Boolean, default: true },
  },
  description: { type: String, default: '' },
  reviewIntervalMonths: { type: Number, default: 12 },
  nextReviewDate: { type: String, default: 'Nov 2027' },
  accessMatrix: { type: accessMatrixSchema, default: () => ({}) },
  contentSummary: { type: String, default: '' },
  acknowledgements: [{
    userName: String,
    userRole: String,
    acknowledgedAt: { type: Date, default: Date.now },
    version: String,
  }],
}, {
  timestamps: true,
});

const PolicyDocument = mongoose.model('PolicyDocument', policyDocumentSchema);
const PersonException = mongoose.model('PersonException', personExceptionSchema);

module.exports = {
  PolicyDocument,
  PersonException,
};

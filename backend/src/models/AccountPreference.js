const mongoose = require('mongoose');

/**
 * Per-account defaults remembered between quotes (quote builder step 01):
 * who the Authorised Owner is, whether an assistant handles the trip, where documents go and who signs.
 */
const accountPreferenceSchema = new mongoose.Schema(
  {
    accountNumber: { type: String, required: true, unique: true, index: true, trim: true },
    accountId: { type: String, default: '' },
    quoteDefaults: {
      authorisedOwnerId: { type: String, default: '' },
      isHandledByPa: { type: Boolean, default: false },
      assistantContactId: { type: String, default: '' },
      sendDocsTo: { type: String, enum: ['owner', 'assistant', 'both'], default: 'owner' },
      signsAgreement: { type: String, enum: ['owner', 'assistant'], default: 'owner' },
    },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AccountPreference', accountPreferenceSchema);

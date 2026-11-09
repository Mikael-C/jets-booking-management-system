const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'finance', 'operations', 'agent'],
      default: 'agent',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      default: null,
    },
    title: {
      type: String,
      default: '',
    },
    company: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    tokens: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    tokenTier: {
      type: String,
      enum: ['free', 'standard', 'pro', 'enterprise'],
      default: 'free',
    },
    subscriptionStatus: {
      type: String,
      enum: ['none', 'active', 'expired'],
      default: 'none',
      index: true,
    },
    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },
    tokenTransactions: {
      type: [
        {
          id: { type: String, default: () => `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}` },
          type: { type: String, enum: ['credit', 'debit'], required: true },
          amount: { type: Number, required: true },
          balanceAfter: { type: Number, required: true },
          action: { type: String, required: true },
          description: { type: String, default: '' },
          currency: { type: String, default: 'GBP' },
          pricePaid: { type: Number, default: 0 },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    notificationPreferences: {
      emailAlerts: { type: Boolean, default: true },
      flightUpdates: { type: Boolean, default: true },
      tokenAlerts: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
    },
    refreshTokens: {
      type: [String],
      select: false,
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.index({ role: 1, isActive: 1 });

userSchema.methods.comparePassword = async function (candidatePassword) {
  const user = await mongoose.model('User').findById(this._id).select('+passwordHash');
  return bcrypt.compare(candidatePassword, user.passwordHash);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokens;
  return obj;
};

userSchema.statics.hashPassword = async (password) => {
  return bcrypt.hash(password, 12);
};

const User = mongoose.model('User', userSchema);
module.exports = User;

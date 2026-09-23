const mongoose = require('mongoose');

const blockedAppSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  packageName: { type: String, required: true },
  displayName: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

blockedAppSchema.index({ userId: 1, packageName: 1 });

blockedAppSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('BlockedApp', blockedAppSchema);

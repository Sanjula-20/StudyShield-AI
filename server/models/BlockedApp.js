const mongoose = require('mongoose');

const blockedAppSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  packageName: { type: String, required: true },
  displayName: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BlockedApp', blockedAppSchema);

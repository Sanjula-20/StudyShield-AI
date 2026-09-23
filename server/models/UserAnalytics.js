const mongoose = require('mongoose');

const userAnalyticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  totalFocusedTime: { type: Number, default: 0 }, // in minutes
  sessionsCompleted: { type: Number, default: 0 },
  interruptedSessions: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastSessionDate: { type: Date },
  updatedAt: { type: Date, default: Date.now }
});

userAnalyticsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('UserAnalytics', userAnalyticsSchema);

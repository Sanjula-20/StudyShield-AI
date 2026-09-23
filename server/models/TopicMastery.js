const mongoose = require('mongoose');

const topicMasterySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  topic: { type: String, required: true, index: true },
  masteryScore: { type: Number, required: true, default: 0, min: 0, max: 100 },
  previousScore: { type: Number, default: 0 },
  trend: { type: String, enum: ['improving', 'stable', 'declining'], default: 'stable' },
  totalSessions: { type: Number, default: 0 },
  totalFocusedMinutes: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

topicMasterySchema.index({ userId: 1, topic: 1 }, { unique: true });

topicMasterySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('TopicMastery', topicMasterySchema);

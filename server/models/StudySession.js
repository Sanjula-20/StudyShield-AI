const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  topic: { type: String, required: true, trim: true },
  subtopic: { type: String, trim: true, default: '' },
  learningGoal: { type: String, trim: true, default: '' },
  plannedDuration: { type: Number, required: true }, // in minutes
  actualDuration: { type: Number, default: 0 }, // in minutes
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  status: {
    type: String,
    enum: [
      'CREATED',
      'PREPARING',
      'ACTIVE',
      'PAUSED',
      'COMPLETING',
      'COMPLETED',
      'EARLY_COMPLETED',
      'INTERRUPTED',
      'CANCELLED',
      'FAILED',
      'RECOVERING'
    ],
    default: 'ACTIVE',
    index: true
  },
  blockedApps: [{ type: String }],
  blockedWebsites: [{ type: String }],
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' },
  score: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

studySessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('StudySession', studySessionSchema);

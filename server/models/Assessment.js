const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudySession', required: true, index: true },
  topic: { type: String, required: true },
  subtopic: { type: String, default: '' },
  question: { type: String, required: true },
  expectedConcepts: [{ type: String }],
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assessment', assessmentSchema);

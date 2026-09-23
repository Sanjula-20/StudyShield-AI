const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudySession', required: true, index: true },
  topic: { type: String, required: true },
  subtopic: { type: String, default: '' },
  question: { type: String, required: true },
  expectedConcepts: [{ type: String }],
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  assessmentType: { type: String, enum: ['scenario_analysis', 'problem_solving', 'conceptual_application', 'code_reasoning'], default: 'scenario_analysis' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

assessmentSchema.index({ userId: 1, sessionId: 1 });
assessmentSchema.index({ userId: 1, topic: 1 });
assessmentSchema.index({ userId: 1, createdAt: -1 });

assessmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Assessment', assessmentSchema);

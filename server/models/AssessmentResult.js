const mongoose = require('mongoose');

const assessmentResultSchema = new mongoose.Schema({
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  answer: { type: String, required: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  metrics: {
    accuracy: { type: Number, default: 75 },
    understanding: { type: Number, default: 75 },
    application: { type: Number, default: 75 },
    reasoning: { type: Number, default: 75 },
    completeness: { type: Number, default: 75 },
    relevance: { type: Number, default: 75 }
  },
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  missingConcepts: [{ type: String }],
  suggestions: [{ type: String }],
  feedback: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

assessmentResultSchema.index({ userId: 1, createdAt: -1 });

assessmentResultSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AssessmentResult', assessmentResultSchema);

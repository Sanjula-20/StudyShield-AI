const mongoose = require('mongoose');

const assessmentResultSchema = new mongoose.Schema({
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  answer: { type: String, required: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  missingConcepts: [{ type: String }],
  feedback: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AssessmentResult', assessmentResultSchema);

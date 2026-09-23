const mongoose = require('mongoose');

const studyNoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudySession', index: true },
  topic: { type: String, required: true },
  title: { type: String, default: 'Untitled Note' },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

studyNoteSchema.index({ userId: 1, topic: 1 });
studyNoteSchema.index({ userId: 1, sessionId: 1 });
studyNoteSchema.index({ userId: 1, createdAt: -1 });

studyNoteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('StudyNote', studyNoteSchema);

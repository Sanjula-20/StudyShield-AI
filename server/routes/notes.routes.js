const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { isMongo, memoryDb } = require('../db');
const StudyNote = require('../models/StudyNote');

// GET /api/notes - List user study notes
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId, topic } = req.query;

    if (isMongo()) {
      const query = { userId };
      if (sessionId) query.sessionId = sessionId;
      if (topic) query.topic = new RegExp(topic, 'i');
      const notes = await StudyNote.find(query).sort({ updatedAt: -1 });
      return res.json({ notes });
    } else {
      let notes = memoryDb.studyNotes.filter(n => n.userId === userId);
      if (sessionId) notes = notes.filter(n => n.sessionId === sessionId);
      if (topic) notes = notes.filter(n => n.topic.toLowerCase().includes(topic.toLowerCase()));
      notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      return res.json({ notes });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch study notes.' });
  }
});

// POST /api/notes - Create study note
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { topic, title, content, sessionId } = req.body;
    if (!topic || !content) {
      return res.status(400).json({ error: 'Topic and content are required.' });
    }

    const userId = req.user.id;

    if (isMongo()) {
      const note = await StudyNote.create({
        userId,
        sessionId,
        topic,
        title: title || 'Untitled Note',
        content
      });
      return res.status(201).json({ message: 'Note saved successfully', note });
    } else {
      const noteId = 'note_' + Date.now();
      const note = {
        _id: noteId,
        id: noteId,
        userId,
        sessionId,
        topic,
        title: title || 'Untitled Note',
        content,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryDb.studyNotes.push(note);
      return res.status(201).json({ message: 'Note saved successfully', note });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to create study note.' });
  }
});

// PATCH /api/notes/:id - Update note
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user.id;

    if (isMongo()) {
      const note = await StudyNote.findOne({ _id: id, userId });
      if (!note) return res.status(404).json({ error: 'Note not found.' });

      if (title) note.title = title;
      if (content) note.content = content;
      await note.save();

      return res.json({ message: 'Note updated', note });
    } else {
      const note = memoryDb.studyNotes.find(n => (n._id === id || n.id === id) && n.userId === userId);
      if (!note) return res.status(404).json({ error: 'Note not found.' });

      if (title) note.title = title;
      if (content) note.content = content;
      note.updatedAt = new Date();

      return res.json({ message: 'Note updated', note });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update study note.' });
  }
});

// DELETE /api/notes/:id - Delete note
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (isMongo()) {
      const note = await StudyNote.findOneAndDelete({ _id: id, userId });
      if (!note) return res.status(404).json({ error: 'Note not found.' });
      return res.json({ message: 'Note deleted successfully' });
    } else {
      const index = memoryDb.studyNotes.findIndex(n => (n._id === id || n.id === id) && n.userId === userId);
      if (index === -1) return res.status(404).json({ error: 'Note not found.' });
      memoryDb.studyNotes.splice(index, 1);
      return res.json({ message: 'Note deleted successfully' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete study note.' });
  }
});

module.exports = router;

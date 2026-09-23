const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { askAiTutor } = require('../services/aiService');
const { isMongo, memoryDb } = require('../db');
const ChatMessage = require('../models/ChatMessage');

// POST /api/tutor/chat - Send message to AI Tutor
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { topic, subtopic, learningGoal, message, sessionId } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const userId = req.user.id;

    // Fetch conversation history
    let history = [];
    if (isMongo()) {
      history = await ChatMessage.find({ userId, sessionId }).sort({ createdAt: 1 }).limit(10);
    } else {
      history = memoryDb.chatMessages.filter(m => m.userId === userId && m.sessionId === sessionId);
    }

    // Save user message
    if (isMongo()) {
      await ChatMessage.create({ userId, sessionId, role: 'user', content: message });
    } else {
      memoryDb.chatMessages.push({
        _id: 'msg_' + Date.now(),
        userId,
        sessionId,
        role: 'user',
        content: message,
        createdAt: new Date()
      });
    }

    // Call AI Tutor service
    const aiResponse = await askAiTutor({
      topic: topic || 'General Study',
      subtopic,
      learningGoal,
      userMessage: message,
      history
    });

    // Save assistant reply
    if (isMongo()) {
      await ChatMessage.create({ userId, sessionId, role: 'assistant', content: aiResponse.reply });
    } else {
      memoryDb.chatMessages.push({
        _id: 'msg_' + (Date.now() + 1),
        userId,
        sessionId,
        role: 'assistant',
        content: aiResponse.reply,
        createdAt: new Date()
      });
    }

    return res.json({
      reply: aiResponse.reply,
      role: 'assistant',
      timestamp: new Date()
    });
  } catch (err) {
    console.error('[AI Tutor Error]', err);
    res.status(500).json({ error: 'AI Tutor experienced an error. Please try again.' });
  }
});

// GET /api/tutor/history - Get chat history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.query;
    const userId = req.user.id;

    if (isMongo()) {
      const messages = await ChatMessage.find({ userId, ...(sessionId ? { sessionId } : {}) }).sort({ createdAt: 1 });
      return res.json({ messages });
    } else {
      const messages = memoryDb.chatMessages.filter(m => m.userId === userId && (!sessionId || m.sessionId === sessionId));
      return res.json({ messages });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat history.' });
  }
});

module.exports = router;

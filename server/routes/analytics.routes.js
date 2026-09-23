const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { isMongo, memoryDb } = require('../db');
const UserAnalytics = require('../models/UserAnalytics');
const TopicMastery = require('../models/TopicMastery');
const StudySession = require('../models/StudySession');

// GET /api/analytics - Overall dashboard analytics
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    if (isMongo()) {
      let analytics = await UserAnalytics.findOne({ userId });
      if (!analytics) {
        analytics = await UserAnalytics.create({ userId });
      }
      return res.json({ analytics });
    } else {
      let analytics = memoryDb.userAnalytics.find(a => a.userId === userId);
      if (!analytics) {
        analytics = {
          id: 'analytics_' + userId,
          userId,
          totalFocusedTime: 0,
          sessionsCompleted: 0,
          interruptedSessions: 0,
          averageScore: 0,
          streak: 0
        };
        memoryDb.userAnalytics.push(analytics);
      }
      return res.json({ analytics });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
});

// GET /api/analytics/topics - Topic mastery overview
router.get('/topics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    if (isMongo()) {
      const topicMasteries = await TopicMastery.find({ userId }).sort({ masteryScore: -1 });
      return res.json({ topics: topicMasteries });
    } else {
      const topicMasteries = memoryDb.topicMastery
        .filter(t => t.userId === userId)
        .sort((a, b) => b.masteryScore - a.masteryScore);
      return res.json({ topics: topicMasteries });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch topic masteries.' });
  }
});

// GET /api/analytics/history - Detailed history log
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    if (isMongo()) {
      const sessions = await StudySession.find({ userId }).sort({ createdAt: -1 });
      return res.json({ history: sessions });
    } else {
      const sessions = memoryDb.studySessions
        .filter(s => s.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json({ history: sessions });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history analytics.' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { isMongo, memoryDb } = require('../db');
const StudySession = require('../models/StudySession');
const UserAnalytics = require('../models/UserAnalytics');

// POST /api/sessions - Create new study session
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { topic, subtopic, learningGoal, plannedDuration, blockedApps, blockedWebsites } = req.body;
    if (!topic || !plannedDuration) {
      return res.status(400).json({ error: 'Topic and planned duration are required.' });
    }

    const userId = req.user.id;

    if (isMongo()) {
      // Check if active session already exists
      const existingActive = await StudySession.findOne({ userId, status: 'ACTIVE' });
      if (existingActive) {
        return res.status(400).json({ error: 'You already have an active study session.', session: existingActive });
      }

      const session = await StudySession.create({
        userId,
        topic,
        subtopic: subtopic || '',
        learningGoal: learningGoal || '',
        plannedDuration: Number(plannedDuration),
        status: 'ACTIVE',
        blockedApps: blockedApps || ['Instagram', 'YouTube', 'Snapchat', 'Games'],
        blockedWebsites: blockedWebsites || ['instagram.com', 'tiktok.com'],
        startTime: new Date()
      });

      return res.status(201).json({ message: 'Session started successfully', session });
    } else {
      // Memory DB mode
      const existingActive = memoryDb.studySessions.find(s => s.userId === userId && s.status === 'ACTIVE');
      if (existingActive) {
        return res.status(400).json({ error: 'You already have an active study session.', session: existingActive });
      }

      const sessionId = 'session_' + Date.now();
      const session = {
        _id: sessionId,
        id: sessionId,
        userId,
        topic,
        subtopic: subtopic || '',
        learningGoal: learningGoal || '',
        plannedDuration: Number(plannedDuration),
        actualDuration: 0,
        status: 'ACTIVE',
        blockedApps: blockedApps || ['Instagram', 'YouTube', 'Snapchat', 'Games'],
        blockedWebsites: blockedWebsites || ['instagram.com', 'tiktok.com'],
        startTime: new Date(),
        createdAt: new Date()
      };

      memoryDb.studySessions.push(session);
      return res.status(201).json({ message: 'Session started successfully', session });
    }
  } catch (err) {
    console.error('[Create Session Error]', err);
    res.status(500).json({ error: 'Failed to create study session.' });
  }
});

// GET /api/sessions/active - Fetch active session
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    if (isMongo()) {
      const activeSession = await StudySession.findOne({ userId, status: 'ACTIVE' });
      return res.json({ session: activeSession || null });
    } else {
      const activeSession = memoryDb.studySessions.find(s => s.userId === userId && s.status === 'ACTIVE');
      return res.json({ session: activeSession || null });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active session.' });
  }
});

// GET /api/sessions - List session history
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    if (isMongo()) {
      const sessions = await StudySession.find({ userId }).sort({ createdAt: -1 });
      return res.json({ sessions });
    } else {
      const sessions = memoryDb.studySessions
        .filter(s => s.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json({ sessions });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch session history.' });
  }
});

// GET /api/sessions/:id - Get specific session
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (isMongo()) {
      const session = await StudySession.findOne({ _id: id, userId });
      if (!session) return res.status(404).json({ error: 'Session not found.' });
      return res.json({ session });
    } else {
      const session = memoryDb.studySessions.find(s => (s._id === id || s.id === id) && s.userId === userId);
      if (!session) return res.status(404).json({ error: 'Session not found.' });
      return res.json({ session });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch session.' });
  }
});

// POST /api/sessions/:id/complete - Complete session
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { actualDuration, earlyCompletion } = req.body;
    const userId = req.user.id;
    const finalStatus = earlyCompletion ? 'EARLY_COMPLETED' : 'COMPLETED';

    if (isMongo()) {
      const session = await StudySession.findOne({ _id: id, userId });
      if (!session) return res.status(404).json({ error: 'Session not found.' });

      session.status = finalStatus;
      session.actualDuration = actualDuration || session.plannedDuration;
      session.endTime = new Date();
      await session.save();

      // Update user analytics
      let analytics = await UserAnalytics.findOne({ userId });
      if (!analytics) {
        analytics = await UserAnalytics.create({ userId });
      }
      analytics.totalFocusedTime += session.actualDuration;
      analytics.sessionsCompleted += 1;
      analytics.streak += 1;
      analytics.lastSessionDate = new Date();
      await analytics.save();

      return res.json({ message: 'Session completed successfully', session, analytics });
    } else {
      const session = memoryDb.studySessions.find(s => (s._id === id || s.id === id) && s.userId === userId);
      if (!session) return res.status(404).json({ error: 'Session not found.' });

      session.status = finalStatus;
      session.actualDuration = actualDuration || session.plannedDuration;
      session.endTime = new Date();

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

      analytics.totalFocusedTime += session.actualDuration;
      analytics.sessionsCompleted += 1;
      analytics.streak += 1;

      return res.json({ message: 'Session completed successfully', session, analytics });
    }
  } catch (err) {
    console.error('[Complete Session Error]', err);
    res.status(500).json({ error: 'Failed to complete session.' });
  }
});

// PATCH /api/sessions/:id/status - Update session status (PAUSED, ACTIVE, INTERRUPTED, RECOVERING)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actualDuration } = req.body;
    const userId = req.user.id;

    const VALID_STATUSES = ['ACTIVE', 'PAUSED', 'INTERRUPTED', 'RECOVERING', 'PREPARING'];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid session status.' });
    }

    if (isMongo()) {
      const session = await StudySession.findOne({ _id: id, userId });
      if (!session) return res.status(404).json({ error: 'Session not found.' });

      session.status = status;
      if (actualDuration !== undefined) session.actualDuration = actualDuration;
      await session.save();

      return res.json({ message: `Session status updated to ${status}`, session });
    } else {
      const session = memoryDb.studySessions.find(s => (s._id === id || s.id === id) && s.userId === userId);
      if (!session) return res.status(404).json({ error: 'Session not found.' });

      session.status = status;
      if (actualDuration !== undefined) session.actualDuration = actualDuration;

      return res.json({ message: `Session status updated to ${status}`, session });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update session status.' });
  }
});

// POST /api/sessions/:id/cancel - Cancel session
router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { actualDuration } = req.body;
    const userId = req.user.id;

    if (isMongo()) {
      const session = await StudySession.findOne({ _id: id, userId });
      if (!session) return res.status(404).json({ error: 'Session not found.' });

      session.status = 'CANCELLED';
      session.actualDuration = actualDuration || 0;
      session.endTime = new Date();
      await session.save();

      return res.json({ message: 'Session cancelled', session });
    } else {
      const session = memoryDb.studySessions.find(s => (s._id === id || s.id === id) && s.userId === userId);
      if (!session) return res.status(404).json({ error: 'Session not found.' });

      session.status = 'CANCELLED';
      session.actualDuration = actualDuration || 0;
      session.endTime = new Date();

      return res.json({ message: 'Session cancelled', session });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel session.' });
  }
});

module.exports = router;

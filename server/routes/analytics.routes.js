const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { isMongo, memoryDb } = require('../db');
const UserAnalytics = require('../models/UserAnalytics');
const TopicMastery = require('../models/TopicMastery');
const StudySession = require('../models/StudySession');
const AssessmentResult = require('../models/AssessmentResult');

// Helper to compute study streak from sessions
function computeStreak(sessions) {
  const completedSessions = sessions.filter(s => 
    s.status === 'COMPLETED' || s.status === 'EARLY_COMPLETED'
  );
  if (completedSessions.length === 0) return 0;

  const dates = new Set();
  completedSessions.forEach(s => {
    const dateStr = new Date(s.createdAt || s.startTime).toISOString().split('T')[0];
    dates.add(dateStr);
  });

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let currentCheck = dates.has(today) ? today : (dates.has(yesterday) ? yesterday : null);
  if (!currentCheck) return 0;

  let streak = 0;
  let checkDate = new Date(currentCheck);

  while (true) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (dates.has(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// GET /api/analytics - Overall dashboard analytics with breakdowns
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let sessions = [];
    let assessmentResults = [];
    let topicMasteries = [];

    if (isMongo()) {
      sessions = await StudySession.find({ userId });
      assessmentResults = await AssessmentResult.find({ userId });
      topicMasteries = await TopicMastery.find({ userId });
    } else {
      sessions = memoryDb.studySessions.filter(s => s.userId === userId);
      assessmentResults = memoryDb.assessmentResults.filter(r => r.userId === userId);
      topicMasteries = memoryDb.topicMastery.filter(t => t.userId === userId);
    }

    // Time calculations
    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = now - 7 * oneDayMs;
    const thirtyDaysAgo = now - 30 * oneDayMs;

    let totalFocusedTime = 0;
    let dailyFocusedTime = 0;
    let weeklyFocusedTime = 0;
    let monthlyFocusedTime = 0;

    let completedSessions = 0;
    let earlyCompletedSessions = 0;
    let interruptedSessions = 0;

    sessions.forEach(s => {
      const dur = s.actualDuration || 0;
      const sDate = new Date(s.createdAt || s.startTime);
      const sDateStr = sDate.toISOString().split('T')[0];
      const sTime = sDate.getTime();

      if (['COMPLETED', 'EARLY_COMPLETED'].includes(s.status)) {
        totalFocusedTime += dur;
        if (sDateStr === todayStr) dailyFocusedTime += dur;
        if (sTime >= sevenDaysAgo) weeklyFocusedTime += dur;
        if (sTime >= thirtyDaysAgo) monthlyFocusedTime += dur;
      }

      if (s.status === 'COMPLETED') completedSessions++;
      else if (s.status === 'EARLY_COMPLETED') earlyCompletedSessions++;
      else if (['INTERRUPTED', 'CANCELLED', 'FAILED'].includes(s.status)) interruptedSessions++;
    });

    const totalSessions = sessions.length;
    const streak = computeStreak(sessions);

    const avgScore = assessmentResults.length > 0
      ? Math.round(assessmentResults.reduce((acc, curr) => acc + curr.score, 0) / assessmentResults.length)
      : 0;

    const weakTopics = topicMasteries
      .filter(t => t.masteryScore < 60)
      .map(t => ({
        topic: t.topic,
        masteryScore: t.masteryScore,
        trend: t.trend || 'stable',
        totalSessions: t.totalSessions || 0
      }));

    const analytics = {
      totalFocusedTime,
      dailyFocusedTime,
      weeklyFocusedTime,
      monthlyFocusedTime,
      completedSessions,
      earlyCompletedSessions,
      interruptedSessions,
      totalSessions,
      averageScore: avgScore,
      streak,
      weakTopics
    };

    return res.json({ analytics });
  } catch (err) {
    console.error('[Analytics Error]', err);
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
});

// GET /api/analytics/topics - Topic mastery overview
router.get('/topics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    let topicMasteries = [];
    if (isMongo()) {
      topicMasteries = await TopicMastery.find({ userId }).sort({ masteryScore: -1 });
    } else {
      topicMasteries = memoryDb.topicMastery
        .filter(t => t.userId === userId)
        .sort((a, b) => b.masteryScore - a.masteryScore);
    }

    const topics = topicMasteries.map(t => ({
      _id: t._id || t.id,
      id: t._id || t.id,
      topic: t.topic,
      masteryScore: t.masteryScore,
      previousScore: t.previousScore || 0,
      trend: t.trend || 'stable',
      totalSessions: t.totalSessions || 0,
      totalFocusedMinutes: t.totalFocusedMinutes || 0,
      averageScore: t.averageScore || t.masteryScore,
      isWeakTopic: t.masteryScore < 60
    }));

    return res.json({ topics });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch topic masteries.' });
  }
});

// GET /api/analytics/history - Detailed history log with filtering
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, search } = req.query;

    let sessions = [];
    if (isMongo()) {
      let query = { userId };
      if (status && status !== 'ALL') {
        if (status === 'COMPLETED') query.status = { $in: ['COMPLETED', 'EARLY_COMPLETED'] };
        else if (status === 'INTERRUPTED') query.status = { $in: ['INTERRUPTED', 'CANCELLED', 'FAILED'] };
        else query.status = status;
      }
      if (search) {
        query.topic = { $regex: search, $options: 'i' };
      }
      sessions = await StudySession.find(query).sort({ createdAt: -1 });
    } else {
      sessions = memoryDb.studySessions.filter(s => s.userId === userId);
      if (status && status !== 'ALL') {
        if (status === 'COMPLETED') sessions = sessions.filter(s => ['COMPLETED', 'EARLY_COMPLETED'].includes(s.status));
        else if (status === 'INTERRUPTED') sessions = sessions.filter(s => ['INTERRUPTED', 'CANCELLED', 'FAILED'].includes(s.status));
        else sessions = sessions.filter(s => s.status === status);
      }
      if (search) {
        sessions = sessions.filter(s => s.topic.toLowerCase().includes(search.toLowerCase()));
      }
      sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return res.json({ history: sessions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history analytics.' });
  }
});

module.exports = router;

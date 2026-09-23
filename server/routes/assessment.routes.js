const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { isMongo, memoryDb } = require('../db');
const { generateAssessment, evaluateAssessment } = require('../services/aiService');
const Assessment = require('../models/Assessment');
const AssessmentResult = require('../models/AssessmentResult');
const StudySession = require('../models/StudySession');
const TopicMastery = require('../models/TopicMastery');
const UserAnalytics = require('../models/UserAnalytics');

// POST /api/assessments/generate - Generate scenario question for session
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { sessionId, topic, subtopic, learningGoal } = req.body;
    if (!topic || !sessionId) {
      return res.status(400).json({ error: 'Topic and sessionId are required.' });
    }

    const userId = req.user.id;

    const generated = await generateAssessment({ topic, subtopic, learningGoal });

    if (isMongo()) {
      const assessment = await Assessment.create({
        userId,
        sessionId,
        topic,
        subtopic: subtopic || '',
        question: generated.question,
        expectedConcepts: generated.expectedConcepts,
        difficulty: generated.difficulty
      });

      // Link to study session
      await StudySession.findByIdAndUpdate(sessionId, { assessmentId: assessment._id });

      return res.status(201).json({ assessment });
    } else {
      const assessmentId = 'asm_' + Date.now();
      const assessment = {
        _id: assessmentId,
        id: assessmentId,
        userId,
        sessionId,
        topic,
        subtopic: subtopic || '',
        question: generated.question,
        expectedConcepts: generated.expectedConcepts,
        difficulty: generated.difficulty,
        createdAt: new Date()
      };
      memoryDb.assessments.push(assessment);

      const session = memoryDb.studySessions.find(s => s._id === sessionId || s.id === sessionId);
      if (session) session.assessmentId = assessmentId;

      return res.status(201).json({ assessment });
    }
  } catch (err) {
    console.error('[Generate Assessment Error]', err);
    res.status(500).json({ error: 'Failed to generate assessment.' });
  }
});

// POST /api/assessments/:id/submit - Submit answer & evaluate
router.post('/:id/submit', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;
    if (!answer || answer.trim().length === 0) {
      return res.status(400).json({ error: 'An answer response is required.' });
    }

    const userId = req.user.id;

    let assessmentObj = null;

    if (isMongo()) {
      assessmentObj = await Assessment.findOne({ _id: id, userId });
    } else {
      assessmentObj = memoryDb.assessments.find(a => (a._id === id || a.id === id) && a.userId === userId);
    }

    if (!assessmentObj) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    // AI Evaluation
    const evalResult = await evaluateAssessment({
      question: assessmentObj.question,
      expectedConcepts: assessmentObj.expectedConcepts || [],
      studentAnswer: answer,
      topic: assessmentObj.topic
    });

    if (isMongo()) {
      const resultDoc = await AssessmentResult.create({
        assessmentId: assessmentObj._id,
        userId,
        answer,
        score: evalResult.score,
        strengths: evalResult.strengths,
        weaknesses: evalResult.weaknesses,
        missingConcepts: evalResult.missingConcepts,
        feedback: evalResult.feedback
      });

      // Update study session score
      await StudySession.findByIdAndUpdate(assessmentObj.sessionId, { score: evalResult.score });

      // Update Topic Mastery
      let mastery = await TopicMastery.findOne({ userId, topic: assessmentObj.topic });
      if (!mastery) {
        mastery = await TopicMastery.create({
          userId,
          topic: assessmentObj.topic,
          masteryScore: evalResult.score,
          previousScore: 0,
          trend: 'improving',
          totalSessions: 1
        });
      } else {
        mastery.previousScore = mastery.masteryScore;
        // Weighted formula: 60% new score + 40% historical mastery
        const updatedScore = Math.round(evalResult.score * 0.6 + mastery.masteryScore * 0.4);
        mastery.trend = updatedScore >= mastery.masteryScore ? 'improving' : 'declining';
        mastery.masteryScore = updatedScore;
        mastery.totalSessions += 1;
        await mastery.save();
      }

      // Update average score in UserAnalytics
      const userResults = await AssessmentResult.find({ userId });
      const avgScore = Math.round(userResults.reduce((acc, curr) => acc + curr.score, 0) / userResults.length);
      await UserAnalytics.findOneAndUpdate({ userId }, { averageScore: avgScore });

      return res.json({
        message: 'Assessment evaluated successfully',
        result: resultDoc,
        topicMastery: mastery
      });
    } else {
      // Memory DB processing
      const resultId = 'res_' + Date.now();
      const resultDoc = {
        _id: resultId,
        id: resultId,
        assessmentId: assessmentObj._id || assessmentObj.id,
        userId,
        answer,
        score: evalResult.score,
        strengths: evalResult.strengths,
        weaknesses: evalResult.weaknesses,
        missingConcepts: evalResult.missingConcepts,
        feedback: evalResult.feedback,
        createdAt: new Date()
      };
      memoryDb.assessmentResults.push(resultDoc);

      const session = memoryDb.studySessions.find(s => s._id === assessmentObj.sessionId || s.id === assessmentObj.sessionId);
      if (session) session.score = evalResult.score;

      let mastery = memoryDb.topicMastery.find(m => m.userId === userId && m.topic === assessmentObj.topic);
      if (!mastery) {
        mastery = {
          id: 'tm_' + Date.now(),
          userId,
          topic: assessmentObj.topic,
          masteryScore: evalResult.score,
          previousScore: 0,
          trend: 'improving',
          totalSessions: 1
        };
        memoryDb.topicMastery.push(mastery);
      } else {
        mastery.previousScore = mastery.masteryScore;
        const updatedScore = Math.round(evalResult.score * 0.6 + mastery.masteryScore * 0.4);
        mastery.trend = updatedScore >= mastery.masteryScore ? 'improving' : 'declining';
        mastery.masteryScore = updatedScore;
        mastery.totalSessions += 1;
      }

      // Update analytics average
      const userResList = memoryDb.assessmentResults.filter(r => r.userId === userId);
      const avgScore = Math.round(userResList.reduce((acc, curr) => acc + curr.score, 0) / userResList.length);
      let userAnal = memoryDb.userAnalytics.find(a => a.userId === userId);
      if (userAnal) userAnal.averageScore = avgScore;

      return res.json({
        message: 'Assessment evaluated successfully',
        result: resultDoc,
        topicMastery: mastery
      });
    }
  } catch (err) {
    console.error('[Submit Assessment Error]', err);
    res.status(500).json({ error: 'Failed to evaluate assessment submission.' });
  }
});

// GET /api/assessments/:id/result - Get result
router.get('/:id/result', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (isMongo()) {
      const result = await AssessmentResult.findOne({ assessmentId: id, userId });
      if (!result) return res.status(404).json({ error: 'Assessment result not found.' });
      return res.json({ result });
    } else {
      const result = memoryDb.assessmentResults.find(r => r.assessmentId === id && r.userId === userId);
      if (!result) return res.status(404).json({ error: 'Assessment result not found.' });
      return res.json({ result });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assessment result.' });
  }
});

module.exports = router;

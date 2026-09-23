const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { searchEducationalVideos } = require('../services/youtubeService');

// GET /api/youtube/search - Controlled YouTube search
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q, topic, subtopic } = req.query;
    const searchResults = await searchEducationalVideos(q, topic, subtopic);
    return res.json(searchResults);
  } catch (err) {
    console.error('[YouTube Search Error]', err);
    res.status(500).json({ error: 'Failed to search educational videos.' });
  }
});

module.exports = router;


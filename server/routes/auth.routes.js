const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');
const { isMongo, memoryDb } = require('../db');
const User = require('../models/User');
const UserAnalytics = require('../models/UserAnalytics');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const lowerEmail = email.toLowerCase().trim();

    if (isMongo()) {
      const existing = await User.findOne({ email: lowerEmail });
      if (existing) {
        return res.status(400).json({ error: 'User with this email already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await User.create({ name, email: lowerEmail, passwordHash });
      
      // Initialize analytics
      await UserAnalytics.create({ userId: newUser._id });

      const token = jwt.sign({ id: newUser._id, email: newUser.email, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({
        message: 'Registration successful',
        user: { id: newUser._id, name: newUser.name, email: newUser.email },
        token
      });
    } else {
      // Memory DB fallback
      const existing = memoryDb.users.find(u => u.email === lowerEmail);
      if (existing) {
        return res.status(400).json({ error: 'User with this email already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userId = 'user_' + Date.now();
      const newUser = { id: userId, _id: userId, name, email: lowerEmail, passwordHash, createdAt: new Date() };
      memoryDb.users.push(newUser);

      // Memory DB analytics
      memoryDb.userAnalytics.push({
        id: 'analytics_' + userId,
        userId: userId,
        totalFocusedTime: 0,
        sessionsCompleted: 0,
        interruptedSessions: 0,
        averageScore: 0,
        streak: 0
      });

      const token = jwt.sign({ id: userId, email: lowerEmail, name }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({
        message: 'Registration successful',
        user: { id: userId, name, email: lowerEmail },
        token
      });
    }
  } catch (err) {
    console.error('[Auth Error]', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const lowerEmail = email.toLowerCase().trim();

    if (isMongo()) {
      const user = await User.findOne({ email: lowerEmail });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        message: 'Login successful',
        user: { id: user._id, name: user.name, email: user.email },
        token
      });
    } else {
      // Memory DB fallback
      const user = memoryDb.users.find(u => u.email === lowerEmail);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        message: 'Login successful',
        user: { id: user.id, name: user.name, email: user.email },
        token
      });
    }
  } catch (err) {
    console.error('[Login Error]', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    return res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

module.exports = router;

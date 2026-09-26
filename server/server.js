const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { connectDB } = require('./db');

dotenv.config();

const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT || '5000', 10);

// Security & Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

// Healthcheck Route
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'StudyShield API',
    timestamp: new Date()
  });
});

// Register Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/sessions', require('./routes/session.routes'));
app.use('/api/tutor', require('./routes/tutor.routes'));
app.use('/api/youtube', require('./routes/youtube.routes'));
app.use('/api/notes', require('./routes/notes.routes'));
app.use('/api/assessments', require('./routes/assessment.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  if (err.code === 'ECONNABORTED' || err.type === 'request.aborted') {
    return; // Ignore client request aborts
  }
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({ error: 'An unexpected internal server error occurred.' });
});

// Connect DB & Start Server with automatic port fallback
connectDB().then(() => {
  const startServerOnPort = (portToTry) => {
    const server = app.listen(portToTry, '0.0.0.0', () => {
      console.log(`[StudyShield Server] Running on http://127.0.0.1:${portToTry}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[StudyShield Server] Port ${portToTry} in use, trying port ${portToTry + 1}...`);
        startServerOnPort(portToTry + 1);
      } else {
        console.error('[StudyShield Server Listen Error]', err);
      }
    });
  };

  startServerOnPort(DEFAULT_PORT);
});

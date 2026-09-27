require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { seedInitialData } = require('./seed/initialSeed');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Database connection & seed middleware (supports serverless warm/cold starts)
let isSeeded = false;
app.use(async (req, res, next) => {
  try {
    await connectDB();
    if (!isSeeded) {
      await seedInitialData();
      isSeeded = true;
    }
    next();
  } catch (err) {
    console.error('[Database Error]:', err.message);
    return res.status(500).json({
      message: 'Database connection failed. Please ensure MONGODB_URI is correctly configured in your environment variables.',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  }
});

// API Routes
const apiRouter = express.Router();
apiRouter.use('/auth', require('./routes/authRoutes'));
apiRouter.use('/topics', require('./routes/topicRoutes'));
apiRouter.use('/tasks', require('./routes/taskRoutes'));
apiRouter.use('/schedule', require('./routes/scheduleRoutes'));
apiRouter.use('/settings', require('./routes/settingsRoutes'));

// Health check
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'SSC CHSL Maths Study Planner API',
    timestamp: new Date().toISOString()
  });
});

// Mount routes at both /api and / to handle direct and rewritten serverless requests seamlessly
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Serve frontend in local standalone mode (not needed on Vercel which serves static assets directly)
if (!process.env.VERCEL) {
  const path = require('path');
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) next();
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[API Error]:', err.stack);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Start server when run directly (local development)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[SSC CHSL Planner Server]: Running on http://localhost:${PORT}`);
  });
}

module.exports = app;

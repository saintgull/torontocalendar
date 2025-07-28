const express = require('express');
const db = require('../utils/db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// GET /api/health - Health check endpoint (admin only)
router.get('/', requireAuth, async (req, res) => {
  // Only allow specific admin email addresses
  const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : ['admin@torontoevents.live'];
  
  if (!adminEmails.includes(req.user.email)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks: {}
  };

  // Check database connection
  try {
    const result = await db.query('SELECT 1');
    health.checks.database = {
      status: 'connected',
      message: 'PostgreSQL is responding'
    };
  } catch (error) {
    health.status = 'degraded';
    health.checks.database = {
      status: 'error',
      message: error.message
    };
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  health.checks.memory = {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`
  };

  // Return appropriate status code
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
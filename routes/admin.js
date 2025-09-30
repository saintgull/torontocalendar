const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

// POST /api/admin/users - Create new user account
router.post('/users',
  requireAdmin,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('display_name').trim().isLength({ min: 1, max: 100 }).withMessage('Display name is required and must be under 100 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, display_name } = req.body;
      
      // Check if user already exists
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );
      
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }
      
      // Generate invite token and expiry (7 days)
      const inviteToken = uuidv4();
      const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      // Create user
      const result = await db.query(
        `INSERT INTO users (email, display_name, invite_token, invite_expires_at)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, display_name, invite_token, invite_expires_at, created_at`,
        [email.toLowerCase(), display_name, inviteToken, inviteExpiresAt]
      );
      
      const user = result.rows[0];
      const inviteUrl = `${process.env.APP_URL}/set-password?token=${inviteToken}`;
      
      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          created_at: user.created_at
        },
        invite_url: inviteUrl,
        invite_expires_at: user.invite_expires_at
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

// GET /api/admin/users - List all users
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, display_name, password_hash IS NOT NULL as has_password, created_at FROM users ORDER BY created_at DESC'
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/submissions - View event submissions
router.get('/submissions', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM event_submissions 
       ORDER BY created_at DESC 
       LIMIT 50`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// PATCH /api/admin/submissions/:id/processed - Mark submission as processed
router.patch('/submissions/:id/processed', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query(
      'UPDATE event_submissions SET processed = true WHERE id = $1',
      [id]
    );
    
    res.json({ message: 'Submission marked as processed' });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

// POST /api/admin/submissions/:id/approve - Auto-approve: create event and delete submission
router.post('/submissions/:id/approve', requireAdmin, 
  [
    body('event_date').isISO8601().withMessage('Valid event date is required'),
    body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required (HH:MM)'),
    body('end_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time required (HH:MM)'),
    body('location').trim().isLength({ min: 1, max: 255 }).withMessage('Location is required and must be under 255 characters'),
    body('link').optional().isURL().withMessage('Invalid URL format')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { event_date, start_time, end_time, location, link } = req.body;
      
      // Get the submission details
      const submissionResult = await db.query(
        'SELECT * FROM event_submissions WHERE id = $1',
        [id]
      );
      
      if (submissionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      
      const submission = submissionResult.rows[0];
      const { getNextColor } = require('../utils/colors');
      
      // Create the event
      const eventColor = getNextColor();
      const eventResult = await db.query(
        `INSERT INTO events (title, event_date, start_time, end_time, location, description, link, created_by, creator_name, color)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          submission.event_name,
          event_date,
          start_time,
          end_time || null,
          location,
          submission.event_description,
          link || submission.event_link || null,
          req.user.id,
          req.user.display_name,
          eventColor
        ]
      );
      
      // Delete the submission
      await db.query('DELETE FROM event_submissions WHERE id = $1', [id]);
      
      res.json({ 
        message: 'Event created successfully and submission removed',
        event_id: eventResult.rows[0].id
      });
      
    } catch (error) {
      console.error('Error approving submission:', error);
      res.status(500).json({ error: 'Failed to approve submission' });
    }
  }
);

module.exports = router;
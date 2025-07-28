const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../utils/db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// GET /api/profiles/me - Get current user's profile (requires auth)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userResult = await db.query(
      `SELECT id, email, display_name, bio, link, created_at,
       (SELECT COUNT(*) FROM events WHERE created_by = $1) as events_count
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        bio: user.bio,
        link: user.link,
        member_since: user.created_at,
        events_count: user.events_count
      }
    });
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/profiles/me - Update current user's profile (requires auth)
router.put('/me',
  requireAuth,
  [
    body('display_name').trim().isLength({ min: 1, max: 100 }).withMessage('Display name is required and must be under 100 characters'),
    body('bio').optional().isLength({ max: 500 }).withMessage('Bio must be under 500 characters'),
    body('link').optional().isURL().withMessage('Invalid URL format')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { display_name, bio, link } = req.body;
      
      console.log('Updating profile for user:', req.user.id, { display_name, bio, link });
      
      const result = await db.query(
        `UPDATE users 
         SET display_name = $1, bio = $2, link = $3
         WHERE id = $4
         RETURNING id, email, display_name, bio, link, created_at`,
        [display_name, bio || null, link || null, req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      console.log('Profile updated successfully:', result.rows[0]);
      res.json({ user: result.rows[0] });
      
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// GET /api/profiles/me/events - Get current user's events (requires auth)
router.get('/me/events', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, title, event_date, start_time, end_time, end_date, location, description, created_at
       FROM events WHERE created_by = $1 
       ORDER BY event_date ASC, start_time ASC`,
      [req.user.id]
    );
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/profiles/:id - Get user profile (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get user profile with event count
    const userResult = await db.query(
      `SELECT id, display_name, bio, link, created_at,
       (SELECT COUNT(*) FROM events WHERE created_by = $1) as events_count
       FROM users WHERE id = $1`,
      [id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Get user's recent events (last 5)
    const eventsResult = await db.query(
      `SELECT id, title, event_date, start_time, location
       FROM events WHERE created_by = $1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [id]
    );
    
    res.json({
      user: {
        id: user.id,
        display_name: user.display_name,
        bio: user.bio,
        link: user.link,
        member_since: user.created_at,
        events_count: user.events_count
      },
      recent_events: eventsResult.rows
    });
    
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
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
      'SELECT id, email, display_name, password_set, created_at FROM users ORDER BY created_at DESC'
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
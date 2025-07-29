const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const db = require('../utils/db');
const router = express.Router();

// GET /api/invite/verify/:token - Verify invite token
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const result = await db.query(
      'SELECT email, display_name FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired invite token' });
    }
    
    res.json({
      email: result.rows[0].email,
      display_name: result.rows[0].display_name
    });
  } catch (error) {
    console.error('Error verifying invite token:', error);
    res.status(500).json({ error: 'Failed to verify invite token' });
  }
});

// POST /api/invite/set-password - Set password with invite token
router.post('/set-password',
  [
    body('token').isLength({ min: 1 }).withMessage('Invite token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, password } = req.body;
      
      // Find user with valid invite token
      const userResult = await db.query(
        'SELECT id, email, display_name FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
        [token]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Invalid or expired invite token' });
      }
      
      const user = userResult.rows[0];
      
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Update user with password and clear invite token
      await db.query(
        'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
        [passwordHash, user.id]
      );
      
      res.json({
        message: 'Password set successfully',
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name
        }
      });
    } catch (error) {
      console.error('Error setting password:', error);
      res.status(500).json({ error: 'Failed to set password' });
    }
  }
);

module.exports = router;
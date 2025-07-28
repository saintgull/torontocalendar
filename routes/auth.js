const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// POST /api/auth/login
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 1 }).withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      
      // Find user
      const userResult = await db.query(
        'SELECT * FROM users WHERE email = $1 AND password_set = true',
        [email.toLowerCase()]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const user = userResult.rows[0];
      
      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Create session token
      const sessionToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Store session in database
      await db.query(
        'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, sessionToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] // 7 days
      );
      
      // Set cookie
      res.cookie('token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      });
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const token = req.cookies.token;
    
    // Remove session from database
    await db.query('DELETE FROM sessions WHERE token = $1', [token]);
    
    // Clear cookie
    res.clearCookie('token');
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      display_name: req.user.display_name
    }
  });
});

module.exports = router;
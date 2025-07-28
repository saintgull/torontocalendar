const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const db = require('../utils/db');
const { requireAuth } = require('../middleware/auth');
const { generateICS } = require('../utils/icsGenerator');
const { parseICSFile } = require('../utils/icsParser');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const router = express.Router();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/calendar' || file.originalname.endsWith('.ics')) {
      cb(null, true);
    } else {
      cb(new Error('Only .ics files are allowed'));
    }
  }
});

// Validation middleware that throws AppError
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    throw new AppError(errorMessages, 400, 'VALIDATION_ERROR');
  }
  next();
};

// GET /api/events - Get all events (public)
router.get('/', asyncHandler(async (req, res) => {
  const result = await db.query(
    'SELECT * FROM events ORDER BY event_date ASC, start_time ASC'
  );
  res.json(result.rows);
}));

// GET /api/events/:id - Get single event (public)
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await db.query(
    'SELECT * FROM events WHERE id = $1',
    [id]
  );
  
  if (result.rows.length === 0) {
    throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
  }
  
  res.json(result.rows[0]);
}));

// GET /api/events/:id/ics - Download ICS file (public)
router.get('/:id/ics', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await db.query(
    'SELECT * FROM events WHERE id = $1',
    [id]
  );
  
  if (result.rows.length === 0) {
    throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
  }
  
  const event = result.rows[0];
  const icsContent = generateICS(event);
  
  res.set({
    'Content-Type': 'text/calendar',
    'Content-Disposition': `attachment; filename="${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics"`
  });
  
  res.send(icsContent);
}));

// POST /api/events - Create new event (requires auth)
router.post('/', 
  requireAuth,
  [
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required and must be under 255 characters'),
    body('event_date').isISO8601().withMessage('Valid start date is required'),
    body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required (HH:MM)'),
    body('end_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time required (HH:MM)'),
    body('end_date').optional().isISO8601().withMessage('Valid end date required'),
    body('location').trim().isLength({ min: 1, max: 255 }).withMessage('Location is required and must be under 255 characters'),
    body('description').optional().isLength({ max: 2000 }).withMessage('Description must be under 2000 characters')
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const { title, event_date, start_time, end_time, end_date, location, description } = req.body;
    
    console.log('Creating event with data:', { title, event_date, start_time, end_time, end_date, location, description });
    
    // Validate date/time logic
    const startDateTime = new Date(`${event_date}T${start_time}`);
    const now = new Date();
    
    // Check if event starts in the past
    if (startDateTime < now) {
      throw new AppError('Cannot add events in the past', 400, 'PAST_EVENT');
    }
    
    // If end_date and end_time are provided, validate end is after start
    if (end_date && end_time) {
      const endDateTime = new Date(`${end_date}T${end_time}`);
      if (endDateTime <= startDateTime) {
        throw new AppError(
          'Event end date/time must be after start date/time. Please adjust the end date to be after the start date.', 
          400, 
          'INVALID_END_TIME'
        );
      }
    } else if (end_time && !end_date) {
      // Same day event - check end time is after start time
      const startTimeMinutes = parseInt(start_time.split(':')[0]) * 60 + parseInt(start_time.split(':')[1]);
      const endTimeMinutes = parseInt(end_time.split(':')[0]) * 60 + parseInt(end_time.split(':')[1]);
      if (endTimeMinutes <= startTimeMinutes) {
        throw new AppError(
          'Event end time must be after start time on the same day. Please set an end time after the start time, or add an end date for multi-day events.',
          400,
          'INVALID_END_TIME'
        );
      }
    }
    
    // Check for duplicate events (same title, date, time, and location)
    const duplicateCheck = await db.query(
      `SELECT id FROM events 
       WHERE LOWER(title) = LOWER($1) 
       AND event_date = $2 
       AND start_time = $3 
       AND LOWER(location) = LOWER($4)`,
      [title, event_date, start_time, location]
    );
    
    if (duplicateCheck.rows.length > 0) {
      throw new AppError(
        'An event with the same title, date, time, and location already exists',
        409,
        'DUPLICATE_EVENT'
      );
    }
    
    // Insert the event
    const result = await db.query(
      `INSERT INTO events (title, event_date, start_time, end_time, end_date, location, description, created_by, creator_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [title, event_date, start_time, end_time || null, end_date || null, location, description || null, req.user.id, req.user.display_name]
    );
    
    console.log('Event created successfully:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  })
);

// Additional routes would follow the same pattern...

module.exports = router;
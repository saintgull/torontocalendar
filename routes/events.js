const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const db = require('../utils/db');
const { requireAuth } = require('../middleware/auth');
const { generateICS } = require('../utils/icsGenerator');
const { parseICSFile } = require('../utils/icsParser');
const { generateRecurringDates, formatRecurrenceRule } = require('../utils/recurringEvents');
const { getNextColor, getColorForEvent } = require('../utils/colors');
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

// GET /api/events - Get all events (public)
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM events ORDER BY event_date ASC, start_time ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/:id - Get single event (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM events WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// GET /api/events/:id/ics - Download ICS file (public)
router.get('/:id/ics', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT e.*, u.display_name as creator_name 
       FROM events e 
       LEFT JOIN users u ON e.created_by = u.id 
       WHERE e.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const event = result.rows[0];
    const icsContent = generateICS(event);
    
    // Create a safe filename from the event title
    const safeFilename = event.title
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .toLowerCase()
      .substring(0, 50); // Limit length
    
    res.set({
      'Content-Type': 'text/calendar',
      'Content-Disposition': `attachment; filename="${safeFilename}.ics"`
    });
    
    res.send(icsContent);
  } catch (error) {
    console.error('Error generating ICS:', error);
    res.status(500).json({ error: 'Failed to generate calendar file' });
  }
});

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
    body('description').optional().isLength({ max: 2000 }).withMessage('Description must be under 2000 characters'),
    body('link').optional().isURL().withMessage('Invalid URL format'),
    body('is_all_day').optional().isBoolean().withMessage('Invalid all day value'),
    body('is_recurring').optional().isBoolean().withMessage('Invalid recurring value'),
    body('recurrence_type').optional().isIn(['daily', 'weekly', 'biweekly', 'monthly']).withMessage('Invalid recurrence type'),
    body('recurrence_end_date').optional().isISO8601().withMessage('Valid recurrence end date required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, event_date, start_time, end_time, end_date, location, description, link,
              is_all_day, is_recurring, recurrence_type, recurrence_end_date } = req.body;
      
      console.log('Creating event:', title, 'on', event_date, 'at', start_time);
      if (is_recurring) {
        console.log('Event is recurring:', recurrence_type, 'until', recurrence_end_date);
      }
      
      // Validate date/time logic
      try {
        const startDateTime = new Date(`${event_date}T${start_time}`);
        console.log('Parsed start date:', startDateTime);
        const now = new Date();
        console.log('Current time (server):', now);
        console.log('Start time comparison:', startDateTime.toISOString(), 'vs', now.toISOString());
        
        // Removed past event check - timezone issues make this unreliable
        // Users should be able to add events for "today" without timezone problems
        
        // If end_date and end_time are provided, validate end is after start
        if (end_date && end_time) {
          const endDateTime = new Date(`${end_date}T${end_time}`);
          if (endDateTime <= startDateTime) {
            return res.status(400).json({ 
              error: 'Event end date/time must be after start date/time',
              suggestion: 'Please adjust the end date to be after the start date'
            });
          }
        } else if (end_time && !end_date) {
          // Same day event - check end time is after start time
          const startTimeMinutes = parseInt(start_time.split(':')[0]) * 60 + parseInt(start_time.split(':')[1]);
          const endTimeMinutes = parseInt(end_time.split(':')[0]) * 60 + parseInt(end_time.split(':')[1]);
          if (endTimeMinutes <= startTimeMinutes) {
            return res.status(400).json({ 
              error: 'Event end time must be after start time on the same day',
              suggestion: 'Please set an end time after the start time, or add an end date for multi-day events'
            });
          }
        }
      } catch (dateError) {
        console.error('Date parsing error:', dateError);
        return res.status(400).json({ error: 'Invalid date or time format' });
      }
      
      // Check for duplicate events (same title, date, time, and location)
      try {
        console.log('Checking for duplicates...');
        const duplicateCheck = await db.query(
          `SELECT id FROM events 
           WHERE LOWER(title) = LOWER($1) 
           AND event_date = $2 
           AND start_time = $3 
           AND LOWER(location) = LOWER($4)`,
          [title, event_date, start_time, location]
        );
        
        console.log('Duplicate check result:', duplicateCheck.rows.length);
        
        if (duplicateCheck.rows.length > 0) {
          return res.status(409).json({ error: 'An event with the same title, date, time, and location already exists' });
        }
      } catch (duplicateError) {
        console.error('Duplicate check error:', duplicateError);
        return res.status(500).json({ error: 'Database error during duplicate check' });
      }
      
      // Normalize the is_recurring value BEFORE the try block
      const isRecurringEvent = is_recurring === true || is_recurring === 'true';
      
      // Get next color for new event families
      const eventColor = getNextColor();
      
      // Insert the event
      try {
        
        // Build query based on whether this is recurring
        let query, params;
        
        if (isRecurringEvent && recurrence_type && recurrence_end_date) {
          // Validate recurrence end date is after start date
          if (new Date(recurrence_end_date) <= new Date(event_date)) {
            return res.status(400).json({ error: 'Recurrence end date must be after the event date' });
          }
          
          // Format recurrence rule
          let recurrenceRule;
          if (recurrence_type === 'biweekly') {
            recurrenceRule = 'FREQ=WEEKLY;INTERVAL=2';
          } else {
            recurrenceRule = `FREQ=${recurrence_type.toUpperCase()}`;
          }
          
          query = `INSERT INTO events (title, event_date, start_time, end_time, end_date, location, description, link, created_by, creator_name, is_all_day, is_recurring, recurrence_rule, recurrence_end_date, color)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                   RETURNING *`;
          params = [title, event_date, start_time, end_time || null, end_date || null, location, description || null, link || null, req.user.id, req.user.display_name, is_all_day || false, true, recurrenceRule, recurrence_end_date, eventColor];
        } else {
          query = `INSERT INTO events (title, event_date, start_time, end_time, end_date, location, description, link, created_by, creator_name, is_all_day, color)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                   RETURNING *`;
          params = [title, event_date, start_time, end_time || null, end_date || null, location, description || null, link || null, req.user.id, req.user.display_name, is_all_day || false, eventColor];
        }
        
        const result = await db.query(query, params);
        const parentEvent = result.rows[0];
        
        console.log('Event created successfully');
        
        if (isRecurringEvent && recurrence_type && recurrence_end_date) {
          const recurrenceRule = `FREQ=${recurrence_type.toUpperCase()}`;
          const recurringDates = generateRecurringDates(
            new Date(event_date), 
            new Date(recurrence_end_date), 
            recurrence_type
          );
          
          console.log(`Creating ${recurringDates.length - 1} recurring instances...`);
          
          // Skip the first date (already created as parent) and create the rest
          for (let i = 1; i < recurringDates.length; i++) {
            const recurringDate = recurringDates[i];
            const recurringDateStr = recurringDate.toISOString().split('T')[0];
            
            try {
              const recurringResult = await db.query(
                `INSERT INTO events (title, event_date, start_time, end_time, end_date, location, description, link, created_by, creator_name, is_all_day, is_recurring, recurrence_rule, recurrence_end_date, parent_event_id, color)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                 RETURNING id, event_date`,
                [
                  title, 
                  recurringDateStr, 
                  start_time, 
                  end_time || null, 
                  end_date ? new Date(new Date(end_date).getTime() + (recurringDate.getTime() - new Date(event_date).getTime())).toISOString().split('T')[0] : null,
                  location, 
                  description || null, 
                  link || null,
                  req.user.id, 
                  req.user.display_name, 
                  is_all_day || false,
                  true, 
                  recurrenceRule, 
                  recurrence_end_date,
                  parentEvent.id,
                  eventColor
                ]
              );
            } catch (recurringError) {
              console.error(`Error creating recurring instance for ${recurringDateStr}:`, recurringError);
              // Continue creating other instances even if one fails
            }
          }
          
          console.log(`Created recurring event series with ${recurringDates.length} total instances`);
        }
        
        res.status(201).json(parentEvent);
      } catch (insertError) {
        console.error('Event insertion error:', insertError);
        return res.status(500).json({ error: 'Database error during event creation' });
      }
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: 'Failed to add event' });
    }
  }
);

// POST /api/events/upload-ics - Upload ICS file (requires auth)
router.post('/upload-ics',
  requireAuth,
  upload.single('icsFile'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No ICS file uploaded' });
      }

      const icsContent = req.file.buffer.toString('utf8');
      const parseResult = parseICSFile(icsContent);

      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error });
      }

      if (parseResult.events.length === 0) {
        return res.status(400).json({ error: 'No valid future events found in ICS file' });
      }

      // Insert events into database
      const insertedEvents = [];
      const duplicates = [];
      const errors = [];

      for (const eventData of parseResult.events) {
        try {
          // Check if event is in the past (additional safety check)
          const eventDateTime = new Date(`${eventData.event_date}T${eventData.start_time}`);
          if (eventDateTime < new Date()) {
            continue; // Skip past events
          }

          // Check for duplicate events
          const duplicateCheck = await db.query(
            `SELECT id FROM events 
             WHERE LOWER(title) = LOWER($1) 
             AND event_date = $2 
             AND start_time = $3 
             AND LOWER(location) = LOWER($4)`,
            [eventData.title, eventData.event_date, eventData.start_time, eventData.location]
          );

          if (duplicateCheck.rows.length > 0) {
            duplicates.push(eventData.title);
            continue;
          }

          // Get color for this event
          const eventColor = getNextColor();
          
          // Insert event with recurrence info if present
          const columns = ['title', 'event_date', 'start_time', 'end_time', 'end_date', 'location', 'description', 'created_by', 'creator_name', 'color'];
          const values = [
            eventData.title, 
            eventData.event_date, 
            eventData.start_time, 
            eventData.end_time, 
            eventData.end_date,
            eventData.location, 
            eventData.description, 
            req.user.id, 
            req.user.display_name,
            eventColor
          ];
          
          // Add recurrence fields if present
          if (eventData.is_recurring) {
            columns.push('is_recurring', 'recurrence_rule', 'recurrence_end_date');
            values.push(true, eventData.recurrence_rule || 'FREQ=WEEKLY', eventData.recurrence_end_date);
          }
          
          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
          const result = await db.query(
            `INSERT INTO events (${columns.join(', ')})
             VALUES (${placeholders})
             RETURNING *`,
            values
          );

          const parentEvent = result.rows[0];
          insertedEvents.push(parentEvent);
          
          // If this is a recurring event, create all the recurring instances
          if (eventData.is_recurring && eventData.recurrence_type && eventData.recurrence_end_date) {
            console.log('Creating recurring instances for imported event...');
            
            const recurringDates = generateRecurringDates(
              new Date(eventData.event_date), 
              new Date(eventData.recurrence_end_date), 
              eventData.recurrence_type
            );
            
            console.log(`Creating ${recurringDates.length - 1} recurring instances...`);
            
            // Skip the first date (already created as parent) and create the rest
            for (let i = 1; i < recurringDates.length; i++) {
              const recurringDate = recurringDates[i];
              const recurringDateStr = recurringDate.toISOString().split('T')[0];
              
              try {
                await db.query(
                  `INSERT INTO events (title, event_date, start_time, end_time, end_date, location, description, link, created_by, creator_name, is_recurring, recurrence_rule, recurrence_end_date, parent_event_id, color)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
                  [
                    eventData.title, 
                    recurringDateStr, 
                    eventData.start_time, 
                    eventData.end_time, 
                    eventData.end_date ? new Date(new Date(eventData.end_date).getTime() + (recurringDate.getTime() - new Date(eventData.event_date).getTime())).toISOString().split('T')[0] : null,
                    eventData.location, 
                    eventData.description,
                    eventData.link || null,
                    req.user.id, 
                    req.user.display_name, 
                    true, 
                    eventData.recurrence_rule, 
                    eventData.recurrence_end_date,
                    parentEvent.id,
                    parentEvent.color
                  ]
                );
              } catch (recurringError) {
                console.error(`Error creating recurring instance for ${recurringDateStr}:`, recurringError);
              }
            }
            
            console.log(`Created recurring event series with ${recurringDates.length} total instances`);
          }
        } catch (error) {
          console.error('Error inserting event:', error);
          errors.push(`Failed to import: ${eventData.title}`);
        }
      }

      // Return summary
      res.json({
        message: 'ICS file processed successfully',
        imported: insertedEvents.length,
        duplicates: duplicates.length,
        errors: errors.length,
        details: {
          imported_events: insertedEvents.map(e => ({ title: e.title, date: e.event_date })),
          duplicate_events: duplicates,
          error_events: errors
        }
      });

    } catch (error) {
      console.error('Error processing ICS upload:', error);
      if (error.message === 'Only .ics files are allowed') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to process ICS file' });
    }
  }
);

// PUT /api/events/:id - Update event (requires auth, only creator can update)
router.put('/:id',
  requireAuth,
  [
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required and must be under 255 characters'),
    body('event_date').isISO8601().withMessage('Valid start date is required'),
    body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required (HH:MM)'),
    body('end_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time required (HH:MM)'),
    body('end_date').optional().isISO8601().withMessage('Valid end date required'),
    body('location').trim().isLength({ min: 1, max: 255 }).withMessage('Location is required and must be under 255 characters'),
    body('description').optional().isLength({ max: 2000 }).withMessage('Description must be under 2000 characters'),
    body('link').optional().isURL().withMessage('Invalid URL format'),
    body('is_all_day').optional().isBoolean().withMessage('Invalid all day value'),
    body('is_recurring').optional().isBoolean().withMessage('Invalid recurring value'),
    body('recurrence_type').optional().isIn(['daily', 'weekly', 'biweekly', 'monthly']).withMessage('Invalid recurrence type'),
    body('recurrence_end_date').optional().isISO8601().withMessage('Valid recurrence end date required')
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      console.log('Update request for event ID:', id, 'by user:', req.user.id);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, event_date, start_time, end_time, end_date, location, description, link,
              is_all_day, is_recurring, recurrence_type, recurrence_end_date } = req.body;
      console.log('Updating event with data:', { title, event_date, start_time, end_time, end_date, location, description, link, is_recurring, recurrence_type, recurrence_end_date });

      // Check if event exists and user owns it
      try {
        const eventCheck = await db.query(
          'SELECT created_by FROM events WHERE id = $1',
          [id]
        );
        
        if (eventCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Event not found' });
        }
        
        if (eventCheck.rows[0].created_by !== req.user.id) {
          return res.status(403).json({ error: 'You can only edit your own events' });
        }
      } catch (checkError) {
        console.error('Error checking event ownership:', checkError);
        return res.status(500).json({ error: 'Database error during ownership check' });
      }

      // Validate date/time logic
      try {
        const startDateTime = new Date(`${event_date}T${start_time}`);
        const now = new Date();
        
        // Get the existing event date properly formatted
        const existingEvent = eventCheck.rows[0];
        const existingDate = new Date(existingEvent.event_date);
        const existingDateStr = existingDate.toISOString().split('T')[0];
        const existingStartDateTime = new Date(`${existingDateStr}T${existingEvent.start_time}`);
        
        // Only prevent updates if trying to change the date/time to the past
        if (startDateTime < now && (event_date !== existingDateStr || start_time !== existingEvent.start_time)) {
          return res.status(400).json({ error: 'Cannot change event date/time to the past' });
        }
        
        // Don't allow any edits to events that have already started
        if (existingStartDateTime < now) {
          return res.status(400).json({ error: 'Cannot edit events that have already started' });
        }
        
        // If end_date and end_time are provided, validate end is after start
        if (end_date && end_time) {
          const endDateTime = new Date(`${end_date}T${end_time}`);
          if (endDateTime <= startDateTime) {
            return res.status(400).json({ 
              error: 'Event end date/time must be after start date/time',
              suggestion: 'Please adjust the end date to be after the start date'
            });
          }
        } else if (end_time && !end_date) {
          // Same day event - check end time is after start time
          const startTimeMinutes = parseInt(start_time.split(':')[0]) * 60 + parseInt(start_time.split(':')[1]);
          const endTimeMinutes = parseInt(end_time.split(':')[0]) * 60 + parseInt(end_time.split(':')[1]);
          if (endTimeMinutes <= startTimeMinutes) {
            return res.status(400).json({ 
              error: 'Event end time must be after start time on the same day',
              suggestion: 'Please set an end time after the start time, or add an end date for multi-day events'
            });
          }
        }
      } catch (dateError) {
        console.error('Date parsing error:', dateError);
        return res.status(400).json({ error: 'Invalid date or time format' });
      }

      // Update the event
      try {
        // Build dynamic update query based on recurrence fields
        let updateQuery, updateParams;
        
        if (is_recurring !== undefined) {
          // Include recurrence fields in update
          const recurrenceRule = is_recurring && recurrence_type ? `FREQ=${recurrence_type.toUpperCase()}` : null;
          
          updateQuery = `UPDATE events 
                        SET title = $1, event_date = $2, start_time = $3, end_time = $4, end_date = $5, 
                            location = $6, description = $7, link = $8, is_all_day = $9, is_recurring = $10, recurrence_rule = $11, recurrence_end_date = $12
                        WHERE id = $13
                        RETURNING *`;
          updateParams = [title, event_date, start_time, end_time || null, end_date || null, 
                         location, description || null, link || null, is_all_day || false, is_recurring, recurrenceRule, 
                         is_recurring ? recurrence_end_date : null, id];
        } else {
          // Standard update without recurrence fields
          updateQuery = `UPDATE events 
                        SET title = $1, event_date = $2, start_time = $3, end_time = $4, end_date = $5, location = $6, description = $7, link = $8, is_all_day = $9
                        WHERE id = $10
                        RETURNING *`;
          updateParams = [title, event_date, start_time, end_time || null, end_date || null, location, description || null, link || null, is_all_day || false, id];
        }
        
        console.log('Updating event with query:', updateQuery);
        console.log('Update params:', updateParams);
        
        const result = await db.query(updateQuery, updateParams);
        const updatedEvent = result.rows[0];
        
        console.log('Event updated successfully:', updatedEvent);
        
        // Handle recurring status changes
        if (!updatedEvent.parent_event_id) { // Only for parent events
          // First, check if event was changed from recurring to non-recurring
          const wasRecurringCheck = await db.query(
            'SELECT COUNT(*) as count FROM events WHERE parent_event_id = $1',
            [id]
          );
          const hasChildren = parseInt(wasRecurringCheck.rows[0].count) > 0;
          
          if (!is_recurring && hasChildren) {
            // Event changed from recurring to non-recurring - delete all children
            console.log('Event changed to non-recurring, deleting child events...');
            await db.query('DELETE FROM events WHERE parent_event_id = $1', [id]);
            console.log('Child events deleted');
          } else if (is_recurring && recurrence_type && recurrence_end_date) {
            // Event is recurring - check if we need to create/update children
            if (hasChildren) {
              // Already has children - delete them and recreate with new parameters
              console.log('Recurring parameters changed, recreating instances...');
              await db.query('DELETE FROM events WHERE parent_event_id = $1', [id]);
            }
            
            // Create recurring instances
            console.log('Creating recurring instances...');
            
            const recurringDates = generateRecurringDates(
              new Date(event_date), 
              new Date(recurrence_end_date), 
              recurrence_type
            );
            
            console.log(`Creating ${recurringDates.length - 1} recurring instances...`);
            
            // Skip the first date (already exists as parent) and create the rest
            for (let i = 1; i < recurringDates.length; i++) {
              const recurringDate = recurringDates[i];
              const recurringDateStr = recurringDate.toISOString().split('T')[0];
              
              try {
                const recurringResult = await db.query(
                  `INSERT INTO events (title, event_date, start_time, end_time, end_date, location, description, link, created_by, creator_name, is_recurring, recurrence_rule, recurrence_end_date, parent_event_id, color)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                   RETURNING id, event_date`,
                  [
                    title, 
                    recurringDateStr, 
                    start_time, 
                    end_time || null, 
                    end_date ? new Date(new Date(end_date).getTime() + (recurringDate.getTime() - new Date(event_date).getTime())).toISOString().split('T')[0] : null,
                    location, 
                    description || null, 
                    link || null,
                    req.user.id, 
                    req.user.display_name, 
                    true, 
                    `FREQ=${recurrence_type.toUpperCase()}`, 
                    recurrence_end_date,
                    parseInt(id),
                    updatedEvent.color
                  ]
                );
              } catch (recurringError) {
                console.error(`Error creating recurring instance for ${recurringDateStr}:`, recurringError);
                // Continue creating other instances even if one fails
              }
            }
            
            console.log(`Created recurring event series with ${recurringDates.length} total instances`);
          }
        }
        
        res.json(updatedEvent);
      } catch (updateError) {
        console.error('Error during event update:', updateError);
        return res.status(500).json({ error: 'Database error during update' });
      }
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ error: 'Failed to update event' });
    }
  }
);

// DELETE /api/events/:id/series - Delete all events in a recurring series
router.delete('/:id/series',
  requireAuth,
  async (req, res) => {
    try {
      const { id } = req.params;
      console.log('Delete series request for event ID:', id, 'by user:', req.user.id);
      
      // Check if event exists and user owns it
      const eventCheck = await db.query(
        'SELECT created_by, is_recurring, parent_event_id FROM events WHERE id = $1',
        [id]
      );
      
      if (eventCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      if (eventCheck.rows[0].created_by !== req.user.id) {
        return res.status(403).json({ error: 'You can only delete your own events' });
      }
      
      const event = eventCheck.rows[0];
      
      // If this is a child event, find the parent
      let parentId = id;
      if (event.parent_event_id) {
        parentId = event.parent_event_id;
      }
      
      // Delete all events in the series (parent and children)
      // The CASCADE on the foreign key will automatically delete children when parent is deleted
      console.log(`Attempting to delete series with parent ID: ${parentId}`);
      
      const result = await db.query(
        'DELETE FROM events WHERE id = $1 OR parent_event_id = $1 RETURNING id',
        [parentId]
      );
      
      console.log(`Deleted ${result.rows.length} events from series`);
      console.log('Deleted event IDs:', result.rows.map(r => r.id));
      
      res.json({ 
        message: 'Event series deleted successfully',
        deletedCount: result.rows.length 
      });
      
    } catch (error) {
      console.error('Error deleting event series:', error);
      res.status(500).json({ error: 'Failed to delete event series' });
    }
  }
);

// DELETE /api/events/:id - Delete event (requires auth, only creator can delete)
router.delete('/:id',
  requireAuth,
  async (req, res) => {
    try {
      const { id } = req.params;
      console.log('Delete request for event ID:', id, 'by user:', req.user.id);
      
      // First check if event exists and user owns it
      try {
        const eventCheck = await db.query(
          'SELECT created_by, is_recurring, parent_event_id FROM events WHERE id = $1',
          [id]
        );
        
        console.log('Event check result:', eventCheck.rows);
        
        if (eventCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Event not found' });
        }
        
        if (eventCheck.rows[0].created_by !== req.user.id) {
          return res.status(403).json({ error: 'You can only delete your own events' });
        }
        
        // Check if this is a parent recurring event
        const event = eventCheck.rows[0];
        if (event.is_recurring && !event.parent_event_id) {
          // This is a parent event - check for child events
          const childCheck = await db.query(
            'SELECT COUNT(*) as count FROM events WHERE parent_event_id = $1',
            [id]
          );
          
          const childCount = parseInt(childCheck.rows[0].count);
          console.log(`Found ${childCount} child events for parent event ${id}`);
          
          if (childCount > 0) {
            // Return info about child events
            console.log(`Parent event ${id} has ${childCount} children`);
            return res.status(200).json({ 
              hasChildren: true,
              childCount: childCount,
              message: `This recurring event has ${childCount} future occurrences. Delete all?`
            });
          } else {
            console.log(`Parent event ${id} has no children`);
          }
        }
      } catch (checkError) {
        console.error('Error checking event ownership:', checkError);
        return res.status(500).json({ error: 'Database error during ownership check' });
      }
      
      // Delete the event
      try {
        console.log('Deleting event with ID:', id);
        
        // Check if we should force single deletion (from X-Force-Single header)
        const forceSingle = req.headers['x-force-single'] === 'true';
        
        if (forceSingle) {
          // Just delete the single event
          await db.query('DELETE FROM events WHERE id = $1', [id]);
          console.log('Single event deleted successfully');
        } else {
          // Normal deletion - CASCADE will handle children if it's a parent
          await db.query('DELETE FROM events WHERE id = $1', [id]);
          console.log('Event deleted successfully');
        }
        
        res.json({ message: 'Event deleted successfully' });
      } catch (deleteError) {
        console.error('Error during event deletion:', deleteError);
        return res.status(500).json({ error: 'Database error during deletion' });
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ error: 'Failed to delete event' });
    }
  }
);

module.exports = router;
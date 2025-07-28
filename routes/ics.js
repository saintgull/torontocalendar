const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { generateICS } = require('../utils/icsGenerator');
const archiver = require('archiver');

// Download ICS file for a single event
router.get('/event/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('ICS download requested for event ID:', id);
    
    // Get event details
    const result = await db.query(
      `SELECT e.*, u.display_name as creator_name 
       FROM events e 
       JOIN users u ON e.created_by = u.id 
       WHERE e.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      console.log('Event not found:', id);
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const event = result.rows[0];
    console.log('Event data:', event);
    
    const icsContent = generateICS(event);
    console.log('Generated ICS content:', icsContent);
    
    // Create a safe filename from the event title
    const safeFilename = event.title
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .toLowerCase()
      .substring(0, 50); // Limit length
    
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.ics"`);
    res.send(icsContent);
  } catch (error) {
    console.error('Error generating ICS:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Failed to generate calendar file' });
  }
});

// Download ICS file for all events
router.get('/all', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT e.*, u.display_name as creator_name 
       FROM events e 
       JOIN users u ON e.created_by = u.id 
       ORDER BY e.event_date ASC`
    );
    
    const events = result.rows;
    const icsContent = generateICS(events);
    
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename="toronto-events.ics"');
    res.send(icsContent);
  } catch (error) {
    console.error('Error generating ICS:', error);
    res.status(500).json({ error: 'Failed to generate calendar file' });
  }
});

// Bulk download ICS files for events within date range
router.get('/bulk-download', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }
    
    // Get all events within the date range
    const result = await db.query(
      `SELECT e.*, u.display_name as creator_name 
       FROM events e 
       LEFT JOIN users u ON e.created_by = u.id 
       WHERE e.event_date >= $1 AND e.event_date <= $2
       ORDER BY e.event_date ASC`,
      [start_date, end_date]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No events found in the specified date range' });
    }
    
    // Set up the archive
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="toronto-events-${start_date}-to-${end_date}.zip"`);
    
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    // Pipe archive data to the response
    archive.pipe(res);
    
    // Add each event as a separate ICS file
    for (const event of result.rows) {
      try {
        const icsContent = generateICS(event);
        
        // Create a safe filename from the event title
        const safeFilename = event.title
          .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .toLowerCase()
          .substring(0, 50); // Limit length
        
        // Add a number suffix if we have duplicate names
        const filename = `${safeFilename}-${event.id}.ics`;
        
        // Add the ICS content to the archive
        archive.append(icsContent, { name: filename });
        
      } catch (error) {
        console.error(`Error generating ICS for event ${event.id}:`, error);
        // Continue with other events even if one fails
      }
    }
    
    // Finalize the archive
    archive.finalize();
    
  } catch (error) {
    console.error('Error creating bulk download:', error);
    res.status(500).json({ error: 'Failed to create bulk download' });
  }
});

module.exports = router;
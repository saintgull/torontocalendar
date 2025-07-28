const ics = require('ics');

function generateICS(events) {
  // Handle both single event and array of events
  const eventArray = Array.isArray(events) ? events : [events];
  
  const icsEvents = eventArray.map(event => {
    // Determine end date - use end_date if provided, otherwise use event_date
    const endDate = event.end_date || event.event_date;
    const endTime = event.end_time || event.start_time;
    
    const icsEvent = {
      title: event.title,
      description: event.description || '',
      location: event.location,
      start: parseDateTimeToArray(event.event_date, event.start_time),
      end: parseDateTimeToArray(endDate, endTime),
      status: 'CONFIRMED',
      busyStatus: 'BUSY'
    };
    
    // Only add organizer if creator_name exists
    if (event.creator_name) {
      icsEvent.organizer = { name: event.creator_name };
    }
    
    // Add recurrence rule if event is recurring
    if (event.is_recurring && event.recurrence_rule && event.recurrence_end_date) {
      // Parse the recurrence rule (e.g., "FREQ=WEEKLY")
      const rruleParts = event.recurrence_rule.split('=');
      if (rruleParts.length === 2 && rruleParts[0] === 'FREQ') {
        const freq = rruleParts[1].toUpperCase();
        const untilDate = new Date(event.recurrence_end_date);
        
        // Format the until date as YYYYMMDDTHHMMSSZ
        const year = untilDate.getFullYear();
        const month = String(untilDate.getMonth() + 1).padStart(2, '0');
        const day = String(untilDate.getDate()).padStart(2, '0');
        
        // Build the RRULE string
        icsEvent.recurrenceRule = `FREQ=${freq};UNTIL=${year}${month}${day}T235959Z`;
      }
    }
    
    return icsEvent;
  });

  const { error, value } = ics.createEvents(icsEvents);
  
  if (error) {
    console.error('ICS generation error:', error);
    console.error('Events that failed:', JSON.stringify(icsEvents, null, 2));
    throw new Error(`Failed to generate ICS file: ${error.message || error}`);
  }
  
  return value;
}

function parseDateTimeToArray(date, time) {
  const eventDate = new Date(date);
  const [hours, minutes] = time.split(':').map(Number);
  
  // Convert to Toronto timezone
  const torontoDate = new Date(eventDate);
  torontoDate.setHours(hours, minutes, 0, 0);
  
  return [
    torontoDate.getFullYear(),
    torontoDate.getMonth() + 1, // Month is 0-indexed
    torontoDate.getDate(),
    torontoDate.getHours(),
    torontoDate.getMinutes()
  ];
}

module.exports = { generateICS };
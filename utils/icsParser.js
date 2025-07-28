const ical = require('ical');

function parseICSFile(icsContent) {
  try {
    const parsed = ical.parseICS(icsContent);
    const events = [];
    const now = new Date();
    
    for (const key in parsed) {
      const event = parsed[key];
      
      // Only process VEVENT components
      if (event.type !== 'VEVENT') continue;
      
      // Skip if missing required fields
      if (!event.summary || !event.start) continue;
      
      // Extract date and time
      const startDate = new Date(event.start);
      const endDate = event.end ? new Date(event.end) : null;
      
      // Check if this is a recurring event
      const isRecurring = !!event.rrule;
      
      if (isRecurring) {
        console.log('Processing recurring event:', event.summary);
        console.log('RRULE:', event.rrule);
        console.log('Original start date:', startDate);
        
        // For recurring events, find the next occurrence
        const nextOccurrence = getNextOccurrenceFromToday(startDate, event.rrule);
        
        if (!nextOccurrence) {
          console.log('No future occurrences found');
          continue;
        }
        
        console.log('Next occurrence:', nextOccurrence);
        console.log('Original startDate:', startDate);
        console.log('Original endDate:', endDate);
        
        // Calculate duration from original event
        const duration = endDate ? endDate.getTime() - startDate.getTime() : 0;
        console.log('Event duration (ms):', duration);
        console.log('Event duration (hours):', duration / (1000 * 60 * 60));
        
        const nextEndDate = duration ? new Date(nextOccurrence.getTime() + duration) : null;
        console.log('Next end date:', nextEndDate);
        
        // Extract time from original event
        // For timezone-aware events, use the local time representation
        const localStartDate = new Date(startDate.toLocaleString("en-US", {timeZone: "America/Toronto"}));
        const localEndDate = endDate ? new Date(endDate.toLocaleString("en-US", {timeZone: "America/Toronto"})) : null;
        
        const startTime = `${String(localStartDate.getHours()).padStart(2, '0')}:${String(localStartDate.getMinutes()).padStart(2, '0')}`;
        const endTime = localEndDate ? `${String(localEndDate.getHours()).padStart(2, '0')}:${String(localEndDate.getMinutes()).padStart(2, '0')}` : null;
        
        const eventData = {
          title: event.summary.toString().trim(),
          event_date: nextOccurrence.toISOString().split('T')[0],
          start_time: startTime,
          end_time: endTime,
          end_date: (endTime && startTime > endTime) ? nextOccurrence.toISOString().split('T')[0] : null,
          location: event.location ? event.location.toString().trim() : 'Location TBD',
          description: event.description ? event.description.toString().trim() : null,
          is_recurring: true,
          recurrence_type: getRecurrenceType(event.rrule),
          recurrence_rule: formatRRuleString(event.rrule),
          recurrence_end_date: getDefaultRecurrenceEndDate(nextOccurrence, getRecurrenceType(event.rrule))
        };
        
        events.push(eventData);
      } else {
        // Skip past events for non-recurring events
        if (startDate < now) continue;
        
        // Format for our database
        const eventData = {
          title: event.summary.toString().trim(),
          event_date: startDate.toISOString().split('T')[0],
          start_time: startDate.toTimeString().slice(0, 5),
          end_time: endDate ? endDate.toTimeString().slice(0, 5) : null,
          end_date: (endDate && endDate.toISOString().split('T')[0] !== startDate.toISOString().split('T')[0]) 
            ? endDate.toISOString().split('T')[0] : null,
          location: event.location ? event.location.toString().trim() : 'Location TBD',
          description: event.description ? event.description.toString().trim() : null,
          is_recurring: false
        };
        
        events.push(eventData);
      }
    }
    
    // Validate and trim all events
    events.forEach(eventData => {
      if (eventData.title.length > 255) eventData.title = eventData.title.slice(0, 255);
      if (eventData.location.length > 255) eventData.location = eventData.location.slice(0, 255);
      if (eventData.description && eventData.description.length > 2000) {
        eventData.description = eventData.description.slice(0, 2000);
      }
    });
    
    return { success: true, events, count: events.length };
  } catch (error) {
    console.error('ICS parsing error:', error);
    return { success: false, error: 'Invalid ICS file format' };
  }
}

// Helper function to get the next occurrence from today
function getNextOccurrenceFromToday(originalStart, rrule) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  
  // Handle RRule object from ical library
  if (rrule && rrule.options) {
    const freq = rrule.options.freq;
    const byweekday = rrule.options.byweekday;
    
    console.log('RRule options:', { freq, byweekday });
    
    if (freq === 2) { // 2 = WEEKLY in rrule library
      // Get target day(s) of week
      let targetDays = [];
      
      if (byweekday && byweekday.length > 0) {
        // RRule uses 0=Monday, 6=Sunday
        // JavaScript Date uses 0=Sunday, 6=Saturday
        // Convert RRule weekday to JS weekday
        targetDays = byweekday.map(day => {
          // RRule: MO=0, TU=1, WE=2, TH=3, FR=4, SA=5, SU=6
          // JS Date: SU=0, MO=1, TU=2, WE=3, TH=4, FR=5, SA=6
          return day === 6 ? 0 : day + 1;
        });
      } else {
        // Use the original event's day of week
        targetDays = [originalStart.getDay()];
      }
      
      console.log('Target days (JS format):', targetDays);
      
      // Find next occurrence
      const nextDate = new Date(today);
      
      // Look up to 14 days ahead to find next occurrence
      for (let i = 0; i < 14; i++) {
        if (i > 0) nextDate.setDate(nextDate.getDate() + 1);
        
        if (targetDays.includes(nextDate.getDay())) {
          // Found a matching day, set the time
          nextDate.setHours(
            originalStart.getHours(),
            originalStart.getMinutes(),
            originalStart.getSeconds(),
            0
          );
          
          // Make sure it's in the future
          if (nextDate > new Date()) {
            return nextDate;
          }
        }
      }
    }
  }
  
  // For non-weekly or if parsing failed, return original if future, otherwise null
  return originalStart > today ? originalStart : null;
}

// Helper function to format recurrence rule for display
function formatRecurrence(rrule) {
  if (!rrule) return 'Recurring event';
  
  let freq = null;
  
  if (typeof rrule === 'string') {
    // Parse string RRULE
    const match = rrule.match(/FREQ=(\w+)/);
    if (match) freq = match[1];
  } else if (rrule.options) {
    freq = rrule.options.freq;
  }
  
  switch (freq) {
    case 'WEEKLY':
    case 2: // numeric code for WEEKLY
      return 'Weekly';
    case 'DAILY':
    case 3: // numeric code for DAILY
      return 'Daily';
    case 'MONTHLY':
    case 1: // numeric code for MONTHLY
      return 'Monthly';
    case 'YEARLY':
    case 0: // numeric code for YEARLY
      return 'Yearly';
    default:
      return 'Recurring event';
  }
}

// Helper function to get recurrence type for our database
function getRecurrenceType(rrule) {
  if (!rrule || !rrule.options) return 'weekly';
  
  const freq = rrule.options.freq;
  switch (freq) {
    case 3: return 'daily';
    case 2: return 'weekly';
    case 1: return 'monthly';
    default: return 'weekly';
  }
}

// Helper function to format RRULE as string for storage
function formatRRuleString(rrule) {
  if (!rrule || !rrule.options) return 'FREQ=WEEKLY';
  
  const freq = rrule.options.freq;
  let ruleStr = 'FREQ=';
  
  switch (freq) {
    case 3: ruleStr += 'DAILY'; break;
    case 2: ruleStr += 'WEEKLY'; break;
    case 1: ruleStr += 'MONTHLY'; break;
    default: ruleStr += 'WEEKLY';
  }
  
  if (rrule.options.byweekday && rrule.options.byweekday.length > 0) {
    const dayNames = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    const days = rrule.options.byweekday.map(d => dayNames[d]).join(',');
    ruleStr += `;BYDAY=${days}`;
  }
  
  return ruleStr;
}

// Get a default recurrence end date (6 months from start)
function getDefaultRecurrenceEndDate(startDate, recurrenceType) {
  const endDate = new Date(startDate);
  
  // Add 6 months by default
  endDate.setMonth(endDate.getMonth() + 6);
  
  return endDate.toISOString().split('T')[0];
}

module.exports = { parseICSFile };
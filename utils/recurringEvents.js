// Helper functions for managing recurring events

function generateRecurringDates(startDate, endDate, recurrenceType, maxOccurrences = 365) {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  // Ensure we start from the correct date
  dates.push(new Date(current));
  
  let count = 1;
  while (current <= end && count < maxOccurrences) {
    switch (recurrenceType) {
      case 'daily':
        current.setDate(current.getDate() + 1);
        break;
      case 'weekly':
        current.setDate(current.getDate() + 7);
        break;
      case 'biweekly':
        current.setDate(current.getDate() + 14);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + 1);
        break;
      default:
        return dates;
    }
    
    if (current <= end) {
      dates.push(new Date(current));
      count++;
    }
  }
  
  return dates;
}

function formatRecurrenceRule(recurrenceType, endDate) {
  const rules = {
    daily: 'FREQ=DAILY',
    weekly: 'FREQ=WEEKLY',
    biweekly: 'FREQ=WEEKLY;INTERVAL=2',
    monthly: 'FREQ=MONTHLY'
  };
  
  let rule = rules[recurrenceType] || '';
  if (endDate) {
    // Format end date to YYYYMMDD for iCal format
    const end = new Date(endDate);
    const year = end.getFullYear();
    const month = String(end.getMonth() + 1).padStart(2, '0');
    const day = String(end.getDate()).padStart(2, '0');
    rule += `;UNTIL=${year}${month}${day}`;
  }
  
  return rule;
}

// Helper function to get a user-friendly recurrence description
function getRecurrenceDescription(recurrenceRule, recurrenceEndDate) {
  if (!recurrenceRule) return null;
  
  let description = '';
  
  if (recurrenceRule.includes('DAILY')) {
    description = 'Daily';
  } else if (recurrenceRule.includes('WEEKLY;INTERVAL=2')) {
    description = 'Biweekly';
  } else if (recurrenceRule.includes('WEEKLY')) {
    description = 'Weekly';
  } else if (recurrenceRule.includes('MONTHLY')) {
    description = 'Monthly';
  } else {
    description = 'Recurring';
  }
  
  if (recurrenceEndDate) {
    const endDate = new Date(recurrenceEndDate);
    description += ` until ${endDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })}`;
  }
  
  return description;
}

module.exports = {
  generateRecurringDates,
  formatRecurrenceRule,
  getRecurrenceDescription
};
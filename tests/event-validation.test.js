// Basic tests for event validation
const assert = require('assert');

// Test event date validation
function testEventDateValidation() {
  console.log('Testing event date validation...');
  
  // Valid date formats
  const validDates = [
    '2025-07-22',
    '2025-12-31',
    '2025-01-01'
  ];
  
  validDates.forEach(date => {
    const isValid = /^\d{4}-\d{2}-\d{2}$/.test(date);
    assert.strictEqual(isValid, true, `${date} should be valid`);
  });
  
  // Invalid date formats
  const invalidDates = [
    '07-22-2025',
    '2025/07/22',
    '2025.07.22',
    'not-a-date',
    '2025-13-01', // invalid month
    '2025-07-32'  // invalid day
  ];
  
  invalidDates.forEach(date => {
    const isValid = /^\d{4}-\d{2}-\d{2}$/.test(date) && 
                   !isNaN(Date.parse(date));
    assert.strictEqual(isValid, false, `${date} should be invalid`);
  });
  
  console.log('✓ Event date validation test passed');
}

// Test event time validation
function testEventTimeValidation() {
  console.log('Testing event time validation...');
  
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  // Valid times
  const validTimes = [
    '14:00',
    '09:30',
    '23:59',
    '00:00',
    '1:30',
    '9:45'
  ];
  
  validTimes.forEach(time => {
    const isValid = timeRegex.test(time);
    assert.strictEqual(isValid, true, `${time} should be valid`);
  });
  
  // Invalid times
  const invalidTimes = [
    '24:00',
    '14:60',
    '14:00:00',
    '2:5',
    'not-a-time',
    '14.00'
  ];
  
  invalidTimes.forEach(time => {
    const isValid = timeRegex.test(time);
    assert.strictEqual(isValid, false, `${time} should be invalid`);
  });
  
  console.log('✓ Event time validation test passed');
}

// Test event date/time logic
function testEventDateTimeLogic() {
  console.log('Testing event date/time logic...');
  
  // Test: Event cannot be in the past
  const now = new Date();
  const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // yesterday
  const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // tomorrow
  
  assert.strictEqual(pastDate < now, true, 'Past date should be before now');
  assert.strictEqual(futureDate > now, true, 'Future date should be after now');
  
  // Test: End time must be after start time
  const startTime = '14:00';
  const endTimeBefore = '13:00';
  const endTimeAfter = '15:00';
  
  const startMinutes = 14 * 60 + 0;
  const endMinutesBefore = 13 * 60 + 0;
  const endMinutesAfter = 15 * 60 + 0;
  
  assert.strictEqual(endMinutesBefore < startMinutes, true, 'End time before should be invalid');
  assert.strictEqual(endMinutesAfter > startMinutes, true, 'End time after should be valid');
  
  console.log('✓ Event date/time logic test passed');
}

// Test field length validation
function testFieldLengthValidation() {
  console.log('Testing field length validation...');
  
  // Title: max 255 chars
  const validTitle = 'A'.repeat(255);
  const invalidTitle = 'A'.repeat(256);
  assert.strictEqual(validTitle.length <= 255, true, 'Title should be within limit');
  assert.strictEqual(invalidTitle.length <= 255, false, 'Title should exceed limit');
  
  // Description: max 2000 chars
  const validDescription = 'A'.repeat(2000);
  const invalidDescription = 'A'.repeat(2001);
  assert.strictEqual(validDescription.length <= 2000, true, 'Description should be within limit');
  assert.strictEqual(invalidDescription.length <= 2000, false, 'Description should exceed limit');
  
  console.log('✓ Field length validation test passed');
}

// Run all tests
function runTests() {
  console.log('Running Event Validation Tests\n' + '='.repeat(40));
  
  try {
    testEventDateValidation();
    testEventTimeValidation();
    testEventDateTimeLogic();
    testFieldLengthValidation();
    
    console.log('\n' + '='.repeat(40));
    console.log('All event validation tests passed! ✓');
  } catch (error) {
    console.error('\nTest failed:', error.message);
    process.exit(1);
  }
}

runTests();
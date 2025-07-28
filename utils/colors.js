// Dark colors only for better visibility
const eventColors = [
  '#0d6d6b', // Caribbean Current
  '#a34129', // Chestnut
  '#006494', // Lapis Lazuli
  '#006600', // Office Green
  '#470063', // Indigo
  '#214e34', // Cal Poly Green
  '#a4133a', // Amaranth Purple
  '#7c4413', // Russet
  '#9e2a2b', // Auburn
  '#525252'  // Davys Gray
];

// Counter to track which color to use next for new event families
let colorIndex = 0;

function getNextColor() {
  const color = eventColors[colorIndex % eventColors.length];
  colorIndex++;
  return color;
}

// Get consistent color based on event ID or parent ID
function getColorForEvent(eventId, parentEventId = null) {
  // Use parent event ID if available (for child events)
  const idToUse = parentEventId || eventId;
  
  // Convert ID to a consistent index
  let numericId;
  if (typeof idToUse === 'number') {
    numericId = idToUse;
  } else {
    // For string IDs, sum character codes for consistency
    numericId = 0;
    for (let i = 0; i < idToUse.length; i++) {
      numericId += idToUse.charCodeAt(i);
    }
  }
  
  const index = numericId % eventColors.length;
  return eventColors[index];
}

// Legacy function for backward compatibility
function getRandomColor() {
  return getNextColor();
}

module.exports = {
  getRandomColor,
  getNextColor,
  getColorForEvent,
  eventColors
};
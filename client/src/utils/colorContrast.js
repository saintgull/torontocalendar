// Calculate the luminance of a color
function getLuminance(hexColor) {
  // Remove the # if present
  const hex = hexColor.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Apply gamma correction
  const gammaCorrect = (c) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  
  const rCorrected = gammaCorrect(r);
  const gCorrected = gammaCorrect(g);
  const bCorrected = gammaCorrect(b);
  
  // Calculate relative luminance
  return 0.2126 * rCorrected + 0.7152 * gCorrected + 0.0722 * bCorrected;
}

// Determine if text should be white or black based on background color
export function getContrastTextColor(backgroundColor) {
  const luminance = getLuminance(backgroundColor);
  
  // If luminance is greater than 0.5, use black text, otherwise white
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// Get a slightly darker version of a color for hover states
export function getDarkerColor(hexColor, amount = 0.2) {
  // Remove the # if present
  const hex = hexColor.replace('#', '');
  
  // Convert hex to RGB
  let r = parseInt(hex.substr(0, 2), 16);
  let g = parseInt(hex.substr(2, 2), 16);
  let b = parseInt(hex.substr(4, 2), 16);
  
  // Darken the color
  r = Math.max(0, Math.floor(r * (1 - amount)));
  g = Math.max(0, Math.floor(g * (1 - amount)));
  b = Math.max(0, Math.floor(b * (1 - amount)));
  
  // Convert back to hex
  const toHex = (n) => n.toString(16).padStart(2, '0');
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
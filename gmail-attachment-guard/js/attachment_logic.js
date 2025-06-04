console.log("Attachment Guard: attachment_logic.js loading...");

/**
 * Checks if the given text contains any of the specified keywords.
 * @param {string} text - The text to search within (e.g., email body + subject).
 * @param {string[]} keywords - An array of keywords to look for.
 * @returns {boolean} True if any keyword is found, false otherwise.
 */
function textContainsKeywords(text, keywords) {
  if (!text || !keywords || keywords.length === 0) {
    return false;
  }
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

console.log("Attachment Guard: attachment_logic.js loaded.");
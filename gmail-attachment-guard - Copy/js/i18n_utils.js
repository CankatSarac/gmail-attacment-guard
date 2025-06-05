// js/i18n_utils.js

/**
 * Gets a localized string from messages.json.
 * @param {string} messageKey - The key of the message in messages.json.
 * @returns {string} The localized string.
 */
function getLocalizedString(messageKey) {
  return chrome.i18n.getMessage(messageKey) || messageKey; // Fallback to key if not found
}

/**
 * Gets the localized attachment keywords as an array.
 * @returns {string[]} An array of lowercase keywords.
 */
function getLocalizedAttachmentKeywords() {
  const keywordsString = getLocalizedString("attachmentKeywords");
  if (keywordsString) {
    return keywordsString.toLowerCase().split(',').map(keyword => keyword.trim()).filter(Boolean);
  }
  return [];
}
console.log("Attachment Guard: i18n_utils.js loading...");

/**
 * Gets a localized string from messages.json.
 * @param {string} messageKey - The key of the message in messages.json.
 * @returns {string} The localized string.
 */
function getLocalizedString(messageKey) {
  try {
    return chrome.i18n.getMessage(messageKey) || messageKey; // Fallback to key if not found
  } catch (error) {
    console.warn("Attachment Guard: Error getting localized string:", error);
    return messageKey;
  }
}

/**
 * Gets localized message text
 * @param {string} messageName - The message key
 * @returns {string} Localized message
 */
function getLocalizedMessage(messageName) {
  try {
    return chrome.i18n.getMessage(messageName) || messageName;
  } catch (error) {
    console.warn("Attachment Guard: Error getting localized message:", error);
    return messageName;
  }
}

/**
 * Gets the localized attachment keywords as an array.
 * @returns {string[]} An array of lowercase keywords.
 */
function getLocalizedAttachmentKeywords() {
  try {
    const keywordsString = getLocalizedString("attachmentKeywords");
    if (keywordsString) {
      return keywordsString.toLowerCase().split(',').map(keyword => keyword.trim()).filter(Boolean);
    }
    // Fallback keywords in case localization fails
    return ['attachment', 'attached', 'file', 'document', 'see attached', 'resume', 'cv', 'invoice', 'report', 'presentation', 'enclosed', 'find attached', 'attaching'];
  } catch (error) {
    console.warn("Attachment Guard: Error getting localized keywords:", error);
    return ['attachment', 'attached', 'file', 'document'];
  }
}

console.log("Attachment Guard: i18n_utils.js loaded.");
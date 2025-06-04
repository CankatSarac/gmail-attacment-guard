console.log("Attachment Guard: i18n_utils.js loading...");

/**
 * Gets a localized string from messages.json.
 * @param {string} messageKey - The key of the message in messages.json.
 * @param {string|string[]} substitutions - Optional substitutions for placeholders.
 * @returns {string} The localized string.
 */
function getLocalizedString(messageKey, substitutions) {
  try {
    if (!chrome || !chrome.i18n || !chrome.i18n.getMessage) {
      console.warn("Attachment Guard: Chrome i18n API not available for key:", messageKey);
      return messageKey;
    }
    const result = chrome.i18n.getMessage(messageKey, substitutions);
    return result || messageKey;
  } catch (error) {
    console.warn("Attachment Guard: Error getting localized string for key:", messageKey, error);
    return messageKey;
  }
}

/**
 * Alias for getLocalizedString for backward compatibility.
 * @param {string} messageName - The message key
 * @returns {string} Localized message
 */
function getLocalizedMessage(messageName) {
  return getLocalizedString(messageName);
}

/**
 * Gets the localized attachment keywords as an array.
 * @returns {string[]} An array of lowercase keywords.
 */
function getLocalizedAttachmentKeywords() {
  try {
    const keywordsString = getLocalizedString("attachmentKeywords");
    if (keywordsString && keywordsString.toLowerCase() !== "attachmentkeywords") {
      const keywords = keywordsString.toLowerCase().split(',').map(keyword => keyword.trim()).filter(Boolean);
      return keywords;
    }
    console.warn("Attachment Guard: attachmentKeywords not found or empty in messages.json. Using fallback keywords.");
    return ['attachment', 'attached', 'file', 'document', 'see attached', 'resume', 'cv', 'invoice', 'report', 'presentation', 'enclosed', 'find attached', 'attaching'];
  } catch (error) {
    console.warn("Attachment Guard: Error getting localized keywords:", error);
    return ['attachment', 'attached', 'file', 'document', 'enclosed'];
  }
}

// Expose functions globally for debugging/testing
if (typeof window !== 'undefined') {
  window.AttachmentGuardDebug = window.AttachmentGuardDebug || {};
  Object.assign(window.AttachmentGuardDebug, {
    getLocalizedString,
    getLocalizedMessage,
    getLocalizedAttachmentKeywords,
    testExtension: function() {
      console.log("=== Attachment Guard Extension Test ===");
      console.log("Chrome extension APIs available:", !!chrome);
      console.log("Chrome i18n available:", !!(chrome && chrome.i18n));
      console.log("Chrome i18n getMessage available:", !!(chrome && chrome.i18n && chrome.i18n.getMessage));
      
      if (chrome && chrome.i18n) {
        console.log("Current locale:", chrome.i18n.getUILanguage());
        console.log("Test message 'appName':", chrome.i18n.getMessage('appName'));
        console.log("Test keywords:", getLocalizedAttachmentKeywords());
      }
      console.log("==========================================");
    }
  });
}

console.log("Attachment Guard: i18n_utils.js loaded.");
console.log("Universal Attachment Guard: attachment_logic.js loading...");

/**
 * Universal Attachment Logic for Multiple Email Providers
 */

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

/**
 * Extract text content from email subject field
 * @param {Object} provider - The detected provider configuration
 * @returns {string} Subject text or empty string
 */
function getSubjectText(provider) {
  if (!provider || !provider.selectors) {
    return '';
  }

  // Try provider-specific selector first
  let subjectElement = document.querySelector(provider.selectors.subjectField);
  
  // Fall back to universal selectors if provider-specific doesn't work
  if (!subjectElement) {
    const detector = new EmailProviderDetector();
    const fallbackSelectors = detector.getFallbackSelectors('subjectField');
    subjectElement = detector.trySelectors(fallbackSelectors);
  }

  return subjectElement ? (subjectElement.value || subjectElement.textContent || '').trim() : '';
}

/**
 * Extract text content from email body field
 * @param {Object} provider - The detected provider configuration
 * @returns {string} Body text or empty string
 */
function getBodyText(provider) {
  if (!provider || !provider.selectors) {
    return '';
  }

  // Try provider-specific selector first
  let bodyElement = document.querySelector(provider.selectors.bodyField);
  
  // Fall back to universal selectors if provider-specific doesn't work
  if (!bodyElement) {
    const detector = new EmailProviderDetector();
    const fallbackSelectors = detector.getFallbackSelectors('bodyField');
    bodyElement = detector.trySelectors(fallbackSelectors);
  }

  return bodyElement ? (bodyElement.textContent || bodyElement.innerText || '').trim() : '';
}

/**
 * Check if attachments are present in the email
 * @param {Object} provider - The detected provider configuration
 * @returns {boolean} True if attachments are detected, false otherwise
 */
function hasAttachments(provider) {
  if (!provider) {
    return false;
  }

  // Check provider-specific attachment indicator
  if (provider.attachmentIndicator) {
    const attachments = document.querySelectorAll(provider.attachmentIndicator);
    if (attachments.length > 0) {
      return true;
    }
  }

  // Fall back to common attachment indicators
  const commonSelectors = [
    '[data-testid*="attachment"]',
    '.attachment',
    '[aria-label*="attachment"]',
    '[title*="attachment"]',
    '.file-attachment',
    '.attachment-item',
    '.zmAttachItem', // Zoho
    '.composer-attachments-item', // ProtonMail
    '.aZo' // Gmail fallback
  ];

  for (const selector of commonSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      return true;
    }
  }

  return false;
}

/**
 * Get the complete email text (subject + body) for keyword analysis
 * @param {Object} provider - The detected provider configuration
 * @returns {string} Combined subject and body text
 */
function getEmailText(provider) {
  const subject = getSubjectText(provider);
  const body = getBodyText(provider);
  return `${subject} ${body}`.trim();
}

/**
 * Main function to check if email mentions attachments but has none
 * @param {Object} provider - The detected provider configuration
 * @param {string[]} keywords - Array of attachment keywords to check for
 * @returns {boolean} True if warning should be shown, false otherwise
 */
function shouldShowAttachmentWarning(provider, keywords) {
  if (!provider || !keywords || keywords.length === 0) {
    return false;
  }

  const emailText = getEmailText(provider);
  const mentionsAttachment = textContainsKeywords(emailText, keywords);
  const hasFiles = hasAttachments(provider);

  // Show warning if email mentions attachments but none are attached
  return mentionsAttachment && !hasFiles;
}

/**
 * Find send button for the current provider
 * @param {Object} provider - The detected provider configuration
 * @returns {Element|null} Send button element or null if not found
 */
function findSendButton(provider) {
  if (!provider || !provider.selectors) {
    return null;
  }

  // Try provider-specific selector first
  let sendButton = document.querySelector(provider.selectors.sendButton);
  
  // Fall back to universal selectors if provider-specific doesn't work
  if (!sendButton) {
    const detector = new EmailProviderDetector();
    const fallbackSelectors = detector.getFallbackSelectors('sendButton');
    sendButton = detector.trySelectors(fallbackSelectors);
  }

  return sendButton;
}

/**
 * Check if we're currently in a compose view/dialog
 * @param {Object} provider - The detected provider configuration
 * @returns {boolean} True if in compose mode, false otherwise
 */
function isInComposeMode(provider) {
  if (!provider || !provider.selectors) {
    return false;
  }

  // Check for compose dialog or compose-specific elements
  const composeSelectors = [
    provider.selectors.composeDialog,
    provider.selectors.bodyField,
    provider.selectors.subjectField
  ].filter(Boolean);

  for (const selector of composeSelectors) {
    if (document.querySelector(selector)) {
      return true;
    }
  }

  return false;
}

console.log("Universal Attachment Guard: attachment_logic.js loaded.");
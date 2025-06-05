console.log("Attachment Guard: dom_utils.js loading...");

/**
 * Finds the closest ancestor that represents a Gmail compose area.
 * @param {HTMLElement} element - An element within the compose area (e.g., the send button).
 * @returns {HTMLElement|null} The compose area element or null if not found.
 */
function findComposeArea(element) {
  console.log("Attachment Guard: findComposeArea called with:", element);
  if (!element || typeof element.closest !== 'function') {
    console.warn("Attachment Guard (findComposeArea): Invalid element provided or 'closest' not supported", element);
    return null;
  }
  
  // Updated selector for compose area. Gmail often wraps compose in a dialog-like structure.
  const composeElement = element.closest('div[role="dialog"], form.bAs, div.AD, div.nH.nn, table[role="presentation"] > tbody > tr > td.Bu');
  console.log("Attachment Guard: findComposeArea found:", composeElement);
  return composeElement;
}

/**
 * Gets the text content from the email body within a compose area.
 * @param {HTMLElement} composeArea - The Gmail compose area element.
 * @returns {string} The text content of the email body.
 */
function getEmailBodyText(composeArea) {
  if (!composeArea || typeof composeArea.querySelector !== 'function') {
      console.warn("Attachment Guard (getEmailBodyText): Invalid composeArea provided.", composeArea);
      return '';
  }
  
  // Editable body often has aria-label="Message Body" and role="textbox"
  const bodyEditor = composeArea.querySelector('div[aria-label="Message Body"][role="textbox"][contenteditable="true"], div.Am.Al.editable[aria-label="Message Body"]');
  return bodyEditor ? bodyEditor.innerText || '' : '';
}

/**
 * Gets the text content from the email subject input within a compose area.
 * @param {HTMLElement} composeArea - The Gmail compose area element.
 * @returns {string} The text content of the email subject.
 */
function getEmailSubjectText(composeArea) {
  if (!composeArea || typeof composeArea.querySelector !== 'function') {
      console.warn("Attachment Guard (getEmailSubjectText): Invalid composeArea provided.", composeArea);
      return '';
  }
  
  const subjectInput = composeArea.querySelector('input[name="subjectbox"], input[aria-label="Subject"]');
  return subjectInput ? subjectInput.value || '' : '';
}

/**
 * Checks if there are any visible attachment indicators in the compose area.
 * @param {HTMLElement} composeArea - The Gmail compose area element.
 * @returns {boolean} True if attachments seem to be present, false otherwise.
 */
function hasActualAttachments(composeArea) {
  if (!composeArea || typeof composeArea.querySelectorAll !== 'function') {
      console.warn("Attachment Guard (hasActualAttachments): Invalid composeArea provided.", composeArea);
      return false;
  }
  
  // Attachment "chips" often have class 'dL', 'dO', or 'vI' or specific aria-labels.
  const attachmentChips = composeArea.querySelectorAll('div.dL, div.dO, div.vI, div[aria-label*="Attachment"], div[aria-label*="Remove attachment"]');
  return attachmentChips && attachmentChips.length > 0;
}

console.log("Attachment Guard: dom_utils.js loaded and functions defined (findComposeArea type: " + typeof findComposeArea + ").");
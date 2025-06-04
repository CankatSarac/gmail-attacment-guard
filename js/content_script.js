// js/content_script.js

console.log("Attachment Guard: content_script.js loading...");

// State to prevent multiple warnings or re-processing for the same send attempt
let isProcessingSend = false;
let lastBlockedSendButton = null;
let pageInteractionCount = 0;

/**
 * The main handler for when a "Send" button is clicked.
 * @param {Event} originalEvent - The original click event, used for preventDefault.
 * @param {HTMLElement} actualSendButton - The identified send button element.
 */
function handleSendClick(originalEvent, actualSendButton) {
  console.log("Attachment Guard: handleSendClick triggered for button:", actualSendButton);

  if (!actualSendButton) {
    console.warn("Attachment Guard (handleSendClick): actualSendButton is null.");
    return;
  }

  if (isProcessingSend && actualSendButton === lastBlockedSendButton) {
    console.log("Attachment Guard: Allowing send (isProcessingSend true for the same button).");
    isProcessingSend = false; // Reset for the next distinct send operation
    lastBlockedSendButton = null;
    return; // Allow default action (which is the programmatic click from "Send Anyway")
  }

  // Ensure findComposeArea is available (defensive, root cause should be fixed)
  if (typeof findComposeArea !== 'function') {
    console.error("Attachment Guard: findComposeArea is NOT defined! Critical error. Check script loading order and syntax errors in dom_utils.js or preceding scripts.");
    alert("Gmail Attachment Guard Error: A critical component (findComposeArea) is missing. Please try reloading the page or the extension. If the problem persists, check the browser console for errors.");
    return;
  }

  const composeArea = findComposeArea(actualSendButton);
  if (!composeArea) {
    console.warn("Attachment Guard: Could not find compose area for button:", actualSendButton, ". Allowing send by default.");
    return;
  }

  const bodyText = getEmailBodyText(composeArea);
  const subjectText = getEmailSubjectText(composeArea);
  const fullEmailText = `${subjectText} ${bodyText}`;
  const keywords = getLocalizedAttachmentKeywords(); // From i18n_utils.js
  const mentionsAttachment = textContainsKeywords(fullEmailText, keywords); // From attachment_logic.js
  const hasAttachments = hasActualAttachments(composeArea);

  console.log("Attachment Guard: Mentions attachment?", mentionsAttachment, "Has attachments?", hasAttachments);

  if (mentionsAttachment && !hasAttachments) {
    originalEvent.preventDefault();
    originalEvent.stopPropagation();
    originalEvent.stopImmediatePropagation();

    console.log("Attachment Guard: Warning! Mentioned attachment, but none found.");
    disableButton(actualSendButton); // From ui_handlers.js
    lastBlockedSendButton = actualSendButton;

    showConfirmationDialog( // From ui_handlers.js
      actualSendButton,
      () => { // onSendAnyway
        console.log("Attachment Guard: User chose 'Send Anyway'.");
        isProcessingSend = true;
        enableButton(actualSendButton);
        actualSendButton.click(); // Programmatically click the original send button
      },
      () => { // onCancel/Add Attachment
        console.log("Attachment Guard: User chose to cancel or add attachment.");
        enableButton(actualSendButton);
        isProcessingSend = false;
        lastBlockedSendButton = null;
      }
    );
    return; // Event handled
  }

  console.log("Attachment Guard: Conditions not met for warning, or attachments present. Allowing send.");
  enableButton(actualSendButton); // Ensure button is enabled if we didn't block it
  isProcessingSend = false;
  lastBlockedSendButton = null;
}

function initializeAttachmentListener() {
  document.body.addEventListener('click', function(event) {
    const sendButtonCandidate = event.target.closest('div[role="button"][data-tooltip*="Send"]');

    if (sendButtonCandidate) {
      const tooltipText = sendButtonCandidate.getAttribute('data-tooltip')?.toLowerCase() || "";
      const parentMenu = sendButtonCandidate.closest('div[role="menu"]');

      // Check if it's a main send button (not "Schedule send" and not in a menu)
      if (tooltipText.startsWith('send') && !parentMenu) {
        // If the button was disabled by *us* and this click is NOT the programmatic "Send Anyway" click
        if (sendButtonCandidate.disabled && sendButtonCandidate === lastBlockedSendButton && !isProcessingSend) {
          console.log("Attachment Guard: Clicked on a button previously disabled by extension (and not via Send Anyway). Preventing default.");
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return;
        }
        handleSendClick(event, sendButtonCandidate);
      }
    }
  }, true); // Use capture phase

  console.log("Gmail Attachment Guard: Listener initialized.");
}

// Start the extension
function main() {
  initializeAttachmentListener();
  console.log("Attachment Guard: Main execution started.");
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  main();
} else {
  document.addEventListener("DOMContentLoaded", main);
}

console.log("Attachment Guard: content_script.js loaded and awaiting DOM ready or already complete.");

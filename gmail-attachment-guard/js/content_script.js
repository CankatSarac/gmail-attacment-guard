// js/content_script.js

// State to prevent multiple warnings or re-processing for the same send attempt
let isProcessingSend = false;
let lastBlockedSendButton = null; // Store the send button that was blocked

/**
 * The main handler for when a "Send" button is clicked.
 * @param {Event} event - The click event.
 */
function handleSendClick(event) {
  if (isProcessingSend && event.target === lastBlockedSendButton) {
    // User clicked "Send Anyway" from our dialog, or we are forcing send.
    // Allow the original action to proceed.
    console.log("Attachment Guard: Allowing send.");
    isProcessingSend = false; // Reset for next time
    lastBlockedSendButton = null;
    enableButton(event.target); // Ensure it's enabled
    return; // Don't preventDefault
  }

  const sendButton = event.target.closest('div[role="button"][data-tooltip*="Send"]'); // Adjust selector as needed
  if (!sendButton) return;

  const composeArea = findComposeArea(sendButton);
  if (!composeArea) {
    console.warn("Attachment Guard: Could not find compose area.");
    return;
  }

  const bodyText = getEmailBodyText(composeArea);
  const subjectText = getEmailSubjectText(composeArea);
  const fullEmailText = `${subjectText} ${bodyText}`;
  const keywords = getLocalizedAttachmentKeywords();

  const mentionsAttachment = textContainsKeywords(fullEmailText, keywords);
  const hasAttachments = hasActualAttachments(composeArea);

  console.log("Attachment Guard: Mentions attachment?", mentionsAttachment);
  console.log("Attachment Guard: Has attachments?", hasAttachments);

  if (mentionsAttachment && !hasAttachments) {
    event.preventDefault(); // Stop the email from sending immediately
    event.stopPropagation(); // Stop other listeners
    event.stopImmediatePropagation(); // Stop other listeners on this element

    console.log("Attachment Guard: Warning! Mentioned attachment, but none found.");
    disableButton(sendButton); // Visually disable the button
    lastBlockedSendButton = sendButton; // Remember which button was blocked

    showConfirmationDialog(
      sendButton,
      () => { // onSendAnyway
        isProcessingSend = true; // Set flag to allow next click
        enableButton(sendButton);
        sendButton.click(); // Programmatically click the original send button
        // isProcessingSend will be reset at the start of the next handleSendClick
      },
      () => { // onCancel/Add Attachment
        console.log("Attachment Guard: User chose to cancel or add attachment.");
        enableButton(sendButton); // Re-enable button so user can interact
        isProcessingSend = false; // Reset
        lastBlockedSendButton = null;
        // User should manually add attachment then click send again.
        // Or, you could try to focus the attachment input if you can find it.
      }
    );
    return false; // Important for some event setups
  }

  // If no warning, or warning conditions not met, let it send
  console.log("Attachment Guard: Conditions not met for warning, or attachments present. Allowing send.");
  isProcessingSend = false; // Reset
  lastBlockedSendButton = null;
  enableButton(sendButton); // Ensure it's enabled
}


/**
 * Attaches the send click listener to the document.
 * Uses event delegation to catch clicks on send buttons that might be added dynamically.
 */
function initializeAttachmentListener() {
  // Listen on a stable parent, or document, for clicks.
  // Gmail dynamically loads content, so send buttons might not exist on page load.
  // We are looking for a click on an element that IS a send button.
  // The selector for send buttons is tricky. Gmail uses dynamic classes.
  // Using a more generic selector and checking attributes is safer.
  // Example: 'div[role="button"]' that has a child/descendant with "Send" text or specific aria-label.
  document.body.addEventListener('click', function(event) {
    // Find the actual button element, which might be a parent of the clicked target
    const sendButtonCandidate = event.target.closest('div[data-tooltip*="Send"][role="button"]');
    // For scheduled send, the tooltip might be "Schedule send"
    const scheduleSendButtonCandidate = event.target.closest('div[data-tooltip*="Schedule send"][role="button"]');

    // The main send button (not part of "Schedule send" dropdown) usually has specific data attributes
    // This is highly dependent on Gmail's specific implementation
    // A common pattern is a div with role="button" and a specific data-tooltip like "Send ?(Ctrl-Enter)?"
    if (sendButtonCandidate && sendButtonCandidate.getAttribute('data-tooltip') && sendButtonCandidate.getAttribute('data-tooltip').toLowerCase().startsWith('send')) {
        // Make sure it's not a "schedule send" dropdown button that also says "Send"
        const parentMenu = sendButtonCandidate.closest('div[role="menu"]');
        if (!parentMenu) { // If not inside a menu, it's likely the main send button
             handleSendClick(event);
        }
    } else if (scheduleSendButtonCandidate) {
        // If it's a schedule send button, it might be the final action
        // This logic can get complex if you want to distinguish between opening the schedule dialog vs. confirming a schedule.
        // For now, let's assume any "Schedule send" button click should be checked.
        // To be more precise, you'd check if it's *confirming* the schedule.
        // For simplicity, this example might trigger for just opening the schedule options.
        // A more robust solution would observe the DOM for the *final* schedule confirmation.
        // For now, we'll just pass it to handleSendClick, which checks compose area.
        // handleSendClick(event); // Potentially enable this if you want to check scheduled sends too
    }
  }, true); // Use capture phase to intercept before Gmail's own handlers

  console.log("Gmail Attachment Guard: Listener initialized.");

  // Monitor attachment changes to re-enable send button if user adds one after a warning
  // This is more complex and involves MutationObserver on the attachment area.
  // For simplicity here, we'll rely on the user clicking "Send" again,
  // and our logic re-evaluates. A more advanced version would do this:
  // observeAttachmentChanges();
}

// Start the extension
if (document.readyState === "complete" || document.readyState === "interactive") {
  initializeAttachmentListener();
} else {
  document.addEventListener("DOMContentLoaded", initializeAttachmentListener);
}
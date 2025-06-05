// Universal Attachment Guard - Multi-provider Content Script

console.log("Universal Attachment Guard: content_script.js loading...");

// Global state management
let isProcessingSend = false;
let lastBlockedSendButton = null;
let currentProvider = null;
let providerDetector = null;

/**
 * Initialize provider detection
 */
function initializeProvider() {
  try {
    providerDetector = new EmailProviderDetector();
    currentProvider = providerDetector.detectProvider();
    
    if (currentProvider) {
      console.log(`Universal Attachment Guard: Detected provider: ${currentProvider.name}`);
      return true;
    } else {
      console.warn("Universal Attachment Guard: No supported email provider detected on this page");
      return false;
    }
  } catch (error) {
    console.error("Universal Attachment Guard: Error initializing provider:", error);
    return false;
  }
}

/**
 * The main handler for when a "Send" button is clicked.
 * @param {Event} originalEvent - The original click event, used for preventDefault.
 * @param {HTMLElement} actualSendButton - The identified send button element.
 */
function handleSendClick(originalEvent, actualSendButton) {
  console.log("Universal Attachment Guard: handleSendClick triggered for button:", actualSendButton);

  if (!actualSendButton || !currentProvider) {
    console.warn("Universal Attachment Guard: Missing send button or provider configuration");
    return;
  }

  // Allow if this is the programmatic "Send Anyway" click
  if (isProcessingSend && actualSendButton === lastBlockedSendButton) {
    console.log("Universal Attachment Guard: Allowing send (Send Anyway clicked)");
    isProcessingSend = false;
    lastBlockedSendButton = null;
    return;
  }

  // Check if we're in compose mode
  if (!isInComposeMode(currentProvider)) {
    console.log("Universal Attachment Guard: Not in compose mode, allowing send");
    return;
  }

  try {
    const keywords = getLocalizedAttachmentKeywords(); // From i18n_utils.js
    const shouldWarn = shouldShowAttachmentWarning(currentProvider, keywords); // From attachment_logic.js

    console.log("Universal Attachment Guard: Should show warning?", shouldWarn);

    if (shouldWarn) {
      // Prevent the default send action
      originalEvent.preventDefault();
      originalEvent.stopPropagation();
      originalEvent.stopImmediatePropagation();

      console.log("Universal Attachment Guard: Blocking send - attachment mentioned but not found");
      
      // Disable the send button temporarily
      disableButton(actualSendButton);
      lastBlockedSendButton = actualSendButton;

      // Show confirmation dialog
      showConfirmationDialog(
        actualSendButton,
        () => { // onSendAnyway
          console.log("Universal Attachment Guard: User chose 'Send Anyway'");
          isProcessingSend = true;
          enableButton(actualSendButton);
          actualSendButton.click(); // Programmatically trigger send
        },
        () => { // onCancel/Add Attachment
          console.log("Universal Attachment Guard: User chose to cancel or add attachment");
          enableButton(actualSendButton);
          isProcessingSend = false;
          lastBlockedSendButton = null;
        }
      );
      return;
    }

    console.log("Universal Attachment Guard: No warning needed, allowing send");
    enableButton(actualSendButton);
    isProcessingSend = false;
    lastBlockedSendButton = null;

  } catch (error) {
    console.error("Universal Attachment Guard: Error in handleSendClick:", error);
    // On error, allow send to proceed
    enableButton(actualSendButton);
  }
}

/**
 * Check if a clicked element is a send button for the current provider
 * @param {HTMLElement} element - The clicked element
 * @returns {boolean} True if this is a send button
 */
function isSendButton(element) {
  if (!currentProvider || !element) {
    return false;
  }

  // Try provider-specific send button identification
  if (currentProvider.selectors && currentProvider.selectors.sendButton) {
    if (element.matches(currentProvider.selectors.sendButton)) {
      return true;
    }
  }

  // Fallback to universal send button detection
  const fallbackSelectors = providerDetector.getFallbackSelectors('sendButton');
  for (const selector of fallbackSelectors) {
    if (element.matches(selector)) {
      return true;
    }
  }

  // Check for common send button patterns
  const buttonText = (element.textContent || element.value || '').toLowerCase();
  const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase();
  const title = (element.getAttribute('title') || '').toLowerCase();
  const tooltip = (element.getAttribute('data-tooltip') || '').toLowerCase();

  const sendPatterns = ['send', 'enviar', 'küldés', 'gönder', 'skicka'];
  const allText = `${buttonText} ${ariaLabel} ${title} ${tooltip}`;

  return sendPatterns.some(pattern => allText.includes(pattern));
}

/**
 * Initialize click listener for send buttons
 */
function initializeAttachmentListener() {
  if (!currentProvider) {
    console.warn("Universal Attachment Guard: No provider detected, cannot initialize listener");
    return;
  }

  document.body.addEventListener('click', function(event) {
    try {
      const clickedElement = event.target;
      
      // Check if this is a send button or contains a send button
      let sendButton = null;
      
      if (isSendButton(clickedElement)) {
        sendButton = clickedElement;
      } else {
        // Check if clicked element is within a send button
        const parentButton = clickedElement.closest('button, [role="button"], input[type="submit"]');
        if (parentButton && isSendButton(parentButton)) {
          sendButton = parentButton;
        }
      }

      if (sendButton) {
        // Check if button was previously disabled by us
        if (sendButton.disabled && sendButton === lastBlockedSendButton && !isProcessingSend) {
          console.log("Universal Attachment Guard: Clicked on disabled send button, preventing action");
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return;
        }

        handleSendClick(event, sendButton);
      }
    } catch (error) {
      console.error("Universal Attachment Guard: Error in click listener:", error);
    }
  }, true); // Use capture phase to intercept early

  console.log(`Universal Attachment Guard: Click listener initialized for ${currentProvider.name}`);
}

/**
 * Wait for page to be ready and provider to be available
 */
async function waitForProvider(maxAttempts = 10, delay = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    if (initializeProvider()) {
      return true;
    }
    
    console.log(`Universal Attachment Guard: Provider not detected, attempt ${i + 1}/${maxAttempts}`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  return false;
}

/**
 * Main initialization function
 */
async function main() {
  console.log("Universal Attachment Guard: Starting initialization...");
  
  // Wait for provider detection
  const providerDetected = await waitForProvider();
  
  if (!providerDetected) {
    console.log("Universal Attachment Guard: No supported email provider found, extension will not activate");
    return;
  }

  // Initialize attachment checking
  initializeAttachmentListener();
  
  console.log("Universal Attachment Guard: Successfully initialized");
}

// Start the extension when DOM is ready
if (document.readyState === "complete" || document.readyState === "interactive") {
  main();
} else {
  document.addEventListener("DOMContentLoaded", main);
}

console.log("Universal Attachment Guard: content_script.js loaded and ready");

console.log("Attachment Guard: ui_handlers.js loading...");

let currentWarningDialog = null; // Keep track of the current dialog
let buyMeCoffeePopup = null; // Keep track of the coffee popup

/**
 * Disables a button.
 * @param {HTMLElement} button - The button element to disable.
 */
function disableButton(button) {
  if (button) {
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
  }
}

/**
 * Enables a button.
 * @param {HTMLElement} button - The button element to enable.
 */
function enableButton(button) {
  if (button) {
    button.disabled = false;
    button.removeAttribute('aria-disabled');
  }
}

/**
 * Shows a custom confirmation dialog near the send button.
 * @param {HTMLElement} sendButton - The send button that was clicked.
 * @param {Function} onSendAnyway - Callback if user chooses to send.
 * @param {Function} onCancel - Callback if user chooses to cancel/add attachment.
 */
function showConfirmationDialog(sendButton, onSendAnyway, onCancel) {
  if (currentWarningDialog) {
    currentWarningDialog.remove(); // Remove any existing dialog
  }

  // Hide buy me coffee popup when attachment dialog appears
  hideBuyMeCoffeePopup();

  // Create overlay for modal effect
  const overlay = document.createElement('div');
  overlay.className = 'gag-dialog-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const dialog = document.createElement('div');
  dialog.id = 'gmail-attachment-guard-dialog';
  dialog.className = 'gag-dialog';
  dialog.setAttribute('role', 'alertdialog');
  dialog.setAttribute('aria-labelledby', 'gag-dialog-title');
  dialog.setAttribute('aria-describedby', 'gag-dialog-message');

  const dialogContent = document.createElement('div');
  dialogContent.className = 'gag-dialog-content';

  const title = document.createElement('h2');
  title.id = 'gag-dialog-title';
  title.className = 'gag-dialog-title';
  title.textContent = getLocalizedMessage('attachmentMissingTitle') || 'Attachment Missing?';

  const message = document.createElement('p');
  message.id = 'gag-dialog-message';
  message.className = 'gag-dialog-message';
  message.textContent = getLocalizedMessage('warningMessageText') || 'You mentioned an attachment but haven\'t added one. Send anyway?';

  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'gag-dialog-actions';

  const addAttachmentBtn = document.createElement('button');
  addAttachmentBtn.className = 'gag-button gag-button-primary';
  addAttachmentBtn.textContent = getLocalizedMessage('addAttachmentButtonText') || 'Add Attachment';
  addAttachmentBtn.onclick = (e) => {
    e.preventDefault();
    onCancel();
    overlay.remove();
    currentWarningDialog = null;
  };

  const sendAnywayBtn = document.createElement('button');
  sendAnywayBtn.className = 'gag-button gag-button-secondary';
  sendAnywayBtn.textContent = getLocalizedMessage('sendAnywayButtonText') || 'Send Anyway';
  sendAnywayBtn.onclick = (e) => {
    e.preventDefault();
    onSendAnyway();
    overlay.remove();
    currentWarningDialog = null;
  };

  // Close dialog when clicking overlay
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      onCancel();
      overlay.remove();
      currentWarningDialog = null;
    }
  };

  // Handle escape key
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
      overlay.remove();
      currentWarningDialog = null;
      document.removeEventListener('keydown', handleKeyDown);
    }
  };
  document.addEventListener('keydown', handleKeyDown);

  // Assemble dialog in logical order
  buttonContainer.appendChild(addAttachmentBtn);
  buttonContainer.appendChild(sendAnywayBtn);

  dialogContent.appendChild(title);
  dialogContent.appendChild(message);
  dialogContent.appendChild(buttonContainer);
  dialog.appendChild(dialogContent);
  overlay.appendChild(dialog);

  document.body.appendChild(overlay);
  currentWarningDialog = overlay;

  // Focus the primary action button
  setTimeout(() => addAttachmentBtn.focus(), 100);
}

/**
 * Shows the buy me coffee popup if conditions are met
 */
function maybeTriggerCoffeePopup() {
  // Show coffee popup randomly (30% chance) or after certain usage patterns
  const showChance = Math.random() < 0.3;
  const lastShown = localStorage.getItem('gag-coffee-last-shown');
  const now = Date.now();
  const daysSinceLastShown = lastShown ? (now - parseInt(lastShown)) / (1000 * 60 * 60 * 24) : 999;
  
  if (showChance && daysSinceLastShown > 3) {
    setTimeout(() => {
      showBuyMeCoffeePopup();
      localStorage.setItem('gag-coffee-last-shown', now.toString());
    }, 2000); // Show after 2 seconds
  }
}

/**
 * Shows a "Buy me a coffee" popup in the top-right corner
 */
function showBuyMeCoffeePopup() {
  // Don't show if already exists
  if (buyMeCoffeePopup) {
    return;
  }

  const popup = document.createElement('div');
  popup.id = 'gag-coffee-popup';
  popup.className = 'gag-coffee-popup';
  popup.setAttribute('role', 'complementary');
  popup.setAttribute('aria-label', 'Support the developer');

  const content = document.createElement('div');
  content.className = 'gag-coffee-content';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'gag-coffee-close';
  closeBtn.innerHTML = '×';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.onclick = () => hideBuyMeCoffeePopup();

  const icon = document.createElement('div');
  icon.className = 'gag-coffee-icon';
  icon.innerHTML = '☕';

  const text = document.createElement('div');
  text.className = 'gag-coffee-text';
  text.innerHTML = `
    <div class="gag-coffee-title">Enjoying Gmail Attachment Guard?</div>
    <div class="gag-coffee-subtitle">Buy me a coffee!</div>
  `;
  const button = document.createElement('a');
  button.href = 'https://buymeacoffee.com/yourhandle'; // Replace with your actual Buy Me a Coffee link
  button.target = '_blank';
  button.className = 'gag-coffee-button';
  button.textContent = '☕ Buy Coffee';
  button.onclick = () => {
    // Track click and hide popup after user clicks
    setTimeout(() => hideBuyMeCoffeePopup(), 500);
  };

  content.appendChild(closeBtn);
  content.appendChild(icon);
  content.appendChild(text);
  content.appendChild(button);
  popup.appendChild(content);

  document.body.appendChild(popup);
  buyMeCoffeePopup = popup;

  // Auto-hide after 10 seconds if not interacted with
  setTimeout(() => {
    if (buyMeCoffeePopup === popup) {
      hideBuyMeCoffeePopup();
    }
  }, 10000);
}

/**
 * Hides the "Buy me a coffee" popup
 */
function hideBuyMeCoffeePopup() {
  if (buyMeCoffeePopup) {
    buyMeCoffeePopup.remove();
    buyMeCoffeePopup = null;
  }
}

console.log("Attachment Guard: ui_handlers.js loaded.");
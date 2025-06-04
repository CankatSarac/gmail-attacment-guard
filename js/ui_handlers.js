console.log("Attachment Guard: ui_handlers.js loading...");

let currentWarningDialog = null; // Keep track of the current dialog

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

  // Add Buy Me Coffee link
  const coffeeContainer = document.createElement('div');
  coffeeContainer.className = 'gag-coffee-container';
  coffeeContainer.innerHTML = `
    <p style="font-size: 12px; color: #666; text-align: center; margin: 10px 0;">
      ☕ Enjoying this extension? 
      <a href="${getLocalizedMessage('buyMeCoffee') || 'https://coff.ee/cankatsarac'}" 
         target="_blank" 
         style="color: #1a73e8; text-decoration: none; font-weight: 500;">
        ${getLocalizedMessage('coffeePopupButton') || 'Buy Me a Coffee'}
      </a>
    </p>
  `;

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
  dialogContent.appendChild(coffeeContainer);
  dialogContent.appendChild(buttonContainer);
  dialog.appendChild(dialogContent);
  overlay.appendChild(dialog);

  document.body.appendChild(overlay);
  currentWarningDialog = overlay;

  // Focus the primary action button
  setTimeout(() => addAttachmentBtn.focus(), 100);
}

// Expose functions globally for debugging/testing
if (typeof window !== 'undefined') {
  window.showConfirmationDialog = showConfirmationDialog;
  
  // Enhanced debug object
  if (!window.AttachmentGuardDebug) window.AttachmentGuardDebug = {};
  Object.assign(window.AttachmentGuardDebug, {
    showConfirmationDialog,
    getCurrentDialog: () => currentWarningDialog
  });
}

console.log("Attachment Guard: ui_handlers.js loaded.");
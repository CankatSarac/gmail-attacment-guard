// js/ui_handlers.js

let currentWarningDialog = null; // Keep track of the current dialog

/**
 * Disables a button.
 * @param {HTMLElement} button - The button element to disable.
 */
function disableButton(button) {
  if (button) {
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
    // Optionally add a class for styling
    // button.classList.add('disabled-by-extension');
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
    // button.classList.remove('disabled-by-extension');
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

  const dialog = document.createElement('div');
  dialog.className = 'gmail-attachment-guard-dialog'; // For CSS styling
  dialog.style.position = 'absolute';
  dialog.style.backgroundColor = 'white';
  dialog.style.border = '1px solid #ccc';
  dialog.style.padding = '15px';
  dialog.style.zIndex = '99999'; // High z-index
  dialog.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  dialog.setAttribute('role', 'alertdialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'gag-dialog-title');


  // Position near the send button
  const rect = sendButton.getBoundingClientRect();
  dialog.style.top = `${rect.bottom + window.scrollY + 5}px`;
  dialog.style.left = `${rect.left + window.scrollX}px`;


  const message = document.createElement('p');
  message.id = 'gag-dialog-title';
  message.textContent = getLocalizedString("warningMessageText");
  message.style.margin = '0 0 10px 0';

  const sendAnywayBtn = document.createElement('button');
  sendAnywayBtn.textContent = getLocalizedString("sendAnywayButtonText");
  sendAnywayBtn.style.marginRight = '10px';
  sendAnywayBtn.onclick = () => {
    onSendAnyway();
    dialog.remove();
    currentWarningDialog = null;
  };

  const addAttachmentBtn = document.createElement('button');
  addAttachmentBtn.textContent = getLocalizedString("addAttachmentButtonText");
  addAttachmentBtn.onclick = () => {
    onCancel(); // The original send is already blocked
    dialog.remove();
    currentWarningDialog = null;
  };

  dialog.appendChild(message);
  dialog.appendChild(sendAnywayBtn);
  dialog.appendChild(addAttachmentBtn);

  document.body.appendChild(dialog);
  currentWarningDialog = dialog;
  sendAnywayBtn.focus(); // Focus the first button for accessibility
}
// This file contains the content script that interacts with the Gmail DOM. 
// It detects attachment intent and manages the reminder logic based on user actions.

const attachmentKeywords = [
    "I've attached",
    "see the file",
    "enclosed",
    "please find attached",
    "attached",
];

let sendBlocked = false;

const checkForAttachments = () => {
    const emailBody = document.querySelector('div[aria-label="Message Body"]');
    const attachmentsDiv = document.querySelector('div[aria-label="Attachments"]');

    const messageText = emailBody?.innerText?.toLowerCase();
    if (messageText) {
        const hasAttachmentKeywords = attachmentKeywords.some(keyword => messageText.includes(keyword.toLowerCase()));

        if (hasAttachmentKeywords && !attachmentsDiv) {
            sendBlocked = true;
            showReminder();
        }
    }
};

const showReminder = () => {
    const reminderModal = document.createElement('div');
    reminderModal.style.position = 'fixed';
    reminderModal.style.top = '50%';
    reminderModal.style.left = '50%';
    reminderModal.style.transform = 'translate(-50%, -50%)';
    reminderModal.style.backgroundColor = 'white';
    reminderModal.style.border = '1px solid #ccc';
    reminderModal.style.padding = '20px';
    reminderModal.style.zIndex = '1000';

    reminderModal.innerHTML = `
        <h2>Attachment Reminder</h2>
        <p>It looks like you mentioned an attachment, but you haven't attached any files. Would you like to attach a file?</p>
        <button id="attach-file">Attach File</button>
        <button id="send-anyway">Send Anyway</button>
    `;

    document.body.appendChild(reminderModal);

    document.getElementById('attach-file').onclick = () => {
        reminderModal.remove();
        sendBlocked = false;
        // Logic to focus on the attachment area can be added here
    };

    document.getElementById('send-anyway').onclick = () => {
        reminderModal.remove();
        sendBlocked = false;
        // Logic to allow sending the email can be added here
    };
};

document.addEventListener('click', (event) => {
    if (event.target.matches('button[aria-label="Send ‪(Ctrl-Enter)‬"]')) {
        if (sendBlocked) {
            event.preventDefault();
        } else {
            checkForAttachments();
        }
    }
});
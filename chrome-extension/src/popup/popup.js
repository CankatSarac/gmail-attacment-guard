// This file contains the JavaScript logic for the popup, handling user interactions and displaying reminders or suggestions.

document.addEventListener('DOMContentLoaded', function () {
    const sendButton = document.getElementById('send-button');
    const reminderMessage = document.getElementById('reminder-message');

    sendButton.addEventListener('click', function () {
        // Logic to check for attachments and display reminders
        checkForAttachments();
    });

    function checkForAttachments() {
        // Placeholder for attachment checking logic
        const hasAttachment = false; // This should be replaced with actual logic

        if (!hasAttachment) {
            showReminder();
        } else {
            // Proceed with sending the email
            sendEmail();
        }
    }

    function showReminder() {
        reminderMessage.textContent = "It looks like you forgot to attach a file. Would you like to attach one?";
        reminderMessage.style.display = 'block';
    }

    function sendEmail() {
        // Logic to send the email
        console.log("Email sent!");
    }
});
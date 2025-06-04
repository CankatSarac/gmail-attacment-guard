// This file contains the JavaScript logic for the options page, managing user preferences and saving them to chrome.storage.local.

document.addEventListener('DOMContentLoaded', function() {
    const blockSendToggle = document.getElementById('block-send-toggle');
    const dailyReminderCount = document.getElementById('daily-reminder-count');

    // Load saved settings from chrome.storage.local
    chrome.storage.local.get(['blockSend', 'dailyReminderCount'], function(data) {
        blockSendToggle.checked = data.blockSend || false;
        dailyReminderCount.value = data.dailyReminderCount || 5; // Default to 5
    });

    // Save settings when toggled or changed
    blockSendToggle.addEventListener('change', function() {
        chrome.storage.local.set({ blockSend: blockSendToggle.checked });
    });

    dailyReminderCount.addEventListener('change', function() {
        const count = parseInt(dailyReminderCount.value, 10);
        if (!isNaN(count) && count >= 0) {
            chrome.storage.local.set({ dailyReminderCount: count });
        } else {
            dailyReminderCount.value = 5; // Reset to default if invalid
        }
    });
});
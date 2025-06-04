# Auto Attachment Reminder Chrome Extension

## Overview

The Auto Attachment Reminder Chrome Extension enhances your Gmail experience by detecting attachment intent and providing timely reminders to ensure you never forget to attach files. 

## Features

- **Attachment Intent Detection**: Utilizes natural language processing to identify phrases indicating an attachment.
- **Timely Nudges**: Prompts users with reminders if they attempt to send an email without an attachment.
- **Smart Suggestions (Premium)**: Offers quick access to recently used files or AI-recommended files from your local disk or Google Drive.

## Local-First, Privacy-First Design

- **Processing**: All processing occurs within your browser; no data leaves your machine.
- **Storage**: Minimal settings are stored locally using `chrome.storage.local`.
- **Connectivity**: The extension operates entirely offline while drafting or sending emails.

## Installation

1. Download the extension from the Chrome Web Store.
2. Grant access to the Gmail tab.
3. Complete a brief guided tour to set your preferences.

## Usage

- Start composing emails in Gmail.
- The extension will automatically detect attachment intent and provide reminders as needed.

## Premium Subscription

- Upgrade to unlock unlimited reminders, smart file suggestions, and priority support.
- Payment is processed through Stripe, and a JWT is issued for subscription verification.

## FAQ

- **Will this slow Gmail down?**  
  No, the model runs in a Web Worker with minimal CPU usage.

- **Does it work with other webmail clients?**  
  Currently, it only supports Gmail, but support for other clients is planned.

- **What happens if my subscription lapses while offline?**  
  The extension will revert to free-tier limits until you renew your subscription.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.
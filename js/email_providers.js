/**
 * Email Provider Detection and Configuration
 * Universal Attachment Guard - Multi-provider support
 */

class EmailProviderDetector {
  constructor() {
    this.providers = {
      gmail: {
        name: 'Gmail',
        domain: 'mail.google.com',
        selectors: {
          composeButton: '[data-tooltip="Compose"]',
          sendButton: '[data-tooltip="Send ⌘+Enter"]',
          attachButton: '[data-tooltip="Attach files"]',
          subjectField: 'input[name="subjectbox"]',
          bodyField: '[contenteditable="true"][role="textbox"]',
          attachmentArea: '[data-tooltip*="attachment"]',
          composeDialog: '[role="dialog"]'
        },
        attachmentIndicator: '.aZo'
      },
      outlook: {
        name: 'Outlook',
        domain: 'outlook.live.com',
        selectors: {
          composeButton: '[data-app-id="Mail"] button[aria-label*="New"]',
          sendButton: 'button[aria-label*="Send"]',
          attachButton: 'button[aria-label*="Attach"]',
          subjectField: 'input[aria-label*="Subject"]',
          bodyField: '[contenteditable="true"][role="textbox"]',
          attachmentArea: '[data-app-id="AttachmentWell"]',
          composeDialog: '[role="dialog"]'
        },
        attachmentIndicator: '[data-app-id="AttachmentWell"] .attachment'
      },
      yahooMail: {
        name: 'Yahoo Mail',
        domain: 'mail.yahoo.com',
        selectors: {
          composeButton: 'a[data-test-id="compose-button"]',
          sendButton: 'button[data-test-id="compose-send-button"]',
          attachButton: 'button[data-test-id="attachment-button"]',
          subjectField: 'input[data-test-id="compose-subject"]',
          bodyField: '[contenteditable="true"][data-test-id="compose-message-body"]',
          attachmentArea: '[data-test-id="attachment-container"]',
          composeDialog: '[data-test-id="compose-dialog"]'
        },
        attachmentIndicator: '[data-test-id="attachment-item"]'
      },
      protonmail: {
        name: 'ProtonMail',
        domain: 'mail.proton.me',
        selectors: {
          composeButton: 'button[title*="Compose"]',
          sendButton: 'button[type="submit"][data-testid*="send"]',
          attachButton: 'button[title*="Attach"]',
          subjectField: 'input[placeholder*="Subject"]',
          bodyField: '[contenteditable="true"]',
          attachmentArea: '.composer-attachments',
          composeDialog: '.composer'
        },
        attachmentIndicator: '.composer-attachments-item'
      },
      zohoMail: {
        name: 'Zoho Mail',
        domain: 'mail.zoho.com',
        selectors: {
          composeButton: 'span[title="Compose"]',
          sendButton: 'span[title="Send"]',
          attachButton: 'span[title*="Attach"]',
          subjectField: 'input[id*="subject"]',
          bodyField: '[contenteditable="true"]',
          attachmentArea: '.zmAttachRow',
          composeDialog: '.zmComposeView'
        },
        attachmentIndicator: '.zmAttachItem'
      },
      icloudMail: {
        name: 'iCloud Mail',
        domain: 'www.icloud.com',
        selectors: {
          composeButton: 'button[aria-label*="Compose"]',
          sendButton: 'button[aria-label*="Send"]',
          attachButton: 'button[aria-label*="Attach"]',
          subjectField: 'input[aria-label*="Subject"]',
          bodyField: '[contenteditable="true"]',
          attachmentArea: '.attachment-container',
          composeDialog: '.compose-window'
        },
        attachmentIndicator: '.attachment-item'
      },
      aolMail: {
        name: 'AOL Mail',
        domain: 'mail.aol.com',
        selectors: {
          composeButton: 'button[data-test-id*="compose"]',
          sendButton: 'button[data-test-id*="send"]',
          attachButton: 'button[data-test-id*="attach"]',
          subjectField: 'input[data-test-id*="subject"]',
          bodyField: '[contenteditable="true"]',
          attachmentArea: '.attachment-list',
          composeDialog: '.compose-container'
        },
        attachmentIndicator: '.attachment-item'
      }
    };
  }

  /**
   * Detect the current email provider based on the current domain
   * @returns {Object|null} Provider configuration object or null if not supported
   */
  detectProvider() {
    const hostname = window.location.hostname.toLowerCase();
    
    for (const [key, provider] of Object.entries(this.providers)) {
      if (hostname.includes(provider.domain)) {
        return { key, ...provider };
      }
    }
    
    return null;
  }

  /**
   * Get all supported provider domains
   * @returns {Array} Array of supported domains
   */
  getSupportedDomains() {
    return Object.values(this.providers).map(provider => provider.domain);
  }

  /**
   * Check if a domain is supported
   * @param {string} domain - The domain to check
   * @returns {boolean} True if supported, false otherwise
   */
  isSupported(domain) {
    return this.getSupportedDomains().some(supportedDomain => 
      domain.toLowerCase().includes(supportedDomain)
    );
  }

  /**
   * Get provider-specific selectors
   * @param {string} providerKey - The provider key (gmail, outlook, etc.)
   * @returns {Object|null} Selectors object or null if provider not found
   */
  getSelectors(providerKey) {
    return this.providers[providerKey]?.selectors || null;
  }

  /**
   * Get attachment indicator selector for a provider
   * @param {string} providerKey - The provider key
   * @returns {string|null} Attachment indicator selector or null
   */
  getAttachmentIndicator(providerKey) {
    return this.providers[providerKey]?.attachmentIndicator || null;
  }

  /**
   * Get a fallback selector that might work across providers
   * @param {string} selectorType - Type of selector (sendButton, bodyField, etc.)
   * @returns {Array} Array of possible selectors to try
   */
  getFallbackSelectors(selectorType) {
    const fallbacks = {
      sendButton: [
        'button[aria-label*="Send"]',
        'button[data-tooltip*="Send"]',
        'button[title*="Send"]',
        'input[type="submit"][value*="Send"]',
        '.T-I.J-J5-Ji.aoO.v7.T-I-atl.L3'
      ],
      bodyField: [
        '[contenteditable="true"][role="textbox"]',
        '[contenteditable="true"]',
        'textarea[aria-label*="message"]',
        '.Am.Al.editable'
      ],
      subjectField: [
        'input[aria-label*="Subject"]',
        'input[placeholder*="Subject"]',
        'input[name*="subject"]',
        'input[id*="subject"]'
      ],
      attachButton: [
        'button[aria-label*="Attach"]',
        'button[data-tooltip*="Attach"]',
        'button[title*="Attach"]',
        '[data-tooltip="Attach files"]'
      ]
    };

    return fallbacks[selectorType] || [];
  }

  /**
   * Wait for an element to appear in the DOM
   * @param {string} selector - CSS selector to wait for
   * @param {number} timeout - Timeout in milliseconds (default: 5000)
   * @returns {Promise<Element|null>} Promise that resolves with the element or null
   */
  waitForElement(selector, timeout = 5000) {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  /**
   * Try multiple selectors until one works
   * @param {Array} selectors - Array of selectors to try
   * @returns {Element|null} First matching element or null
   */
  trySelectors(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }
    return null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmailProviderDetector;
} else if (typeof window !== 'undefined') {
  window.EmailProviderDetector = EmailProviderDetector;
}

// Semantic Highlighter Content Script
// This script is injected into every page to handle highlighting persistence

// Configuration
const CONFIG = {
  batchSize: 50, // Process sentences in batches to avoid UI jank
  debounceTime: 300, // Debounce time for mutation observer in ms
  excludedTags: new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT"]),
  minSentenceLength: 5, // Minimum characters for a sentence to be analyzed
}

// Cache for processed nodes to avoid re-processing
const processedNodes = new WeakSet()
// Queue for pending sentences to be analyzed
const pendingSentences = []
// Cache for sentiment results
const sentimentCache = {}

// Notify the service worker that the content script is ready
function notifyServiceWorkerReady() {
  if (typeof chrome !== "undefined" && chrome.runtime) {
    chrome.runtime.sendMessage({ type: "contentScriptReady" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("Content script couldn't notify service worker:", chrome.runtime.lastError)
      } else {
        console.log("Content script notified service worker of readiness")
      }
    })
  } else {
    console.warn("Chrome runtime is not available. Unable to notify service worker.")
  }
}

// Initialize extension
function init() {
  console.log("Content script initializing...")

  // Add CSS for sentiment highlighting if not already present
  ensureStylesInjected()

  // Notify service worker that content script is ready
  notifyServiceWorkerReady()
}

// Ensure the CSS styles are injected
function ensureStylesInjected() {
  if (!document.getElementById("semantic-highlighter-styles")) {
    const style = document.createElement("style");
    style.id = "semantic-highlighter-styles";
    style.textContent = `
      .sem-sentiment {
        padding: 0.1em 0.2em;
        margin: 0.05em;
        border-radius: 0.2em;
        display: inline;
      }
      
      .sem-sentiment-positive {
        background-color: #22c55e !important; /* Green for positive */
        color: white !important;
      }
      
      .sem-sentiment-neutral {
        background-color: #6b7280 !important; /* Gray for neutral */
        color: white !important;
      }
      
      .sem-sentiment-negative {
        background-color: #ef4444 !important; /* Red for negative */
        color: white !important;
      }
      
      .sem-sentiment-risk {
        background-color: #f97316 !important; /* Orange for risk */
        color: white !important;
      }
      
      .sem-sentiment-informative {
        background-color: #3b82f6 !important; /* Blue for informative */
        color: white !important;
      }
    `;
    document.head.appendChild(style);
    console.log("Content script: Injected CSS styles with distinct colors for all sentiment categories");
  }
}

// Split text into sentences
function splitIntoSentences(text) {
  if (!text || typeof text !== "string") return []

  // Basic sentence splitting regex
  // This could be enhanced with a more sophisticated NLP approach
  const sentenceRegex = /[^.!?]+[.!?]+/g
  const sentences = text.match(sentenceRegex) || []

  return sentences.map((s) => s.trim()).filter((s) => s.length >= CONFIG.minSentenceLength)
}

// Calculate a simple hash for caching
function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString()
}

// Scan the page for text nodes
function scanPage() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      // Skip if already processed or in excluded tags
      if (
        processedNodes.has(node) ||
        CONFIG.excludedTags.has(node.parentElement?.tagName) ||
        !node.textContent?.trim()
      ) {
        return NodeFilter.FILTER_REJECT
      }
      return NodeFilter.FILTER_ACCEPT
    },
  })

  const textNodes = []
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode)
  }

  // Process text nodes in batches using requestIdleCallback
  processBatch(textNodes)
}

// Process a batch of text nodes
function processBatch(nodes) {
  if (!nodes.length) return

  const batch = nodes.splice(0, CONFIG.batchSize)

  requestIdleCallback(() => {
    batch.forEach((node) => {
      const sentences = splitIntoSentences(node.textContent)
      if (sentences.length) {
        sentences.forEach((sentence) => {
          const hash = hashString(sentence)

          // Check cache first
          if (sentimentCache[hash]) {
            highlightNode(node, sentence, sentimentCache[hash])
          } else {
            pendingSentences.push({ node, text: sentence, hash })
          }
        })
      }
      processedNodes.add(node)
    })

    // Process pending sentences
    if (pendingSentences.length > 0) {
      processPendingSentences()
    }

    // Continue with next batch if there are more nodes
    if (nodes.length > 0) {
      processBatch(nodes)
    }
  })
}

// Process pending sentences by sending to background worker
async function processPendingSentences() {
  if (!pendingSentences.length) return

  // Take a batch of sentences
  const batch = pendingSentences.splice(0, CONFIG.batchSize)
  const sentences = batch.map((item) => item.text)

  try {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      // Send to background worker for classification
      chrome.runtime.sendMessage(
        {
          type: "classify",
          sentences,
        },
        (results) => {
          if (chrome.runtime.lastError) {
            console.error("Error sending message to service worker:", chrome.runtime.lastError)
            return
          }

          // Apply results
          if (results && results.length === batch.length) {
            batch.forEach((item, index) => {
              const sentiment = results[index]

              // Update cache
              sentimentCache[item.hash] = sentiment

              // Highlight node
              highlightNode(item.node, item.text, sentiment)
            })

            // Save updated cache
            chrome.storage.local.set({ sentimentCache })
          }
        },
      )
    } else {
      console.warn("Chrome runtime is not available. Skipping sentence classification.")
    }
  } catch (error) {
    console.error("Error classifying sentences:", error)
  }

  // Process next batch if there are more pending sentences
  if (pendingSentences.length > 0) {
    setTimeout(processPendingSentences, 100)
  }
}

// Highlight a text node based on sentiment
function highlightNode(node, sentence, sentiment) {
  if (!node.parentNode) return // Node no longer in DOM

  const nodeContent = node.textContent
  if (!nodeContent.includes(sentence)) return

  // Create the highlighted span
  const span = document.createElement("span")
  span.className = `sem-sentiment sem-sentiment-${sentiment.toLowerCase()}`
  span.textContent = sentence
  span.title = `Sentiment: ${sentiment}`

  // Replace the text node with our highlighted span
  const beforeText = nodeContent.substring(0, nodeContent.indexOf(sentence))
  const afterText = nodeContent.substring(nodeContent.indexOf(sentence) + sentence.length)

  const fragment = document.createDocumentFragment()

  if (beforeText) {
    fragment.appendChild(document.createTextNode(beforeText))
  }

  fragment.appendChild(span)

  if (afterText) {
    fragment.appendChild(document.createTextNode(afterText))
  }

  node.parentNode.replaceChild(fragment, node)
}

// Set up mutation observer for dynamic content
function setupMutationObserver() {
  let debounceTimer

  const observer = new MutationObserver((mutations) => {
    // Debounce to avoid excessive processing
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      const addedNodes = []

      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              addedNodes.push(node)
            }
          })
        }
      })

      // Process new nodes
      if (addedNodes.length) {
        addedNodes.forEach((node) => {
          const textNodes = []
          const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
            acceptNode: (textNode) => {
              if (
                processedNodes.has(textNode) ||
                CONFIG.excludedTags.has(textNode.parentElement?.tagName) ||
                !textNode.textContent?.trim()
              ) {
                return NodeFilter.FILTER_REJECT
              }
              return NodeFilter.FILTER_ACCEPT
            },
          })

          while (walker.nextNode()) {
            textNodes.push(walker.currentNode)
          }

          if (textNodes.length) {
            processBatch(textNodes)
          }
        })
      }
    }, CONFIG.debounceTime)
  })

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

/**
 * Applies a styled span to the given DOM Range.
 * @param {Range} range - The DOM range to wrap.
 * @param {object} options - Options including sentiment or color.
 * @returns {boolean} - Success status.
 */
function applyHighlightToRange(range, options) {
  const { sentiment, color } = options

  try {
    const parentElement = range.commonAncestorContainer.parentElement
    if (parentElement && (parentElement.tagName === "INPUT" || parentElement.tagName === "TEXTAREA")) {
      console.warn("Content.js: Cannot apply highlight directly to text within an input or textarea element.")
      return false
    }

    if (
      range.startContainer.parentElement.closest(".sem-sentiment") ||
      range.endContainer.parentElement.closest(".sem-sentiment")
    ) {
      console.log(
        "Content.js: Selection or part of it is already highlighted. Re-applying might lead to nested spans if not cleared first.",
      )
    }

    const span = document.createElement("span")

    if (sentiment) {
      const sentimentClass = `sem-sentiment-${sentiment.toLowerCase()}`
      span.className = `sem-sentiment ${sentimentClass}`
    } else if (color) {
      span.className = "sem-sentiment"
      span.style.backgroundColor = color
    }

    console.log("Content.js: Creating span with class:", span.className)

    range.surroundContents(span)
    console.log("Content.js: Highlight applied successfully to range.")
    return true
  } catch (error) {
    console.error("Content.js: Error in applyHighlightToRange:", error)
    return false
  }
}

/**
 * Fallback function to find and highlight text on the page if direct selection manipulation fails.
 * @param {string} textToHighlight - The text to search for and highlight.
 * @param {object} options - Options including sentiment or color.
 * @returns {boolean} - Success status.
 */
function highlightTextOnPageFallback(textToHighlight, options) {
  console.log(`Content.js (Fallback): Attempting to highlight "${textToHighlight}"`, options)
  const treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      if (
        node.nodeValue.includes(textToHighlight) &&
        !node.parentElement.closest("script") &&
        !node.parentElement.closest("style") &&
        !node.parentElement.closest(".sem-sentiment")
      ) {
        return NodeFilter.FILTER_ACCEPT
      }
      return NodeFilter.FILTER_REJECT
    },
  })

  let node
  let highlighted = false
  while ((node = treeWalker.nextNode())) {
    if (highlighted) break // Highlight only the first found instance for this simple fallback

    const textContent = node.nodeValue
    const startIndex = textContent.indexOf(textToHighlight)

    if (startIndex !== -1) {
      try {
        const range = document.createRange()
        range.setStart(node, startIndex)
        range.setEnd(node, startIndex + textToHighlight.length)

        if (applyHighlightToRange(range, options)) {
          highlighted = true
          console.log(`Content.js (Fallback): Successfully highlighted "${textToHighlight}"`)
        } else {
          console.warn(`Content.js (Fallback): applyHighlightToRange failed for "${textToHighlight}"`)
        }
      } catch (e) {
        console.error(`Content.js (Fallback): Error creating range or applying highlight for "${textToHighlight}":`, e)
      }
    }
  }

  if (!highlighted) {
    console.warn(`Content.js (Fallback): Could not find or highlight text "${textToHighlight}" on the page.`)
  }

  return highlighted
}

/**
 * Handles highlighting a selection with the given options
 * @param {object} options - Options including sentiment, color, and text
 * @returns {object} - Result of the highlighting operation
 */
function handleHighlightSelection(options) {
  const { sentiment, color, text } = options
  console.log(`Content.js: Handling highlight selection:`, options)

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    console.warn("Content.js: No active text selection. Attempting fallback.")
    if (text) {
      const fallbackResult = highlightTextOnPageFallback(text, { sentiment, color })
      return { success: fallbackResult, method: "fallback" }
    }
    return { success: false, error: "No selection and no text provided for fallback" }
  }

  const range = selection.getRangeAt(0)
  const selectedText = range.toString()
  console.log("Content.js: Selected text on page:", selectedText)

  if (text && selectedText.trim() !== text.trim()) {
    console.warn(
      "Content.js: Mismatch between text in message and actual selection. Message:",
      `"${text}"`,
      "Actual:",
      `"${selectedText}"`,
      ". Proceeding with actual selection.",
    )
  }

  if (applyHighlightToRange(range, { sentiment, color })) {
    selection.removeAllRanges() // Clear the selection after highlighting
    return { success: true, method: "direct" }
  } else {
    // Fallback if the primary method fails with an active selection
    console.log("Content.js: Primary highlight failed, attempting fallback with selected text.")
    const fallbackResult = highlightTextOnPageFallback(selectedText || text, { sentiment, color })
    return { success: fallbackResult, method: "fallback-after-direct-failed" }
  }
}

// Initialize when DOM is fully loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}

// Listen for messages from service worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script: Message received", request)

  // We don't need to handle highlighting messages anymore since we're using direct script injection
  // But we'll keep this listener for future functionality

  // Handle toggle highlighting
  if (request.type === "toggleHighlighting") {
    if (request.enabled) {
      init()
    } else {
      // Remove all highlights
      document.querySelectorAll(".sem-sentiment").forEach((el) => {
        const textNode = document.createTextNode(el.textContent)
        el.parentNode.replaceChild(textNode, el)
      })
    }
    sendResponse({ success: true })
    return true
  }

  // Default response for unhandled messages
  sendResponse({ success: false, error: "Unknown message type" })
  return true
})

// Add right-click context menu support for manual highlighting
document.addEventListener("mouseup", (e) => {
  // This is just to ensure the selection is available when the context menu appears
  const selection = window.getSelection()
  if (selection && !selection.isCollapsed) {
    // We don't need to do anything here, just ensuring the selection is maintained
    // The context menu will be handled by the Chrome API
  }
})

console.log("Content script: Loaded and ready. Timestamp:", Date.now())

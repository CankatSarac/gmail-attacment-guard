// Semantic Highlighter Background Service Worker
// Handles sentiment analysis and communicates with content scripts

// Configuration
let config = {
  provider: "local", // 'local' or 'remote'
  apiKey: "",
  apiEndpoint: "",
  cacheEnabled: true,
  cacheDurationMs: 24 * 60 * 60 * 1000, // 24 hours
}

// List of restricted URL patterns where scripting is not allowed
const RESTRICTED_URLS = [
  "chrome://",
  "chrome-extension://",
  "chrome.google.com/webstore",
  "chromewebstore.google.com",
  "chrome.google.com/web-store",
  "chrome-error://",
  "edge://",
  "brave://",
  "about:",
]

// Check if a URL is restricted (cannot be scripted)
function isRestrictedUrl(url) {
  if (!url) return true
  return RESTRICTED_URLS.some((pattern) => url.startsWith(pattern) || url.includes(pattern))
}

// Simple hashing function for cache keys
function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // Convert to 32bit integer
  }
  return "sh_cache_" + Math.abs(hash).toString(36) // Added prefix for clarity
}

// Function to get items from cache
async function getFromCache(keys) {
  if (!config.cacheEnabled) return {}
  try {
    const result = await chrome.storage.local.get(keys)
    const now = Date.now()
    const validResults = {}
    for (const key in result) {
      if (result[key] && result[key].timestamp && now - result[key].timestamp < config.cacheDurationMs) {
        validResults[key] = result[key].data
      } else if (result[key]) {
        // Cache expired or invalid
        chrome.storage.local.remove(key) // Clean up expired cache
      }
    }
    return validResults
  } catch (error) {
    console.error("Semantic Highlighter: Error reading from cache:", error)
    return {}
  }
}

// Function to set items in cache
async function setToCache(items) {
  if (!config.cacheEnabled) return
  try {
    const now = Date.now()
    const itemsToCache = {}
    for (const key in items) {
      itemsToCache[key] = {
        data: items[key],
        timestamp: now,
      }
    }
    await chrome.storage.local.set(itemsToCache)
  } catch (error) {
    console.error("Semantic Highlighter: Error writing to cache:", error)
  }
}

// Initialize sentiment provider
let sentimentProvider

// Local Sentiment Provider implementation
class LocalSentimentProvider {
  constructor() {
    this.model = null
    this.tokenizer = null
    this.initialized = false
  }

  async initialize() {
    try {
      // In a real implementation, we would load the TensorFlow.js model here
      // For simplicity, we're using a mock implementation

      // Simulate model loading time
      await new Promise((resolve) => setTimeout(resolve, 500))

      this.initialized = true
      console.log("Local sentiment model initialized")
      return true
    } catch (error) {
      console.error("Failed to initialize local sentiment model:", error)
      return false
    }
  }

  async classify(sentences) {
    if (!this.initialized) {
      const success = await this.initialize()
      if (!success) {
        console.warn("Local provider initialization failed. Returning neutral for all sentences.")
        return sentences.map(() => ({ label: "NEUTRAL", score: 0 }))
      }
    }

    const finalResults = new Array(sentences.length)
    const sentencesToProcess = []
    const cacheKeys = sentences.map(simpleHash)
    const cachedResults = await getFromCache(cacheKeys)
    const newCacheItems = {}

    for (let i = 0; i < sentences.length; i++) {
      const key = cacheKeys[i]
      if (cachedResults[key]) {
        finalResults[i] = cachedResults[key]
      } else {
        sentencesToProcess.push({ originalIndex: i, text: sentences[i] })
      }
    }

    if (sentencesToProcess.length > 0) {
      // Mock implementation for local processing
      sentencesToProcess.forEach((item) => {
        const lowerSentence = item.text.toLowerCase()
        let sentiment
        if (
          lowerSentence.includes("fantastic") ||
          lowerSentence.includes("great") ||
          lowerSentence.includes("excellent") ||
          lowerSentence.includes("happy")
        ) {
          sentiment = { label: "POSITIVE", score: 0.9 }
        } else if (
          lowerSentence.includes("disappointing") ||
          lowerSentence.includes("bad") ||
          lowerSentence.includes("terrible") ||
          lowerSentence.includes("awful")
        ) {
          sentiment = { label: "NEGATIVE", score: -0.8 }
        } else if (
          lowerSentence.includes("warning") ||
          lowerSentence.includes("caution") ||
          lowerSentence.includes("legal") ||
          lowerSentence.includes("risk")
        ) {
          sentiment = { label: "RISK", score: 0.7 }
        } else if (
          lowerSentence.includes("details") ||
          lowerSentence.includes("report") ||
          lowerSentence.includes("explains") ||
          lowerSentence.includes("finding") ||
          lowerSentence.includes("information")
        ) {
          sentiment = { label: "INFORMATIVE", score: 0.6 }
        } else {
          sentiment = { label: "NEUTRAL", score: 0.1 }
        }
        finalResults[item.originalIndex] = sentiment
        newCacheItems[cacheKeys[item.originalIndex]] = sentiment
      })
      if (Object.keys(newCacheItems).length > 0) {
        await setToCache(newCacheItems)
      }
    }
    return finalResults
  }
}

// Remote Sentiment Provider implementation
class RemoteSentimentProvider {
  constructor(endpoint, apiKey) {
    this.endpoint = endpoint
    this.apiKey = apiKey
    this.initialized = false
    this.initializationAttempted = false // Track if initialization has been tried
  }

  async initialize() {
    this.initializationAttempted = true
    try {
      if (!this.endpoint || !this.apiKey) {
        throw new Error("Missing API endpoint or key for remote provider.")
      }
      // Simple check, actual API might have a dedicated status/ping endpoint
      const response = await fetch(this.endpoint, {
        method: "OPTIONS", // Or a lightweight GET request if the API supports it for status
        headers: { Authorization: `Bearer ${this.apiKey}` },
      })
      if (!response.ok && response.status !== 405 && response.status !== 204) {
        // 204 No Content is also OK for OPTIONS
        throw new Error(`API connection test failed: ${response.status} ${response.statusText}`)
      }
      this.initialized = true
      console.log("Remote sentiment provider initialized successfully.")
      return true
    } catch (error) {
      console.error("Failed to initialize remote sentiment provider:", error.message)
      this.initialized = false
      return false
    }
  }

  async _fetchSentimentsFromAPI(sentencesToProcess) {
    try {
      const response = await fetch(`${this.endpoint}/classify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sentences: sentencesToProcess.map((s) => s.text) }),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        console.error(`API request failed: ${response.status} ${response.statusText}`, errorBody)
        return sentencesToProcess.map(() => ({ label: "NEUTRAL", score: 0, error: true }))
      }
      const data = await response.json()
      if (!data.results || data.results.length !== sentencesToProcess.length) {
        console.error("Unexpected API response structure:", data)
        return sentencesToProcess.map(() => ({ label: "NEUTRAL", score: 0, error: true }))
      }
      return data.results
    } catch (error) {
      console.error("Remote sentiment analysis fetch failed:", error)
      return sentencesToProcess.map(() => ({ label: "NEUTRAL", score: 0, error: true }))
    }
  }

  async classify(sentences) {
    if (!this.initialized && !this.initializationAttempted) {
      await this.initialize()
    }
    if (!this.initialized) {
      // If still not initialized after attempt
      console.warn("Remote provider not initialized. Falling back for classify request.")
      return sentences.map(() => ({ label: "NEUTRAL", score: 0 }))
    }

    const finalResults = new Array(sentences.length)
    const sentencesToProcess = [] // Array of { originalIndex, text }
    const cacheKeys = sentences.map(simpleHash)
    const cachedResults = await getFromCache(cacheKeys)
    const newCacheItems = {}

    for (let i = 0; i < sentences.length; i++) {
      const key = cacheKeys[i]
      if (cachedResults[key]) {
        finalResults[i] = cachedResults[key]
      } else {
        sentencesToProcess.push({ originalIndex: i, text: sentences[i] })
      }
    }

    if (sentencesToProcess.length > 0) {
      const apiResults = await this._fetchSentimentsFromAPI(sentencesToProcess)
      apiResults.forEach((sentiment, idx) => {
        const originalIndex = sentencesToProcess[idx].originalIndex
        finalResults[originalIndex] = sentiment
        if (!sentiment.error) {
          // Only cache successful results
          newCacheItems[cacheKeys[originalIndex]] = sentiment
        }
      })

      if (Object.keys(newCacheItems).length > 0) {
        await setToCache(newCacheItems)
      }
    }
    return finalResults
  }
}

// Load configuration
async function initializeProvider() {
  const result = await chrome.storage.local.get(["sentimentConfig"])
  if (result.sentimentConfig) {
    config = { ...config, ...result.sentimentConfig }
  }

  if (config.provider === "remote" && config.apiKey && config.apiEndpoint) {
    sentimentProvider = new RemoteSentimentProvider(config.apiEndpoint, config.apiKey)
  } else {
    sentimentProvider = new LocalSentimentProvider()
  }

  await sentimentProvider.initialize()
}

// Add context menu for sentiment analysis on selected text
chrome.runtime.onInstalled.addListener(() => {
  console.log("Semantic Highlighter: Extension installed.")
  chrome.storage.local.set({ sentimentEngine: "local" })

  // Create context menu items for different highlight colors
  chrome.contextMenus.create({
    id: "analyze-sentiment",
    title: "Analyze Sentiment",
    contexts: ["selection"],
  })

  // Create color highlighter menu
  chrome.contextMenus.create({
    id: "highlight-color",
    title: "Highlight Selection",
    contexts: ["selection"],
  })

  // Create color submenu items
  const colors = [
    { id: "highlight-yellow", color: "#ffeb3b", title: "Yellow" },
    { id: "highlight-green", color: "#22c55e", title: "Green" },
    { id: "highlight-red", color: "#ef4444", title: "Red" },
    { id: "highlight-orange", color: "#f97316", title: "Orange" },
  ]

  colors.forEach((item) => {
    chrome.contextMenus.create({
      id: item.id,
      parentId: "highlight-color",
      title: item.title,
      contexts: ["selection"],
    })
  })
})

// Function to highlight text with a specific color - will be injected into the page
function highlightSelection(options) {
  const { color, sentiment } = options

  // Get the current selection
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) return { success: false, error: "No text selected" }

  // Get the range
  const range = selection.getRangeAt(0).cloneRange()

  // Create a span element instead of mark for better CSS control
  const span = document.createElement("span")

  // Apply styling based on sentiment or color
  if (sentiment) {
    span.className = `sem-sentiment sem-sentiment-${sentiment.toLowerCase()}`
    span.dataset.sentiment = sentiment
    console.log("SW: Applied sentiment class:", span.className)
  } else if (color) {
    span.className = "sem-sentiment"
    span.style.backgroundColor = color
    span.dataset.color = color
  }

  try {
    // Extract the contents and insert them into the span
    span.appendChild(range.extractContents())
    range.insertNode(span)

    // Clear the selection
    selection.removeAllRanges()

    return { success: true }
  } catch (error) {
    console.error("Error highlighting selection:", error)
    return { success: false, error: error.message }
  }
}

// Ensures the sentiment provider is initialized
async function ensureProviderInitialized() {
  if (
    !sentimentProvider ||
    (sentimentProvider &&
      !sentimentProvider.initialized &&
      !(sentimentProvider instanceof RemoteSentimentProvider && sentimentProvider.initializationAttempted))
  ) {
    console.log("SW: Provider not ready or not initialized. Initializing provider...")
    await initializeProvider()
  } else if (
    sentimentProvider instanceof RemoteSentimentProvider &&
    sentimentProvider.initializationAttempted &&
    !sentimentProvider.initialized
  ) {
    console.warn("SW: Remote provider initialization previously failed. Attempting re-initialization...")
    await initializeProvider() // Re-attempt
  }
}

// Classifies the given text using the initialized sentiment provider
async function classifyText(text) {
  if (!sentimentProvider || !sentimentProvider.initialized) {
    console.warn("SW: Provider not available for classification. Returning Neutral.")
    if (sentimentProvider instanceof RemoteSentimentProvider) {
      console.warn(
        `SW: Remote Provider state: initialized=${sentimentProvider.initialized}, attempted=${sentimentProvider.initializationAttempted}`,
      )
    }
    return "Neutral"
  }
  console.log("SW: Provider initialized, classifying text:", text)
  const rawResults = await sentimentProvider.classify([text]) // Classify expects an array
  return mapSentimentToCategory(rawResults[0])
}

// Executes the highlighting script in the target tab
async function executeHighlightingScript(tabId, options, tabUrl) {
  if (!tabId) {
    console.warn("SW: No tabId provided. Cannot execute highlighting script.")
    return { success: false, error: "No tab ID provided" }
  }

  // Check if the URL is restricted
  if (!tabUrl) {
    console.warn("SW: No URL provided. Cannot determine if scripting is allowed.")
    return { success: false, error: "No URL provided" }
  }

  if (isRestrictedUrl(tabUrl)) {
    console.warn(`SW: Scripting is not allowed on URL: ${tabUrl}. Skipping highlight.`)
    return { success: false, error: "Scripting not allowed on this page", restrictedUrl: true }
  }

  console.log(`SW: Attempting to execute script in tab ${tabId} (URL: ${tabUrl}). Options:`, options)

  try {
    // Directly inject the highlighting function into the page
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: highlightSelection,
      args: [options],
    })

    if (!injectionResults || injectionResults.length === 0) {
      console.warn(`SW: Script execution returned no results for tab ${tabId}.`)
      return { success: false, error: "Script execution returned no results" }
    }

    return injectionResults[0].result || { success: false, error: "Unknown error" }
  } catch (error) {
    console.error(`SW: Error executing script in tab ${tabId}:`, error)
    return {
      success: false,
      error: error.message || "Failed to execute script",
      restrictedUrl: error.message && error.message.includes("cannot be scripted"),
    }
  }
}

// Shared function to handle selected text classification and highlighting
async function handleClassifySelectionRequest(request, sendResponseCallback) {
  console.log("SW: handleClassifySelectionRequest called with request:", request)
  try {
    await ensureProviderInitialized()
    const sentimentResult = await classifyText(request.text)
    console.log("SW: Classification result for selection:", sentimentResult)

    const highlightResult = await executeHighlightingScript(
      request.tabId,
      { sentiment: sentimentResult },
      request.tabUrl,
    )

    if (sendResponseCallback) {
      if (highlightResult && !highlightResult.success && highlightResult.restrictedUrl) {
        sendResponseCallback({
          sentiment: sentimentResult,
          highlighted: false,
          error: "Cannot highlight on this page (restricted URL)",
        })
      } else {
        sendResponseCallback({
          sentiment: sentimentResult,
          highlighted: highlightResult ? highlightResult.success : false,
          error: highlightResult && highlightResult.error ? highlightResult.error : null,
        })
      }
    }
  } catch (error) {
    console.error("SW: Error in handleClassifySelectionRequest (outer try-catch):", error)
    if (sendResponseCallback) {
      sendResponseCallback({ sentiment: "Neutral", highlighted: false, error: error.message })
    }
  }
}

// Handle direct color highlighting request
async function handleColorHighlightRequest(info, tab, color) {
  console.log(`SW: Handling color highlight request for color: ${color}`)
  try {
    const highlightResult = await executeHighlightingScript(tab.id, { color: color }, tab.url)
    return highlightResult
  } catch (error) {
    console.error("SW: Error in handleColorHighlightRequest:", error)
    return { success: false, error: error.message }
  }
}

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "analyze-sentiment" && info.selectionText && tab) {
    console.log(
      `SW: Context menu item '${info.menuItemId}' clicked for text: "${info.selectionText}" in tab ${tab.id}, URL: ${tab.url}`,
    )
    await handleClassifySelectionRequest({ text: info.selectionText, tabId: tab.id, tabUrl: tab.url }, null)
  }
  // Handle color highlight menu items
  else if (
    info.menuItemId.startsWith("highlight-") &&
    info.menuItemId !== "highlight-color" &&
    info.selectionText &&
    tab
  ) {
    const colorMap = {
      "highlight-yellow": "#ffeb3b",
      "highlight-green": "#22c55e",
      "highlight-red": "#ef4444",
      "highlight-orange": "#f97316",
    }

    const color = colorMap[info.menuItemId]
    if (color) {
      await handleColorHighlightRequest(info, tab, color)
    }
  } else {
    console.warn(
      "SW: Context menu click ignored. menuItemId:",
      info.menuItemId,
      "selectionText:",
      info.selectionText,
      "tab:",
      tab,
    )
  }
})

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("SW: Message received:", request, "from sender:", sender)
  if (request.type === "classifySelection") {
    if (!request.text || typeof request.tabId === "undefined") {
      console.error("SW: 'classifySelection' request missing 'text' or 'tabId'. Request:", request)
      sendResponse({ sentiment: "Neutral", highlighted: false, error: "Missing parameters in request." })
      return false // Important to return false if not handling asynchronously or if error
    }
    // Ensure sender.tab exists and pass sender.tab.url as tabUrl
    const tabUrl = sender.tab ? sender.tab.url : null
    if (!sender.tab) {
      console.warn("SW: 'classifySelection' request received without sender.tab details. Cannot get URL.")
    }
    handleClassifySelectionRequest({ text: request.text, tabId: request.tabId, tabUrl: tabUrl }, sendResponse)
    return true // Indicates that sendResponse will be called asynchronously
  }

  if (request.type === "updateConfig") {
    updateConfiguration(request.config)
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error("Config update error:", error)
        sendResponse({ success: false, error: error.message })
      })
    return true
  }

  // Handle content script ready notification
  if (request.type === "contentScriptReady") {
    console.log(`SW: Content script reported ready in tab ${sender.tab?.id}`)
    sendResponse({ received: true })
    return false
  }

  // Handle highlight result notification
  if (request.type === "highlightResult") {
    console.log(`SW: Content script reported highlight result:`, request.result)
    sendResponse({ received: true })
    return false
  }
})

// Helper function to get category from label
function getCategoryFromLabel(labelStr) {
  if (typeof labelStr !== "string") return null
  const upperLabel = labelStr.toUpperCase()
  if (upperLabel === "POSITIVE") return "Positive"
  if (upperLabel === "NEGATIVE") return "Negative"
  if (upperLabel === "NEUTRAL") return "Neutral"
  if (upperLabel === "RISK" || upperLabel === "WARNING") return "Risk"
  if (upperLabel === "INFORMATIVE") return "Informative" // Added Informative
  return null
}

// Helper function to get category from score
function getCategoryFromScore(score, riskScore) {
  if (typeof riskScore === "number" && riskScore > 0.6) return "Risk"
  if (typeof score === "number") {
    if (score > 0.35) return "Positive"
    if (score < -0.35) return "Negative"
  }
  return null
}

// Map raw sentiment scores to our categories
function mapSentimentToCategory(result) {
  if (!result) return "Neutral"

  if (typeof result === "string") {
    const categoryFromString = getCategoryFromLabel(result)
    if (categoryFromString) return categoryFromString
  }

  if (typeof result === "object" && result !== null) {
    let category = getCategoryFromLabel(result.label)
    if (category) return category

    category = getCategoryFromScore(result.score, result.risk)
    if (category) return category
  }

  return "Neutral"
}

// Update configuration
async function updateConfiguration(newConfig) {
  config = { ...config, ...newConfig }
  await chrome.storage.local.set({ sentimentConfig: config })
  await initializeProvider()
}

console.log("Semantic Highlighter: Service worker started.")

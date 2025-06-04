// Popup script for the extension

document.addEventListener("DOMContentLoaded", () => {
  const highlightToggle = document.getElementById("highlightToggle")
  const providerSelect = document.getElementById("providerSelect")
  const apiSettings = document.getElementById("apiSettings")
  const apiEndpoint = document.getElementById("apiEndpoint")
  const apiKey = document.getElementById("apiKey")
  const saveButton = document.getElementById("saveButton")
  const apiStatus = document.getElementById("apiStatus")

  // Load saved settings
  chrome.storage.local.get(["sentimentConfig", "highlightEnabled"], (result) => {
    const config = result.sentimentConfig || { provider: "local" }
    const highlightEnabled = result.highlightEnabled !== false // Default to true

    // Set highlight toggle
    if (highlightToggle) {
      highlightToggle.checked = highlightEnabled
    }

    // Set provider selection
    if (providerSelect) {
      providerSelect.value = config.provider || "local"
      
      if (config.provider === "remote") {
        if (apiSettings) apiSettings.classList.add("visible")
      }
    }

    // Set API settings
    if (apiEndpoint && config.apiEndpoint) {
      apiEndpoint.value = config.apiEndpoint
    }

    if (apiKey && config.apiKey) {
      apiKey.value = config.apiKey
    }
  })

  // Handle highlight toggle
  if (highlightToggle) {
    highlightToggle.addEventListener("change", () => {
      const enabled = highlightToggle.checked
      chrome.storage.local.set({ highlightEnabled: enabled }, () => {
        notifyContentScripts(enabled)
      })
    })
  }

  // Handle provider selection
  if (providerSelect) {
    providerSelect.addEventListener("change", () => {
      const provider = providerSelect.value
      
      if (provider === "remote") {
        handleRemoteProviderSelection()
      } else if (apiSettings) {
        apiSettings.classList.remove("visible")
      }
    })
  }
  // Handle save button
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      const provider = providerSelect ? providerSelect.value : "local"
      const highlightEnabled = highlightToggle ? highlightToggle.checked : true
      
      const config = {
        provider,
        cacheEnabled: true,
      }

      if (provider === "remote") {
        if (apiEndpoint) config.apiEndpoint = apiEndpoint.value.trim()
        if (apiKey) config.apiKey = apiKey.value.trim()

        if (!config.apiEndpoint || !config.apiKey) {
          showStatus("Please provide both API endpoint and key.", "error")
          return
        }
      }

      // Save to storage
      chrome.storage.local.set({ 
        sentimentConfig: config,
        highlightEnabled: highlightEnabled 
      }, () => {
        // Update background worker
        chrome.runtime.sendMessage(
          {
            type: "updateConfig",
            config,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error sending message to background script:", chrome.runtime.lastError)
              showStatus(`Error: ${chrome.runtime.lastError.message}`, "error")
              return
            }

            showStatus("Settings saved successfully!", "success")
          },
        )
      })
    })
  }

  // Helper function to show status messages
  function showStatus(message, type = "success") {
    if (apiStatus) {
      apiStatus.textContent = message
      apiStatus.className = `status ${type}`

      // Clear status after 3 seconds
      setTimeout(() => {
        apiStatus.textContent = ""
        apiStatus.className = "status"
      }, 3000)
    }
  }

  // Helper function to notify content scripts
  function notifyContentScripts(enabled) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: "toggleHighlighting",
            enabled: enabled
          }).catch(() => {
            // Ignore errors for tabs that don't have content script
          })
        }
      })
    })
  }

  // Helper function to handle remote provider selection
  function handleRemoteProviderSelection() {
    if (apiSettings) apiSettings.classList.add("visible")

    const consent = confirm(
      "Privacy Notice:\n\nChoosing the Remote API option will send the text content of web pages you visit to an external server for sentiment analysis. \n\n- We do NOT send URLs or any personal identifiers. \n- Only the text for analysis is transmitted.\n\nDo you consent to sending page text to the remote API for sentiment analysis?",
    )

    if (!consent) {
      if (providerSelect) providerSelect.value = "local"
      if (apiSettings) apiSettings.classList.remove("visible")
      showStatus("Remote API not enabled. Switched back to Local (Offline) engine.", "error")
    }
  }
})

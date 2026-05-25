// background.js - Service Worker for State & Core Logic

const DEFAULT_SETTINGS = {
  maxTime: 900,       // 15 minutes per session (in seconds)
  maxScroll: 30000    // 30,000 pixels per session
};

let sessionTime = 0;
let sessionScroll = 0;

// Helper: Get today's date string (YYYY-MM-DD)
function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

// Initialize default settings and analytics structure on install
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(["settings", "analytics"]);
  if (!data.settings) await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  if (!data.analytics) await chrome.storage.local.set({ analytics: {} });
});

// Main Message Listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "LOG_ACTIVITY") {
    handleActivityLog(message.payload, sender.tab.id);
  } else if (message.type === "CLOSE_CURRENT_TAB") {
    chrome.tabs.remove(sender.tab.id);
  }
});

async function handleActivityLog(payload, tabId) {
  sessionTime += payload.timeDelta;
  sessionScroll += payload.scrollDelta;

  // 1. Save data to Analytics Dashboard
  const today = getTodayString();
  const data = await chrome.storage.local.get(["settings", "analytics"]);
  const settings = data.settings || DEFAULT_SETTINGS;
  const analytics = data.analytics || {};

  if (!analytics[today]) {
    analytics[today] = { totalTime: 0, totalScroll: 0, triggers: 0 };
  }
  
  analytics[today].totalTime += payload.timeDelta;
  analytics[today].totalScroll += payload.scrollDelta;

  await chrome.storage.local.set({ analytics });

  // 2. Check if thresholds are breached
  if (sessionTime >= settings.maxTime || sessionScroll >= settings.maxScroll) {
    triggerOverwhelmIntervention(tabId, analytics, today);
    // Reset session trackers so the user can continue after the break
    sessionTime = 0;
    sessionScroll = 0;
  }
}

async function triggerOverwhelmIntervention(tabId, analytics, today) {
  // Update Trigger Count in Analytics
  analytics[today].triggers += 1;
  await chrome.storage.local.set({ analytics });

  // Fetch Cat API
  let catUrl = "https://cdn2.thecatapi.com/images/0XYvRd7oD.jpg"; // Fallback image
  try {
    const response = await fetch("https://api.thecatapi.com/v1/images/search");
    const json = await response.json();
    if (json && json.length > 0) {
      catUrl = json[0].url;
    }
  } catch (error) {
    console.error("Failed to fetch cat image:", error);
  }

  // Send Trigger back to Content Script
  chrome.tabs.sendMessage(tabId, {
    type: "TRIGGER_INTERVENTION",
    payload: { catUrl }
  });
}
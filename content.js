// content.js - Injected into target websites to track behavior

let pendingTime = 0;
let pendingScroll = 0;
let lastScrollY = window.scrollY;
let interventionActive = false;

// 1. Track Scroll Distance (Throttled)
let scrollTimeout;
window.addEventListener("scroll", () => {
  if (interventionActive) return;
  
  if (!scrollTimeout) {
    scrollTimeout = setTimeout(() => {
      const currentScrollY = window.scrollY;
      const distance = Math.abs(currentScrollY - lastScrollY);
      pendingScroll += distance;
      lastScrollY = currentScrollY;
      scrollTimeout = null;
    }, 100); // 100ms throttle for performance
  }
});

// 2. Track Active Time (Only when tab is focused)
setInterval(() => {
  if (!document.hidden && !interventionActive) {
    pendingTime += 1;
  }
}, 1000);

// 3. Batch send data to Background Script every 5 seconds
setInterval(() => {
  if ((pendingTime > 0 || pendingScroll > 0) && !interventionActive) {
    chrome.runtime.sendMessage({
      type: "LOG_ACTIVITY",
      payload: {
        timeDelta: pendingTime,
        scrollDelta: pendingScroll
      }
    });
    // Reset after sending
    pendingTime = 0;
    pendingScroll = 0;
  }
}, 5000);

// 4. Listen for Intervention Trigger from Background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TRIGGER_INTERVENTION" && !interventionActive) {
    triggerIntervention(message.payload.catUrl);
  }
});

// 5. Render Un-bypassable Modal Overlay
function triggerIntervention(catUrl) {
  interventionActive = true;
  document.body.style.overflow = "hidden"; // Lock background scroll

  const overlay = document.createElement("div");
  overlay.id = "guardrail-intervention-overlay";
  Object.assign(overlay.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    zIndex: "999999999",
    backgroundColor: "rgba(0,0,0,0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  });

  // Use an iframe to prevent the host website's CSS from ruining the UI
  const iframe = document.createElement("iframe");
  const extensionId = chrome.runtime.id;
  // Pass the cat URL to the iframe via query parameters
  iframe.src = `chrome-extension://${extensionId}/intervention.html?cat=${encodeURIComponent(catUrl)}`;
  Object.assign(iframe.style, {
    width: "100%",
    height: "100%",
    border: "none",
    borderRadius: "16px"
  });

  overlay.appendChild(iframe);
  document.body.appendChild(overlay);
}

// 6. Listen for messages from the iframe (Close Modal or Close Tab)
window.addEventListener("message", (event) => {
  // Ensure message comes from our extension
  if (event.origin !== `chrome-extension://${chrome.runtime.id}`) return;

  if (event.data === "CLOSE_INTERVENTION") {
    const overlay = document.getElementById("guardrail-intervention-overlay");
    if (overlay) overlay.remove();
    document.body.style.overflow = "auto";
    interventionActive = false;
  } else if (event.data === "CLOSE_TAB") {
    chrome.runtime.sendMessage({ type: "CLOSE_CURRENT_TAB" });
  }
});
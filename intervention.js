// intervention.js - Handles UI Logic inside the iframe

document.addEventListener("DOMContentLoaded", () => {
  // 1. Extract Cat URL from parameters
  const urlParams = new URLSearchParams(window.location.search);
  const catUrl = urlParams.get('cat');
  if (catUrl) document.getElementById('cat-image').src = catUrl;

  // 2. Setup Breathing Animation (4-7-8 method)
  const circle = document.getElementById('breath-circle');
  const text = document.getElementById('breath-text');
  const closeBtn = document.getElementById('btn-close');
  const breakBtn = document.getElementById('btn-break');

  // Start sequence
  setTimeout(() => {
    circle.classList.add('animate-breathe');
    
    // Inhale (4s)
    text.innerText = "Inhale (4s)";
    
    // Hold (7s) - starts at 4s
    setTimeout(() => {
      text.innerText = "Hold (7s)";
    }, 4000);

    // Exhale (8s) - starts at 11s (4 + 7)
    setTimeout(() => {
      text.innerText = "Exhale (8s)";
    }, 11000);

    // Done - unlocks at 19s
    setTimeout(() => {
      text.innerText = "Done.";
      closeBtn.disabled = false;
      closeBtn.classList.remove('btn-disabled');
      closeBtn.classList.add('btn-active');
      closeBtn.innerText = "Continue Scrolling";
    }, 19000);
    
  }, 500); // Slight delay for smooth load

  // 3. Button Event Listeners via postMessage to parent (content script)
  closeBtn.addEventListener('click', () => {
    if (!closeBtn.disabled) {
      window.parent.postMessage("CLOSE_INTERVENTION", "*");
    }
  });

  breakBtn.addEventListener('click', () => {
    window.parent.postMessage("CLOSE_TAB", "*");
  });
});
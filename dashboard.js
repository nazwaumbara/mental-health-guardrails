// dashboard.js - Renders Charts and handles UI logic for the Popup

document.addEventListener("DOMContentLoaded", async () => {
  const data = await chrome.storage.local.get(["settings", "analytics"]);
  const analytics = data.analytics || {};
  const settings = data.settings || { maxTime: 900, maxScroll: 30000 };

  const inputTime = document.getElementById("input-time");
  const inputScroll = document.getElementById("input-scroll");
  
  // TAMPILAN KE PENGGUNA:
  // Convert detik ke menit
  inputTime.value = Math.round(settings.maxTime / 60);
  // Convert Pixel ke Screens (1 Screen = 800 pixel)
  inputScroll.value = Math.round(settings.maxScroll / 800);

  document.getElementById("btn-save").addEventListener("click", async () => {
    // SIMPAN KE SISTEM:
    const newSettings = { 
      // Convert balik menit ke detik
      maxTime: parseInt(inputTime.value) * 60, 
      // Convert balik Screens ke Pixel untuk dibaca oleh mesin
      maxScroll: parseInt(inputScroll.value) * 800 
    };
    
    await chrome.storage.local.set({ settings: newSettings });
    
    const btn = document.getElementById("btn-save");
    btn.innerText = "Saved!";
    btn.classList.add("bg-emerald");
    setTimeout(() => { 
      btn.innerText = "Save Preferences"; 
      btn.classList.remove("bg-emerald"); 
    }, 2000);
  });

  // 2. Generate last 7 days keys
  const dates = [];
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateString = d.toISOString().split("T")[0];
    dates.push(dateString);
    labels.push(d.toLocaleDateString(undefined, { weekday: 'short' }));
  }

  // 3. Aggregate Data for KPIs and Charts
  let totalTriggers7d = 0;
  const triggerData = [];

  dates.forEach(date => {
    const dayData = analytics[date] || { triggers: 0, totalTime: 0 };
    totalTriggers7d += dayData.triggers;
    triggerData.push(dayData.triggers);
  });

  const todayStr = dates[dates.length - 1];
  const todayTimeSecs = analytics[todayStr] ? analytics[todayStr].totalTime : 0;

  // Render KPIs
  document.getElementById("kpi-triggers").innerText = totalTriggers7d;
  document.getElementById("kpi-time").innerText = `${Math.round(todayTimeSecs / 60)} min`;

  // 4. Render Chart.js Graph
  const ctx = document.getElementById("trendChart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Interventions",
        data: triggerData,
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
});
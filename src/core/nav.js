// src/core/nav.js
export function bindTabs({ onMapOpen } = {}) {
  const screens = Array.from(document.querySelectorAll(".tab-screen"));
  const tabs = Array.from(document.querySelectorAll(".nav-item"));

  function show(screenId, tabId) {
    screens.forEach(s => s.classList.toggle("active", s.id === screenId));
    tabs.forEach(t => t.classList.toggle("active", t.id === tabId));

    if (screenId === "map-screen" && typeof onMapOpen === "function") {
      onMapOpen();
    }
  }

  document.getElementById("tab-dash")?.addEventListener("click", () => {
    show("dashboard-screen", "tab-dash");
  });

  document.getElementById("tab-map")?.addEventListener("click", () => {
    show("map-screen", "tab-map");
  });

  // default
  show("dashboard-screen", "tab-dash");
}

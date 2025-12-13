// src/ui.js
export const ui = (() => {
  const $ = (id) => document.getElementById(id);

  function setGPSStatus(msg, styleClass = "", acc = null) {
    const bar = $("gps-status-bar");
    if (!bar) return;
    const accTxt = typeof acc === "number" ? ` (±${acc}m)` : "";
    bar.textContent = `${msg}${accTxt}`;
    bar.className = `gps-bar ${styleClass}`.trim();
  }

  function enableActions() {
    document.querySelectorAll(".btn-big").forEach((btn) => btn.classList.add("ready"));
    $("btn-main-action")?.removeAttribute("disabled");
    $("btn-visit-action")?.removeAttribute("disabled");
  }

  function setMainButtonText(txt) {
    const el = $("btn-main-text");
    if (el) el.textContent = txt;
  }

  function setTimerText(txt) {
    const el = $("status-timer");
    if (el) el.textContent = txt;
  }

  function setWorkingUI({ isWorking, siteName }) {
    const statusLabel = $("status-label");
    const statusLoc = $("status-loc");
    const btnMain = $("btn-main-action");
    const btnMainText = $("btn-main-text");
    const btnVisit = $("btn-visit-action");

    if (!statusLabel || !statusLoc || !btnMain || !btnMainText) return;

    if (isWorking) {
      statusLabel.textContent = "EM ANDAMENTO";
      statusLabel.style.color = "#ef4444";
      statusLoc.innerHTML = `<span class="dot dot-work" aria-hidden="true"></span><span>${siteName || "Local Manual"}</span>`;

      btnMain.classList.add("active");
      btnMainText.textContent = "Parar Trabalho";
      if (btnVisit) btnVisit.style.display = "none";
    } else {
      statusLabel.textContent = "STATUS ATUAL";
      statusLabel.style.color = "#64748b";
      statusLoc.innerHTML = `<span class="dot dot-idle" aria-hidden="true"></span><span>Não trabalhando</span>`;

      btnMain.classList.remove("active");
      btnMainText.textContent = "Check-in Manual";
      if (btnVisit) btnVisit.style.display = "";
      setTimerText("--:--");
    }
  }

  function showGeofenceAlert({ siteName, onWork, onVisit }) {
    const box = $("geofence-alert");
    const msg = $("geo-msg");
    const btnWork = $("btn-geo-work");
    const btnVisit = $("btn-geo-visit");

    if (!box || !msg || !btnWork || !btnVisit) return;

    msg.textContent = `Entrada detectada: ${siteName}`;
    box.style.display = "block";

    btnWork.onclick = () => {
      try { onWork?.(); } finally { box.style.display = "none"; }
    };

    btnVisit.onclick = () => {
      try { onVisit?.(); } finally { box.style.display = "none"; }
    };

    setTimeout(() => { box.style.display = "none"; }, 10000);
  }

  function bindTabs({ onMapOpen } = {}) {
    const dashTab = $("tab-dash");
    const mapTab = $("tab-map");
    const dashScreen = $("dashboard-screen");
    const mapScreen = $("map-screen");

    if (!dashTab || !dashScreen) return;

    const setActiveTab = (which) => {
      document.querySelectorAll(".tab-screen").forEach((el) => el.classList.remove("active"));
      document.querySelectorAll(".nav-item").forEach((el) => el.classList.remove("active"));

      if (which === "dash") {
        dashScreen.classList.add("active");
        dashTab.classList.add("active");
      } else if (which === "map" && mapScreen && mapTab) {
        mapScreen.classList.add("active");
        mapTab.classList.add("active");
      }
    };

    dashTab.onclick = () => setActiveTab("dash");

    if (mapTab && mapScreen) {
      mapTab.onclick = async () => {
        setActiveTab("map");
        await onMapOpen?.();
      };
    }
  }

  return {
    setGPSStatus,
    enableActions,
    setMainButtonText,
    setTimerText,
    setWorkingUI,
    showGeofenceAlert,
    bindTabs,
  };
})();

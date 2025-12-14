// src/core/ui.js
import { $, $$, setText, show, hide, enable } from "./dom.js";

export function setGPSStatus(msg, styleClass = "", acc = null) {
  const bar = $("gps-status-bar");
  if (!bar) return;
  const accTxt = typeof acc === "number" ? ` (±${acc}m)` : "";
  setText(bar, `${msg}${accTxt}`);
  bar.className = `gps-bar ${styleClass}`.trim();
}

export function enableActions() {
  $$(".btn-big").forEach((btn) => btn.classList.add("ready"));
  enable($("btn-main-action"));
  enable($("btn-visit-action"));
}

export function setMainButtonText(txt) {
  setText($("btn-main-text"), txt);
}

export function setTimerText(txt) {
  setText($("status-timer"), txt);
}

export function setWorkingUI({ isWorking, siteName }) {
  const statusLabel = $("status-label");
  const statusLoc = $("status-loc");
  const btnMain = $("btn-main-action");
  const btnVisit = $("btn-visit-action");
  const btnMainText = $("btn-main-text");

  if (!statusLabel || !statusLoc || !btnMain || !btnMainText) return;

  if (isWorking) {
    setText(statusLabel, "EM ANDAMENTO");
    statusLabel.style.color = "#ef4444";
    statusLoc.innerHTML = `<span>📍</span> ${siteName || "Local Manual"}`;

    btnMain.classList.add("active");
    setText(btnMainText, "Parar Trabalho");

    if (btnVisit) hide(btnVisit);
  } else {
    setText(statusLabel, "STATUS ATUAL");
    statusLabel.style.color = "#64748b";
    statusLoc.innerHTML = `<span>⚪</span> Não trabalhando`;

    btnMain.classList.remove("active");
    setText(btnMainText, "Check-in Manual");

    if (btnVisit) show(btnVisit, "flex");
    setTimerText("--:--");
  }
}

export function showGeofenceAlert({ siteName, onWork, onVisit }) {
  const box = $("geofence-alert");
  const msg = $("geo-msg");
  const btnWork = $("btn-geo-work");
  const btnVisit = $("btn-geo-visit");

  if (!box || !msg || !btnWork || !btnVisit) return;

  setText(msg, `Entrada detectada: ${siteName}`);
  show(box, "block");

  btnWork.onclick = () => {
    try { onWork?.(); } finally { hide(box); }
  };

  btnVisit.onclick = () => {
    try { onVisit?.(); } finally { hide(box); }
  };

  setTimeout(() => hide(box), 10000);
}

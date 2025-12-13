// src/ui.js
import { state } from "./state.js";

export const ui = {
  setGPSStatus(msg, styleClass, acc) {
    const bar = document.getElementById("gps-status-bar");
    if (!bar) return;
    bar.innerText = `${msg} (±${acc}m)`;
    bar.className = "gps-bar " + styleClass;
  },

  enableActionButtons() {
    document.querySelectorAll(".btn-big").forEach(btn => btn.classList.add("ready"));
    document.getElementById("btn-main-action")?.removeAttribute("disabled");
    document.getElementById("btn-visit-action")?.removeAttribute("disabled");
  },

  setMainButtonText(txt) {
    const el = document.getElementById("btn-main-text");
    if (el) el.innerText = txt;
  },

  setTimer(txt) {
    const el = document.getElementById("status-timer");
    if (el) el.innerText = txt;
  },

  setWorkingUI({ isWorking, siteName }) {
    const statusLabel = document.getElementById("status-label");
    const statusLoc = document.getElementById("status-loc");
    const btnMain = document.getElementById("btn-main-action");
    const btnMainText = document.getElementById("btn-main-text");
    const btnVisit = document.getElementById("btn-visit-action");

    if (!statusLabel || !statusLoc || !btnMain || !btnMainText || !btnVisit) return;

    if (isWorking) {
      statusLabel.innerText = "EM ANDAMENTO";
      statusLabel.style.color = "#ef4444";
      statusLoc.innerHTML = `<span>📍</span> ${siteName || "Local Manual"}`;

      btnMain.classList.add("active");
      btnMainText.innerText = "Parar Trabalho";
      btnVisit.style.display = "none";
    } else {
      statusLabel.innerText = "STATUS ATUAL";
      statusLabel.style.color = "#888";
      statusLoc.innerHTML = `<span>⚪</span> Não trabalhando`;

      btnMain.classList.remove("active");
      btnMainText.innerText = "Check-in Manual";
      btnVisit.style.display = "flex";
      ui.setTimer("--:--");
    }
  },

  showGeofenceAlert({ siteName, onWork, onVisit }) {
    const box = document.getElementById("geofence-alert");
    const msg = document.getElementById("geo-msg");
    const btnWork = document.getElementById("btn-geo-work");
    const btnVisit = document.getElementById("btn-geo-visit");
    if (!box || !msg || !btnWork || !btnVisit) return;

    msg.innerText = `Entrada detectada: ${siteName}`;
    box.style.display = "block";

    btnWork.onclick = () => { onWork?.(); box.style.display = "none"; };
    btnVisit.onclick = () => { onVisit?.(); box.style.display = "none"; };

    setTimeout(() => { box.style.display = "none"; }, 10000);
  },

  renderReports(reports) {
    const list = document.getElementById("report-list");
    if (!list) return;

    list.innerHTML = "";
    if (!reports?.length) {
      list.innerHTML = '<p style="text-align:center; color:#ccc;">Nenhum registro ainda.</p>';
      return;
    }

    for (const reg of reports) {
      const div = document.createElement("div");
      div.className = "report-card";

      const dataEntrada = new Date(reg.entrada);
      const dia = dataEntrada.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
      const horaEntrada = dataEntrada.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      let htmlContent = "";
      let textoShare = "";

      if (reg.saida) {
        const dataSaida = new Date(reg.saida);
        const diffMin = Math.floor((dataSaida - dataEntrada) / 60000);

        if (diffMin <= 1) {
          htmlContent = `<div style="color:#666; font-weight:bold; font-size:0.9rem;">👁️ Visita Técnica</div>`;
          textoShare = `Visita Técnica: ${reg.local_nome} - ${dia}`;
        } else {
          const h = Math.floor(diffMin / 60);
          const m = diffMin % 60;
          const horaSaida = dataSaida.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          htmlContent = `<div style="font-weight:bold; font-size:1.2rem;">${h}h ${m}m</div><div style="color:#888; font-size:0.8rem;">${horaEntrada} - ${horaSaida}</div>`;
          textoShare = `Trabalho: ${reg.local_nome} (${h}h ${m}m) em ${dia}`;
        }
      } else {
        htmlContent = `<div style="color:#ef4444; font-weight:bold;">Em andamento...</div>`;
        textoShare = `Trabalhando em ${reg.local_nome} agora.`;
      }

      div.innerHTML = `
        <div class="report-header">
          <span>${reg.local_nome}</span>
          <span style="color:#888; font-weight:normal">${dia}</span>
        </div>
        ${htmlContent}
        <div class="card-actions">
          <button class="action-btn-small" data-action="deleteReport" data-id="${reg.id}">🗑️</button>
          <button class="action-btn-small" data-action="shareReport" data-text="${escapeHtmlAttr(textoShare)}">📤</button>
        </div>
      `;

      list.appendChild(div);
    }
  },

  bindTabs() {
    const dashTab = document.getElementById("tab-dash");
    const mapTab = document.getElementById("tab-map");

    dashTab.onclick = () => {
      document.querySelectorAll(".tab-screen").forEach(el => el.classList.remove("active"));
      document.getElementById("dashboard-screen").classList.add("active");
      document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
      dashTab.classList.add("active");
    };

    mapTab.onclick = () => {
      document.querySelectorAll(".tab-screen").forEach(el => el.classList.remove("active"));
      document.getElementById("map-screen").classList.add("active");
      document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
      mapTab.classList.add("active");
      if (state.map) setTimeout(() => state.map.invalidateSize(), 100);
    };
  }
};

function escapeHtmlAttr(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

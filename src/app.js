// src/app.js
import { state } from "./state.js";
import { ui } from "./ui.js";
import { startGPS } from "./gps.js";
import { detectSiteByGeofence } from "./geofence.js";
import { startVisualTimer, stopVisualTimer } from "./timer.js";
import {
  fetchOpenRecord,
  createCheckIn,
  createVisit,
  finishShift,
  fetchReports,
  deleteReport,
  fetchSites,
  createSite,
  deleteSite
} from "./supabaseApi.js";

// ---------- INIT ----------
async function init() {
  initMap();
  ui.bindTabs();

  await hydrateWorkingState();
  await refreshReports();
  await refreshSitesOnMap();

  bindActions();

  // GPS
  startGPS({
    onUpdate: async ({ lat, lng, acc, msg, styleClass }) => {
      state.currentPos = { lat, lng };

      ui.setGPSStatus(msg, styleClass, acc);
      ui.enableActionButtons();
      if (!state.isWorking) ui.setMainButtonText("Check-in Manual");

      updateMapUserMarker(lat, lng, acc);

      const found = detectSiteByGeofence(lat, lng);
      if (found && (!state.currentSite || state.currentSite.id !== found.id)) {
        state.currentSite = found;

        ui.showGeofenceAlert({
          siteName: found.nome,
          onWork: () => doCheckIn(found.nome),
          onVisit: () => doVisit(found.nome),
        });
      } else if (!found && !state.isWorking) {
        state.currentSite = null;
      }
    }
  });
}

// ---------- MAP ----------
function initMap() {
  state.map = window.L.map("map", { zoomControl: false }).setView([45.4215, -75.6972], 13);

  window.L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Esri" }
  ).addTo(state.map);
}

function updateMapUserMarker(lat, lng, acc) {
  if (!state.map) return;

  if (!state.userMarker) {
    state.userMarker = window.L.marker([lat, lng]).addTo(state.map);
    state.accuracyCircle = window.L.circle([lat, lng], { radius: acc }).addTo(state.map);
    state.map.setView([lat, lng], 16);
  } else {
    state.userMarker.setLatLng([lat, lng]);
    state.accuracyCircle.setLatLng([lat, lng]);
    state.accuracyCircle.setRadius(acc);
  }
}

async function refreshSitesOnMap() {
  if (!state.map) return;

  // remove circles antigos (exceto accuracyCircle)
  state.map.eachLayer((layer) => {
    if (layer instanceof window.L.Circle && layer !== state.accuracyCircle) {
      state.map.removeLayer(layer);
    }
  });

  state.knownSites = await fetchSites();

  for (const site of state.knownSites) {
    const circle = window.L.circle([site.latitude, site.longitude], {
      color: "#333",
      fillColor: "#333",
      fillOpacity: 0.2,
      radius: site.raio || 100,
    }).addTo(state.map);

    // mantém simples: usa dataset e um handler global mínimo
    circle.bindPopup(`
      <b>${site.nome}</b><br>
      <button data-action="deleteSite" data-id="${site.id}" data-name="${site.nome}">Excluir</button>
    `);

    circle.on("popupopen", () => {
      const popupEl = document.querySelector(".leaflet-popup-content");
      if (!popupEl) return;

      popupEl.addEventListener("click", async (e) => {
        const btn = e.target?.closest?.("button[data-action='deleteSite']");
        if (!btn) return;

        const id = Number(btn.dataset.id);
        const name = btn.dataset.name;

        if (confirm(`Apagar a obra "${name}"?`)) {
          await deleteSite(id);
          await refreshSitesOnMap();
          state.map.closePopup();
        }
      }, { once: true });
    });
  }
}

// ---------- STATE HYDRATION ----------
async function hydrateWorkingState() {
  try {
    const open = await fetchOpenRecord(state.user.id);
    if (open) {
      state.isWorking = true;
      state.currentRecordId = open.id;
      state.startTime = new Date(open.entrada);
      state.currentSite = { nome: open.local_nome };

      ui.setWorkingUI({ isWorking: true, siteName: open.local_nome });
      startVisualTimer();
    } else {
      state.isWorking = false;
      state.currentRecordId = null;
      state.startTime = null;
      ui.setWorkingUI({ isWorking: false });
      stopVisualTimer();
    }
  } catch (e) {
    console.error(e);
    ui.setWorkingUI({ isWorking: false });
  }
}

// ---------- ACTIONS ----------
function bindActions() {
  // Botão criar site (map)
  document.getElementById("btn-create-site")?.addEventListener("click", async () => {
    if (!state.currentPos) return alert("Aguarde o GPS conectar.");

    const nome = prompt("Nome da nova Obra/Local:");
    if (!nome) return;

    try {
      await createSite({
        nome,
        latitude: state.currentPos.lat,
        longitude: state.currentPos.lng,
        raio: 100,
      });
      alert("Local Salvo!");
      await refreshSitesOnMap();
    } catch (e) {
      alert("Erro ao salvar local: " + (e?.message || e));
    }
  });

  // Main action (check-in / check-out)
  document.getElementById("btn-main-action")?.addEventListener("click", async () => {
    if (state.isWorking) {
      await doCheckOut();
    } else {
      const nome = state.currentSite?.nome || prompt("Nome do Local de Trabalho:");
      if (nome) await doCheckIn(nome);
    }
  });

  // Visit
  document.getElementById("btn-visit-action")?.addEventListener("click", async () => {
    const nome = state.currentSite?.nome || prompt("Nome do Local (Visita):");
    if (nome) await doVisit(nome);
  });

  // Delegação: delete/share em report list
  document.getElementById("report-list")?.addEventListener("click", async (e) => {
    const btn = e.target?.closest?.("button[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;

    if (action === "deleteReport") {
      const id = Number(btn.dataset.id);
      if (!confirm("Apagar este registro?")) return;
      try {
        await deleteReport(id);
        await refreshReports();
      } catch (err) {
        alert("Erro ao apagar: " + (err?.message || err));
      }
    }

    if (action === "shareReport") {
      const txt = btn.dataset.text || "";
      doShare(txt);
    }
  });
}

async function doCheckIn(nomeLocal) {
  try {
    const agora = new Date();
    const rec = await createCheckIn({
      userId: state.user.id,
      localNome: nomeLocal,
      entradaISO: agora.toISOString(),
    });

    state.isWorking = true;
    state.currentRecordId = rec?.id || null;
    state.startTime = agora;
    state.currentSite = state.currentSite || { nome: nomeLocal };

    ui.setWorkingUI({ isWorking: true, siteName: nomeLocal });
    startVisualTimer();

    await refreshReports();
  } catch (e) {
    alert("Erro ao salvar: " + (e?.message || e));
  }
}

async function doVisit(nomeLocal) {
  try {
    const agora = new Date();
    await createVisit({
      userId: state.user.id,
      localNome: nomeLocal,
      entradaISO: agora.toISOString(),
    });

    alert(`👁️ Visita registrada em ${nomeLocal}!`);
    await refreshReports();
  } catch (e) {
    alert("Erro: " + (e?.message || e));
  }
}

async function doCheckOut() {
  if (!state.currentRecordId) {
    // se perdeu o id, tenta re-hidratar
    await hydrateWorkingState();
    if (!state.currentRecordId) return alert("Não encontrei turno aberto.");
  }

  if (!confirm("Encerrar turno de trabalho?")) return;

  try {
    await finishShift({ recordId: state.currentRecordId, saidaISO: new Date().toISOString() });

    state.isWorking = false;
    state.currentRecordId = null;
    ui.setWorkingUI({ isWorking: false });
    stopVisualTimer();

    await refreshReports();
  } catch (e) {
    alert("Erro: " + (e?.message || e));
  }
}

function doShare(txt) {
  if (navigator.share) {
    navigator.share({ title: "OnSite", text: txt });
  } else {
    navigator.clipboard.writeText(txt);
    alert("Texto copiado!");
  }
}

// ---------- REPORTS ----------
async function refreshReports() {
  try {
    const reports = await fetchReports(state.user.id, 10);
    ui.renderReports(reports);
  } catch (e) {
    console.error(e);
    const list = document.getElementById("report-list");
    if (list) list.innerHTML = '<p style="text-align:center; color:#999; margin-top:30px">Erro ao carregar.</p>';
  }
}

// GO
init();

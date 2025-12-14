// src/fieldApp.js
import { startGPS } from "./core/gps.js";
import { state } from "./core/state.js";
import { checkGeofence } from "./core/geofence.js";
import { ensureMapReady, updateMapUser, drawSites, setDraftPoint } from "./core/map.js";
import { fetchSites, bindSitesUI } from "./core/sites.js";
import { hydrateWorkingState, checkIn, checkOut, visit } from "./core/records.js";
import { loadReports } from "./core/reports.js";
import { syncTimer } from "./core/timer.js";
import * as ui from "./core/ui.js";
import { bindTabs } from "./core/nav.js";


async function init() {
  try {
    state.knownSites = await fetchSites();
    await hydrateWorkingState(state);
    ui.renderWorkState(state);
    syncTimer(state);
    await loadReports(state);
  } catch (err) {
    console.error("Erro inicialização:", err);
  }

  bindMainActions();

  bindSitesUI(state, {
    ensureMapReady,
    setDraftPoint,
    drawSitesOnMap: () => drawSites(state),
    onAfterSitesChange: async () => {
      state.knownSites = await fetchSites();
      drawSites(state);
    }
  });

  // GPS
  startGPS((lat, lng, acc, msg, cls) => {
    state.currentPos = { lat, lng, acc };
    state.gpsOk = (cls === "active");

    ui.setGPSStatus(msg, cls, acc);
    if (state.gpsOk) ui.enableActions();

    if (state.mapInitialized) updateMapUser(state, lat, lng, acc);

    // Checa geofence
    checkGeofence(state, {
      onEnter: (site) => {
        ui.showGeofenceAlert({
          siteName: site.nome,
          onWork: () => doCheckIn(site.nome),
          onVisit: () => doVisit(site.nome)
        });
      }
    });
  }, ui);

  // Lazy map
  document.getElementById("tab-map")?.addEventListener("click", () => {
    ensureMapReady(state).then(() => {
      drawSites(state);
      if (state.currentPos) updateMapUser(state, state.currentPos.lat, state.currentPos.lng, state.currentPos.acc);
    });
  });
}

async function doCheckIn(localNome) {
  try {
    await checkIn(state, { localNome });
    ui.renderWorkState(state);
    syncTimer(state);
    await loadReports(state);
  } catch (e) {
    alert("Erro ao iniciar trabalho: " + (e?.message ?? e));
  }
}

async function doVisit(localNome) {
  try {
    await visit(state, { localNome });
    await loadReports(state);
    alert("Visita registrada!");
  } catch (e) {
    alert("Erro visita: " + (e?.message ?? e));
  }
}

async function doCheckOut() {
  try {
    if (!confirm("Encerrar trabalho atual?")) return;
    await checkOut(state);
    ui.renderWorkState(state);
    syncTimer(state);
    await loadReports(state);
  } catch (e) {
    alert("Erro ao encerrar: " + (e?.message ?? e));
  }
}

function bindMainActions() {
  const btnMain = document.getElementById("btn-main-action");
  const btnVisit = document.getElementById("btn-visit-action");

  btnMain?.addEventListener("click", async () => {
    if (state.isWorking) return doCheckOut();

    let nome = state.currentSite?.nome;
    if (!nome) nome = prompt("Nome do local para registro manual:");
    if (nome) doCheckIn(nome);
  });

  btnVisit?.addEventListener("click", async () => {
    let nome = state.currentSite?.nome;
    if (!nome) nome = prompt("Nome do local (Visita):");
    if (nome) doVisit(nome);
  });
}
bindTabs({
  onMapOpen: async () => {
    await ensureMapReady(state);
    drawSites(state);
    // Leaflet precisa disso quando o mapa aparece depois de estar hidden
    setTimeout(() => state.map?.invalidateSize?.(), 150);

    if (state.currentPos) {
      updateMapUser(state, state.currentPos.lat, state.currentPos.lng, state.currentPos.acc);
    }
  }
});

init();

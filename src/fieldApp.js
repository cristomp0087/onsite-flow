// src/fieldApp.js
import { startGPS } from "./core/gps.js";
import { state } from "./core/state.js";
import { checkGeofence } from "./core/geofence.js";
import { ensureMapReady, updateMapUser, drawSites, setDraftPoint } from "./core/map.js";
import { fetchSites, bindSitesUI } from "./core/sites.js";
import { hydrateWorkingState, checkIn, visit } from "./core/records.js";
import { loadReports } from "./core/reports.js";
import * as ui from "./core/ui.js";

async function init() {
  // 0) Botões e abas primeiro (não deixa o app “mudo” se algo falhar depois)
  bindMainActions();

  // 1) Sites/Mapa (cadastro de obra sem depender do GPS é OK)
  bindSitesUI(state, {
    ensureMapReady,
    setDraftPoint,
    drawSitesOnMap: () => drawSites(state),
    onAfterSitesChange: async () => {
      state.knownSites = await safeFetchSites();
      drawSites(state);
    },
  });

  document.getElementById("tab-map")?.addEventListener("click", () => {
    ensureMapReady(state).then(() => {
      drawSites(state);
      if (state.currentPos) {
        updateMapUser(state, state.currentPos.lat, state.currentPos.lng, state.currentPos.acc);
      }
    });
  });

  // 2) Carrega dados iniciais em background (sem travar o resto)
  safeBoot();

  // 3) GPS
  startGPS((lat, lng, acc, msg, cls) => {
    state.currentPos = { lat, lng, acc };

    // ✅ AQUI está o pulo do gato:
    // Se estiver em "MODO TESTE (OTTAWA)" a gente libera o app também.
    const isTestMode = typeof msg === "string" && msg.includes("MODO TESTE");
    state.gpsOk = (cls === "active") || isTestMode;

    ui.setGPSStatus(msg, cls, acc);

    if (state.gpsOk) ui.enableActions();
    else ui.disableActions?.(); // se existir no seu ui.js, ótimo; se não existir, ignora

    // Atualiza mapa se já estiver inicializado
    if (state.mapInitialized) {
      updateMapUser(state, lat, lng, acc);
    }

    // Geofence só faz sentido se eu tenho sites carregados
    if (state.knownSites?.length) {
      checkGeofence(state, {
        onEnter: (site) => {
          ui.showGeofenceAlert({
            siteName: site.nome,
            onWork: () => doCheckIn(site.nome),
            onVisit: () => doVisit(site.nome),
          });
        },
      });
    }
  }, ui);
}

async function safeBoot() {
  // tenta carregar sem “matar” o app se falhar
  state.knownSites = await safeFetchSites();

  try {
    await hydrateWorkingState(state);
  } catch (err) {
    console.warn("[BOOT] hydrateWorkingState falhou:", err);
  }

  try {
    await loadReports(state);
  } catch (err) {
    console.warn("[BOOT] loadReports falhou:", err);
    // se seu UI tiver algum render de erro, é aqui
  }
}

async function safeFetchSites() {
  try {
    return await fetchSites();
  } catch (err) {
    console.warn("[BOOT] fetchSites falhou:", err);
    return [];
  }
}

async function doCheckIn(localNome) {
  try {
    await checkIn(state, { localNome });
    await loadReports(state);
  } catch (e) {
    alert("Erro ao iniciar trabalho: " + (e?.message || e));
  }
}

async function doVisit(localNome) {
  try {
    await visit(state, { localNome });
    await loadReports(state);
    alert("Visita registrada!");
  } catch (e) {
    alert("Erro visita: " + (e?.message || e));
  }
}

function bindMainActions() {
  const btnMain = document.getElementById("btn-main-action");

  btnMain?.addEventListener("click", async () => {
    if (!state.gpsOk) {
      alert("Aguarde GPS (ou modo teste) para habilitar as ações.");
      return;
    }

    if (state.isWorking) {
      const { checkOut } = await import("./core/records.js");
      if (confirm("Encerrar trabalho atual?")) {
        await checkOut(state);
        await loadReports(state);
      }
    } else {
      let nome = state.currentSite?.nome;
      if (!nome) nome = prompt("Nome do local para registro manual:");
      if (nome) doCheckIn(nome);
    }
  });

  document.getElementById("btn-visit-action")?.addEventListener("click", () => {
    if (!state.gpsOk) {
      alert("Aguarde GPS (ou modo teste) para habilitar as ações.");
      return;
    }
    let nome = state.currentSite?.nome;
    if (!nome) nome = prompt("Nome do local (Visita):");
    if (nome) doVisit(nome);
  });
}

// Start
init();

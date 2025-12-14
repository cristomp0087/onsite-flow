// src/fieldApp.js
import { state } from "./core/state.js";

import { $, on, setText, hide, show } from "./core/dom.js";
import { setGPSStatus, enableActions, setMainButtonText, showGeofenceAlert } from "./core/ui.js";
import { startGPS } from "./core/gps.js";
import { checkGeofence } from "./core/geofence.js";

import { ensureMapReady, updateMapUser, setDraftPoint, drawSites } from "./core/map.js";

import { fetchSites, bindSitesUI, deleteSite } from "./core/sites.js";
import { hydrateWorkingState, checkIn, checkOut, visit } from "./core/records.js";
import { loadReports } from "./core/reports.js";

init().catch((e) => {
  console.error(e);
  alert("Erro ao iniciar: " + (e?.message || e));
});

/* ---------------------------
   INIT
---------------------------- */
async function init() {
  // 1) Tabs (dashboard/map)
  bindTabs();

  // 2) Load sites (para geofence e mapa)
  state.knownSites = await fetchSites();

  // 3) Estado: se já existe um registro aberto
  await hydrateWorkingState(state);

  // 4) Histórico
  await loadReports(state);

  // 5) Botões do dashboard
  bindDashboardActions();

  // 6) UI da aba Locais (search/endereço, pick no mapa, usar gps, salvar)
  bindSitesUI(state, {
    ensureMapReady,
    setDraftPoint,
    drawSitesOnMap: (s) => drawSites(s, { onDeleteClick: handleDeleteSite }),
    onAfterSitesChange: async () => {
      state.knownSites = await fetchSites();
    },
  });

  // 7) Start GPS
  startGPS(state, {
    onStatus: (msg, cls, acc) => setGPSStatus(msg, cls, acc),
    onLocation: async (pos, msg, cls) => {
      // UI
      setGPSStatus(msg, cls, pos.acc);
      enableActions();
      if (!state.isWorking) setMainButtonText("Check-in Manual");

      // Map user marker (se mapa já foi aberto)
      updateMapUser(state, pos.lat, pos.lng, pos.acc);

      // Geofence
      checkGeofence(state, {
        onEnter: (site) => {
          showGeofenceAlert({
            siteName: site.nome,
            onWork: async () => {
              await checkIn(state, { localNome: site.nome });
              await loadReports(state);
            },
            onVisit: async () => {
              await visit(state, { localNome: site.nome });
              await loadReports(state);
            },
          });
        },
      });
    },
  });
}

/* ---------------------------
   DASHBOARD ACTIONS
---------------------------- */
function bindDashboardActions() {
  on($("btn-main-action"), "click", async () => {
    try {
      if (state.isWorking) {
        if (!confirm("Encerrar turno de trabalho?")) return;
        await checkOut(state);
        await loadReports(state);
        return;
      }

      const local = state.currentSite?.nome || prompt("Nome do Local de Trabalho:");
      if (!local) return;

      await checkIn(state, { localNome: local });
      await loadReports(state);
    } catch (e) {
      alert("Erro: " + e.message);
    }
  });

  on($("btn-visit-action"), "click", async () => {
    try {
      const local = state.currentSite?.nome || prompt("Nome do Local (Visita):");
      if (!local) return;

      await visit(state, { localNome: local });
      await loadReports(state);
      alert(`👁️ Visita registrada em ${local}!`);
    } catch (e) {
      alert("Erro: " + e.message);
    }
  });
}

/* ---------------------------
   SITE DELETE (map popup)
---------------------------- */
async function handleDeleteSite(siteId) {
  if (!confirm("Apagar este local?")) return;

  try {
    await deleteSite(siteId);
    state.knownSites = await fetchSites();
    drawSites(state, { onDeleteClick: handleDeleteSite });
    state.map?.closePopup?.();
  } catch (e) {
    alert("Erro ao excluir: " + e.message);
  }
}

/* ---------------------------
   TABS (sem arquivo extra)
---------------------------- */
function bindTabs() {
  const tabDash = $("tab-dash");
  const tabMap = $("tab-map");

  const dashScreen = $("dashboard-screen");
  const mapScreen = $("map-screen");

  const navItems = document.querySelectorAll(".nav-item");
  const screens = document.querySelectorAll(".tab-screen");

  const activate = async (which) => {
    screens.forEach((el) => el.classList.remove("active"));
    navItems.forEach((el) => el.classList.remove("active"));

    if (which === "dash") {
      dashScreen?.classList.add("active");
      tabDash?.classList.add("active");
      return;
    }

    if (which === "map") {
      mapScreen?.classList.add("active");
      tabMap?.classList.add("active");

      // lazy init do mapa
      await ensureMapReady(state);

      // desenha locais
      drawSites(state, { onDeleteClick: handleDeleteSite });

      // garante render correto
      setTimeout(() => state.map?.invalidateSize?.(), 120);
    }
  };

  on(tabDash, "click", () => activate("dash"));
  on(tabMap, "click", () => activate("map"));
}

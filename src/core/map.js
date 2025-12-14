// src/core/map.js
const DEFAULT_RADIUS = 100;

export async function ensureMapReady(state) {
  if (state.mapInitialized) {
    state.map?.invalidateSize?.();
    return;
  }

  const el = document.getElementById("map");
  if (!el) return;

  if (typeof window.L === "undefined") {
    console.error("Leaflet não carregou. Confere <script leaflet.js> no HTML.");
    return;
  }

  const L = window.L;

  state.map = L.map("map", { zoomControl: false }).setView([45.4215, -75.6972], 13);

  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Esri" }
  ).addTo(state.map);

  state.mapInitialized = true;
  window.map = state.map; // debug

  // clique no mapa para selecionar ponto (se pickMode ativo)
  state.map.on("click", (e) => {
    if (!state.pickMode) return;
    setDraftPoint(state, e.latlng.lat, e.latlng.lng, true);
  });

  setTimeout(() => state.map.invalidateSize(), 120);
}

export function updateMapUser(state, lat, lng, acc) {
  if (!state.mapInitialized || !state.map || typeof window.L === "undefined") return;
  const L = window.L;

  if (!state.userMarker) {
    state.userMarker = L.marker([lat, lng]).addTo(state.map);
    state.accuracyCircle = L.circle([lat, lng], { radius: acc }).addTo(state.map);
  } else {
    state.userMarker.setLatLng([lat, lng]);
    state.accuracyCircle.setLatLng([lat, lng]);
    state.accuracyCircle.setRadius(acc);
  }
}

export function setDraftPoint(state, lat, lng, focus = false) {
  if (!state.mapInitialized || !state.map || typeof window.L === "undefined") return;
  const L = window.L;

  state.draftLatLng = { lat, lng };

  const info = document.getElementById("draft-info");
  const coords = document.getElementById("draft-coords");
  const btnSave = document.getElementById("btn-save-site");
  if (info) info.style.display = "flex";
  if (coords) coords.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  if (btnSave) btnSave.disabled = false;

  if (!state.draftMarker) {
    state.draftMarker = L.marker([lat, lng], { draggable: true }).addTo(state.map);
    state.draftMarker.on("dragend", () => {
      const p = state.draftMarker.getLatLng();
      state.draftLatLng = { lat: p.lat, lng: p.lng };
      if (coords) coords.textContent = `${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`;
    });
  } else {
    state.draftMarker.setLatLng([lat, lng]);
  }

  if (focus) state.map.setView([lat, lng], Math.max(state.map.getZoom(), 16));
}

export function drawSites(state, { onDeleteClick } = {}) {
  if (!state.mapInitialized || !state.map || typeof window.L === "undefined") return;
  const L = window.L;

  // remove antigos
  (state.siteCircles || []).forEach((c) => state.map.removeLayer(c));
  state.siteCircles = [];

  (state.knownSites || []).forEach((site) => {
    const circle = L.circle([site.latitude, site.longitude], {
      color: "#ff6a00",
      fillColor: "#ff6a00",
      fillOpacity: 0.15,
      radius: site.raio || DEFAULT_RADIUS,
    }).addTo(state.map);

    circle.bindPopup(`
      <b>${escapeHtml(site.nome)}</b><br/>
      Raio: ${site.raio || DEFAULT_RADIUS}m<br/>
      <button data-del-site="${site.id}" style="margin-top:8px; padding:8px 10px; border-radius:10px; border:1px solid rgba(0,0,0,0.12); cursor:pointer;">
        Excluir
      </button>
    `);

    circle.on("popupopen", () => {
      const popupRoot = document.querySelector(".leaflet-popup-content");
      popupRoot?.addEventListener(
        "click",
        (e) => {
          const btn = e.target.closest("button[data-del-site]");
          if (!btn) return;
          const id = Number(btn.dataset.delSite);
          onDeleteClick?.(id);
        },
        { once: true }
      );
    });

    state.siteCircles.push(circle);
  });
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

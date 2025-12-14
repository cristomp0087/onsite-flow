// src/core/geofence.js
const DEFAULT_RADIUS = 100;

export function checkGeofence(state, { onEnter } = {}) {
  if (state.isWorking) return;
  if (!state.currentPos) return;
  if (!state.knownSites?.length) return;
  if (typeof window.turf === "undefined") return;

  const { lat, lng } = state.currentPos;

  let found = null;

  for (const site of state.knownSites) {
    const dist = window.turf.distance(
      window.turf.point([lng, lat]),
      window.turf.point([site.longitude, site.latitude]),
      { units: "meters" }
    );

    const radius = site.raio || DEFAULT_RADIUS;
    if (dist < radius) {
      found = site;
      break;
    }
  }

  if (found && (!state.currentSite || state.currentSite.nome !== found.nome)) {
    state.currentSite = found;
    onEnter?.(found);
  }

  if (!found) state.currentSite = null;
}

// src/geofence.js
import { state } from "./state.js";

const ENTER_RADIUS_DEFAULT = 100;
const EXIT_RADIUS_BONUS = 30; // sai com raio+30
const MIN_CHECK_INTERVAL_MS = 4000;

export function detectSiteByGeofence(lat, lng) {
  if (state.isWorking) return null;
  if (!state.knownSites?.length) return null;

  const now = Date.now();
  if (now - state.geo.lastCheckAt < MIN_CHECK_INTERVAL_MS) return null;
  state.geo.lastCheckAt = now;

  let best = null;

  for (const site of state.knownSites) {
    const enterRadius = Number(site.raio || ENTER_RADIUS_DEFAULT);
    const exitRadius = enterRadius + EXIT_RADIUS_BONUS;

    const dist = window.turf.distance(
      window.turf.point([lng, lat]),
      window.turf.point([site.longitude, site.latitude]),
      { units: "meters" }
    );

    // Se já estava “dentro” deste site, respeita o exitRadius
    if (state.geo.inside && state.geo.lastSiteId === site.id) {
      if (dist <= exitRadius) {
        best = site;
        break;
      } else {
        state.geo.inside = false;
        state.geo.lastSiteId = null;
      }
    }

    // Entrada (enterRadius)
    if (!state.geo.inside && dist <= enterRadius) {
      best = site;
      state.geo.inside = true;
      state.geo.lastSiteId = site.id;
      break;
    }
  }

  return best;
}

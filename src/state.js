// src/state.js
export const state = {
  map: null,
  userMarker: null,
  accuracyCircle: null,

  currentPos: null,       // { lat, lng }
  knownSites: [],
  currentSite: null,      // { id?, nome, latitude?, longitude?, raio? }

  isWorking: false,
  currentRecordId: null,
  startTime: null,        // Date

  timerInterval: null,

  // “histerese” simples para geofence
  geo: {
    lastSiteId: null,
    inside: false,
    lastCheckAt: 0,
  },

  user: {
    id: getOrCreateUserId(),
    displayName: "Usuário Teste", // só UI
  }
};

function getOrCreateUserId() {
  let id = localStorage.getItem("onsite_user_id");
  if (!id) {
    id = (crypto?.randomUUID?.() || `u_${Math.random().toString(16).slice(2)}_${Date.now()}`);
    localStorage.setItem("onsite_user_id", id);
  }
  return id;
}

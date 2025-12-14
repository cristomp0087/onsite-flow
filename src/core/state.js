// src/core/state.js
// Estado único do app (field + admin). Mantém tudo previsível.

export const state = {
  // --- GPS ---
  gpsOk: false,
  currentPos: null, // { lat, lng, acc }

  // --- Sites / Geofence ---
  knownSites: [], // lista vinda do Supabase
  currentSite: null, // site detectado pelo geofence

  // --- Sessão de trabalho (field) ---
  isWorking: false,
  currentRecordId: null,
  startTime: null,
  timerInterval: null,

  // --- Mapa (field/admin) ---
  map: null,
  mapInitialized: false,
  userMarker: null,
  accuracyCircle: null,
  siteCircles: [],

  // --- Cadastro remoto de local (clicar no mapa / endereço) ---
  pickMode: false,
  draftLatLng: null,
  draftMarker: null,
};

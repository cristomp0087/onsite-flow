// src/fieldApp.js
import { startGPS } from "./core/gps.js";
import * as ui from "./core/ui.js";

// (Opcional) se você tiver um state central:
// import { setPosition } from "./core/state.js";

// (Opcional) se seu map.js expõe algo assim:
// import { ensureMap, updateUserMarker, renderSitesOnMap, invalidateMap } from "./core/map.js";

function onLocationUpdate(lat, lng, acc, msg, styleClass) {
  // 1) Atualiza barra do GPS (isso já resolve “travado”)
  if (ui?.setGPSStatus) ui.setGPSStatus(msg, styleClass, acc);

  // 2) Aqui você pluga o resto do app (se já existir nos seus módulos)
  // Exemplo (descomente se suas funções existirem):
  // setPosition({ lat, lng, acc });
  // ensureMap();
  // updateUserMarker(lat, lng, acc);

  // 3) Se você tiver geofence rodando por posição, chama aqui
  // Exemplo:
  // checkGeofence(lat, lng);

  // Debug útil
  console.log("[GPS]", lat, lng, acc, msg, styleClass);
}

function init() {
  // deixa o UI “vivo” mesmo antes do GPS
  if (ui?.boot) ui.boot();

  // CHAMADA CORRETA: (callback, ui)
  startGPS(onLocationUpdate, ui);
}

init();

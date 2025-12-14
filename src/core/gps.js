// src/core/gps.js
// Exporta startGPS (NOME EXATO) para o fieldApp importar sem quebrar.

let watchId = null;

const OTTAWA = { lat: 45.4215, lng: -75.6972 };

function safeSet(ui, msg, cls, acc = null) {
  try {
    if (ui && typeof ui.setGPSStatus === "function") ui.setGPSStatus(msg, cls, acc);
  } catch (_) {}
}

function safeOnLocationUpdate(onLocationUpdate, lat, lng, acc, msg, cls) {
  if (typeof onLocationUpdate === "function") {
    onLocationUpdate(lat, lng, acc, msg, cls);
  } else {
    console.warn("[gps] onLocationUpdate não foi passado/é inválido");
  }
}

/**
 * startGPS(onLocationUpdate, ui)
 * - onLocationUpdate(lat, lng, acc, msg, styleClass)
 * - ui.setGPSStatus(msg, styleClass, acc) (opcional)
 */
export function startGPS(onLocationUpdate, ui) {
  if (!("geolocation" in navigator)) {
    safeSet(ui, "🚫 SEM SUPORTE A GPS", "error", null);
    safeOnLocationUpdate(onLocationUpdate, OTTAWA.lat, OTTAWA.lng, 100, "⚠️ MODO TESTE (OTTAWA)", "error");
    return null;
  }

  const options = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 5000,
  };

  const onSuccess = (pos) => {
    const { latitude, longitude, accuracy } = pos.coords;
    safeOnLocationUpdate(
      onLocationUpdate,
      latitude,
      longitude,
      Math.round(accuracy),
      "📡 GPS ATIVO",
      "active"
    );
  };

  const onError = (err) => {
    // 1: PERMISSION_DENIED
    if (err?.code === 1) {
      safeSet(ui, "🚫 PERMISSÃO NEGADA", "error", null);
      return; // sem simulação aqui, o usuário precisa permitir
    }

    // 3: TIMEOUT -> tenta um getCurrentPosition menos exigente
    if (err?.code === 3) {
      safeSet(ui, "⏳ GPS LENTO… tentando novamente", "", null);

      navigator.geolocation.getCurrentPosition(
        onSuccess,
        () => {
          safeOnLocationUpdate(
            onLocationUpdate,
            OTTAWA.lat,
            OTTAWA.lng,
            100,
            "⚠️ MODO TESTE (OTTAWA)",
            "error"
          );
        },
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 }
      );
      return;
    }

    // 2: POSITION_UNAVAILABLE ou outros
    safeOnLocationUpdate(
      onLocationUpdate,
      OTTAWA.lat,
      OTTAWA.lng,
      100,
      "⚠️ MODO TESTE (OTTAWA)",
      "error"
    );
  };

  // (re)start watch
  try {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  } catch (_) {}

  watchId = navigator.geolocation.watchPosition(onSuccess, onError, options);
  return watchId;
}

export function stopGPS() {
  if (watchId !== null && "geolocation" in navigator) {
    navigator.geolocation.clearWatch(watchId);
  }
  watchId = null;
}

// src/core/gps.js
// startGPS(onLocationUpdate, ui)
// - onLocationUpdate(lat, lng, acc, msg, cls)
// - cls: "active" | "error" | "" (visual)

export function startGPS(onLocationUpdate, ui) {
  if (typeof onLocationUpdate !== "function") {
    console.error("[GPS] onLocationUpdate não foi passado/é inválido.");
    return () => {};
  }

  const options = {
    enableHighAccuracy: true,
    timeout: 15000,   // 15s
    maximumAge: 5000, // aceita cache recente
  };

  const OTTAWA = { lat: 45.4215, lng: -75.6972, acc: 100 };

  const emitTestMode = (reason = "MODO TESTE (OTTAWA)") => {
    // visualmente "error" (pra ficar claro que é teste),
    // mas a gente vai liberar o app no fieldApp.js.
    onLocationUpdate(OTTAWA.lat, OTTAWA.lng, OTTAWA.acc, `⚠️ ${reason}`, "error");
  };

  const onSuccess = (pos) => {
    const { latitude, longitude, accuracy } = pos.coords;
    onLocationUpdate(latitude, longitude, Math.round(accuracy), "📡 GPS ATIVO", "active");
  };

  const onError = (err) => {
    const code = err?.code;

    // 1: PERMISSION_DENIED
    if (code === 1) {
      ui?.setGPSStatus?.("🚫 PERMISSÃO NEGADA", "error", null);
      // Não simula aqui: se o user negou, ele precisa liberar.
      return;
    }

    // 3: TIMEOUT (comum)
    if (code === 3) {
      ui?.setGPSStatus?.("⏳ GPS LENTO… tentando novamente", "", null);

      // tenta de novo com menos exigência
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        () => emitTestMode("MODO TESTE (OTTAWA)"),
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 }
      );
      return;
    }

    // 2: POSITION_UNAVAILABLE ou outros
    emitTestMode("MODO TESTE (OTTAWA)");
  };

  if (!navigator.geolocation) {
    emitTestMode("SEM SUPORTE A GPS");
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(onSuccess, onError, options);

  // Retorna função de parar (se quiser usar depois)
  return () => navigator.geolocation.clearWatch(watchId);
}

// src/gps.js
export function startGPS({ onUpdate }) {
  const geoOptions = { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 };

  const onGeoSuccess = (pos) => {
    onUpdate({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      acc: Math.round(pos.coords.accuracy),
      msg: "📡 GPS ATIVO",
      styleClass: "active",
    });
  };

  const onGeoError = (err) => {
    console.warn("GPS Real falhou. Usando simulação Ottawa.", err);
    onUpdate({
      lat: 45.4215,
      lng: -75.6972,
      acc: 100,
      msg: "⚠️ MODO TESTE (OTTAWA)",
      styleClass: "error",
    });
  };

  if (!navigator.geolocation) {
    onGeoError("Sem suporte");
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(onGeoSuccess, onGeoError, geoOptions);
  return () => navigator.geolocation.clearWatch(watchId);
}

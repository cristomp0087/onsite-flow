// src/app.js
import { supabase } from "./config.js";
import { ui } from "./ui.js";

const USER_NAME = "Usuário Teste";
const DEFAULT_RADIUS = 100;

// estado (tudo aqui dentro pra não depender de state.js)
const state = {
  // gps
  currentPos: null,
  gpsOk: false,

  // geofence/sites
  knownSites: [],
  currentSite: null,

  // work session
  isWorking: false,
  currentRecordId: null,
  startTime: null,
  timerInterval: null,

  // map
  map: null,
  mapInitialized: false,
  userMarker: null,
  accuracyCircle: null,
  siteCircles: [],
};

init().catch((e) => console.error(e));

async function init() {
  // tabs: mapa lazy (só inicializa quando abrir)
  ui.bindTabs({ onMapOpen: ensureMapReady });

  // carrega locais logo no começo (geofence precisa disso)
  state.knownSites = await fetchSites();

  // recupera estado (se existe registro aberto)
  await hydrateWorkingState();

  // lista reports
  await loadReports();

  // ações principais
  bindActions();

  // inicia GPS
  startGPS();
}

/* ---------------------------
   GPS
---------------------------- */
function startGPS() {
  const options = {
    enableHighAccuracy: true,
    timeout: 15000,       // 15s (mais realista)
    maximumAge: 5000      // aceita cache recente
  };

  const onSuccess = (pos) => {
    const { latitude, longitude, accuracy } = pos.coords;
    onLocationUpdate(latitude, longitude, Math.round(accuracy), "📡 GPS ATIVO", "active");
  };

  const onError = (err) => {
    // 1: PERMISSION_DENIED
    if (err?.code === 1) {
      ui.setGPSStatus("🚫 PERMISSÃO NEGADA", "error", null);
      // aqui NÃO faz simulação, porque o usuário precisa liberar permissão
      return;
    }

    // 3: TIMEOUT (muito comum)
    if (err?.code === 3) {
      ui.setGPSStatus("⏳ GPS LENTO… tentando novamente", "", null);
      // tenta de novo com menos exigência
      navigator.geolocation.getCurrentPosition(onSuccess, () => {
        // fallback só se falhar novamente
        onLocationUpdate(45.4215, -75.6972, 100, "⚠️ MODO TESTE (OTTAWA)", "error");
      }, { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 });
      return;
    }

    // 2: POSITION_UNAVAILABLE ou outros
    onLocationUpdate(45.4215, -75.6972, 100, "⚠️ MODO TESTE (OTTAWA)", "error");
  };

  if (!navigator.geolocation) return onError({ code: 2 });

  navigator.geolocation.watchPosition(onSuccess, onError, options);
}


/* ---------------------------
   Geofence
---------------------------- */
function checkGeofence(lat, lng) {
  if (state.isWorking) return;
  if (!state.knownSites || state.knownSites.length === 0) return;
  if (typeof window.turf === "undefined") return;

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

    ui.showGeofenceAlert({
      siteName: found.nome,
      onWork: () => doCheckIn(found.nome),
      onVisit: () => doVisit(found.nome),
    });
  }

  if (!found) state.currentSite = null;
}

/* ---------------------------
   Timer (visual)
---------------------------- */
function startVisualTimer() {
  stopVisualTimer();

  const tick = () => {
    if (!state.startTime) return;
    const now = new Date();
    const diff = now - state.startTime;
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    ui.setTimerText(`${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`);
  };

  tick();
  state.timerInterval = setInterval(tick, 60000);
}

function stopVisualTimer() {
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.timerInterval = null;
}

/* ---------------------------
   Supabase: registros
---------------------------- */
async function hydrateWorkingState() {
  const { data, error } = await supabase
    .from("registros")
    .select("*")
    .is("saida", null)
    .order("entrada", { ascending: false })
    .limit(1);

  if (error) {
    console.warn("hydrateWorkingState erro:", error.message);
    ui.setWorkingUI({ isWorking: false });
    return;
  }

  if (data && data.length > 0) {
    const r = data[0];
    state.isWorking = true;
    state.currentRecordId = r.id;
    state.startTime = new Date(r.entrada);
    state.currentSite = { nome: r.local_nome };

    ui.setWorkingUI({ isWorking: true, siteName: r.local_nome });
    startVisualTimer();
  } else {
    state.isWorking = false;
    state.currentRecordId = null;
    state.startTime = null;
    ui.setWorkingUI({ isWorking: false });
    stopVisualTimer();
  }
}

async function doCheckIn(localNome) {
  const now = new Date();

  const { data, error } = await supabase
    .from("registros")
    .insert([{ local_nome: localNome, usuario: USER_NAME, entrada: now, saida: null }])
    .select();

  if (error) return alert("Erro ao salvar: " + error.message);

  state.isWorking = true;
  state.currentRecordId = data?.[0]?.id ?? null;
  state.startTime = now;
  state.currentSite = { nome: localNome };

  ui.setWorkingUI({ isWorking: true, siteName: localNome });
  startVisualTimer();
  await loadReports();
}

async function doCheckOut() {
  if (!state.currentRecordId) return;
  if (!confirm("Encerrar turno de trabalho?")) return;

  const { error } = await supabase
    .from("registros")
    .update({ saida: new Date() })
    .eq("id", state.currentRecordId);

  if (error) return alert("Erro: " + error.message);

  state.isWorking = false;
  state.currentRecordId = null;
  state.startTime = null;

  ui.setWorkingUI({ isWorking: false });
  stopVisualTimer();
  await loadReports();
}

async function doVisit(localNome) {
  const now = new Date();

  const { error } = await supabase
    .from("registros")
    .insert([{ local_nome: localNome, usuario: USER_NAME, entrada: now, saida: now }]);

  if (error) return alert("Erro: " + error.message);

  alert(`👁️ Visita registrada em ${localNome}!`);
  await loadReports();
}

/* ---------------------------
   Supabase: locais
---------------------------- */
async function fetchSites() {
  const { data, error } = await supabase.from("locais").select("*");
  if (error) {
    console.warn("fetchSites erro:", error.message);
    return [];
  }
  return data || [];
}

/* ---------------------------
   Reports UI
---------------------------- */
async function loadReports() {
  const list = document.getElementById("report-list");
  if (!list) return;

  const { data, error } = await supabase
    .from("registros")
    .select("*")
    .order("entrada", { ascending: false })
    .limit(10);

  if (error) {
    list.innerHTML = `<p style="text-align:center; color:#999; margin-top:30px">Erro ao carregar.</p>`;
    return;
  }

  list.innerHTML = "";
  if (!data || data.length === 0) {
    list.innerHTML = `<p style="text-align:center; color:#999; margin-top:30px">Nenhum registro ainda.</p>`;
    return;
  }

  data.forEach((reg) => {
    const div = document.createElement("div");
    div.className = "report-card";

    const dtIn = new Date(reg.entrada);
    const dia = dtIn.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    const horaIn = dtIn.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    let body = "";
    let shareTxt = "";

    if (reg.saida) {
      const dtOut = new Date(reg.saida);
      const diffMin = Math.floor((dtOut - dtIn) / 60000);

      if (diffMin <= 1) {
        body = `<div style="color:#666; font-weight:900; font-size:0.9rem;">👁️ Visita Técnica</div>`;
        shareTxt = `Visita Técnica: ${reg.local_nome} - ${dia}`;
      } else {
        const h = Math.floor(diffMin / 60);
        const m = diffMin % 60;
        const horaOut = dtOut.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        body = `<div style="font-weight:950; font-size:1.2rem;">${h}h ${m}m</div>
                <div style="color:#64748b; font-size:0.85rem;">${horaIn} - ${horaOut}</div>`;
        shareTxt = `Trabalho: ${reg.local_nome} (${h}h ${m}m) em ${dia}`;
      }
    } else {
      body = `<div style="color:#ef4444; font-weight:950;">Em andamento...</div>`;
      shareTxt = `Trabalhando em ${reg.local_nome} agora.`;
    }

    div.innerHTML = `
      <div class="report-header">
        <span>${escapeHtml(reg.local_nome || "-")}</span>
        <span style="color:#64748b; font-weight:800">${dia}</span>
      </div>
      ${body}
      <div class="card-actions">
        <button class="action-btn-small" data-del="${reg.id}">🗑️</button>
        <button class="action-btn-small" data-share="${encodeURIComponent(shareTxt)}">📤</button>
      </div>
    `;

    div.querySelector("[data-del]")?.addEventListener("click", async () => {
      const id = Number(div.querySelector("[data-del]").dataset.del);
      if (!confirm("Apagar este registro?")) return;
      const { error: delErr } = await supabase.from("registros").delete().eq("id", id);
      if (delErr) alert("Erro ao apagar: " + delErr.message);
      await loadReports();
    });

    div.querySelector("[data-share]")?.addEventListener("click", async () => {
      const txt = decodeURIComponent(div.querySelector("[data-share]").dataset.share || "");
      try {
        if (navigator.share) await navigator.share({ title: "OnSite", text: txt });
        else {
          await navigator.clipboard.writeText(txt);
          alert("Texto copiado!");
        }
      } catch (e) {
        console.warn(e);
      }
    });

    list.appendChild(div);
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

/* ---------------------------
   Actions
---------------------------- */
function bindActions() {
  document.getElementById("btn-main-action")?.addEventListener("click", async () => {
    if (state.isWorking) return doCheckOut();

    const name = state.currentSite?.nome || prompt("Nome do Local de Trabalho:");
    if (!name) return;

    await doCheckIn(name);
  });

  document.getElementById("btn-visit-action")?.addEventListener("click", async () => {
    const name = state.currentSite?.nome || prompt("Nome do Local (Visita):");
    if (!name) return;

    await doVisit(name);
  });

  document.getElementById("btn-create-site")?.addEventListener("click", async () => {
    if (!state.currentPos) return alert("Aguarde o GPS conectar.");
    if (!state.mapInitialized) await ensureMapReady();

    const nome = prompt("Nome da nova Obra/Local:");
    if (!nome) return;

    const payload = {
      nome,
      latitude: state.currentPos.lat,
      longitude: state.currentPos.lng,
      raio: DEFAULT_RADIUS,
    };

    const { error } = await supabase.from("locais").insert([payload]);
    if (error) return alert("Erro ao salvar local: " + error.message);

    alert("Local salvo!");
    state.knownSites = await fetchSites();
    redrawSitesOnMap();
  });
}

/* ---------------------------
   Map (lazy init)
---------------------------- */
async function ensureMapReady() {
  if (state.mapInitialized) {
    state.map?.invalidateSize?.();
    return;
  }

  const mapEl = document.getElementById("map");
  if (!mapEl) return;

  if (typeof window.L === "undefined") {
    console.error("Leaflet não carregou (window.L undefined). Confere o <script leaflet.js> no HTML.");
    return;
  }

  state.map = window.L.map("map", { zoomControl: false }).setView([45.4215, -75.6972], 13);

  window.L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Esri" }
  ).addTo(state.map);

  state.mapInitialized = true;
  window.map = state.map; // útil pra debug

  // desenha locais
  redrawSitesOnMap();

  // garante layout correto ao abrir a aba
  setTimeout(() => state.map.invalidateSize(), 120);
}

function updateMapUser(lat, lng, acc) {
  if (!state.mapInitialized || !state.map || typeof window.L === "undefined") return;

  if (!state.userMarker) {
    state.userMarker = window.L.marker([lat, lng]).addTo(state.map);
    state.accuracyCircle = window.L.circle([lat, lng], { radius: acc }).addTo(state.map);
    state.map.setView([lat, lng], 16);
  } else {
    state.userMarker.setLatLng([lat, lng]);
    state.accuracyCircle.setLatLng([lat, lng]);
    state.accuracyCircle.setRadius(acc);
  }
}

function redrawSitesOnMap() {
  if (!state.mapInitialized || !state.map) return;

  // remove círculos antigos
  state.siteCircles.forEach((c) => state.map.removeLayer(c));
  state.siteCircles = [];

  (state.knownSites || []).forEach((site) => {
    const circle = window.L.circle([site.latitude, site.longitude], {
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
      const popupEl = document.querySelector(".leaflet-popup-content");
      popupEl?.addEventListener(
        "click",
        async (e) => {
          const btn = e.target.closest("button[data-del-site]");
          if (!btn) return;

          const id = Number(btn.dataset.delSite);
          if (!confirm("Apagar este local?")) return;

          const { error } = await supabase.from("locais").delete().eq("id", id);
          if (error) return alert("Erro ao excluir: " + error.message);

          state.knownSites = await fetchSites();
          redrawSitesOnMap();
          state.map.closePopup();
        },
        { once: true }
      );
    });

    state.siteCircles.push(circle);
  });
}

// src/adminApp.js
import { supabase } from "./config.js";

let map;
let siteLayers = [];
let draftMarker = null;
let draftLatLng = null;

init();

async function init() {
  initMap();
  wireUI();
  await loadSites();
  await loadRecords();
}

function initMap() {
  map = L.map("admin-map", { zoomControl: true }).setView([45.4215, -75.6972], 12);

  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Esri" }
  ).addTo(map);

  map.on("click", (e) => {
    draftLatLng = e.latlng;
    upsertDraftMarker(draftLatLng);
    updateCoordsUI();
    validateDraft();
  });
}

function upsertDraftMarker(latlng) {
  if (!draftMarker) {
    draftMarker = L.marker(latlng, { draggable: true }).addTo(map);
    draftMarker.on("dragend", () => {
      draftLatLng = draftMarker.getLatLng();
      updateCoordsUI();
      validateDraft();
    });
  } else {
    draftMarker.setLatLng(latlng);
  }
}

function wireUI() {
  document.getElementById("admin-refresh-sites").addEventListener("click", loadSites);
  document.getElementById("admin-refresh-records").addEventListener("click", loadRecords);

  document.getElementById("admin-save-site").addEventListener("click", async () => {
    const name = document.getElementById("admin-site-name").value.trim();
    const radius = Number(document.getElementById("admin-site-radius").value || 100);

    if (!draftLatLng) return alert("Clique no mapa para definir a localização.");
    if (!name) return alert("Digite um nome para a obra.");

    const payload = {
      nome: name,
      latitude: draftLatLng.lat,
      longitude: draftLatLng.lng,
      raio: radius,
    };

    const { error } = await supabase.from("locais").insert([payload]);
    if (error) return alert("Erro ao salvar local: " + error.message);

    document.getElementById("admin-site-name").value = "";
    document.getElementById("admin-save-site").disabled = true;

    await loadSites();
  });

  // filtros simples (client-side)
  document.getElementById("admin-filter-user").addEventListener("input", () => loadRecords({ clientFilter: true }));
  document.getElementById("admin-filter-site").addEventListener("input", () => loadRecords({ clientFilter: true }));
}

function updateCoordsUI() {
  const el = document.getElementById("admin-site-coords");
  if (!draftLatLng) {
    el.textContent = "clique no mapa…";
  } else {
    el.textContent = `${draftLatLng.lat.toFixed(6)}, ${draftLatLng.lng.toFixed(6)}`;
  }
}

function validateDraft() {
  const name = document.getElementById("admin-site-name").value.trim();
  document.getElementById("admin-save-site").disabled = !(name && draftLatLng);
}

async function loadSites() {
  // limpa layers
  siteLayers.forEach(l => map.removeLayer(l));
  siteLayers = [];

  const { data, error } = await supabase.from("locais").select("*");
  if (error) return alert("Erro ao carregar locais: " + error.message);

  data.forEach((site) => {
    const circle = L.circle([site.latitude, site.longitude], {
      color: "#ff6a00",
      fillColor: "#ff6a00",
      fillOpacity: 0.15,
      radius: site.raio || 100,
    }).addTo(map);

    circle.bindPopup(`
      <b>${escapeHtml(site.nome)}</b><br/>
      Raio: ${site.raio || 100}m<br/>
      <button data-del-site="${site.id}" style="margin-top:8px; padding:8px 10px; border-radius:10px; border:1px solid rgba(0,0,0,0.12); cursor:pointer;">
        Excluir
      </button>
    `);

    circle.on("popupopen", () => {
      const popupEl = document.querySelector(".leaflet-popup-content");
      popupEl?.addEventListener("click", async (e) => {
        const btn = e.target.closest("button[data-del-site]");
        if (!btn) return;
        const id = Number(btn.dataset.delSite);
        if (!confirm("Excluir este local?")) return;

        const { error: delErr } = await supabase.from("locais").delete().eq("id", id);
        if (delErr) return alert("Erro ao excluir: " + delErr.message);

        map.closePopup();
        await loadSites();
      }, { once: true });
    });

    siteLayers.push(circle);
  });
}

async function loadRecords({ clientFilter = false } = {}) {
  // pega mais pra filtrar sem ficar batendo no banco toda hora
  const { data, error } = await supabase
    .from("registros")
    .select("*")
    .order("entrada", { ascending: false })
    .limit(200);

  if (error) return alert("Erro ao carregar registros: " + error.message);

  const userQ = document.getElementById("admin-filter-user").value.trim().toLowerCase();
  const siteQ = document.getElementById("admin-filter-site").value.trim().toLowerCase();

  let rows = data || [];
  if (clientFilter && (userQ || siteQ)) {
    rows = rows.filter(r => {
      const u = String(r.usuario || "").toLowerCase();
      const s = String(r.local_nome || "").toLowerCase();
      return (!userQ || u.includes(userQ)) && (!siteQ || s.includes(siteQ));
    });
  }

  renderRecords(rows);
  renderKPIs(rows);
}

function renderRecords(rows) {
  const tbody = document.getElementById("admin-records-body");
  tbody.innerHTML = "";

  rows.forEach(r => {
    const entrada = r.entrada ? new Date(r.entrada) : null;
    const saida = r.saida ? new Date(r.saida) : null;

    const status = r.saida ? "finalizado" : "em andamento";
    const statusColor = r.saida ? "#16a34a" : "#ef4444";

    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid rgba(0,0,0,0.06)";
    tr.innerHTML = `
      <td style="padding:12px; font-weight:900;">${escapeHtml(r.usuario || "-")}</td>
      <td style="padding:12px; font-weight:900;">${escapeHtml(r.local_nome || "-")}</td>
      <td style="padding:12px;">${entrada ? entrada.toLocaleString() : "-"}</td>
      <td style="padding:12px;">${saida ? saida.toLocaleString() : "-"}</td>
      <td style="padding:12px; font-weight:950; color:${statusColor};">${status}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderKPIs(rows) {
  const open = rows.filter(r => !r.saida).length;
  const closed = rows.filter(r => r.saida).length;
  document.getElementById("admin-kpis").textContent = `Em andamento: ${open} • Finalizados: ${closed} • Total: ${rows.length}`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

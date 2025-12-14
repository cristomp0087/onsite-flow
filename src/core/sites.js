// src/core/sites.js
import { apiSelect, apiInsert, apiDelete, apiUpdate } from "./api.js";
import { $, debounce, escapeHtml, show, hide, enable, disable } from "./dom.js";

const DEFAULT_RADIUS = 100;

/* ---------------------------
   DB: LOCAIS
---------------------------- */
export async function fetchSites() {
  return await apiSelect("locais");
}

export async function createSite({ nome, latitude, longitude, raio = DEFAULT_RADIUS }) {
  const rows = await apiInsert("locais", [
    { nome, latitude, longitude, raio: raio ?? DEFAULT_RADIUS },
  ]);
  return rows?.[0] ?? null;
}

export async function deleteSite(id) {
  await apiDelete("locais", (q) => q.eq("id", id));
  return true;
}

export async function updateSite(id, patch) {
  const rows = await apiUpdate("locais", patch, (q) => q.eq("id", id));
  return rows?.[0] ?? null;
}

/* ---------------------------
   ADDRESS SEARCH (Nominatim / OSM) — MVP
   Nota: para produção, ideal usar proxy/servidor por rate-limit.
---------------------------- */
export async function searchAddress(query, { limit = 5 } = {}) {
  const q = query.trim();
  if (q.length < 4) return [];

  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=" +
    encodeURIComponent(String(limit)) +
    "&addressdetails=1&q=" +
    encodeURIComponent(q);

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/* ---------------------------
   UI: Bind do overlay de "Locais"
   Espera IDs no HTML:
   - site-search
   - site-search-results
   - btn-pick-on-map
   - btn-use-gps
   - btn-save-site
   - pick-hint
   - draft-info
   - draft-coords
---------------------------- */
export function bindSitesUI(state, deps) {
  const {
    ensureMapReady,
    setDraftPoint,
    drawSitesOnMap,
    onAfterSitesChange, // opcional: callback pra recarregar state.knownSites
  } = deps;

  const btnPick = $("btn-pick-on-map");
  const btnUseGps = $("btn-use-gps");
  const btnSave = $("btn-save-site");
  const hint = $("pick-hint");

  const searchInput = $("site-search");
  const resultsBox = $("site-search-results");

  // 1) Marcar no mapa (não precisa GPS)
  btnPick?.addEventListener("click", async () => {
    await ensureMapReady?.(state);
    state.pickMode = true;
    if (hint) show(hint, "block");
    alert("Toque/clique no mapa para escolher o ponto da obra.");
  });

  // 2) Usar posição do GPS (se existir)
  btnUseGps?.addEventListener("click", async () => {
    await ensureMapReady?.(state);

    if (!state.currentPos) {
      alert("GPS ainda não conectou. Você pode clicar no mapa ou buscar por endereço.");
      return;
    }

    state.pickMode = false;
    if (hint) hide(hint);

    setDraftPoint?.(state, state.currentPos.lat, state.currentPos.lng, true);
  });

  // 3) Salvar local (usa draftLatLng OU GPS)
  btnSave?.addEventListener("click", async () => {
    await ensureMapReady?.(state);

    const nome = prompt("Nome da Obra/Local:");
    if (!nome) return;

    const lat = state.draftLatLng?.lat ?? state.currentPos?.lat;
    const lng = state.draftLatLng?.lng ?? state.currentPos?.lng;

    if (lat == null || lng == null) {
      alert("Sem coordenadas. Clique no mapa, busque um endereço, ou use o GPS.");
      return;
    }

    try {
      await createSite({ nome, latitude: lat, longitude: lng, raio: DEFAULT_RADIUS });

      // atualiza state.knownSites e redesenha
      if (onAfterSitesChange) {
        await onAfterSitesChange();
      } else {
        state.knownSites = await fetchSites();
      }

      drawSitesOnMap?.(state);
      alert("Local salvo!");

      state.pickMode = false;
      if (hint) hide(hint);
    } catch (e) {
      alert("Erro ao salvar local: " + e.message);
    }
  });

  // 4) Busca por endereço (preenche resultados)
  if (searchInput && resultsBox) {
    const doSearch = debounce(async () => {
      const q = searchInput.value.trim();
      if (q.length < 4) {
        resultsBox.innerHTML = "";
        return;
      }

      resultsBox.innerHTML = `<div class="search-item">Buscando…</div>`;

      try {
        const items = await searchAddress(q, { limit: 5 });
        renderSearchResults(items, resultsBox, async (item) => {
          await ensureMapReady?.(state);

          const lat = Number(item.lat);
          const lng = Number(item.lon);

          state.pickMode = false;
          if (hint) hide(hint);

          setDraftPoint?.(state, lat, lng, true);
          resultsBox.innerHTML = "";
          searchInput.blur();
        });
      } catch (e) {
        console.warn(e);
        resultsBox.innerHTML = `<div class="search-item">Erro ao buscar endereço.</div>`;
      }
    }, 350);

    searchInput.addEventListener("input", doSearch);
  }
}

function renderSearchResults(items, box, onPick) {
  if (!Array.isArray(items) || items.length === 0) {
    box.innerHTML = `<div class="search-item">Nenhum resultado.</div>`;
    return;
  }

  box.innerHTML = items
    .map(
      (it, idx) => `
      <button class="search-item" type="button" data-idx="${idx}">
        ${escapeHtml(it.display_name)}
      </button>
    `
    )
    .join("");

  box.querySelectorAll("[data-idx]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.idx);
      onPick?.(items[idx]);
    });
  });
}

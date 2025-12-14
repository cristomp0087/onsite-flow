// src/core/reports.js
import { supabase } from "../config.js";

// ✅ Ajuste aqui se seu nome de tabela for outro
const TABLE = "registros";

// ✅ Temporário (até login)
const TEMP_USER_NAME = "Cristony";

const SELECT_HOLD_MS = 520;

let uiBound = false;
let selectionMode = false;
let selectedIds = new Set();
let holdTimer = null;
let holdTargetId = null;

// ---------- Public API ----------
export async function loadReports(state) {
  const listEl = document.getElementById("report-list");
  if (!listEl) return;

  bindReportsUIOnce(state, listEl);

  // UI loading
  listEl.innerHTML = `
    <div class="empty-state">
      <div class="spinner" aria-hidden="true"></div>
      <p>Carregando...</p>
    </div>
  `;

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80);

    if (error) throw error;

    // guarda em state (opcional)
    state.reports = Array.isArray(data) ? data : [];

    renderReports(listEl, state.reports);
  } catch (err) {
    console.error("Erro ao carregar relatórios:", err);

    listEl.innerHTML = `
      <div class="empty-state">
        <p style="text-align:center">
          ⚠️ Erro ao carregar relatórios.<br/>
          Abra o console para detalhes.
        </p>
      </div>
    `;
  }
}

// ---------- UI Binding ----------
function bindReportsUIOnce(state, listEl) {
  if (uiBound) return;
  uiBound = true;

  // Click (delegation)
  listEl.addEventListener("click", async (e) => {
    const card = e.target.closest("[data-report-id]");
    if (!card) return;

    const id = card.getAttribute("data-report-id");

    // Delete
    if (e.target.closest("[data-action='delete']")) {
      e.preventDefault();
      e.stopPropagation();
      await onDelete(state, id);
      return;
    }

    // Share single
    if (e.target.closest("[data-action='share']")) {
      e.preventDefault();
      e.stopPropagation();
      const report = findReportById(state, id);
      if (!report) return;
      await shareSelectedReports([report]);
      return;
    }

    // Toggle selection if in selectionMode
    if (selectionMode) {
      toggleSelected(id);
      updateSelectionUI();
      return;
    }

    // Normal tap: nada (ou futuramente abrir detalhe)
  });

  // Long press handlers (touch + mouse)
  const startHold = (id) => {
    clearHold();
    holdTargetId = id;
    holdTimer = setTimeout(() => {
      // enter selection mode
      selectionMode = true;
      selectedIds.add(id);
      ensureSelectionBar();
      updateSelectionUI();
    }, SELECT_HOLD_MS);
  };

  const endHold = () => clearHold();

  // touch
  listEl.addEventListener("touchstart", (e) => {
    const card = e.target.closest("[data-report-id]");
    if (!card) return;
    const id = card.getAttribute("data-report-id");

    // não dispara hold se tocou em botões
    if (e.target.closest("[data-action]")) return;

    startHold(id);
  }, { passive: true });

  listEl.addEventListener("touchend", endHold, { passive: true });
  listEl.addEventListener("touchmove", endHold, { passive: true });
  listEl.addEventListener("touchcancel", endHold, { passive: true });

  // mouse
  listEl.addEventListener("mousedown", (e) => {
    const card = e.target.closest("[data-report-id]");
    if (!card) return;
    const id = card.getAttribute("data-report-id");
    if (e.target.closest("[data-action]")) return;
    startHold(id);
  });

  window.addEventListener("mouseup", endHold);

  // Selection bar actions
  document.addEventListener("click", async (e) => {
    // share selected
    if (e.target.closest("#sel-share")) {
      const reports = Array.from(selectedIds)
        .map((id) => findReportById(state, id))
        .filter(Boolean);

      if (!reports.length) return;
      await shareSelectedReports(reports);
      return;
    }

    // cancel selection
    if (e.target.closest("#sel-cancel")) {
      exitSelectionMode();
      updateSelectionUI();
      return;
    }
  });
}

function clearHold() {
  if (holdTimer) clearTimeout(holdTimer);
  holdTimer = null;
  holdTargetId = null;
}

// ---------- Render ----------
function renderReports(listEl, reports) {
  if (!Array.isArray(reports) || reports.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <p>Sem registros ainda.</p>
      </div>
    `;
    exitSelectionMode();
    updateSelectionUI();
    return;
  }

  // render cards
  listEl.innerHTML = reports.map((r) => renderCardHTML(r)).join("");

  // depois de render, re-aplica seleção visual se existir
  updateSelectionUI();
}

function renderCardHTML(r) {
  const id = safeId(r);

  const site = getSiteName(r) || "—";
  const kind = getKindLabel(r); // "Trabalho" / "Visita"
  const status = getStatusLabel(r); // "Em andamento..." / "Concluído"
  const dateLabel = formatDateShort(getStartISO(r) || r.created_at);

  const inISO = getStartISO(r);
  const outISO = getEndISO(r);

  const inTime = inISO ? formatTime(inISO) : "--:--";
  const outTime = outISO ? formatTime(outISO) : "—";
  const total = calcTotalLabel(inISO, outISO);

  // Ações por card: share/delete (sem <a download> => sem baixar nada no celular)
  return `
    <article class="report-card" data-report-id="${id}">
      <div class="report-header">
        <div class="report-title">
          <div class="report-site">${escapeHtml(site)}</div>
          <div class="report-kind">${kind} <span class="report-status">${status}</span></div>
        </div>
        <div class="report-date">${dateLabel}</div>
      </div>

      <div class="report-meta">
        <div class="report-row">
          <span class="report-label">Entrada</span>
          <span class="report-val">${inTime}</span>
        </div>
        <div class="report-row">
          <span class="report-label">Saída</span>
          <span class="report-val">${outTime}</span>
        </div>
        <div class="report-row">
          <span class="report-label">Total</span>
          <span class="report-val">${total}</span>
        </div>
      </div>

      <div class="card-actions">
        <button class="action-btn-small" data-action="delete" title="Excluir" aria-label="Excluir">🗑️</button>
        <button class="action-btn-small" data-action="share" title="Compartilhar" aria-label="Compartilhar">📤</button>
      </div>
    </article>
  `;
}

// ---------- Delete (fix loop) ----------
async function onDelete(state, id) {
  const ok = confirm("Excluir este relatório?");
  if (!ok) return;

  try {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;

    // remove do state e re-render
    state.reports = (state.reports || []).filter((r) => safeId(r) !== id);
    const listEl = document.getElementById("report-list");
    if (listEl) renderReports(listEl, state.reports);

    // se estava selecionado, remove
    if (selectedIds.has(id)) {
      selectedIds.delete(id);
      updateSelectionUI();
    }
  } catch (e) {
    console.error("Erro ao excluir:", e);
    alert("Não foi possível excluir. Veja o console.");
  }
}

// ---------- Selection Mode ----------
function toggleSelected(id) {
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);

  if (selectedIds.size === 0) exitSelectionMode();
}

function exitSelectionMode() {
  selectionMode = false;
  selectedIds.clear();
  const bar = document.getElementById("selection-bar");
  if (bar) bar.classList.remove("show");
}

function ensureSelectionBar() {
  let bar = document.getElementById("selection-bar");
  if (bar) {
    bar.classList.add("show");
    return;
  }

  bar = document.createElement("div");
  bar.id = "selection-bar";
  bar.className = "selection-bar show";
  bar.innerHTML = `
    <div class="selection-bar-inner">
      <div class="selection-count" id="sel-count">0 selecionados</div>
      <div class="selection-actions">
        <button class="btn btn-ghost" id="sel-cancel" type="button">Cancelar</button>
        <button class="btn btn-primary" id="sel-share" type="button">Compartilhar</button>
      </div>
    </div>
  `;
  document.body.appendChild(bar);
}

function updateSelectionUI() {
  // highlight cards
  document.querySelectorAll("[data-report-id]").forEach((el) => {
    const id = el.getAttribute("data-report-id");
    if (selectionMode && selectedIds.has(id)) el.classList.add("selected");
    else el.classList.remove("selected");
  });

  const bar = document.getElementById("selection-bar");
  const countEl = document.getElementById("sel-count");

  if (!selectionMode) {
    if (bar) bar.classList.remove("show");
    return;
  }

  if (bar) bar.classList.add("show");
  if (countEl) countEl.textContent = `${selectedIds.size} selecionado(s)`;
}

// ---------- Share (NO DOWNLOAD) ----------
async function shareSelectedReports(reports) {
  // monta texto
  const payload = buildShareText(reports);

  // tenta Web Share (celular)
  if (navigator.share) {
    try {
      await navigator.share({
        title: "OnSite Flow — Relatório",
        text: payload
      });
      return;
    } catch (e) {
      // usuário cancelou share ou navegador bloqueou — segue pro clipboard
    }
  }

  // fallback: copia texto (sem baixar arquivo)
  try {
    await navigator.clipboard.writeText(payload);
    alert("Relatório copiado. Cole no WhatsApp/Email.");
  } catch (e) {
    // fallback final
    prompt("Copie o relatório:", payload);
  }
}

function buildShareText(reports) {
  const lines = [];
  lines.push("OnSite Flow — Relatório");
  lines.push(`Pessoa: ${TEMP_USER_NAME}`);
  lines.push("");

  // ordena por data de entrada
  const sorted = [...reports].sort((a, b) => {
    const ai = new Date(getStartISO(a) || a.created_at).getTime();
    const bi = new Date(getStartISO(b) || b.created_at).getTime();
    return ai - bi;
  });

  let totalMs = 0;

  for (const r of sorted) {
    const site = getSiteName(r) || "—";
    const inISO = getStartISO(r);
    const outISO = getEndISO(r);

    const dateLabel = formatDateLong(inISO || r.created_at);
    const inTime = inISO ? formatTime(inISO) : "--:--";
    const outTime = outISO ? formatTime(outISO) : "—";
    const durMs = calcDurationMs(inISO, outISO);
    if (durMs) totalMs += durMs;

    lines.push(`${dateLabel} — ${site}`);
    lines.push(`Entrada: ${inTime} | Saída: ${outTime} | Total: ${formatDuration(durMs)}`);
    lines.push("");
  }

  if (sorted.length > 1) {
    lines.push(`TOTAL (selecionados): ${formatDuration(totalMs)}`);
  }

  return lines.join("\n");
}

// ---------- Helpers / Data mapping ----------
function findReportById(state, id) {
  return (state.reports || []).find((r) => safeId(r) === id);
}

function safeId(r) {
  // id pode ser number
  return String(r?.id ?? "");
}

// tenta pegar nome do local em campos comuns
function getSiteName(r) {
  return (
    r?.local_nome ??
    r?.localNome ??
    r?.obra ??
    r?.site ??
    r?.site_name ??
    r?.nome_obra ??
    r?.nome ??
    ""
  );
}

function getKindLabel(r) {
  const t = (r?.tipo || r?.type || r?.kind || "").toString().toLowerCase();
  if (t.includes("visit")) return "👁️ Visita Técnica";
  if (t.includes("visita")) return "👁️ Visita Técnica";
  return "📌 Trabalho";
}

function getStatusLabel(r) {
  const outISO = getEndISO(r);
  if (!outISO) return `<span class="status-pill status-open">Em andamento...</span>`;
  return `<span class="status-pill status-done">Concluído</span>`;
}

// campos de data/hora (ajuste se precisar)
function getStartISO(r) {
  return (
    r?.inicio ??
    r?.start_time ??
    r?.check_in ??
    r?.checkin ??
    r?.entrada ??
    r?.started_at ??
    r?.created_at ??
    null
  );
}

function getEndISO(r) {
  return (
    r?.fim ??
    r?.end_time ??
    r?.check_out ??
    r?.checkout ??
    r?.saida ??
    r?.ended_at ??
    null
  );
}

function calcDurationMs(inISO, outISO) {
  if (!inISO || !outISO) return 0;
  const a = new Date(inISO).getTime();
  const b = new Date(outISO).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  const d = b - a;
  return d > 0 ? d : 0;
}

function calcTotalLabel(inISO, outISO) {
  const ms = calcDurationMs(inISO, outISO);
  if (!outISO) return "—";
  return formatDuration(ms);
}

function formatDuration(ms) {
  if (!ms) return "0h 0m";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}

function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateShort(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function formatDateLong(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  // inclui dia da semana e dia do mês (como você pediu)
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

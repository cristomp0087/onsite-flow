// src/core/reports.js
import { supabase } from "../config.js";

/**
 * Ajuste só isto se precisar:
 * - Nome da tabela
 * - Nome da coluna de "created_at" se for diferente
 */
const TABLE = "registros";
const ORDER_COL = "created_at";
const LIMIT = 80;

/* ---------------------------
   Helpers de data/hora
---------------------------- */
const fmtDate = (d) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(d);

const fmtTime = (d) =>
  new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(d);

const fmtWeekday = (d) =>
  new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(d);

function parseDateSafe(v) {
  if (!v) return null;
  const d = (v instanceof Date) ? v : new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
}

function minutesBetween(a, b) {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
}

function fmtHM(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
}

function normalizeRecord(r, fallbackPerson = "Usuário") {
  const start =
    parseDateSafe(r.check_in_at) ||
    parseDateSafe(r.started_at) ||
    parseDateSafe(r.start_at) ||
    parseDateSafe(r.in_at) ||
    parseDateSafe(r.entrada_at) ||
    parseDateSafe(r.created_at);

  const end =
    parseDateSafe(r.check_out_at) ||
    parseDateSafe(r.ended_at) ||
    parseDateSafe(r.end_at) ||
    parseDateSafe(r.out_at) ||
    parseDateSafe(r.saida_at) ||
    null;

  const person =
    r.person_name ||
    r.user_name ||
    r.nome ||
    r.pessoa ||
    fallbackPerson;

  const site =
    r.site_name ||
    r.local_nome ||
    r.localNome ||
    r.obra ||
    r.site ||
    "—";

  const type =
    r.type ||
    r.tipo ||
    (r.is_visit ? "VISITA" : "TRABALHO");

  const id = r.id ?? r.uuid ?? r.record_id;

  return { id, person, site, type, start, end, raw: r };
}

/* ---------------------------
   UI: batch modal (seleção)
---------------------------- */
function ensureBatchModal() {
  if (document.getElementById("batch-modal")) return;

  const modal = document.createElement("div");
  modal.id = "batch-modal";
  modal.className = "batch-modal";
  modal.innerHTML = `
    <div class="batch-backdrop" data-batch="close"></div>
    <div class="batch-sheet" role="dialog" aria-modal="true" aria-label="Relatório selecionado">
      <div class="batch-head">
        <div>
          <div class="batch-title">Relatório Selecionado</div>
          <div class="batch-subtitle" id="batch-subtitle">0 itens</div>
        </div>
        <button class="batch-close" type="button" data-batch="close" aria-label="Fechar">✕</button>
      </div>

      <div class="batch-summary">
        <div class="batch-kpi">
          <div class="kpi-label">Total de horas</div>
          <div class="kpi-value" id="batch-total">00:00</div>
        </div>
        <div class="batch-actions">
          <button class="btn btn-ghost" type="button" data-batch="clear">Limpar</button>
          <button class="btn btn-primary" type="button" data-batch="export">Exportar</button>
        </div>
      </div>

      <div class="batch-list" id="batch-list"></div>
    </div>
  `;
  document.body.appendChild(modal);
}

function openBatchModal() {
  const modal = document.getElementById("batch-modal");
  if (!modal) return;
  modal.classList.add("open");
}

function closeBatchModal() {
  const modal = document.getElementById("batch-modal");
  if (!modal) return;
  modal.classList.remove("open");
}

/* ---------------------------
   Export CSV
---------------------------- */
function downloadCSV(filename, rows) {
  const escape = (v) => {
    const s = String(v ?? "");
    if (/[,"\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
    return s;
  };

  const csv = rows.map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ---------------------------
   Render do card
---------------------------- */
function buildReportCard(rec) {
  const day = rec.start ? fmtDate(rec.start) : "—";
  const inTime = rec.start ? fmtTime(rec.start) : "—";
  const outTime = rec.end ? fmtTime(rec.end) : "—";

  const totalMins = rec.start
    ? minutesBetween(rec.start, rec.end ?? new Date())
    : 0;

  const totalHM = fmtHM(totalMins);

  const statusLine = rec.end
    ? `${inTime} → ${outTime}`
    : `${inTime} → —  •  Em andamento…`;

  const typeLabel = String(rec.type || "").toUpperCase();
  const typeBadge = typeLabel.includes("VISIT") ? "badge badge-visit" : "badge badge-work";

  const el = document.createElement("div");
  el.className = "report-card selectable";
  el.dataset.id = rec.id ?? "";
  el.dataset.start = rec.start ? rec.start.toISOString() : "";
  el.dataset.end = rec.end ? rec.end.toISOString() : "";
  el.dataset.person = rec.person ?? "";
  el.dataset.site = rec.site ?? "";
  el.dataset.type = rec.type ?? "";

  el.innerHTML = `
    <div class="report-top">
      <div class="report-person">${rec.person || "—"}</div>
      <div class="report-date">${day}</div>
    </div>

    <div class="report-mid">
      <div class="report-site">${rec.site || "—"}</div>
      <div class="${typeBadge}">${typeLabel || "—"}</div>
    </div>

    <div class="report-line">
      <div class="report-io">${statusLine}</div>
      <div class="report-total">${totalHM}</div>
    </div>

    <div class="card-actions">
      <button class="action-btn-small" type="button" data-action="delete" title="Excluir">🗑</button>
      <button class="action-btn-small" type="button" data-action="export" title="Exportar">📤</button>
    </div>

    <div class="select-pill" aria-hidden="true">Selecionado</div>
  `;
  return el;
}

/* ---------------------------
   Load + Render + Selection
---------------------------- */
export async function loadReports(state) {
  const listEl = document.getElementById("report-list");
  if (!listEl) return;

  ensureBatchModal();

  listEl.innerHTML = `
    <div class="empty-state">
      <div class="spinner" aria-hidden="true"></div>
      <p>Carregando...</p>
    </div>
  `;

  // Pessoa: prioriza estado, senão cai no fallback
  const fallbackPerson =
    state?.profileName ||
    state?.userName ||
    state?.deviceName ||
    "Usuário";

  let rows = [];
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order(ORDER_COL, { ascending: false })
      .limit(LIMIT);

    if (error) throw error;
    rows = (data || []).map((r) => normalizeRecord(r, fallbackPerson));
  } catch (e) {
    console.error("Erro ao carregar relatórios:", e);
    listEl.innerHTML = `
      <div class="empty-state">
        <p>Erro ao carregar relatórios.</p>
      </div>
    `;
    return;
  }

  state.reports = rows;

  if (!rows.length) {
    listEl.innerHTML = `
      <div class="empty-state">
        <p>Sem registros ainda.</p>
      </div>
    `;
    return;
  }

  // Render
  listEl.innerHTML = "";
  for (const r of rows) listEl.appendChild(buildReportCard(r));

  // Bind ações (delete/export)
  listEl.addEventListener("click", async (ev) => {
    const btn = ev.target?.closest?.("[data-action]");
    if (!btn) return;

    // Se estamos em modo seleção, clique não executa ação
    if (selection.mode) return;

    const card = ev.target.closest(".report-card");
    const id = card?.dataset?.id;
    if (!id) return;

    const action = btn.dataset.action;

    if (action === "delete") {
      if (!confirm("Excluir este registro?")) return;
      await deleteRecord(id);
      await loadReports(state);
    }

    if (action === "export") {
      const rec = state.reports.find((x) => String(x.id) === String(id));
      if (!rec) return;
      exportSingle(rec);
    }
  });

  // Selection mode (press & hold)
  bindSelection(listEl, state);
}

/* ---------------------------
   Delete / Export
---------------------------- */
async function deleteRecord(id) {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) {
    console.error(error);
    alert("Não foi possível excluir.");
  }
}

function exportSingle(rec) {
  const start = rec.start ? fmtDate(rec.start) : "—";
  const inTime = rec.start ? fmtTime(rec.start) : "—";
  const outTime = rec.end ? fmtTime(rec.end) : "—";
  const total = rec.start ? fmtHM(minutesBetween(rec.start, rec.end ?? new Date())) : "00:00";

  const rows = [
    ["Pessoa", "Obra", "Data", "Entrada", "Saída", "Total", "Tipo"],
    [rec.person, rec.site, start, inTime, outTime, total, String(rec.type || "").toUpperCase()],
  ];

  const safeName = String(rec.site || "obra").replaceAll(/[^\w\-]+/g, "_");
  downloadCSV(`onsite_${safeName}_${Date.now()}.csv`, rows);
}

/* ---------------------------
   Selection system
---------------------------- */
const selection = {
  mode: false,
  ids: new Set(),
};

function bindSelection(listEl, state) {
  // Batch modal controls
  const modal = document.getElementById("batch-modal");
  modal?.addEventListener("click", (ev) => {
    const t = ev.target?.closest?.("[data-batch]");
    if (!t) return;

    const a = t.dataset.batch;
    if (a === "close") {
      closeBatchModal();
      exitSelection(listEl);
    }
    if (a === "clear") {
      selection.ids.clear();
      refreshSelectionUI(listEl, state);
    }
    if (a === "export") {
      exportBatch(state);
    }
  });

  // Press & hold
  let pressTimer = null;
  let pressedCard = null;

  const startPress = (card) => {
    pressedCard = card;
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      enterSelection(listEl);
      toggleSelected(card);
      refreshSelectionUI(listEl, state);
      openBatchModal();
    }, 450);
  };

  const cancelPress = () => {
    clearTimeout(pressTimer);
    pressTimer = null;
    pressedCard = null;
  };

  listEl.addEventListener("pointerdown", (ev) => {
    const card = ev.target?.closest?.(".report-card");
    if (!card) return;
    if (ev.target?.closest?.("[data-action]")) return; // não começa seleção se clicou em botões
    startPress(card);
  });

  listEl.addEventListener("pointerup", cancelPress);
  listEl.addEventListener("pointercancel", cancelPress);
  listEl.addEventListener("pointermove", cancelPress);

  // Clique normal em modo seleção = toggle
  listEl.addEventListener("click", (ev) => {
    if (!selection.mode) return;
    if (ev.target?.closest?.("[data-action]")) return;

    const card = ev.target?.closest?.(".report-card");
    if (!card) return;

    toggleSelected(card);
    refreshSelectionUI(listEl, state);
    openBatchModal();
  });
}

function enterSelection(listEl) {
  selection.mode = true;
  listEl.classList.add("select-mode");
}

function exitSelection(listEl) {
  selection.mode = false;
  selection.ids.clear();
  listEl.classList.remove("select-mode");
  for (const card of listEl.querySelectorAll(".report-card.selected")) {
    card.classList.remove("selected");
  }
}

function toggleSelected(card) {
  const id = card?.dataset?.id;
  if (!id) return;

  if (selection.ids.has(id)) selection.ids.delete(id);
  else selection.ids.add(id);
}

function refreshSelectionUI(listEl, state) {
  // Marca cards
  for (const card of listEl.querySelectorAll(".report-card")) {
    const id = card.dataset.id;
    const on = selection.ids.has(id);
    card.classList.toggle("selected", on);
  }

  // Atualiza modal
  const items = state.reports.filter((r) => selection.ids.has(String(r.id)));
  const sub = document.getElementById("batch-subtitle");
  const totalEl = document.getElementById("batch-total");
  const list = document.getElementById("batch-list");

  if (sub) sub.textContent = `${items.length} item(ns)`;
  if (list) list.innerHTML = "";

  let totalMins = 0;

  for (const r of items) {
    const end = r.end ?? new Date();
    const mins = r.start ? minutesBetween(r.start, end) : 0;
    totalMins += mins;

    const line = document.createElement("div");
    line.className = "batch-row";
    const day = r.start ? fmtDate(r.start) : "—";
    const week = r.start ? fmtWeekday(r.start) : "—";
    const dom = r.start ? String(r.start.getDate()).padStart(2, "0") : "—";
    const inT = r.start ? fmtTime(r.start) : "—";
    const outT = r.end ? fmtTime(r.end) : "—";

    line.innerHTML = `
      <div class="batch-row-top">
        <div class="batch-row-person">${r.person || "—"}</div>
        <div class="batch-row-date">${week} • ${dom} • ${day}</div>
      </div>
      <div class="batch-row-mid">
        <div class="batch-row-site">${r.site || "—"}</div>
        <div class="batch-row-type">${String(r.type || "").toUpperCase()}</div>
      </div>
      <div class="batch-row-line">
        <div class="batch-row-io">${inT} → ${outT || "—"}</div>
        <div class="batch-row-total">${fmtHM(mins)}</div>
      </div>
    `;
    list?.appendChild(line);
  }

  if (totalEl) totalEl.textContent = fmtHM(totalMins);

  // Se não tem itens, fecha
  if (!items.length) {
    closeBatchModal();
    exitSelection(listEl);
  }
}

function exportBatch(state) {
  const items = state.reports.filter((r) => selection.ids.has(String(r.id)));
  if (!items.length) return;

  let totalMins = 0;

  const rows = [
    ["Pessoa", "Obra", "DiaSemana", "DiaMês", "Data", "Entrada", "Saída", "Total", "Tipo"],
  ];

  for (const r of items) {
    const end = r.end ?? new Date();
    const mins = r.start ? minutesBetween(r.start, end) : 0;
    totalMins += mins;

    rows.push([
      r.person,
      r.site,
      r.start ? fmtWeekday(r.start) : "—",
      r.start ? String(r.start.getDate()).padStart(2, "0") : "—",
      r.start ? fmtDate(r.start) : "—",
      r.start ? fmtTime(r.start) : "—",
      r.end ? fmtTime(r.end) : "—",
      fmtHM(mins),
      String(r.type || "").toUpperCase(),
    ]);
  }

  // Linha final com soma
  rows.push(["", "", "", "", "", "", "TOTAL", fmtHM(totalMins), ""]);

  downloadCSV(`onsite_relatorio_selecionado_${Date.now()}.csv`, rows);
}

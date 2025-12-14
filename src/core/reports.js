// src/core/reports.js
import { listRecentRecords, deleteRecord } from "./records.js";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function fmtTime(d) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function fmtDay(d) {
  // ex: 13 dez
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function durationHM(ms) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return { h, m, totalMin };
}

function buildShareText(reg) {
  const entrada = new Date(reg.entrada);
  const dia = fmtDay(entrada);

  if (!reg.saida) {
    return `Trabalhando em ${reg.local_nome} agora (${dia}).`;
  }

  const saida = new Date(reg.saida);
  const ms = saida - entrada;
  const { h, m, totalMin } = durationHM(ms);

  if (totalMin <= 1) return `Visita técnica: ${reg.local_nome} — ${dia}.`;

  return `Trabalho: ${reg.local_nome} — ${h}h ${m}m (${fmtTime(entrada)}–${fmtTime(saida)}) em ${dia}.`;
}

export async function loadReports(state) {
  const list = document.getElementById("report-list");
  if (!list) return;

  // loading
  list.innerHTML = `
    <div class="empty-state">
      <div class="spinner" aria-hidden="true"></div>
      <p>Carregando...</p>
    </div>
  `;

  let data = [];
  try {
    data = await listRecentRecords(15);
  } catch (e) {
    console.error("loadReports error:", e);
    list.innerHTML = `<div class="empty-state"><p>Erro ao carregar relatórios.</p></div>`;
    return;
  }

  if (!data.length) {
    list.innerHTML = `<div class="empty-state"><p>Nenhum registro ainda.</p></div>`;
    return;
  }

  list.innerHTML = "";

  data.forEach((reg) => {
    const entrada = new Date(reg.entrada);
    const dia = fmtDay(entrada);

    let bodyHtml = "";
    let shareText = buildShareText(reg);

    if (!reg.saida) {
      bodyHtml = `
        <div style="color:#ef4444; font-weight:950;">Em andamento…</div>
        <div style="color:#94a3b8; font-weight:800; font-size:12px; margin-top:6px;">
          Início: ${fmtTime(entrada)}
        </div>
      `;
    } else {
      const saida = new Date(reg.saida);
      const ms = saida - entrada;
      const { h, m, totalMin } = durationHM(ms);

      if (totalMin <= 1) {
        bodyHtml = `
          <div style="font-weight:950;">👁️ Visita Técnica</div>
          <div style="color:#94a3b8; font-weight:800; font-size:12px; margin-top:6px;">
            ${fmtTime(entrada)}
          </div>
        `;
      } else {
        bodyHtml = `
          <div style="font-weight:950; font-size:18px;">${h}h ${m}m</div>
          <div style="color:#94a3b8; font-weight:800; font-size:12px; margin-top:6px;">
            ${fmtTime(entrada)} — ${fmtTime(saida)}
          </div>
        `;
      }
    }

    const card = document.createElement("div");
    card.className = "report-card";
    card.innerHTML = `
      <div class="report-header">
        <span>${reg.local_nome}</span>
        <span style="color:#94a3b8; font-weight:900;">${dia}</span>
      </div>

      ${bodyHtml}

      <div class="card-actions">
        <button class="action-btn-small" data-action="delete" data-id="${reg.id}">🗑️</button>
        <button class="action-btn-small" data-action="share" data-share="${encodeURIComponent(shareText)}">📤</button>
      </div>
    `;
    list.appendChild(card);
  });

  // Delegação de eventos
  list.onclick = async (ev) => {
    const btn = ev.target?.closest("button");
    if (!btn) return;

    const action = btn.dataset.action;
    if (action === "delete") {
      const id = Number(btn.dataset.id);
      if (!id) return;
      if (!confirm("Apagar este registro?")) return;

      try {
        await deleteRecord(id);
        await loadReports(state);
      } catch (e) {
        alert("Erro ao apagar: " + (e?.message ?? e));
      }
    }

    if (action === "share") {
      const text = decodeURIComponent(btn.dataset.share || "");
      if (!text) return;

      if (navigator.share) {
        try {
          await navigator.share({ title: "OnSite Flow", text });
        } catch {}
      } else {
        await navigator.clipboard.writeText(text);
        alert("Texto copiado!");
      }
    }
  };
}

// src/core/reports.js
import { apiSelect, apiDelete } from "./api.js";
import { $, escapeHtml } from "./dom.js";

export async function loadReports(state, { limit = 10 } = {}) {
  const list = $("report-list");
  if (!list) return;

  const rows = await apiSelect("registros", (q) =>
    q.order("entrada", { ascending: false }).limit(limit)
  );

  list.innerHTML = "";

  if (!rows.length) {
    list.innerHTML = `<p style="text-align:center; color:#999; margin-top:30px">Nenhum registro ainda.</p>`;
    return;
  }

  rows.forEach((reg) => {
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

        body = `
          <div style="font-weight:950; font-size:1.2rem;">${h}h ${m}m</div>
          <div style="color:#64748b; font-size:0.85rem;">${horaIn} - ${horaOut}</div>
        `;
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

      try {
        await apiDelete("registros", (q) => q.eq("id", id));
        await loadReports(state, { limit });
      } catch (e) {
        alert("Erro ao apagar: " + e.message);
      }
    });

    div.querySelector("[data-share]")?.addEventListener("click", async () => {
      const txt = decodeURIComponent(div.querySelector("[data-share]").dataset.share || "");
      await shareText(txt);
    });

    list.appendChild(div);
  });
}

async function shareText(txt) {
  try {
    if (navigator.share) {
      await navigator.share({ title: "OnSite", text: txt });
    } else {
      await navigator.clipboard.writeText(txt);
      alert("Texto copiado!");
    }
  } catch (e) {
    console.warn(e);
  }
}

// src/core/records.js
import { apiSelect, apiInsert, apiUpdate } from "./api.js";
import { setWorkingUI, setTimerText } from "./ui.js";
import { startTimer, stopTimer } from "./timer.js";

export async function hydrateWorkingState(state) {
  // pega o registro aberto mais recente (saida = null)
  const rows = await apiSelect("registros", (q) =>
    q.is("saida", null).order("entrada", { ascending: false }).limit(1)
  );

  if (rows.length > 0) {
    const r = rows[0];
    state.isWorking = true;
    state.currentRecordId = r.id;
    state.startTime = new Date(r.entrada);
    state.currentSite = { nome: r.local_nome };

    setWorkingUI({ isWorking: true, siteName: r.local_nome });
    startTimer(state, {
      onTick: (h, m) => setTimerText(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`),
    });
  } else {
    state.isWorking = false;
    state.currentRecordId = null;
    state.startTime = null;

    setWorkingUI({ isWorking: false });
    stopTimer(state);
  }
}

export async function checkIn(state, { localNome, usuario = "Usuário Teste" }) {
  const now = new Date();

  const rows = await apiInsert("registros", [
    { local_nome: localNome, usuario, entrada: now, saida: null },
  ]);

  const r = rows?.[0];
  state.isWorking = true;
  state.currentRecordId = r?.id ?? null;
  state.startTime = now;
  state.currentSite = { nome: localNome };

  setWorkingUI({ isWorking: true, siteName: localNome });
  startTimer(state, {
    onTick: (h, m) => setTimerText(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`),
  });

  return r;
}

export async function checkOut(state) {
  if (!state.currentRecordId) return null;

  await apiUpdate(
    "registros",
    { saida: new Date() },
    (q) => q.eq("id", state.currentRecordId)
  );

  state.isWorking = false;
  state.currentRecordId = null;
  state.startTime = null;

  setWorkingUI({ isWorking: false });
  stopTimer(state);

  return true;
}

export async function visit(state, { localNome, usuario = "Usuário Teste" }) {
  const now = new Date();

  await apiInsert("registros", [
    { local_nome: localNome, usuario, entrada: now, saida: now },
  ], false);

  return true;
}

// src/core/records.js
import { supabase } from "../config.js";

export async function hydrateWorkingState(state) {
  const { data, error } = await supabase
    .from("registros")
    .select("*")
    .is("saida", null)
    .order("entrada", { ascending: false })
    .limit(1);

  if (error) {
    console.error("hydrateWorkingState error:", error);
    return;
  }

  const reg = data?.[0];
  if (!reg) {
    state.isWorking = false;
    state.currentRecordId = null;
    state.startTime = null;
    state.currentSite = null;
    return;
  }

  state.isWorking = true;
  state.currentRecordId = reg.id;
  state.startTime = new Date(reg.entrada);
  state.currentSite = { nome: reg.local_nome };
}

export async function checkIn(state, { localNome, usuario = "Usuário Teste" }) {
  const entradaISO = new Date().toISOString();

  const { data, error } = await supabase
    .from("registros")
    .insert([
      { local_nome: localNome, usuario, entrada: entradaISO, saida: null }
    ])
    .select("*")
    .limit(1);

  if (error) throw error;

  const reg = data?.[0];
  state.isWorking = true;
  state.currentRecordId = reg?.id ?? state.currentRecordId;
  state.startTime = new Date(reg?.entrada ?? entradaISO);
  state.currentSite = { nome: localNome };
}

export async function checkOut(state) {
  if (!state.currentRecordId) throw new Error("Sem registro ativo para encerrar.");

  const saidaISO = new Date().toISOString();

  const { error } = await supabase
    .from("registros")
    .update({ saida: saidaISO })
    .eq("id", state.currentRecordId);

  if (error) throw error;

  state.isWorking = false;
  state.currentRecordId = null;
  state.startTime = null;
  state.currentSite = null;
}

export async function visit(state, { localNome, usuario = "Usuário Teste" }) {
  const t = new Date().toISOString();

  const { error } = await supabase
    .from("registros")
    .insert([{ local_nome: localNome, usuario, entrada: t, saida: t }]);

  if (error) throw error;
}

export async function listRecentRecords(limit = 15) {
  const { data, error } = await supabase
    .from("registros")
    .select("*")
    .order("entrada", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function deleteRecord(id) {
  const { error } = await supabase.from("registros").delete().eq("id", id);
  if (error) throw error;
}

// src/supabaseApi.js
import { supabase } from "./config.js";

export async function fetchOpenRecord(userId) {
  const { data, error } = await supabase
    .from("registros")
    .select("*")
    .eq("usuario", userId)
    .is("saida", null)
    .order("entrada", { ascending: false })
    .limit(1);

  if (error) throw error;
  return (data && data[0]) ? data[0] : null;
}

export async function createCheckIn({ userId, localNome, entradaISO }) {
  const { data, error } = await supabase
    .from("registros")
    .insert([{ usuario: userId, local_nome: localNome, entrada: entradaISO, saida: null }])
    .select()
    .limit(1);

  if (error) throw error;
  return data?.[0] || null;
}

export async function createVisit({ userId, localNome, entradaISO }) {
  const { error } = await supabase
    .from("registros")
    .insert([{ usuario: userId, local_nome: localNome, entrada: entradaISO, saida: entradaISO }]);

  if (error) throw error;
  return true;
}

export async function finishShift({ recordId, saidaISO }) {
  const { error } = await supabase
    .from("registros")
    .update({ saida: saidaISO })
    .eq("id", recordId);

  if (error) throw error;
  return true;
}

export async function fetchReports(userId, limit = 10) {
  const { data, error } = await supabase
    .from("registros")
    .select("*")
    .eq("usuario", userId)
    .order("entrada", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function deleteReport(id) {
  const { error } = await supabase.from("registros").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function fetchSites() {
  const { data, error } = await supabase.from("locais").select("*");
  if (error) throw error;
  return data || [];
}

export async function createSite({ nome, latitude, longitude, raio = 100 }) {
  const { error } = await supabase
    .from("locais")
    .insert([{ nome, latitude, longitude, raio }]);

  if (error) throw error;
  return true;
}

export async function deleteSite(id) {
  const { error } = await supabase.from("locais").delete().eq("id", id);
  if (error) throw error;
  return true;
}

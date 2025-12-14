// src/core/api.js
import { supabase } from "../config.js";

export async function apiSelect(table, queryFn) {
  const q = supabase.from(table).select("*");
  const finalQ = queryFn ? queryFn(q) : q;
  const { data, error } = await finalQ;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function apiInsert(table, rows, returning = true) {
  const q = supabase.from(table).insert(rows);
  const { data, error } = returning ? await q.select() : await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function apiUpdate(table, patch, whereFn) {
  const q = supabase.from(table).update(patch);
  const finalQ = whereFn ? whereFn(q) : q;
  const { data, error } = await finalQ.select();
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function apiDelete(table, whereFn) {
  const q = supabase.from(table).delete();
  const finalQ = whereFn ? whereFn(q) : q;
  const { error } = await finalQ;
  if (error) throw new Error(error.message);
  return true;
}

// src/core/dom.js
// Helpers pequenos pra DOM — evita repetir document.getElementById mil vezes.

export const $ = (id) => document.getElementById(id);

export const $$ = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector));

export function on(target, event, handler, opts) {
  if (!target) return;
  target.addEventListener(event, handler, opts);
}

export function setText(el, text) {
  if (!el) return;
  el.textContent = text ?? "";
}

export function setHTML(el, html) {
  if (!el) return;
  el.innerHTML = html ?? "";
}

export function show(el, display = "block") {
  if (!el) return;
  el.style.display = display;
}

export function hide(el) {
  if (!el) return;
  el.style.display = "none";
}

export function enable(el) {
  if (!el) return;
  el.disabled = false;
}

export function disable(el) {
  if (!el) return;
  el.disabled = true;
}

export function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function debounce(fn, ms = 250) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

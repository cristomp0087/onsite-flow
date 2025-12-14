// src/core/ui.js

// ===== Helpers DOM =====
function el(id) {
  return document.getElementById(id);
}

function setText(node, text) {
  if (!node) return;
  node.textContent = text;
}

function setHTML(node, html) {
  if (!node) return;
  node.innerHTML = html;
}

// ===== Elements =====
const $gpsBar = () => el("gps-status-bar");
const $statusLabel = () => el("status-label");
const $statusLoc = () => el("status-loc");
const $timer = () => el("status-timer");

const $btnMain = () => el("btn-main-action");
const $btnMainText = () => el("btn-main-text");
const $btnVisit = () => el("btn-visit-action");

const $geoAlert = () => el("geofence-alert");
const $geoMsg = () => el("geo-msg");
const $geoWork = () => el("btn-geo-work");
const $geoVisit = () => el("btn-geo-visit");

// ===== GPS Status Bar =====
export function setGPSStatus(message, cls = "", accuracy = null) {
  const bar = $gpsBar();
  if (!bar) return;

  // remove classes
  bar.classList.remove("active", "error");

  // apply class if valid
  if (cls) bar.classList.add(cls);

  // optionally append accuracy
  const accTxt = (typeof accuracy === "number") ? ` (${accuracy}m)` : "";
  bar.textContent = `${message}${accTxt}`;
}

// ===== Enable actions when GPS is OK =====
export function enableActions() {
  const main = $btnMain();
  const visit = $btnVisit();

  if (main) {
    main.disabled = false;
    main.classList.add("ready");
  }
  if (visit) {
    visit.disabled = false;
    visit.classList.add("ready");
  }
}

// ===== Render working state (fix do TypeError) =====
export function renderWorkState(state) {
  const loc = $statusLoc();
  const main = $btnMain();
  const mainTxt = $btnMainText();

  // Status label (top)
  const label = $statusLabel();
  if (label) setText(label, "Status Atual");

  // Status “pill”
  if (loc) {
    const siteName = state?.currentSite?.nome;
    if (state?.isWorking) {
      setHTML(loc, `<span class="dot dot-work"></span> Trabalhando${siteName ? ` • ${siteName}` : ""}`);
    } else {
      setHTML(loc, `<span class="dot dot-idle"></span> Não trabalhando`);
    }
  }

  // Botão principal (texto + cor)
  if (main && mainTxt) {
    // Se estiver trabalhando: vira "Encerrar"
    if (state?.isWorking) {
      main.classList.add("active");
      setText(mainTxt, "Encerrar");
      main.disabled = false;
      main.classList.add("ready");
      return;
    }

    // Se NÃO estiver trabalhando:
    main.classList.remove("active");

    // Se ainda não tem GPS OK, mantém bloqueado
    if (!state?.gpsOk) {
      setText(mainTxt, "Aguarde GPS");
      main.disabled = true;
      main.classList.remove("ready");
      return;
    }

    // GPS OK → pronto pra iniciar
    setText(mainTxt, "Iniciar");
    main.disabled = false;
    main.classList.add("ready");
  }

  // Timer placeholder se não working
  if (!state?.isWorking) {
    const t = $timer();
    if (t && (t.textContent === "" || t.textContent === "--:--")) {
      t.textContent = "--:--";
    }
  }
}

// ===== Geofence Alert =====
export function showGeofenceAlert({ siteName, onWork, onVisit }) {
  const wrap = $geoAlert();
  if (!wrap) return;

  const msg = $geoMsg();
  setText(msg, `Detectamos entrada em ${siteName}`);

  // limpa handlers antigos (pra não duplicar)
  const workBtn = $geoWork();
  const visitBtn = $geoVisit();

  if (workBtn) {
    workBtn.onclick = () => {
      hideGeofenceAlert();
      onWork?.();
    };
  }

  if (visitBtn) {
    visitBtn.onclick = () => {
      hideGeofenceAlert();
      onVisit?.();
    };
  }

  wrap.style.display = "block";
}

export function hideGeofenceAlert() {
  const wrap = $geoAlert();
  if (!wrap) return;
  wrap.style.display = "none";
}

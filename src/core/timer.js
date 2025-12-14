// src/core/timer.js
let intervalId = null;

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatElapsed(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

export function stopTimer() {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
}

export function syncTimer(state) {
  const el = document.getElementById("status-timer");
  if (!el) return;

  // Se não está trabalhando, reseta e sai
  if (!state?.isWorking || !state?.startTime) {
    stopTimer();
    el.textContent = "--:--";
    return;
  }

  // Se já tem intervalo rodando, não cria outro
  if (intervalId) return;

  const tick = () => {
    if (!state?.isWorking || !state?.startTime) return;
    const ms = Date.now() - new Date(state.startTime).getTime();
    el.textContent = formatElapsed(ms);
  };

  tick();
  intervalId = setInterval(tick, 1000);
}

export function forceTick(state) {
  const el = document.getElementById("status-timer");
  if (!el) return;
  if (!state?.isWorking || !state?.startTime) {
    el.textContent = "--:--";
    return;
  }
  const ms = Date.now() - new Date(state.startTime).getTime();
  el.textContent = formatElapsed(ms);
}

// src/timer.js
import { state } from "./state.js";
import { ui } from "./ui.js";

export function startVisualTimer() {
  stopVisualTimer();
  const tick = () => {
    if (!state.startTime) return;
    const now = new Date();
    const diff = now - state.startTime;

    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);

    ui.setTimer(`${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`);
  };

  tick();
  state.timerInterval = setInterval(tick, 1000);
}

export function stopVisualTimer() {
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.timerInterval = null;
  state.startTime = null;
  ui.setTimer("--:--");
}

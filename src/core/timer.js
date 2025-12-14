// src/core/timer.js
export function startTimer(state, { onTick } = {}) {
  stopTimer(state);

  const tick = () => {
    if (!state.startTime) return;
    const now = new Date();
    const diff = now - state.startTime;
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    onTick?.(hrs, mins);
  };

  tick();
  state.timerInterval = setInterval(tick, 60000);
}

export function stopTimer(state) {
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.timerInterval = null;
}

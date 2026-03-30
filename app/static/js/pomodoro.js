/* ============================================
   pomodoro.js — Full Pomodoro Timer System
   ============================================ */

const POMO_MODES = { FOCUS: 'focus', SHORT: 'short', LONG: 'long' };

const pomoState = {
  mode: POMO_MODES.FOCUS,
  running: false,
  remaining: 25 * 60,
  total: 25 * 60,
  session: 1,
  completedToday: 0,
  focusMinutesToday: 0,
  settings: {
    focus: 25,
    short: 5,
    long: 15,
    sessionsUntilLong: 4,
    sound: true
  },
  interval: null,
  history: JSON.parse(localStorage.getItem('cs-pomo-history') || '[]')
};

// DOM refs
const display = document.getElementById('pomodoroDisplay');
const ring = document.getElementById('pomodoroRing');
const badge = document.getElementById('pomoBadge');
const modeLabel = document.getElementById('pomodoroMode');
const startBtn = document.getElementById('pomoStart');
const card = document.getElementById('pomodoroCard');
const CIRCUMFERENCE = 2 * Math.PI * 96; // r=96

function setMode(mode) {
  pomoState.mode = mode;
  pomoState.running = false;
  clearInterval(pomoState.interval);

  const durations = {
    [POMO_MODES.FOCUS]: pomoState.settings.focus,
    [POMO_MODES.SHORT]: pomoState.settings.short,
    [POMO_MODES.LONG]: pomoState.settings.long
  };

  pomoState.total = durations[mode] * 60;
  pomoState.remaining = pomoState.total;

  const modeConfig = {
    [POMO_MODES.FOCUS]: { label: 'FOCUS TIME', modeText: 'Focus', badge: 'badge-primary', color: '#a29bfe', stroke: '#a29bfe', cardClass: 'pomo-focus' },
    [POMO_MODES.SHORT]: { label: 'SHORT BREAK', modeText: 'Short Break', badge: 'badge-success', color: '#00b894', stroke: '#00b894', cardClass: 'pomo-short-break' },
    [POMO_MODES.LONG]: { label: 'LONG BREAK', modeText: 'Long Break', badge: 'badge-teal', color: '#00cec9', stroke: '#00cec9', cardClass: 'pomo-long-break' }
  };

  const cfg = modeConfig[mode];
  badge.textContent = (mode === POMO_MODES.FOCUS ? '🎯 ' : mode === POMO_MODES.SHORT ? '☕ ' : '🌟 ') + cfg.label;
  badge.className = `badge ${cfg.badge}`;
  badge.style.fontSize = '0.85rem';
  badge.style.padding = '6px 16px';
  modeLabel.textContent = cfg.modeText;
  ring.style.stroke = cfg.stroke;
  card.className = `card animate-fadeInUp ${cfg.cardClass}`;

  startBtn.textContent = '▶ Start';
  updateDisplay();
  updateRing();
}

function updateDisplay() {
  const m = Math.floor(pomoState.remaining / 60).toString().padStart(2, '0');
  const s = (pomoState.remaining % 60).toString().padStart(2, '0');
  display.textContent = `${m}:${s}`;
}

function updateRing() {
  const progress = pomoState.remaining / pomoState.total;
  const offset = CIRCUMFERENCE * (1 - progress);
  ring.style.strokeDashoffset = offset;
  ring.style.strokeDasharray = CIRCUMFERENCE;
}

function startStop() {
  if (pomoState.running) {
    // Pause
    pomoState.running = false;
    clearInterval(pomoState.interval);
    startBtn.textContent = '▶ Resume';
  } else {
    // Start
    pomoState.running = true;
    startBtn.textContent = '⏸ Pause';

    pomoState.interval = setInterval(() => {
      pomoState.remaining--;
      updateDisplay();
      updateRing();

      // Tick animation
      ring.classList.add('pomo-tick');
      setTimeout(() => ring.classList.remove('pomo-tick'), 500);

      if (pomoState.remaining <= 0) {
        clearInterval(pomoState.interval);
        pomoState.running = false;
        onTimerComplete();
      }
    }, 1000);
  }
}

function onTimerComplete() {
  if (pomoState.settings.sound) playAlert();
  startBtn.textContent = '▶ Start';

  if (pomoState.mode === POMO_MODES.FOCUS) {
    // Log completed session
    pomoState.completedToday++;
    pomoState.focusMinutesToday += pomoState.settings.focus;

    const totalSessions = parseInt(localStorage.getItem('cs-pomo-total') || '0') + 1;
    localStorage.setItem('cs-pomo-total', totalSessions);

    // Save to history
    const now = new Date();
    pomoState.history.unshift({
      type: 'focus',
      duration: pomoState.settings.focus,
      timestamp: now.toISOString(),
      dateStr: now.toLocaleDateString(),
      timeStr: now.toLocaleTimeString()
    });
    localStorage.setItem('cs-pomo-history', JSON.stringify(pomoState.history.slice(0, 100)));

    // Save daily stats
    const todayKey = now.toDateString();
    const dailyData = JSON.parse(localStorage.getItem('cs-pomo-daily') || '{}');
    if (!dailyData[todayKey]) dailyData[todayKey] = { sessions: 0, minutes: 0 };
    dailyData[todayKey].sessions++;
    dailyData[todayKey].minutes += pomoState.settings.focus;
    localStorage.setItem('cs-pomo-daily', JSON.stringify(dailyData));

    updateStats();
    renderHistory();
    updateDots();

    // Determine next mode
    const nextMode = pomoState.session % pomoState.settings.sessionsUntilLong === 0
      ? POMO_MODES.LONG : POMO_MODES.SHORT;

    showToast(`🍅 Focus session complete! Time for a ${nextMode === POMO_MODES.LONG ? 'long' : 'short'} break.`, 'success', 5000);
    setMode(nextMode);

    if (pomoState.session % pomoState.settings.sessionsUntilLong === 0) {
      pomoState.session = 1;
      resetDots();
    } else {
      pomoState.session++;
    }
  } else {
    showToast('☕ Break over! Ready to focus?', 'info', 4000);
    setMode(POMO_MODES.FOCUS);
  }
}

function playAlert() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.4);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.4);
    });
  } catch(e) { /* Audio not available */ }
}

function resetTimer() {
  clearInterval(pomoState.interval);
  pomoState.running = false;
  pomoState.remaining = pomoState.total;
  startBtn.textContent = '▶ Start';
  updateDisplay();
  updateRing();
}

function skipMode() {
  clearInterval(pomoState.interval);
  if (pomoState.mode === POMO_MODES.FOCUS) {
    const nextMode = pomoState.session % pomoState.settings.sessionsUntilLong === 0 ? POMO_MODES.LONG : POMO_MODES.SHORT;
    setMode(nextMode);
  } else {
    setMode(POMO_MODES.FOCUS);
  }
}

function updateDots() {
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById(`dot${i}`);
    if (!dot) continue;
    if (i < pomoState.session) dot.className = 'session-dot complete';
    else if (i === pomoState.session) dot.className = 'session-dot current';
    else dot.className = 'session-dot';
  }
}

function resetDots() {
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById(`dot${i}`);
    if (dot) dot.className = i === 1 ? 'session-dot current' : 'session-dot';
  }
}

function updateStats() {
  document.getElementById('todaySessions').textContent = pomoState.completedToday;
  document.getElementById('todayFocusTime').textContent = pomoState.focusMinutesToday + 'm';
}

function renderHistory() {
  const container = document.getElementById('pomoHistory');
  if (!pomoState.history.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:var(--space-lg) 0;">Complete a session to see history</p>';
    return;
  }
  container.innerHTML = pomoState.history.slice(0, 20).map(h => `
    <div class="info-row">
      <div style="display:flex;align-items:center;gap:var(--space-sm);">
        <span>${h.type === 'focus' ? '🍅' : '☕'}</span>
        <div>
          <div style="font-size:0.85rem;font-weight:600;">${h.type === 'focus' ? 'Focus' : 'Break'} — ${h.duration} min</div>
          <div style="font-size:0.72rem;color:var(--text-muted);">${h.dateStr} at ${h.timeStr}</div>
        </div>
      </div>
      <span class="badge ${h.type === 'focus' ? 'badge-primary' : 'badge-teal'}">${h.type === 'focus' ? 'Focus' : 'Break'}</span>
    </div>
  `).join('');
}

// Apply settings
document.getElementById('applyPomoSettings').addEventListener('click', () => {
  const f = parseInt(document.getElementById('focusDur').value);
  const s = parseInt(document.getElementById('shortBreakDur').value);
  const l = parseInt(document.getElementById('longBreakDur').value);
  const sl = parseInt(document.getElementById('sessionsUntilLong').value);

  if (!f || !s || !l || !sl) { showToast('Enter valid settings', 'error'); return; }

  pomoState.settings = { ...pomoState.settings, focus: f, short: s, long: l, sessionsUntilLong: sl };
  pomoState.session = 1;
  resetDots();
  setMode(POMO_MODES.FOCUS);
  showToast('Settings applied!', 'success');
});

document.getElementById('soundToggle').addEventListener('change', function() {
  pomoState.settings.sound = this.checked;
  const track = document.getElementById('soundTrack');
  track.style.background = this.checked ? 'var(--primary)' : 'var(--divider)';
});

document.getElementById('pomoStart').addEventListener('click', startStop);
document.getElementById('pomoReset').addEventListener('click', resetTimer);
document.getElementById('pomoSkip').addEventListener('click', skipMode);

document.getElementById('clearPomoHistory').addEventListener('click', () => {
  pomoState.history = [];
  localStorage.removeItem('cs-pomo-history');
  renderHistory();
  showToast('History cleared', 'info');
});

// Init
setMode(POMO_MODES.FOCUS);
updateStats();
renderHistory();

// Load today's stats
(function() {
  const dailyData = JSON.parse(localStorage.getItem('cs-pomo-daily') || '{}');
  const todayKey = new Date().toDateString();
  if (dailyData[todayKey]) {
    pomoState.completedToday = dailyData[todayKey].sessions;
    pomoState.focusMinutesToday = dailyData[todayKey].minutes;
    updateStats();
  }
})();

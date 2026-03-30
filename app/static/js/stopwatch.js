/* ============================================
   stopwatch.js — Precision Stopwatch with Laps
   ============================================ */

const SW = {
  running: false,
  startTime: 0,
  elapsed: 0,
  laps: [],
  lastLapTime: 0,
  animFrame: null
};

const swDisplay = document.getElementById('swDisplay');
const swStartStop = document.getElementById('swStartStop');
const swLap = document.getElementById('swLap');
const swReset = document.getElementById('swReset');
const lapList = document.getElementById('lapList');
const lapEmpty = document.getElementById('lapEmpty');
const lapStats = document.getElementById('lapStats');
const swExportRow = document.getElementById('swExportRow');

function formatTime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const ms3 = Math.floor(ms % 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(ms3).padStart(3,'0')}`;
}

function formatShort(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const ms2 = Math.floor((ms % 1000) / 10);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(ms2).padStart(2,'0')}`;
}

function tick() {
  SW.elapsed = Date.now() - SW.startTime;
  swDisplay.textContent = formatTime(SW.elapsed);
  SW.animFrame = requestAnimationFrame(tick);
}

function startStop() {
  if (SW.running) {
    // Stop
    SW.running = false;
    cancelAnimationFrame(SW.animFrame);
    swStartStop.textContent = '▶ Resume';
    swStartStop.className = 'btn btn-primary';
    swLap.disabled = true;
  } else {
    // Start
    SW.running = true;
    SW.startTime = Date.now() - SW.elapsed;
    tick();
    swStartStop.textContent = '⏸ Pause';
    swStartStop.className = 'btn btn-danger';
    swLap.disabled = false;
    swReset.disabled = false;
  }
}

function recordLap() {
  const lapTime = SW.elapsed - SW.lastLapTime;
  SW.lastLapTime = SW.elapsed;

  SW.laps.push({
    n: SW.laps.length + 1,
    total: SW.elapsed,
    lap: lapTime
  });

  renderLaps();
}

function reset() {
  SW.running = false;
  cancelAnimationFrame(SW.animFrame);
  SW.elapsed = 0;
  SW.lastLapTime = 0;
  SW.laps = [];
  swDisplay.textContent = '00:00:00.000';
  swStartStop.textContent = '▶ Start';
  swStartStop.className = 'btn btn-primary';
  swLap.disabled = true;
  swReset.disabled = true;
  lapList.innerHTML = '';
  lapList.appendChild(lapEmpty);
  lapEmpty.style.display = 'block';
  lapStats.style.display = 'none';
  swExportRow.style.display = 'none';
}

function renderLaps() {
  if (!SW.laps.length) return;

  lapEmpty.style.display = 'none';
  lapStats.style.display = 'block';
  swExportRow.style.display = 'block';

  // Find best and worst
  const lapTimes = SW.laps.map(l => l.lap);
  const bestTime = Math.min(...lapTimes);
  const worstTime = Math.max(...lapTimes);

  // Render laps (newest first)
  const lapsReversed = [...SW.laps].reverse();
  lapList.innerHTML = lapsReversed.map(lap => {
    const isBest = lap.lap === bestTime && SW.laps.length > 1;
    const isWorst = lap.lap === worstTime && SW.laps.length > 1;
    let cls = 'lap-item';
    if (isBest) cls += ' best';
    if (isWorst) cls += ' worst';

    // Delta from average
    const avg = lapTimes.reduce((a,b) => a+b, 0) / lapTimes.length;
    const delta = lap.lap - avg;
    const deltaStr = delta >= 0 ? `+${formatShort(delta)}` : `-${formatShort(Math.abs(delta))}`;

    return `
      <div class="${cls} animate-slideIn">
        <span class="lap-num">Lap ${lap.n} ${isBest ? '🏆' : isWorst ? '🐌' : ''}</span>
        <span class="lap-time">${formatShort(lap.lap)}</span>
        <span class="lap-delta" style="color:${delta > 0 ? 'var(--warning)' : 'var(--success)'};">${SW.laps.length > 1 ? deltaStr : ''}</span>
        <span class="lap-time" style="color:var(--text-muted);font-size:0.8rem;">${formatShort(lap.total)}</span>
      </div>
    `;
  }).join('');

  // Insert before lapEmpty
  lapList.appendChild(lapEmpty);

  // Update stats
  document.getElementById('lapCount').textContent = SW.laps.length;
  document.getElementById('bestLap').textContent = SW.laps.length > 1 ? formatShort(bestTime) : '—';
  document.getElementById('worstLap').textContent = SW.laps.length > 1 ? formatShort(worstTime) : '—';
}

function exportLaps() {
  if (!SW.laps.length) return;
  const csv = ['Lap,Lap Time,Total Time',
    ...SW.laps.map(l => `${l.n},${formatShort(l.lap)},${formatShort(l.total)}`)
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `stopwatch_laps_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  showToast('Laps exported!', 'success');
}

// Keyboard shortcuts for stopwatch
document.addEventListener('keydown', (e) => {
  // Only if stopwatch panel is visible
  if (document.getElementById('panel-stopwatch').style.display === 'none') return;
  if (e.target.tagName === 'INPUT') return;

  if (e.code === 'Space') { e.preventDefault(); startStop(); }
  if (e.code === 'KeyL') recordLap();
  if (e.code === 'KeyR') { if (!SW.running) reset(); }
});

swStartStop.addEventListener('click', startStop);
swLap.addEventListener('click', recordLap);
swReset.addEventListener('click', reset);
document.getElementById('exportLaps').addEventListener('click', exportLaps);

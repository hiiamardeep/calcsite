/* ============================================
   dashboard.js — Productivity Analytics Dashboard
   ============================================ */

let weeklyChart = null;
let dailyChart = null;

window.initDashboard = function() {
  const dailyData = JSON.parse(localStorage.getItem('cs-pomo-daily') || '{}');
  const history = JSON.parse(localStorage.getItem('cs-pomo-history') || '[]');
  const totalSessions = parseInt(localStorage.getItem('cs-pomo-total') || '0');

  // ─── TOTAL STATS ───────────────────────────────
  const totalMinutes = Object.values(dailyData).reduce((acc, d) => acc + (d.minutes || 0), 0);
  const hours = (totalMinutes / 60).toFixed(1);
  document.getElementById('dashTotalSessions').textContent = totalSessions;
  document.getElementById('dashFocusHours').textContent = hours + 'h';

  // This week sessions
  const now = new Date();
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
  let weekSessions = 0;
  Object.entries(dailyData).forEach(([dateStr, data]) => {
    if (new Date(dateStr) >= weekAgo) weekSessions += data.sessions || 0;
  });
  document.getElementById('dashWeekSessions').textContent = weekSessions;

  // Best day
  let bestDay = '—', bestCount = 0;
  Object.entries(dailyData).forEach(([dateStr, data]) => {
    if ((data.sessions || 0) > bestCount) {
      bestCount = data.sessions;
      bestDay = new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  });
  document.getElementById('dashBestDay').textContent = bestDay + (bestCount ? ` (${bestCount})` : '');

  // ─── WEEKLY LINE CHART ─────────────────────────
  const last7Days = [];
  const last7Labels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    last7Days.push(dailyData[key]?.minutes || 0);
    last7Labels.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
  }

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const tickColor = isDark ? '#5a6a8a' : '#8890a6';

  const weekCtx = document.getElementById('weeklyChart').getContext('2d');
  if (weeklyChart) weeklyChart.destroy();
  weeklyChart = new Chart(weekCtx, {
    type: 'line',
    data: {
      labels: last7Labels,
      datasets: [{
        label: 'Focus Minutes',
        data: last7Days,
        borderColor: '#6c5ce7',
        backgroundColor: 'rgba(108,92,231,0.12)',
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: '#6c5ce7',
        pointBorderColor: isDark ? '#0a0e1a' : '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#1a2544' : '#fff',
          titleColor: isDark ? '#f0f4ff' : '#1a1f3a',
          bodyColor: isDark ? '#94a3c4' : '#4a5578',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,92,231,0.15)',
          borderWidth: 1,
          callbacks: {
            label: ctx => ` ${ctx.raw} minutes focused`
          }
        }
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: tickColor, maxRotation: 30 } },
        y: {
          grid: { color: gridColor },
          ticks: { color: tickColor, callback: v => v + 'm' },
          beginAtZero: true
        }
      }
    }
  });

  // ─── DAILY SESSIONS BAR CHART ──────────────────
  const last14Sessions = [];
  const last14Labels = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    last14Sessions.push(dailyData[key]?.sessions || 0);
    last14Labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }

  const dailyCtx = document.getElementById('dailyChart').getContext('2d');
  if (dailyChart) dailyChart.destroy();
  dailyChart = new Chart(dailyCtx, {
    type: 'bar',
    data: {
      labels: last14Labels,
      datasets: [{
        label: 'Sessions',
        data: last14Sessions,
        backgroundColor: last14Sessions.map(v =>
          v === 0 ? 'rgba(255,255,255,0.04)' :
          v >= 4 ? 'rgba(0,184,148,0.7)' :
          'rgba(108,92,231,0.6)'
        ),
        borderColor: last14Sessions.map(v =>
          v === 0 ? 'rgba(255,255,255,0.08)' :
          v >= 4 ? '#00b894' : '#6c5ce7'
        ),
        borderWidth: 1,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(162,155,254,0.8)'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#1a2544' : '#fff',
          titleColor: isDark ? '#f0f4ff' : '#1a1f3a',
          bodyColor: isDark ? '#94a3c4' : '#4a5578',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,92,231,0.15)',
          borderWidth: 1,
          callbacks: {
            label: ctx => ` ${ctx.raw} session${ctx.raw !== 1 ? 's' : ''}`
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: tickColor, maxRotation: 30 } },
        y: {
          grid: { color: gridColor },
          ticks: { color: tickColor, stepSize: 1 },
          beginAtZero: true
        }
      }
    }
  });

  // ─── ACTIVITY LOG ──────────────────────────────
  const logContainer = document.getElementById('activityLog');
  const historyItems = JSON.parse(localStorage.getItem('cs-pomo-history') || '[]');
  if (!historyItems.length) {
    logContainer.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:var(--space-xl) 0;">No activity yet — complete a Pomodoro session!</p>';
  } else {
    logContainer.innerHTML = historyItems.slice(0, 30).map(h => {
      const date = new Date(h.timestamp);
      return `
        <div class="info-row animate-slideIn">
          <div style="display:flex;align-items:center;gap:var(--space-md);">
            <div class="card-icon ${h.type === 'focus' ? 'purple' : 'teal'}" style="width:32px;height:32px;font-size:0.9rem;border-radius:8px;">
              ${h.type === 'focus' ? '🍅' : '☕'}
            </div>
            <div>
              <div style="font-size:0.875rem;font-weight:600;">${h.type === 'focus' ? 'Focus Session' : 'Break'}</div>
              <div style="font-size:0.72rem;color:var(--text-muted);">${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString()}</div>
            </div>
          </div>
          <span class="badge ${h.type === 'focus' ? 'badge-primary' : 'badge-teal'}">${h.duration} min</span>
        </div>
      `;
    }).join('');
  }

  // ─── CLEAR ALL DATA ────────────────────────────
  document.getElementById('clearAllData').addEventListener('click', () => {
    if (!confirm('Clear all productivity data? This cannot be undone.')) return;
    ['cs-pomo-history', 'cs-pomo-daily', 'cs-pomo-total'].forEach(k => localStorage.removeItem(k));
    showToast('All data cleared', 'info');
    initDashboard();
  });
};

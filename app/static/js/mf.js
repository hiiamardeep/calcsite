/* ============================================
   mf.js — SIP / Mutual Fund Calculator
   ============================================ */

let sipChart = null;
let sipType = 'sip';
let sipTableData = [];

function fmtINR(n) {
  if (n >= 1e7) return '₹' + (n/1e7).toFixed(2) + ' Cr';
  if (n >= 1e5) return '₹' + (n/1e5).toFixed(2) + ' L';
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function calcSIP() {
  const r = parseFloat(document.getElementById('sipReturn').value) / 100 / 12; // monthly rate
  const years = parseFloat(document.getElementById('sipDuration').value);
  const n = years * 12;
  const inflation = document.getElementById('inflationToggle').checked ? 0.06 : 0;

  let futureValue, invested, tableRows = [];

  if (sipType === 'sip') {
    const P = parseFloat(document.getElementById('sipAmount').value);
    if (!P || P <= 0) { showToast('Enter a valid SIP amount', 'error'); return; }
    invested = P * n;
    futureValue = r === 0 ? invested : P * (Math.pow(1 + r, n) - 1) / r * (1 + r);

    // Year-by-year table
    for (let yr = 1; yr <= years; yr++) {
      const nm = yr * 12;
      const fv = r === 0 ? P * nm : P * (Math.pow(1 + r, nm) - 1) / r * (1 + r);
      const inv = P * nm;
      tableRows.push({ year: yr, invested: inv, value: fv, returns: fv - inv });
    }
  } else if (sipType === 'lumpsum') {
    const P = parseFloat(document.getElementById('lumpsumAmount').value);
    if (!P || P <= 0) { showToast('Enter a valid lump sum amount', 'error'); return; }
    invested = P;
    futureValue = P * Math.pow(1 + parseFloat(document.getElementById('sipReturn').value)/100, years);

    for (let yr = 1; yr <= years; yr++) {
      const fv = P * Math.pow(1 + parseFloat(document.getElementById('sipReturn').value)/100, yr);
      tableRows.push({ year: yr, invested: P, value: fv, returns: fv - P });
    }
  } else if (sipType === 'stepup') {
    const P0 = parseFloat(document.getElementById('sipAmount').value);
    const stepup = parseFloat(document.getElementById('stepupPct').value) / 100;
    if (!P0 || P0 <= 0) { showToast('Enter a valid SIP amount', 'error'); return; }

    invested = 0; futureValue = 0;
    let balance = 0;

    for (let yr = 1; yr <= years; yr++) {
      const P = P0 * Math.pow(1 + stepup, yr - 1);
      const yearStart = balance;
      for (let m = 0; m < 12; m++) {
        balance = (balance + P) * (1 + r);
        invested += P;
      }
      tableRows.push({ year: yr, invested: Math.round(invested), value: Math.round(balance), returns: Math.round(balance - invested) });
    }
    futureValue = balance;
  }

  const returns = futureValue - invested;
  const wealthRatio = (futureValue / invested).toFixed(2);

  // Annualized return (CAGR approximation for SIP)
  const annualRate = parseFloat(document.getElementById('sipReturn').value);

  // Inflation-adjusted
  const realValue = inflation > 0 ? futureValue / Math.pow(1 + inflation, years) : null;

  // Display
  document.getElementById('sipResultCard').style.display = 'block';
  document.getElementById('sipChartCard').style.display = 'block';
  document.getElementById('sipTableCard').style.display = 'block';

  document.getElementById('sipFutureValue').textContent = fmtINR(futureValue);
  document.getElementById('sipInvested').textContent = fmtINR(invested);
  document.getElementById('sipReturns').textContent = fmtINR(returns);
  document.getElementById('sipWealthRatio').textContent = wealthRatio + '×';
  document.getElementById('sipXIRR').textContent = annualRate.toFixed(1) + '%';

  if (realValue) {
    document.getElementById('sipRealValue').textContent = `Real value (inflation-adjusted): ${fmtINR(realValue)}`;
    document.getElementById('sipRealValue').style.display = 'block';
  } else {
    document.getElementById('sipRealValue').style.display = 'none';
  }

  sipTableData = tableRows;
  renderSIPChart(tableRows);
  renderSIPTable(tableRows);

  showToast('SIP projection calculated!', 'success');

  const cnt = parseInt(localStorage.getItem('cs-calc-count') || '0') + 1;
  localStorage.setItem('cs-calc-count', cnt);
}

function renderSIPChart(rows) {
  const ctx = document.getElementById('sipChart').getContext('2d');
  if (sipChart) sipChart.destroy();

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const tickColor = isDark ? '#5a6a8a' : '#8890a6';

  sipChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: rows.map(r => `Yr ${r.year}`),
      datasets: [
        {
          label: 'Invested',
          data: rows.map(r => Math.round(r.invested)),
          borderColor: '#6c5ce7',
          backgroundColor: 'rgba(108,92,231,0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: rows.length > 15 ? 0 : 3,
        },
        {
          label: 'Wealth',
          data: rows.map(r => Math.round(r.value)),
          borderColor: '#00b894',
          backgroundColor: 'rgba(0,184,148,0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: rows.length > 15 ? 0 : 3,
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#1a2544' : '#fff',
          titleColor: isDark ? '#f0f4ff' : '#1a1f3a',
          bodyColor: isDark ? '#94a3c4' : '#4a5578',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,92,231,0.15)',
          borderWidth: 1,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${fmtINR(ctx.raw)}`
          }
        }
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: tickColor, maxTicksLimit: 10 } },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: tickColor,
            callback: v => fmtINR(v)
          }
        }
      }
    }
  });
}

function renderSIPTable(rows) {
  const container = document.getElementById('sipTable');
  container.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:0.78rem;font-family:var(--font-mono);">
      <thead>
        <tr style="color:var(--text-muted);text-align:right;position:sticky;top:0;background:var(--bg-card);">
          <th style="padding:6px 8px;text-align:left;">Year</th>
          <th style="padding:6px 8px;">Invested</th>
          <th style="padding:6px 8px;">Returns</th>
          <th style="padding:6px 8px;">Wealth</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr style="border-top:1px solid var(--divider);">
            <td style="padding:5px 8px;color:var(--text-muted);">Yr ${r.year}</td>
            <td style="padding:5px 8px;text-align:right;color:#a29bfe;">${fmtINR(r.invested)}</td>
            <td style="padding:5px 8px;text-align:right;color:#00b894;">+${fmtINR(r.returns)}</td>
            <td style="padding:5px 8px;text-align:right;font-weight:600;">${fmtINR(r.value)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// SIP type tabs
document.getElementById('sipTypeTabs').querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('sipTypeTabs').querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    sipType = btn.dataset.siptype;

    document.getElementById('sipMonthlyGroup').style.display = ['sip','stepup'].includes(sipType) ? 'flex' : 'none';
    document.getElementById('lumpsumGroup').style.display = sipType === 'lumpsum' ? 'flex' : 'none';
    document.getElementById('stepupGroup').style.display = sipType === 'stepup' ? 'flex' : 'none';
  });
});

// Preset return buttons
document.querySelectorAll('.preset-return').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('sipReturn').value = btn.dataset.val;
    document.getElementById('sipReturnRange').value = btn.dataset.val;
    document.getElementById('sipReturnDisplay').textContent = btn.dataset.val + '% p.a.';
  });
});

// Range syncing
function syncSIPRange(rangeId, inputId, displayId, fmt) {
  const range = document.getElementById(rangeId);
  const input = document.getElementById(inputId);
  range.addEventListener('input', () => { input.value = range.value; document.getElementById(displayId).textContent = fmt(range.value); });
  input.addEventListener('input', () => { range.value = input.value; document.getElementById(displayId).textContent = fmt(input.value); });
}

syncSIPRange('sipAmountRange', 'sipAmount', 'sipAmountDisplay', v => '₹' + parseInt(v).toLocaleString('en-IN') + ' / mo');
syncSIPRange('sipReturnRange', 'sipReturn', 'sipReturnDisplay', v => parseFloat(v).toFixed(1) + '% p.a.');
syncSIPRange('sipDurationRange', 'sipDuration', 'sipDurationDisplay', v => `${v} Year${v > 1 ? 's' : ''}`);

// Inflation toggle style
document.getElementById('inflationToggle').addEventListener('change', function() {
  const track = document.getElementById('toggleTrack');
  const thumb = document.getElementById('toggleThumb');
  if (this.checked) { track.style.background = 'var(--primary)'; thumb.style.transform = 'translateX(20px)'; }
  else { track.style.background = 'var(--divider)'; thumb.style.transform = 'translateX(0)'; }
});

// Export
document.getElementById('exportSIPCSV').addEventListener('click', () => {
  if (!sipTableData.length) return;
  const csv = ['Year,Invested (₹),Returns (₹),Wealth (₹)',
    ...sipTableData.map(r => `${r.year},${Math.round(r.invested)},${Math.round(r.returns)},${Math.round(r.value)}`)
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'sip_projection.csv'; a.click();
  showToast('SIP data exported!', 'success');
});

document.getElementById('calcSIP').addEventListener('click', calcSIP);

// Init inflation toggle visual
(function() {
  const track = document.getElementById('toggleTrack');
  const thumb = document.getElementById('toggleThumb');
  track.style.background = 'var(--divider)'; thumb.style.transform = 'translateX(0)';
})();

// Auto-calc
calcSIP();

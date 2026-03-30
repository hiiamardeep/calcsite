/* ============================================
   emi.js — EMI / Loan Calculator
   ============================================ */

let emiChart = null;
let amortizationData = [];
let tenureUnit = 'years';

function fmt(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function calcEMI() {
  const P = parseFloat(document.getElementById('loanAmount').value);
  const r = parseFloat(document.getElementById('interestRate').value);
  let t = parseFloat(document.getElementById('loanTenure').value);

  if (!P || !r || !t || P <= 0 || r <= 0 || t <= 0) {
    showToast('Please enter valid loan details', 'error');
    return;
  }

  const n = tenureUnit === 'years' ? t * 12 : t;
  const monthly = r / 12 / 100;

  let emi;
  if (monthly === 0) {
    emi = P / n;
  } else {
    emi = P * monthly * Math.pow(1 + monthly, n) / (Math.pow(1 + monthly, n) - 1);
  }

  const totalPayment = emi * n;
  const totalInterest = totalPayment - P;
  const interestPct = ((totalInterest / totalPayment) * 100).toFixed(1);

  // Show results
  document.getElementById('emiResult').style.display = 'block';
  document.getElementById('emiChartCard').style.display = 'block';
  document.getElementById('emiExportCard').style.display = 'block';

  document.getElementById('emiAmount').textContent = fmt(emi) + '/mo';
  document.getElementById('principalAmt').textContent = fmt(P);
  document.getElementById('totalInterest').textContent = fmt(totalInterest);
  document.getElementById('totalPayment').textContent = fmt(totalPayment);
  document.getElementById('interestPct').textContent = interestPct + '%';

  // Doughnut chart
  renderEMIChart(P, totalInterest);

  // Amortization
  buildAmortization(P, emi, monthly, n);

  showToast('EMI calculated successfully!', 'success');

  // Update calc count
  const cnt = parseInt(localStorage.getItem('cs-calc-count') || '0') + 1;
  localStorage.setItem('cs-calc-count', cnt);
}

function renderEMIChart(principal, interest) {
  const ctx = document.getElementById('emiChart').getContext('2d');
  if (emiChart) emiChart.destroy();

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

  emiChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Principal', 'Interest'],
      datasets: [{
        data: [Math.round(principal), Math.round(interest)],
        backgroundColor: ['rgba(108,92,231,0.8)', 'rgba(253,121,168,0.8)'],
        borderColor: ['#6c5ce7', '#fd79a8'],
        borderWidth: 2,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#1a2544' : '#fff',
          titleColor: isDark ? '#f0f4ff' : '#1a1f3a',
          bodyColor: isDark ? '#94a3c4' : '#4a5578',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,92,231,0.15)',
          borderWidth: 1,
          callbacks: {
            label: ctx => ` ₹${Math.round(ctx.raw).toLocaleString('en-IN')}`
          }
        }
      }
    }
  });
}

function buildAmortization(P, emi, r, n) {
  amortizationData = [];
  let balance = P;

  for (let i = 1; i <= n; i++) {
    const interest = balance * r;
    const principal = emi - interest;
    balance -= principal;
    amortizationData.push({
      month: i,
      emi: Math.round(emi),
      principal: Math.round(principal),
      interest: Math.round(interest),
      balance: Math.max(0, Math.round(balance))
    });
  }

  renderAmortTable();
}

function renderAmortTable() {
  const container = document.getElementById('amortTable');
  const rows = amortizationData.slice(0, 24); // first 24 months shown
  container.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:0.78rem;font-family:var(--font-mono);">
      <thead>
        <tr style="color:var(--text-muted);text-align:right;position:sticky;top:0;background:var(--bg-card);">
          <th style="padding:6px 8px;text-align:left;">Mo</th>
          <th style="padding:6px 8px;">EMI</th>
          <th style="padding:6px 8px;">Principal</th>
          <th style="padding:6px 8px;">Interest</th>
          <th style="padding:6px 8px;">Balance</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr style="border-top:1px solid var(--divider);">
            <td style="padding:5px 8px;color:var(--text-muted);">${r.month}</td>
            <td style="padding:5px 8px;text-align:right;">₹${r.emi.toLocaleString('en-IN')}</td>
            <td style="padding:5px 8px;text-align:right;color:#a29bfe;">₹${r.principal.toLocaleString('en-IN')}</td>
            <td style="padding:5px 8px;text-align:right;color:#fd79a8;">₹${r.interest.toLocaleString('en-IN')}</td>
            <td style="padding:5px 8px;text-align:right;">₹${r.balance.toLocaleString('en-IN')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${amortizationData.length > 24 ? `<p style="text-align:center;color:var(--text-muted);font-size:0.75rem;margin-top:8px;">Showing first 24 months. Export CSV for full schedule.</p>` : ''}
  `;
}

function exportCSV() {
  if (!amortizationData.length) return;
  const headers = 'Month,EMI (₹),Principal (₹),Interest (₹),Balance (₹)';
  const rows = amortizationData.map(r => `${r.month},${r.emi},${r.principal},${r.interest},${r.balance}`);
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'emi_amortization.csv'; a.click();
  URL.revokeObjectURL(url);
  showToast('Amortization schedule exported!', 'success');
}

// Range ↔ Input syncing
function syncRange(rangeId, inputId, displayId, formatter) {
  const range = document.getElementById(rangeId);
  const input = document.getElementById(inputId);
  const display = document.getElementById(displayId);

  range.addEventListener('input', () => {
    input.value = range.value;
    if (display) display.textContent = formatter(range.value);
  });
  input.addEventListener('input', () => {
    range.value = input.value;
    if (display) display.textContent = formatter(input.value);
  });
}

// Tenure unit tabs
document.querySelectorAll('#tenureYears, #tenureMonths').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#tenureYears, #tenureMonths').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    tenureUnit = btn.dataset.unit;
    const range = document.getElementById('loanTenureRange');
    const input = document.getElementById('loanTenure');
    if (tenureUnit === 'years') {
      range.max = 30; range.min = 1;
      input.max = 30; input.min = 1;
      if (parseFloat(input.value) > 30) input.value = 30;
    } else {
      range.max = 360; range.min = 1;
      input.max = 360; input.min = 1;
    }
    document.getElementById('loanTenureDisplay').textContent = `${input.value} ${tenureUnit === 'years' ? 'Years' : 'Months'}`;
  });
});

// Init syncing
syncRange('loanAmountRange', 'loanAmount', 'loanAmountDisplay', v => '₹' + parseInt(v).toLocaleString('en-IN'));
syncRange('interestRateRange', 'interestRate', 'interestRateDisplay', v => parseFloat(v).toFixed(1) + '%');
syncRange('loanTenureRange', 'loanTenure', 'loanTenureDisplay', v => `${v} ${tenureUnit === 'years' ? 'Years' : 'Months'}`);

document.getElementById('calcEMI').addEventListener('click', calcEMI);
document.getElementById('exportCSV').addEventListener('click', exportCSV);

// Auto-calc on load
calcEMI();

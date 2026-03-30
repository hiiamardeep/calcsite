/* ============================================
   percentage.js — Percentage Calculators
   ============================================ */

// Tab switching
document.getElementById('pctTabs').querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('pctTabs').querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.pct-panel').forEach(p => p.style.display = 'none');
    document.getElementById('pct-' + btn.dataset.pct).style.display = 'block';
    clearResult();
  });
});

function clearResult() {
  document.getElementById('pctMainResult').textContent = '—';
  document.getElementById('pctSubResult').textContent = '';
  document.getElementById('pctBreakdown').innerHTML = '';
}

function showResult(main, sub, breakdownItems) {
  const el = document.getElementById('pctMainResult');
  el.textContent = main;
  el.classList.add('result-num-animate');
  setTimeout(() => el.classList.remove('result-num-animate'), 400);

  document.getElementById('pctSubResult').textContent = sub || '';

  const bd = document.getElementById('pctBreakdown');
  if (breakdownItems && breakdownItems.length) {
    bd.innerHTML = breakdownItems.map(([label, val]) => `
      <div class="info-row">
        <span class="info-row-label">${label}</span>
        <span class="info-row-value">${val}</span>
      </div>
    `).join('');
  } else {
    bd.innerHTML = '';
  }

  const cnt = parseInt(localStorage.getItem('cs-calc-count') || '0') + 1;
  localStorage.setItem('cs-calc-count', cnt);
}

function fmt(n) {
  const num = parseFloat(n);
  if (isNaN(num)) return '—';
  return Number.isInteger(num) ? num.toLocaleString() : num.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

// What is X% of Y?
window.calcPctOf = function() {
  const x = parseFloat(document.getElementById('pof-x').value);
  const y = parseFloat(document.getElementById('pof-y').value);
  if (isNaN(x) || isNaN(y)) { showToast('Enter valid numbers', 'error'); return; }
  const result = (x / 100) * y;
  showResult(fmt(result), `${fmt(x)}% of ${fmt(y)}`, [
    ['Calculation', `${fmt(y)} × ${fmt(x)} ÷ 100`],
    ['Result', fmt(result)],
    ['Remaining', fmt(y - result)]
  ]);
  showToast(`${fmt(x)}% of ${fmt(y)} = ${fmt(result)}`, 'success');
};

// Percentage Change
window.calcPctChange = function() {
  const oldVal = parseFloat(document.getElementById('pch-old').value);
  const newVal = parseFloat(document.getElementById('pch-new').value);
  if (isNaN(oldVal) || isNaN(newVal)) { showToast('Enter valid numbers', 'error'); return; }
  if (oldVal === 0) { showToast('Old value cannot be zero', 'error'); return; }
  const change = ((newVal - oldVal) / Math.abs(oldVal)) * 100;
  const dir = change >= 0 ? '📈 Increase' : '📉 Decrease';
  const absChange = Math.abs(change);
  showResult(
    (change >= 0 ? '+' : '') + absChange.toFixed(4) + '%',
    `${dir} from ${fmt(oldVal)} to ${fmt(newVal)}`,
    [
      ['Absolute Change', fmt(newVal - oldVal)],
      ['% Change', change.toFixed(4) + '%'],
      ['Direction', dir]
    ]
  );
  showToast(`Change: ${change >= 0 ? '+' : ''}${absChange.toFixed(2)}%`, change >= 0 ? 'success' : 'warning');
};

// X is what % of Y?
window.calcPctOfTotal = function() {
  const x = parseFloat(document.getElementById('pot-x').value);
  const y = parseFloat(document.getElementById('pot-y').value);
  if (isNaN(x) || isNaN(y)) { showToast('Enter valid numbers', 'error'); return; }
  if (y === 0) { showToast('Total cannot be zero', 'error'); return; }
  const pct = (x / y) * 100;
  showResult(
    pct.toFixed(4) + '%',
    `${fmt(x)} out of ${fmt(y)}`,
    [
      ['Part', fmt(x)],
      ['Total', fmt(y)],
      ['Percentage', pct.toFixed(4) + '%'],
      ['Remaining %', (100 - pct).toFixed(4) + '%']
    ]
  );
  showToast(`${fmt(x)} is ${pct.toFixed(2)}% of ${fmt(y)}`, 'success');
};

// Increase by %
window.calcIncrease = function() {
  const val = parseFloat(document.getElementById('pinc-val').value);
  const pct = parseFloat(document.getElementById('pinc-pct').value);
  if (isNaN(val) || isNaN(pct)) { showToast('Enter valid numbers', 'error'); return; }
  const increase = val * pct / 100;
  const result = val + increase;
  showResult(
    fmt(result),
    `After ${fmt(pct)}% increase`,
    [
      ['Original', fmt(val)],
      ['Increase Amount', '+' + fmt(increase)],
      ['New Value', fmt(result)],
      ['Multiplier', '×' + (1 + pct/100).toFixed(4)]
    ]
  );
  showToast(`${fmt(val)} + ${fmt(pct)}% = ${fmt(result)}`, 'success');
};

// Decrease by %
window.calcDecrease = function() {
  const val = parseFloat(document.getElementById('pdec-val').value);
  const pct = parseFloat(document.getElementById('pdec-pct').value);
  if (isNaN(val) || isNaN(pct)) { showToast('Enter valid numbers', 'error'); return; }
  const decrease = val * pct / 100;
  const result = val - decrease;
  showResult(
    fmt(result),
    `After ${fmt(pct)}% decrease`,
    [
      ['Original', fmt(val)],
      ['Decrease Amount', '−' + fmt(decrease)],
      ['New Value', fmt(result)],
      ['Multiplier', '×' + (1 - pct/100).toFixed(4)]
    ]
  );
  showToast(`${fmt(val)} − ${fmt(pct)}% = ${fmt(result)}`, 'success');
};

// Reverse %
window.calcReverse = function() {
  const final = parseFloat(document.getElementById('prev-final').value);
  const pct = parseFloat(document.getElementById('prev-pct').value);
  const dir = document.getElementById('prev-dir').value;
  if (isNaN(final) || isNaN(pct)) { showToast('Enter valid numbers', 'error'); return; }
  const multiplier = dir === 'increase' ? (1 + pct/100) : (1 - pct/100);
  if (multiplier === 0) { showToast('Invalid: results in division by zero', 'error'); return; }
  const original = final / multiplier;
  showResult(
    fmt(original),
    `Original before ${fmt(pct)}% ${dir}`,
    [
      ['Final Value', fmt(final)],
      ['% Applied', fmt(pct) + '% ' + dir],
      ['Original Value', fmt(original)],
      ['Verification', fmt(dir === 'increase' ? original * (1 + pct/100) : original * (1 - pct/100))]
    ]
  );
  showToast(`Original value was ${fmt(original)}`, 'success');
};

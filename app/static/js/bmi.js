/* ============================================
   bmi.js — BMI Calculator
   ============================================ */

let unit = 'metric';
let gender = 'male';

const categories = [
  { label: 'Severely Underweight', min: 0,    max: 16,   color: '#0984e3', badgeClass: 'badge-primary', needlePos: 4 },
  { label: 'Underweight',          min: 16,   max: 18.5, color: '#00cec9', badgeClass: 'badge-teal',    needlePos: 15 },
  { label: 'Normal Weight',        min: 18.5, max: 24.9, color: '#00b894', badgeClass: 'badge-success', needlePos: 38 },
  { label: 'Overweight',           min: 24.9, max: 30,   color: '#fdcb6e', badgeClass: 'badge-warning', needlePos: 60 },
  { label: 'Obese Class I',        min: 30,   max: 35,   color: '#e17055', badgeClass: 'badge-danger',  needlePos: 74 },
  { label: 'Obese Class II',       min: 35,   max: 40,   color: '#d63031', badgeClass: 'badge-danger',  needlePos: 86 },
  { label: 'Obese Class III',      min: 40,   max: 999,  color: '#6c2020', badgeClass: 'badge-danger',  needlePos: 96 },
];

const advice = {
  'Severely Underweight': 'You are significantly underweight. This can lead to serious health problems. Please consult a healthcare provider immediately and work on a nutrition plan to reach a healthier weight.',
  'Underweight': 'You are slightly underweight. Consider increasing your caloric intake with nutrient-dense foods and incorporating strength training. Consult a nutritionist for a personalized plan.',
  'Normal Weight': '🎉 Excellent! Your weight is in the healthy range. Maintain your current lifestyle with balanced nutrition and regular physical activity. Keep up the great work!',
  'Overweight': 'You are slightly overweight. Small lifestyle changes can make a big difference — try adding 30 minutes of daily exercise and reducing processed foods. A modest 5–10% weight loss improves health significantly.',
  'Obese Class I': 'Your weight may be putting stress on your heart, joints, and other organs. Consider speaking with a doctor about a structured weight-loss program combining diet, exercise, and behavioral support.',
  'Obese Class II': 'This level of obesity carries significant health risks. A comprehensive medical approach is recommended. Please consult your doctor about medically supervised weight-loss options.',
  'Obese Class III': 'This is a serious health risk requiring immediate medical attention. Please speak with your healthcare provider about all available options including dietary interventions and medical treatments.',
};

function getCategory(bmi) {
  return categories.find(c => bmi >= c.min && bmi < c.max) || categories[categories.length - 1];
}

function calcBMI() {
  let heightM, weightKg;
  const age = parseInt(document.getElementById('bmiAge').value) || 25;

  if (unit === 'metric') {
    const hcm = parseFloat(document.getElementById('heightCm').value);
    weightKg = parseFloat(document.getElementById('weightKg').value);
    if (!hcm || !weightKg) { showToast('Please enter height and weight', 'error'); return; }
    heightM = hcm / 100;
  } else {
    const ft = parseFloat(document.getElementById('heightFt').value) || 0;
    const inches = parseFloat(document.getElementById('heightIn').value) || 0;
    weightKg = (parseFloat(document.getElementById('weightLbs').value) || 0) * 0.453592;
    heightM = (ft * 12 + inches) * 0.0254;
  }

  if (heightM <= 0 || weightKg <= 0) { showToast('Invalid measurements', 'error'); return; }

  const bmi = weightKg / (heightM * heightM);
  const cat = getCategory(bmi);

  // Ideal weight range (BMI 18.5–24.9)
  const idealMin = 18.5 * heightM * heightM;
  const idealMax = 24.9 * heightM * heightM;
  const weightDiff = weightKg < idealMin
    ? `+${(idealMin - weightKg).toFixed(1)} kg`
    : weightKg > idealMax
      ? `-${(weightKg - idealMax).toFixed(1)} kg`
      : '✓ In range';

  const bmiPrime = (bmi / 25).toFixed(2);
  const ponderalIndex = (weightKg / Math.pow(heightM, 3)).toFixed(1);

  // Display
  document.getElementById('bmiResults').style.display = 'block';
  document.getElementById('bmiValue').textContent = bmi.toFixed(1);
  document.getElementById('bmiValue').style.color = cat.color;

  const catEl = document.getElementById('bmiCategory');
  catEl.textContent = cat.label;
  catEl.className = `badge ${cat.badgeClass}`;
  catEl.style.fontSize = '0.9rem';
  catEl.style.padding = '6px 16px';

  // Needle position (BMI scale 10–45 mapped to 0–100%)
  const needlePos = Math.min(100, Math.max(0, ((bmi - 10) / 35) * 100));
  document.getElementById('bmiNeedle').style.left = needlePos + '%';

  // Ideal weight display
  document.getElementById('idealWeight').textContent =
    unit === 'metric'
      ? `${idealMin.toFixed(1)}–${idealMax.toFixed(1)} kg`
      : `${(idealMin * 2.205).toFixed(0)}–${(idealMax * 2.205).toFixed(0)} lbs`;

  document.getElementById('weightDiff').textContent = weightDiff;
  document.getElementById('bmiPrime').textContent = bmiPrime;
  document.getElementById('ponderalIndex').textContent = ponderalIndex + ' kg/m³';

  // Advice
  document.getElementById('bmiAdviceText').textContent = advice[cat.label] || advice['Normal Weight'];

  // Animate BMI value
  document.getElementById('bmiValue').classList.add('result-num-animate');
  setTimeout(() => document.getElementById('bmiValue').classList.remove('result-num-animate'), 400);

  showToast(`BMI: ${bmi.toFixed(1)} — ${cat.label}`, bmi >= 18.5 && bmi < 25 ? 'success' : 'info');

  const cnt = parseInt(localStorage.getItem('cs-calc-count') || '0') + 1;
  localStorage.setItem('cs-calc-count', cnt);
}

// Unit switching
document.getElementById('unitTabs').querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('unitTabs').querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    unit = btn.dataset.unit;

    document.getElementById('heightMetric').style.display = unit === 'metric' ? 'flex' : 'none';
    document.getElementById('heightImperial').style.display = unit === 'imperial' ? 'flex' : 'none';
    document.getElementById('weightMetric').style.display = unit === 'metric' ? 'flex' : 'none';
    document.getElementById('weightImperial').style.display = unit === 'imperial' ? 'flex' : 'none';
  });
});

// Gender buttons
document.querySelectorAll('.gender-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    gender = btn.dataset.gender;
  });
});

// Range syncing
const heightCmRange = document.getElementById('heightCmRange');
const heightCm = document.getElementById('heightCm');
const weightKgRange = document.getElementById('weightKgRange');
const weightKg = document.getElementById('weightKg');

heightCmRange.addEventListener('input', () => {
  heightCm.value = heightCmRange.value;
  document.getElementById('heightCmDisplay').textContent = heightCmRange.value + ' cm';
});
heightCm.addEventListener('input', () => {
  heightCmRange.value = heightCm.value;
  document.getElementById('heightCmDisplay').textContent = heightCm.value + ' cm';
});

weightKgRange.addEventListener('input', () => {
  weightKg.value = weightKgRange.value;
  document.getElementById('weightKgDisplay').textContent = weightKgRange.value + ' kg';
});
weightKg.addEventListener('input', () => {
  weightKgRange.value = weightKg.value;
  document.getElementById('weightKgDisplay').textContent = weightKg.value + ' kg';
});

// Toggle style
const inflationToggle = document.getElementById('inflationToggle');
if (inflationToggle) {
  inflationToggle.addEventListener('change', function() {
    const track = document.getElementById('toggleTrack');
    const thumb = document.getElementById('toggleThumb');
    if (this.checked) {
      track.style.background = 'var(--primary)';
      thumb.style.transform = 'translateX(20px)';
    } else {
      track.style.background = 'var(--divider)';
      thumb.style.transform = 'translateX(0)';
    }
  });
}

document.getElementById('calcBMI').addEventListener('click', calcBMI);

// Set today's date default
document.getElementById('bmiAge') && (document.getElementById('bmiAge').value = 25);

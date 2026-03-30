/* ============================================
   age.js — Age Calculator
   ============================================ */

function calcAge() {
  const birthStr = document.getElementById('birthDate').value;
  const targetStr = document.getElementById('targetDate').value;

  if (!birthStr) { showToast('Please enter your date of birth', 'error'); return; }

  const birth = new Date(birthStr);
  const target = targetStr ? new Date(targetStr) : new Date();

  if (birth > target) { showToast('Birth date cannot be after target date', 'error'); return; }

  // Exact years, months, days
  let years = target.getFullYear() - birth.getFullYear();
  let months = target.getMonth() - birth.getMonth();
  let days = target.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) { years--; months += 12; }

  // Total calculations
  const msPerDay = 86400000;
  const totalDays = Math.floor((target - birth) / msPerDay);
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = years * 12 + months;
  const totalHours = totalDays * 24;

  // Next birthday
  const nextBD = new Date(target.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBD <= target) nextBD.setFullYear(target.getFullYear() + 1);
  const daysUntilBD = Math.ceil((nextBD - target) / msPerDay);

  // Show results
  document.getElementById('ageResults').style.display = 'block';

  animateNumber('ageYears', years);
  animateNumber('ageMonths', months);
  animateNumber('ageDays', days);
  animateNumber('totalMonths', totalMonths.toLocaleString());
  animateNumber('totalWeeks', totalWeeks.toLocaleString());
  animateNumber('totalDays', totalDays.toLocaleString());
  animateNumber('totalHours', totalHours.toLocaleString());
  animateNumber('daysUntilBirthday', daysUntilBD);

  document.getElementById('nextBirthdayDate').textContent =
    nextBD.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  showToast(`You are ${years} years, ${months} months, and ${days} days old!`, 'success');

  const cnt = parseInt(localStorage.getItem('cs-calc-count') || '0') + 1;
  localStorage.setItem('cs-calc-count', cnt);
}

function animateNumber(elId, finalVal) {
  const el = document.getElementById(elId);
  const numStr = String(finalVal);
  el.classList.add('result-num-animate');
  el.textContent = numStr;
  setTimeout(() => el.classList.remove('result-num-animate'), 400);
}

// Set defaults
const today = new Date();
const todayStr = today.toISOString().split('T')[0];
document.getElementById('targetDate').value = todayStr;
document.getElementById('targetDate').max = todayStr;
document.getElementById('birthDate').max = todayStr;

document.getElementById('calcAge').addEventListener('click', calcAge);
document.getElementById('birthDate').addEventListener('change', calcAge);
document.getElementById('targetDate').addEventListener('change', calcAge);

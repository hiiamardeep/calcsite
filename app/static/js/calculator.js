/* ============================================
   calculator.js — Full Scientific Calculator
   ============================================ */

class Calculator {
  constructor() {
    this.current = '0';
    this.expression = '';
    this.memory = 0;
    this.history = JSON.parse(localStorage.getItem('cs-calc-history') || '[]');
    this.calcCount = parseInt(localStorage.getItem('cs-calc-count') || '0');
    this.mode = 'basic';
    this.lastResult = null;
    this.newNumber = true;

    this.display = document.getElementById('calcResult');
    this.exprDisplay = document.getElementById('calcExpression');
    this.memDisplay = document.getElementById('memDisplay');
    this.historyList = document.getElementById('historyList');

    this.init();
  }

  init() {
    // Keypad buttons
    document.querySelectorAll('.calc-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        this.handleAction(action);
        this.animateBtn(btn);
      });
    });

    // Mode tabs
    document.querySelectorAll('#calcTabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#calcTabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.mode = btn.dataset.mode;
        document.getElementById('basicKeypad').style.display = this.mode === 'basic' ? 'grid' : 'none';
        document.getElementById('sciKeypad').style.display = this.mode === 'scientific' ? 'grid' : 'none';
      });
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Clear history button
    document.getElementById('clearHistory').addEventListener('click', () => {
      this.history = [];
      localStorage.removeItem('cs-calc-history');
      this.renderHistory();
    });

    this.renderHistory();
    this.updateMem();
  }

  handleAction(action) {
    const digits = '0123456789'.split('');
    if (digits.includes(action)) {
      this.inputDigit(action);
    } else {
      switch(action) {
        case 'decimal': this.inputDecimal(); break;
        case 'add': this.setOperator('+'); break;
        case 'subtract': this.setOperator('-'); break;
        case 'multiply': this.setOperator('*'); break;
        case 'divide': this.setOperator('/'); break;
        case 'equals': this.calculate(); break;
        case 'clear': this.clear(); break;
        case 'negate': this.negate(); break;
        case 'percent': this.percent(); break;
        case 'backspace': this.backspace(); break;
        case 'sqrt': this.sciFunc('sqrt'); break;
        case 'cbrt': this.sciFunc('cbrt'); break;
        case 'pow2': this.sciFunc('pow2'); break;
        case 'pow': this.setOperator('^'); break;
        case 'sin': this.sciFunc('sin'); break;
        case 'cos': this.sciFunc('cos'); break;
        case 'tan': this.sciFunc('tan'); break;
        case 'asin': this.sciFunc('asin'); break;
        case 'acos': this.sciFunc('acos'); break;
        case 'atan': this.sciFunc('atan'); break;
        case 'log': this.sciFunc('log'); break;
        case 'ln': this.sciFunc('ln'); break;
        case 'pi': this.inputConstant(Math.PI); break;
        case 'e': this.inputConstant(Math.E); break;
        case 'factorial': this.sciFunc('factorial'); break;
        case 'lparen': this.inputChar('('); break;
        case 'rparen': this.inputChar(')'); break;
        case 'mc': this.memory = 0; this.updateMem(); showToast('Memory cleared', 'info'); break;
        case 'mr': this.inputConstant(this.memory); break;
        case 'mplus': this.memory += parseFloat(this.current) || 0; this.updateMem(); showToast('Added to memory: ' + this.formatNum(this.memory), 'success'); break;
      }
    }
  }

  inputDigit(d) {
    if (this.newNumber) {
      this.current = d;
      this.newNumber = false;
    } else {
      this.current = this.current === '0' ? d : this.current + d;
    }
    this.updateDisplay();
  }

  inputDecimal() {
    if (this.newNumber) { this.current = '0.'; this.newNumber = false; return; }
    if (!this.current.includes('.')) this.current += '.';
    this.updateDisplay();
  }

  inputChar(c) {
    if (this.newNumber) { this.current = c; this.newNumber = false; }
    else this.current += c;
    this.updateDisplay();
  }

  inputConstant(val) {
    this.current = String(val);
    this.newNumber = false;
    this.updateDisplay();
  }

  setOperator(op) {
    if (!this.newNumber) {
      if (this.expression) {
        try { this.lastResult = this.evalExpr(this.expression + this.current); } catch(e) {}
      } else {
        this.lastResult = parseFloat(this.current);
      }
    }
    const displayOps = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^' };
    this.expression = (this.expression && this.newNumber)
      ? this.expression.slice(0, -1) + op
      : (this.lastResult !== null && this.newNumber ? String(this.lastResult) : this.current) + op;

    this.exprDisplay.textContent = this.expression.replace(/\*/g, '×').replace(/\//g, '÷').replace(/\-/g, '−');
    this.newNumber = true;
    this.lastResult = null;
  }

  calculate() {
    if (!this.expression && this.current === '0') return;
    const fullExpr = this.expression + this.current;
    try {
      const result = this.evalExpr(fullExpr);
      const displayExpr = fullExpr.replace(/\*/g, '×').replace(/\//g, '÷');
      this.addHistory(`${displayExpr} = ${this.formatNum(result)}`);
      this.exprDisplay.textContent = displayExpr + ' =';
      this.current = this.formatNum(result);
      this.expression = '';
      this.newNumber = true;
      this.lastResult = result;
      this.updateDisplay(true);
      this.calcCount++;
      localStorage.setItem('cs-calc-count', this.calcCount);
    } catch(e) {
      this.display.textContent = 'Error';
      setTimeout(() => this.updateDisplay(), 1200);
    }
  }

  evalExpr(expr) {
    // Safe expression evaluator
    const safeExpr = expr
      .replace(/\^/g, '**')
      .replace(/[^0-9+\-*/.()e ]/g, '');
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${safeExpr})`)();
    if (!isFinite(result)) throw new Error('Infinity');
    return result;
  }

  sciFunc(fn) {
    const val = parseFloat(this.current);
    let result;
    const deg2rad = v => v * Math.PI / 180;
    switch(fn) {
      case 'sqrt': result = Math.sqrt(val); break;
      case 'cbrt': result = Math.cbrt(val); break;
      case 'pow2': result = val * val; break;
      case 'sin': result = Math.sin(deg2rad(val)); break;
      case 'cos': result = Math.cos(deg2rad(val)); break;
      case 'tan': result = Math.tan(deg2rad(val)); break;
      case 'asin': result = Math.asin(val) * 180 / Math.PI; break;
      case 'acos': result = Math.acos(val) * 180 / Math.PI; break;
      case 'atan': result = Math.atan(val) * 180 / Math.PI; break;
      case 'log': result = Math.log10(val); break;
      case 'ln': result = Math.log(val); break;
      case 'factorial':
        if (val < 0 || !Number.isInteger(val) || val > 170) { showToast('Invalid input for factorial', 'error'); return; }
        result = this.factorial(val); break;
      default: return;
    }
    if (!isFinite(result) || isNaN(result)) { showToast('Math Error', 'error'); return; }
    const label = { sqrt:'√', cbrt:'∛', pow2:'^2', sin:'sin', cos:'cos', tan:'tan', asin:'asin', acos:'acos', atan:'atan', log:'log', ln:'ln', factorial:'!' };
    this.addHistory(`${label[fn] || fn}(${this.formatNum(val)}) = ${this.formatNum(result)}`);
    this.exprDisplay.textContent = `${label[fn] || fn}(${this.formatNum(val)}) =`;
    this.current = this.formatNum(result);
    this.newNumber = true;
    this.updateDisplay(true);
  }

  factorial(n) {
    if (n <= 1) return 1;
    return n * this.factorial(n - 1);
  }

  negate() {
    if (this.current !== '0') {
      this.current = this.current.startsWith('-') ? this.current.slice(1) : '-' + this.current;
      this.updateDisplay();
    }
  }

  percent() {
    const val = parseFloat(this.current);
    this.current = String(val / 100);
    this.updateDisplay();
  }

  backspace() {
    if (this.newNumber) return;
    this.current = this.current.length > 1 ? this.current.slice(0, -1) : '0';
    if (this.current === '-') this.current = '0';
    this.updateDisplay();
  }

  clear() {
    this.current = '0';
    this.expression = '';
    this.newNumber = true;
    this.lastResult = null;
    this.exprDisplay.textContent = '';
    this.updateDisplay();
  }

  formatNum(n) {
    const num = parseFloat(n);
    if (isNaN(num)) return '0';
    if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-7 && num !== 0)) {
      return num.toExponential(6);
    }
    const str = String(num);
    if (str.includes('.')) {
      const [int, dec] = str.split('.');
      return `${int}.${dec.slice(0, 10).replace(/0+$/, '') || ''}`.replace(/\.$/, '');
    }
    return str;
  }

  updateDisplay(animate = false) {
    const displayVal = this.formatNum(this.current);
    this.display.textContent = displayVal;
    if (animate) this.display.classList.add('result-num-animate');
    setTimeout(() => this.display.classList.remove('result-num-animate'), 300);
  }

  updateMem() {
    this.memDisplay.textContent = this.formatNum(this.memory);
  }

  addHistory(entry) {
    this.history.unshift({ expr: entry, time: new Date().toLocaleTimeString() });
    if (this.history.length > 50) this.history.pop();
    localStorage.setItem('cs-calc-history', JSON.stringify(this.history));
    this.renderHistory();
  }

  renderHistory() {
    if (!this.history.length) {
      this.historyList.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:var(--space-lg) 0;">No history yet</p>';
      return;
    }
    this.historyList.innerHTML = this.history.slice(0, 20).map(h => `
      <div class="info-row" style="cursor:pointer;" onclick="calc.loadHistory('${h.expr.split('=')[1]?.trim() || ''}')">
        <span class="info-row-label" style="font-size:0.78rem; font-family:var(--font-mono);">${h.expr}</span>
        <span style="font-size:0.7rem;color:var(--text-muted);">${h.time}</span>
      </div>
    `).join('');
  }

  loadHistory(val) {
    if (!val) return;
    this.current = val.trim();
    this.newNumber = false;
    this.updateDisplay();
  }

  animateBtn(btn) {
    btn.classList.add('pressed');
    setTimeout(() => btn.classList.remove('pressed'), 120);
  }

  handleKeyboard(e) {
    const keyMap = {
      '0':'0','1':'1','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9',
      '+':'add', '-':'subtract', '*':'multiply', '/':'divide',
      'Enter':'equals', '=':'equals', 'Escape':'clear', 'Backspace':'backspace',
      '.':'decimal', ',':'decimal', '%':'percent'
    };
    const action = keyMap[e.key];
    if (action) {
      e.preventDefault();
      this.handleAction(action);
      // Visual feedback on keypad button
      const btn = document.querySelector(`[data-action="${action}"]`);
      if (btn) this.animateBtn(btn);
    }
  }
}

// Init
const calc = new Calculator();

# Scientific Calculator Expansion — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand the basic 4-operation calculator into a full scientific calculator with trig, log, power, root, memory, 2nd-mode toggle, parentheses, and constants — all in one `index.html` file.

**Architecture:** Extend the existing immediate-execution state machine. Unary scientific functions (sin, √, ln, etc.) apply immediately to the current display value. Binary functions (xʸ, ʸ√x, EE) reuse the existing operator pipeline. The 4-column CSS grid expands to 10 columns (6 scientific + 4 basic). On mobile (≤768px), scientific keys are in a collapsible panel toggled by a button.

**Tech Stack:** Vanilla HTML/CSS/JS (single file), Jest + jsdom for tests.

**Existing files:**
- `index.html` — The calculator app (all HTML + CSS + JS inline)
- `tests/test_main.js` — 47 existing tests (all passing)
- `jest.config.js` / `package.json` — Test infrastructure

---

### Task 1: CSS Grid Expansion & Scientific Button HTML

**Files:**
- Modify: `index.html` (CSS `:root` through `.brand`, HTML `.keys` div)

**Step 1: Update CSS**

Add new CSS custom properties and `.key-sci` class. Expand grid to 10 columns:

```css
/* Add to :root */
--bg-sci: #2d2a35;
--bg-sci-hover: #3d3a45;
--bg-sci-active: #4d4a55;
--bg-second: #5a4f2a;
```

Change `.keys` grid:
```css
.keys {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 8px;
}
```

Add `.key-sci` styles:
```css
.key-sci {
  background: var(--bg-sci);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 400;
  letter-spacing: -0.3px;
}
.key-sci:hover { background: var(--bg-sci-hover); }
.key-sci:active, .key-sci.pressed { background: var(--bg-sci-active); }
.key-sci.active-second { background: var(--bg-second); color: #fff; }
```

Update `.calculator` max-width from `380px` to `780px`. Remove `aspect-ratio: 1` from `.key` (scientific buttons should not be square). Instead add a min-height:
```css
.key {
  /* remove: aspect-ratio: 1; */
  min-height: 52px;
  padding: 8px 4px;
}
```

Keep `aspect-ratio: 1` only for num/op/func/equal keys in the right 4 columns — but it's simpler to just remove it globally and let buttons size naturally in the grid.

Update responsive breakpoints: the old `@media (max-width: 420px)` becomes the mobile layout. Add a new `@media (max-width: 768px)` for tablet/mobile that hides the scientific panel.

**Step 2: Replace HTML button grid**

Replace the entire `.keys` div content with the 10-column layout (50 buttons total, 5 rows × 10 columns):

```
Row 1: (  )  mc  m+  m−  mr  C   ±   %   ÷
Row 2: 2nd x² x³  xʸ  eˣ  10ˣ 7   8   9   ×
Row 3: 1/x √x ∛x  ʸ√x ln  log₁₀ 4  5   6   −
Row 4: x!  sin cos tan  e   EE  1   2   3   +
Row 5: Rad sinh cosh tanh π  Rand  0(span2) . =
```

Each scientific button uses `data-action="<name>"`:
- Parens: `data-action="paren-open"`, `data-action="paren-close"`
- Memory: `data-action="mc"`, `data-action="mplus"`, `data-action="mminus"`, `data-action="mr"`
- Toggle: `data-action="second"`, `data-action="angle-mode"`
- Unary: `data-action="square"`, `data-action="cube"`, `data-action="sqrt"`, `data-action="cbrt"`, `data-action="reciprocal"`, `data-action="factorial"`, `data-action="exp"`, `data-action="exp10"`, `data-action="ln"`, `data-action="log10"`, `data-action="sin"`, `data-action="cos"`, `data-action="tan"`, `data-action="sinh"`, `data-action="cosh"`, `data-action="tanh"`
- Binary (operator-like): `data-action="pow"`, `data-action="yroot"`, `data-action="ee"`
- Constants: `data-action="pi"`, `data-action="euler"`, `data-action="rand"`

Update `.brand` text from "Calculator" to "Scientific Calculator".

**Step 3: Verify layout renders**

Open `index.html` in browser. Verify 10-column grid with all buttons visible. No JS logic yet — buttons just render.

**Step 4: Run existing tests to verify no regression**

Run: `cd aiagent_20260213_153346 && npx jest --verbose`
Expected: All 47 existing tests still PASS (basic calculator buttons still have same data attributes).

**Step 5: Commit**

```bash
git add index.html
git commit -m "feat: expand grid to 10 columns with scientific calculator buttons"
```

---

### Task 2: State Variables & Event Routing Infrastructure

**Files:**
- Modify: `index.html` (JS `<script>` block)

**Step 1: Add new state variables**

After existing state declarations (line ~319-324), add:
```javascript
let angleMode = 'deg';        // 'deg' | 'rad'
let isSecondMode = false;     // 2nd button toggle
let memory = 0;               // memory store
let parenStack = [];           // for ( ) sub-expressions
```

**Step 2: Add handler stub functions**

After `inputBackspace()`, add stub functions that will be implemented in later tasks:

```javascript
function toRad(x) { return angleMode === 'deg' ? x * Math.PI / 180 : x; }
function fromRad(x) { return angleMode === 'deg' ? x * 180 / Math.PI : x; }

function inputUnaryFn(fn) {
  // Stub — implemented in Tasks 3-4
}

function inputBinaryOp(op) {
  // Reuse inputOperator for binary scientific ops
  inputOperator(op);
}

function inputConstant(name) {
  // Stub — implemented in Task 6
}

function inputMemory(action) {
  // Stub — implemented in Task 7
}

function inputAngleToggle() {
  // Stub — implemented in Task 3
}

function inputSecondToggle() {
  // Stub — implemented in Task 8
}

function inputParenOpen() {
  // Stub — implemented in Task 9
}

function inputParenClose() {
  // Stub — implemented in Task 9
}
```

**Step 3: Extend click event handler**

In the click handler's switch statement (line ~572), add cases for all new actions:
```javascript
switch (btn.dataset.action) {
  case 'clear':       inputClear(); break;
  case 'sign':        inputSign(); break;
  case 'percent':     inputPercent(); break;
  case 'op':          inputOperator(btn.dataset.op); break;
  case 'equal':       inputEqual(); break;
  // Scientific unary
  case 'sin': case 'cos': case 'tan':
  case 'sinh': case 'cosh': case 'tanh':
  case 'ln': case 'log10':
  case 'square': case 'cube': case 'sqrt': case 'cbrt':
  case 'exp': case 'exp10':
  case 'reciprocal': case 'factorial':
    inputUnaryFn(btn.dataset.action); break;
  // Scientific binary (operator-like)
  case 'pow': case 'yroot': case 'ee':
    inputBinaryOp(btn.dataset.action); break;
  // Constants
  case 'pi': case 'euler': case 'rand':
    inputConstant(btn.dataset.action); break;
  // Memory
  case 'mc': case 'mplus': case 'mminus': case 'mr':
    inputMemory(btn.dataset.action); break;
  // Toggles
  case 'second':      inputSecondToggle(); break;
  case 'angle-mode':  inputAngleToggle(); break;
  // Parentheses
  case 'paren-open':  inputParenOpen(); break;
  case 'paren-close': inputParenClose(); break;
}
```

**Step 4: Update inputClear to reset new state**

```javascript
function inputClear() {
  currentValue = '0';
  previousValue = null;
  operator = null;
  shouldResetDisplay = false;
  lastExpression = '';
  justEvaluated = false;
  parenStack = [];
  // Note: memory is NOT cleared by C — only mc clears it
  // Note: angleMode and isSecondMode persist across clear
  clearHighlight();
  updateDisplay();
}
```

**Step 5: Extend calculate() for binary scientific ops**

Add cases to `calculate()`:
```javascript
case 'xʸ': return Math.pow(numA, numB);
case 'ʸ√x': return Math.pow(numA, 1 / numB);
case 'EE': return numA * Math.pow(10, numB);
```

**Step 6: Run existing tests**

Run: `cd aiagent_20260213_153346 && npx jest --verbose`
Expected: All 47 tests PASS.

**Step 7: Commit**

```bash
git add index.html
git commit -m "feat: add state variables and event routing for scientific functions"
```

---

### Task 3: Trig Functions + Angle Mode

**Files:**
- Modify: `tests/test_main.js` (add test section 14)
- Modify: `index.html` (implement `inputUnaryFn` for trig, `inputAngleToggle`)

**Step 1: Write failing tests**

Add to `tests/test_main.js`:

```javascript
// ────────────────────────────────────────────────────────
// 14. Trigonometric Functions
// ────────────────────────────────────────────────────────
describe('14. Trigonometric Functions', () => {
  test('14.1 sin(30) = 0.5 in Deg mode', () => {
    typeNumber('30');
    pressAction('sin');
    expect(getDisplay()).toBe('0.5');
  });

  test('14.2 cos(60) = 0.5 in Deg mode', () => {
    typeNumber('60');
    pressAction('cos');
    expect(getDisplay()).toBe('0.5');
  });

  test('14.3 tan(45) = 1 in Deg mode', () => {
    typeNumber('45');
    pressAction('tan');
    expect(getDisplay()).toBe('1');
  });

  test('14.4 sin(0) = 0', () => {
    pressAction('sin');
    expect(getDisplay()).toBe('0');
  });

  test('14.5 Angle mode toggles Deg → Rad', () => {
    const btn = document.querySelector('[data-action="angle-mode"]');
    expect(btn.textContent).toBe('Rad');
    pressAction('angle-mode');
    expect(btn.textContent).toBe('Deg');
  });

  test('14.6 sin(π/6) ≈ 0.5 in Rad mode', () => {
    pressAction('angle-mode'); // switch to Rad
    pressAction('pi');
    pressOp('÷');
    pressNum('6');
    pressAction('equal');
    pressAction('sin');
    expect(getDisplay()).toBe('0.5');
  });

  test('14.7 Expression shows sin(30)', () => {
    typeNumber('30');
    pressAction('sin');
    expect(getExpression()).toBe('sin(30)');
  });
});
```

**Step 2: Run tests — they should fail**

Run: `cd aiagent_20260213_153346 && npx jest --verbose -t "14."`
Expected: FAIL (inputUnaryFn is a stub)

**Step 3: Implement trig functions and angle mode**

In `index.html`, implement `inputUnaryFn`:

```javascript
function inputUnaryFn(fn) {
  if (currentValue === 'Error') return;
  const n = parseFloat(currentValue);
  if (isNaN(n)) return;
  let result;
  let displayFn = fn;

  // If 2nd mode is active, use inverse function
  const actualFn = isSecondMode ? getSecondFn(fn) : fn;
  if (actualFn !== fn) displayFn = actualFn;

  switch (actualFn) {
    // Trig
    case 'sin':   result = Math.sin(toRad(n)); break;
    case 'cos':   result = Math.cos(toRad(n)); break;
    case 'tan':   result = Math.tan(toRad(n)); break;
    case 'asin':  result = fromRad(Math.asin(n)); break;
    case 'acos':  result = fromRad(Math.acos(n)); break;
    case 'atan':  result = fromRad(Math.atan(n)); break;
    // Hyperbolic
    case 'sinh':  result = Math.sinh(n); break;
    case 'cosh':  result = Math.cosh(n); break;
    case 'tanh':  result = Math.tanh(n); break;
    case 'asinh': result = Math.asinh(n); break;
    case 'acosh': result = Math.acosh(n); break;
    case 'atanh': result = Math.atanh(n); break;
    // Log & Exp
    case 'ln':    result = Math.log(n); break;
    case 'log10': result = Math.log10(n); break;
    case 'exp':   result = Math.exp(n); break;
    case 'exp10': result = Math.pow(10, n); break;
    // Power & Root
    case 'square': result = n * n; break;
    case 'cube':   result = n * n * n; break;
    case 'sqrt':   result = Math.sqrt(n); break;
    case 'cbrt':   result = Math.cbrt(n); break;
    // Other
    case 'reciprocal': result = n === 0 ? 'Error' : 1 / n; break;
    case 'factorial':  result = factorial(n); break;
    default: return;
  }

  const inputFormatted = formatNumber(currentValue);
  lastExpression = displayFn + '(' + inputFormatted + ')';

  if (result === 'Error' || !isFinite(result) || isNaN(result)) {
    currentValue = 'Error';
  } else {
    currentValue = formatNumber(result);
  }

  shouldResetDisplay = true;
  justEvaluated = true;
  clearHighlight();
  updateDisplay();
}
```

Add `factorial` helper:
```javascript
function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n > 170) return Infinity;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}
```

Add `getSecondFn` helper (returns the 2nd-mode function name):
```javascript
function getSecondFn(fn) {
  const map = {
    'sin': 'asin', 'cos': 'acos', 'tan': 'atan',
    'sinh': 'asinh', 'cosh': 'acosh', 'tanh': 'atanh',
  };
  return map[fn] || fn;
}
```

Implement `inputAngleToggle`:
```javascript
function inputAngleToggle() {
  angleMode = angleMode === 'deg' ? 'rad' : 'deg';
  const btn = document.querySelector('[data-action="angle-mode"]');
  if (btn) btn.textContent = angleMode === 'deg' ? 'Rad' : 'Deg';
}
```

Note: The angle-mode button label convention: when in Deg mode, button says "Rad" (meaning "press to switch to Rad"). When in Rad mode, button says "Deg" (press to switch to Deg). This matches the iPhone convention.

**Step 4: Run tests**

Run: `cd aiagent_20260213_153346 && npx jest --verbose -t "14."`
Expected: All section 14 tests PASS.

Then run full suite: `npx jest --verbose`
Expected: All tests PASS (47 old + 7 new = 54).

**Step 5: Commit**

```bash
git add index.html tests/test_main.js
git commit -m "feat: add trig functions (sin/cos/tan) with deg/rad angle mode"
```

---

### Task 4: Log, Exponential, Power & Root Functions

**Files:**
- Modify: `tests/test_main.js` (add test sections 15-16)
- Modify: `index.html` (already implemented in `inputUnaryFn` from Task 3)

**Step 1: Write failing tests**

```javascript
// ────────────────────────────────────────────────────────
// 15. Logarithmic & Exponential Functions
// ────────────────────────────────────────────────────────
describe('15. Logarithmic & Exponential Functions', () => {
  test('15.1 ln(1) = 0', () => {
    pressNum('1');
    pressAction('ln');
    expect(getDisplay()).toBe('0');
  });

  test('15.2 log₁₀(100) = 2', () => {
    typeNumber('100');
    pressAction('log10');
    expect(getDisplay()).toBe('2');
  });

  test('15.3 eˣ(1) ≈ 2.71828...', () => {
    pressNum('1');
    pressAction('exp');
    const val = parseFloat(getDisplay());
    expect(val).toBeCloseTo(Math.E, 5);
  });

  test('15.4 10ˣ(3) = 1000', () => {
    pressNum('3');
    pressAction('exp10');
    expect(getDisplay()).toBe('1000');
  });

  test('15.5 ln(0) = Error', () => {
    pressAction('ln');  // ln(0)
    expect(getDisplay()).toBe('Error');
  });
});

// ────────────────────────────────────────────────────────
// 16. Power & Root Functions
// ────────────────────────────────────────────────────────
describe('16. Power & Root Functions', () => {
  test('16.1 x²: 7² = 49', () => {
    pressNum('7');
    pressAction('square');
    expect(getDisplay()).toBe('49');
  });

  test('16.2 x³: 3³ = 27', () => {
    pressNum('3');
    pressAction('cube');
    expect(getDisplay()).toBe('27');
  });

  test('16.3 √x: √16 = 4', () => {
    typeNumber('16');
    pressAction('sqrt');
    expect(getDisplay()).toBe('4');
  });

  test('16.4 ∛x: ∛27 = 3', () => {
    typeNumber('27');
    pressAction('cbrt');
    expect(getDisplay()).toBe('3');
  });

  test('16.5 xʸ (binary): 2 xʸ 10 = 1024', () => {
    pressNum('2');
    pressAction('pow');
    typeNumber('10');
    pressAction('equal');
    expect(getDisplay()).toBe('1024');
  });

  test('16.6 ʸ√x (binary): 27 ʸ√x 3 = 3', () => {
    typeNumber('27');
    pressAction('yroot');
    pressNum('3');
    pressAction('equal');
    expect(getDisplay()).toBe('3');
  });

  test('16.7 √ of negative = Error', () => {
    pressNum('5');
    pressAction('sign');  // -5
    pressAction('sqrt');
    expect(getDisplay()).toBe('Error');
  });

  test('16.8 Expression shows x²(7)', () => {
    pressNum('7');
    pressAction('square');
    expect(getExpression()).toBe('square(7)');
  });
});
```

**Step 2: Run tests — verify they fail**

Run: `cd aiagent_20260213_153346 && npx jest --verbose -t "15\.|16\."`
Expected: FAIL for log/exp tests (if stubs not yet connected), PASS for power/root (already in `inputUnaryFn`).

**Step 3: Fix any remaining issues**

The `inputUnaryFn` function from Task 3 already covers ln, log10, exp, exp10, square, cube, sqrt, cbrt. The binary ops (pow, yroot) go through `inputBinaryOp` → `inputOperator` → `calculate()`.

Ensure `calculate()` has the `xʸ`, `ʸ√x`, `EE` cases added in Task 2. The `inputBinaryOp` function maps action names to operator symbols:

```javascript
function inputBinaryOp(action) {
  const opMap = { 'pow': 'xʸ', 'yroot': 'ʸ√x', 'ee': 'EE' };
  inputOperator(opMap[action] || action);
}
```

**Step 4: Run tests**

Run: `cd aiagent_20260213_153346 && npx jest --verbose`
Expected: All tests PASS.

**Step 5: Commit**

```bash
git add index.html tests/test_main.js
git commit -m "feat: add log, exponential, power, and root functions with tests"
```

---

### Task 5: Utility Functions (1/x, x!, Rand, Constants, EE)

**Files:**
- Modify: `tests/test_main.js` (add test section 17)
- Modify: `index.html` (implement `inputConstant`)

**Step 1: Write failing tests**

```javascript
// ────────────────────────────────────────────────────────
// 17. Utility Functions & Constants
// ────────────────────────────────────────────────────────
describe('17. Utility Functions & Constants', () => {
  test('17.1 1/x: 1/4 = 0.25', () => {
    pressNum('4');
    pressAction('reciprocal');
    expect(getDisplay()).toBe('0.25');
  });

  test('17.2 1/0 = Error', () => {
    pressAction('reciprocal');  // 1/0
    expect(getDisplay()).toBe('Error');
  });

  test('17.3 x!: 5! = 120', () => {
    pressNum('5');
    pressAction('factorial');
    expect(getDisplay()).toBe('120');
  });

  test('17.4 0! = 1', () => {
    pressAction('factorial');  // 0! = 1
    expect(getDisplay()).toBe('1');
  });

  test('17.5 π inserts 3.14159...', () => {
    pressAction('pi');
    const val = parseFloat(getDisplay());
    expect(val).toBeCloseTo(Math.PI, 5);
  });

  test('17.6 e inserts 2.71828...', () => {
    pressAction('euler');
    const val = parseFloat(getDisplay());
    expect(val).toBeCloseTo(Math.E, 5);
  });

  test('17.7 Rand inserts a number between 0 and 1', () => {
    pressAction('rand');
    const val = parseFloat(getDisplay());
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThan(1);
  });

  test('17.8 EE: 5 EE 3 = 5000', () => {
    pressNum('5');
    pressAction('ee');
    pressNum('3');
    pressAction('equal');
    expect(getDisplay()).toBe('5000');
  });

  test('17.9 Constant after operator uses constant as operand', () => {
    pressNum('2');
    pressOp('×');
    pressAction('pi');
    pressAction('equal');
    const val = parseFloat(getDisplay());
    expect(val).toBeCloseTo(2 * Math.PI, 5);
  });
});
```

**Step 2: Run tests — verify failures**

Run: `cd aiagent_20260213_153346 && npx jest --verbose -t "17\."`

**Step 3: Implement inputConstant**

```javascript
function inputConstant(name) {
  let value;
  switch (name) {
    case 'pi':    value = Math.PI; break;
    case 'euler': value = Math.E; break;
    case 'rand':  value = Math.random(); break;
    default: return;
  }

  currentValue = formatNumber(value);

  if (justEvaluated && !shouldResetDisplay) {
    previousValue = null;
    operator = null;
    lastExpression = '';
  }

  justEvaluated = false;
  shouldResetDisplay = false;
  clearHighlight();
  updateDisplay();
}
```

**Step 4: Run tests**

Run: `cd aiagent_20260213_153346 && npx jest --verbose`
Expected: All PASS.

**Step 5: Commit**

```bash
git add index.html tests/test_main.js
git commit -m "feat: add utility functions (1/x, x!, Rand) and constants (π, e, EE)"
```

---

### Task 6: Memory Functions (mc, m+, m−, mr)

**Files:**
- Modify: `tests/test_main.js` (add test section 18)
- Modify: `index.html` (implement `inputMemory`)

**Step 1: Write failing tests**

```javascript
// ────────────────────────────────────────────────────────
// 18. Memory Functions
// ────────────────────────────────────────────────────────
describe('18. Memory Functions', () => {
  test('18.1 m+ stores and mr recalls', () => {
    typeNumber('42');
    pressAction('mplus');
    pressAction('clear');
    pressAction('mr');
    expect(getDisplay()).toBe('42');
  });

  test('18.2 m+ accumulates', () => {
    typeNumber('10');
    pressAction('mplus');
    typeNumber('20');
    pressAction('mplus');
    pressAction('clear');
    pressAction('mr');
    expect(getDisplay()).toBe('30');
  });

  test('18.3 m− subtracts from memory', () => {
    typeNumber('50');
    pressAction('mplus');
    typeNumber('20');
    pressAction('mminus');
    pressAction('clear');
    pressAction('mr');
    expect(getDisplay()).toBe('30');
  });

  test('18.4 mc clears memory', () => {
    typeNumber('99');
    pressAction('mplus');
    pressAction('mc');
    pressAction('clear');
    pressAction('mr');
    expect(getDisplay()).toBe('0');
  });
});
```

**Step 2: Implement inputMemory**

```javascript
function inputMemory(action) {
  switch (action) {
    case 'mc':
      memory = 0;
      break;
    case 'mplus':
      memory += parseFloat(currentValue) || 0;
      break;
    case 'mminus':
      memory -= parseFloat(currentValue) || 0;
      break;
    case 'mr':
      currentValue = formatNumber(memory);
      shouldResetDisplay = false;
      justEvaluated = false;
      updateDisplay();
      break;
  }
}
```

**Step 3: Run tests**

Run: `cd aiagent_20260213_153346 && npx jest --verbose`
Expected: All PASS.

**Step 4: Commit**

```bash
git add index.html tests/test_main.js
git commit -m "feat: add memory functions (mc, m+, m−, mr)"
```

---

### Task 7: 2nd Mode Toggle + Inverse Functions

**Files:**
- Modify: `tests/test_main.js` (add test section 19)
- Modify: `index.html` (implement `inputSecondToggle`, wire inverse functions)

**Step 1: Write failing tests**

```javascript
// ────────────────────────────────────────────────────────
// 19. 2nd Mode & Inverse Functions
// ────────────────────────────────────────────────────────
describe('19. 2nd Mode & Inverse Functions', () => {
  test('19.1 2nd button toggles isSecondMode', () => {
    pressAction('second');
    const btn = document.querySelector('[data-action="second"]');
    expect(btn.classList.contains('active-second')).toBe(true);
    pressAction('second');
    expect(btn.classList.contains('active-second')).toBe(false);
  });

  test('19.2 sin⁻¹(0.5) = 30 in Deg mode', () => {
    pressNum('0');
    pressNum('.');
    pressNum('5');
    pressAction('second');  // activate 2nd mode
    pressAction('sin');     // becomes asin
    expect(getDisplay()).toBe('30');
  });

  test('19.3 cos⁻¹(0.5) = 60 in Deg mode', () => {
    pressNum('0');
    pressNum('.');
    pressNum('5');
    pressAction('second');
    pressAction('cos');
    expect(getDisplay()).toBe('60');
  });

  test('19.4 tan⁻¹(1) = 45 in Deg mode', () => {
    pressNum('1');
    pressAction('second');
    pressAction('tan');
    expect(getDisplay()).toBe('45');
  });

  test('19.5 2nd mode auto-deactivates after use', () => {
    pressNum('1');
    pressAction('second');
    pressAction('sin');  // uses asin, then deactivates 2nd
    const btn = document.querySelector('[data-action="second"]');
    expect(btn.classList.contains('active-second')).toBe(false);
  });

  test('19.6 sinh(1) works', () => {
    pressNum('1');
    pressAction('sinh');
    const val = parseFloat(getDisplay());
    expect(val).toBeCloseTo(Math.sinh(1), 5);
  });

  test('19.7 2nd + sinh = sinh⁻¹', () => {
    pressNum('1');
    pressAction('sinh');   // sinh(1)
    pressAction('second');
    pressAction('sinh');   // asinh(sinh(1)) = 1
    expect(getDisplay()).toBe('1');
  });
});
```

**Step 2: Implement inputSecondToggle**

```javascript
function inputSecondToggle() {
  isSecondMode = !isSecondMode;
  const btn = document.querySelector('[data-action="second"]');
  if (btn) {
    btn.classList.toggle('active-second', isSecondMode);
  }
  // Update button labels to show inverse function names
  updateSecondModeLabels();
}

function updateSecondModeLabels() {
  const labels = {
    'sin': ['sin', 'sin⁻¹'], 'cos': ['cos', 'cos⁻¹'], 'tan': ['tan', 'tan⁻¹'],
    'sinh': ['sinh', 'sinh⁻¹'], 'cosh': ['cosh', 'cosh⁻¹'], 'tanh': ['tanh', 'tanh⁻¹'],
  };
  for (const [action, [primary, secondary]] of Object.entries(labels)) {
    const btn = document.querySelector(`[data-action="${action}"]`);
    if (btn) btn.textContent = isSecondMode ? secondary : primary;
  }
}
```

In `inputUnaryFn`, add auto-deactivation of 2nd mode after use:
```javascript
// At the end of inputUnaryFn, after updateDisplay():
if (isSecondMode) {
  isSecondMode = false;
  const secBtn = document.querySelector('[data-action="second"]');
  if (secBtn) secBtn.classList.remove('active-second');
  updateSecondModeLabels();
}
```

**Step 3: Run tests**

Run: `cd aiagent_20260213_153346 && npx jest --verbose`
Expected: All PASS.

**Step 4: Commit**

```bash
git add index.html tests/test_main.js
git commit -m "feat: add 2nd mode toggle with inverse trig/hyperbolic functions"
```

---

### Task 8: Parentheses

**Files:**
- Modify: `tests/test_main.js` (add test section 20)
- Modify: `index.html` (implement `inputParenOpen`, `inputParenClose`)

**Step 1: Write failing tests**

```javascript
// ────────────────────────────────────────────────────────
// 20. Parentheses
// ────────────────────────────────────────────────────────
describe('20. Parentheses', () => {
  test('20.1 (2 + 3) × 4 = 20', () => {
    pressAction('paren-open');
    pressNum('2');
    pressOp('+');
    pressNum('3');
    pressAction('paren-close');
    pressOp('×');
    pressNum('4');
    pressAction('equal');
    expect(getDisplay()).toBe('20');
  });

  test('20.2 Simple parens: (5) = 5', () => {
    pressAction('paren-open');
    pressNum('5');
    pressAction('paren-close');
    expect(getDisplay()).toBe('5');
  });

  test('20.3 Nested: ((2 + 3)) × 2 = 10', () => {
    pressAction('paren-open');
    pressAction('paren-open');
    pressNum('2');
    pressOp('+');
    pressNum('3');
    pressAction('paren-close');
    pressAction('paren-close');
    pressOp('×');
    pressNum('2');
    pressAction('equal');
    expect(getDisplay()).toBe('10');
  });

  test('20.4 3 × (4 + 5) = 27', () => {
    pressNum('3');
    pressOp('×');
    pressAction('paren-open');
    pressNum('4');
    pressOp('+');
    pressNum('5');
    pressAction('paren-close');
    pressAction('equal');
    expect(getDisplay()).toBe('27');
  });
});
```

**Step 2: Implement parentheses using stack**

```javascript
function inputParenOpen() {
  // Save current calculator state
  parenStack.push({
    previousValue: previousValue,
    operator: operator,
    lastExpression: lastExpression,
  });
  // Reset for sub-expression
  previousValue = null;
  operator = null;
  shouldResetDisplay = true;
  justEvaluated = false;
}

function inputParenClose() {
  if (parenStack.length === 0) return; // ignore unmatched )

  // Evaluate any pending operation in current scope
  if (operator !== null && previousValue !== null && !shouldResetDisplay) {
    const result = calculate(previousValue, currentValue, operator);
    if (result === 'Error') {
      currentValue = 'Error';
    } else {
      currentValue = formatNumber(result);
    }
  }

  // Restore parent scope
  const saved = parenStack.pop();
  previousValue = saved.previousValue;
  operator = saved.operator;
  lastExpression = saved.lastExpression;

  shouldResetDisplay = true;
  justEvaluated = true;
  updateDisplay();
}
```

**Step 3: Run tests**

Run: `cd aiagent_20260213_153346 && npx jest --verbose`
Expected: All PASS.

**Step 4: Commit**

```bash
git add index.html tests/test_main.js
git commit -m "feat: add parentheses with stack-based sub-expression evaluation"
```

---

### Task 9: Responsive Mobile Design

**Files:**
- Modify: `index.html` (CSS responsive rules, add mobile toggle button in HTML)

**Step 1: Add mobile toggle button**

In HTML, above `.keys`, add:
```html
<button class="sci-toggle" id="sciToggle">Scientific ▼</button>
```

**Step 2: Add CSS for mobile layout**

```css
.sci-toggle {
  display: none; /* hidden on desktop */
}

@media (max-width: 768px) {
  .calculator {
    max-width: 100%;
    border-radius: 0;
    min-height: 100vh;
    min-height: 100dvh;
    padding: 40px 16px 24px;
    display: flex;
    flex-direction: column;
  }

  .sci-toggle {
    display: block;
    width: 100%;
    padding: 8px;
    margin-bottom: 8px;
    background: var(--bg-sci);
    color: var(--text-secondary);
    border: none;
    border-radius: 8px;
    font-family: var(--font-ui);
    font-size: 12px;
    cursor: pointer;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .keys {
    grid-template-columns: repeat(4, 1fr) !important;
  }

  /* Hide scientific buttons on mobile by default */
  .key-sci {
    display: none;
  }

  /* Show scientific buttons when panel is open */
  .calculator.sci-open .keys {
    grid-template-columns: repeat(10, 1fr) !important;
  }
  .calculator.sci-open .key-sci {
    display: flex;
  }
}
```

**Step 3: Add toggle JS**

```javascript
const sciToggle = document.getElementById('sciToggle');
if (sciToggle) {
  sciToggle.addEventListener('click', () => {
    document.querySelector('.calculator').classList.toggle('sci-open');
    sciToggle.textContent = document.querySelector('.calculator').classList.contains('sci-open')
      ? 'Scientific ▲' : 'Scientific ▼';
  });
}
```

**Step 4: Verify visually**

Open `index.html` in browser, resize window to <768px width. Verify:
- Scientific buttons are hidden
- Toggle button appears
- Tapping toggle shows/hides scientific panel
- Basic calculator still works in 4-column layout

**Step 5: Run all tests**

Run: `cd aiagent_20260213_153346 && npx jest --verbose`
Expected: All PASS (tests run in full desktop mode via jsdom).

**Step 6: Commit**

```bash
git add index.html
git commit -m "feat: add responsive mobile layout with scientific panel toggle"
```

---

### Task 10: Final Integration & Regression

**Files:**
- Modify: `tests/test_main.js` (add integration tests)
- Modify: `index.html` (any bug fixes discovered)

**Step 1: Add integration tests**

```javascript
// ────────────────────────────────────────────────────────
// 21. Scientific Integration Tests
// ────────────────────────────────────────────────────────
describe('21. Scientific Integration Tests', () => {
  test('21.1 Chain: sin(30) + cos(60) = 1', () => {
    typeNumber('30');
    pressAction('sin');     // 0.5
    pressOp('+');
    typeNumber('60');
    pressAction('cos');     // 0.5
    pressAction('equal');
    expect(getDisplay()).toBe('1');
  });

  test('21.2 √(x²) identity: √(49) = 7', () => {
    pressNum('7');
    pressAction('square');  // 49
    pressAction('sqrt');    // 7
    expect(getDisplay()).toBe('7');
  });

  test('21.3 ln(eˣ) identity: ln(e¹) = 1', () => {
    pressNum('1');
    pressAction('exp');     // e^1 = 2.71828...
    pressAction('ln');      // ln(e) = 1
    expect(getDisplay()).toBe('1');
  });

  test('21.4 Memory with scientific: m+ sin(30), mr = 0.5', () => {
    typeNumber('30');
    pressAction('sin');
    pressAction('mplus');
    pressAction('clear');
    pressAction('mr');
    expect(getDisplay()).toBe('0.5');
  });

  test('21.5 Clear resets scientific state', () => {
    pressAction('paren-open');
    pressNum('5');
    pressAction('clear');
    expect(getDisplay()).toBe('0');
    // Verify paren stack is cleared
    pressNum('3');
    pressOp('+');
    pressNum('2');
    pressAction('equal');
    expect(getDisplay()).toBe('5');
  });
});
```

**Step 2: Run full test suite**

Run: `cd aiagent_20260213_153346 && npx jest --verbose`
Expected: ALL tests PASS (47 original + ~35 new ≈ 82 total).

**Step 3: Fix any failures**

If any test fails, debug and fix. Common issues:
- Floating-point precision in trig: use `toBeCloseTo` or adjust `formatNumber`
- State not properly reset between operations
- 2nd mode not deactivating after parentheses

**Step 4: Update CLAUDE.md**

Update the project CLAUDE.md to reflect the new architecture:
- New state variables (angleMode, isSecondMode, memory, parenStack)
- New function categories (unary, binary, constants, memory)
- New button data-action conventions
- 2nd mode behavior
- Responsive design strategy

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete scientific calculator with integration tests"
```

---

## Summary of All Tasks

| Task | Description | New Tests |
|------|-------------|-----------|
| 1 | CSS grid expansion + all HTML buttons | 0 (visual) |
| 2 | State variables + event routing infrastructure | 0 (infra) |
| 3 | Trig functions (sin/cos/tan) + angle mode | 7 |
| 4 | Log, exp, power, root functions | 8 |
| 5 | Utilities (1/x, x!, Rand, π, e, EE) | 9 |
| 6 | Memory functions (mc, m+, m−, mr) | 4 |
| 7 | 2nd mode toggle + inverse functions | 7 |
| 8 | Parentheses (stack-based) | 4 |
| 9 | Responsive mobile design | 0 (visual) |
| 10 | Integration tests + regression fix + docs | 5 |

**Total new tests: ~44 | Total after completion: ~91**

/**
 * Calculator App — Test Suite (TDD Red Phase)
 *
 * Tests all features defined in the PRD:
 *  - Basic arithmetic (add, subtract, multiply, divide)
 *  - Percentage calculation (contextual & standalone)
 *  - Utility functions (clear, toggle sign, decimal, equals, backspace)
 *  - Keyboard support
 *  - Floating-point precision
 *  - Edge cases
 *
 * Strategy: Load the full index.html into jsdom, interact via DOM events,
 * and assert on the visible display output.
 *
 * Note: We use new Function() to execute the calculator's embedded <script>
 * in the jsdom environment. This is safe — it only runs our own local
 * index.html script content in an isolated test environment.
 */

const fs = require('fs');
const path = require('path');

// ── Helpers ─────────────────────────────────────────────

/**
 * Load the calculator HTML into jsdom.
 * We read index.html content, strip the external font @import (jsdom can't fetch it),
 * set it as the global document, then execute the embedded script.
 */
function loadCalculator() {
  let html = fs.readFileSync(
    path.resolve(__dirname, '..', 'index.html'),
    'utf-8'
  );

  // Remove the Google Fonts @import that jsdom cannot load
  html = html.replace(/@import url\([^)]+\);?/g, '');

  // Set the HTML on the jsdom document
  document.documentElement.innerHTML = html;

  // The IIFE inside <script> needs to be executed manually in jsdom.
  // Extract and run the script content. This is safe: test-only code
  // running our own local calculator script in an isolated environment.
  const scriptEl = document.querySelector('script');
  if (scriptEl && scriptEl.textContent) {
    // eslint-disable-next-line no-new-func -- safe: executing our own local script in test env
    const fn = new Function(scriptEl.textContent);
    fn();
  }
}

/** Get the main display text (current value). */
function getDisplay() {
  return document.getElementById('display').textContent;
}

/** Get the expression line text. */
function getExpression() {
  return document.getElementById('expression').textContent;
}

/** Click a button by its data-num attribute (digits and decimal). */
function pressNum(num) {
  const btn = document.querySelector(`[data-num="${num}"]`);
  if (!btn) throw new Error(`No button found for data-num="${num}"`);
  btn.click();
}

/** Click an operator button by its data-op attribute (÷, ×, −, +). */
function pressOp(op) {
  const btn = document.querySelector(`[data-op="${op}"]`);
  if (!btn) throw new Error(`No button found for data-op="${op}"`);
  btn.click();
}

/** Click a function button by its data-action attribute (clear, sign, percent, equal). */
function pressAction(action) {
  const btn = document.querySelector(`[data-action="${action}"]`);
  if (!btn) throw new Error(`No button found for data-action="${action}"`);
  btn.click();
}

/** Simulate a keyboard keydown event on the document. */
function pressKey(key) {
  const event = new KeyboardEvent('keydown', {
    key: key,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
}

/** Type a sequence of number digits via button clicks. */
function typeNumber(numStr) {
  for (const ch of numStr) {
    pressNum(ch);
  }
}

// ── Test Suites ─────────────────────────────────────────

beforeEach(() => {
  loadCalculator();
});

// ────────────────────────────────────────────────────────
// 1. Initial State
// ────────────────────────────────────────────────────────
describe('1. Initial State', () => {
  test('1.1 Display shows "0" on load', () => {
    expect(getDisplay()).toBe('0');
  });

  test('1.2 Expression line is empty on load', () => {
    expect(getExpression()).toBe('');
  });
});

// ────────────────────────────────────────────────────────
// 2. Number Input
// ────────────────────────────────────────────────────────
describe('2. Number Input', () => {
  test('2.1 Single digit input displays the digit', () => {
    pressNum('7');
    expect(getDisplay()).toBe('7');
  });

  test('2.2 Multi-digit input concatenates correctly', () => {
    typeNumber('123');
    expect(getDisplay()).toBe('123');
  });

  test('2.3 Leading zero is suppressed (05 → 5)', () => {
    pressNum('0');
    pressNum('5');
    expect(getDisplay()).toBe('5');
  });

  test('2.4 Decimal point input (1.5)', () => {
    pressNum('1');
    pressNum('.');
    pressNum('5');
    expect(getDisplay()).toBe('1.5');
  });

  test('2.5 Duplicate decimal point is prevented', () => {
    pressNum('1');
    pressNum('.');
    pressNum('5');
    pressNum('.');
    expect(getDisplay()).toBe('1.5');
  });

  test('2.6 Maximum 15-digit input limit', () => {
    // Type 16 digits — only 15 should register
    for (let i = 0; i < 16; i++) {
      pressNum(String((i + 1) % 10));
    }
    const display = getDisplay();
    const digits = display.replace(/[^0-9]/g, '');
    expect(digits.length).toBeLessThanOrEqual(15);
  });

  test('2.7 Decimal starting with 0. (0.3)', () => {
    pressNum('0');
    pressNum('.');
    pressNum('3');
    expect(getDisplay()).toBe('0.3');
  });
});

// ────────────────────────────────────────────────────────
// 3. Basic Arithmetic Operations
// ────────────────────────────────────────────────────────
describe('3. Basic Arithmetic Operations', () => {
  test('3.1 Addition: 5 + 3 = 8', () => {
    pressNum('5');
    pressOp('+');
    pressNum('3');
    pressAction('equal');
    expect(getDisplay()).toBe('8');
  });

  test('3.2 Subtraction: 10 - 4 = 6', () => {
    typeNumber('10');
    pressOp('-');
    pressNum('4');
    pressAction('equal');
    expect(getDisplay()).toBe('6');
  });

  test('3.3 Multiplication: 6 × 7 = 42', () => {
    pressNum('6');
    pressOp('×');
    pressNum('7');
    pressAction('equal');
    expect(getDisplay()).toBe('42');
  });

  test('3.4 Division: 15 ÷ 3 = 5', () => {
    typeNumber('15');
    pressOp('÷');
    pressNum('3');
    pressAction('equal');
    expect(getDisplay()).toBe('5');
  });

  test('3.5 Negative result: 3 - 10 = -7', () => {
    pressNum('3');
    pressOp('-');
    typeNumber('10');
    pressAction('equal');
    expect(getDisplay()).toBe('-7');
  });

  test('3.6 Decimal result: 10 ÷ 4 = 2.5', () => {
    typeNumber('10');
    pressOp('÷');
    pressNum('4');
    pressAction('equal');
    expect(getDisplay()).toBe('2.5');
  });

  test('3.7 Large number arithmetic: 999999 × 999999', () => {
    typeNumber('999999');
    pressOp('×');
    typeNumber('999999');
    pressAction('equal');
    expect(getDisplay()).toBe('999998000001');
  });
});

// ────────────────────────────────────────────────────────
// 4. Operator Chaining
// ────────────────────────────────────────────────────────
describe('4. Operator Chaining', () => {
  test('4.1 Chain: 5 + 3 - 2 = 6', () => {
    pressNum('5');
    pressOp('+');
    pressNum('3');
    pressOp('-');  // Should evaluate 5+3=8 first
    pressNum('2');
    pressAction('equal');
    expect(getDisplay()).toBe('6');
  });

  test('4.2 Intermediate result is displayed when chaining', () => {
    pressNum('5');
    pressOp('+');
    pressNum('3');
    pressOp('×');  // Should show 8 as intermediate result
    expect(getDisplay()).toBe('8');
  });
});

// ────────────────────────────────────────────────────────
// 5. Percentage Calculation
// ────────────────────────────────────────────────────────
describe('5. Percentage Calculation', () => {
  test('5.1 In-expression: 100 + 10% = 110', () => {
    typeNumber('100');
    pressOp('+');
    typeNumber('10');
    pressAction('percent');
    pressAction('equal');
    expect(getDisplay()).toBe('110');
  });

  test('5.2 Standalone: 50% = 0.5', () => {
    typeNumber('50');
    pressAction('percent');
    expect(getDisplay()).toBe('0.5');
  });

  test('5.3 In-expression: 200 - 25% = 150', () => {
    typeNumber('200');
    pressOp('-');
    typeNumber('25');
    pressAction('percent');
    pressAction('equal');
    expect(getDisplay()).toBe('150');
  });
});

// ────────────────────────────────────────────────────────
// 6. Division by Zero
// ────────────────────────────────────────────────────────
describe('6. Division by Zero', () => {
  test('6.1 Direct division by zero shows "Error"', () => {
    pressNum('5');
    pressOp('÷');
    pressNum('0');
    pressAction('equal');
    expect(getDisplay()).toBe('Error');
  });

  test('6.2 Clear recovers from Error state', () => {
    pressNum('5');
    pressOp('÷');
    pressNum('0');
    pressAction('equal');
    expect(getDisplay()).toBe('Error');

    pressAction('clear');
    expect(getDisplay()).toBe('0');
    expect(getExpression()).toBe('');
  });

  test('6.3 Number input after Error resets calculator', () => {
    pressNum('5');
    pressOp('÷');
    pressNum('0');
    pressAction('equal');
    expect(getDisplay()).toBe('Error');

    pressNum('7');
    expect(getDisplay()).toBe('7');
  });
});

// ────────────────────────────────────────────────────────
// 7. Clear Function (C)
// ────────────────────────────────────────────────────────
describe('7. Clear Function (C)', () => {
  test('7.1 Clear resets display to "0" and expression to empty', () => {
    typeNumber('123');
    pressAction('clear');
    expect(getDisplay()).toBe('0');
    expect(getExpression()).toBe('');
  });

  test('7.2 Clear resets mid-operation', () => {
    pressNum('5');
    pressOp('+');
    pressNum('3');
    pressAction('clear');
    expect(getDisplay()).toBe('0');
    expect(getExpression()).toBe('');

    // Verify state is fully reset — pressing = should not evaluate old op
    pressNum('9');
    pressAction('equal');
    expect(getDisplay()).toBe('9');
  });
});

// ────────────────────────────────────────────────────────
// 8. Toggle Sign (±)
// ────────────────────────────────────────────────────────
describe('8. Toggle Sign (±)', () => {
  test('8.1 Positive to negative: 5 → -5', () => {
    pressNum('5');
    pressAction('sign');
    expect(getDisplay()).toBe('-5');
  });

  test('8.2 Negative back to positive: -5 → 5', () => {
    pressNum('5');
    pressAction('sign');
    expect(getDisplay()).toBe('-5');
    pressAction('sign');
    expect(getDisplay()).toBe('5');
  });

  test('8.3 Toggle on zero has no effect', () => {
    pressAction('sign');
    expect(getDisplay()).toBe('0');
  });
});

// ────────────────────────────────────────────────────────
// 9. Backspace
// ────────────────────────────────────────────────────────
describe('9. Backspace', () => {
  test('9.1 Delete last digit: 123 → 12', () => {
    typeNumber('123');
    pressKey('Backspace');
    expect(getDisplay()).toBe('12');
  });

  test('9.2 Delete to single digit resets to 0', () => {
    pressNum('5');
    pressKey('Backspace');
    expect(getDisplay()).toBe('0');
  });

  test('9.3 No effect during Error state', () => {
    pressNum('5');
    pressOp('÷');
    pressNum('0');
    pressAction('equal');
    expect(getDisplay()).toBe('Error');

    pressKey('Backspace');
    expect(getDisplay()).toBe('Error');
  });
});

// ────────────────────────────────────────────────────────
// 10. Floating-Point Precision
// ────────────────────────────────────────────────────────
describe('10. Floating-Point Precision', () => {
  test('10.1 0.1 + 0.2 = 0.3 (no floating-point artifact)', () => {
    pressNum('0');
    pressNum('.');
    pressNum('1');
    pressOp('+');
    pressNum('0');
    pressNum('.');
    pressNum('2');
    pressAction('equal');
    expect(getDisplay()).toBe('0.3');
  });

  test('10.2 0.3 - 0.1 = 0.2 (no floating-point artifact)', () => {
    pressNum('0');
    pressNum('.');
    pressNum('3');
    pressOp('-');
    pressNum('0');
    pressNum('.');
    pressNum('1');
    pressAction('equal');
    expect(getDisplay()).toBe('0.2');
  });
});

// ────────────────────────────────────────────────────────
// 11. Keyboard Support
// ────────────────────────────────────────────────────────
describe('11. Keyboard Support', () => {
  test('11.1 Number keys (0-9) input digits', () => {
    pressKey('4');
    pressKey('2');
    expect(getDisplay()).toBe('42');
  });

  test('11.2 Operator keys (+, -, *, /) register operations', () => {
    pressKey('8');
    pressKey('+');
    pressKey('2');
    pressKey('Enter');
    expect(getDisplay()).toBe('10');
  });

  test('11.3 Enter key triggers equals', () => {
    pressKey('6');
    pressKey('*');
    pressKey('7');
    pressKey('Enter');
    expect(getDisplay()).toBe('42');
  });

  test('11.4 Escape key triggers clear', () => {
    pressKey('5');
    pressKey('Escape');
    expect(getDisplay()).toBe('0');
    expect(getExpression()).toBe('');
  });

  test('11.5 Backspace key deletes last digit', () => {
    pressKey('1');
    pressKey('2');
    pressKey('3');
    pressKey('Backspace');
    expect(getDisplay()).toBe('12');
  });

  test('11.6 Period key adds decimal point', () => {
    pressKey('3');
    pressKey('.');
    pressKey('5');
    expect(getDisplay()).toBe('3.5');
  });

  test('11.7 % key triggers percentage', () => {
    pressKey('5');
    pressKey('0');
    pressKey('%');
    expect(getDisplay()).toBe('0.5');
  });
});

// ────────────────────────────────────────────────────────
// 12. Expression Display
// ────────────────────────────────────────────────────────
describe('12. Expression Display', () => {
  test('12.1 Expression shown during operation', () => {
    pressNum('5');
    pressOp('+');
    expect(getExpression()).toBe('5 +');
  });

  test('12.2 Full expression shown after equals', () => {
    pressNum('5');
    pressOp('+');
    pressNum('3');
    pressAction('equal');
    expect(getExpression()).toBe('5 + 3 =');
  });
});

// ────────────────────────────────────────────────────────
// 13. Edge Cases
// ────────────────────────────────────────────────────────
describe('13. Edge Cases', () => {
  test('13.1 Equals with no pending operation does nothing', () => {
    pressNum('5');
    pressAction('equal');
    expect(getDisplay()).toBe('5');
  });

  test('13.2 Multiple equals presses do not crash', () => {
    pressNum('5');
    pressOp('+');
    pressNum('3');
    pressAction('equal');
    expect(getDisplay()).toBe('8');

    pressAction('equal');
    // Should not crash; display remains stable
    expect(getDisplay()).toBeTruthy();
  });

  test('13.3 Operator change replaces previous operator', () => {
    pressNum('5');
    pressOp('+');
    pressOp('×');  // Change mind: multiply instead of add
    pressNum('3');
    pressAction('equal');
    expect(getDisplay()).toBe('15');
  });

  test('13.4 New calculation starts fresh after equals', () => {
    pressNum('5');
    pressOp('+');
    pressNum('3');
    pressAction('equal');
    expect(getDisplay()).toBe('8');

    pressNum('2');
    expect(getDisplay()).toBe('2');

    pressOp('+');
    pressNum('1');
    pressAction('equal');
    expect(getDisplay()).toBe('3');
  });
});

// ────────────────────────────────────────────────────────
// 14. Trigonometric Functions
// ────────────────────────────────────────────────────────
describe('14. Trigonometric Functions', () => {
  test('14.1 sin(30) = 0.5 in Deg mode', () => {
    // Default angle mode is deg (button shows "Rad")
    typeNumber('30');
    pressAction('sin');
    expect(parseFloat(getDisplay())).toBeCloseTo(0.5, 10);
  });

  test('14.2 cos(60) = 0.5 in Deg mode', () => {
    typeNumber('60');
    pressAction('cos');
    expect(parseFloat(getDisplay())).toBeCloseTo(0.5, 10);
  });

  test('14.3 tan(45) = 1 in Deg mode', () => {
    typeNumber('45');
    pressAction('tan');
    expect(parseFloat(getDisplay())).toBeCloseTo(1, 10);
  });

  test('14.4 sin(0) = 0', () => {
    // currentValue is already '0' on load
    pressAction('sin');
    expect(getDisplay()).toBe('0');
  });

  test('14.5 Angle mode toggle: button shows "Rad" initially, changes to "Deg" after toggle', () => {
    const btn = document.querySelector('[data-action="angle-mode"]');
    expect(btn.textContent).toBe('Rad');
    pressAction('angle-mode');
    expect(btn.textContent).toBe('Deg');
  });

  test('14.6 sin(pi/6) approx 0.5 in Rad mode', () => {
    // Toggle to Rad mode
    pressAction('angle-mode');
    // Insert pi
    pressAction('pi');
    // Divide by 6
    pressOp('÷');
    pressNum('6');
    pressAction('equal');
    // Now take sin of the result
    pressAction('sin');
    expect(parseFloat(getDisplay())).toBeCloseTo(0.5, 5);
  });

  test('14.7 Expression shows "sin(30)" after sin(30)', () => {
    typeNumber('30');
    pressAction('sin');
    expect(getExpression()).toBe('sin(30)');
  });
});

// ────────────────────────────────────────────────────────
// 15. Log & Exponential Functions
// ────────────────────────────────────────────────────────
describe('15. Log & Exponential Functions', () => {
  test('15.1 ln(1) = 0', () => {
    pressNum('1');
    pressAction('ln');
    expect(getDisplay()).toBe('0');
  });

  test('15.2 log10(100) = 2', () => {
    typeNumber('100');
    pressAction('log10');
    expect(getDisplay()).toBe('2');
  });

  test('15.3 exp(1) approx 2.71828', () => {
    pressNum('1');
    pressAction('exp');
    expect(parseFloat(getDisplay())).toBeCloseTo(Math.E, 5);
  });

  test('15.4 10^3 = 1000', () => {
    pressNum('3');
    pressAction('exp10');
    expect(getDisplay()).toBe('1000');
  });

  test('15.5 ln(0) = Error', () => {
    // Display starts at '0', press ln
    pressAction('ln');
    expect(getDisplay()).toBe('Error');
  });
});

// ────────────────────────────────────────────────────────
// 16. Power & Root Functions
// ────────────────────────────────────────────────────────
describe('16. Power & Root Functions', () => {
  test('16.1 x^2: 7^2 = 49', () => {
    pressNum('7');
    pressAction('square');
    expect(getDisplay()).toBe('49');
  });

  test('16.2 x^3: 3^3 = 27', () => {
    pressNum('3');
    pressAction('cube');
    expect(getDisplay()).toBe('27');
  });

  test('16.3 sqrt(16) = 4', () => {
    typeNumber('16');
    pressAction('sqrt');
    expect(getDisplay()).toBe('4');
  });

  test('16.4 cbrt(27) = 3', () => {
    typeNumber('27');
    pressAction('cbrt');
    expect(getDisplay()).toBe('3');
  });

  test('16.5 x^y binary: 2^10 = 1024', () => {
    pressNum('2');
    pressAction('pow');
    typeNumber('10');
    pressAction('equal');
    expect(getDisplay()).toBe('1024');
  });

  test('16.6 y-root-x binary: 27 yroot 3 = 3', () => {
    typeNumber('27');
    pressAction('yroot');
    pressNum('3');
    pressAction('equal');
    expect(getDisplay()).toBe('3');
  });

  test('16.7 sqrt(-5) = Error', () => {
    pressNum('5');
    pressAction('sign');
    pressAction('sqrt');
    expect(getDisplay()).toBe('Error');
  });

  test('16.8 Expression shows "square(7)" after x^2(7)', () => {
    pressNum('7');
    pressAction('square');
    expect(getExpression()).toBe('square(7)');
  });
});

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
    // Display starts at '0', press reciprocal
    pressAction('reciprocal');
    expect(getDisplay()).toBe('Error');
  });

  test('17.3 5! = 120', () => {
    pressNum('5');
    pressAction('factorial');
    expect(getDisplay()).toBe('120');
  });

  test('17.4 0! = 1', () => {
    // Display starts at '0'
    pressAction('factorial');
    expect(getDisplay()).toBe('1');
  });

  test('17.5 pi inserts approx 3.14159', () => {
    pressAction('pi');
    expect(parseFloat(getDisplay())).toBeCloseTo(Math.PI, 5);
  });

  test('17.6 e inserts approx 2.71828', () => {
    pressAction('euler');
    expect(parseFloat(getDisplay())).toBeCloseTo(Math.E, 5);
  });

  test('17.7 Rand inserts number between 0 and 1', () => {
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

  test('17.9 Constant after operator: 2 * pi approx 6.283', () => {
    pressNum('2');
    pressOp('×');
    pressAction('pi');
    pressAction('equal');
    expect(parseFloat(getDisplay())).toBeCloseTo(2 * Math.PI, 3);
  });
});

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

  test('18.2 m+ accumulates: 10 + 20 = 30', () => {
    typeNumber('10');
    pressAction('mplus');
    pressAction('clear');
    typeNumber('20');
    pressAction('mplus');
    pressAction('clear');
    pressAction('mr');
    expect(getDisplay()).toBe('30');
  });

  test('18.3 m- subtracts: 50 - 20 = 30', () => {
    typeNumber('50');
    pressAction('mplus');
    pressAction('clear');
    typeNumber('20');
    pressAction('mminus');
    pressAction('clear');
    pressAction('mr');
    expect(getDisplay()).toBe('30');
  });

  test('18.4 mc clears memory: 99 m+, mc, mr = 0', () => {
    typeNumber('99');
    pressAction('mplus');
    pressAction('mc');
    pressAction('clear');
    pressAction('mr');
    expect(getDisplay()).toBe('0');
  });
});

// ────────────────────────────────────────────────────────
// 19. 2nd Mode & Inverse Functions
// ────────────────────────────────────────────────────────
describe('19. 2nd Mode & Inverse Functions', () => {
  test('19.1 2nd toggle: button gets active-second class', () => {
    const btn = document.querySelector('[data-action="second"]');
    expect(btn.classList.contains('active-second')).toBe(false);
    pressAction('second');
    expect(btn.classList.contains('active-second')).toBe(true);
  });

  test('19.2 sin^-1(0.5) = 30 in Deg mode', () => {
    pressNum('0');
    pressNum('.');
    pressNum('5');
    pressAction('second');
    pressAction('sin');
    expect(parseFloat(getDisplay())).toBeCloseTo(30, 5);
  });

  test('19.3 cos^-1(0.5) = 60 in Deg mode', () => {
    pressNum('0');
    pressNum('.');
    pressNum('5');
    pressAction('second');
    pressAction('cos');
    expect(parseFloat(getDisplay())).toBeCloseTo(60, 5);
  });

  test('19.4 tan^-1(1) = 45 in Deg mode', () => {
    pressNum('1');
    pressAction('second');
    pressAction('tan');
    expect(parseFloat(getDisplay())).toBeCloseTo(45, 5);
  });

  test('19.5 2nd auto-deactivates after use', () => {
    pressNum('1');
    pressAction('second');
    const btn = document.querySelector('[data-action="second"]');
    expect(btn.classList.contains('active-second')).toBe(true);
    pressAction('sin');
    // 2nd mode should be off now
    expect(btn.classList.contains('active-second')).toBe(false);
  });

  test('19.6 sinh(1) works', () => {
    pressNum('1');
    pressAction('sinh');
    expect(parseFloat(getDisplay())).toBeCloseTo(Math.sinh(1), 5);
  });

  test('19.7 2nd + sinh = sinh^-1: roundtrip gives back 1', () => {
    pressNum('1');
    pressAction('sinh');
    // Now display has sinh(1). Apply inverse.
    pressAction('second');
    pressAction('sinh');
    expect(parseFloat(getDisplay())).toBeCloseTo(1, 5);
  });
});

// ────────────────────────────────────────────────────────
// 20. Parentheses
// ────────────────────────────────────────────────────────
describe('20. Parentheses', () => {
  test('20.1 (2+3) * 4 = 20', () => {
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

  test('20.2 Simple (5) = 5', () => {
    pressAction('paren-open');
    pressNum('5');
    pressAction('paren-close');
    expect(getDisplay()).toBe('5');
  });

  test('20.3 Nested ((2+3)) * 2 = 10', () => {
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

  test('20.4 3 * (4+5) = 27', () => {
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

// ────────────────────────────────────────────────────────
// 21. Scientific Integration Tests
// ────────────────────────────────────────────────────────
describe('21. Scientific Integration Tests', () => {
  test('21.1 sin(30) + cos(60) = 1', () => {
    typeNumber('30');
    pressAction('sin');
    pressOp('+');
    typeNumber('60');
    pressAction('cos');
    pressAction('equal');
    expect(parseFloat(getDisplay())).toBeCloseTo(1, 10);
  });

  test('21.2 sqrt(x^2) identity: sqrt(49) gives 7', () => {
    pressNum('7');
    pressAction('square');  // 49
    pressAction('sqrt');    // 7
    expect(getDisplay()).toBe('7');
  });

  test('21.3 ln(exp) identity: exp(1) then ln gives 1', () => {
    pressNum('1');
    pressAction('exp');     // e^1 ~ 2.71828
    pressAction('ln');      // ln(e) = 1
    expect(parseFloat(getDisplay())).toBeCloseTo(1, 10);
  });

  test('21.4 Memory with scientific: sin(30) then m+, clear, mr = 0.5', () => {
    typeNumber('30');
    pressAction('sin');
    pressAction('mplus');
    pressAction('clear');
    pressAction('mr');
    expect(parseFloat(getDisplay())).toBeCloseTo(0.5, 10);
  });

  test('21.5 Clear resets paren stack: paren-open, 5, clear, then 3+2 = 5', () => {
    pressAction('paren-open');
    pressNum('5');
    pressAction('clear');
    expect(getDisplay()).toBe('0');

    pressNum('3');
    pressOp('+');
    pressNum('2');
    pressAction('equal');
    expect(getDisplay()).toBe('5');
  });
});

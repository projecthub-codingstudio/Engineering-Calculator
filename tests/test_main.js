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

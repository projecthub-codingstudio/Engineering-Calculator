# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A browser-based **scientific calculator** (공학용 계산기) delivered as a single self-contained HTML file (`index.html`). All HTML, CSS, and JavaScript live in one file — no build tools, no server, no external dependencies.

## Commands

```bash
# Run all tests (96 test cases)
npm test

# Run a single test by name pattern
npx jest --verbose -t "14.1 sin"

# Run a test section
npx jest --verbose -t "14\."

# Install dependencies (first time setup)
npm install
```

No build step, no linting configured. To preview the app, open `index.html` directly in a browser.

## Architecture

### Single-File Scientific Calculator (`index.html`)

The entire app is inside one file with three inline sections:

- **`<style>`** — Dark-theme CSS using CSS Grid for the 10-column button layout, CSS custom properties for theming, responsive breakpoint at 768px with collapsible scientific panel
- **`<script>`** — IIFE containing all calculator logic, wrapped in `'use strict'`
- **HTML** — 50 semantic `<button>` elements in a 10×5 grid with `data-num`, `data-op`, and `data-action` attributes for event delegation

### Grid Layout (10 columns × 5 rows)

```
(  )  mc  m+  m−  mr  |  C   ±   %   ÷
2nd x²  x³  xʸ  eˣ  10ˣ |  7   8   9   ×
1/x √x  ∛x  ʸ√x ln  log₁₀|  4   5   6   −
x!  sin cos tan  e   EE  |  1   2   3   +
Rad sinh cosh tanh π  Rand|     0     .   =
```

Left 6 columns = scientific functions. Right 4 columns = basic calculator.

### Calculator State Machine

The JS uses an **immediate execution model** (like iOS/macOS calculator), not an expression tree.

| Variable | Purpose |
|---|---|
| `currentValue` | String of the number currently being entered/displayed |
| `previousValue` | The left operand stored when an operator is pressed |
| `operator` | The pending operator (`+`, `−`, `×`, `÷`, `xʸ`, `ʸ√x`, `EE`) |
| `shouldResetDisplay` | Flag: next digit input should clear the display |
| `lastExpression` | String shown in the expression line above the main display |
| `justEvaluated` | Flag: equals was just pressed, next number starts fresh |
| `angleMode` | `'deg'` or `'rad'` — affects trig functions |
| `isSecondMode` | Boolean — 2nd button toggle for inverse functions |
| `memory` | Number — stored value for mc/m+/m-/mr |
| `parenStack` | Array — saved states for parenthesis sub-expressions |

### Function Categories

**Unary functions** (apply immediately to current display value):
- Trig: `sin`, `cos`, `tan` (and inverses via 2nd mode)
- Hyperbolic: `sinh`, `cosh`, `tanh` (and inverses via 2nd mode)
- Log/Exp: `ln`, `log10`, `exp` (eˣ), `exp10` (10ˣ)
- Power/Root: `square`, `cube`, `sqrt`, `cbrt`
- Other: `reciprocal` (1/x), `factorial` (x!)

**Binary operators** (reuse the existing operator pipeline via `inputBinaryOp`):
- `pow` → operator `xʸ`, `yroot` → operator `ʸ√x`, `ee` → operator `EE`

**Constants** (replace current value): `pi`, `euler`, `rand`

### 2nd Mode

`inputSecondToggle()` flips `isSecondMode` and swaps button labels:
- sin↔sin⁻¹, cos↔cos⁻¹, tan↔tan⁻¹
- sinh↔sinh⁻¹, cosh↔cosh⁻¹, tanh↔tanh⁻¹

2nd mode **auto-deactivates** after a unary function is applied.

### Parentheses

Stack-based: `inputParenOpen()` pushes `{previousValue, operator, lastExpression}` onto `parenStack` and resets the inner scope. `inputParenClose()` evaluates any pending inner operation, pops the saved state, and restores the outer context. Supports nesting.

### Responsive Design

- **Desktop (>768px):** Full 10-column scientific layout, `max-width: 780px`
- **Mobile (≤768px):** 4-column basic calculator. A "Scientific" toggle button (`.sci-toggle`) shows/hides the full 10-column layout

## Testing

96 tests using **Jest + jsdom** (`jest-environment-jsdom`). The test file `tests/test_main.js` loads the full `index.html` into jsdom, extracts the embedded script, and executes it. Tests interact through DOM clicks and keyboard events, asserting on `#display` and `#expression` text content.

Key test helpers: `pressNum(digit)`, `pressOp(op)`, `pressAction(action)`, `pressKey(key)`, `typeNumber(str)`. Assertions use `getDisplay()` (reads `#display`) and `getExpression()` (reads `#expression`).

Test sections: 1-Initial State, 2-Number Input, 3-Basic Arithmetic, 4-Operator Chaining, 5-Percentage, 6-Division by Zero, 7-Clear, 8-Toggle Sign, 9-Backspace, 10-Floating-Point, 11-Keyboard, 12-Expression Display, 13-Edge Cases, 14-Trig, 15-Log/Exp, 16-Power/Root, 17-Utilities/Constants, 18-Memory, 19-2nd Mode/Inverse, 20-Parentheses, 21-Integration.

### Number Formatting

`formatNumber()` rounds to 12 significant digits (`toPrecision(12)`) and caps the display at 9 integer digits, switching to exponential notation beyond that. This matters for test assertions — results like `0.5000000000001` become `0.5`.

## Key Conventions

- Basic operator symbols use Unicode: `÷` `×` `−` (not ASCII), matching `data-op` attributes
- Scientific binary operators use descriptive strings: `xʸ`, `ʸ√x`, `EE` in the `calculate()` switch
- Scientific buttons use `data-action="<name>"` (e.g., `data-action="sin"`, `data-action="pow"`)
- Event delegation: all button clicks go through a single listener on `.keys`
- Angle mode button label convention: shows the mode you'd switch TO (button says "Rad" when in Deg mode)
- The `getSecondFn()` map determines which function name to use when 2nd mode is active

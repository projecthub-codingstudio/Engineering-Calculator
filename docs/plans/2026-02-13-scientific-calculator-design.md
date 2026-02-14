# Scientific Calculator Expansion Design

## Summary

Expand the existing basic 4-operation calculator into a standard scientific calculator (iPhone landscape-style). Single-file architecture maintained.

## Scope

### Added Functions

| Category | Buttons | Behavior |
|---|---|---|
| Trig | sin, cos, tan | Unary: apply to current value immediately |
| Inverse trig | sin⁻¹, cos⁻¹, tan⁻¹ | Via 2nd mode toggle |
| Hyperbolic | sinh, cosh, tanh | Unary, immediate |
| Inverse hyperbolic | sinh⁻¹, cosh⁻¹, tanh⁻¹ | Via 2nd mode toggle |
| Log | ln, log₁₀ | Unary, immediate |
| Power | x², x³, xʸ | x²/x³ unary; xʸ binary (acts like operator) |
| Root | √x, ∛x, ʸ√x | √x/∛x unary; ʸ√x binary |
| Exponential | eˣ, 10ˣ | Unary, immediate |
| Other | 1/x, x!, \|x\| | Unary, immediate |
| Constants | π, e | Insert value |
| Mode | Rad/Deg | Toggle angle unit |
| Toggle | 2nd | Switch button meanings |
| Parentheses | ( ) | Expression grouping |
| Memory | mc, m+, m-, mr | Memory operations |
| Notation | EE | Scientific notation input (×10ⁿ) |
| Random | Rand | Insert random number [0,1) |

### Grid Layout (10 columns × 5 rows)

```
( )  mc  m+  m-  mr  |  C   ±   %   ÷
2nd x²  x³  xʸ  eˣ  10ˣ |  7   8   9   ×
1/x √x  ∛x  ʸ√x ln  log₁₀|  4   5   6   −
x!  sin cos tan  e   EE |  1   2   3   +
Rad sinh cosh tanh π  Rand|     0     .   =
```

Right 4 columns = existing basic calculator. Left 6 columns = scientific functions.

### Interaction Model

- **Unary functions** (sin, √, ln, etc.): Apply immediately to current display value
- **Binary functions** (xʸ, ʸ√x): Act as operators — store left operand, wait for right operand + equals
- **Constants** (π, e): Replace current value (or start new input if after operator)
- **2nd mode**: Toggles button labels/functions (sin↔sin⁻¹, etc.)
- **Angle mode**: Deg (default) / Rad toggle, shown on button

### State Additions

- `angleMode`: 'deg' | 'rad' (default: 'deg')
- `isSecondMode`: boolean (2nd button toggle)
- `memory`: number (for mc/m+/m-/mr)

### Responsive Strategy

- Desktop (>768px): Full 10-column scientific layout
- Mobile (<768px): Keep existing 4-column basic layout, add toggle/swipe to reveal scientific panel

### Expression Display

Unary functions show in expression line: `sin(90)` = `1`, `√(16)` = `4`

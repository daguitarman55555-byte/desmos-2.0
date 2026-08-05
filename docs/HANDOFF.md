# Desmos 2.0 — handoff

State as of commit `3135b1d`. Everything committed, working tree clean.
**138 tests pass, both typechecks clean.**

---

## Start here

```bash
npm install && npm test && npm run typecheck
```

Dev server: `preview_start` with the `desmos2` config in `.claude/launch.json`. It reads `PORT`
from the environment and falls back to **5180** — 5173 is deliberately avoided because another
project uses it. Do not hardcode a port back into `vite.config.ts`.

Read `docs/ARCHITECTURE.md` and `CLAUDE.md` first. The dependency rule and the twelve locked
decisions still hold.

---

## The one rule that has changed

`CLAUDE.md` says `reference/desmos-demo.html` is the frozen pixel baseline. **It is no longer.**
The prototype was calibrated against older Desmos captures and has drifted. On the user's explicit
instruction, **live desmos.com now wins** wherever they disagree. `reference/` is still frozen as a
historical artefact — never edit it — but it is not the target.

### Measure in an extension-free browser. This is not optional.

The user runs **DesModder**, which injects a stylesheet, adds a `dsm-syntax-hi` class to `<body>`,
and contributes extra right-hand toolbar buttons. **Any measurement taken with it installed is
void.** It already sent the panel width wrong (467.2 vs the true 448) and nearly caused four
DesModder toolbar buttons to be built as if they were Desmos's.

- The **in-app Browser pane** (`mcp__Claude_Browser__*`) runs without extensions — verify with
  `!window.DesModder`. Use it for DOM and computed-style measurements.
- Its canvas is **0×0** because the pane never composites, so it cannot be screenshotted and
  cannot be pixel-sampled. For canvas sampling use the Chrome tab; DesModder does not alter how
  curves are stroked, so stroke geometry is safe to measure there.

### Two automation techniques that took a while to find

- **MathQuill will not accept synthetic key events or textarea `input` events.** Drive it with
  `MathQuill.getInterface(2)(el).typedText('sin(x)')`. This is essential for the keypad work.
- **Desmos's own state is readable via `window.Calc`** — `getExpressions()` returns the full style
  schema, `setExpression()` seeds test cases, and `Desmos.Colors` / `Desmos.Styles` give the
  enums. Far more reliable than scraping the DOM.

---

## What is built

| Layer | State |
|---|---|
| `core/` | Complete for milestone 1: lang, eval, numerics/roots, poi. Zero DOM, enforced by `tsconfig.core.json` |
| `graph/` | Complete: transform, viewport, grid, axes, plotters, pick, trace, renderer |
| `state/` | Complete: document, store, history, selection, persist (serialise only) |
| `ui/` | Shell, header, toolbar, expression list/row, slider, math field, graph pane, point labels, **settings panel**, **style tray** |
| Tests | 138, in `tests/` mirroring `src/core/` plus `tests/graph` and `tests/state` |

### Measured facts now encoded in the code

Do not re-derive these; they were each measured, several contradict the obvious guess.

- **Colour cycle is five colours**, not six: red `#c74440`, blue `#2d70b3`, green `#388c46`,
  purple `#6042a6`, black `#000000`. Confirmed across fourteen consecutive expressions.
  **Orange `#fa7e19` is real and in the picker but is never auto-assigned.**
- **The picker's GREEN is `#348543`; the cycle's green is `#388c46`.** Genuinely two different
  values in Desmos. Do not unify them.
- **Dash patterns scale with stroke width**: dashed `[5.5w, 2w]`, dotted `[2w, 1.25w]`. Measured
  by scanning a pixel row across `y=1` at widths 2 and 4.
- **Eight point styles** (`Desmos.Styles`): POINT, OPEN, CROSS, PLUS, SQUARE, DIAMOND, STAR,
  TRIANGLE.
- **The expression disc is 29px**, no border, white glyph. The glyph name
  `dcg-icon-parametric-solid` is the tell that **the icon tracks line style**.
- **Settings panel**: 290px wide, 10px inset, 1px `#bbb` border, 6px radius,
  `0 5px 10px rgba(0,0,0,.2)` shadow, arial 16px base / 15.2px axis rows / 13.6px small.
  Sections fenced by a 1px `#e2e2e2` rule.
- **The segmented control is dark grey `rgba(0,0,0,.65)`, not the accent blue.**
- **Checkboxes are outlined with a drawn black tick**, never a filled swatch. 17.6px / 15px small.
- **The grid block's columns are Grid+Arrows (left, full size) and Axis Numbers+Minor Gridlines
  (right, 13.6px small).** Pairing them any other way makes "Minor Gridlines" wrap.
- **Graph tool buttons are 37×37 at a 5px inset.**
- **Panel is 448px**; default range is exactly x ∈ [−10, 10].

All pixel values live in `src/styles/tokens.css`. Components must never hardcode one.

---

## Next up, in the order I would take them

### 1. Re-measure the style tray's geometry
`src/ui/StyleMenu.ts` is built and works, but its **spacing is the one thing in the project that
was not measured** — Desmos only opens its tray on a real long press, which the automation could
not drive. Open it by hand, measure, and retune the `--sty-*` tokens.

### 2. The keypad
`src/ui/Keypad.ts` is still a stub; the button exists and does nothing. Desmos's keypad buttons are
already in its DOM at load (`.dcg-keypad-btn`, 71×36) even while hidden, so the layout can be read
straight off without opening it. Route presses through `MathField`'s `typedText`/`cmd`.

### 3. Missing wrench controls
Visible in the user's screenshot, not yet built: **One Quadrant**, **Zoom Square**, the
display-size segmented control, and the grid-style icon pair that sits inside the Grid block
between the Grid and Arrows checkboxes (`.dcg-circle-icon-group.dcg-grid-group`, 86×32).

### 4. Trailing blank row
Desmos shows rows 1 *and* 2 on a blank document; we show one. `store.ensureTrailingBlank()` only
appends when the last row is non-blank. Small fix, visible difference.

### 5. Deliberately deferred, each needing an engine feature first
Display size, reverse contrast, braille mode (theming/accessibility); **Complex Mode** (needs
`core/numeric/complex.ts` wired through the evaluator); More Options. Leaving a gap is better than
shipping a control that lies.

---

## Landmines

- **`core/` must contain zero DOM references.** `npm run typecheck` runs `tsconfig.core.json`,
  which compiles `core/` with the DOM libs stripped, so a violation is a build error. Do not "fix"
  it by adding `"DOM"` to that config.
- **Late binding is load-bearing.** Compiled closures resolve function names and `angleMode` from
  the scope *at call time*, not compile time. That is what makes forward references work and what
  lets switching to degrees redraw without recompiling. Binding eagerly silently breaks both.
- **`core/eval/deps.ts` is implemented and tested but deliberately not wired in.** Incremental
  recompute is a behaviour change; the store still re-analyses everything in order.
- **Two POI coincidences are correct, not bugs.** The minimum of `y=x²−4` and the inflection of
  `y=x³−3x` each sit exactly on an intercept; intercepts scan first and de-duplication is
  first-wins, so they surface typed as `intercept`. Tests pin this.
- **`ppuX` and `ppuY` are separate** because the axis min/max fields can make the axes non-square.
  Pan and zoom move both together.
- **`reference/` is `-text` in `.gitattributes`** so line-ending normalisation cannot alter the
  frozen baseline.

# Desmos 2.0 — handoff

Everything committed, working tree clean. **138 tests pass, both typechecks clean.**

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

### How to get numbers out of Desmos — in the order you should try them

**1. Read its stylesheet. This is the best method and it took far too long to find.** Desmos
serves its CSS same-origin, so `document.styleSheets` is fully readable and every value is
*exact* rather than measured off a rendered box:

```js
const rules = [];
for (const ss of document.styleSheets) for (const r of ss.cssRules) rules.push(r.cssText);
rules.filter(t => /dcg-color-picker|dcg-keypad-btn/.test(t));
```

The entire style tray and the entire keypad were specified this way without ever opening either
of them. Strip the `.dcg-calculator-api-container-v1_13 ` prefix from selectors when reading.

**2. Read its JS bundle** when you need *structure* rather than numbers — which element nests in
which, how many rows a control has. `fetch()` the `shared_calculator_desktop-*.js` script and
search it; the templates are readable (`b("div",{class:"dcg-options-menu-section",children:...`).
That is how the point-style grid was confirmed to be 4×2 and the line/point sections confirmed to
carry title toggles.

**3. `window.Calc`** for state — `getExpressions()` returns the full style schema,
`setExpression()` seeds test cases, `Desmos.Colors` / `Desmos.Styles` give the enums.

**4. Live DOM measurement** last, because it needs the workarounds below.

### The Browser pane never composites — and that breaks more than screenshots

`document.hidden` is `true` in the in-app pane, so **`requestAnimationFrame` never fires**. This
is the single root cause behind the pane's reputation for being unusable on Desmos: the canvas
stays 0×0, `ResizeObserver` never delivers, and Desmos's expression rows stay as `dcg-shell`
placeholders forever. Two lines fix it:

```js
window.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16);
window.dispatchEvent(new Event('resize'));   // Desmos lays out only on a resize in this pane
```

With those, rows render as `dcg-mathitem` and everything measures correctly. The same shim is
needed on **our own app** in the pane, or the graph canvas reports 0×0.

Still impossible in the pane: screenshots. For those, open `http://localhost:<port>` in the
Chrome tab — DesModder only touches desmos.com, so screenshotting *our* app there is safe.

### Automation limits worth knowing

- **MathQuill will not accept synthetic key events or textarea `input` events.** Drive it with
  `MathQuill.getInterface(2)(el).typedText('sin(x)')`.
- **Desmos's tap layer ignores synthetic pointer events entirely.** Dispatching
  pointerdown/mousedown on `.dcg-expression-icon-container`, held or not, does nothing at all.
  This is why the style tray could never be opened under automation — and why method 1 above
  exists. Do not waste time retrying it.

---

## What is built

| Layer | State |
|---|---|
| `core/` | Complete for milestone 1: lang, eval, numerics/roots, poi. Zero DOM, enforced by `tsconfig.core.json` |
| `graph/` | Complete: transform, viewport, grid, axes, plotters, pick, trace, renderer |
| `state/` | Complete: document, store, history, selection, persist (serialise only) |
| `ui/` | Shell, header, toolbar, expression list/row, slider, math field, graph pane, point labels, settings panel, **style tray (geometry now measured)**, **keypad** |
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
- Default range is exactly x ∈ [−10, 10].
- **Style tray**: 220px min-width, 10px vertical padding, sections fenced by the same 1px `#e2e2e2`
  rule as the settings panel. Colours are a **six-column grid of 30px rounded squares** (4px gap,
  3px radius) — *not* discs and not one flat row — and the selected one is marked by a **white
  tick over the tile**, not a ring. Line styles are 33×30 segmented buttons, point styles a 4×2
  grid of 28×28. Both are the **"mini" theme**: `#bbb` borders and an accent-tinted selection,
  *not* the settings panel's dark grey. The previews are `#949494`, never the expression's colour.
- **Keypad**: an 835px-max well, 4 rows of 40px, `4px 3px` padding, `#f0f0f0` on a
  `rgba(0,0,0,.1)` top border. **Each row is eleven units**: an ordinary key takes one, the gaps
  between key groups take a half, `functions` and `enter` take two, `backspace` takes one and a
  half, and row 3's second gap takes a whole one. Every row sums to eleven, which is what keeps
  the columns aligned. Counterintuitively **the digits are the darker keys and the operators are
  white** — check a screenshot before "fixing" that.

### The panel width is a formula, not a constant — and this was settled the hard way

Two sessions measured the expression panel and got 448px and 416px. **Both were right.** The
width is not a constant at all; it is read out of Desmos's own `getExpListWidth()`:

```
panelWidth = clamp(0.2 * containerWidth + 160, 320, 500)
```

448 is that formula's value at a 1440px window, 416 its value at 1280. Confirmed by calling
Desmos's own function across thirteen viewport sizes, and now implemented in
`expressionPanelWidth()` in `src/ui/shell.ts` with `tests/ui/panel-width.test.ts` pinning the
values Desmos actually returns. Three details that come with it:

- **Below a 450px container Desmos stops putting the panel beside the graph** and stacks it
  underneath (`isNarrow()`). Not implemented; the breakpoint is recorded as
  `PANEL_NARROW_WIDTH` so it is not rediscovered.
- **Dragging the divider is remembered, not recomputed.** Desmos keeps the dragged width and
  only re-clamps it to `[320, containerWidth − 200]` as the window changes — so the graph always
  keeps 200px, and a dragged panel may exceed the formula's 500px cap.
- **The panel snaps up to 10px to make the graph exactly square.** At 1280×860 the formula says
  416 but Desmos returns 420, leaving an 860×860 graph. Real, and easy to mistake for a bug.

**The lesson, which is the reusable part: check whether a "constant" is computed before recording
it as measured.** No CSS rule sets this width — Desmos assigns it inline from JS, so reading the
stylesheet finds nothing and only the bundle has the answer. Anything set inline is suspect.

A caveat on measuring this in the in-app pane: `Calc.controller.layoutMeasurements` is
`{width: 0, height: 0}` there, because the pane never composites and the ResizeObserver feeding
it never delivers. Desmos then lays out as if the container were tiny — the container even
carries `dcg-narrow`. **Any panel measurement taken from that DOM is meaningless.** Set
`layoutMeasurements` yourself and call `getExpListWidth()` instead; that is what produced the
table above.

All pixel values live in `src/styles/tokens.css`. Components must never hardcode one — and the
panel width is not even in there, because it is computed per window.

---

## Slider animation — measured, not yet built

The "add slider:" prompt is built (`undefinedVariables` on `Analysis` → the prompt in
`ExpressionRow` → `onCreateSliders` in `main.ts`). **Animating a slider is not.** The play glyph
already renders on every variable-definition row and does nothing; `swapIcon` beside it is
Desmos's loop-mode control and is likewise inert. Everything needed was read out of Desmos's
bundle:

```
animationPeriod = 4000 ms          // a full min→max sweep
loopMode        = LOOP_FORWARD_REVERSE   // the default; bounces at both ends
playDirection   = +1
```

Its per-frame step, from `yB(o, e)` in the bundle:

```
dt      = min(now - lastTick, period / 10)     // a long frame gap is clamped, not applied
delta   = (max - min) * dt / period
target += delta * playDirection
target  = clamp(target, min - halfStep, max + halfStep)   // halfStep = step ? step/2 : 0
value   = quantise(target, step)
```

Direction, for `LOOP_FORWARD_REVERSE`: `if (target >= max) playDirection = -1; else if
(target <= min) playDirection = +1`. The other three modes are `LOOP_FORWARD` (wraps
`max + halfStep` → `min - halfStep`), `PLAY_ONCE`, and `PLAY_INDEFINITELY` (no upper bound;
steps by `dt / (period / 4)`). Their icons are `dcg-icon-arrow-two-way`, `-one-way`, `-once`.

Sliders default to `min: -10, max: 10, step: ""` — which `document.ts` already matches.

---

## Next up, in the order I would take them

### 1. The style tray's opacity and size fields
The **"Lines"** and **"Points"** sections are built, titles and sliding toggles included, backed
by real `lines` / `points` booleans on `Expression` that `drawables()` honours. What is still
missing is the left-hand half of each: Desmos puts **opacity** and **width/size** math fields
there. Those need `lineOpacity`, `lineWidth` and `pointSize` carried through the renderer —
`Expression` already has the last two, but nothing reads them.

Note the sections are mutually exclusive here on purpose: a curve has no points and a point has
no lines, so exactly one shows. That stops being true the moment a plotter draws both at once
(tables, point lists with connecting lines), and at that point both should show together.

### 2. The keypad's two remaining panels
`functions` and `ABC` render **disabled**, alongside `Audio` which Desmos disables too. Each
opens a further panel that does not exist yet: `functions` is a popover of trig/stats/list
commands, `ABC` swaps the whole well for a letters keypad. Both are additive — the key table in
`Keypad.ts` is plain data and a new panel is a new module, not a rewrite.

### 3. Missing wrench controls
Still to build: the display-size segmented control, and the grid-style icon pair inside the Grid
block between the Grid and Arrows checkboxes (`.dcg-circle-icon-group.dcg-grid-group`, 86×32).

**One Quadrant** and **Zoom Square** are now built. Both came out of Desmos's
`dcg-top-checkboxes-container`, which is the right-hand column of the Grid block, in the order
Axis Numbers → Minor Gridlines → One Quadrant → Zoom Square. Two details that are Desmos's and
not guesses:

- Zoom Square appears **only while the axes are non-square** — it is hidden the rest of the time
  rather than shown doing nothing.
- It squares whichever axis the user did **not** last edit, so the bound they just typed
  survives. That is why `Viewport` now tracks `lastChangedAxis`.

### 4. Deliberately deferred, each needing an engine feature first
Display size (theming); **Complex Mode** (needs `core/numeric/complex.ts` wired through the
evaluator); More Options. Leaving a gap is better than shipping a control that lies.

**Reverse contrast and braille mode are out of scope** — the user's decision, not a deferral.
Do not build them and do not re-add them to this list.

---

## Landmines

- **`a\sin(x)` is silently read as `arcsin(x)`.** `latexToSource` flattens `\sin` to `sin`, so
  the coefficient and the function name run together into a string the tokenizer longest-matches
  as a builtin — and the `a` disappears from the expression entirely. Same for `a\cos` and
  `a\tan`. Pinned in `tests/lang/undefined-variables.test.ts` as a known bug so the loss is
  visible; fixing it means teaching `latexToSource` to keep function-name boundaries.
- **A blank document showing one row is correct.** An earlier note here claimed Desmos shows
  rows 1 *and* 2 on a blank document and that `ensureTrailingBlank()` needed fixing. It does not:
  live Desmos renders exactly one row when empty, and `expressions + 1` once anything is typed,
  because a blank last row *is* its new-expression row. Our behaviour already matches. Verified
  against live Desmos — do not "fix" this.
- **Anything added to `Expression` must be added to `ExpressionSnapshot` too.** Restoring rebuilds
  every expression with `store.create()`, so a field missing from the snapshot silently reverts to
  its default on the next undo. That is what used to happen to line and point styles: one undo
  reset the styling of every row in the document. `tests/state/history.test.ts` now compares the
  key sets to catch a repeat.
- **The panel width is deliberately not a token.** `--panel-width` is only the value used before
  the first layout pass; `expressionPanelWidth()` computes the real one and writes it inline on
  every resize. Do not "tidy" that back into a constant in `tokens.css` — see above for why the
  constant was wrong twice.
- **MathQuill's `keystroke('Enter')` silently does nothing.** It never reaches MathQuill's own
  `enter` handler — no throw, no effect, and it looks like it ought to work. The keypad's Enter
  key is therefore a *document* action (`KeyBinding.on === 'document'`), routed through
  `main.ts` to `store.insertAfter`, not a field keystroke. `Left`, `Right` and `Backspace` go
  through `keystroke` and are fine; only `Enter` is broken. Do not "simplify" that asymmetry away.
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

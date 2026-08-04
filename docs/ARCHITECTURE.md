# Desmos 2.0 — Architecture & File Structure

Companion to `UPGRADES.md`, `MATH-CATALOG.md` and `STEPS-AND-ADDITIONS.md`.

---

## Locked decisions

| # | Decision | Choice | Consequence |
|---|---|---|---|
| 1 | **Type system** | Distinct types (Scalar/Vector/Matrix/List/Tensor), unified rank-n storage underneath | A `core/types/` layer with an operator dispatch table |
| 2 | **Coordinate systems** | Curvilinear — built-ins + change of basis + user maps | Renderer never assumes a linear world→screen map; `Transform` is an interface |
| 3 | **3D** | Architecture allows it, ship 2D first | Geometry written against n-dimensional points |
| 4 | **Desmos compatibility** | Strict superset — never redefine, only add | New types get new notation (`⟨1,2,3⟩`); real Desmos saves become a test corpus |
| 5 | **Language** | TypeScript throughout | `.ts` everywhere; AST and type layer are tagged unions |
| 6 | **Persistence** | Local `.json` files via File System Access API | `state/persist.ts`; git- and OneDrive-friendly |
| 7 | **Testing** | Vitest over `core/`; UI verified by screenshot | `tests/` mirrors `src/core/` |
| 8 | **UI layer** | Vanilla DOM modules | One module per panel, no framework |
| 9 | **AI layer** | Local model (Ollama), **last priority**, optional | Isolated in `src/ai/`; app must run fully without it. **Step explanations are rule-traced, never AI** |
| 10 | **Workspace** | Split view — one document, several graph panes | Document holds `views[]`; state model stays single-document |
| 11 | **Numerics** | Exact where possible, decimal on request | `1/3` stays `1/3`, `π/2` stays `π/2`; numeric tower with promotion rules |
| 12 | **First milestone** | Verbatim port of the demo, zero behaviour change | Prove the architecture on known-good code before adding anything |

---

## Dependency rule

Strictly one-way. Nothing below ever imports from anything above it.

```
                 ui/          ← may import everything
              ↗       ↖
        state/         graph/  ← may import core/ only
              ↖       ↗
                core/          ← imports nothing from this project
```

`core/` must contain **zero DOM references**. That is what makes it testable in plain Node and what
lets the GLSL backend and any future headless use drop in without a rewrite.

---

## Tree

```
desmos2/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── CLAUDE.md                    ← standing instructions for Claude Code
│
├── docs/
│   ├── ARCHITECTURE.md          ← this file
│   ├── UPGRADES.md
│   ├── MATH-CATALOG.md
│   └── STEPS-AND-ADDITIONS.md
│
├── reference/
│   ├── desmos-demo.html         ← frozen visual baseline, never edited
│   └── screenshots/             ← the Desmos captures we diff against
│
├── public/
│   └── fonts/                   ← MathQuill Symbola set
│
├── src/
│   ├── main.ts                  ← entry point: wire store → ui → panes
│   │
│   ├── core/                    ══ pure maths · no DOM · fully tested ══
│   │   ├── numeric/
│   │   │   ├── real.ts          ← float ops, tolerances, safe division
│   │   │   ├── rational.ts      ← exact fractions
│   │   │   ├── bignum.ts        ← arbitrary precision
│   │   │   ├── complex.ts
│   │   │   ├── interval.ts      ← interval arithmetic (robust implicit plots)
│   │   │   ├── dual.ts          ← forward-mode autodiff
│   │   │   └── tower.ts         ← promotion rules between all of the above
│   │   │
│   │   ├── types/               ← decision 1
│   │   │   ├── kind.ts          ← the tagged union of value kinds
│   │   │   ├── ndarray.ts       ← unified rank-n storage backing every type
│   │   │   ├── vector.ts        ← dot, cross, norm, normalise, angle, project
│   │   │   ├── matrix.ts        ← multiply, det, inverse, rank, transpose
│   │   │   ├── list.ts          ← map/filter/reduce, statistics
│   │   │   ├── tensor.ts        ← contraction, Einstein summation (later)
│   │   │   ├── units.ts         ← dimensional analysis
│   │   │   ├── uncertainty.ts   ← ± propagation
│   │   │   └── dispatch.ts      ← operator × type-pair → implementation
│   │   │
│   │   ├── lang/
│   │   │   ├── latex.ts         ← LaTeX ↔ source, both directions
│   │   │   ├── tokenize.ts
│   │   │   ├── ast.ts           ← node definitions
│   │   │   ├── parse.ts
│   │   │   ├── desugar.ts       ← normalise reversed equations, implicit mult
│   │   │   ├── analyze.ts       ← classify expressions into plottable kinds
│   │   │   ├── scope.ts         ← name resolution, shadowing, cycle reporting
│   │   │   └── errors.ts        ← typed errors carrying source spans
│   │   │
│   │   ├── eval/
│   │   │   ├── backend.ts       ← the compile-target interface (decision: pluggable)
│   │   │   ├── js-backend.ts    ← AST → JS closures — the only backend for now
│   │   │   ├── glsl-backend.ts  ← stub; fills in when the GPU path arrives
│   │   │   ├── compile.ts       ← drives whichever backend is selected
│   │   │   └── deps.ts          ← dependency graph, topological recompute
│   │   │
│   │   ├── symbolic/            ← CAS
│   │   │   ├── steps.ts         ← Step record + tree builder (used by all below)
│   │   │   ├── simplify.ts
│   │   │   ├── derivative.ts    ← rule-based, emits Steps
│   │   │   ├── integral.ts
│   │   │   ├── solve.ts
│   │   │   ├── factor.ts
│   │   │   ├── limit.ts
│   │   │   └── series.ts
│   │   │
│   │   ├── numerics/
│   │   │   ├── roots.ts         ← bisection, Newton, Brent, nonlinear systems
│   │   │   ├── quadrature.ts    ← adaptive integration with error bounds
│   │   │   ├── ode.ts           ← RK45 adaptive, stiff solver, event detection
│   │   │   ├── linalg.ts        ← LU, QR, eigen, SVD, least squares
│   │   │   ├── optimize.ts
│   │   │   ├── interpolate.ts   ← splines
│   │   │   ├── transforms.ts    ← FFT, Laplace, convolution
│   │   │   ├── series-accel.ts  ← Shanks, Euler–Maclaurin for infinite sums
│   │   │   └── special.ts       ← gamma, erf, Bessel, zeta, Lambert W
│   │   │
│   │   └── poi.ts               ← points of interest
│   │
│   ├── graph/                   ══ rendering · knows core, not state ══
│   │   ├── transform/           ← decision 2
│   │   │   ├── Transform.ts     ← interface: forward, inverse, jacobian
│   │   │   ├── cartesian.ts
│   │   │   ├── polar.ts
│   │   │   ├── logscale.ts
│   │   │   ├── basis.ts         ← change of basis
│   │   │   └── curvilinear.ts   ← user-supplied (u,v) → (x,y)
│   │   ├── viewport.ts          ← pan, zoom, fit; owns a Transform
│   │   ├── grid.ts              ← 1-2-5 tick selection, quarter-mark minors
│   │   ├── axes.ts              ← axis lines, tick labels, arrows
│   │   ├── plotters/
│   │   │   ├── explicit.ts
│   │   │   ├── implicit.ts      ← marching squares + interval arithmetic
│   │   │   ├── parametric.ts
│   │   │   ├── points.ts
│   │   │   ├── vectors.ts       ← arrow rendering
│   │   │   ├── field.ts         ← quiver, streamplot, slope field
│   │   │   ├── contour.ts       ← level curves and filled contours
│   │   │   └── domaincolor.ts   ← complex domain colouring
│   │   ├── pick.ts              ← hit testing against cached screen paths
│   │   ├── trace.ts             ← cursor trace and pinned points
│   │   └── renderer.ts          ← orchestrates one pane
│   │
│   ├── state/
│   │   ├── document.ts          ← the saved graph: expressions, views, settings
│   │   ├── store.ts             ← mutations + change notification
│   │   ├── history.ts           ← undo/redo
│   │   ├── selection.ts
│   │   └── persist.ts           ← .json read/write, Desmos import
│   │
│   ├── ui/
│   │   ├── shell.ts             ← overall layout
│   │   ├── Header.ts
│   │   ├── Toolbar.ts
│   │   ├── ExpressionList.ts
│   │   ├── ExpressionRow.ts
│   │   ├── MathField.ts         ← MathQuill wrapper, incl. vec/hat commands
│   │   ├── Slider.ts
│   │   ├── StyleMenu.ts         ← long-press colour tray
│   │   ├── SettingsPanel.ts     ← the wrench
│   │   ├── AddItemMenu.ts       ← note / table / folder / image
│   │   ├── Keypad.ts
│   │   ├── StepsPanel.ts        ← rule-traced working
│   │   ├── GraphPane.ts         ← one pane
│   │   ├── SplitView.ts         ← decision 10
│   │   ├── PointLabel.ts
│   │   └── icons.ts
│   │
│   ├── styles/
│   │   ├── tokens.css           ← scale metrics + palette — the one place to tune
│   │   ├── chrome.css
│   │   ├── expressions.css
│   │   ├── graph.css
│   │   └── menus.css
│   │
│   └── ai/                      ← decision 9 — optional, last, local
│       ├── provider.ts          ← Ollama interface
│       └── prompts.ts
│
└── tests/                       ← mirrors src/core/
    ├── lang/
    ├── types/
    ├── numerics/
    ├── symbolic/
    ├── poi.test.ts
    └── conformance/
        ├── graphs/              ← real Desmos .json saves
        └── conformance.test.ts
```

---

## Why the seams fall where they do

**`core/numeric/tower.ts` exists** because decision 11 (exact-first) means every operation must know
how to promote `Rational × Interval` or `Complex + Dual`. Centralising promotion in one file stops
that logic leaking into forty operators.

**`core/types/dispatch.ts` exists** because decision 1 makes `×` mean cross product, matrix multiply
or elementwise multiply depending on operand types. One table, not scattered `if` chains.

**`core/eval/backend.ts` exists** so the GPU path is a new file rather than a rewrite. Nothing else
in `core/` knows how compilation happens.

**`graph/transform/` exists** because decision 2 means grid generation, hit testing, POI placement
and label positioning all have to ask the transform rather than doing their own arithmetic. Getting
this wrong is the single most expensive retrofit in the project.

**`symbolic/steps.ts` sits above the other symbolic files** because every rule in `derivative.ts`,
`solve.ts` and `factor.ts` emits Step records. Steps are not a feature bolted on later; they are the
return type from day one.

---

## Milestone 1 — verbatim port

Definition of done: **the app renders and behaves identically to `reference/desmos-demo.html`, with
screenshots that diff clean against the reference captures.** No new features.

Files that get real content in milestone 1:

```
core/lang/*            core/eval/{js-backend,compile,deps}.ts
core/numerics/roots.ts core/poi.ts
graph/{viewport,grid,axes,pick,trace,renderer}.ts
graph/transform/{Transform,cartesian}.ts
graph/plotters/{explicit,implicit,points}.ts
state/*                ui/* (existing panels only)
styles/*               tests/lang, tests/poi
```

Everything else is created as a stub with its interface defined and a `TODO` body. That way the
shape of the project is visible from the first commit, and later work is filling in rather than
restructuring.

**Ordering within milestone 1:** `core/` first and prove it with tests, then `graph/`, then `state/`,
then `ui/` last. The UI is the part most likely to drift, so it should be ported against an already
working engine.

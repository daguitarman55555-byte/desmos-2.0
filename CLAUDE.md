# Desmos 2.0 — Standing Instructions

Private project. An exact visual replica of the Desmos graphing calculator, upgraded where Desmos is
genuinely lacking. Not for sale, not for public release, single user.

Read `docs/ARCHITECTURE.md` before touching anything. It contains the twelve locked decisions and the
file tree. Do not deviate from it without asking.

---

## The dependency rule — never violate this

```
                 ui/          ← may import anything
              ↗       ↖
        state/         graph/  ← may import core/ only
              ↖       ↗
                core/          ← imports nothing from this project
```

**`src/core/` must contain zero DOM references.** No `document`, no `window`, no `HTMLElement`, no
`canvas`. If a core file needs one of those, the design is wrong — stop and ask. This rule is what
makes the maths testable in plain Node and what lets the GLSL backend drop in later without a rewrite.

---

## Conventions

- **TypeScript, `strict: true`.** No `any` without a comment explaining why.
- **The AST and value kinds are tagged unions.** Exhaustive `switch` with a `never` default.
- **All visual metrics live in `src/styles/tokens.css`.** Never hard-code a pixel value in a component
  file. If you need a new dimension, add a token.
- **All maths in `core/` gets a test.** Prefer known analytic answers over snapshots — `d/dx x³` at
  x=2 is 12, and the test should say so.
- **One module per UI panel.** Plain functions that build and update DOM. No framework.
- **Errors carry source spans.** Every error object records where in the expression it came from.

## Error philosophy

- **Numeric errors are silent.** `1/0`, `√(−1)` in real mode, domain violations → `NaN`, the curve
  gets a gap, nothing is reported to the user. This matches Desmos.
- **Structural errors are visible.** Unparseable input, undefined variables, expressions that cannot
  be plotted → the warning triangle in the expression row's index cell.
- Internally both kinds carry typed error objects; dev mode may log them to the console.

## Defaults

- Angle mode: **radians**, persisted per document. Degrees available, never default.
- Numeric display: **exact where possible** — `1/3` stays `1/3`, `π/2` stays `π/2` — with a toggle
  for decimals.
- Theme: light only. The palette still lives in `tokens.css` as variables so a theme is a drop-in later.

## The reference baseline

`reference/desmos-demo.html` and `reference/screenshots/` are **frozen**. Never edit them. They are
the ground truth the port is diffed against.

## Git

Initialise a repo. Commit at every completed milestone with a descriptive message. Do not commit
`node_modules/` or build output.

## Performance

Instrument, do not guess. Recompute, plot and draw times should be measurable from a dev overlay.
The budget will be set from real measurements on the target machine (Dell Latitude 5420, i7 vPro,
16 GB RAM with 2–4 GB usable, Intel Iris Xe). Provisional target is 16 ms for a slider drag.

## What not to do

- Do not add features that are not in the current milestone.
- Do not restructure files without asking.
- Do not introduce a UI framework.
- Do not change the meaning of any syntax Desmos already defines — decision 4 is *strict superset*,
  additions only.
- Do not use AI to generate step-by-step working. Steps are rule-traced and deterministic.

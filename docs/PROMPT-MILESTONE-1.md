# Claude Code kickoff prompt — Milestone 1

Paste everything below the line into Claude Code, run from the project folder.

---

I'm building **Desmos 2.0** — a private, exact visual replica of the Desmos graphing calculator that
I'll later extend with capabilities Desmos lacks (CAS, differential equations, real linear algebra,
custom coordinate systems). It is not for sale or public release.

There is a working single-file prototype in this folder: `index.html`, with its dependencies in
`vendor/`. It is ~1600 lines and already implements a great deal — I spent a long session getting it
pixel-accurate against real Desmos screenshots, and its maths engine is tested and correct.

**Read these four documents first. They are the specification and they contain twelve locked
architectural decisions. Do not deviate from them.**

- `ARCHITECTURE.md` — the decisions and the exact file tree to build
- `CLAUDE.md` — standing rules (dependency direction, conventions, error philosophy)
- `UPGRADES.md` — the roadmap beyond this milestone
- `MATH-CATALOG.md` and `STEPS-AND-ADDITIONS.md` — the longer-term capability list

## Milestone 1: verbatim port. No new features.

**Goal:** move the prototype into the modular TypeScript structure defined in `ARCHITECTURE.md` with
**zero behaviour change**, so I can screenshot the result and diff it against the prototype to prove
nothing shifted.

This milestone is deliberately unambitious. It exists to establish the architecture on code that is
already known to be correct, before anything risky is added.

### Steps

1. **Set up the project.**
   - Vite + TypeScript (`strict: true`) + Vitest.
   - `npm install mathquill jquery` as proper dependencies — do not keep the vendored copies.
   - Initialise a git repo. Add a sensible `.gitignore`.
   - Move the prototype to `reference/desmos-demo.html` and its `vendor/` folder to
     `reference/vendor/` so it still opens standalone. **These become frozen. Never edit them again.**

2. **Create the entire file tree from `ARCHITECTURE.md` now**, including files this milestone does not
   fill in. Stubs get their interface/type signatures defined and a `TODO` body. I want the shape of
   the project visible from the first commit so later work is filling in, not restructuring.

3. **Port in dependency order: `core/` → `graph/` → `state/` → `ui/`.** The UI is the part most likely
   to drift, so port it last, against an engine that already works.

4. **Write tests for `core/` as you port it.** The prototype's maths is correct and I have verified
   these results — use them as expected values:
   - `y = -2x+4` → intercepts `(2,0)` and `(0,4)`
   - `y = x²-4` → intercepts `(-2,0)`, `(2,0)`; minimum `(0,-4)`
   - `y = x³-3x` → intercepts `0, ±1.73205`; extrema exactly `(-1, 2)` and `(1, -2)`
   - `cos(y) = x` → intercepts `(0, ±π/2)`, `(0, ±3π/2)`; extrema `(-1, ±π)`
   - `y = -2x+4` against `y = x²+1` → intersections `(1,2)` and `(-3,10)`
   - Grid: majors on 1-2-5×10ᵏ targeting 104 css px; minors always major/4

   Three bugs I already found and fixed — make sure the tests cover them, because they are easy to
   reintroduce:
   - A root landing exactly on a sample point produces no sign change and was being dropped entirely.
   - A one-pixel finite-difference step biased the extrema of `x³-3x` to ±0.99993 instead of ±1.
   - A straight line's second difference is identically zero, which flooded the inflection scan with
     phantom points and pushed real intersections past the result cap.

5. **Add a small dev instrumentation overlay** reporting recompute, plot and draw times in ms. I want
   to set the performance budget from real measurements, not guesses.

6. **Commit** with a clear message.

### Definition of done

- `npm run dev` renders the app, visually identical to `reference/desmos-demo.html`.
- `npm test` passes, covering the maths listed above.
- The full file tree from `ARCHITECTURE.md` exists, stubs included.
- `src/core/` contains no DOM references whatsoever.
- All visual metrics live in `src/styles/tokens.css`; no hard-coded pixel values in components.

### Explicitly out of scope for this milestone

The settings panel, style menu, add-item menu, on-screen keypad, and every mathematical upgrade in
the roadmap. Do not start them. If you finish early, improve test coverage instead.

### Before you start

Read the four documents, then tell me your plan and flag anything in the prototype you think will
resist the port — particularly the MathQuill integration and the expression-row DOM reconciliation,
which are the two fiddliest parts. Ask about anything ambiguous rather than guessing.

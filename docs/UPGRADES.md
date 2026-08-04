# Desmos 2.0 — Upgrade Plan

Private project. Exact Desmos UI replica, upgraded where Desmos is genuinely lacking.
Not for sale, not for public release.

**Scope decision:** Desmos replica + Tier 1 structural gaps.
**Priority weighting:** calculus & analysis · differential equations & physics · linear algebra & data.
**Target machine:** Dell Latitude 5420, i7 vPro, 16 GB RAM (~2–4 GB usable), Intel Iris Xe.

---

## What Desmos already has (do not rebuild as "upgrades")

Corrected after research — several of these shipped in 2025–26 and invalidate older gap lists.

| Feature | Status |
|---|---|
| Complex arithmetic | **Has it.** Complex Mode: `i` on keypad, `real/imag/conj/arg/\| \|`, complex numbers plot as points |
| Statistics & inference | **Has it.** Inference menu, distributions with PDF/CDF toggle, `stats()` with boxplot, regressions |
| Version history | **Has it.** Shipped June 2026 |
| Notes / rich documents | **Has it.** Desmos Notebook, May 2026 |
| 3D graphing | **Has it.** Colour maps, actions on 3D objects, dedicated settings |
| Folders, snapshots, tables, images, actions/ticker | **Has it** |
| Points of interest, audio trace, accessibility | **Has it**, and it is best in class |

The remaining gaps below are real.

---

## P0 — Foundation

Nothing else works without these. Build first, in this order.

1. **Exact-replica UI**, ported from the demo into a modular codebase.
2. **Reactive dependency graph** — topological recompute, cycle detection, incremental updates on the dirty subtree only.
3. **AST compiler with a pluggable backend.** JS closures now; the interface must allow a GLSL or WASM backend later without touching the math layer. *This is the one decision that is expensive to retrofit.*
4. **Forward-mode automatic differentiation.** Exact derivatives, not finite differences. Required by CAS, ODE stiff solvers, Newton root-finding, and extrema detection — building it once serves all four.
5. **Interval arithmetic.** Artefact-free implicit plotting and guaranteed root bracketing. Desmos uses this internally and never exposes it.
6. **Real language semantics** — recursion, loops, local scope, user-defined data structures. Desmos has none of these; numerical algorithms are impossible without them.
7. **Streaming list evaluation.** Given the RAM ceiling, never materialise million-element arrays.

---

## P1 — Calculus & analysis

8. **CAS core, in-house.** Symbolic differentiation, simplification, polynomial factoring, linear and polynomial solving. A few thousand lines, entirely tractable.
9. **CAS extended, delegated.** Integration, limits, series expansion via **Giac compiled to WASM** (what GeoGebra uses — check the GPL implications for a private project) or **Pyodide + SymPy** (~10 MB, slow cold start, complete). Fast path in-house, slow path handed off.
10. **Symbolic ↔ numeric bridge.** Exact answer where one exists, numeric fallback otherwise, always visibly labelled which you got.
11. **Exact arithmetic tower.** Rationals and bignums beneath the float tower, so `1/3` stays `1/3`.

*This is the single biggest gap versus GeoGebra and the headline reason 2.0 exists.*

---

## P2 — Differential equations & physics

12. **ODE solvers.** Dormand–Prince RK45 adaptive for non-stiff, Rosenbrock or BDF for stiff. Autodiff from P0 supplies exact Jacobians.
13. **Slope fields, phase portraits, trajectories** as first-class objects. Desmos users fake slope fields with 400-element list hacks.
14. **Vector fields** with `grad`, `div`, `curl` as primitives.
15. **Units and dimensional analysis.** Catches the error class that actually bites in physics work.
16. **Event detection** — zero-crossings, collisions, terminal conditions during integration.

---

## P3 — Linear algebra & data

17. **Real matrix type** — LU, QR, eigenvalues/eigenvectors, SVD, determinant, inverse, rank, condition number. Desmos's matrix calculator is a separate, weaker product.
18. **Data import** — CSV, JSON, URL/API, with live refresh. Replaces pasting into a table.
19. **Regression suite** over imported data, beyond Desmos's `~` operator.
20. **Export that serves work:**
    - lists and tables → **CSV**
    - expressions → **LaTeX** (paste into a document)
    - figures → **SVG / PDF** vector, high-DPI
    *Video and GIF export deliberately excluded — that serves graph art, not this workflow.*

---

## P4 — Language & workflow

21. **Modules / imports.** Build a library of definitions once, reuse across graphs. Desmos cannot do this at all.
22. **Find-and-replace with rename refactoring.** Rename a variable across every expression. Small build, large daily payoff once graphs get big.
23. **Natural-language / AI input.** "Plot the tangent to f at x=2", "solve this for x", "fit an exponential to this column". Nothing like it exists in any graphing calculator. *Needs an API key and network access — the only feature here with an external dependency.*
24. **Complex analysis** — domain colouring, conformal maps, residues. Lower priority given the chosen use cases, but the GLSL backend makes it nearly free once that exists.

---

## Deferred — architecture must allow, do not build now

| Item | Why deferred |
|---|---|
| **GLSL / GPU compile path** | Iris Xe is genuinely capable and RAM-friendly, but ODEs are sequential, linear algebra at these sizes belongs on CPU, and CAS is pure symbolic work. Pays off mainly for implicits, inequality shading and domain colouring. Backend interface exists from day one so this slots in cleanly. |
| **Real-time collaboration** | Single-user project. |
| **Plugin / extension API** | No third parties. |
| **Animation timeline / keyframing** | Serves creative work, not the chosen use cases. |
| **Video / GIF export** | Same. |
| **Discrete maths, number theory, graph theory** | Not among the chosen use cases. |
| **3D** | Desmos already has it and it is improving; revisit only if a specific need appears. |

---

## Ordering rationale

P0 is unavoidable groundwork. P1 is where the project justifies itself — CAS is the gap everyone
feels. P2 and P3 map directly onto the stated use cases and each depends on P0's autodiff and
matrix work rather than on P1, so they can proceed in parallel with the CAS effort if it stalls.
P4 is quality-of-life that only matters once there is enough substance to need organising.

The riskiest item is **P1 CAS integration** — pick the engine early and validate the WASM build on
the target machine before committing, because a 10 MB Pyodide cold start on 2–4 GB of free RAM is a
real constraint, not a theoretical one.

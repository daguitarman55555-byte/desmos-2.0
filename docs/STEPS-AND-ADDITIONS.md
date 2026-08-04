# Desmos 2.0 — Step-by-Step Solver + Additional Capabilities

Addendum to `MATH-CATALOG.md`. Two questions answered: can we show working, and what else is missing.

---

# Part 1 — Step-by-Step Solutions

**Yes, and it's one of the cheapest high-value features on the whole list** — because we are already
writing a symbolic differentiator. Making it *explain itself* is a change of return type, not a new engine.

## The core idea: rule tracing

A symbolic engine already works by pattern-matching rules and rewriting. Normally each rule returns
just the rewritten expression. Instead, every rule returns a record:

```
Step {
  rule:        'power-rule'
  explanation: 'Differentiate xⁿ using d/dx[xⁿ] = n·xⁿ⁻¹'
  before:      d/dx[x²]
  after:       2·x²⁻¹
  substeps:    []          // rules that fired inside this one
}
```

Collect those records and you have the working. This is exactly the shape Google's **mathsteps**
uses (`changeType`, `oldNode`, `newNode`, `substeps`) and what SymPy's `integral_steps()` emits.

Your example falls straight out:

```
Input:   d/dx x²

Step 1   Apply the power rule
         d/dx[xⁿ] = n·xⁿ⁻¹  with n = 2
         d/dx[x²]  →  2·x²⁻¹

Step 2   Simplify the exponent
         2 − 1 = 1
         2·x²⁻¹  →  2·x¹

Step 3   Simplify
         x¹ = x
         2·x¹  →  2x

Answer   d/dx[x²] = 2x
```

## What we can show steps for, and how hard each is

| Operation | Approach | Cost |
|---|---|---|
| **Differentiation** | Our own rules — we're writing them anyway. Power, product, quotient, chain, sum, constant multiple, plus a table for trig/exp/log | `E` |
| **Simplification & algebra** | Combine like terms, distribute, cancel, collect | `M` — or drop in **mathsteps** |
| **Solving linear & quadratic equations** | Isolate, balance both sides, quadratic formula, factoring | `M` — **mathsteps** covers this |
| **Factoring polynomials** | Common factor, difference of squares, trinomials, grouping | `M` — **mathsteps** covers this |
| **Gaussian elimination / RREF** | Show every row operation. *Excellent* for linear algebra and trivially easy | `E` |
| **Matrix determinant & inverse** | Cofactor expansion or row reduction, step by step | `E` |
| **Limits** | Direct substitution → factor/cancel → conjugate → L'Hôpital, in that order | `M` |
| **Integration** | **SymPy `integral_steps()`** via Pyodide — purpose-built for exactly this and used by SymPy Gamma. Or implement a subset ourselves: power rule, u-substitution, by parts, partial fractions, trig | `M` ours / `H` Pyodide plumbing |
| **Series expansion** | Term-by-term Taylor construction with the general formula shown | `M` |
| **Systems of equations** | Substitution and elimination, each move shown | `M` |

## Existing tools we can reuse

| Tool | What it gives | Notes |
|---|---|---|
| **mathsteps** (`npm i mathsteps`, google/mathsteps) | Step-by-step simplification, equation solving, factoring for pre-algebra and algebra. Returns structured step objects | JavaScript, drops straight into the browser. **Verify the licence before use.** Originally open-sourced by Socratic |
| **SymPy `integral_steps()` / `manualintegrate()`** | Human-style integration steps, mimicking how a student would work by hand. Returns rule objects (`URule`, `ArctanRule`, …) | BSD licensed. Needs Pyodide (~10 MB, slow cold start — a real cost on your RAM budget) |
| **Our own differentiator** | Everything in the derivative column above | Zero extra dependency; we own the code |

## Recommended build

1. **Our own step-tracing differentiator first.** Free, no dependencies, covers the case you described, and validates the whole UI pattern.
2. **Gaussian elimination steps second.** Also nearly free, and it's the single best pedagogical view in linear algebra.
3. **mathsteps for algebra** — simplification, solving, factoring — as a bolt-on.
4. **Integration steps last**, and only decide between our own rule subset and Pyodide+SymPy after
   testing the Pyodide cold start on your actual machine.

## Interface sketch

A **Steps** button on any expression that can be worked out — same long-press/options tray pattern
Desmos already uses, so it costs no new chrome. Clicking opens a panel with numbered steps, each
rendered in real MathQuill rather than plain text, with the rule name and a plain-English sentence.
Collapsible substeps for the nested rules. A "copy as LaTeX" action so the working can go into a
document.

**Bonus that falls out for free:** because each step is a real expression, any step can be clicked to
push it into the expression list and graph it. Watching each stage of a derivative plotted against
the original is genuinely useful, and nothing else does it.

---

# Part 2 — Capabilities not yet in the catalog

Gaps found on a second pass, mostly from comparing against Mathematica/Maple feature sets.

## Genuinely missing and worth having

| Capability | What it is | Real-world use | Cost |
|---|---|---|---|
| ★ **Special functions** | Gamma, beta, error function, Bessel, elliptic, zeta, Lambert W, Airy | Heat conduction, antenna and waveguide design, statistics tails, orbital mechanics. A serious omission — these appear constantly in physics | `M` |
| ★ **Nonlinear system solving** | Multi-dimensional Newton / homotopy for f(x,y)=0, g(x,y)=0 | Equilibrium points, circuit operating points, intersection of implicit curves, kinematics | `M` |
| ★ **Implicit differentiation** | dy/dx directly from F(x,y)=0 | Related-rates problems, constraint surfaces, thermodynamic relations | `E` |
| ★ **Uncertainty propagation** | Carry ± error through a calculation automatically | Every lab measurement; error bars that follow the maths instead of being hand-computed | `M` |
| ★ **Physical constants library** | c, ħ, G, k_B, e, N_A with units attached | Physics work without retyping constants; pairs with the units system | `E` |
| **Recurrence relations** | Solve aₙ = f(aₙ₋₁, …) for a closed form | Algorithm analysis, compound interest, population models, Fibonacci-type problems | `H` |
| **Inequality solving** | Solve and display solution sets, including systems | Feasible regions, domain determination, optimisation constraints | `M` |
| **Piecewise construction & analysis** | Build piecewise functions and check continuity/differentiability at joins | Control switching, tax brackets, spline analysis, signal generation | `E` |
| **Function composition & inverse** | f∘g as an operator; solve for f⁻¹ | Transformation chains, change of variables, cryptography | `E` |
| **Computational geometry** | Convex hull, Voronoi, Delaunay triangulation, point-in-polygon | Mesh generation, nearest-facility problems, collision detection, terrain | `M` |
| **Sparse matrices + iterative solvers** | Conjugate gradient, GMRES for large systems | Any PDE discretisation; large networks. Matters *because* of your RAM ceiling | `H` |
| **Number bases & bitwise operations** | Binary/hex/octal, AND/OR/XOR/shifts | Digital logic, embedded work, cryptography, low-level debugging | `E` |
| **Weighted / nonlinear curve fitting** | Least squares with per-point weights, χ² goodness-of-fit | Fitting real experimental data honestly, with confidence intervals | `M` |
| **Symbolic regression** | Search for a *formula* that fits data, not just parameters | Discovering empirical laws from measurements | `XH` |
| **Diophantine equations** | Integer-only solutions | Cryptography, scheduling with whole units, puzzles | `H` |
| **Quantifier elimination** | Decide statements like "for all x, …" | Automatic proof of inequalities, robust control design | `XH` |

## Deliberately excluded

| Item | Why |
|---|---|
| Formal proof assistant (Lean/Coq style) | Entirely different product; enormous |
| Full symbolic PDE solving | Even Mathematica struggles; numeric PDE already covers the practical need |
| Neural network training | Not a graphing calculator's job; use PyTorch |
| Geometry construction tool | Desmos has a separate Geometry product; duplicating it doesn't serve the stated use cases |

## Revised priority additions

Fold these into the existing phases:

- **Phase 1** — add implicit differentiation, physical constants, piecewise analysis, function composition/inverse, number bases, and the **step-by-step differentiator**
- **Phase 2** — add special functions, nonlinear system solving, uncertainty propagation, **Gaussian elimination steps**, weighted curve fitting, inequality solving
- **Phase 3** — add computational geometry, recurrence relations, sparse/iterative solvers, **integration steps**
- **Deferred** — symbolic regression, Diophantine solving, quantifier elimination

---

## The two decisions that need making

1. **Integration steps: our own rules, or Pyodide + SymPy?** SymPy's is far more complete and purpose-built,
   but costs ~10 MB and a slow cold start on a machine with 2–4 GB free. Test before committing.
2. **mathsteps licence.** Verify it before it goes anywhere near the codebase, even for a private project.

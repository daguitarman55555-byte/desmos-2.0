// Root finding.
//
// Milestone 1 needs only the bracketing scan and bisection that the prototype used, and those
// are ported exactly — including two guards that look like defensive noise but are each fixing
// a real, reproducible defect. Both are called out below and both are covered by tests.

/**
 * Bisect a bracketed sign change. Sixty halvings takes any starting bracket to the limit of
 * double precision, so there is no tolerance parameter to get wrong.
 *
 * Returns NaN if the function goes non-finite anywhere inside the bracket, which is how a root
 * that sits against an asymptote gets discarded rather than reported at a garbage location.
 */
export function bisect(f: (t: number) => number, a: number, b: number): number {
  let fa = f(a);
  for (let i = 0; i < 60; i++) {
    const m = (a + b) / 2;
    const fm = f(m);
    if (!isFinite(fm)) return NaN;
    if ((fa < 0) === (fm < 0)) {
      a = m;
      fa = fm;
    } else {
      b = m;
    }
  }
  return (a + b) / 2;
}

/**
 * Sample `f` across [a, b] at `samples` intervals and return every root found, in scan order.
 *
 * `eps` is a noise floor. A sign flip where *both* neighbouring samples are below it is treated
 * as a rounding artefact rather than a root. This exists because a straight line's second
 * difference is identically zero in exact arithmetic and rattles around ±1e-16 in floating
 * point — without the floor, scanning it for inflections reports one at practically every
 * sample, which then floods the result list and pushes the genuine intersections past the cap.
 * Callers scanning `f` itself pass 0; callers scanning a derivative pass a scaled floor.
 */
export function scanRoots(
  f: (t: number) => number,
  a: number,
  b: number,
  samples: number,
  eps: number = 0,
): number[] {
  const roots: number[] = [];
  const h = (b - a) / samples;

  let previous = f(a);
  let previousT = a;

  for (let i = 1; i <= samples; i++) {
    const t = a + i * h;
    const v = f(t);

    if (v === 0) {
      // A root landing exactly on a sample point produces no sign change at all, so the
      // bracketing test below never sees it and it was being dropped entirely. Record it
      // directly — but only when it is isolated, otherwise a stretch of flat zero would emit
      // one "root" per sample.
      const next = f(t + h);
      if (previous !== 0 && next !== 0 && isFinite(previous) && isFinite(next)) {
        roots.push(t);
      }
    } else if (
      isFinite(previous) && isFinite(v) && previous !== 0 &&
      (previous < 0) !== (v < 0) &&
      (Math.abs(previous) > eps || Math.abs(v) > eps)
    ) {
      const root = bisect(f, previousT, t);
      if (isFinite(root)) roots.push(root);
    }

    previous = v;
    previousT = t;
  }

  return roots;
}

// ── Not needed by milestone 1 ────────────────────────────────────────────────────────────────
// Once forward-mode autodiff lands (core/numeric/dual.ts) Newton becomes the natural refinement
// step after the bracketing scan above, and the finite-difference step sizes in core/poi.ts go
// away with it.

export function newton(
  _f: (t: number) => number,
  _df: (t: number) => number,
  _x0: number,
  _tol?: number,
): number {
  throw new Error('TODO: roots.newton — not implemented in milestone 1');
}

export function brent(_f: (t: number) => number, _a: number, _b: number, _tol?: number): number {
  throw new Error('TODO: roots.brent — not implemented in milestone 1');
}

export function solveSystem(
  _f: (x: readonly number[]) => readonly number[],
  _x0: readonly number[],
): readonly number[] {
  throw new Error('TODO: roots.solveSystem — not implemented in milestone 1');
}

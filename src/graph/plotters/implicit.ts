// Implicit curves by marching squares on a fixed grid.
//
// Interval arithmetic (core/numeric/interval.ts) is the eventual replacement — it would let a
// cell be discarded outright when the function provably excludes zero, removing both the
// artefacts and most of the sampling cost. Until then this is a straight uniform scan.

import { asScalar } from '../../core/eval/backend.ts';
import type { Compiled } from '../../core/eval/backend.ts';
import type { Frame } from '../../core/eval/backend.ts';
import type { Scope } from '../../core/lang/scope.ts';
import type { Polyline } from './explicit.ts';
import type { Transform, ViewportState } from '../transform/Transform.ts';

/** Grid resolution per axis. 240 keeps a circle smooth without a visible sampling cost. */
export const IMPLICIT_GRID = 240;

export interface ImplicitOptions {
  readonly fn: Compiled;
  readonly view: ViewportState;
  readonly transform: Transform;
  readonly scope: Scope;
}

/**
 * Returns one two-point segment per crossed cell, in screen space.
 *
 * Segments are not stitched into continuous paths. That is deliberate: stroking them
 * individually looks identical at these densities, and leaving them unjoined keeps hit testing
 * in pick.ts uniform across curve types.
 */
export function plotImplicit(options: ImplicitOptions): Polyline[] {
  const { fn, view, transform, scope } = options;
  const n = IMPLICIT_GRID;

  const [x0, y1] = transform.inverse(view, 0, 0);
  const [x1, y0] = transform.inverse(view, view.width, view.height);
  const dx = (x1 - x0) / n;
  const dy = (y1 - y0) / n;

  const grid = new Float64Array((n + 1) * (n + 1));
  // One frame object, mutated in place — this loop runs 58,081 times per redraw.
  const frame: Frame = { x: 0, y: 0 };

  for (let j = 0; j <= n; j++) {
    frame.y = y0 + j * dy;
    for (let i = 0; i <= n; i++) {
      frame.x = x0 + i * dx;
      let v: number;
      try {
        v = asScalar(fn(frame, scope));
      } catch {
        v = NaN;
      }
      grid[j * (n + 1) + i] = isFinite(v) ? v : NaN;
    }
  }

  const at = (i: number, j: number): number => grid[j * (n + 1) + i] as number;
  const segments: Polyline[] = [];

  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const a = at(i, j);
      const b = at(i + 1, j);
      const c = at(i + 1, j + 1);
      const d = at(i, j + 1);
      // Any NaN corner and the cell is skipped entirely, which is what opens a gap along a
      // domain boundary rather than drawing a wall there.
      if (!isFinite(a) || !isFinite(b) || !isFinite(c) || !isFinite(d)) continue;

      const crossings: Array<readonly [number, number]> = [];
      if ((a < 0) !== (b < 0)) crossings.push([x0 + (i + a / (a - b)) * dx, y0 + j * dy]);
      if ((b < 0) !== (c < 0)) crossings.push([x0 + (i + 1) * dx, y0 + (j + b / (b - c)) * dy]);
      if ((d < 0) !== (c < 0)) crossings.push([x0 + (i + d / (d - c)) * dx, y0 + (j + 1) * dy]);
      if ((a < 0) !== (d < 0)) crossings.push([x0 + i * dx, y0 + (j + a / (a - d)) * dy]);

      // Pair them up in order. A saddle cell has four crossings and gets two segments; the
      // pairing is arbitrary there, which is the classic marching-squares ambiguity and is
      // invisible at this resolution.
      for (let k = 0; k + 1 < crossings.length; k += 2) {
        const p = crossings[k] as readonly [number, number];
        const q = crossings[k + 1] as readonly [number, number];
        const [px, py] = transform.forward(view, p[0], p[1]);
        const [qx, qy] = transform.forward(view, q[0], q[1]);
        segments.push([px, py, qx, qy]);
      }
    }
  }

  return segments;
}

// Explicit curves: y = f(x) sampled left to right, x = g(y) sampled top to bottom.
//
// Plotters produce geometry and nothing else. The renderer strokes it, `pick.ts` hit-tests
// against it, and `trace.ts` snaps to it — all three want the same screen-space polylines, so
// they are generated once per draw and shared.

import { asScalar } from '../../core/eval/backend.ts';
import type { Compiled } from '../../core/eval/backend.ts';
import type { Scope } from '../../core/lang/scope.ts';
import type { Point, Transform, ViewportState } from '../transform/Transform.ts';

/** A run of connected points in screen space, flat: `[x0, y0, x1, y1, ...]`. */
export type Polyline = number[];

/** Sampling step along the sweep axis, in css pixels. Two samples per pixel. */
export const SAMPLE_STEP_PX = 0.5;

/** Beyond this many pixels from the origin a point is treated as unplottable. */
const COORDINATE_LIMIT_PX = 1e5;

/**
 * A jump larger than this fraction of the sweep length is read as an asymptote rather than a
 * steep segment, and breaks the polyline so `tan(x)` does not get a vertical line through it.
 */
const ASYMPTOTE_BREAK_FACTOR = 1.5;

export interface ExplicitOptions {
  readonly fn: Compiled;
  /** 'y' sweeps x across the width; 'x' sweeps y down the height. */
  readonly orientation: 'y' | 'x';
  readonly view: ViewportState;
  readonly transform: Transform;
  readonly scope: Scope;
}

/**
 * Sample the curve and return it as screen-space polylines, split wherever it leaves the plane.
 *
 * Non-finite values end the current run without starting a new one, which is what turns a
 * domain violation into a gap in the curve rather than an error — the silent half of the error
 * philosophy, implemented here.
 */
export function plotExplicit(options: ExplicitOptions): Polyline[] {
  const { fn, orientation, view, transform, scope } = options;
  const byX = orientation === 'y';
  const limit = byX ? view.width : view.height;

  const polylines: Polyline[] = [];
  let current: Polyline | null = null;
  let previous = 0;

  for (let q = 0; q <= limit; q += SAMPLE_STEP_PX) {
    // Position along the sweep axis, converted to maths coordinates through the transform.
    const [mx, my] = byX ? transform.inverse(view, q, 0) : transform.inverse(view, 0, q);

    let value: number;
    try {
      value = asScalar(byX ? fn({ x: mx, y: 0 }, scope) : fn({ x: 0, y: my }, scope));
    } catch {
      value = NaN;
    }

    if (!isFinite(value)) {
      current = null;
      continue;
    }

    // The other screen coordinate, obtained by projecting the value back.
    const projected: Point = byX
      ? transform.forward(view, mx, value)
      : transform.forward(view, value, my);
    const other = byX ? projected[1] : projected[0];

    if (Math.abs(other) > COORDINATE_LIMIT_PX) {
      current = null;
      continue;
    }

    if (current && Math.abs(other - previous) > limit * ASYMPTOTE_BREAK_FACTOR) {
      current = null;
    }

    if (!current) {
      current = [];
      polylines.push(current);
    }

    if (byX) current.push(q, other);
    else current.push(other, q);

    previous = other;
  }

  return polylines;
}

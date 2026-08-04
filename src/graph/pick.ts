// Hit testing against the cached screen paths from the last draw.
//
// Testing in screen space rather than maths space is what makes the tolerance mean the same
// thing at every zoom level: ten pixels is ten pixels.

import type { Polyline } from './plotters/explicit.ts';

/** How close the cursor must come to a curve to grab it, in css pixels. */
export const CURVE_PICK_TOLERANCE = 10;

export interface PickableCurve {
  readonly id: number;
  readonly paths: readonly Polyline[];
}

export interface CurveHit {
  readonly id: number;
  readonly distanceSq: number;
  readonly sx: number;
  readonly sy: number;
}

/**
 * Nearest sampled vertex on any curve, within tolerance.
 *
 * Vertices, not segments: at half a pixel of sampling the difference is never visible, and it
 * keeps the inner loop to two subtractions and a multiply.
 */
export function pickCurve(
  curves: readonly PickableCurve[],
  mx: number,
  my: number,
  tolerance: number = CURVE_PICK_TOLERANCE,
): CurveHit | null {
  let best: CurveHit | null = null;
  const limit = tolerance * tolerance;

  for (const curve of curves) {
    for (const path of curve.paths) {
      for (let i = 0; i + 1 < path.length; i += 2) {
        const dx = (path[i] as number) - mx;
        const dy = (path[i + 1] as number) - my;
        const d = dx * dx + dy * dy;
        if (d < limit && (best === null || d < best.distanceSq)) {
          best = { id: curve.id, distanceSq: d, sx: path[i] as number, sy: path[i + 1] as number };
        }
      }
    }
  }

  return best;
}

/** Nearest vertex on one curve with no tolerance — used while dragging a trace point. */
export function nearestOnPaths(
  paths: readonly Polyline[],
  mx: number,
  my: number,
): { readonly sx: number; readonly sy: number } | null {
  let best: { sx: number; sy: number; d: number } | null = null;

  for (const path of paths) {
    for (let i = 0; i + 1 < path.length; i += 2) {
      const dx = (path[i] as number) - mx;
      const dy = (path[i + 1] as number) - my;
      const d = dx * dx + dy * dy;
      if (best === null || d < best.d) {
        best = { sx: path[i] as number, sy: path[i + 1] as number, d };
      }
    }
  }

  return best ? { sx: best.sx, sy: best.sy } : null;
}

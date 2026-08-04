// Points of interest: the grey dots Desmos puts on a selected curve.
//
// This file has to know about the screen — points are de-duplicated by pixel proximity and
// culled to the viewport — but it must not know about the DOM, the canvas or the viewport
// object. The dependency is expressed as a `ScreenMetric` the caller supplies. graph/ builds one
// from its Transform; a test builds one from two lines of arithmetic.

import { asScalar } from './eval/backend.ts';
import type { Compiled, Frame } from './eval/backend.ts';
import type { ExpressionKind } from './lang/analyze.ts';
import type { Scope } from './lang/scope.ts';
import { scanRoots } from './numerics/roots.ts';

export type POIType = 'intercept' | 'intersection' | 'extremum' | 'inflection' | 'trace';

export interface POI {
  readonly x: number;
  readonly y: number;
  readonly type: POIType;
}

/** Which way the curve is swept. `null` means it has no points of interest yet. */
export type Orientation = 'y' | 'x';

export function orientationOf(kind: ExpressionKind | null): Orientation | null {
  if (kind === 'y' || kind === 'func') return 'y';
  if (kind === 'x') return 'x';
  return null;                       // implicit curves and points: not yet
}

export interface POICurve {
  readonly fn: Compiled;
  readonly orientation: Orientation;
}

/** Everything poi.ts needs to know about the screen, and nothing more. */
export interface ScreenMetric {
  project(x: number, y: number): readonly [number, number];
  readonly width: number;
  readonly height: number;
}

// ── Tuning constants, all measured rather than guessed ───────────────────────────────────────
/** Scan resolution for axis crossings and for curve-vs-curve intersections. */
const INTERCEPT_SAMPLES = 1400;
const INTERSECTION_SAMPLES = 1400;
/** Extrema and inflections need fewer samples because their scan functions are smoother. */
const EXTREMUM_SAMPLES = 900;
const INFLECTION_SAMPLES = 500;
/** Two points closer than this many pixels are the same point. */
const DEDUPE_PIXELS = 4;
/** How far outside the viewport a point may sit and still be kept. */
const CULL_MARGIN_PIXELS = 20;
/** Hard cap. The scans are ordered by importance so this trims the tail, not the useful points. */
const MAX_POINTS = 80;
/** Samples used to estimate the magnitude of f over the window, for the noise floors. */
const MAGNITUDE_SAMPLES = 40;

/** Evaluate a curve at its sweep parameter, mapping every failure to NaN. */
export function evaluateCurve(curve: POICurve, t: number, scope: Scope): number {
  try {
    const frame: Frame = curve.orientation === 'y' ? { x: t, y: 0 } : { x: 0, y: t };
    const v = asScalar(curve.fn(frame, scope));
    return isFinite(v) ? v : NaN;
  } catch {
    return NaN;
  }
}

/**
 * Find every point of interest on `target` within the sweep range [a, b].
 *
 * The scans run in descending order of usefulness — intercepts, then intersections, then
 * extrema, then inflections — because the cap at the end keeps the first `MAX_POINTS` that
 * survive de-duplication.
 */
export function computePointsOfInterest(
  target: POICurve,
  others: readonly POICurve[],
  a: number,
  b: number,
  scope: Scope,
  screen: ScreenMetric,
): POI[] {
  const orientation = target.orientation;
  const f = (t: number): number => evaluateCurve(target, t, scope);

  // Finite-difference step sizes, balancing h^2 truncation error against eps/h cancellation.
  //
  // These are scaled to the width of the window rather than to a pixel. Using a one-pixel step
  // biases the extrema of x^3-3x to ±0.99993 instead of landing exactly on ±1, which is visible
  // in the coordinate readout and is the kind of error that looks like a maths bug.
  const dh1 = Math.max(1e-9, (b - a) * 1e-6);
  const dh2 = Math.max(1e-6, (b - a) * 1e-4);
  const d1 = (t: number): number => (f(t + dh1) - f(t - dh1)) / (2 * dh1);
  const d2 = (t: number): number => (f(t + dh2) - 2 * f(t) + f(t - dh2)) / (dh2 * dh2);

  const point = (type: POIType) => (t: number): POI =>
    orientation === 'y' ? { x: t, y: f(t), type } : { x: f(t), y: t, type };

  // Rough magnitude of f across the window, used to scale the derivative noise floors so they
  // mean the same thing whether the curve is of order 1 or order 10^6.
  let magnitude = 1;
  for (let i = 0; i <= MAGNITUDE_SAMPLES; i++) {
    const v = Math.abs(f(a + ((b - a) * i) / MAGNITUDE_SAMPLES));
    if (isFinite(v) && v > magnitude) magnitude = v;
  }
  const range = b - a;
  const eps1 = (1e-6 * magnitude) / range;
  const eps2 = (1e-4 * magnitude) / (range * range);

  const found: POI[] = [];

  // Axis crossings.
  for (const t of scanRoots(f, a, b, INTERCEPT_SAMPLES)) found.push(point('intercept')(t));

  // The crossing of the *other* axis is a single evaluation, not a scan.
  if (a <= 0 && 0 <= b && isFinite(f(0))) {
    const v = f(0);
    found.push(orientation === 'y' ? { x: 0, y: v, type: 'intercept' } : { x: v, y: 0, type: 'intercept' });
  }

  // Intersections with every other curve swept the same way.
  for (const other of others) {
    if (other.orientation !== orientation) continue;
    const difference = (t: number): number => f(t) - evaluateCurve(other, t, scope);
    for (const t of scanRoots(difference, a, b, INTERSECTION_SAMPLES)) {
      found.push(point('intersection')(t));
    }
  }

  // Maxima and minima, then inflections. Both scans are inset by their own step size so the
  // difference stencils never reach outside the window.
  for (const t of scanRoots(d1, a + dh1, b - dh1, EXTREMUM_SAMPLES, eps1)) {
    found.push(point('extremum')(t));
  }
  for (const t of scanRoots(d2, a + dh2, b - dh2, INFLECTION_SAMPLES, eps2)) {
    found.push(point('inflection')(t));
  }

  // Drop anything off-screen or landing on top of something already kept.
  const seen: Array<readonly [number, number]> = [];
  const kept: POI[] = [];

  for (const p of found) {
    if (!isFinite(p.x) || !isFinite(p.y)) continue;
    const [sx, sy] = screen.project(p.x, p.y);
    if (sx < -CULL_MARGIN_PIXELS || sx > screen.width + CULL_MARGIN_PIXELS) continue;
    if (sy < -CULL_MARGIN_PIXELS || sy > screen.height + CULL_MARGIN_PIXELS) continue;
    if (seen.some(([qx, qy]) => Math.abs(qx - sx) < DEDUPE_PIXELS && Math.abs(qy - sy) < DEDUPE_PIXELS)) continue;
    seen.push([sx, sy]);
    kept.push(p);
    if (kept.length >= MAX_POINTS) break;
  }

  return kept;
}

/**
 * Format a coordinate for a point label, recognising simple multiples of π the way Desmos does,
 * so the extrema of cos(y) = x read as ±π rather than ±3.14159.
 */
export function formatCoordinate(v: number): string {
  if (!isFinite(v)) return '∞';
  if (Math.abs(v) < 1e-10) return '0';

  for (const denominator of [1, 2, 3, 4, 6, 8, 12]) {
    const n = Math.round((v * denominator) / Math.PI);
    if (n && Math.abs(v - (n * Math.PI) / denominator) < 1e-9 && Math.abs(n) <= 200) {
      const coefficient = n === 1 ? '' : n === -1 ? '-' : String(n);
      return denominator === 1 ? `${coefficient}π` : `${coefficient}π/${denominator}`;
    }
  }

  const rounded = Math.round(v);
  if (Math.abs(v - rounded) < 1e-9) return String(rounded);
  return String(parseFloat(v.toPrecision(6)));
}

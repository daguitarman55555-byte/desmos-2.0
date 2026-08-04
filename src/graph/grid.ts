// Tick selection. Pure arithmetic — the drawing lives in renderer.ts.

/** Target spacing between labelled grid lines, in css pixels. See GRID_TARGET_PX below. */
export const GRID_TARGET_PX = 104;

/** Desmos describes its minor grid as "quarter marks between your step value". Always four. */
export const MINOR_SUBDIVISIONS = 4;

export interface GridSteps {
  /** Spacing of the labelled lines, in maths units. Always 1, 2 or 5 times a power of ten. */
  readonly major: number;
  /** Spacing of the unlabelled lines. Always major / 4. */
  readonly minor: number;
}

/**
 * Choose the labelled step so that grid lines land on 1, 2 or 5 times a power of ten and sit
 * roughly `GRID_TARGET_PX` apart.
 *
 * The 104 is measured, not chosen: the reference captures show ~130 device pixels between
 * labelled lines, taken at a device pixel ratio of 1.25, and 130 / 1.25 = 104. If the reference
 * screenshots are ever retaken at a different ratio, this is the number to re-derive.
 *
 * The thresholds sit at the geometric-ish midpoints of the 1-2-5 sequence, so the step switches
 * where the error either side is comparable rather than at round numbers.
 */
export function gridSteps(pixelsPerUnit: number): GridSteps {
  const raw = GRID_TARGET_PX / pixelsPerUnit;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalised = raw / magnitude;
  const multiple = normalised < 1.5 ? 1 : normalised < 3.5 ? 2 : normalised < 7.5 ? 5 : 10;
  const major = multiple * magnitude;
  return { major, minor: major / MINOR_SUBDIVISIONS };
}

/**
 * Format a tick label, showing exactly as many decimals as the step warrants.
 *
 * `parseFloat(...).toString()` at the end is what strips the trailing zeros `toFixed` leaves
 * behind, so a step of 0.5 labels as "1.5" and not "1.50".
 */
export function formatTick(value: number, step: number): string {
  if (value === 0) return '0';
  if (Math.abs(value) >= 1e6 || Math.abs(value) < 1e-4) return value.toExponential(1);
  const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1);
  return parseFloat(value.toFixed(Math.min(10, decimals))).toString();
}

/** Multiples of `step` covering [lo, hi]. The tolerance keeps the far endpoint from dropping out. */
export function ticksBetween(lo: number, hi: number, step: number, epsilon: number): number[] {
  const out: number[] = [];
  for (let i = Math.ceil(lo / step); i * step <= hi + epsilon; i++) out.push(i * step);
  return out;
}

/** Is `value` a multiple of `major`? Used to skip minor lines that a major line already covers. */
export const isMajorLine = (value: number, major: number): boolean =>
  Math.abs(value / major - Math.round(value / major)) < 1e-6;

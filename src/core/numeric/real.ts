// Float ops with explicit tolerances, and division that yields NaN rather than Infinity
// where the error philosophy calls for a gap in the curve.

/** Comparisons in this project are tolerance-based; never use === on computed floats. */
export const EPS = 1e-12;

export function nearlyEqual(_a: number, _b: number, _tol: number = EPS): boolean {
  throw new Error('TODO: real.nearlyEqual — not implemented in milestone 1');
}

/** Division that reports domain failure as NaN, matching the silent-numeric-error rule. */
export function safeDiv(_a: number, _b: number): number {
  throw new Error('TODO: real.safeDiv — not implemented in milestone 1');
}

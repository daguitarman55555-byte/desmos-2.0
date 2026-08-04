// Interval arithmetic — the machinery behind artefact-free implicit plots and
// guaranteed root bracketing (UPGRADES P0 item 5).
//
// An interval is [lo, hi] with lo <= hi. NaN endpoints mean "no information", which is
// how domain violations propagate without throwing.

export interface Interval {
  readonly tag: 'interval';
  readonly lo: number;
  readonly hi: number;
}

export const interval = (lo: number, hi: number): Interval => ({ tag: 'interval', lo, hi });

export function addI(_a: Interval, _b: Interval): Interval {
  throw new Error('TODO: interval.addI — not implemented in milestone 1');
}

export function mulI(_a: Interval, _b: Interval): Interval {
  throw new Error('TODO: interval.mulI — not implemented in milestone 1');
}

/** True when the interval provably excludes zero — lets the plotter discard a whole cell. */
export function excludesZero(_a: Interval): boolean {
  throw new Error('TODO: interval.excludesZero — not implemented in milestone 1');
}

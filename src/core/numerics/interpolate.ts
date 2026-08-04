export type Spline = (x: number) => number;

export function cubicSpline(_xs: readonly number[], _ys: readonly number[]): Spline {
  throw new Error('TODO: interpolate.cubicSpline — not implemented in milestone 1');
}

export function linearInterp(_xs: readonly number[], _ys: readonly number[]): Spline {
  throw new Error('TODO: interpolate.linearInterp — not implemented in milestone 1');
}

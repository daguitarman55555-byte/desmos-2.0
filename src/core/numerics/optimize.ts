export interface OptimizeResult {
  readonly x: readonly number[];
  readonly value: number;
  readonly converged: boolean;
  readonly iterations: number;
}

export function minimise(_f: (x: readonly number[]) => number, _x0: readonly number[], _tol?: number): OptimizeResult {
  throw new Error('TODO: optimize.minimise — not implemented in milestone 1');
}

// Adaptive integration that reports its own error bound.

export interface QuadratureResult {
  readonly value: number;
  readonly errorEstimate: number;
  readonly evaluations: number;
}

export function integrate(_f: (x: number) => number, _a: number, _b: number, _tol?: number): QuadratureResult {
  throw new Error('TODO: quadrature.integrate — not implemented in milestone 1');
}

// Dormand-Prince RK45 adaptive for non-stiff systems, Rosenbrock/BDF for stiff
// (UPGRADES P2 item 12). Autodiff from core/numeric/dual.ts supplies exact Jacobians.

export interface ODEOptions {
  readonly relTol: number;
  readonly absTol: number;
  readonly maxStep: number;
  /** Roots of these are located exactly during integration — UPGRADES P2 item 16. */
  readonly events: readonly ((t: number, y: readonly number[]) => number)[];
}

export interface ODESolution {
  readonly t: readonly number[];
  readonly y: readonly (readonly number[])[];
  readonly eventTimes: readonly number[];
}

export function solveIVP(
  _f: (t: number, y: readonly number[]) => readonly number[],
  _tSpan: readonly [number, number],
  _y0: readonly number[],
  _options?: Partial<ODEOptions>,
): ODESolution {
  throw new Error('TODO: ode.solveIVP — not implemented in milestone 1');
}

// Forward-mode automatic differentiation (UPGRADES P0 item 4).
//
// Exact derivatives, not finite differences. Milestone 1's points-of-interest scan uses
// central differences with hand-tuned step sizes precisely because this does not exist yet;
// once it does, core/poi.ts should switch and the step-size constants disappear.

export interface Dual {
  readonly tag: 'dual';
  /** Value. */
  readonly v: number;
  /** Derivative with respect to the seeded variable. */
  readonly d: number;
}

export const dual = (v: number, d: number): Dual => ({ tag: 'dual', v, d });

/** Seed the variable being differentiated with respect to. */
export const seed = (v: number): Dual => ({ tag: 'dual', v, d: 1 });

export function addD(_a: Dual, _b: Dual): Dual {
  throw new Error('TODO: dual.addD — not implemented in milestone 1');
}

export function mulD(_a: Dual, _b: Dual): Dual {
  throw new Error('TODO: dual.mulD — not implemented in milestone 1');
}

export function sinD(_a: Dual): Dual {
  throw new Error('TODO: dual.sinD — not implemented in milestone 1');
}

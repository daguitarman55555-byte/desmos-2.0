// First-order error propagation: a value carrying a standard uncertainty.

export interface Uncertain {
  readonly value: number;
  readonly sigma: number;
}

export function addU(_a: Uncertain, _b: Uncertain): Uncertain {
  throw new Error('TODO: uncertainty.addU — not implemented in milestone 1');
}

export function mulU(_a: Uncertain, _b: Uncertain): Uncertain {
  throw new Error('TODO: uncertainty.mulU — not implemented in milestone 1');
}

/** Propagate through an arbitrary f using its derivative at the point. */
export function propagate(_a: Uncertain, _f: (x: number) => number, _dfdx: (x: number) => number): Uncertain {
  throw new Error('TODO: uncertainty.propagate — not implemented in milestone 1');
}

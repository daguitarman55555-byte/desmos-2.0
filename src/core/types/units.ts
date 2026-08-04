// Dimensional analysis (UPGRADES P2 item 15) — catches the error class that actually
// bites in physics work.
//
// A dimension is the exponent vector over the seven SI base units.

export interface Dimension {
  readonly length: number;
  readonly mass: number;
  readonly time: number;
  readonly current: number;
  readonly temperature: number;
  readonly amount: number;
  readonly luminosity: number;
}

export interface Quantity {
  readonly value: number;
  readonly dimension: Dimension;
}

export const DIMENSIONLESS: Dimension = {
  length: 0, mass: 0, time: 0, current: 0, temperature: 0, amount: 0, luminosity: 0,
};

export function addQuantity(_a: Quantity, _b: Quantity): Quantity {
  throw new Error('TODO: units.addQuantity — not implemented in milestone 1');
}

export function mulQuantity(_a: Quantity, _b: Quantity): Quantity {
  throw new Error('TODO: units.mulQuantity — not implemented in milestone 1');
}

export function sameDimension(_a: Dimension, _b: Dimension): boolean {
  throw new Error('TODO: units.sameDimension — not implemented in milestone 1');
}

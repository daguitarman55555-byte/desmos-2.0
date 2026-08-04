// Exact fractions — decision 11 (1/3 stays 1/3). Always kept in lowest terms with d > 0.

export interface Rational {
  readonly tag: 'rational';
  readonly n: bigint;
  readonly d: bigint;
}

export function rational(_n: bigint, _d: bigint): Rational {
  throw new Error('TODO: rational.rational — not implemented in milestone 1');
}

export function addQ(_a: Rational, _b: Rational): Rational {
  throw new Error('TODO: rational.addQ — not implemented in milestone 1');
}

export function mulQ(_a: Rational, _b: Rational): Rational {
  throw new Error('TODO: rational.mulQ — not implemented in milestone 1');
}

export function toNumber(_q: Rational): number {
  throw new Error('TODO: rational.toNumber — not implemented in milestone 1');
}

/** Recover a fraction from a float, for display — the "exact where possible" toggle. */
export function fromNumber(_x: number, _maxDenominator?: number): Rational | null {
  throw new Error('TODO: rational.fromNumber — not implemented in milestone 1');
}

// Promotion rules between every numeric representation — decision 11.
//
// This file exists so that "what happens when a Rational meets an Interval" is answered in
// exactly one place instead of leaking into forty operators.

import type { Rational } from './rational.ts';
import type { BigNum } from './bignum.ts';
import type { Complex } from './complex.ts';
import type { Interval } from './interval.ts';
import type { Dual } from './dual.ts';

export type Num = number | Rational | BigNum | Complex | Interval | Dual;

/** Ordered least to most general. A binary op promotes both operands to the higher rank. */
export type Rank = 0 | 1 | 2 | 3 | 4 | 5;

export function rankOf(_x: Num): Rank {
  throw new Error('TODO: tower.rankOf — not implemented in milestone 1');
}

export function promote(_x: Num, _to: Rank): Num {
  throw new Error('TODO: tower.promote — not implemented in milestone 1');
}

/** Promote both operands to their common rank before dispatch. */
export function unify(_a: Num, _b: Num): readonly [Num, Num] {
  throw new Error('TODO: tower.unify — not implemented in milestone 1');
}

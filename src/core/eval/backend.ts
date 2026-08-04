// The compile-target interface.
//
// This file is the reason the GPU path (UPGRADES, deferred) is a new file rather than a rewrite.
// Nothing outside src/core/eval/ knows how compilation happens; everything else asks for a
// `Compiled` and calls it.

import type { Node } from '../lang/ast.ts';
import type { Scope } from '../lang/scope.ts';

/**
 * The variables bound at the point of evaluation.
 *
 * For plotting this is `{ x, y }`. For the body of a user-defined function it is that
 * function's parameters and *nothing else* — which is why `f(t) = x + t` evaluates `x` as NaN
 * rather than reading the plot's x. That is the prototype's behaviour and it is preserved.
 *
 * Names not found here fall through to the document scope; `x` and `y` deliberately do not.
 */
export type Frame = Record<string, number>;

/** A tuple only ever arises from `(a, b)` literal syntax; everything else is a scalar. */
export type Value = number | readonly number[];

export type Compiled = (frame: Frame, scope: Scope) => Value;

export interface Backend {
  readonly name: string;
  compile(node: Node): Compiled;
}

/**
 * Coerce to a scalar for arithmetic.
 *
 * The prototype let a tuple flow into `+` and relied on JavaScript stringifying it — `(1,2)+3`
 * became the string `"1,23"`, which every downstream `isFinite` check rejected. Mapping the
 * same cases to NaN is observably identical, because a tuple always has at least two items and
 * therefore always stringifies with a comma in it. Do not "fix" this into an error: a
 * half-typed expression must stay silent, not throw.
 */
export const asScalar = (v: Value): number => (typeof v === 'number' ? v : NaN);

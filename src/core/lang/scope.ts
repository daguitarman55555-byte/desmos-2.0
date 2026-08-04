// Name resolution: the variables and functions a document has defined.
//
// The prototype kept these in two module-level objects, which meant the maths could not be
// evaluated twice independently and could not be tested without leaking state between cases.
// Making the scope an explicit parameter is the one structural change milestone 1 makes to the
// evaluator, and it changes no behaviour: lookup order and timing are identical.

import type { Compiled } from '../eval/backend.ts';

export interface UserFunction {
  readonly params: readonly string[];
  readonly body: Compiled;
}

export interface Scope {
  /** Single-letter names bound by `a = 5`. */
  readonly vars: Map<string, number>;
  /** Single-letter names bound by `f(x) = ...`. */
  readonly funcs: Map<string, UserFunction>;
}

export const createScope = (): Scope => ({ vars: new Map(), funcs: new Map() });

/**
 * Resolve a name against a frame, then the scope, then give up.
 *
 * `x` and `y` never reach this — they are compiled to direct frame reads, so a user variable
 * named `x` cannot shadow the plotting coordinate.
 */
export function lookupVariable(name: string, frame: Record<string, number>, scope: Scope): number {
  if (name in frame) return frame[name] as number;
  const v = scope.vars.get(name);
  return v === undefined ? NaN : v;
}

/**
 * Function lookup happens at *call* time, not at compile time. That late binding is what lets
 * an expression reference a function defined in a row below it: the closure re-reads the scope
 * on every evaluation, so the definition only has to exist by the time the curve is drawn.
 * Binding eagerly here would silently break forward references.
 */
export const lookupFunction = (name: string, scope: Scope): UserFunction | undefined =>
  scope.funcs.get(name);

export function clearScope(scope: Scope): void {
  scope.vars.clear();
  scope.funcs.clear();
}

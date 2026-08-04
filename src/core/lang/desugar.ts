// Normalisation that happens between source text and classification.
//
// Implicit multiplication is *not* here — it is handled structurally in parse.ts, where
// juxtaposition builds a `binary '*'` node directly. Rewriting the token stream instead would
// change precedence, and `1/2x` meaning `(1/2)*x` depends on it not changing.
//
// Reversed equations are likewise *not* fully normalised here, and that is deliberate. `y = 5`
// and `5 = y` are not equivalent in the prototype: the first offers a slider, the second does
// not. Collapsing the two orientations into one canonical form would quietly add a slider to
// the reversed form. analyze.ts keeps the two branches distinct for that reason.

/**
 * Index of the top-level `=`, ignoring anything inside brackets, or -1 if there is none.
 *
 * Only the first one counts: `a = b = c` splits as `a` and `b = c`, and the right side then
 * fails to parse, giving the row a warning triangle.
 */
export function findTopLevelEquals(src: string): number {
  let depth = 0;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === '=' && depth === 0) return i;
  }
  return -1;
}

export interface EquationSides {
  readonly lhs: string;
  readonly rhs: string;
}

/** Split at the top-level `=`, trimming both halves. Null when the source is not an equation. */
export function splitEquation(src: string): EquationSides | null {
  const at = findTopLevelEquals(src);
  if (at < 0) return null;
  return { lhs: src.slice(0, at).trim(), rhs: src.slice(at + 1).trim() };
}

/** A source that is exactly a decimal literal, optionally negated — the slider trigger. */
export const NUMERIC_LITERAL = /^-?(\d+\.?\d*|\.\d+)$/;

/** `f(x)` or `g(u,v)` on the left of an equation: a user function definition. */
export const FUNCTION_DEFINITION = /^([A-Za-z])\(([A-Za-z](?:,[A-Za-z])*)\)$/;

/** A bare single letter on the left of an equation: a variable definition. */
export const VARIABLE_DEFINITION = /^[A-Za-z]$/;

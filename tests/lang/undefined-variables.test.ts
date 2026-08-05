// Which variables an expression is missing — the input to the "add slider:" prompt.
//
// The interesting cases are all about what counts as *bound*: the plotting coordinates, a
// function's own parameters, the name a row defines for itself, and anything already in scope.

import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/core/lang/analyze.ts';
import { createScope } from '../../src/core/lang/scope.ts';

/** Analyse a list of rows in order, as the store does, and return the last analysis. */
function inOrder(...rows: readonly string[]) {
  const scope = createScope();
  let last = analyze('', scope);
  for (const r of rows) last = analyze(r, scope);
  return last;
}

const missing = (...rows: readonly string[]): readonly string[] =>
  inOrder(...rows).undefinedVariables;

describe('undefinedVariables', () => {
  it('finds the free variables of a point, and not the constants', () => {
    // The screenshot case: e is Euler's number, so only a and b are missing.
    expect(missing('\\left(e,\\sin\\left(a\\right)+b\\right)')).toEqual(['a', 'b']);
  });

  it('reports them in first-appearance order, not alphabetically', () => {
    expect(missing('y=b+a')).toEqual(['b', 'a']);
  });

  it('never offers the plotting coordinates', () => {
    expect(missing('y=x')).toEqual([]);
    expect(missing('y=x^2-4')).toEqual([]);
  });

  it('folds pi, tau and e to numbers rather than calling them missing', () => {
    expect(missing('y=\\pi x')).toEqual([]);
    expect(missing('y=e^x')).toEqual([]);
    expect(missing('y=\\tau')).toEqual([]);
  });

  it('goes quiet once the variable is defined by another row', () => {
    expect(missing('y=ax')).toEqual(['a']);
    expect(missing('a=2', 'y=ax')).toEqual([]);
  });

  it('does not offer a row its own definition', () => {
    expect(missing('a=5')).toEqual([]);
  });

  it('excludes a function’s own parameters but not other free names', () => {
    expect(missing('f\\left(x\\right)=x+c')).toEqual(['c']);
    expect(missing('g\\left(t\\right)=mt')).toEqual(['m']);
  });

  it('does not offer a slider for a missing *function*', () => {
    // h is called, not read as a value — that is a warning triangle, not a slider.
    expect(missing('y=h\\left(x\\right)')).not.toContain('h');
  });

  it('says nothing about an unparseable row', () => {
    expect(missing('y=))(')).toEqual([]);
  });

  it('says nothing about a blank row', () => {
    expect(missing('')).toEqual([]);
  });

  it('collects from both sides of an implicit equation', () => {
    expect(missing('xy+p=q')).toEqual(['p', 'q']);
  });

  it('finds several at once, in order', () => {
    expect(missing('y=m\\cdot\\sin\\left(bx+c\\right)+d')).toEqual(['m', 'b', 'c', 'd']);
  });

  // Pinned as a known limitation, not as desired behaviour. `latexToSource` flattens `\sin` to
  // `sin`, so `a\sin(x)` becomes the string `asin(x)`, which the tokenizer longest-matches as
  // arcsine — and the coefficient `a` vanishes. The same trap exists for `a\cos` and `a\tan`.
  // Fixing it means teaching latexToSource to keep function-name boundaries; until then this
  // test documents what actually happens so the loss is visible rather than surprising.
  it('KNOWN BUG: a coefficient is swallowed by asin/acos/atan', () => {
    expect(missing('y=a\\sin\\left(bx\\right)')).toEqual(['b']);
    expect(missing('y=a\\cos\\left(bx\\right)')).toEqual(['b']);
  });
});

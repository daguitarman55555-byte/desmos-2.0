import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/core/lang/analyze.ts';
import { createScope } from '../../src/core/lang/scope.ts';
import { asScalar } from '../../src/core/eval/backend.ts';
import type { Scope } from '../../src/core/lang/scope.ts';

const at = (a: ReturnType<typeof analyze>, scope: Scope, x = 0, y = 0): number => {
  if (!a.fn) throw new Error('expression produced no function');
  return asScalar(a.fn({ x, y }, scope));
};

describe('classification', () => {
  it('reads a bare expression as y = f(x)', () => {
    const scope = createScope();
    const a = analyze('x^2', scope);
    expect(a.kind).toBe('y');
    expect(at(a, scope, 3)).toBe(9);
  });

  it('reads y = f(x) as a left-to-right sweep', () => {
    const scope = createScope();
    expect(analyze('y=2x+1', scope).kind).toBe('y');
  });

  it('reads x = g(y) as a top-to-bottom sweep', () => {
    const scope = createScope();
    const a = analyze('x=y^2', scope);
    expect(a.kind).toBe('x');
    expect(at(a, scope, 0, 3)).toBe(9);
  });

  it('treats cos(y)=x as a vertical sweep, not an implicit curve', () => {
    // This is what earns it fast sampling and points of interest.
    const scope = createScope();
    const a = analyze('cos(y)=x', scope);
    expect(a.kind).toBe('x');
    expect(at(a, scope, 0, Math.PI)).toBeCloseTo(-1, 12);
  });

  it('falls back to an implicit curve when both variables appear on one side', () => {
    const scope = createScope();
    const a = analyze('x^2+y^2=25', scope);
    expect(a.kind).toBe('implicit');
    expect(at(a, scope, 3, 4)).toBe(0);
    expect(at(a, scope, 0, 0)).toBe(-25);
  });

  it('reads a two-element tuple as a point', () => {
    const scope = createScope();
    const a = analyze('(1,2)', scope);
    expect(a.kind).toBe('point');
    expect(a.fn?.({ x: 0, y: 0 }, scope)).toEqual([1, 2]);
  });

  it('flags a bare expression in terms of y, rather than guessing', () => {
    const scope = createScope();
    const a = analyze('y+1', scope);
    expect(a.error).toBe(true);
    expect(a.kind).toBeNull();
  });

  it('leaves an empty expression neither classified nor in error', () => {
    const scope = createScope();
    const a = analyze('', scope);
    expect(a.kind).toBeNull();
    expect(a.error).toBe(false);
  });

  it('flags unparseable input', () => {
    const scope = createScope();
    expect(analyze('sin(', scope).error).toBe(true);
  });
});

describe('definitions', () => {
  it('binds a single letter as a variable and offers a slider', () => {
    const scope = createScope();
    const a = analyze('a=5', scope);
    expect(a.kind).toBe('slider');
    expect(a.variableName).toBe('a');
    expect(a.sliderKind).toBe('var');
    expect(a.value).toBe(5);
    expect(scope.vars.get('a')).toBe(5);
  });

  it('evaluates a variable definition against names already in scope', () => {
    const scope = createScope();
    analyze('a=5', scope);
    analyze('b=2a', scope);
    expect(scope.vars.get('b')).toBe(10);
  });

  it('falls through to an implicit curve when a definition is not finite', () => {
    const scope = createScope();
    const a = analyze('a=1/0', scope);
    expect(a.kind).toBe('implicit');
    expect(scope.vars.has('a')).toBe(false);
  });

  it('binds a function definition and draws the one-parameter case', () => {
    const scope = createScope();
    const a = analyze('f(x)=x^2', scope);
    expect(a.kind).toBe('func');
    expect(a.functionName).toBe('f');
    expect(scope.funcs.get('f')?.params).toEqual(['x']);
    expect(at(a, scope, 4)).toBe(16);
  });

  it('feeds the plot coordinate into whatever the single parameter is called', () => {
    const scope = createScope();
    const a = analyze('f(t)=2t', scope);
    expect(at(a, scope, 3)).toBe(6);
  });

  it('binds a multi-parameter function but does not draw it', () => {
    const scope = createScope();
    const a = analyze('g(u,v)=u+v', scope);
    expect(a.kind).toBe('func');
    expect(a.fn).toBeNull();
    expect(scope.funcs.get('g')?.params).toEqual(['u', 'v']);
  });

  it('does not register a function whose body fails to parse', () => {
    const scope = createScope();
    expect(analyze('f(x)=sin(', scope).error).toBe(true);
    expect(scope.funcs.has('f')).toBe(false);
  });
});

describe('sliders', () => {
  it('offers a slider for y = <number>, which is also a horizontal line', () => {
    const scope = createScope();
    const a = analyze('y=5', scope);
    expect(a.kind).toBe('y');
    expect(a.sliderKind).toBe('const');
    expect(a.sliderLabel).toBe('y');
    expect(a.value).toBe(5);
  });

  it('offers a slider for x = <number> too', () => {
    const scope = createScope();
    const a = analyze('x=3', scope);
    expect(a.kind).toBe('x');
    expect(a.sliderKind).toBe('const');
  });

  it('offers no slider for the reversed orientation', () => {
    // 5 = y draws the same line but has no control. The asymmetry is the prototype's.
    const scope = createScope();
    const a = analyze('5=y', scope);
    expect(a.kind).toBe('y');
    expect(a.sliderKind).toBeNull();
  });

  it('offers no slider for a non-literal right-hand side', () => {
    const scope = createScope();
    expect(analyze('y=2+3', scope).sliderKind).toBeNull();
  });
});

describe('quirks preserved deliberately', () => {
  it('splits at the first top-level equals only', () => {
    const scope = createScope();
    // a = b = c leaves "b = c" on the right, which does not parse.
    expect(analyze('a=b=c', scope).error).toBe(true);
  });

  it('ignores an equals sign inside brackets when splitting', () => {
    const scope = createScope();
    expect(analyze('f(x)=x', scope).kind).toBe('func');
  });

  it('produces a curve that is never zero for a self-referential equation', () => {
    const scope = createScope();
    const a = analyze('y=y+1', scope);
    expect(a.kind).toBe('implicit');
    expect(at(a, scope, 0, 5)).toBe(-1);
  });
});

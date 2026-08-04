import { describe, expect, it } from 'vitest';
import { parseSource } from '../../src/core/lang/parse.ts';
import { tokenize } from '../../src/core/lang/tokenize.ts';
import { compile } from '../../src/core/eval/compile.ts';
import { asScalar } from '../../src/core/eval/backend.ts';
import { createScope } from '../../src/core/lang/scope.ts';
import { SourceError } from '../../src/core/lang/errors.ts';

/** Evaluate plain source at a point. */
function evaluate(src: string, x = 0, y = 0): number {
  const scope = createScope();
  return asScalar(compile(parseSource(src))({ x, y }, scope));
}

describe('tokenize', () => {
  it('splits a run of letters by longest match against the built-in names', () => {
    const t = tokenize('sinx');
    expect(t.map((k) => k.kind)).toEqual(['builtin', 'variable']);
  });

  it('makes every variable exactly one character', () => {
    // `ab` is a product, never a variable named "ab".
    expect(tokenize('ab').map((k) => k.kind)).toEqual(['variable', 'variable']);
  });

  it('treats e as Eulers number and never as a variable', () => {
    const t = tokenize('e');
    expect(t[0]?.kind).toBe('constant');
    expect(evaluate('e')).toBeCloseTo(Math.E, 12);
  });

  it('matches function names case-insensitively but keeps variables case-sensitive', () => {
    expect(tokenize('SIN(x)')[0]?.kind).toBe('builtin');
    const upper = tokenize('A');
    expect(upper[0]).toMatchObject({ kind: 'variable', name: 'A' });
  });

  it('records a span for every token', () => {
    const t = tokenize('2+x');
    expect(t.map((k) => [k.span.start, k.span.end])).toEqual([[0, 1], [1, 2], [2, 3]]);
  });

  it('rejects a character it has no rule for, with the offending span', () => {
    try {
      tokenize('x $ y');
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(SourceError);
      expect((e as SourceError).code).toBe('unexpected-char');
      expect((e as SourceError).span).toEqual({ start: 2, end: 3 });
    }
  });
});

describe('parse precedence', () => {
  it('multiplies and divides before adding', () => {
    expect(evaluate('2+3*4')).toBe(14);
    expect(evaluate('2-6/3')).toBe(0);
  });

  it('treats juxtaposition as multiplication at the same level as *', () => {
    expect(evaluate('2x', 5)).toBe(10);
    expect(evaluate('xy', 3, 4)).toBe(12);
    expect(evaluate('2(3+4)')).toBe(14);
    // 1/2x is (1/2)*x, not 1/(2x). Implicit multiplication does not bind tighter.
    expect(evaluate('1/2x', 4)).toBe(2);
  });

  it('makes exponentiation right-associative', () => {
    expect(evaluate('2^3^2')).toBe(512);
  });

  it('accepts a signed exponent, because ^ takes a unary right operand', () => {
    expect(evaluate('2^-2')).toBe(0.25);
  });

  it('applies unary minus after exponentiation', () => {
    expect(evaluate('-x^2', 3)).toBe(-9);
  });

  it('folds constants during parsing', () => {
    const node = parseSource('pi');
    expect(node).toMatchObject({ type: 'number', value: Math.PI });
  });
});

describe('parse errors', () => {
  it('requires a bracket after a built-in function', () => {
    expect(() => parseSource('sin x')).toThrow(SourceError);
  });

  it('requires a closing bracket', () => {
    expect(() => parseSource('(1+2')).toThrow(SourceError);
  });

  it('reports trailing input', () => {
    try {
      parseSource('1+2)');
      expect.unreachable('should have thrown');
    } catch (e) {
      expect((e as SourceError).code).toBe('trailing-input');
    }
  });

  it('reports an empty expression as unexpected end of input', () => {
    try {
      parseSource('');
      expect.unreachable('should have thrown');
    } catch (e) {
      expect((e as SourceError).code).toBe('unexpected-eof');
    }
  });

  it('does not recognise arcsinh, matching the prototype', () => {
    // `arcsinh` longest-matches `arcsin` and leaves a stray `h`, which then fails to parse.
    expect(() => parseSource('arcsinh(x)')).toThrow(SourceError);
  });
});

describe('builtin evaluation', () => {
  it('computes the trigonometric family in radians', () => {
    expect(evaluate('sin(0)')).toBe(0);
    expect(evaluate('cos(0)')).toBe(1);
    expect(evaluate('sin(pi/2)')).toBeCloseTo(1, 12);
  });

  it('uses floored modulo, so mod(-1,3) is 2', () => {
    expect(evaluate('mod(-1,3)')).toBe(2);
  });

  it('distinguishes ln from log', () => {
    expect(evaluate('ln(e)')).toBeCloseTo(1, 12);
    expect(evaluate('log(100)')).toBeCloseTo(2, 12);
  });

  it('reports domain violations as NaN rather than throwing', () => {
    // Numeric errors are silent — the curve gets a gap and nothing reaches the user.
    expect(evaluate('sqrt(-1)')).toBeNaN();
  });

  it('leaves division by zero as Infinity for the plotter to discard', () => {
    expect(evaluate('1/0')).toBe(Infinity);
  });
});

describe('scope resolution', () => {
  it('reads an undefined name as NaN', () => {
    expect(evaluate('a')).toBeNaN();
  });

  it('resolves a user variable from the scope', () => {
    const scope = createScope();
    scope.vars.set('a', 7);
    expect(asScalar(compile(parseSource('2a'))({ x: 0, y: 0 }, scope))).toBe(14);
  });

  it('never lets a user variable shadow the plotting coordinate', () => {
    const scope = createScope();
    scope.vars.set('x', 99);
    expect(asScalar(compile(parseSource('x'))({ x: 3, y: 0 }, scope))).toBe(3);
  });

  it('resolves user functions at call time, so forward references work', () => {
    const scope = createScope();
    const call = compile(parseSource('f(2)'));
    // Compiled before the definition exists.
    expect(asScalar(call({ x: 0, y: 0 }, scope))).toBeNaN();
    scope.funcs.set('f', { params: ['t'], body: compile(parseSource('t^2')) });
    expect(asScalar(call({ x: 0, y: 0 }, scope))).toBe(4);
  });

  it('gives a function body no access to the plotting coordinate', () => {
    const scope = createScope();
    scope.funcs.set('f', { params: ['t'], body: compile(parseSource('x+t')) });
    expect(asScalar(compile(parseSource('f(1)'))({ x: 5, y: 0 }, scope))).toBeNaN();
  });

  it('fills missing arguments with NaN', () => {
    const scope = createScope();
    scope.funcs.set('g', { params: ['u', 'v'], body: compile(parseSource('u+v')) });
    expect(asScalar(compile(parseSource('g(1)'))({ x: 0, y: 0 }, scope))).toBeNaN();
    expect(asScalar(compile(parseSource('g(1,2)'))({ x: 0, y: 0 }, scope))).toBe(3);
  });
});

describe('tuples', () => {
  it('evaluates a pair to an array', () => {
    const scope = createScope();
    expect(compile(parseSource('(1,2)'))({ x: 0, y: 0 }, scope)).toEqual([1, 2]);
  });

  it('collapses a single bracketed value rather than making a one-tuple', () => {
    expect(parseSource('(5)')).toMatchObject({ type: 'number', value: 5 });
  });

  it('yields a non-finite scalar when a tuple reaches arithmetic', () => {
    // The prototype relied on JS stringifying the array; NaN is observably the same, because
    // every consumer guards with isFinite.
    expect(evaluate('(1,2)+3')).toBeNaN();
  });
});

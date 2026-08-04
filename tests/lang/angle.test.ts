import { describe, expect, it } from 'vitest';
import { compile } from '../../src/core/eval/compile.ts';
import { asScalar } from '../../src/core/eval/backend.ts';
import { parseSource } from '../../src/core/lang/parse.ts';
import { createScope } from '../../src/core/lang/scope.ts';
import type { Scope } from '../../src/core/lang/scope.ts';

const evaluate = (src: string, scope: Scope, x = 0): number =>
  asScalar(compile(parseSource(src))({ x, y: 0 }, scope));

describe('angle mode', () => {
  it('defaults to radians', () => {
    expect(createScope().angleMode).toBe('radians');
  });

  it('reads the mode at call time, so switching needs no recompile', () => {
    const scope = createScope();
    // Compiled once, under radians.
    const fn = compile(parseSource('sin(x)'));
    expect(asScalar(fn({ x: Math.PI / 2, y: 0 }, scope))).toBeCloseTo(1, 12);

    scope.angleMode = 'degrees';
    // Same closure, new answer.
    expect(asScalar(fn({ x: 90, y: 0 }, scope))).toBeCloseTo(1, 12);
  });

  describe('in degrees', () => {
    const degrees = (): Scope => {
      const s = createScope();
      s.angleMode = 'degrees';
      return s;
    };

    it('converts the argument of the forward trigonometric functions', () => {
      const s = degrees();
      expect(evaluate('sin(0)', s)).toBeCloseTo(0, 12);
      expect(evaluate('sin(30)', s)).toBeCloseTo(0.5, 12);
      expect(evaluate('sin(90)', s)).toBeCloseTo(1, 12);
      expect(evaluate('cos(0)', s)).toBeCloseTo(1, 12);
      expect(evaluate('cos(180)', s)).toBeCloseTo(-1, 12);
      expect(evaluate('tan(45)', s)).toBeCloseTo(1, 12);
    });

    it('converts the reciprocal trigonometric functions too', () => {
      const s = degrees();
      expect(evaluate('sec(60)', s)).toBeCloseTo(2, 12);
      expect(evaluate('csc(30)', s)).toBeCloseTo(2, 12);
      expect(evaluate('cot(45)', s)).toBeCloseTo(1, 12);
    });

    it('returns degrees from the inverse trigonometric functions', () => {
      const s = degrees();
      expect(evaluate('arcsin(1)', s)).toBeCloseTo(90, 12);
      expect(evaluate('arccos(0)', s)).toBeCloseTo(90, 12);
      expect(evaluate('arctan(1)', s)).toBeCloseTo(45, 12);
      // The asin/acos/atan spellings are the same functions.
      expect(evaluate('atan(1)', s)).toBeCloseTo(45, 12);
    });

    it('round-trips through a function and its inverse', () => {
      const s = degrees();
      expect(evaluate('arcsin(sin(37))', s)).toBeCloseTo(37, 10);
    });

    it('leaves the hyperbolic functions alone', () => {
      // sinh takes a real number, not an angle. Converting it would be wrong, and Desmos
      // does not convert it either.
      const s = degrees();
      expect(evaluate('sinh(1)', s)).toBeCloseTo(Math.sinh(1), 12);
      expect(evaluate('cosh(0)', s)).toBeCloseTo(1, 12);
      expect(evaluate('tanh(1)', s)).toBeCloseTo(Math.tanh(1), 12);
    });

    it('leaves non-angle functions alone', () => {
      const s = degrees();
      expect(evaluate('sqrt(9)', s)).toBe(3);
      expect(evaluate('ln(1)', s)).toBe(0);
      expect(evaluate('abs(-90)', s)).toBe(90);
    });

    it('does not rescale pi, which is still the number pi', () => {
      const s = degrees();
      expect(evaluate('pi', s)).toBeCloseTo(Math.PI, 12);
      // So sin(pi) in degree mode is sin of about 3.14 degrees, not zero.
      expect(evaluate('sin(pi)', s)).toBeCloseTo(Math.sin(Math.PI * (Math.PI / 180)), 12);
    });
  });

  it('leaves radians untouched', () => {
    const s = createScope();
    expect(evaluate('sin(pi/2)', s)).toBeCloseTo(1, 12);
    expect(evaluate('arctan(1)', s)).toBeCloseTo(Math.PI / 4, 12);
  });
});

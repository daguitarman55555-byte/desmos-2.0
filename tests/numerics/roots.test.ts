import { describe, expect, it } from 'vitest';
import { bisect, scanRoots } from '../../src/core/numerics/roots.ts';

describe('bisect', () => {
  it('converges to a bracketed root at double precision', () => {
    expect(bisect((t) => t * t - 2, 0, 2)).toBeCloseTo(Math.SQRT2, 15);
  });

  it('works with the bracket in either sign direction', () => {
    expect(bisect((t) => 2 - t * t, 0, 2)).toBeCloseTo(Math.SQRT2, 15);
  });

  it('gives up rather than reporting a garbage location near a pole', () => {
    // 1/t changes sign across zero without having a root there.
    expect(bisect((t) => (t === 0 ? NaN : 1 / t), -1, 1)).toBeNaN();
  });
});

describe('scanRoots', () => {
  it('finds a simple sign change', () => {
    const roots = scanRoots((t) => t - 0.5, 0, 1, 10);
    expect(roots).toHaveLength(1);
    expect(roots[0]).toBeCloseTo(0.5, 12);
  });

  it('finds every root of a polynomial across the window', () => {
    const roots = scanRoots((t) => t * t * t - 3 * t, -5, 5, 1000);
    const sorted = [...roots].sort((a, b) => a - b);
    expect(sorted).toHaveLength(3);
    expect(sorted[0]).toBeCloseTo(-Math.sqrt(3), 9);
    expect(sorted[1]).toBeCloseTo(0, 9);
    expect(sorted[2]).toBeCloseTo(Math.sqrt(3), 9);
  });

  // ── Regression: a root landing exactly on a sample point ───────────────────────────────────
  // When f is decreasing through zero, the sample before the root is positive and the sample at
  // the root is exactly zero, so `(prev < 0) !== (v < 0)` is false and no bracket is detected.
  // The next step is skipped too, because it requires `prev !== 0`. The root vanished entirely.
  it('records a root that lands exactly on a sample point', () => {
    // Samples at -2, -1, 0, 1, 2. The root at 0 is a sample, approached from above.
    const roots = scanRoots((t) => -t, -2, 2, 4);
    expect(roots).toHaveLength(1);
    expect(roots[0]).toBe(0);
  });

  it('records an exact-sample root approached from below as well', () => {
    const roots = scanRoots((t) => t, -2, 2, 4);
    expect(roots).toHaveLength(1);
    expect(roots[0]).toBeCloseTo(0, 12);
  });

  it('does not emit one root per sample across a flat zero stretch', () => {
    // An isolated exact zero counts; a whole interval of them does not.
    expect(scanRoots(() => 0, -1, 1, 20)).toHaveLength(0);
  });

  // ── Regression: phantom roots from floating-point noise ────────────────────────────────────
  // A straight line's second difference is identically zero in exact arithmetic and rattles
  // around ±1e-16 in floating point. Without a noise floor, scanning it reports an inflection at
  // practically every sample, which floods the result list.
  it('suppresses sign flips that are entirely below the noise floor', () => {
    const noise = (t: number): number => (Math.sin(t * 1e6) > 0 ? 1e-15 : -1e-15);
    expect(scanRoots(noise, -10, 10, 500).length).toBeGreaterThan(0);
    expect(scanRoots(noise, -10, 10, 500, 1e-12)).toHaveLength(0);
  });

  it('still finds a genuine root when a noise floor is set', () => {
    expect(scanRoots((t) => t - 0.5, 0, 1, 100, 1e-12)).toHaveLength(1);
  });

  it('ignores brackets where the function is not finite', () => {
    const f = (t: number): number => (t < 0 ? NaN : t - 0.5);
    const roots = scanRoots(f, -1, 1, 100);
    expect(roots).toHaveLength(1);
    expect(roots[0]).toBeCloseTo(0.5, 9);
  });
});

import { describe, expect, it } from 'vitest';
import { analyze } from '../src/core/lang/analyze.ts';
import { createScope } from '../src/core/lang/scope.ts';
import type { Scope } from '../src/core/lang/scope.ts';
import {
  computePointsOfInterest,
  formatCoordinate,
  orientationOf,
} from '../src/core/poi.ts';
import type { POI, POICurve, ScreenMetric } from '../src/core/poi.ts';

/**
 * A cartesian viewport, exactly as graph/ builds one: the same projection arithmetic, so these
 * tests exercise the real culling and de-duplication rather than a stand-in.
 */
function viewport(width: number, height: number, pixelsPerUnit: number) {
  const toPX = (m: number): number => m * pixelsPerUnit + width / 2;
  const toPY = (m: number): number => height / 2 - m * pixelsPerUnit;
  const screen: ScreenMetric = {
    project: (x, y) => [toPX(x), toPY(y)] as const,
    width,
    height,
  };
  return {
    screen,
    /** Sweep range for a y = f(x) curve: left edge to right edge. */
    xRange: [-width / 2 / pixelsPerUnit, width / 2 / pixelsPerUnit] as const,
    /** Sweep range for an x = g(y) curve: bottom edge to top edge. */
    yRange: [-height / 2 / pixelsPerUnit, height / 2 / pixelsPerUnit] as const,
  };
}

function curveOf(latex: string, scope: Scope): POICurve {
  const a = analyze(latex, scope);
  const orientation = orientationOf(a.kind);
  if (!a.fn || !orientation) throw new Error(`${latex} is not a sweepable curve`);
  return { fn: a.fn, orientation };
}

const TOL = 1e-6;

const has = (pois: readonly POI[], x: number, y: number, type?: POI['type']): boolean =>
  pois.some(
    (p) =>
      Math.abs(p.x - x) < TOL && Math.abs(p.y - y) < TOL && (type === undefined || p.type === type),
  );

/** Points of a given type, sorted, for exact-count assertions. */
const ofType = (pois: readonly POI[], type: POI['type']): POI[] =>
  pois.filter((p) => p.type === type).sort((a, b) => a.x - b.x || a.y - b.y);

function poisFor(latex: string, others: readonly string[] = []) {
  const { screen, xRange, yRange } = viewport(1000, 1000, 25);
  const scope = createScope();
  const target = curveOf(latex, scope);
  const rest = others.map((o) => curveOf(o, scope));
  const [a, b] = target.orientation === 'y' ? xRange : yRange;
  return computePointsOfInterest(target, rest, a, b, scope, screen);
}

describe('y = -2x + 4', () => {
  const pois = poisFor('y=-2x+4');

  it('finds the x-intercept at (2, 0)', () => {
    expect(has(pois, 2, 0, 'intercept')).toBe(true);
  });

  it('finds the y-intercept at (0, 4)', () => {
    expect(has(pois, 0, 4, 'intercept')).toBe(true);
  });

  // ── Regression: a straight line's second difference is identically zero ───────────────────
  // Floating-point noise made it flip sign at almost every sample, so the inflection scan
  // emitted hundreds of phantom points, which then pushed the genuine intersections past the
  // 80-point cap and out of the result.
  it('reports no inflections at all', () => {
    expect(ofType(pois, 'inflection')).toHaveLength(0);
  });

  it('reports no extrema', () => {
    expect(ofType(pois, 'extremum')).toHaveLength(0);
  });

  it('stays comfortably under the point cap', () => {
    expect(pois.length).toBeLessThan(10);
  });
});

describe('y = x^2 - 4', () => {
  const pois = poisFor('y=x^2-4');

  it('finds both x-intercepts', () => {
    expect(has(pois, -2, 0, 'intercept')).toBe(true);
    expect(has(pois, 2, 0, 'intercept')).toBe(true);
  });

  it('finds the minimum at (0, -4)', () => {
    expect(has(pois, 0, -4)).toBe(true);
  });

  it('labels that minimum as the y-intercept, because the two coincide', () => {
    // The vertex of this parabola sits exactly on the y-axis. Intercepts are scanned before
    // extrema and de-duplication is first-wins, so the shared point keeps the earlier label.
    // Desmos behaves the same way; do not "fix" this by re-typing the point.
    expect(has(pois, 0, -4, 'intercept')).toBe(true);
    expect(ofType(pois, 'extremum')).toHaveLength(0);
  });

  it('finds nothing beyond the two roots and the vertex', () => {
    expect(pois).toHaveLength(3);
  });

  it('reports no inflections on a parabola', () => {
    expect(ofType(pois, 'inflection')).toHaveLength(0);
  });
});

describe('y = x^3 - 3x', () => {
  const pois = poisFor('y=x^3-3x');

  it('finds all three intercepts', () => {
    expect(has(pois, -Math.sqrt(3), 0, 'intercept')).toBe(true);
    expect(has(pois, Math.sqrt(3), 0, 'intercept')).toBe(true);
  });

  // ── Regression: a root landing exactly on a sample point ─────────────────────────────────
  // At the default framing the sample grid puts a point exactly on x = 0, where the cubic is
  // exactly zero. Approaching from the left the function is positive, so there is no sign
  // change and the root was dropped entirely.
  it('finds the intercept at exactly x = 0, which lands on a sample point', () => {
    expect(has(pois, 0, 0, 'intercept')).toBe(true);
  });

  // ── Regression: finite-difference step size ──────────────────────────────────────────────
  // A one-pixel step put these at ±0.99993 instead of ±1 — small enough to look like a maths
  // bug in the coordinate readout, large enough to fail this assertion.
  it('puts the extrema exactly at (-1, 2) and (1, -2)', () => {
    expect(has(pois, -1, 2, 'extremum')).toBe(true);
    expect(has(pois, 1, -2, 'extremum')).toBe(true);
  });

  it('finds exactly two extrema', () => {
    expect(ofType(pois, 'extremum')).toHaveLength(2);
  });

  it('folds the inflection into the intercept already at the origin', () => {
    // Same coincidence as the parabola's vertex: the cubic's inflection is its middle root.
    expect(has(pois, 0, 0, 'intercept')).toBe(true);
    expect(ofType(pois, 'inflection')).toHaveLength(0);
  });
});

describe('cos(y) = x', () => {
  const pois = poisFor('cos(y)=x');

  it('is swept vertically', () => {
    const scope = createScope();
    expect(curveOf('cos(y)=x', scope).orientation).toBe('x');
  });

  it('finds the y-axis crossings at ±π/2 and ±3π/2', () => {
    for (const y of [Math.PI / 2, -Math.PI / 2, (3 * Math.PI) / 2, (-3 * Math.PI) / 2]) {
      expect(has(pois, 0, y, 'intercept')).toBe(true);
    }
  });

  it('finds the extrema at (-1, ±π)', () => {
    expect(has(pois, -1, Math.PI, 'extremum')).toBe(true);
    expect(has(pois, -1, -Math.PI, 'extremum')).toBe(true);
  });
});

describe('intersections', () => {
  const pois = poisFor('y=-2x+4', ['y=x^2+1']);

  it('finds both intersections of the line with the parabola', () => {
    expect(has(pois, 1, 2, 'intersection')).toBe(true);
    expect(has(pois, -3, 10, 'intersection')).toBe(true);
  });

  it('finds exactly two', () => {
    expect(ofType(pois, 'intersection')).toHaveLength(2);
  });
});

describe('culling and de-duplication', () => {
  it('drops points outside the viewport', () => {
    // The parabola's minimum sits far below a short window.
    const { screen, xRange } = viewport(1000, 100, 25);
    const scope = createScope();
    const target = curveOf('y=x^2-40', scope);
    const pois = computePointsOfInterest(target, [], xRange[0], xRange[1], scope, screen);
    expect(pois.every((p) => p.y > -10)).toBe(true);
  });

  it('never returns more than the cap', () => {
    const pois = poisFor('y=sin(20x)');
    expect(pois.length).toBeLessThanOrEqual(80);
  });

  it('collapses points that land on the same pixel', () => {
    const pois = poisFor('y=x^3-3x');
    const { screen } = viewport(1000, 1000, 25);
    const seen = pois.map((p) => screen.project(p.x, p.y));
    for (let i = 0; i < seen.length; i++) {
      for (let j = i + 1; j < seen.length; j++) {
        const close =
          Math.abs((seen[i] as readonly number[])[0]! - (seen[j] as readonly number[])[0]!) < 4 &&
          Math.abs((seen[i] as readonly number[])[1]! - (seen[j] as readonly number[])[1]!) < 4;
        expect(close).toBe(false);
      }
    }
  });
});

describe('formatCoordinate', () => {
  it('recognises simple multiples of π', () => {
    expect(formatCoordinate(Math.PI)).toBe('π');
    expect(formatCoordinate(-Math.PI)).toBe('-π');
    expect(formatCoordinate(Math.PI / 2)).toBe('π/2');
    expect(formatCoordinate((3 * Math.PI) / 2)).toBe('3π/2');
    expect(formatCoordinate(-Math.PI / 4)).toBe('-π/4');
  });

  it('prints exact integers plainly', () => {
    expect(formatCoordinate(0)).toBe('0');
    expect(formatCoordinate(-2)).toBe('-2');
    expect(formatCoordinate(12)).toBe('12');
  });

  it('snaps a value a hair off an integer', () => {
    expect(formatCoordinate(1.0000000000001)).toBe('1');
  });

  it('falls back to six significant figures', () => {
    expect(formatCoordinate(Math.sqrt(3))).toBe('1.73205');
  });

  it('reports a non-finite coordinate as infinity', () => {
    expect(formatCoordinate(Infinity)).toBe('∞');
  });
});

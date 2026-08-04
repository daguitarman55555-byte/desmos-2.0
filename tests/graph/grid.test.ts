import { describe, expect, it } from 'vitest';
import { GRID_TARGET_PX, formatTick, gridSteps, isMajorLine, ticksBetween } from '../../src/graph/grid.ts';

/** Is v of the form 1, 2 or 5 times a power of ten? */
function isOneTwoFive(v: number): boolean {
  const magnitude = Math.pow(10, Math.round(Math.log10(v / 5) * 0 + Math.floor(Math.log10(v))));
  const normalised = v / magnitude;
  return [1, 2, 5, 10].some((m) => Math.abs(normalised - m) < 1e-9);
}

describe('gridSteps', () => {
  it('puts the labelled step on 1-2-5 times a power of ten, at every scale', () => {
    for (let ppu = 0.001; ppu < 1e6; ppu *= 1.07) {
      expect(isOneTwoFive(gridSteps(ppu).major)).toBe(true);
    }
  });

  it('always subdivides the minor grid into quarters', () => {
    for (let ppu = 0.001; ppu < 1e6; ppu *= 1.07) {
      const { major, minor } = gridSteps(ppu);
      expect(minor).toBeCloseTo(major / 4, 12);
    }
  });

  it('keeps labelled lines near the 104 css pixel target', () => {
    // The 1-2-5 sequence cannot hit the target exactly; it can always get within a factor of
    // two either way, and it should never be worse than that.
    for (let ppu = 0.001; ppu < 1e6; ppu *= 1.07) {
      const spacing = gridSteps(ppu).major * ppu;
      expect(spacing).toBeGreaterThan(GRID_TARGET_PX / 2.1);
      expect(spacing).toBeLessThan(GRID_TARGET_PX * 2.1);
    }
  });

  it('chooses the documented step at the default framing', () => {
    // Default view is x in [-10, 10], so ppu is width / 20. At 1000 css px wide that is 50.
    expect(gridSteps(50)).toEqual({ major: 2, minor: 0.5 });
  });

  it('switches step at the documented thresholds', () => {
    expect(gridSteps(GRID_TARGET_PX / 1).major).toBe(1);       // raw 1   -> 1
    expect(gridSteps(GRID_TARGET_PX / 1.4).major).toBe(1);     // raw 1.4 -> 1
    expect(gridSteps(GRID_TARGET_PX / 1.6).major).toBe(2);     // raw 1.6 -> 2
    expect(gridSteps(GRID_TARGET_PX / 3).major).toBe(2);       // raw 3   -> 2
    expect(gridSteps(GRID_TARGET_PX / 4).major).toBe(5);       // raw 4   -> 5
    expect(gridSteps(GRID_TARGET_PX / 7).major).toBe(5);       // raw 7   -> 5
    expect(gridSteps(GRID_TARGET_PX / 8).major).toBe(10);      // raw 8   -> 10
  });

  it('scales by powers of ten', () => {
    expect(gridSteps(GRID_TARGET_PX / 10).major).toBe(10);
    expect(gridSteps(GRID_TARGET_PX / 100).major).toBe(100);
    expect(gridSteps(GRID_TARGET_PX * 10).major).toBeCloseTo(0.1, 12);
  });
});

describe('formatTick', () => {
  it('labels zero plainly', () => {
    expect(formatTick(0, 2)).toBe('0');
  });

  it('shows integers without a decimal point', () => {
    expect(formatTick(4, 2)).toBe('4');
    expect(formatTick(-6, 2)).toBe('-6');
  });

  it('shows as many decimals as the step warrants, with no trailing zeros', () => {
    expect(formatTick(1.5, 0.5)).toBe('1.5');
    expect(formatTick(0.25, 0.25)).toBe('0.25');
    expect(formatTick(1, 0.5)).toBe('1');
  });

  it('falls back to exponential notation at the extremes', () => {
    expect(formatTick(2e6, 1e6)).toBe('2.0e+6');
    expect(formatTick(1e-5, 1e-5)).toBe('1.0e-5');
  });
});

describe('ticksBetween', () => {
  it('covers the range inclusively', () => {
    expect(ticksBetween(-4, 4, 2, 1e-9)).toEqual([-4, -2, 0, 2, 4]);
  });

  it('starts at the first multiple inside the range', () => {
    expect(ticksBetween(-3, 3, 2, 1e-9)).toEqual([-2, 0, 2]);
  });
});

describe('isMajorLine', () => {
  it('identifies minor lines that a major line already covers', () => {
    const { major, minor } = gridSteps(50);
    expect(isMajorLine(2, major)).toBe(true);
    expect(isMajorLine(minor, major)).toBe(false);
    expect(isMajorLine(4 * minor, major)).toBe(true);
  });
});

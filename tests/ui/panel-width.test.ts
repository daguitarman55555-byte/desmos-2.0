// The expression panel's width is a function of the window, not a constant.
//
// Every expectation below was produced by calling Desmos's own `getExpListWidth()` in a live,
// extension-free browser with `layoutMeasurements` set to the stated size — so these are not
// re-derivations of our formula, they are the values Desmos actually returns.

import { describe, expect, it } from 'vitest';
import {
  PANEL_MAX_WIDTH,
  PANEL_MIN_WIDTH,
  expressionPanelWidth,
} from '../../src/ui/shell.ts';

/** Tall enough that the square-graph snap never binds, so these isolate the formula. */
const TALL = 4000;

describe('expressionPanelWidth', () => {
  it('scales with the window between its two clamps', () => {
    expect(expressionPanelWidth(1024, TALL)).toBeCloseTo(364.8, 6);
    expect(expressionPanelWidth(1280, TALL)).toBe(416);
    expect(expressionPanelWidth(1366, TALL)).toBeCloseTo(433.2, 6);
    expect(expressionPanelWidth(1440, TALL)).toBe(448);
    expect(expressionPanelWidth(1600, TALL)).toBe(480);
  });

  it('is exactly 0.2w + 160 while unclamped', () => {
    for (const w of [900, 1100, 1280, 1500, 1700]) {
      expect(expressionPanelWidth(w, TALL)).toBeCloseTo(0.2 * w + 160, 6);
    }
  });

  it('clamps to 320 on narrow windows and 500 on wide ones', () => {
    expect(expressionPanelWidth(600, TALL)).toBe(PANEL_MIN_WIDTH);
    expect(expressionPanelWidth(800, TALL)).toBe(PANEL_MIN_WIDTH);
    expect(expressionPanelWidth(1920, TALL)).toBe(PANEL_MAX_WIDTH);
    expect(expressionPanelWidth(2560, TALL)).toBe(PANEL_MAX_WIDTH);
  });

  it('falls back to the minimum before the first measurement', () => {
    expect(expressionPanelWidth(0, 0)).toBe(PANEL_MIN_WIDTH);
  });

  // Desmos nudges the panel so the graph lands exactly square when it is already close. At
  // 1280x860 the plain formula gives 416, but Desmos returns 420 — leaving an 860x860 graph.
  describe('the square-graph snap', () => {
    it('snaps when the graph is within 10px of square', () => {
      expect(expressionPanelWidth(1280, 860)).toBe(420);
      expect(expressionPanelWidth(1280, 864)).toBe(416);
      expect(expressionPanelWidth(1440, 992)).toBe(448);
    });

    it('leaves the formula alone when the graph is nowhere near square', () => {
      expect(expressionPanelWidth(1280, 720)).toBe(416);
      expect(expressionPanelWidth(1440, 900)).toBe(448);
    });
  });

  describe('a dragged divider', () => {
    it('is kept, not recomputed', () => {
      expect(expressionPanelWidth(1440, TALL, 380)).toBe(380);
    });

    it('still cannot go below the minimum', () => {
      expect(expressionPanelWidth(1440, TALL, 100)).toBe(PANEL_MIN_WIDTH);
    });

    it('always leaves the graph 200px', () => {
      expect(expressionPanelWidth(1000, TALL, 950)).toBe(800);
    });

    // A dragged width may exceed the 500px cap the formula obeys — that ceiling is only on the
    // automatic width, which is why the drag clamp is written against the window instead.
    it('may exceed the automatic maximum', () => {
      expect(expressionPanelWidth(1600, TALL, 700)).toBe(700);
    });
  });
});

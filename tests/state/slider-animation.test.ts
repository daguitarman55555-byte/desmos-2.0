// Slider animation stepping.
//
// Every expected number here is worked out by hand from the spec read out of Desmos's bundle,
// not captured from a run. If one of these fails the maths changed, not the formatting.
//
// One thing to hold on to while reading them: the frame gap is clamped to a *tenth of the
// period* before it is applied, so on the default 4000 ms slider no single frame can ever move
// more than 400 ms worth — a tenth of the range, 2 units. Most of the numbers below are that 2.

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ANIMATION_PERIOD,
  createExpression,
  nextLoopMode,
  quantiseSlider,
  sliderDecimals,
  sliderStepSize,
  stepSlider,
} from '../../src/state/document.ts';
import type { LoopMode, PlayDirection, SliderBounds } from '../../src/state/document.ts';

const bounds = (patch: Partial<SliderBounds> = {}): SliderBounds => ({
  min: -10,
  max: 10,
  step: '',
  loopMode: 'LOOP_FORWARD_REVERSE',
  animationPeriod: DEFAULT_ANIMATION_PERIOD,
  ...patch,
});

const at = (target: number, direction: PlayDirection = 1): { target: number; direction: PlayDirection } =>
  ({ target, direction });

/** The longest frame the clamp will honour on a default slider: a tenth of 4000 ms. */
const FRAME = 400;

describe('slider defaults', () => {
  it('matches Desmos: -10 to 10, no step, a 4000ms bouncing sweep', () => {
    const e = createExpression(1);
    expect([e.min, e.max, e.step]).toEqual([-10, 10, '']);
    expect(e.playing).toBe(false);
    expect(e.playDirection).toBe(1);
    expect(e.loopMode).toBe('LOOP_FORWARD_REVERSE');
    expect(e.animationPeriod).toBe(4000);
  });
});

describe('nextLoopMode', () => {
  it('cycles the three modes the button offers, and never reaches the fourth', () => {
    const seen: LoopMode[] = [];
    let mode: LoopMode = 'LOOP_FORWARD_REVERSE';
    for (let i = 0; i < 3; i++) {
      mode = nextLoopMode(mode);
      seen.push(mode);
    }
    expect(seen).toEqual(['LOOP_FORWARD', 'PLAY_ONCE', 'LOOP_FORWARD_REVERSE']);
  });

  it('brings a slider out of PLAY_INDEFINITELY into the cycle', () => {
    expect(nextLoopMode('PLAY_INDEFINITELY')).toBe('LOOP_FORWARD_REVERSE');
  });
});

describe('sliderStepSize', () => {
  it('reads a positive number and rejects everything else', () => {
    expect(sliderStepSize('0.5')).toBe(0.5);
    expect(sliderStepSize('')).toBe(0);
    expect(sliderStepSize('0')).toBe(0);
    expect(sliderStepSize('-1')).toBe(0);
    expect(sliderStepSize('abc')).toBe(0);
  });
});

describe('sliderDecimals', () => {
  it('gives the default range two places, the same as the drag handle', () => {
    expect(sliderDecimals(bounds())).toBe(2);
  });

  it('gives a tiny range enough places to move at all', () => {
    expect(sliderDecimals(bounds({ min: 0, max: 0.01 }))).toBe(5);
  });

  it('takes its precision from the step when there is one', () => {
    // Two places would quietly destroy a 0.001 step on the default range.
    expect(sliderDecimals(bounds({ step: '0.001' }))).toBe(3);
    expect(sliderDecimals(bounds({ step: '0.5' }))).toBe(1);
    expect(sliderDecimals(bounds({ step: '2' }))).toBe(0);
  });
});

describe('quantiseSlider', () => {
  it('leaves a value alone when there is no step', () => {
    expect(quantiseSlider(3.14159, bounds())).toBe(3.14);
  });

  it('snaps to a multiple of the step, without float dust', () => {
    expect(quantiseSlider(3.2, bounds({ step: '0.5' }))).toBe(3);
    expect(quantiseSlider(3.3, bounds({ step: '0.1' }))).toBe(3.3);
    expect(quantiseSlider(0.30000000000000004, bounds({ step: '0.1' }))).toBe(0.3);
  });

  it('holds a half-step overshoot inside the bounds', () => {
    // The target is allowed out to 10.5 so that 10 gets a full dwell; the value must not follow.
    expect(quantiseSlider(10.5, bounds({ step: '1' }))).toBe(10);
    expect(quantiseSlider(-10.5, bounds({ step: '1' }))).toBe(-10);
  });
});

describe('stepSlider — the sweep', () => {
  it('covers the whole range in one period', () => {
    // Ten 400ms frames are 4000ms, and 4000ms is one full -10 -> 10 sweep.
    let motion = at(-10);
    for (let i = 0; i < 10; i++) {
      const next = stepSlider(bounds(), motion, FRAME);
      motion = at(next.target, next.direction);
    }
    expect(motion.target).toBe(10);
  });

  it('moves a tenth of the range in a tenth of the period', () => {
    expect(stepSlider(bounds(), at(0), FRAME).target).toBe(2);
    expect(stepSlider(bounds(), at(0), 200).target).toBe(1);
  });

  it('halving the period doubles the speed', () => {
    expect(stepSlider(bounds(), at(0), 200).target).toBe(1);
    expect(stepSlider(bounds({ animationPeriod: 2000 }), at(0), 200).target).toBe(2);
  });

  it('runs backwards on a negative direction', () => {
    expect(stepSlider(bounds(), at(0, -1), FRAME).target).toBe(-2);
  });

  it('clamps a long frame gap to a tenth of the period rather than teleporting', () => {
    // A 5s stall would otherwise jump 25 units, more than the whole range. It moves 400ms worth
    // instead, so the animation goes slow-motion rather than skipping values.
    expect(stepSlider(bounds(), at(0), 5000).target).toBe(2);
    expect(stepSlider(bounds(), at(0), 5000).target).toBe(stepSlider(bounds(), at(0), FRAME).target);
  });

  it('falls back to the default period if one is missing', () => {
    expect(stepSlider(bounds({ animationPeriod: 0 }), at(0), FRAME).target).toBe(2);
  });
});

describe('stepSlider — LOOP_FORWARD_REVERSE', () => {
  it('turns round at the top', () => {
    const next = stepSlider(bounds(), at(9), FRAME);
    expect(next.target).toBe(10);
    expect(next.direction).toBe(-1);
    expect(next.value).toBe(10);
    expect(next.playing).toBe(true);
  });

  it('turns round at the bottom', () => {
    const next = stepSlider(bounds(), at(-9, -1), FRAME);
    expect([next.target, next.direction]).toEqual([-10, 1]);
  });

  it('overshoots by half a step, so the extreme value gets a full dwell', () => {
    const next = stepSlider(bounds({ step: '1' }), at(9.9), FRAME);
    expect(next.target).toBe(10.5);
    expect(next.value).toBe(10);
    expect(next.direction).toBe(-1);
  });
});

describe('stepSlider — LOOP_FORWARD', () => {
  const forward = bounds({ loopMode: 'LOOP_FORWARD' });

  it('keeps its direction and wraps back to the start', () => {
    const next = stepSlider(forward, at(9), FRAME);
    expect(next.target).toBe(-10);
    expect(next.direction).toBe(1);
  });

  it('wraps to a half step below the minimum when a step is set', () => {
    const next = stepSlider(bounds({ loopMode: 'LOOP_FORWARD', step: '1' }), at(10.4), FRAME);
    expect(next.target).toBe(-10.5);
    expect(next.value).toBe(-10);
  });

  it('wraps the other way when it is running backwards', () => {
    expect(stepSlider(forward, at(-9, -1), FRAME).target).toBe(10);
  });
});

describe('stepSlider — PLAY_ONCE', () => {
  const once = bounds({ loopMode: 'PLAY_ONCE' });

  it('runs on while there is range left', () => {
    const next = stepSlider(once, at(0), FRAME);
    expect([next.target, next.playing]).toEqual([2, true]);
  });

  it('stops exactly on the maximum, without overshooting it', () => {
    const next = stepSlider(once, at(9), FRAME);
    expect(next.target).toBe(10);
    expect(next.value).toBe(10);
    expect(next.playing).toBe(false);
  });

  it('stops on the minimum when it is running backwards', () => {
    const next = stepSlider(once, at(-9, -1), FRAME);
    expect([next.target, next.playing]).toEqual([-10, false]);
  });
});

describe('stepSlider — PLAY_INDEFINITELY', () => {
  const forever = bounds({ loopMode: 'PLAY_INDEFINITELY' });

  it('steps at a flat rate, one unit per quarter period, ignoring the range', () => {
    // 400ms of a 1000ms quarter-period is 0.4 units, and widening the range does not change it —
    // which is exactly how this mode differs from the other three.
    expect(stepSlider(forever, at(0), FRAME).target).toBe(0.4);
    expect(stepSlider({ ...forever, min: -1000, max: 1000 }, at(0), FRAME).target).toBe(0.4);
  });

  it('runs straight past the maximum, which is the point of the mode', () => {
    const next = stepSlider(forever, at(10), FRAME);
    expect(next.target).toBe(10.4);
    expect(next.value).toBe(10.4);
    expect(next.playing).toBe(true);
  });
});

describe('stepSlider — degenerate bounds', () => {
  it('stops rather than spinning when the range is inverted or empty', () => {
    expect(stepSlider(bounds({ min: 10, max: 10 }), at(10), FRAME).playing).toBe(false);
    expect(stepSlider(bounds({ min: 10, max: -10 }), at(0), FRAME).playing).toBe(false);
    expect(stepSlider(bounds({ min: NaN }), at(0), FRAME).playing).toBe(false);
  });
});

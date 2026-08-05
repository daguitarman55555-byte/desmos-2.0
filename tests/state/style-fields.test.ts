// The style tray's opacity and width/size fields.
//
// The fields hold latex, so what reaches these functions is whatever the document's evaluator
// made of it — a number, or NaN for an empty or unparseable field. Two rules are being pinned:
// an unusable value falls back rather than making the curve disappear, and an opacity outside
// 0..1 draws clamped but still marks the field, because clamping in silence reads as the input
// having been ignored.

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LINE_OPACITY,
  DEFAULT_LINE_WIDTH,
  DEFAULT_POINT_OPACITY,
  DEFAULT_POINT_SIZE,
  createExpression,
  resolveStyleField,
  styleFieldHasError,
} from '../../src/state/document.ts';

describe('style defaults', () => {
  // Each of these is Desmos's own placeholder, read out of its bundle rather than measured.
  it('matches the numbers Desmos shows in the empty fields', () => {
    expect(DEFAULT_LINE_WIDTH).toBe(2.5);
    expect(DEFAULT_POINT_SIZE).toBe(8);
    expect(DEFAULT_LINE_OPACITY).toBe(1);
    expect(DEFAULT_POINT_OPACITY).toBe(1);
  });

  it('starts every field empty, which is how "use the default" is spelled', () => {
    const e = createExpression(1);
    expect([e.lineOpacity, e.lineWidth, e.pointOpacity, e.pointSize]).toEqual(['', '', '', '']);
  });
});

describe('resolveStyleField', () => {
  it('passes a usable number straight through', () => {
    expect(resolveStyleField('thickness', 6, DEFAULT_LINE_WIDTH)).toBe(6);
    expect(resolveStyleField('opacity', 0.4, DEFAULT_LINE_OPACITY)).toBe(0.4);
  });

  it('falls back when the field is empty or did not parse', () => {
    expect(resolveStyleField('thickness', NaN, DEFAULT_LINE_WIDTH)).toBe(2.5);
    expect(resolveStyleField('opacity', NaN, DEFAULT_POINT_OPACITY)).toBe(1);
  });

  it('falls back on an infinity, which 1/0 would otherwise produce', () => {
    expect(resolveStyleField('thickness', Infinity, DEFAULT_LINE_WIDTH)).toBe(2.5);
    expect(resolveStyleField('opacity', -Infinity, DEFAULT_LINE_OPACITY)).toBe(1);
  });

  it('clamps an opacity instead of rejecting it', () => {
    // A slider bound to an opacity should saturate at the ends, not blink the curve out.
    expect(resolveStyleField('opacity', 1.6, DEFAULT_LINE_OPACITY)).toBe(1);
    expect(resolveStyleField('opacity', -0.3, DEFAULT_LINE_OPACITY)).toBe(0);
  });

  it('allows a zero thickness, which is a legitimate way to hide a stroke', () => {
    expect(resolveStyleField('thickness', 0, DEFAULT_LINE_WIDTH)).toBe(0);
  });

  it('falls back on a negative thickness, which has no meaning', () => {
    expect(resolveStyleField('thickness', -2, DEFAULT_LINE_WIDTH)).toBe(2.5);
  });
});

describe('styleFieldHasError', () => {
  it('leaves an empty field unmarked — empty means "default", not "wrong"', () => {
    expect(styleFieldHasError('opacity', '', NaN)).toBe(false);
    expect(styleFieldHasError('thickness', '   ', NaN)).toBe(false);
  });

  it('marks a field whose contents do not evaluate', () => {
    expect(styleFieldHasError('thickness', '\\sqrt{', NaN)).toBe(true);
    expect(styleFieldHasError('opacity', 'q', NaN)).toBe(true);
  });

  it('marks an out-of-range opacity even though it still draws clamped', () => {
    expect(styleFieldHasError('opacity', '2', 2)).toBe(true);
    expect(styleFieldHasError('opacity', '-1', -1)).toBe(true);
    expect(styleFieldHasError('opacity', '0.5', 0.5)).toBe(false);
    expect(styleFieldHasError('opacity', '1', 1)).toBe(false);
    expect(styleFieldHasError('opacity', '0', 0)).toBe(false);
  });

  it('marks a negative thickness and accepts everything from zero up', () => {
    expect(styleFieldHasError('thickness', '-1', -1)).toBe(true);
    expect(styleFieldHasError('thickness', '0', 0)).toBe(false);
    expect(styleFieldHasError('thickness', '40', 40)).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { Store } from '../../src/state/store.ts';
import { DEFAULT_SETTINGS } from '../../src/state/document.ts';
import { asScalar } from '../../src/core/eval/backend.ts';

describe('settings', () => {
  it('starts at Desmos defaults: radians, grid on, arrows off', () => {
    const store = new Store();
    expect(store.settings).toEqual(DEFAULT_SETTINGS);
    expect(store.settings.angleMode).toBe('radians');
    expect(store.settings.showGrid).toBe(true);
    expect(store.settings.showArrows).toBe(false);
  });

  it('patches one field without disturbing the others', () => {
    const store = new Store();
    store.patchSettings({ showArrows: true });
    expect(store.settings.showArrows).toBe(true);
    expect(store.settings.showGrid).toBe(true);
    expect(store.settings.angleMode).toBe('radians');
  });

  it('marks the document dirty', () => {
    const store = new Store();
    expect(store.dirty).toBe(false);
    store.patchSettings({ showGrid: false });
    expect(store.dirty).toBe(true);
  });

  // This is the link between the wrench and the evaluator: the panel patches settings, and the
  // scope is what core/eval reads per call. Without this mirror, switching to degrees would
  // change the checkbox and nothing else.
  it('mirrors angle mode onto the scope the evaluator reads', () => {
    const store = new Store();
    expect(store.scope.angleMode).toBe('radians');
    store.patchSettings({ angleMode: 'degrees' });
    expect(store.scope.angleMode).toBe('degrees');
    store.patchSettings({ angleMode: 'radians' });
    expect(store.scope.angleMode).toBe('radians');
  });

  it('changes what an already-compiled expression evaluates to', () => {
    const store = new Store();
    const e = store.append('\\sin\\left(x\\right)');
    store.recompute();
    const fn = store.analyses.get(e.id)?.fn;
    expect(fn).toBeTruthy();

    // Compiled once, under radians.
    expect(asScalar(fn!({ x: 90, y: 0 }, store.scope))).toBeCloseTo(Math.sin(90), 12);

    // Same closure, no recompile — the mode is read at call time.
    store.patchSettings({ angleMode: 'degrees' });
    expect(asScalar(fn!({ x: 90, y: 0 }, store.scope))).toBeCloseTo(1, 12);
  });

  it('carries a pinned axis step through to the drawable options', () => {
    const store = new Store();
    store.patchSettings({ xAxisStep: 2.5, yAxisStep: null });
    expect(store.settings.xAxisStep).toBe(2.5);
    expect(store.settings.yAxisStep).toBeNull();
  });
});

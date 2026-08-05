// Zoom Square, and the axis bookkeeping it depends on.
//
// The rule Desmos follows is not the obvious one: it squares whichever axis the user did *not*
// last edit, so the bound they just typed survives. `getSquareViewport()` in its bundle branches
// on exactly that.

import { beforeEach, describe, expect, it } from 'vitest';
import { Viewport } from '../../src/graph/viewport.ts';

/** A viewport with a real screen, since setBounds is a no-op without one. */
function view(): Viewport {
  const v = new Viewport();
  v.width = 800;
  v.height = 600;
  v.fit();
  return v;
}

describe('Viewport.axesSquare', () => {
  it('starts square, because fit() gives both axes one scale', () => {
    expect(view().axesSquare).toBe(true);
  });

  it('goes non-square as soon as one axis is given its own range', () => {
    const v = view();
    v.setBounds({ ymin: -1, ymax: 1 });
    expect(v.axesSquare).toBe(false);
  });

  it('survives a zoom, which moves both axes together', () => {
    const v = view();
    v.zoomBy(1.35);
    expect(v.axesSquare).toBe(true);
  });
});

describe('Viewport.zoomSquare', () => {
  let v: Viewport;
  beforeEach(() => {
    v = view();
  });

  it('leaves an already-square viewport untouched', () => {
    const { ppuX, ppuY, cx, cy } = v;
    v.zoomSquare();
    expect([v.ppuX, v.ppuY, v.cx, v.cy]).toEqual([ppuX, ppuY, cx, cy]);
  });

  it('keeps the axis just edited and gives way on the other', () => {
    // Editing y last means y is the one the user meant, so x moves to match it.
    v.setBounds({ ymin: -1, ymax: 1 });
    const keptY = v.ppuY;
    v.zoomSquare();
    expect(v.ppuY).toBe(keptY);
    expect(v.ppuX).toBe(keptY);
  });

  it('squares y against x when x was the axis last edited', () => {
    v.setBounds({ xmin: -100, xmax: 100 });
    const keptX = v.ppuX;
    v.zoomSquare();
    expect(v.ppuX).toBe(keptX);
    expect(v.ppuY).toBe(keptX);
  });

  it('adjusts y by default, when no axis has been edited at all', () => {
    v.ppuY = v.ppuX * 3;
    const keptX = v.ppuX;
    v.zoomSquare();
    expect(v.ppuX).toBe(keptX);
    expect(v.ppuY).toBe(keptX);
  });

  it('does not move the centre', () => {
    v.setBounds({ xmin: 2, xmax: 12, ymin: -1, ymax: 1 });
    const { cx, cy } = v;
    v.zoomSquare();
    expect([v.cx, v.cy]).toEqual([cx, cy]);
    expect(v.axesSquare).toBe(true);
  });

  it('is idempotent', () => {
    v.setBounds({ ymin: -1, ymax: 1 });
    v.zoomSquare();
    const { ppuX, ppuY } = v;
    v.zoomSquare();
    expect([v.ppuX, v.ppuY]).toEqual([ppuX, ppuY]);
  });
});

describe('Viewport.lastChangedAxis', () => {
  it('is unset until a bound is edited', () => {
    expect(view().lastChangedAxis).toBeNull();
  });

  it('records only the axis actually named in the patch', () => {
    const v = view();
    v.setBounds({ xmin: -5, xmax: 5 });
    expect(v.lastChangedAxis).toBe('x');
    v.setBounds({ ymax: 3 });
    expect(v.lastChangedAxis).toBe('y');
  });

  it('is cleared by going home', () => {
    const v = view();
    v.setBounds({ ymin: -1, ymax: 1 });
    v.resetToDefault();
    expect(v.lastChangedAxis).toBeNull();
    expect(v.axesSquare).toBe(true);
  });
});

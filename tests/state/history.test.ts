// Undo/redo, and specifically what a snapshot is allowed to forget.
//
// Restoring rebuilds every expression from scratch, so anything `snapshotOf` leaves out reverts
// to its default the moment the user undoes anything at all. Line and point styles used to be
// left out, which meant a single undo silently reset the styling of every row in the document.

import { describe, expect, it } from 'vitest';
import { History, snapshotOf } from '../../src/state/history.ts';
import { createExpression } from '../../src/state/document.ts';
import type { Expression } from '../../src/state/document.ts';

function styled(): Expression {
  const e = createExpression(1, 'y=x^2');
  e.colour = '#fa7e19';
  e.visible = false;
  e.lines = false;
  e.points = true;
  e.lineStyle = 'DASHED';
  e.pointStyle = 'STAR';
  e.lineWidth = 4;
  e.pointSize = 12;
  e.min = -3;
  e.max = 7;
  e.val = 2;
  e.playing = true;
  e.playDirection = -1;
  e.loopMode = 'PLAY_ONCE';
  e.animationPeriod = 2000;
  return e;
}

describe('snapshotOf', () => {
  it('carries every field the style tray and the animation controls can write', () => {
    const [snap] = snapshotOf([styled()]);
    expect(snap).toEqual({
      latex: 'y=x^2',
      colour: '#fa7e19',
      visible: false,
      lines: false,
      points: true,
      lineStyle: 'DASHED',
      pointStyle: 'STAR',
      lineWidth: 4,
      pointSize: 12,
      min: -3,
      max: 7,
      val: 2,
      playing: true,
      playDirection: -1,
      loopMode: 'PLAY_ONCE',
      animationPeriod: 2000,
    });
  });

  // The guard that matters: if someone adds a styling field to Expression and forgets the
  // snapshot, undo starts quietly discarding it. Comparing key sets catches that.
  it('omits only the fields that are rebuilt on restore', () => {
    const [snap] = snapshotOf([styled()]);
    const rebuilt = new Set(['id', 'step']);
    const missing = Object.keys(styled()).filter(
      (k) => !(k in (snap as object)) && !rebuilt.has(k),
    );
    expect(missing).toEqual([]);
  });
});

describe('History', () => {
  it('starts with nothing to undo or redo', () => {
    const h = new History();
    expect([h.canUndo, h.canRedo]).toEqual([false, false]);
    expect(h.undo()).toBeNull();
    expect(h.redo()).toBeNull();
  });

  it('walks back and forward through pushed states', () => {
    const h = new History();
    const a = snapshotOf([createExpression(1, 'a')]);
    const b = snapshotOf([createExpression(1, 'b')]);
    h.push(a);
    h.push(b);

    expect(h.canUndo).toBe(true);
    expect(h.undo()).toEqual(a);
    expect(h.canRedo).toBe(true);
    expect(h.redo()).toEqual(b);
  });

  it('ignores a push identical to the current state', () => {
    const h = new History();
    const a = snapshotOf([createExpression(1, 'a')]);
    h.push(a);
    h.push(snapshotOf([createExpression(1, 'a')]));
    expect(h.canUndo).toBe(false);
  });

  it('a style change alone is a distinct state, so it can be undone', () => {
    const h = new History();
    const plain = createExpression(1, 'y=x');
    h.push(snapshotOf([plain]));
    const dashed = createExpression(1, 'y=x');
    dashed.lineStyle = 'DASHED';
    h.push(snapshotOf([dashed]));

    expect(h.canUndo).toBe(true);
    expect(h.undo()?.[0]?.lineStyle).toBe('SOLID');
  });

  it('forks the timeline, discarding anything ahead of the cursor', () => {
    const h = new History();
    h.push(snapshotOf([createExpression(1, 'a')]));
    h.push(snapshotOf([createExpression(1, 'b')]));
    h.undo();
    h.push(snapshotOf([createExpression(1, 'c')]));

    expect(h.canRedo).toBe(false);
    expect(h.undo()?.[0]?.latex).toBe('a');
  });
});

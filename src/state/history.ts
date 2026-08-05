// Undo / redo.
//
// Snapshots are debounced so a burst of keystrokes collapses into one step rather than making
// undo walk back a character at a time. The same position drives the toolbar arrows' enabled
// state, so there is one source of truth for both.

import type { Expression, LineStyle, PointStyle } from './document.ts';

/** Milliseconds of quiet before a snapshot is taken. */
export const SNAPSHOT_DEBOUNCE_MS = 450;

/** Maximum retained steps; the oldest is dropped past this. */
export const HISTORY_CAP = 250;

/**
 * Only the fields that can be edited — ids and derived state are rebuilt on restore.
 *
 * "Edited" has to include everything the style tray writes. Restoring rebuilds each expression
 * from scratch, so any field missing here silently reverts to its default on the next undo —
 * which is exactly what used to happen to line and point styles.
 */
export interface ExpressionSnapshot {
  readonly latex: string;
  readonly colour: string | null;
  readonly min: number;
  readonly max: number;
  readonly val: number;
  readonly visible: boolean;
  readonly lineStyle: LineStyle;
  readonly pointStyle: PointStyle;
  readonly lineWidth: number | null;
  readonly pointSize: number | null;
}

export type Snapshot = readonly ExpressionSnapshot[];

export const snapshotOf = (expressions: readonly Expression[]): Snapshot =>
  expressions.map((e) => ({
    latex: e.latex,
    colour: e.colour,
    min: e.min,
    max: e.max,
    val: e.val,
    visible: e.visible,
    lineStyle: e.lineStyle,
    pointStyle: e.pointStyle,
    lineWidth: e.lineWidth,
    pointSize: e.pointSize,
  }));

export class History {
  private entries: Snapshot[] = [];
  private position = -1;
  private timer: ReturnType<typeof setTimeout> | null = null;

  get canUndo(): boolean {
    return this.position > 0;
  }

  get canRedo(): boolean {
    return this.position >= 0 && this.position < this.entries.length - 1;
  }

  /** Take a snapshot now, unless it is identical to the current one. */
  push(snapshot: Snapshot): void {
    if (this.position >= 0 && JSON.stringify(this.entries[this.position]) === JSON.stringify(snapshot)) {
      return;
    }
    // Anything ahead of the cursor is discarded — a new edit forks the timeline.
    this.entries = this.entries.slice(0, this.position + 1);
    this.entries.push(snapshot);
    if (this.entries.length > HISTORY_CAP) this.entries.shift();
    this.position = this.entries.length - 1;
  }

  /** Take a snapshot once the user stops typing. */
  schedule(take: () => Snapshot): void {
    this.cancel();
    this.timer = setTimeout(() => {
      this.timer = null;
      this.push(take());
    }, SNAPSHOT_DEBOUNCE_MS);
  }

  cancel(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }

  undo(): Snapshot | null {
    if (!this.canUndo) return null;
    this.cancel();
    return this.entries[--this.position] ?? null;
  }

  redo(): Snapshot | null {
    if (!this.canRedo) return null;
    this.cancel();
    return this.entries[++this.position] ?? null;
  }
}

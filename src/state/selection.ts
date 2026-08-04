// What is focused, what is selected, and which points are pinned.
//
// Focus and selection are distinct but coupled: focusing a row selects its curve, which is what
// makes points of interest appear as soon as you click into an expression.

import type { POI } from '../core/poi.ts';

export class Selection {
  /** The expression row holding keyboard focus. */
  focusedId: number | null = null;

  /** The expression whose curve is highlighted and carries points of interest. */
  selectedId: number | null = null;

  /** Points the user has clicked to keep on screen. */
  pins: POI[] = [];

  /** The point under the cursor right now, if any. */
  hover: POI | null = null;

  focus(id: number): void {
    this.focusedId = id;
    this.selectedId = id;
  }

  /** An empty click on the graph clears everything. */
  clear(): void {
    this.selectedId = null;
    this.pins = [];
    this.hover = null;
  }
}

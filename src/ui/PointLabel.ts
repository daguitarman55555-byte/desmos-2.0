// Coordinate labels floating above the canvas.
//
// In the DOM rather than on the canvas so the text stays crisp at any device pixel ratio and can
// carry a real button — the export control that lifts a point into the expression list.

import { exportPointIcon } from './icons.ts';
import { formatCoordinate } from '../core/poi.ts';
import type { POI } from '../core/poi.ts';

/** Offset from the point to the label's corner, in css pixels. */
export const LABEL_OFFSET_X = 14;
export const LABEL_OFFSET_Y = -14;

export interface LabelItem {
  readonly poi: POI;
  /** Pinned labels get the export button; a transient hover label does not. */
  readonly pinned: boolean;
}

export interface PointLabelLayer {
  readonly element: HTMLElement;
  render(
    items: readonly LabelItem[],
    project: (x: number, y: number) => readonly [number, number],
    onExport: (poi: POI) => void,
  ): void;
}

export function createPointLabelLayer(): PointLabelLayer {
  const element = document.createElement('div');
  element.id = 'graph-overlay';

  return {
    element,

    render(items, project, onExport) {
      element.innerHTML = '';

      for (const { poi, pinned } of items) {
        const label = document.createElement('div');
        label.className = 'pt-label';

        const text = document.createElement('span');
        text.textContent = `(${formatCoordinate(poi.x)}, ${formatCoordinate(poi.y)})`;
        label.appendChild(text);

        if (pinned) {
          const button = document.createElement('button');
          button.className = 'pt-export';
          button.title = 'Export point to expression list';
          button.innerHTML = exportPointIcon;
          button.onmousedown = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            onExport(poi);
          };
          label.appendChild(button);
        }

        const [sx, sy] = project(poi.x, poi.y);
        label.style.left = `${sx + LABEL_OFFSET_X}px`;
        label.style.top = `${sy + LABEL_OFFSET_Y}px`;
        element.appendChild(label);
      }
    },
  };
}

/** Hover label is suppressed when a pin already sits on the same point. */
export function labelItems(pins: readonly POI[], hover: POI | null): LabelItem[] {
  const items: LabelItem[] = pins.map((poi) => ({ poi, pinned: true }));
  if (
    hover &&
    !pins.some((q) => Math.abs(q.x - hover.x) < 1e-9 && Math.abs(q.y - hover.y) < 1e-9)
  ) {
    items.push({ poi: hover, pinned: false });
  }
  return items;
}

// The style tray behind an expression's colour disc.
//
// Desmos opens this on a long press of the disc; a plain click toggles visibility instead. Both
// gestures live on the same element, which is why ExpressionRow distinguishes them by how long
// the button is held rather than by which control was hit.
//
// The palette and the style enums are measured — see state/document.ts. What is *not* measured is
// this tray's own spacing: Desmos's tray only opens on a real long press, which the automation
// available here could not drive, so the geometry below is built from the shared popover shell
// and the known 29px disc rather than from a capture. Worth re-measuring by hand.

import { colourSwatch, lineStyleSwatch, pointIcon } from './icons.ts';
import { LINE_STYLES, PALETTE, POINT_STYLES } from '../state/document.ts';
import type { Expression, LineStyle, PointStyle } from '../state/document.ts';

export interface StyleMenuCallbacks {
  onColour(colour: string): void;
  onLineStyle(style: LineStyle): void;
  onPointStyle(style: PointStyle): void;
}

export interface StyleMenu {
  readonly element: HTMLElement;
  readonly isOpen: boolean;
  /** The expression the tray is currently editing, or null. */
  readonly targetId: number | null;
  /** Open anchored beside `anchor`, which must sit inside the tray's positioned ancestor. */
  openFor(expression: Expression, showPointStyles: boolean, anchor: HTMLElement): void;
  close(): void;
  /** Refresh the selected states against the expression it is currently open for. */
  update(expression: Expression): void;
}

function swatchButton(title: string, html: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'sty-swatch';
  b.title = title;
  b.innerHTML = html;
  // mousedown, not click: the row's own mousedown handler would otherwise steal focus first.
  b.addEventListener('mousedown', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    onClick();
  });
  return b;
}

const titleCase = (s: string): string => s.charAt(0) + s.slice(1).toLowerCase();

export function createStyleMenu(callbacks: StyleMenuCallbacks): StyleMenu {
  const element = document.createElement('div');
  element.className = 'popover sty-menu';
  element.hidden = true;

  const colourRow = document.createElement('div');
  colourRow.className = 'sty-row sty-colours';
  const lineRow = document.createElement('div');
  lineRow.className = 'sty-row sty-lines';
  const pointRow = document.createElement('div');
  pointRow.className = 'sty-row sty-points';
  element.append(colourRow, lineRow, pointRow);

  let target: Expression | null = null;
  let open = false;
  let showPoints = false;

  const render = (expression: Expression): void => {
    const colour = expression.colour ?? '#000';

    colourRow.innerHTML = '';
    for (const [name, value] of Object.entries(PALETTE)) {
      colourRow.appendChild(
        swatchButton(
          titleCase(name),
          colourSwatch(value, value.toLowerCase() === colour.toLowerCase()),
          () => callbacks.onColour(value),
        ),
      );
    }

    lineRow.innerHTML = '';
    for (const style of LINE_STYLES) {
      const b = swatchButton(titleCase(style), lineStyleSwatch(style, colour), () =>
        callbacks.onLineStyle(style),
      );
      b.classList.add('sty-line');
      b.classList.toggle('selected', expression.lineStyle === style);
      lineRow.appendChild(b);
    }

    pointRow.hidden = !showPoints;
    pointRow.innerHTML = '';
    if (showPoints) {
      for (const style of POINT_STYLES) {
        const b = swatchButton(titleCase(style), pointIcon(colour, true, style), () =>
          callbacks.onPointStyle(style),
        );
        b.classList.toggle('selected', expression.pointStyle === style);
        pointRow.appendChild(b);
      }
    }
  };

  return {
    element,
    get isOpen() {
      return open;
    },
    get targetId() {
      return target ? target.id : null;
    },

    openFor(expression, showPointStyles, anchor) {
      target = expression;
      showPoints = showPointStyles;
      render(expression);
      element.hidden = false;
      open = true;

      // Position just right of the disc, top-aligned with it, in the tray's own coordinates.
      const parent = element.offsetParent as HTMLElement | null;
      if (parent) {
        const a = anchor.getBoundingClientRect();
        const p = parent.getBoundingClientRect();
        element.style.left = `${a.right - p.left + 6}px`;
        element.style.top = `${a.top - p.top}px`;
      }
    },

    close() {
      open = false;
      target = null;
      element.hidden = true;
    },

    update(expression) {
      if (!open || !target || target.id !== expression.id) return;
      target = expression;
      render(expression);
    },
  };
}

// The style tray behind an expression's colour disc.
//
// Desmos opens this on a long press of the disc; a plain click toggles visibility instead. Both
// gestures live on the same element, which is why ExpressionRow distinguishes them by how long
// the button is held rather than by which control was hit.
//
// The geometry is measured. Desmos will not open its tray under automation — its tap layer
// ignores synthetic pointer events — so rather than eyeball it, the values were read straight
// out of Desmos's own stylesheet in an extension-free browser. That is exact rather than
// approximate, and it turned up three things the previous guess had wrong:
//
//  1. colours are a six-column grid of 30px rounded squares, not one flat row of discs;
//  2. selection is a white tick over the tile, not a ring around it;
//  3. the line and point previews are grey (#949494) and turn accent blue when selected — they
//     are never drawn in the expression's own colour.
//
// Line and point styles are segmented controls built the same way as the settings panel's, but
// in Desmos's "mini" theme. See the --sty-* block in tokens.css for the selectors each value
// came from.

import { checkIcon, lineStyleGlyph, pointStyleGlyph } from './icons.ts';
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

/** Gap between the disc and the tray, in css pixels. */
const ANCHOR_GAP = 6;

function trayButton(className: string, title: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = className;
  b.title = title;
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

  const colourSection = document.createElement('div');
  colourSection.className = 'sty-section';
  const colourGrid = document.createElement('div');
  colourGrid.className = 'sty-colours';
  colourSection.appendChild(colourGrid);

  const lineSection = document.createElement('div');
  lineSection.className = 'sty-section';
  const lineRow = document.createElement('div');
  lineRow.className = 'sty-seg sty-lines';
  lineSection.appendChild(lineRow);

  const pointSection = document.createElement('div');
  pointSection.className = 'sty-section';
  const pointGrid = document.createElement('div');
  pointGrid.className = 'sty-points';
  pointSection.appendChild(pointGrid);

  element.append(colourSection, lineSection, pointSection);

  let target: Expression | null = null;
  let open = false;
  let showPoints = false;

  const render = (expression: Expression): void => {
    const colour = (expression.colour ?? '#000').toLowerCase();

    colourGrid.innerHTML = '';
    for (const [name, value] of Object.entries(PALETTE)) {
      const b = trayButton('sty-tile', titleCase(name), () => callbacks.onColour(value));
      b.style.background = value;
      if (value.toLowerCase() === colour) b.innerHTML = checkIcon;
      colourGrid.appendChild(b);
    }

    lineRow.innerHTML = '';
    for (const style of LINE_STYLES) {
      const b = trayButton('sty-seg-btn', titleCase(style), () => callbacks.onLineStyle(style));
      b.innerHTML = lineStyleGlyph(style);
      b.classList.toggle('selected', expression.lineStyle === style);
      lineRow.appendChild(b);
    }

    pointSection.hidden = !showPoints;
    pointGrid.innerHTML = '';
    if (showPoints) {
      for (const style of POINT_STYLES) {
        const b = trayButton('sty-seg-btn', titleCase(style), () => callbacks.onPointStyle(style));
        b.innerHTML = pointStyleGlyph(style);
        b.classList.toggle('selected', expression.pointStyle === style);
        pointGrid.appendChild(b);
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
        element.style.left = `${a.right - p.left + ANCHOR_GAP}px`;
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

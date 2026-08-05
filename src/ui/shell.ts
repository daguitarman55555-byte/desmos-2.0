// Overall layout: header on top, then the expression panel, a drag handle, and the graph.

import { createGraphPane } from './GraphPane.ts';
import type { GraphPane, GraphPaneCallbacks } from './GraphPane.ts';
import { createHeader } from './Header.ts';
import type { Header } from './Header.ts';
import { createToolbar } from './Toolbar.ts';
import type { Toolbar, ToolbarCallbacks } from './Toolbar.ts';
import { closeIcon, collapseIcon, keypadChevronIcon, keypadIcon, toastMarkIcon } from './icons.ts';

// ── Expression panel width ───────────────────────────────────────────────────────────────────
//
// Desmos's panel is not a fixed width. It is a function of the window, read straight out of its
// own `getExpListWidth()` in the calculator bundle and confirmed against that function across
// thirteen viewport sizes:
//
//     width = clamp(0.2 * containerWidth + 160, 320, 500)
//
// This resolves a contradiction in the project's own notes. `--panel-width: 448px` and a later
// measurement of 416px were *both* right: 448 is the formula's value at a 1440px-wide window,
// 416 its value at 1280. Neither is a constant, and hard-coding either is only correct at one
// window size.

/** Never narrower than this, however the window shrinks or the divider is dragged. */
export const PANEL_MIN_WIDTH = 320;
/** Never wider than this when the width is left to the formula. */
export const PANEL_MAX_WIDTH = 500;
/** The graph always keeps at least this much room when the divider is dragged. */
export const PANEL_DRAG_GUTTER = 200;
/**
 * Below this container width Desmos stops putting the panel beside the graph and stacks it
 * underneath instead. Not implemented — noted so the breakpoint is not rediscovered.
 */
export const PANEL_NARROW_WIDTH = 450;
/**
 * Desmos nudges the panel so the graph comes out exactly square whenever it is already within
 * this many pixels of square. Measured: at 1280x860 the formula gives 416 but Desmos returns 420.
 */
export const PANEL_SQUARE_SNAP = 10;

const clamp = (value: number, low: number, high: number): number =>
  Math.min(high, Math.max(low, value));

/**
 * The width Desmos would give the expression panel.
 *
 * `userWidth` is the width the divider was last dragged to, if it ever was; Desmos remembers it
 * and clamps it against the window rather than recomputing the formula.
 */
export function expressionPanelWidth(
  containerWidth: number,
  containerHeight: number,
  userWidth?: number,
): number {
  if (!containerWidth) return PANEL_MIN_WIDTH;

  const base =
    userWidth === undefined
      ? clamp(0.2 * containerWidth + 160, PANEL_MIN_WIDTH, PANEL_MAX_WIDTH)
      : clamp(userWidth, PANEL_MIN_WIDTH, containerWidth - PANEL_DRAG_GUTTER);

  // The square-graph snap applies to a dragged width too, not just the computed one.
  const square = containerWidth - containerHeight;
  return Math.abs(square - base) <= PANEL_SQUARE_SNAP ? square : base;
}

export interface ShellCallbacks extends ToolbarCallbacks, GraphPaneCallbacks {
  /** Fired when the panel is resized or collapsed, so the canvas can reflow. */
  onLayoutChange(): void;
  /** The show-keypad button in the panel's bottom-left corner. */
  onKeypad(): void;
}

export interface Shell {
  readonly header: Header;
  readonly toolbar: Toolbar;
  readonly panel: HTMLElement;
  readonly graph: GraphPane;
  /** Where the expression list mounts. */
  readonly listHost: HTMLElement;
  /** Spans the panel and the graph; the keypad overlays it. */
  readonly body: HTMLElement;
  /** Hidden while the keypad is open, since the keypad carries its own minimize tab. */
  readonly keypadButton: HTMLElement;
}

export function createShell(root: HTMLElement, callbacks: ShellCallbacks): Shell {
  const app = document.createElement('div');
  app.id = 'app';

  const header = createHeader();
  app.appendChild(header.element);

  const body = document.createElement('div');
  body.id = 'body';

  const panel = document.createElement('div');
  panel.id = 'panel';

  // Collapsing the panel is a state, not just a class, because the panel's width is written
  // inline — an inline width beats any stylesheet rule, so `.collapsed { width: 0 }` alone is
  // silently ignored. `applyPanelWidth` below is the single place that resolves the two.
  let collapsed = false;
  let setCollapsed = (next: boolean): void => {
    collapsed = next;
  };

  const toolbar = createToolbar({
    onAdd: callbacks.onAdd,
    onUndo: callbacks.onUndo,
    onRedo: callbacks.onRedo,
    onCollapse: () => setCollapsed(true),
  });
  panel.appendChild(toolbar.element);

  const listHost = document.createElement('div');
  panel.appendChild(listHost);

  const footer = document.createElement('div');
  footer.id = 'panel-footer';
  footer.innerHTML = 'powered by<span class="pb-word">desmos</span>';
  panel.appendChild(footer);

  const keypadButton = document.createElement('div');
  keypadButton.id = 'keypad-btn';
  keypadButton.title = 'Keypad';
  keypadButton.innerHTML = keypadIcon + keypadChevronIcon;
  keypadButton.addEventListener('mousedown', (ev) => {
    // The focused math field must keep the caret, so the keypad has something to type into.
    ev.preventDefault();
    callbacks.onKeypad();
  });
  // On the body rather than the panel, so collapsing the list does not take the keypad button
  // with it. Desmos's sits over the whole calculator for the same reason.
  body.appendChild(keypadButton);

  const toast = document.createElement('div');
  toast.id = 'login-toast';
  toast.innerHTML =
    toastMarkIcon +
    '<div class="toast-text"><a>Log in</a> or <a>sign up</a> to save your beautiful math!</div>' +
    '<button id="toast-close" title="Dismiss">' + closeIcon + '</button>';
  panel.appendChild(toast);
  (toast.querySelector('#toast-close') as HTMLButtonElement).onclick = () => {
    toast.style.display = 'none';
  };

  body.appendChild(panel);

  const resizer = document.createElement('div');
  resizer.id = 'resizer';
  body.appendChild(resizer);

  const graph = createGraphPane({
    onZoomIn: callbacks.onZoomIn,
    onZoomOut: callbacks.onZoomOut,
    onHome: callbacks.onHome,
    onWrench: callbacks.onWrench,
  });
  body.appendChild(graph.element);

  // The way back. The collapse button lives inside the panel, so it goes with it — Desmos has
  // the same problem and solves it the same way, with a tab over the top-left of the graph.
  const showList = document.createElement('button');
  showList.id = 'show-list-tab';
  showList.type = 'button';
  showList.title = 'Show Expressions List';
  showList.setAttribute('aria-label', 'Show Expressions List');
  showList.innerHTML = collapseIcon;
  showList.hidden = true;
  showList.addEventListener('click', () => setCollapsed(false));
  body.appendChild(showList);

  app.appendChild(body);
  root.appendChild(app);

  // ── Panel width ──────────────────────────────────────────────────────────────────────────
  //
  // The panel tracks the window, as Desmos's does. Once the divider has been dragged that
  // choice sticks and only gets re-clamped against the window, which is also what Desmos does
  // with its `userSpecifiedExpListWidth`.
  let userWidth: number | undefined;

  const applyPanelWidth = (): void => {
    // Collapsed wins. The inline width is what the stylesheet cannot override, so zeroing it
    // here is what actually closes the panel.
    const width = collapsed ? 0 : expressionPanelWidth(body.clientWidth, body.clientHeight, userWidth);
    panel.style.width = `${width}px`;
  };

  setCollapsed = (next: boolean): void => {
    if (next === collapsed) return;
    collapsed = next;
    panel.classList.toggle('collapsed', next);
    showList.hidden = !next;
    applyPanelWidth();
    // The canvas tracks its own box, so one frame later the observer picks up the new size.
    requestAnimationFrame(callbacks.onLayoutChange);
  };

  let dragging = false;
  resizer.addEventListener('mousedown', (ev) => {
    dragging = true;
    ev.preventDefault();
    document.body.style.cursor = 'col-resize';
  });
  window.addEventListener('mousemove', (ev) => {
    if (!dragging) return;
    userWidth = ev.clientX - body.getBoundingClientRect().left;
    applyPanelWidth();
    callbacks.onLayoutChange();
  });
  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.cursor = '';
  });

  // The observer catches reflows the window never hears about; the window listener is the
  // belt to its braces, because a ResizeObserver only delivers once the page has painted and
  // the first pass here can otherwise land before the body has a box at all.
  new ResizeObserver(applyPanelWidth).observe(body);
  window.addEventListener('resize', applyPanelWidth);
  applyPanelWidth();

  return { header, toolbar, panel, graph, listHost, body, keypadButton };
}

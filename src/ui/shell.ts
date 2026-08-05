// Overall layout: header on top, then the expression panel, a drag handle, and the graph.

import { createGraphPane } from './GraphPane.ts';
import type { GraphPane, GraphPaneCallbacks } from './GraphPane.ts';
import { createHeader } from './Header.ts';
import type { Header } from './Header.ts';
import { createToolbar } from './Toolbar.ts';
import type { Toolbar, ToolbarCallbacks } from './Toolbar.ts';
import { closeIcon, keypadChevronIcon, keypadIcon, toastMarkIcon } from './icons.ts';

/** Panel drag limits, matching the CSS min-width and max-width. */
export const PANEL_MIN_WIDTH = 192;
export const PANEL_MAX_FRACTION = 0.68;

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

  const toolbar = createToolbar({
    onAdd: callbacks.onAdd,
    onUndo: callbacks.onUndo,
    onRedo: callbacks.onRedo,
    onCollapse: () => {
      panel.classList.toggle('collapsed');
      // The canvas tracks its own box, so one frame later the observer picks up the new size.
      requestAnimationFrame(callbacks.onLayoutChange);
    },
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
  panel.appendChild(keypadButton);

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

  app.appendChild(body);
  root.appendChild(app);

  // ── Panel resize ─────────────────────────────────────────────────────────────────────────
  let dragging = false;
  resizer.addEventListener('mousedown', (ev) => {
    dragging = true;
    ev.preventDefault();
    document.body.style.cursor = 'col-resize';
  });
  window.addEventListener('mousemove', (ev) => {
    if (!dragging) return;
    const width = Math.max(
      PANEL_MIN_WIDTH,
      Math.min(Math.round(window.innerWidth * PANEL_MAX_FRACTION), ev.clientX),
    );
    panel.style.width = `${width}px`;
  });
  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.cursor = '';
  });

  return { header, toolbar, panel, graph, listHost, body, keypadButton };
}

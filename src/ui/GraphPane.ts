// One graph pane: the canvas, the label overlay above it, the tool buttons, and the dev
// performance readout.

import { createPointLabelLayer } from './PointLabel.ts';
import type { PointLabelLayer } from './PointLabel.ts';
import { homeIcon, wrenchIcon, zoomInIcon, zoomOutIcon } from './icons.ts';
import type { FrameTimings } from '../graph/renderer.ts';

/** Provisional budget from docs/CLAUDE.md, to be reset from real measurements. */
export const FRAME_BUDGET_MS = 16;

export interface GraphPaneCallbacks {
  onZoomIn(): void;
  onZoomOut(): void;
  onHome(): void;
  onWrench(): void;
}

export interface GraphPane {
  readonly element: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  readonly labels: PointLabelLayer;
  /** The home button only exists once the view has left the default framing. */
  setHomeVisible(visible: boolean): void;
  /** Popovers anchored inside the pane, such as the settings panel. */
  mountOverlay(el: HTMLElement): void;
  showPerf(visible: boolean): void;
  updatePerf(timings: FrameTimings, recomputeMs: number): void;
}

export function createGraphPane(callbacks: GraphPaneCallbacks): GraphPane {
  const element = document.createElement('div');
  element.id = 'graph-wrap';

  const canvas = document.createElement('canvas');
  canvas.id = 'graph';
  element.appendChild(canvas);

  const labels = createPointLabelLayer();
  element.appendChild(labels.element);

  const tools = document.createElement('div');
  tools.id = 'graph-tools';
  tools.innerHTML = `
    <button class="gbtn" id="wrench-btn" title="Graph Settings">${wrenchIcon}</button>
    <div class="zoom-group">
      <button class="gbtn" id="zoom-in" title="Zoom In">${zoomInIcon}</button>
      <button class="gbtn" id="zoom-out" title="Zoom Out">${zoomOutIcon}</button>
      <button class="gbtn" id="home-btn" title="Default Viewport" hidden>${homeIcon}</button>
    </div>`;
  element.appendChild(tools);

  const perf = document.createElement('div');
  perf.id = 'perf-overlay';
  perf.hidden = true;
  element.appendChild(perf);

  const home = tools.querySelector('#home-btn') as HTMLButtonElement;
  (tools.querySelector('#zoom-in') as HTMLButtonElement).onclick = callbacks.onZoomIn;
  (tools.querySelector('#zoom-out') as HTMLButtonElement).onclick = callbacks.onZoomOut;
  home.onclick = callbacks.onHome;
  (tools.querySelector('#wrench-btn') as HTMLButtonElement).onclick = callbacks.onWrench;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas context unavailable');

  return {
    element,
    canvas,
    context,
    labels,

    setHomeVisible(visible) {
      home.hidden = !visible;
    },

    mountOverlay(el) {
      element.appendChild(el);
    },

    showPerf(visible) {
      perf.hidden = !visible;
    },

    updatePerf(timings, recomputeMs) {
      const total = recomputeMs + timings.plotMs + timings.drawMs;
      const over = total > FRAME_BUDGET_MS ? ' class="over"' : '';
      const ms = (v: number): string => v.toFixed(2).padStart(6);
      perf.innerHTML =
        `recompute ${ms(recomputeMs)} ms\n` +
        `plot      ${ms(timings.plotMs)} ms\n` +
        `draw      ${ms(timings.drawMs)} ms\n` +
        `<span${over}>total     ${ms(total)} ms</span>`;
    },
  };
}

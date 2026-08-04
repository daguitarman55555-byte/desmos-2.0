// Grid lines, axis lines, arrows and tick labels.
//
// The three draw functions here are called in order by renderer.ts and that order is
// load-bearing: minor grid, then major grid, then axes, then labels. Each layer paints over the
// last.

import { formatTick, gridSteps, isMajorLine, ticksBetween } from './grid.ts';
import type { Viewport } from './viewport.ts';

export const GRID_MINOR_COLOUR = '#d7d7d7';
export const GRID_MAJOR_COLOUR = '#bfbfbf';
export const AXIS_COLOUR = '#000';
export const LABEL_COLOUR = '#3c3c3c';
export const LABEL_HALO_COLOUR = '#fff';
export const LABEL_FONT = '11.2px "Helvetica Neue", Helvetica, Arial, sans-serif';
export const AXIS_LABEL_FONT = 'italic 13.6px "Times New Roman", Times, serif';

/** Labels closer than this to an edge are dropped rather than clipped. */
const LABEL_EDGE_MARGIN_X = 11;
const LABEL_EDGE_MARGIN_Y = 7;

/** Arrowhead dimensions in css pixels. */
const ARROW_LENGTH = 9;
const ARROW_HALF_WIDTH = 4.5;

/** What the wrench controls. Mirrors the drawable subset of state/document.ts GraphSettings. */
export interface AxisOptions {
  readonly showGrid: boolean;
  readonly showMinorGridlines: boolean;
  readonly showAxisNumbers: boolean;
  readonly showArrows: boolean;
  /** Desmos makes each axis name a checkbox that hides that axis line. */
  readonly showXAxis: boolean;
  readonly showYAxis: boolean;
  readonly xAxisLabel: string;
  readonly yAxisLabel: string;
  readonly xAxisStep: number | null;
  readonly yAxisStep: number | null;
}

export const DEFAULT_AXIS_OPTIONS: AxisOptions = {
  showGrid: true,
  showMinorGridlines: true,
  showAxisNumbers: true,
  showArrows: false,
  showXAxis: true,
  showYAxis: true,
  xAxisLabel: '',
  yAxisLabel: '',
  xAxisStep: null,
  yAxisStep: null,
};

/** The two axes can be stepped independently, so each is resolved separately. */
const stepsFor = (view: Viewport, options: AxisOptions) => ({
  x: gridSteps(view.ppuX, options.xAxisStep),
  y: gridSteps(view.ppuY, options.yAxisStep),
});

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  view: Viewport,
  options: AxisOptions = DEFAULT_AXIS_OPTIONS,
): void {
  if (!options.showGrid) return;

  const { x: sx, y: sy } = stepsFor(view, options);
  const [x0, x1, y0, y1] = view.bounds();
  const epsX = sx.minor * 1e-6;
  const epsY = sy.minor * 1e-6;

  if (options.showMinorGridlines) {
    ctx.lineWidth = 1 / view.dpr;
    ctx.strokeStyle = GRID_MINOR_COLOUR;
    ctx.beginPath();
    for (const v of ticksBetween(x0, x1, sx.minor, epsX)) {
      if (isMajorLine(v, sx.major)) continue;
      const p = view.snapLine(view.toPX(v));
      ctx.moveTo(p, 0);
      ctx.lineTo(p, view.height);
    }
    for (const v of ticksBetween(y0, y1, sy.minor, epsY)) {
      if (isMajorLine(v, sy.major)) continue;
      const p = view.snapLine(view.toPY(v));
      ctx.moveTo(0, p);
      ctx.lineTo(view.width, p);
    }
    ctx.stroke();
  }

  ctx.lineWidth = 1 / view.dpr;
  ctx.strokeStyle = GRID_MAJOR_COLOUR;
  ctx.beginPath();
  for (const v of ticksBetween(x0, x1, sx.major, epsX)) {
    const p = view.snapLine(view.toPX(v));
    ctx.moveTo(p, 0);
    ctx.lineTo(p, view.height);
  }
  for (const v of ticksBetween(y0, y1, sy.major, epsY)) {
    const p = view.snapLine(view.toPY(v));
    ctx.moveTo(0, p);
    ctx.lineTo(view.width, p);
  }
  ctx.stroke();
}

/** A filled triangle pointing along (dx, dy), which must be a unit vector. */
function arrowhead(ctx: CanvasRenderingContext2D, tipX: number, tipY: number, dx: number, dy: number): void {
  const baseX = tipX - dx * ARROW_LENGTH;
  const baseY = tipY - dy * ARROW_LENGTH;
  // Perpendicular, for the two base corners.
  const px = -dy * ARROW_HALF_WIDTH;
  const py = dx * ARROW_HALF_WIDTH;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(baseX + px, baseY + py);
  ctx.lineTo(baseX - px, baseY - py);
  ctx.closePath();
  ctx.fill();
}

export function drawAxisLines(
  ctx: CanvasRenderingContext2D,
  view: Viewport,
  options: AxisOptions = DEFAULT_AXIS_OPTIONS,
): void {
  const ax = view.toPX(0);
  const ay = view.toPY(0);
  // The line at x=0 is the y-axis, and vice versa — hence the crossed names.
  const yAxisOnScreen = options.showYAxis && ax >= -1 && ax <= view.width + 1;
  const xAxisOnScreen = options.showXAxis && ay >= -1 && ay <= view.height + 1;

  ctx.strokeStyle = AXIS_COLOUR;
  ctx.lineWidth = 2 / view.dpr;
  ctx.beginPath();
  // The one-pixel slack lets an axis sitting just off-screen still draw its edge.
  if (yAxisOnScreen) {
    const p = view.snapEdge(ax);
    ctx.moveTo(p, 0);
    ctx.lineTo(p, view.height);
  }
  if (xAxisOnScreen) {
    const p = view.snapEdge(ay);
    ctx.moveTo(0, p);
    ctx.lineTo(view.width, p);
  }
  ctx.stroke();

  if (!options.showArrows) return;

  ctx.fillStyle = AXIS_COLOUR;
  if (xAxisOnScreen) {
    const p = view.snapEdge(ay);
    arrowhead(ctx, view.width, p, 1, 0);
    arrowhead(ctx, 0, p, -1, 0);
  }
  if (yAxisOnScreen) {
    const p = view.snapEdge(ax);
    arrowhead(ctx, p, 0, 0, -1);
    arrowhead(ctx, p, view.height, 0, 1);
  }
}

/**
 * Tick labels, drawn with a white halo so they stay readable where they cross a grid line.
 *
 * Label positions are clamped to the viewport, so when an axis is panned off-screen its labels
 * slide along the edge rather than disappearing with it.
 */
export function drawTickLabels(
  ctx: CanvasRenderingContext2D,
  view: Viewport,
  options: AxisOptions = DEFAULT_AXIS_OPTIONS,
): void {
  const { x: sx, y: sy } = stepsFor(view, options);
  const [x0, x1, y0, y1] = view.bounds();
  const ax = view.toPX(0);
  const ay = view.toPY(0);

  ctx.strokeStyle = LABEL_HALO_COLOUR;
  ctx.lineWidth = 2.8;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  const labelY = Math.min(Math.max(ay + 4, 2), view.height - 15);
  const labelX = Math.min(Math.max(ax - 5.5, 21), view.width - 3);

  if (options.showAxisNumbers) {
    ctx.font = LABEL_FONT;
    ctx.fillStyle = LABEL_COLOUR;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (const v of ticksBetween(x0, x1, sx.major, sx.minor * 1e-6)) {
      const p = view.toPX(v);
      if (p < LABEL_EDGE_MARGIN_X || p > view.width - LABEL_EDGE_MARGIN_X) continue;
      const s = formatTick(v, sx.major);
      ctx.strokeText(s, p, labelY);
      ctx.fillText(s, p, labelY);
    }

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (const v of ticksBetween(y0, y1, sy.major, sy.minor * 1e-6)) {
      if (Math.abs(v) < sy.minor * 1e-6) continue;   // zero is labelled on the x-axis only
      const p = view.toPY(v);
      if (p < LABEL_EDGE_MARGIN_Y || p > view.height - LABEL_EDGE_MARGIN_Y) continue;
      const s = formatTick(v, sy.major);
      ctx.strokeText(s, labelX, p);
      ctx.fillText(s, labelX, p);
    }
  }

  // Axis names sit at the far end of each axis, inside the viewport.
  if (options.xAxisLabel || options.yAxisLabel) {
    ctx.font = AXIS_LABEL_FONT;
    ctx.fillStyle = LABEL_COLOUR;
    if (options.xAxisLabel) {
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.strokeText(options.xAxisLabel, view.width - 6, labelY - 2);
      ctx.fillText(options.xAxisLabel, view.width - 6, labelY - 2);
    }
    if (options.yAxisLabel) {
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.strokeText(options.yAxisLabel, labelX + 6, 6);
      ctx.fillText(options.yAxisLabel, labelX + 6, 6);
    }
  }
}

// Grid lines, axis lines and tick labels.
//
// The three functions here are called in order by renderer.ts and that order is load-bearing:
// minor grid, then major grid, then axes, then labels. Each layer paints over the last.

import { formatTick, gridSteps, isMajorLine, ticksBetween } from './grid.ts';
import type { Viewport } from './viewport.ts';

export const GRID_MINOR_COLOUR = '#d7d7d7';
export const GRID_MAJOR_COLOUR = '#bfbfbf';
export const AXIS_COLOUR = '#000';
export const LABEL_COLOUR = '#3c3c3c';
export const LABEL_HALO_COLOUR = '#fff';
export const LABEL_FONT = '11.2px "Helvetica Neue", Helvetica, Arial, sans-serif';

/** Labels closer than this to an edge are dropped rather than clipped. */
const LABEL_EDGE_MARGIN_X = 11;
const LABEL_EDGE_MARGIN_Y = 7;

export function drawGrid(ctx: CanvasRenderingContext2D, view: Viewport): void {
  const { major, minor } = gridSteps(view.ppu);
  const [x0, x1, y0, y1] = view.bounds();
  const eps = minor * 1e-6;

  // Minor lines first, skipping any position a major line will cover.
  ctx.lineWidth = 1 / view.dpr;
  ctx.strokeStyle = GRID_MINOR_COLOUR;
  ctx.beginPath();
  for (const v of ticksBetween(x0, x1, minor, eps)) {
    if (isMajorLine(v, major)) continue;
    const p = view.snapLine(view.toPX(v));
    ctx.moveTo(p, 0);
    ctx.lineTo(p, view.height);
  }
  for (const v of ticksBetween(y0, y1, minor, eps)) {
    if (isMajorLine(v, major)) continue;
    const p = view.snapLine(view.toPY(v));
    ctx.moveTo(0, p);
    ctx.lineTo(view.width, p);
  }
  ctx.stroke();

  // Major lines — the ones that get labelled, a shade darker.
  ctx.lineWidth = 1 / view.dpr;
  ctx.strokeStyle = GRID_MAJOR_COLOUR;
  ctx.beginPath();
  for (const v of ticksBetween(x0, x1, major, eps)) {
    const p = view.snapLine(view.toPX(v));
    ctx.moveTo(p, 0);
    ctx.lineTo(p, view.height);
  }
  for (const v of ticksBetween(y0, y1, major, eps)) {
    const p = view.snapLine(view.toPY(v));
    ctx.moveTo(0, p);
    ctx.lineTo(view.width, p);
  }
  ctx.stroke();
}

export function drawAxisLines(ctx: CanvasRenderingContext2D, view: Viewport): void {
  const ax = view.toPX(0);
  const ay = view.toPY(0);

  ctx.strokeStyle = AXIS_COLOUR;
  ctx.lineWidth = 2 / view.dpr;
  ctx.beginPath();
  // The one-pixel slack lets an axis sitting just off-screen still draw its edge.
  if (ax >= -1 && ax <= view.width + 1) {
    const p = view.snapEdge(ax);
    ctx.moveTo(p, 0);
    ctx.lineTo(p, view.height);
  }
  if (ay >= -1 && ay <= view.height + 1) {
    const p = view.snapEdge(ay);
    ctx.moveTo(0, p);
    ctx.lineTo(view.width, p);
  }
  ctx.stroke();
}

/**
 * Tick labels, drawn with a white halo so they stay readable where they cross a grid line.
 *
 * Label positions are clamped to the viewport, so when an axis is panned off-screen its labels
 * slide along the edge rather than disappearing with it.
 */
export function drawTickLabels(ctx: CanvasRenderingContext2D, view: Viewport): void {
  const { major, minor } = gridSteps(view.ppu);
  const [x0, x1, y0, y1] = view.bounds();
  const eps = minor * 1e-6;

  const ax = view.toPX(0);
  const ay = view.toPY(0);

  ctx.font = LABEL_FONT;
  ctx.fillStyle = LABEL_COLOUR;
  ctx.strokeStyle = LABEL_HALO_COLOUR;
  ctx.lineWidth = 2.8;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const labelY = Math.min(Math.max(ay + 4, 2), view.height - 15);
  for (const v of ticksBetween(x0, x1, major, eps)) {
    const p = view.toPX(v);
    if (p < LABEL_EDGE_MARGIN_X || p > view.width - LABEL_EDGE_MARGIN_X) continue;
    const s = formatTick(v, major);
    ctx.strokeText(s, p, labelY);
    ctx.fillText(s, p, labelY);
  }

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const labelX = Math.min(Math.max(ax - 5.5, 21), view.width - 3);
  for (const v of ticksBetween(y0, y1, major, eps)) {
    if (Math.abs(v) < eps) continue;                 // zero is labelled on the x-axis only
    const p = view.toPY(v);
    if (p < LABEL_EDGE_MARGIN_Y || p > view.height - LABEL_EDGE_MARGIN_Y) continue;
    const s = formatTick(v, major);
    ctx.strokeText(s, labelX, p);
    ctx.fillText(s, labelX, p);
  }
}

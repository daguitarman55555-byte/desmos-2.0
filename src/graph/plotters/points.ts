// Literal points, `(a, b)`.

import type { Compiled } from '../../core/eval/backend.ts';
import type { Scope } from '../../core/lang/scope.ts';
import type { Transform, ViewportState } from '../transform/Transform.ts';

/** Radius of a plotted point, in css pixels. */
export const POINT_RADIUS = 5;

export interface PlottedPoint {
  readonly sx: number;
  readonly sy: number;
}

/** Evaluate a point expression and project it, or null if it is not a finite pair. */
export function plotPoint(
  fn: Compiled,
  view: ViewportState,
  transform: Transform,
  scope: Scope,
): PlottedPoint | null {
  let value: unknown;
  try {
    value = fn({ x: 0, y: 0 }, scope);
  } catch {
    return null;
  }
  if (!Array.isArray(value)) return null;
  const [x, y] = value as number[];
  if (typeof x !== 'number' || typeof y !== 'number' || !isFinite(x) || !isFinite(y)) return null;
  const [sx, sy] = transform.forward(view, x, y);
  return { sx, sy };
}

export function drawPoint(
  ctx: CanvasRenderingContext2D,
  point: PlottedPoint,
  colour: string,
): void {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(point.sx, point.sy, POINT_RADIUS, 0, Math.PI * 2);
  ctx.fill();
}

// Literal points, `(a, b)`, and the eight marker styles Desmos offers.

import type { Compiled } from '../../core/eval/backend.ts';
import type { Scope } from '../../core/lang/scope.ts';
import type { PointStyle } from '../../state/document.ts';
import type { Transform, ViewportState } from '../transform/Transform.ts';

/** Default marker diameter in css pixels. */
export const POINT_SIZE = 9;

/** Outline weight for the hollow styles, relative to the marker size. */
const STROKE_RATIO = 0.22;

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

/** Trace a regular polygon of `n` sides, rotated so a vertex points up. */
function polygon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, n: number): void {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** Five-pointed star, alternating between an outer and an inner radius. */
function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  const inner = r * 0.4;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + radius * Math.cos(a);
    const y = cy + radius * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function drawPoint(
  ctx: CanvasRenderingContext2D,
  point: PlottedPoint,
  colour: string,
  style: PointStyle = 'POINT',
  size: number = POINT_SIZE,
): void {
  const { sx, sy } = point;
  const r = size / 2;
  const stroke = Math.max(1, size * STROKE_RATIO);

  ctx.fillStyle = colour;
  ctx.strokeStyle = colour;
  ctx.lineWidth = stroke;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (style) {
    case 'POINT':
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      return;

    case 'OPEN':
      // Filled white first, so a curve passing behind does not show through the middle.
      ctx.beginPath();
      ctx.arc(sx, sy, r - stroke / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.stroke();
      return;

    case 'CROSS': {
      const d = r * 0.85;
      ctx.beginPath();
      ctx.moveTo(sx - d, sy - d); ctx.lineTo(sx + d, sy + d);
      ctx.moveTo(sx + d, sy - d); ctx.lineTo(sx - d, sy + d);
      ctx.stroke();
      return;
    }

    case 'PLUS':
      ctx.beginPath();
      ctx.moveTo(sx - r, sy); ctx.lineTo(sx + r, sy);
      ctx.moveTo(sx, sy - r); ctx.lineTo(sx, sy + r);
      ctx.stroke();
      return;

    case 'SQUARE': {
      const d = r * 0.9;
      ctx.beginPath();
      ctx.rect(sx - d, sy - d, d * 2, d * 2);
      ctx.fill();
      return;
    }

    case 'DIAMOND':
      polygon(ctx, sx, sy, r * 1.15, 4);
      ctx.fill();
      return;

    case 'TRIANGLE':
      polygon(ctx, sx, sy, r * 1.2, 3);
      ctx.fill();
      return;

    case 'STAR':
      star(ctx, sx, sy, r * 1.2);
      ctx.fill();
      return;

    default: {
      const never: never = style;
      return never;
    }
  }
}

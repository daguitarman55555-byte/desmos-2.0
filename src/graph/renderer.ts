// Orchestrates one pane: clear, background, curves, points of interest.
//
// The renderer knows core/ and nothing above it — no store, no DOM outside its own canvas. The
// caller adapts document state into `Drawable`s, which is what keeps the dependency arrow
// pointing the right way.

import { drawAxisLines, drawGrid, drawTickLabels } from './axes.ts';
import { plotExplicit } from './plotters/explicit.ts';
import type { Polyline } from './plotters/explicit.ts';
import { plotImplicit } from './plotters/implicit.ts';
import { drawPoint, plotPoint } from './plotters/points.ts';
import type { Viewport } from './viewport.ts';
import type { PickableCurve } from './pick.ts';
import type { Compiled } from '../core/eval/backend.ts';
import type { ExpressionKind } from '../core/lang/analyze.ts';
import type { Scope } from '../core/lang/scope.ts';
import { orientationOf } from '../core/poi.ts';
import type { POI } from '../core/poi.ts';

export const CURVE_WIDTH = 2;
export const CURVE_WIDTH_SELECTED = 3.2;
export const POI_RADIUS = 4.5;
export const POI_RADIUS_HOT = 5.5;
export const POI_COLOUR = '#9d9d9d';
export const POI_COLOUR_HOT = '#000';
export const BACKGROUND = '#fff';

export interface Drawable {
  readonly id: number;
  readonly kind: ExpressionKind;
  readonly colour: string;
  readonly visible: boolean;
  readonly fn: Compiled;
}

export interface Scene {
  readonly drawables: readonly Drawable[];
  readonly selectedId: number | null;
  readonly pois: readonly POI[];
  readonly pins: readonly POI[];
  readonly hover: POI | null;
}

export interface FrameTimings {
  /** Sampling and path generation. */
  readonly plotMs: number;
  /** Canvas work. */
  readonly drawMs: number;
}

export class Renderer {
  /** Screen paths from the last frame, keyed by expression id. Shared with pick.ts. */
  readonly paths = new Map<number, Polyline[]>();

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly view: Viewport,
    private readonly scope: Scope,
  ) {}

  /** Curves in a form pick.ts can hit-test, most recently drawn first. */
  pickable(scene: Scene): PickableCurve[] {
    const out: PickableCurve[] = [];
    for (const d of scene.drawables) {
      if (!d.visible) continue;
      const paths = this.paths.get(d.id);
      if (paths) out.push({ id: d.id, paths });
    }
    return out;
  }

  render(scene: Scene): FrameTimings {
    const { ctx, view } = this;
    if (!view.width || !view.height) return { plotMs: 0, drawMs: 0 };

    const drawStart = performance.now();
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, view.width, view.height);
    drawGrid(ctx, view);
    drawAxisLines(ctx, view);
    drawTickLabels(ctx, view);
    let drawMs = performance.now() - drawStart;

    let plotMs = 0;
    this.paths.clear();

    for (const d of scene.drawables) {
      if (!d.visible) continue;

      const plotStart = performance.now();
      let paths: Polyline[] | null = null;
      let point: ReturnType<typeof plotPoint> = null;

      try {
        const orientation = orientationOf(d.kind);
        if (orientation) {
          paths = plotExplicit({
            fn: d.fn,
            orientation,
            view: view.state,
            transform: view.transform,
            scope: this.scope,
          });
        } else if (d.kind === 'implicit') {
          paths = plotImplicit({
            fn: d.fn,
            view: view.state,
            transform: view.transform,
            scope: this.scope,
          });
        } else if (d.kind === 'point') {
          point = plotPoint(d.fn, view.state, view.transform, this.scope);
        }
      } catch {
        // A plotter throwing is a bug, not user error; drop the curve and keep the frame alive.
        paths = null;
      }
      plotMs += performance.now() - plotStart;

      const strokeStart = performance.now();
      if (paths) {
        this.paths.set(d.id, paths);
        this.strokePaths(paths, d.colour, d.id === scene.selectedId);
      } else if (point) {
        drawPoint(ctx, point, d.colour);
      }
      drawMs += performance.now() - strokeStart;
    }

    const poiStart = performance.now();
    this.drawPOIs(scene);
    drawMs += performance.now() - poiStart;

    return { plotMs, drawMs };
  }

  private strokePaths(paths: readonly Polyline[], colour: string, selected: boolean): void {
    const { ctx } = this;
    ctx.strokeStyle = colour;
    ctx.lineWidth = selected ? CURVE_WIDTH_SELECTED : CURVE_WIDTH;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const path of paths) {
      if (path.length < 2) continue;
      ctx.moveTo(path[0] as number, path[1] as number);
      for (let i = 2; i < path.length; i += 2) {
        ctx.lineTo(path[i] as number, path[i + 1] as number);
      }
    }
    ctx.stroke();
  }

  private drawPOIs(scene: Scene): void {
    const { ctx, view } = this;

    for (const p of scene.pois) {
      const [sx, sy] = view.project(p.x, p.y);
      const hot =
        (scene.hover !== null && scene.hover.x === p.x && scene.hover.y === p.y) ||
        scene.pins.some((q) => q.x === p.x && q.y === p.y);
      ctx.beginPath();
      ctx.arc(sx, sy, hot ? POI_RADIUS_HOT : POI_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = hot ? POI_COLOUR_HOT : POI_COLOUR;
      ctx.fill();
    }

    // A free trace point is not in the points-of-interest list, so it is drawn separately.
    if (scene.hover && scene.hover.type === 'trace') {
      const [sx, sy] = view.project(scene.hover.x, scene.hover.y);
      ctx.beginPath();
      ctx.arc(sx, sy, POI_RADIUS_HOT, 0, Math.PI * 2);
      ctx.fillStyle = POI_COLOUR_HOT;
      ctx.fill();
    }
  }
}

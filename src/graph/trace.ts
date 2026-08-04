// Cursor trace and pinned points.

import type { POI } from '../core/poi.ts';
import type { Polyline } from './plotters/explicit.ts';
import { nearestOnPaths } from './pick.ts';

/** How close the cursor must come to a point of interest to highlight it. */
export const POI_HOVER_TOLERANCE = 13;

/** Slightly tighter, so a trace drag snaps to a point of interest only when clearly over it. */
export const POI_SNAP_TOLERANCE = 12;

/** Two pinned points within this many pixels are treated as the same pin. */
export const PIN_MATCH_TOLERANCE = 5;

export type Project = (x: number, y: number) => readonly [number, number];

/** Nearest point of interest to the cursor, within tolerance. */
export function pickPOI(
  pois: readonly POI[],
  project: Project,
  mx: number,
  my: number,
  tolerance: number = POI_HOVER_TOLERANCE,
): POI | null {
  let best: { poi: POI; d: number } | null = null;
  const limit = tolerance * tolerance;

  for (const poi of pois) {
    const [sx, sy] = project(poi.x, poi.y);
    const dx = sx - mx;
    const dy = sy - my;
    const d = dx * dx + dy * dy;
    if (d < limit && (best === null || d < best.d)) best = { poi, d };
  }

  return best ? best.poi : null;
}

/**
 * The point to show while tracing a curve.
 *
 * Snaps to a point of interest when the cursor is near one, and otherwise glues itself to the
 * nearest sample on the traced curve with no tolerance at all — so the marker stays on the curve
 * even when the cursor wanders well away from it mid-drag.
 */
export function tracePoint(
  paths: readonly Polyline[] | null,
  pois: readonly POI[],
  project: Project,
  unproject: (px: number, py: number) => readonly [number, number],
  mx: number,
  my: number,
): POI | null {
  const snapped = pickPOI(pois, project, mx, my, POI_SNAP_TOLERANCE);
  if (snapped) return snapped;

  if (!paths) return null;
  const nearest = nearestOnPaths(paths, mx, my);
  if (!nearest) return null;

  const [x, y] = unproject(nearest.sx, nearest.sy);
  return { x, y, type: 'trace' };
}

export const samePoint = (a: POI | null, b: POI | null): boolean =>
  (!a && !b) || (!!a && !!b && a.x === b.x && a.y === b.y && a.type === b.type);

/** Index of a pin coincident with `p` on screen, or -1. */
export function findPin(pins: readonly POI[], p: POI, project: Project): number {
  const [px, py] = project(p.x, p.y);
  return pins.findIndex((q) => {
    const [qx, qy] = project(q.x, q.y);
    return Math.abs(qx - px) < PIN_MATCH_TOLERANCE && Math.abs(qy - py) < PIN_MATCH_TOLERANCE;
  });
}

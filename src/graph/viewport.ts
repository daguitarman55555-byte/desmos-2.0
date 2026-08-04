// Pan, zoom and framing. Owns a Transform and the state it needs.

import { cartesian } from './transform/cartesian.ts';
import type { Point, Transform, ViewportState } from './transform/Transform.ts';
import type { ScreenMetric } from '../core/poi.ts';

/** Default framing: x spans exactly [-10, 10] and y follows from the aspect ratio. */
export const DEFAULT_X_SPAN = 20;

/** Button zoom factor per click. */
export const ZOOM_STEP = 1.35;

/** Wheel sensitivity: ppu multiplied by this raised to -deltaY. */
export const WHEEL_BASE = 1.0015;

export const MIN_PPU = 1e-6;
export const MAX_PPU = 1e7;

export class Viewport {
  cx = 0;
  cy = 0;
  ppu = 58;
  width = 0;
  height = 0;
  /** Device pixel ratio, for hairline snapping. */
  dpr = 1;
  /** True once the user pans or zooms — drives the home button's visibility. */
  userMoved = false;

  readonly transform: Transform = cartesian;

  get state(): ViewportState {
    return { cx: this.cx, cy: this.cy, ppu: this.ppu, width: this.width, height: this.height };
  }

  toPX(x: number): number { return this.transform.forward(this.state, x, 0)[0]; }
  toPY(y: number): number { return this.transform.forward(this.state, 0, y)[1]; }
  toMX(px: number): number { return this.transform.inverse(this.state, px, 0)[0]; }
  toMY(py: number): number { return this.transform.inverse(this.state, 0, py)[1]; }
  project(x: number, y: number): Point { return this.transform.forward(this.state, x, y); }

  /** The view of the screen that core/poi.ts needs, and nothing more. */
  screenMetric(): ScreenMetric {
    return {
      project: (x, y) => this.project(x, y),
      width: this.width,
      height: this.height,
    };
  }

  /** Maths bounds of the visible area: [left, right, bottom, top]. */
  bounds(): readonly [number, number, number, number] {
    return [this.toMX(0), this.toMX(this.width), this.toMY(this.height), this.toMY(0)];
  }

  /**
   * Snap a css-pixel coordinate to the centre of a physical pixel, so a one-pixel line stays a
   * crisp hairline at any device pixel ratio or browser zoom instead of blurring across two.
   */
  snapLine(v: number): number { return (Math.round(v * this.dpr) + 0.5) / this.dpr; }

  /** Snap to a physical pixel boundary — for even-width strokes like the axes. */
  snapEdge(v: number): number { return Math.round(v * this.dpr) / this.dpr; }

  fit(): void {
    if (!this.width || !this.height) return;
    this.ppu = this.width / DEFAULT_X_SPAN;
    this.cx = 0;
    this.cy = 0;
  }

  resetToDefault(): void {
    this.userMoved = false;
    this.fit();
  }

  panByPixels(dx: number, dy: number): void {
    this.userMoved = true;
    this.cx -= dx / this.ppu;
    this.cy += dy / this.ppu;
  }

  private clampPPU(ppu: number): number {
    return Math.max(MIN_PPU, Math.min(MAX_PPU, ppu));
  }

  zoomBy(factor: number): void {
    this.userMoved = true;
    this.ppu = this.clampPPU(this.ppu * factor);
  }

  /** Wheel zoom that keeps the maths point under the cursor pinned to the cursor. */
  zoomAt(px: number, py: number, deltaY: number): void {
    this.userMoved = true;
    const mx = this.toMX(px);
    const my = this.toMY(py);
    this.ppu = this.clampPPU(this.ppu * Math.pow(WHEEL_BASE, -deltaY));
    this.cx = mx - (px - this.width / 2) / this.ppu;
    this.cy = my + (py - this.height / 2) / this.ppu;
  }
}

import type { Jacobian, Point, Transform, ViewportState } from './Transform.ts';

/**
 * The ordinary linear map. Note the y flip: screen y grows downward, maths y grows upward.
 *
 * The arithmetic is the prototype's, unchanged — every pixel position in the app ultimately
 * comes through here, so any drift shows up everywhere at once.
 */
export const cartesian: Transform = {
  name: 'cartesian',

  forward(view: ViewportState, x: number, y: number): Point {
    return [
      (x - view.cx) * view.ppu + view.width / 2,
      view.height / 2 - (y - view.cy) * view.ppu,
    ];
  },

  inverse(view: ViewportState, px: number, py: number): Point {
    return [
      (px - view.width / 2) / view.ppu + view.cx,
      (view.height / 2 - py) / view.ppu + view.cy,
    ];
  },

  jacobian(view: ViewportState): Jacobian {
    return [view.ppu, 0, 0, -view.ppu];
  },
};

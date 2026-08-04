// Decision 2: the renderer never assumes a linear world -> screen map.
//
// Grid generation, hit testing, point-of-interest placement and label positioning all ask the
// transform rather than doing their own arithmetic. Getting this wrong is the single most
// expensive retrofit in the project, which is why the interface exists in milestone 1 even
// though `cartesian` is the only implementation.
//
// The transform is stateless. Pan and zoom live in the viewport and are passed in, so a single
// transform instance can serve several panes (decision 10).

export interface ViewportState {
  /** Centre of the view, in maths coordinates. */
  readonly cx: number;
  readonly cy: number;
  /** Scale: css pixels per maths unit. */
  readonly ppu: number;
  /** Size of the drawing surface, in css pixels. */
  readonly width: number;
  readonly height: number;
}

export type Point = readonly [number, number];

/**
 * Partial derivatives of the forward map at a point, row-major:
 * `[dsx/dx, dsx/dy, dsy/dx, dsy/dy]`.
 *
 * Needed so that a curvilinear transform can still tell the plotter how long a screen pixel is
 * in maths units locally — which is what sets the sampling step.
 */
export type Jacobian = readonly [number, number, number, number];

export interface Transform {
  readonly name: string;
  /** Maths coordinates to css pixels. */
  forward(view: ViewportState, x: number, y: number): Point;
  /** Css pixels back to maths coordinates. */
  inverse(view: ViewportState, px: number, py: number): Point;
  jacobian(view: ViewportState, x: number, y: number): Jacobian;
}

// The saved graph. Everything here is plain data and survives a round trip through JSON.
//
// Note what is *not* here: compiled closures, DOM nodes and screen paths. The prototype kept all
// four on one object, which meant the document could not be serialised, copied or tested
// without dragging the renderer along. They now live in side tables keyed by expression id —
// analyses in state/store.ts, DOM in ui/ExpressionRow.ts, paths in graph/renderer.ts.

/**
 * The colours Desmos assigns automatically, in cycle order.
 *
 * Measured from live desmos.com via the Calc API across fourteen consecutive expressions: the
 * cycle is exactly these five and repeats. Orange is NOT among them — it exists in the palette
 * and the style picker, but nothing is ever auto-assigned orange.
 */
export const COLOUR_CYCLE: readonly string[] = [
  '#c74440', // red    — a blank document's first row already holds this
  '#2d70b3', // blue
  '#388c46', // green
  '#6042a6', // purple
  '#000000', // black
];

/**
 * The named palette offered by the style picker, from `Desmos.Colors`.
 *
 * Note the green: the picker's GREEN is #348543, while the auto-cycle uses #388c46. They are
 * genuinely different values in Desmos, not a transcription slip — do not "unify" them.
 */
export const PALETTE: Readonly<Record<string, string>> = {
  RED: '#c74440',
  BLUE: '#2d70b3',
  GREEN: '#348543',
  ORANGE: '#fa7e19',
  PURPLE: '#6042a6',
  BLACK: '#000000',
};

/** Kept as the old name so existing call sites and tests continue to read naturally. */
export const COLOURS = COLOUR_CYCLE;

/** Stroke styles, matching Desmos.Styles. */
export type LineStyle = 'SOLID' | 'DASHED' | 'DOTTED';

/** Point marker styles, matching Desmos.Styles. */
export type PointStyle =
  | 'POINT' | 'OPEN' | 'CROSS' | 'PLUS'
  | 'SQUARE' | 'DIAMOND' | 'STAR' | 'TRIANGLE';

export const LINE_STYLES: readonly LineStyle[] = ['SOLID', 'DASHED', 'DOTTED'];
export const POINT_STYLES: readonly PointStyle[] = [
  'POINT', 'OPEN', 'CROSS', 'PLUS', 'SQUARE', 'DIAMOND', 'STAR', 'TRIANGLE',
];

/** Default stroke width in css pixels, and the width the dash patterns are quoted against. */
export const DEFAULT_LINE_WIDTH = 2.5;
export const DEFAULT_POINT_SIZE = 9;

/**
 * Dash patterns, in css pixels, as multiples of the stroke width.
 *
 * Measured off Desmos's own canvas by scanning a pixel row across `y=1` at line widths 2 and 4
 * and reading the ink/gap run lengths. Both widths fit these ratios, so the pattern is
 * proportional to the stroke rather than fixed.
 */
export const DASH_PATTERNS: Readonly<Record<LineStyle, readonly number[]>> = {
  SOLID: [],
  DASHED: [5.5, 2],
  DOTTED: [2, 1.25],
};

/** Resolve a dash pattern to css pixels for a given stroke width. */
export const dashPattern = (style: LineStyle, width: number): number[] =>
  DASH_PATTERNS[style].map((m) => m * width);

export interface Expression {
  readonly id: number;
  latex: string;
  /**
   * Assigned the first time the expression becomes graphable, and never reassigned. A blank or
   * erroring row does not consume a slot in the cycle.
   */
  colour: string | null;
  visible: boolean;
  lineStyle: LineStyle;
  pointStyle: PointStyle;
  /** Empty string means "use the default", matching Desmos's own model. */
  lineWidth: number | null;
  pointSize: number | null;
  /** Slider bounds and current value. */
  min: number;
  max: number;
  step: string;
  val: number;
}

export interface GraphView {
  readonly cx: number;
  readonly cy: number;
  readonly ppuX: number;
  readonly ppuY: number;
}

// Angle mode is defined in core because the evaluator is what acts on it; state re-exports it
// so document code does not have to reach past its own layer for a type it persists.
export type { AngleMode } from '../core/lang/scope.ts';
import type { AngleMode } from '../core/lang/scope.ts';

/**
 * Everything behind the wrench.
 *
 * Axis minimum and maximum are deliberately *not* here: in Desmos those fields drive the
 * viewport directly, and the viewport is already the single owner of pan and zoom. Duplicating
 * them into settings would create two sources of truth for the same numbers.
 */
export interface GraphSettings {
  /** Radians by default and persisted per document; degrees available, never default. */
  readonly angleMode: AngleMode;
  /** Exact where possible (1/3 stays 1/3), with a toggle for decimals. */
  readonly exactNumerics: boolean;

  readonly showGrid: boolean;
  readonly showMinorGridlines: boolean;
  readonly showAxisNumbers: boolean;
  readonly showArrows: boolean;
  readonly showXAxis: boolean;
  readonly showYAxis: boolean;
  /** Desmos's "One Quadrant": clip the grid to x >= 0, y >= 0. The axes still draw in full. */
  readonly restrictGridToFirstQuadrant: boolean;

  readonly xAxisLabel: string;
  readonly yAxisLabel: string;
  /** null means the automatic 1-2-5 selection; a number pins the labelled step. */
  readonly xAxisStep: number | null;
  readonly yAxisStep: number | null;
}

export const DEFAULT_SETTINGS: GraphSettings = {
  angleMode: 'radians',
  exactNumerics: true,
  showGrid: true,
  showMinorGridlines: true,
  showAxisNumbers: true,
  showArrows: false,
  showXAxis: true,
  showYAxis: true,
  restrictGridToFirstQuadrant: false,
  xAxisLabel: '',
  yAxisLabel: '',
  xAxisStep: null,
  yAxisStep: null,
};

export interface GraphDocument {
  readonly title: string;
  readonly expressions: readonly Expression[];
  /** Decision 10: one document, several panes. Milestone 1 renders the first only. */
  readonly views: readonly GraphView[];
  readonly settings: GraphSettings;
}

export function createExpression(id: number, latex = ''): Expression {
  return {
    id, latex, colour: null, visible: true,
    lineStyle: 'SOLID', pointStyle: 'POINT',
    lineWidth: null, pointSize: null,
    min: -10, max: 10, step: '', val: 0,
  };
}

export const isBlank = (e: Expression): boolean => e.latex.trim() === '';

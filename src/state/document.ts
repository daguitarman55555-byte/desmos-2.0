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

/**
 * What a slider animation does when it reaches a bound. Desmos's own enum.
 *
 * Only the first three are reachable from the UI — the loop-mode button cycles those, and its
 * three icons are the tell that there is no fourth. Desmos uses `PLAY_INDEFINITELY` for a slider
 * with no finite bound, which cannot be built here yet; the stepper handles it anyway so the case
 * is not silently wrong the day it becomes reachable.
 */
export type LoopMode = 'LOOP_FORWARD_REVERSE' | 'LOOP_FORWARD' | 'PLAY_ONCE' | 'PLAY_INDEFINITELY';

/** The modes the loop button cycles through, in order. */
export const CYCLED_LOOP_MODES: readonly LoopMode[] = [
  'LOOP_FORWARD_REVERSE',
  'LOOP_FORWARD',
  'PLAY_ONCE',
];

export const nextLoopMode = (mode: LoopMode): LoopMode => {
  const i = CYCLED_LOOP_MODES.indexOf(mode);
  return CYCLED_LOOP_MODES[(i + 1) % CYCLED_LOOP_MODES.length] as LoopMode;
};

/** +1 sweeps towards max, −1 back towards min. */
export type PlayDirection = 1 | -1;

/** Milliseconds for one full min→max sweep. Read out of Desmos's bundle. */
export const DEFAULT_ANIMATION_PERIOD = 4000;

/**
 * A frame gap longer than a tenth of the period is clamped to it rather than applied.
 *
 * This is Desmos's, and it is what stops a backgrounded tab or a slow recompute from teleporting
 * the slider: the animation goes slow-motion instead of skipping.
 */
export const MAX_FRAME_FRACTION = 10;

export interface Expression {
  readonly id: number;
  latex: string;
  /**
   * Assigned the first time the expression becomes graphable, and never reassigned. A blank or
   * erroring row does not consume a slot in the cycle.
   */
  colour: string | null;
  visible: boolean;
  /**
   * Whether this expression draws its lines and its points at all.
   *
   * Separate from `visible`, which is the colour disc and hides the row's output wholesale.
   * These two are the style tray's "Lines" and "Points" section toggles. For every expression
   * kind that exists today exactly one of them applies — a curve has no points and a point has
   * no lines — so the applicable one currently reads as a second way to hide the row, which is
   * also true in Desmos. They stop being redundant as soon as a plotter draws both at once.
   */
  lines: boolean;
  points: boolean;
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
  /** Whether the slider is currently animating. */
  playing: boolean;
  playDirection: PlayDirection;
  loopMode: LoopMode;
  /** Milliseconds for one full sweep. Per expression, as in Desmos. */
  animationPeriod: number;
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
    lines: true, points: true,
    lineStyle: 'SOLID', pointStyle: 'POINT',
    lineWidth: null, pointSize: null,
    min: -10, max: 10, step: '', val: 0,
    playing: false, playDirection: 1,
    loopMode: 'LOOP_FORWARD_REVERSE', animationPeriod: DEFAULT_ANIMATION_PERIOD,
  };
}

export const isBlank = (e: Expression): boolean => e.latex.trim() === '';

// ── Slider animation ─────────────────────────────────────────────────────────────────────────
//
// Pure, so the stepping can be tested against known values in plain Node. The tick loop that
// drives it is UI and lives in main.ts.
//
// The unquantised `target` is deliberately not part of `Expression`. A step smaller than the
// slider's quantum would be rounded away every frame and the slider would never move, so the
// motion has to carry more precision than the value the row displays.

/** Everything the stepper needs from an expression. `Expression` satisfies it structurally. */
export interface SliderBounds {
  readonly min: number;
  readonly max: number;
  readonly step: string;
  readonly loopMode: LoopMode;
  readonly animationPeriod: number;
}

export interface SliderMotion {
  /** Carry this into the next frame. */
  readonly target: number;
  readonly direction: PlayDirection;
  /** What the row should display — `target` snapped to the step and held inside the bounds. */
  readonly value: number;
  /** False once PLAY_ONCE has reached its end. */
  readonly playing: boolean;
}

/** The slider's quantum, or 0 when the step field is blank or nonsense. */
export const sliderStepSize = (step: string): number => {
  const n = parseFloat(step);
  return isFinite(n) && n > 0 ? n : 0;
};

/**
 * Decimal places an animated value is rounded to before it is written back as latex.
 *
 * A fixed precision cannot serve every range: two places is right for the default −10…10 but
 * would freeze a slider running 0…0.01 solid. This keeps roughly a thousand distinct values
 * across whatever range the slider has, which lands on two places for the default — the same
 * precision the drag handle already quantises to.
 */
export function sliderDecimals(bounds: SliderBounds): number {
  const step = sliderStepSize(bounds.step);
  // With a step set, the step is the precision: rounding to the range's would destroy a fine one.
  const quantum = step > 0 ? step : Math.abs(bounds.max - bounds.min) / 1000;
  if (!isFinite(quantum) || quantum <= 0) return 2;
  return Math.min(12, Math.max(0, Math.ceil(-Math.log10(quantum))));
}

const roundTo = (value: number, decimals: number): number => {
  const scale = 10 ** decimals;
  return Math.round(value * scale) / scale;
};

/**
 * Snap a target to the step and hold it inside the bounds.
 *
 * The bounds clamp matters because the target is deliberately allowed to overshoot by half a
 * step — that is what gives the two extreme values the same dwell time as every value between
 * them — and a snapped overshoot could otherwise land one whole step outside the range.
 */
export function quantiseSlider(target: number, bounds: SliderBounds, clamp = true): number {
  const step = sliderStepSize(bounds.step);
  const snapped = step > 0 ? Math.round(target / step) * step : target;
  const held = clamp ? Math.min(Math.max(snapped, bounds.min), bounds.max) : snapped;
  return roundTo(held, sliderDecimals(bounds));
}

/**
 * Advance an animating slider by one frame.
 *
 * Transcribed from `yB(o, e)` in Desmos's bundle: the frame gap is clamped before it is applied,
 * the step is a fraction of the *range* rather than a fixed rate, and the bound the slider turns
 * at is half a step outside the range.
 */
export function stepSlider(
  bounds: SliderBounds,
  motion: { readonly target: number; readonly direction: PlayDirection },
  elapsedMs: number,
): SliderMotion {
  const period = bounds.animationPeriod > 0 ? bounds.animationPeriod : DEFAULT_ANIMATION_PERIOD;
  const dt = Math.max(0, Math.min(elapsedMs, period / MAX_FRAME_FRACTION));

  if (bounds.loopMode === 'PLAY_INDEFINITELY') {
    // Nothing to sweep towards, so the rate is flat rather than a fraction of a range: one unit
    // per quarter period. Nothing clamps it either — that is the point of the mode.
    const target = motion.target + (dt / (period / 4)) * motion.direction;
    return {
      target,
      direction: motion.direction,
      value: quantiseSlider(target, bounds, false),
      playing: true,
    };
  }

  const { min, max } = bounds;
  // An inverted or infinite range has nowhere to sweep. Stopping beats spinning a frame loop
  // that can never change anything.
  if (!isFinite(min) || !isFinite(max) || max <= min) {
    return {
      target: motion.target,
      direction: motion.direction,
      value: quantiseSlider(motion.target, bounds),
      playing: false,
    };
  }

  const halfStep = sliderStepSize(bounds.step) / 2;
  let target = motion.target + (max - min) * (dt / period) * motion.direction;
  let direction = motion.direction;
  let playing = true;

  switch (bounds.loopMode) {
    case 'LOOP_FORWARD_REVERSE':
      target = Math.min(Math.max(target, min - halfStep), max + halfStep);
      if (target >= max) direction = -1;
      else if (target <= min) direction = 1;
      break;

    case 'LOOP_FORWARD':
      // Wraps rather than turns. The two half-step overshoots are the same one bound seen from
      // either end, so leaving from one arrives at the other with no value skipped.
      if (target > max + halfStep) target = min - halfStep;
      else if (target < min - halfStep) target = max + halfStep;
      break;

    case 'PLAY_ONCE':
      if (direction > 0 && target >= max) {
        target = max;
        playing = false;
      } else if (direction < 0 && target <= min) {
        target = min;
        playing = false;
      }
      break;

    default: {
      const never: never = bounds.loopMode;
      return never;
    }
  }

  return { target, direction, value: quantiseSlider(target, bounds), playing };
}

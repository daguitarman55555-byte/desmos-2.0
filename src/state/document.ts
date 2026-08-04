// The saved graph. Everything here is plain data and survives a round trip through JSON.
//
// Note what is *not* here: compiled closures, DOM nodes and screen paths. The prototype kept all
// four on one object, which meant the document could not be serialised, copied or tested
// without dragging the renderer along. They now live in side tables keyed by expression id —
// analyses in state/store.ts, DOM in ui/ExpressionRow.ts, paths in graph/renderer.ts.

/** Desmos's colour cycle, in order. */
export const COLOURS: readonly string[] = [
  '#c74440', // red
  '#2d70b3', // blue
  '#388c46', // green
  '#6042a6', // purple
  '#000000', // black
  '#fa7e19', // orange
];

export interface Expression {
  readonly id: number;
  latex: string;
  /**
   * Assigned the first time the expression becomes graphable, and never reassigned. A blank or
   * erroring row does not consume a slot in the cycle.
   */
  colour: string | null;
  visible: boolean;
  /** Slider bounds and current value. */
  min: number;
  max: number;
  step: string;
  val: number;
}

export interface GraphView {
  readonly cx: number;
  readonly cy: number;
  readonly ppu: number;
}

export type AngleMode = 'radians' | 'degrees';

export interface GraphSettings {
  /** Radians by default and persisted per document; degrees available, never default. */
  readonly angleMode: AngleMode;
  /** Exact where possible (1/3 stays 1/3), with a toggle for decimals. */
  readonly exactNumerics: boolean;
}

export const DEFAULT_SETTINGS: GraphSettings = {
  angleMode: 'radians',
  exactNumerics: true,
};

export interface GraphDocument {
  readonly title: string;
  readonly expressions: readonly Expression[];
  /** Decision 10: one document, several panes. Milestone 1 renders the first only. */
  readonly views: readonly GraphView[];
  readonly settings: GraphSettings;
}

export function createExpression(id: number, latex = ''): Expression {
  return { id, latex, colour: null, visible: true, min: -10, max: 10, step: '', val: 0 };
}

export const isBlank = (e: Expression): boolean => e.latex.trim() === '';

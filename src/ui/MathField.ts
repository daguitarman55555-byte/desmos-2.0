// MathQuill wrapper.
//
// Two things make this fiddlier than it looks:
//
//  1. MathQuill 0.10.1 predates ES modules. It runs on import and expects `window.jQuery` to
//     already exist, so jQuery has to be installed on the global object *before* the module
//     body executes. A static `import` would be hoisted above that assignment, so the load is
//     deliberately dynamic. This is the whole reason `initMathQuill` is async.
//  2. Its edit handler fires for programmatic `latex()` calls as well as typing. Restoring an
//     undo snapshot sets the latex of every field in turn, and without a guard each one would
//     push a fresh history entry and clobber the redo stack. `setLatexQuietly` is that guard.

import $ from 'jquery';
import 'mathquill/build/mathquill.css';

/**
 * Names MathQuill renders upright, as function names rather than italic variables.
 *
 * Wider than the set the parser actually accepts — `mean`, `total`, `nCr` and the inverse
 * hyperbolics render correctly but do not evaluate. That mismatch is the prototype's and is
 * preserved; it is the seam where the roadmap's list functions will land.
 */
export const AUTO_OPERATOR_NAMES =
  'sin cos tan sec csc cot arcsin arccos arctan sinh cosh tanh ' +
  'arcsinh arccosh arctanh ln log exp abs sign floor ceil round mod gcd lcm ' +
  'min max mean median stdev total length nCr nPr';

export const AUTO_COMMANDS =
  'pi tau theta sqrt nthroot sum prod int alpha beta gamma delta lambda mu sigma phi omega';

export interface MathFieldHandlers {
  edit?: (field: MathField) => void;
  enter?: (field: MathField) => void;
  upOutOf?: (field: MathField) => void;
  downOutOf?: (field: MathField) => void;
  /** `direction` is MQ.L when backspacing off the left edge. */
  deleteOutOf?: (direction: number, field: MathField) => void;
}

export interface MathField {
  latex(): string;
  latex(value: string): void;
  focus(): void;
  blur(): void;
  moveToRightEnd(): void;
  el(): HTMLElement;
}

interface MQInterface {
  MathField(element: HTMLElement, config: unknown): MathField;
  readonly L: number;
  readonly R: number;
}

interface MathQuillGlobal {
  getInterface(version: number): MQInterface;
}

let cached: MQInterface | null = null;

/** Load MathQuill once, bridging jQuery onto the global object first. */
export async function initMathQuill(): Promise<void> {
  if (cached) return;

  const globals = window as unknown as { jQuery?: unknown; $?: unknown; MathQuill?: MathQuillGlobal };
  globals.jQuery = $;
  globals.$ = $;

  await import('mathquill/build/mathquill.js');

  if (!globals.MathQuill) {
    throw new Error('MathQuill did not attach itself to window — check the jQuery bridge');
  }
  cached = globals.MathQuill.getInterface(2);
}

function mq(): MQInterface {
  if (!cached) throw new Error('initMathQuill() must be awaited before creating a math field');
  return cached;
}

/** The direction constant meaning "off the left edge", for deleteOutOf. */
export const LEFT = (): number => mq().L;

export interface MathFieldHandle {
  readonly field: MathField;
  readonly element: HTMLElement;
  /** Set the latex without the edit handler firing. */
  setLatexQuietly(latex: string): void;
  getLatex(): string;
  focus(toEnd: boolean): void;
}

export function createMathField(host: HTMLElement, handlers: MathFieldHandlers): MathFieldHandle {
  const span = document.createElement('span');
  host.appendChild(span);

  let suppressed = false;

  const field = mq().MathField(span, {
    spaceBehavesLikeTab: false,
    autoCommands: AUTO_COMMANDS,
    autoOperatorNames: AUTO_OPERATOR_NAMES,
    handlers: {
      edit: () => {
        if (suppressed) return;
        handlers.edit?.(field);
      },
      enter: () => handlers.enter?.(field),
      upOutOf: () => handlers.upOutOf?.(field),
      downOutOf: () => handlers.downOutOf?.(field),
      deleteOutOf: (direction: number) => handlers.deleteOutOf?.(direction, field),
    },
  });

  return {
    field,
    element: span,
    setLatexQuietly(latex: string): void {
      suppressed = true;
      try {
        field.latex(latex);
      } finally {
        suppressed = false;
      }
    },
    getLatex: () => field.latex(),
    focus(toEnd: boolean): void {
      field.focus();
      if (toEnd) field.moveToRightEnd();
    },
  };
}

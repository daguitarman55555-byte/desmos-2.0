// Classify an expression into something the graph can draw.
//
// This is the single most behaviour-sensitive file in the port. The ordering of the checks below
// *is* the semantics: which forms get a slider, which orientations are treated as fast explicit
// sweeps rather than implicit curves, and which forms fall through to the implicit solver are
// all decided by the order in which the branches are tried. It is reproduced from the prototype
// branch for branch.

import { usesVariable } from './ast.ts';
import {
  FUNCTION_DEFINITION,
  NUMERIC_LITERAL,
  VARIABLE_DEFINITION,
  splitEquation,
} from './desugar.ts';
import { latexToSource } from './latex.ts';
import { parseSource } from './parse.ts';
import type { Scope } from './scope.ts';
import { compile } from '../eval/compile.ts';
import { asScalar } from '../eval/backend.ts';
import type { Compiled } from '../eval/backend.ts';

export type ExpressionKind =
  | 'y'         // y = f(x): sampled left to right
  | 'x'         // x = g(y): sampled top to bottom
  | 'implicit'  // everything else with an equals sign: marching squares
  | 'point'     // a literal (a, b)
  | 'func'      // f(x) = ...: defines a function and, for one parameter, draws it
  | 'slider';   // a = 5: defines a variable, draws nothing

/** The kinds that consume a colour and get drawn. `slider` is deliberately absent. */
export const GRAPHED_KINDS: ReadonlySet<ExpressionKind> =
  new Set<ExpressionKind>(['y', 'x', 'implicit', 'point', 'func']);

export type SliderKind = 'const' | 'var';

export interface Analysis {
  readonly kind: ExpressionKind | null;
  /** A structural error: the row shows a warning triangle. Numeric failure is not this. */
  readonly error: boolean;
  readonly fn: Compiled | null;
  /** Set for kind 'slider' — the variable this row defines. */
  readonly variableName: string | null;
  /** Set for kind 'func' — the function this row defines. */
  readonly functionName: string | null;
  readonly sliderKind: SliderKind | null;
  readonly sliderLabel: string;
  /** A value the row should adopt, or null to keep whatever it had. */
  readonly value: number | null;
}

const EMPTY: Analysis = {
  kind: null, error: false, fn: null,
  variableName: null, functionName: null,
  sliderKind: null, sliderLabel: '', value: null,
};

const failed: Analysis = { ...EMPTY, error: true };

/**
 * Classify one expression, registering any definition it makes into `scope`.
 *
 * Mutating the scope is intentional and is how definitions become visible to other rows. The
 * caller re-analyses the whole list on every edit, in order, so a definition is registered
 * before anything is drawn. Forward references still work regardless of order because compiled
 * closures resolve names at call time — see lang/scope.ts.
 *
 * Every failure path is a caught exception producing `error: true`. Nothing here throws.
 */
export function analyze(latex: string, scope: Scope): Analysis {
  const src = latexToSource(latex).trim();
  if (!src) return EMPTY;

  try {
    const sides = splitEquation(src);

    if (sides) {
      const { lhs, rhs } = sides;

      // ---- y = f(x) or x = g(y) -------------------------------------------------------
      // Taking `cos(y) = x` as a vertical sweep rather than an implicit curve is what gives it
      // fast sampling and points of interest.
      if (lhs === 'y' || lhs === 'x') {
        const ast = parseSource(rhs);
        if (!usesVariable(ast, lhs)) {
          const fn = compile(ast);
          // A bare number on the right also earns a slider: `y = 5` is both a horizontal line
          // and a draggable constant.
          if (NUMERIC_LITERAL.test(rhs)) {
            return {
              ...EMPTY, kind: lhs, fn,
              sliderKind: 'const', sliderLabel: lhs, value: parseFloat(rhs),
            };
          }
          return { ...EMPTY, kind: lhs, fn };
        }
      }

      // ---- the reversed orientation, f(x) = y ------------------------------------------
      // Note the asymmetry with the branch above: no slider here. `5 = y` draws the line but
      // offers no control. Preserved from the prototype rather than tidied.
      if (rhs === 'y' || rhs === 'x') {
        const ast = parseSource(lhs);
        if (!usesVariable(ast, rhs)) {
          return { ...EMPTY, kind: rhs, fn: compile(ast) };
        }
      }

      // ---- f(x) = ... ------------------------------------------------------------------
      const definition = FUNCTION_DEFINITION.exec(lhs);
      if (definition) {
        const name = definition[1] as string;
        const params = (definition[2] as string).split(',');
        const body = compile(parseSource(rhs));
        scope.funcs.set(name, { params, body });

        // A one-parameter function is also a curve: feed the plot's x into its single
        // parameter. The frame holds *only* that parameter, so a body mentioning `x` by name
        // sees NaN unless the parameter happens to be called `x`.
        let fn: Compiled | null = null;
        if (params.length === 1) {
          const param = params[0] as string;
          fn = (frame, s) => body({ [param]: frame['x'] ?? NaN }, s);
        }
        return { ...EMPTY, kind: 'func', functionName: name, fn };
      }

      // ---- a = 5 -----------------------------------------------------------------------
      if (VARIABLE_DEFINITION.test(lhs) && lhs !== 'x' && lhs !== 'y') {
        // Evaluated immediately, with an empty frame, so the right side may reference other
        // variables already in scope but not x or y.
        const value = asScalar(compile(parseSource(rhs))({}, scope));
        if (isFinite(value)) {
          scope.vars.set(lhs, value);
          return {
            ...EMPTY, kind: 'slider', variableName: lhs,
            sliderKind: 'var', sliderLabel: lhs, value,
          };
        }
        // Not finite: falls through to the implicit branch, so `a = 1/0` becomes a curve
        // (which never crosses zero and therefore draws nothing).
      }

      // ---- anything else with an equals sign --------------------------------------------
      const left = compile(parseSource(lhs));
      const right = compile(parseSource(rhs));
      return {
        ...EMPTY,
        kind: 'implicit',
        fn: (frame, s) => asScalar(left(frame, s)) - asScalar(right(frame, s)),
      };
    }

    // ---- no equals sign -----------------------------------------------------------------
    const ast = parseSource(src);

    if (ast.type === 'tuple' && ast.items.length === 2) {
      return { ...EMPTY, kind: 'point', fn: compile(ast) };
    }

    // A bare expression in terms of y has no graph. Desmos flags it rather than guessing which
    // variable was meant, and so does this.
    if (usesVariable(ast, 'y')) return failed;

    return { ...EMPTY, kind: 'y', fn: compile(ast) };
  } catch {
    return failed;
  }
}

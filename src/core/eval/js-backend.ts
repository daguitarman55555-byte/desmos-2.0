// AST -> JavaScript closures. The only backend for now.
//
// Compilation happens once per edit; the resulting closure is called several thousand times per
// redraw, so the shape here matters: every decision that can be made at compile time — which
// operator, how many arguments, whether a name is `x` — is made once and captured, leaving the
// hot path as a straight-line call chain.

import { asScalar } from './backend.ts';
import type { Backend, Compiled, Frame, Value } from './backend.ts';
import type { BuiltinName, Node } from '../lang/ast.ts';
import { SourceError } from '../lang/errors.ts';
import type { Scope } from '../lang/scope.ts';

type BuiltinImpl = (...args: number[]) => number;

/**
 * Implementations for every `BuiltinName`. Typed as a total Record, so adding a name to the
 * union in ast.ts without implementing it here fails the build rather than failing at runtime.
 *
 * These are the raw host functions wherever possible. `sqrt(-1)` returning NaN, `1/0` returning
 * Infinity and `tan(pi/2)` returning an enormous finite number are all intentional: numeric
 * errors are silent, and the plotter turns them into gaps.
 */
export const BUILTINS: Readonly<Record<BuiltinName, BuiltinImpl>> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan,
  arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  sec: (x) => 1 / Math.cos(x),
  csc: (x) => 1 / Math.sin(x),
  cot: (x) => 1 / Math.tan(x),
  sqrt: Math.sqrt, abs: Math.abs, exp: Math.exp,
  ln: Math.log, log: Math.log10,
  floor: Math.floor, ceil: Math.ceil, round: Math.round, sign: Math.sign,
  min: Math.min, max: Math.max,
  // Floored modulo, so mod(-1, 3) is 2 rather than -1.
  mod: (a, b) => ((a % b) + b) % b,
};

export const DEGREES_TO_RADIANS = Math.PI / 180;

/**
 * Functions whose *argument* is an angle, and whose input is therefore scaled in degree mode.
 *
 * The hyperbolics are deliberately absent: `sinh` takes a real number, not an angle, and
 * converting it would be wrong. Desmos leaves them alone too.
 */
const ANGLE_INPUT: ReadonlySet<BuiltinName> = new Set<BuiltinName>([
  'sin', 'cos', 'tan', 'sec', 'csc', 'cot',
]);

/** Functions whose *result* is an angle, and whose output is therefore scaled in degree mode. */
const ANGLE_OUTPUT: ReadonlySet<BuiltinName> = new Set<BuiltinName>([
  'asin', 'acos', 'atan', 'arcsin', 'arccos', 'arctan',
]);

function compileNode(node: Node): Compiled {
  switch (node.type) {
    case 'number': {
      const value = node.value;
      return () => value;
    }

    case 'variable': {
      const name = node.name;
      // The plotting coordinates read the frame directly and never fall through to the scope,
      // so `x = 3` defining a variable cannot change what `x` means inside `y = x^2`.
      if (name === 'x') return (frame) => frame['x'] ?? NaN;
      if (name === 'y') return (frame) => frame['y'] ?? NaN;
      return (frame, scope) => {
        if (name in frame) return frame[name] as number;
        const v = scope.vars.get(name);
        return v === undefined ? NaN : v;
      };
    }

    case 'negate': {
      const operand = compileNode(node.operand);
      return (frame, scope) => -asScalar(operand(frame, scope));
    }

    case 'tuple': {
      const items = node.items.map(compileNode);
      return (frame, scope) => items.map((f) => asScalar(f(frame, scope)));
    }

    case 'binary': {
      const left = compileNode(node.left);
      const right = compileNode(node.right);
      switch (node.op) {
        case '+': return (f, s) => asScalar(left(f, s)) + asScalar(right(f, s));
        case '-': return (f, s) => asScalar(left(f, s)) - asScalar(right(f, s));
        case '*': return (f, s) => asScalar(left(f, s)) * asScalar(right(f, s));
        case '/': return (f, s) => asScalar(left(f, s)) / asScalar(right(f, s));
        case '^': return (f, s) => Math.pow(asScalar(left(f, s)), asScalar(right(f, s)));
        default: {
          const never: never = node.op;
          return never;
        }
      }
    }

    case 'call': {
      const impl = BUILTINS[node.name];
      const args = node.args.map(compileNode);
      // Single-argument calls are overwhelmingly the common case and skipping the spread is
      // worth a specialised closure.
      if (args.length === 1) {
        const only = args[0] as Compiled;
        // Degree mode converts at the boundary of the angle functions rather than replacing
        // them, so the underlying implementation stays the host's. The mode is read from the
        // scope per call, so switching it redraws correctly without recompiling.
        if (ANGLE_INPUT.has(node.name)) {
          return (f, s) => impl(asScalar(only(f, s)) * (s.angleMode === 'degrees' ? DEGREES_TO_RADIANS : 1));
        }
        if (ANGLE_OUTPUT.has(node.name)) {
          return (f, s) => impl(asScalar(only(f, s))) / (s.angleMode === 'degrees' ? DEGREES_TO_RADIANS : 1);
        }
        return (f, s) => impl(asScalar(only(f, s)));
      }
      // No multi-argument builtin takes or returns an angle, so the general path needs no
      // conversion. Revisit if a two-argument atan is ever added.
      return (f, s) => impl(...args.map((g) => asScalar(g(f, s))));
    }

    case 'userCall': {
      const name = node.name;
      const args = node.args.map(compileNode);
      return (frame, scope) => {
        // Looked up per call, not captured — see lookupFunction in lang/scope.ts. This is what
        // makes a reference to a function defined further down the list resolve.
        const fn = scope.funcs.get(name);
        if (fn === undefined) return NaN;

        // A null-prototype frame holding only the parameters. Arguments beyond the parameter
        // count are dropped; parameters beyond the argument count are NaN.
        const local = Object.create(null) as Frame;
        for (let i = 0; i < fn.params.length; i++) {
          const arg = args[i];
          local[fn.params[i] as string] = arg ? asScalar(arg(frame, scope)) : NaN;
        }
        return fn.body(local, scope);
      };
    }

    default: {
      const never: never = node;
      throw new SourceError('unsupported-node', `Cannot compile node ${JSON.stringify(never)}`);
    }
  }
}

export const jsBackend: Backend = {
  name: 'js',
  compile: compileNode,
};

/** Evaluate a compiled expression as a scalar, the form every plotter wants. */
export const evaluateScalar = (fn: Compiled, frame: Frame, scope: Scope): number =>
  asScalar(fn(frame, scope));

export type { Value };

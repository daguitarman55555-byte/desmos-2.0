// Node definitions, plus the two facts about identifiers that are properties of the language
// rather than of any backend: which names are built-in functions, and which are constants.
//
// Those tables live here so the tokenizer and the compiler cannot drift apart. `BuiltinName` is
// a union, so `js-backend.ts` implementing `Record<BuiltinName, ...>` is checked for
// exhaustiveness by the compiler — adding a name here without implementing it is a build error.

import type { Span } from './errors.ts';

export type BinaryOp = '+' | '-' | '*' | '/' | '^';

/**
 * Built-in function names, exactly the set the prototype recognised.
 *
 * Note what is deliberately absent: `arcsinh`, `mean`, `total`, `nCr` and friends appear in
 * MathQuill's auto-operator list (so they render upright rather than italic) but are *not*
 * callable. Typing `arcsinh(x)` longest-matches `arcsin`, leaves a stray `h`, and fails to
 * parse — which is what the prototype does, and milestone 1 does not change it.
 */
export type BuiltinName =
  | 'sin' | 'cos' | 'tan'
  | 'asin' | 'acos' | 'atan'
  | 'arcsin' | 'arccos' | 'arctan'
  | 'sinh' | 'cosh' | 'tanh'
  | 'sec' | 'csc' | 'cot'
  | 'sqrt' | 'abs' | 'exp' | 'ln' | 'log'
  | 'floor' | 'ceil' | 'round' | 'sign'
  | 'min' | 'max' | 'mod';

export const BUILTIN_NAMES: ReadonlySet<string> = new Set<BuiltinName>([
  'sin', 'cos', 'tan',
  'asin', 'acos', 'atan',
  'arcsin', 'arccos', 'arctan',
  'sinh', 'cosh', 'tanh',
  'sec', 'csc', 'cot',
  'sqrt', 'abs', 'exp', 'ln', 'log',
  'floor', 'ceil', 'round', 'sign',
  'min', 'max', 'mod',
]);

export const isBuiltinName = (s: string): s is BuiltinName => BUILTIN_NAMES.has(s);

export type ConstantName = 'pi' | 'π' | 'tau' | 'e';

/**
 * Constants are resolved to numbers during parsing, not at evaluation time, so `pi` cannot be
 * shadowed by a user variable.
 *
 * `π` is listed because the prototype listed it, but it is unreachable: the tokenizer's
 * longest-match loop only considers candidates of length two or more, so a lone `π` character
 * falls through to the single-character branch and becomes a *variable*. In practice this never
 * bites, because MathQuill emits `\pi` and `latexToSource` rewrites that to the two-character
 * `pi`, which does match. Preserved as-is rather than fixed — milestone 1 changes no behaviour.
 */
export const CONSTANT_VALUES: Readonly<Record<ConstantName, number>> = {
  pi: Math.PI,
  'π': Math.PI,
  tau: 2 * Math.PI,
  e: Math.E,
};

export const isConstantName = (s: string): s is ConstantName =>
  Object.prototype.hasOwnProperty.call(CONSTANT_VALUES, s);

export interface NumberNode   { readonly type: 'number';   readonly value: number;        readonly span: Span }
export interface VariableNode { readonly type: 'variable'; readonly name: string;         readonly span: Span }
export interface NegateNode   { readonly type: 'negate';   readonly operand: Node;        readonly span: Span }
export interface BinaryNode   { readonly type: 'binary';   readonly op: BinaryOp;         readonly left: Node; readonly right: Node; readonly span: Span }
export interface CallNode     { readonly type: 'call';     readonly name: BuiltinName;    readonly args: readonly Node[]; readonly span: Span }
export interface UserCallNode { readonly type: 'userCall'; readonly name: string;         readonly args: readonly Node[]; readonly span: Span }
export interface TupleNode    { readonly type: 'tuple';    readonly items: readonly Node[]; readonly span: Span }

export type Node =
  | NumberNode
  | VariableNode
  | NegateNode
  | BinaryNode
  | CallNode
  | UserCallNode
  | TupleNode;

/** Does `name` appear as a free variable anywhere in the tree? */
export function usesVariable(node: Node, name: string): boolean {
  switch (node.type) {
    case 'number':   return false;
    case 'variable': return node.name === name;
    case 'negate':   return usesVariable(node.operand, name);
    case 'binary':   return usesVariable(node.left, name) || usesVariable(node.right, name);
    case 'call':
    case 'userCall': return node.args.some((a) => usesVariable(a, name));
    case 'tuple':    return node.items.some((a) => usesVariable(a, name));
    default: {
      const never: never = node;
      return never;
    }
  }
}

/** Every free variable in the tree, in first-appearance order. Used by `eval/deps.ts`. */
export function freeVariables(node: Node, into: Set<string> = new Set()): Set<string> {
  switch (node.type) {
    case 'number': break;
    case 'variable': into.add(node.name); break;
    case 'negate': freeVariables(node.operand, into); break;
    case 'binary': freeVariables(node.left, into); freeVariables(node.right, into); break;
    case 'call': for (const a of node.args) freeVariables(a, into); break;
    case 'userCall':
      into.add(node.name);
      for (const a of node.args) freeVariables(a, into);
      break;
    case 'tuple': for (const a of node.items) freeVariables(a, into); break;
    default: {
      const never: never = node;
      return never;
    }
  }
  return into;
}

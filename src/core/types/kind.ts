// Decision 1: distinct types, unified rank-n storage underneath.
//
// The tagged union every value in the language belongs to. Exhaustive switches over
// ValueKind must end in a `never` default.

import type { NDArray } from './ndarray.ts';

export type ValueKind = 'scalar' | 'vector' | 'matrix' | 'list' | 'tensor';

export interface ScalarValue { readonly kind: 'scalar'; readonly value: number }
export interface VectorValue { readonly kind: 'vector'; readonly data: NDArray }
export interface MatrixValue { readonly kind: 'matrix'; readonly data: NDArray }
export interface ListValue   { readonly kind: 'list';   readonly data: NDArray }
export interface TensorValue { readonly kind: 'tensor'; readonly data: NDArray }

export type Value =
  | ScalarValue
  | VectorValue
  | MatrixValue
  | ListValue
  | TensorValue;

export function kindOf(v: Value): ValueKind {
  return v.kind;
}

/** Human-readable name for error messages. */
export function kindName(kind: ValueKind): string {
  switch (kind) {
    case 'scalar': return 'number';
    case 'vector': return 'vector';
    case 'matrix': return 'matrix';
    case 'list':   return 'list';
    case 'tensor': return 'tensor';
    default: {
      const never: never = kind;
      return never;
    }
  }
}

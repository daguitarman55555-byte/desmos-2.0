// Decision 1's other half: one table mapping operator x operand-kind-pair to an
// implementation, rather than scattered `if` chains.
//
// This is why `x` can mean cross product, matrix multiply or elementwise multiply without
// any single operator implementation knowing about all three.

import type { Value, ValueKind } from './kind.ts';

export type BinaryOp = '+' | '-' | '*' | '/' | '^';

export type BinaryImpl = (a: Value, b: Value) => Value;

export function registerBinary(_op: BinaryOp, _left: ValueKind, _right: ValueKind, _impl: BinaryImpl): void {
  throw new Error('TODO: dispatch.registerBinary — not implemented in milestone 1');
}

export function lookupBinary(_op: BinaryOp, _left: ValueKind, _right: ValueKind): BinaryImpl | null {
  throw new Error('TODO: dispatch.lookupBinary — not implemented in milestone 1');
}

// Contraction and Einstein summation. Deliberately late — nothing depends on it yet.

import type { TensorValue } from './kind.ts';

export function contract(_a: TensorValue, _axisA: number, _axisB: number): TensorValue {
  throw new Error('TODO: tensor.contract — not implemented in milestone 1');
}

/** e.g. einsum('ij,jk->ik', a, b) */
export function einsum(_spec: string, ..._operands: readonly TensorValue[]): TensorValue {
  throw new Error('TODO: tensor.einsum — not implemented in milestone 1');
}

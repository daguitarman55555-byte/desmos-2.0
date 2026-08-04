import type { MatrixValue, VectorValue } from './kind.ts';

export function matmul(_a: MatrixValue, _b: MatrixValue): MatrixValue {
  throw new Error('TODO: matrix.matmul — not implemented in milestone 1');
}

export function transpose(_a: MatrixValue): MatrixValue {
  throw new Error('TODO: matrix.transpose — not implemented in milestone 1');
}

export function det(_a: MatrixValue): number {
  throw new Error('TODO: matrix.det — not implemented in milestone 1');
}

export function inverse(_a: MatrixValue): MatrixValue | null {
  throw new Error('TODO: matrix.inverse — not implemented in milestone 1');
}

export function rankOf(_a: MatrixValue): number {
  throw new Error('TODO: matrix.rankOf — not implemented in milestone 1');
}

export function apply(_a: MatrixValue, _v: VectorValue): VectorValue {
  throw new Error('TODO: matrix.apply — not implemented in milestone 1');
}

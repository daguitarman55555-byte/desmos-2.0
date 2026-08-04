// LU, QR, eigen, SVD, least squares (UPGRADES P3 item 17).

import type { MatrixValue, VectorValue } from '../types/kind.ts';

export function lu(_a: MatrixValue): { readonly l: MatrixValue; readonly u: MatrixValue; readonly p: readonly number[] } {
  throw new Error('TODO: linalg.lu — not implemented in milestone 1');
}

export function qr(_a: MatrixValue): { readonly q: MatrixValue; readonly r: MatrixValue } {
  throw new Error('TODO: linalg.qr — not implemented in milestone 1');
}

export function eigen(_a: MatrixValue): { readonly values: readonly number[]; readonly vectors: MatrixValue } {
  throw new Error('TODO: linalg.eigen — not implemented in milestone 1');
}

export function svd(_a: MatrixValue): { readonly u: MatrixValue; readonly s: readonly number[]; readonly v: MatrixValue } {
  throw new Error('TODO: linalg.svd — not implemented in milestone 1');
}

export function leastSquares(_a: MatrixValue, _b: VectorValue): VectorValue {
  throw new Error('TODO: linalg.leastSquares — not implemented in milestone 1');
}

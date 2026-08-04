// The single rank-n storage that backs vector, matrix, list and tensor alike.
// Flat data plus a shape, so a change of type is a reinterpretation rather than a copy.
//
// Streaming evaluation (UPGRADES P0 item 7) means this must never be the only option for
// large lists — the RAM ceiling on the target machine is 2-4 GB.

export interface NDArray {
  readonly shape: readonly number[];
  readonly data: Float64Array;
}

export function ndarray(_shape: readonly number[], _data?: Float64Array): NDArray {
  throw new Error('TODO: ndarray.ndarray — not implemented in milestone 1');
}

export function rank(_a: NDArray): number {
  throw new Error('TODO: ndarray.rank — not implemented in milestone 1');
}

export function reshape(_a: NDArray, _shape: readonly number[]): NDArray {
  throw new Error('TODO: ndarray.reshape — not implemented in milestone 1');
}

export function at(_a: NDArray, _index: readonly number[]): number {
  throw new Error('TODO: ndarray.at — not implemented in milestone 1');
}

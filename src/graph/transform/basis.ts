import type { Transform } from './Transform.ts';

/** Change of basis: plot in coordinates given by two (later n) arbitrary basis vectors. */
export function basisTransform(_e1: readonly [number, number], _e2: readonly [number, number]): Transform {
  throw new Error('TODO: basis.basisTransform — not implemented in milestone 1');
}

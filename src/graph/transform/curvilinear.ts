import type { Transform } from './Transform.ts';

/** Decision 2's endpoint: a user-supplied (u,v) -> (x,y) map, with a numeric inverse. */
export function curvilinearTransform(
  _forward: (u: number, v: number) => readonly [number, number],
  _inverse?: (x: number, y: number) => readonly [number, number],
): Transform {
  throw new Error('TODO: curvilinear.curvilinearTransform — not implemented in milestone 1');
}

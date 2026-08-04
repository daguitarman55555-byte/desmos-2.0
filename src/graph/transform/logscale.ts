import type { Transform } from './Transform.ts';

export type LogAxis = 'x' | 'y' | 'both';

export function logTransform(_axis: LogAxis, _base?: number): Transform {
  throw new Error('TODO: logscale.logTransform — not implemented in milestone 1');
}

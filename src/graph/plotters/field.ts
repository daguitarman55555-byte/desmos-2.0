import type { Polyline } from './explicit.ts';

export type FieldStyle = 'quiver' | 'stream' | 'slope';

/** UPGRADES P2 item 13 — first-class, not the 400-element list hack Desmos users resort to. */
export function plotField(_style: FieldStyle): readonly Polyline[] {
  throw new Error('TODO: field.plotField — not implemented in milestone 1');
}

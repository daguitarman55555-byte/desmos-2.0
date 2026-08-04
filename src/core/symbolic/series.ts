import type { Node } from '../lang/ast.ts';
import type { Traced } from './steps.ts';

export function taylor(_n: Node, _variable: string, _about: number, _order: number): Traced<Node> {
  throw new Error('TODO: series.taylor — not implemented in milestone 1');
}

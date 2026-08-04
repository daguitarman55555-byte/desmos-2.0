import type { Node } from '../lang/ast.ts';
import type { Traced } from './steps.ts';

export type Approach = 'both' | 'left' | 'right';

export function limit(_n: Node, _variable: string, _to: number, _from: Approach): Traced<Node> {
  throw new Error('TODO: limit.limit — not implemented in milestone 1');
}

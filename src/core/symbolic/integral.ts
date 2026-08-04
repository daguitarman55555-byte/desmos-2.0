import type { Node } from '../lang/ast.ts';
import type { Traced } from './steps.ts';

export function antiderivative(_n: Node, _withRespectTo: string): Traced<Node> | null {
  throw new Error('TODO: integral.antiderivative — not implemented in milestone 1');
}

// Rule-based symbolic differentiation, emitting a Step per rule application.
// Test target from the standing instructions: d/dx x^3 at x=2 is 12, stated as such.

import type { Node } from '../lang/ast.ts';
import type { Traced } from './steps.ts';

export function derivative(_n: Node, _withRespectTo: string): Traced<Node> {
  throw new Error('TODO: derivative.derivative — not implemented in milestone 1');
}

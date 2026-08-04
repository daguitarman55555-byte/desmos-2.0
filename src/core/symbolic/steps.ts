// Steps are the return type from day one, not a feature bolted on later. Every rule in
// derivative.ts, solve.ts and factor.ts emits Step records as it fires.
//
// CLAUDE.md: steps are rule-traced and deterministic. Never AI-generated.

import type { Node } from '../lang/ast.ts';

export interface Step {
  /** Stable identifier for the rule that fired, e.g. 'power-rule', 'chain-rule'. */
  readonly rule: string;
  /** Human-readable statement of the rule, for the steps panel. */
  readonly description: string;
  readonly before: Node;
  readonly after: Node;
  /** Sub-steps, when a rule is itself decomposed. */
  readonly children: readonly Step[];
}

/** A result paired with the trace that produced it. */
export interface Traced<T> {
  readonly result: T;
  readonly steps: readonly Step[];
}

export function step(_rule: string, _description: string, _before: Node, _after: Node, _children?: readonly Step[]): Step {
  throw new Error('TODO: steps.step — not implemented in milestone 1');
}

export function traced<T>(_result: T, _steps: readonly Step[]): Traced<T> {
  throw new Error('TODO: steps.traced — not implemented in milestone 1');
}

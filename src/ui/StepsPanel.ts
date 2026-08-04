// Rule-traced working, rendered from core/symbolic/steps.ts Step records.
// CLAUDE.md: never AI-generated.

import type { Step } from '../core/symbolic/steps.ts';

export interface StepsPanel {
  readonly el: HTMLElement;
  show(steps: readonly Step[]): void;
  clear(): void;
}

export function createStepsPanel(): StepsPanel {
  throw new Error('TODO: StepsPanel.createStepsPanel — not implemented in milestone 1');
}

// Drives whichever backend is selected. Callers ask for `compile`, not for a specific backend.

import { jsBackend } from './js-backend.ts';
import type { Backend, Compiled } from './backend.ts';
import type { Node } from '../lang/ast.ts';

let active: Backend = jsBackend;

export const activeBackend = (): Backend => active;

/** Swapping this is how the GLSL path arrives; nothing outside core/eval/ needs to know. */
export function setBackend(backend: Backend): void {
  active = backend;
}

export const compile = (node: Node): Compiled => active.compile(node);

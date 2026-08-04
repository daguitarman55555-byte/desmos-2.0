// The GPU path. Deferred (see docs/UPGRADES.md) — it pays off for implicits, inequality shading
// and domain colouring, and not much else, so it waits. This file exists so that when it lands
// it lands as an implementation of an interface that already exists.

import type { Backend, Compiled } from './backend.ts';
import type { Node } from '../lang/ast.ts';

/** Emit a GLSL expression for the node, for splicing into a fragment shader. */
export function toGLSL(_node: Node): string {
  throw new Error('TODO: glsl-backend.toGLSL — deferred, see docs/UPGRADES.md');
}

export const glslBackend: Backend = {
  name: 'glsl',
  compile(_node: Node): Compiled {
    throw new Error('TODO: glsl-backend.compile — deferred, see docs/UPGRADES.md');
  },
};

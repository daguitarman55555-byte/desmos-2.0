// Dependency graph and topological recompute order (UPGRADES P0 item 2).
//
// NOT WIRED IN. Milestone 1 changes no behaviour, and the prototype re-analysed every expression
// on every keystroke — which is correct, just wasteful, and its correctness partly relies on
// compiled closures resolving names late (see lang/scope.ts). Swapping in incremental recompute
// is a behaviour change and belongs to the milestone that can measure it.
//
// It is implemented and tested now because the shape of the graph determines what `store.ts` has
// to record, and discovering that later means changing the store.

export interface DependencyNode {
  readonly id: number;
  /** The name this expression binds, if any: `a` for `a = 5`, `f` for `f(x) = ...`. */
  readonly defines: string | null;
  /** Every free name the expression reads. */
  readonly uses: ReadonlySet<string>;
}

export interface DependencyGraph {
  /** Recompute order. Members of a cycle are omitted. */
  readonly order: readonly number[];
  /** Each cycle found, as the ids involved. These are the rows to flag. */
  readonly cycles: readonly (readonly number[])[];
  /** id -> ids that read something it defines. */
  readonly dependents: ReadonlyMap<number, readonly number[]>;
}

/**
 * Kahn's algorithm. Anything left with a non-zero in-degree at the end is in, or downstream of,
 * a cycle — `a = b + 1` with `b = a + 1` — and is reported rather than ordered.
 */
export function buildGraph(nodes: readonly DependencyNode[]): DependencyGraph {
  const definedBy = new Map<string, number>();
  for (const n of nodes) {
    // Last definition wins, matching the scope, which is a plain overwrite.
    if (n.defines !== null) definedBy.set(n.defines, n.id);
  }

  const dependents = new Map<number, number[]>();
  const inDegree = new Map<number, number>();
  for (const n of nodes) {
    dependents.set(n.id, []);
    inDegree.set(n.id, 0);
  }

  for (const n of nodes) {
    for (const name of n.uses) {
      const provider = definedBy.get(name);
      if (provider === undefined || provider === n.id) continue;
      (dependents.get(provider) as number[]).push(n.id);
      inDegree.set(n.id, (inDegree.get(n.id) as number) + 1);
    }
  }

  const queue: number[] = [];
  for (const n of nodes) if (inDegree.get(n.id) === 0) queue.push(n.id);

  const order: number[] = [];
  while (queue.length) {
    const id = queue.shift() as number;
    order.push(id);
    for (const next of dependents.get(id) as number[]) {
      const remaining = (inDegree.get(next) as number) - 1;
      inDegree.set(next, remaining);
      if (remaining === 0) queue.push(next);
    }
  }

  const stuck = nodes.filter((n) => (inDegree.get(n.id) as number) > 0).map((n) => n.id);
  const cycles = stuck.length ? [stuck] : [];

  return { order, cycles, dependents };
}

/** The set that must be recomputed when `changed` changes: itself plus everything downstream. */
export function dirtySubtree(graph: DependencyGraph, changed: Iterable<number>): Set<number> {
  const dirty = new Set<number>();
  const stack = [...changed];
  while (stack.length) {
    const id = stack.pop() as number;
    if (dirty.has(id)) continue;
    dirty.add(id);
    for (const next of graph.dependents.get(id) ?? []) stack.push(next);
  }
  return dirty;
}

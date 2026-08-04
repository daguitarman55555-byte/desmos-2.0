// Mutations and change notification.

import { COLOURS, createExpression, isBlank } from './document.ts';
import type { Expression } from './document.ts';
import { GRAPHED_KINDS, analyze } from '../core/lang/analyze.ts';
import type { Analysis } from '../core/lang/analyze.ts';
import { createScope } from '../core/lang/scope.ts';

export type Listener = () => void;

export class Store {
  expressions: Expression[] = [];
  readonly scope = createScope();
  readonly analyses = new Map<number, Analysis>();

  /** Position in the colour cycle. Never decremented — deleting a row does not free its colour. */
  private colourIndex = 0;
  private nextId = 1;

  dirty = false;

  private readonly listeners = new Set<Listener>();

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  markDirty(): void {
    if (!this.dirty) {
      this.dirty = true;
      this.emit();
    }
  }

  create(latex = ''): Expression {
    return createExpression(this.nextId++, latex);
  }

  analysisOf(id: number): Analysis | undefined {
    return this.analyses.get(id);
  }

  /** Desmos always keeps one empty row at the end for the next expression. */
  ensureTrailingBlank(): void {
    const last = this.expressions[this.expressions.length - 1];
    if (!last || !isBlank(last)) this.expressions.push(this.create());
  }

  /**
   * Re-analyse every expression, in order.
   *
   * Deliberately not incremental. `core/eval/deps.ts` has the graph needed to do better, but
   * switching to it is a behaviour change: definitions are registered into the scope as a side
   * effect of analysis, and re-running the whole list in order is what guarantees a definition
   * exists before anything that reads it is drawn.
   *
   * The scope is *not* cleared first. A variable stays bound until its row is removed, which is
   * what `remove()` handles explicitly.
   */
  recompute(): void {
    for (const e of this.expressions) {
      const analysis = analyze(e.latex, this.scope);
      this.analyses.set(e.id, analysis);

      if (analysis.value !== null) e.val = analysis.value;

      // A colour is claimed the moment an expression first becomes graphable, and never again.
      if (!e.colour && analysis.kind !== null && GRAPHED_KINDS.has(analysis.kind) && !analysis.error) {
        e.colour = COLOURS[this.colourIndex++ % COLOURS.length] as string;
      }
    }
  }

  setLatex(e: Expression, latex: string): void {
    e.latex = latex;
    this.markDirty();
    this.recompute();
  }

  insertAfter(e: Expression, latex = ''): Expression {
    const created = this.create(latex);
    this.expressions.splice(this.expressions.indexOf(e) + 1, 0, created);
    return created;
  }

  /** Insert just before the trailing blank row, which is where exported points land. */
  insertBeforeTrailingBlank(latex: string): Expression {
    const created = this.create(latex);
    this.expressions.splice(Math.max(0, this.expressions.length - 1), 0, created);
    return created;
  }

  append(latex = ''): Expression {
    const created = this.create(latex);
    this.expressions.push(created);
    return created;
  }

  /**
   * Remove a row, or clear it when it is the only one.
   *
   * Unbinding the variable here rather than in `recompute` is what makes deletion take effect:
   * nothing else ever removes a name from the scope.
   */
  remove(e: Expression): void {
    const analysis = this.analyses.get(e.id);
    if (analysis?.variableName) this.scope.vars.delete(analysis.variableName);
    if (analysis?.functionName) this.scope.funcs.delete(analysis.functionName);

    if (this.expressions.length === 1) {
      e.latex = '';
    } else {
      this.expressions.splice(this.expressions.indexOf(e), 1);
      this.analyses.delete(e.id);
    }

    this.markDirty();
    this.recompute();
  }

  /** Drag a slider: rewrite the row's latex to the new value and rebind the variable. */
  setSliderValue(e: Expression, value: number): void {
    const analysis = this.analyses.get(e.id);
    e.val = value;
    if (analysis?.sliderKind === 'var' && analysis.variableName) {
      this.scope.vars.set(analysis.variableName, value);
    }
    e.latex = `${analysis?.sliderLabel || 'a'}=${value}`;
    this.markDirty();
    this.recompute();
  }

  reset(expressions: Expression[]): void {
    this.expressions = expressions;
    this.analyses.clear();
    this.recompute();
  }
}

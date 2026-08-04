// The scrolling list of expression rows.
//
// Reconciliation is by identity, not by rebuilding: a row's DOM and its MathQuill field are
// expensive and, more importantly, stateful — MathQuill holds the caret. Recreating a row on
// every keystroke would drop the cursor mid-word.

import { createRow } from './ExpressionRow.ts';
import type { RowCallbacks, RowView } from './ExpressionRow.ts';
import type { Analysis } from '../core/lang/analyze.ts';
import type { Expression } from '../state/document.ts';

export interface ListCallbacks {
  /** Build the per-row callbacks for the given expression. */
  rowCallbacks(expression: Expression): RowCallbacks;
}

export interface ExpressionList {
  readonly element: HTMLElement;
  /** Reconcile against the current expressions and refresh every row. */
  render(
    expressions: readonly Expression[],
    analyses: ReadonlyMap<number, Analysis>,
    focusedId: number | null,
  ): void;
  rowFor(id: number): RowView | undefined;
  /** Drop every row — used when restoring a snapshot rebuilds the list wholesale. */
  clear(): void;
}

export function createExpressionList(callbacks: ListCallbacks, leftDirection: number): ExpressionList {
  const element = document.createElement('div');
  element.id = 'expr-list';

  const rows = new Map<number, RowView>();

  return {
    element,

    render(expressions, analyses, focusedId) {
      expressions.forEach((expression, i) => {
        let row = rows.get(expression.id);
        if (!row) {
          row = createRow(callbacks.rowCallbacks(expression), leftDirection);
          rows.set(expression.id, row);
        }
        // Insert only when out of position, so untouched rows are never moved.
        if (element.children[i] !== row.element) {
          element.insertBefore(row.element, element.children[i] ?? null);
        }
      });

      const live = new Set(expressions.map((e) => e.id));
      for (const [id, row] of rows) {
        if (!live.has(id)) {
          row.element.remove();
          rows.delete(id);
        }
      }

      expressions.forEach((expression, i) => {
        rows.get(expression.id)?.update(
          i,
          expression,
          analyses.get(expression.id),
          expression.id === focusedId,
        );
      });
    },

    rowFor(id) {
      return rows.get(id);
    },

    clear() {
      element.innerHTML = '';
      rows.clear();
    },
  };
}

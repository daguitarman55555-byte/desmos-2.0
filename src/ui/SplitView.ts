// Decision 10: one document, several graph panes. The document model already holds
// views[]; this is the layout that renders more than one of them.

export interface SplitView {
  readonly el: HTMLElement;
  setPaneCount(n: number): void;
}

export function createSplitView(): SplitView {
  throw new Error('TODO: SplitView.createSplitView — not implemented in milestone 1');
}

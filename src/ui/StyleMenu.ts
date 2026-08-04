// The long-press colour tray. Out of scope for milestone 1.

export interface StyleMenu {
  readonly el: HTMLElement;
  openFor(exprId: number, anchor: HTMLElement): void;
  close(): void;
}

export function createStyleMenu(): StyleMenu {
  throw new Error('TODO: StyleMenu.createStyleMenu — not implemented in milestone 1');
}

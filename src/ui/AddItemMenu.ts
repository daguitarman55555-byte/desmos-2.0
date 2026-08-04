// note / table / folder / image. Out of scope for milestone 1.

export interface AddItemMenu {
  readonly el: HTMLElement;
  openAt(anchor: HTMLElement): void;
  close(): void;
}

export function createAddItemMenu(): AddItemMenu {
  throw new Error('TODO: AddItemMenu.createAddItemMenu — not implemented in milestone 1');
}

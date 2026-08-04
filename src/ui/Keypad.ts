// The on-screen keypad. Out of scope for milestone 1 — the button exists and does nothing,
// exactly as in the prototype.

export interface Keypad {
  readonly el: HTMLElement;
  toggle(): void;
}

export function createKeypad(): Keypad {
  throw new Error('TODO: Keypad.createKeypad — not implemented in milestone 1');
}

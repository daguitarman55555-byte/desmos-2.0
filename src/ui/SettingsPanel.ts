// The wrench: axis labels, grid, angle mode, degree/radian. Out of scope for milestone 1.

export interface SettingsPanel {
  readonly el: HTMLElement;
  open(): void;
  close(): void;
}

export function createSettingsPanel(): SettingsPanel {
  throw new Error('TODO: SettingsPanel.createSettingsPanel — not implemented in milestone 1');
}

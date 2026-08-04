// The strip above the expression list: add, undo, redo, settings, collapse.

import { addIcon, collapseIcon, redoIcon, settingsIcon, undoIcon } from './icons.ts';

export interface ToolbarCallbacks {
  onAdd(): void;
  onUndo(): void;
  onRedo(): void;
  onCollapse(): void;
}

export interface Toolbar {
  readonly element: HTMLElement;
  /** Undo and redo are disabled at the ends of the history, which is their only state. */
  setHistoryState(canUndo: boolean, canRedo: boolean): void;
}

export function createToolbar(callbacks: ToolbarCallbacks): Toolbar {
  const element = document.createElement('div');
  element.id = 'panel-toolbar';
  element.innerHTML = `
    <button class="tool-btn" id="add-btn" title="Add Item">${addIcon}</button>
    <div class="tb-gap"></div>
    <button class="tool-btn" id="undo-btn" title="Undo" disabled>${undoIcon}</button>
    <button class="tool-btn" id="redo-btn" title="Redo" disabled>${redoIcon}</button>
    <div class="tb-gap"></div>
    <button class="tool-btn" id="settings-btn" title="Graph Settings">${settingsIcon}</button>
    <button class="tool-btn" id="collapse-btn" title="Hide Expressions List">${collapseIcon}</button>`;

  const undo = element.querySelector('#undo-btn') as HTMLButtonElement;
  const redo = element.querySelector('#redo-btn') as HTMLButtonElement;

  (element.querySelector('#add-btn') as HTMLButtonElement).onclick = callbacks.onAdd;
  undo.onclick = callbacks.onUndo;
  redo.onclick = callbacks.onRedo;
  (element.querySelector('#collapse-btn') as HTMLButtonElement).onclick = callbacks.onCollapse;
  // The wrench opens the settings panel, which milestone 1 does not build. Inert, as in the
  // prototype — see ui/SettingsPanel.ts.

  return {
    element,
    setHistoryState(canUndo, canRedo) {
      undo.disabled = !canUndo;
      redo.disabled = !canRedo;
    },
  };
}

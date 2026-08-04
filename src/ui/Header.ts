// The dark bar across the top.
//
// Everything here except the Save button is decorative, exactly as in the prototype: there is no
// account system, so Log In, Sign Up, Share, Help and Language are chrome. They are reproduced
// because milestone 1 is a visual replica and their absence would be visible.

import { desmosMarkIcon, helpIcon, languageIcon, openGraphIcon, shareIcon } from './icons.ts';

export interface Header {
  readonly element: HTMLElement;
  /** The Save button turns blue once the document has unsaved changes. */
  setDirty(dirty: boolean): void;
  setTitle(title: string): void;
}

export function createHeader(): Header {
  const element = document.createElement('header');
  element.id = 'topbar';
  element.innerHTML = `
    <div class="left">
      <button class="hdr-icon-btn" title="Open Graph">${openGraphIcon}</button>
      <div id="doc-divider"></div>
      <span id="doc-title">Untitled Graph</span>
      <button id="save-btn">Save</button>
    </div>
    <div id="wordmark">desmos</div>
    <div class="right">
      <button class="hdr-btn" id="login-btn">Log In</button>
      <button class="hdr-btn" id="signup-btn">Sign Up</button>
      <button class="hdr-icon-btn" title="Share Graph">${shareIcon}</button>
      <button class="hdr-icon-btn" title="Help">${helpIcon}</button>
      <button class="hdr-icon-btn" title="Language">${languageIcon}</button>
      <button class="hdr-icon-btn" title="Desmos">${desmosMarkIcon}</button>
    </div>`;

  const saveButton = element.querySelector('#save-btn') as HTMLButtonElement;
  const title = element.querySelector('#doc-title') as HTMLElement;

  return {
    element,
    setDirty(dirty) {
      saveButton.classList.toggle('dirty', dirty);
    },
    setTitle(value) {
      title.textContent = value;
    },
  };
}
